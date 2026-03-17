import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[consume-cp] ${step}${detailsStr}`);
};

/**
 * CP Consumption Edge Function
 *
 * Deduction priority (FIFO within each type):
 *   1. activity CP      (free / gifted — no currency value)
 *   2. recharge_bonus CP (free bonus — no currency value)
 *   3. paid CP           (has currency value — used for refund calc)
 *
 * Within each CP type, oldest entries (by expires_at ASC) are consumed first.
 */

interface ConsumeRequest {
  user_id: string;
  amount: number; // total CP to deduct
  description: string; // human-readable reason
  service_type?: string; // e.g. "assessment", "course", "consultation"
  service_id?: string; // reference to the purchased service
}

interface LedgerDeduction {
  ledger_id: string;
  cp_type: string;
  deducted: number;
  unit_currency_value: number;
  currency: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { user_id, amount, description, service_type, service_id } =
      (await req.json()) as ConsumeRequest;

    if (!user_id || !amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "user_id and a positive amount are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Start consumption", { user_id, amount, description, service_type });

    // ---- 1. Verify wallet balance ----
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from("cp_wallets")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    if (walletError) throw walletError;
    if (!wallet || Number(wallet.total_balance) < amount) {
      return new Response(
        JSON.stringify({
          error: "insufficient_balance",
          available: wallet ? Number(wallet.total_balance) : 0,
          required: amount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Wallet verified", {
      total: wallet.total_balance,
      paid: wallet.balance_paid,
      bonus: wallet.balance_recharge_bonus,
      activity: wallet.balance_activity,
    });

    // ---- 2. Fetch active ledger entries, ordered for FIFO ----
    // Priority: activity → recharge_bonus → paid
    // Within each type: oldest expires_at first (FIFO)
    const { data: ledgerEntries, error: ledgerError } = await supabaseAdmin
      .from("cp_ledger_entries")
      .select("*")
      .eq("user_id", user_id)
      .eq("status", "active")
      .gt("remaining_amount", 0)
      .order("expires_at", { ascending: true });

    if (ledgerError) throw ledgerError;

    // Sort with priority: activity(0) → recharge_bonus(1) → paid(2), then by expires_at ASC
    const typePriority: Record<string, number> = {
      activity: 0,
      recharge_bonus: 1,
      paid: 2,
    };

    const sortedEntries = (ledgerEntries || []).sort((entryA, entryB) => {
      const priorityA = typePriority[entryA.cp_type] ?? 1;
      const priorityB = typePriority[entryB.cp_type] ?? 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      // Within same type, earliest expiry first
      return new Date(entryA.expires_at).getTime() - new Date(entryB.expires_at).getTime();
    });

    logStep("Ledger entries found", { count: sortedEntries.length });

    // ---- 3. FIFO deduction ----
    let remaining = amount;
    const deductions: LedgerDeduction[] = [];
    let totalCurrencyValue = 0; // sum of (deducted × unit_currency_value) for paid CP only

    for (const entry of sortedEntries) {
      if (remaining <= 0) break;

      const available = Number(entry.remaining_amount);
      const deductFromEntry = Math.min(remaining, available);
      const newRemaining = available - deductFromEntry;

      // Update ledger entry
      const updatePayload: Record<string, unknown> = {
        remaining_amount: newRemaining,
      };
      if (newRemaining <= 0) {
        updatePayload.status = "depleted";
      }

      const { error: updateError } = await supabaseAdmin
        .from("cp_ledger_entries")
        .update(updatePayload)
        .eq("id", entry.id);

      if (updateError) throw updateError;

      const unitValue = Number(entry.unit_currency_value) || 0;
      if (entry.cp_type === "paid") {
        totalCurrencyValue += deductFromEntry * unitValue;
      }

      deductions.push({
        ledger_id: entry.id,
        cp_type: entry.cp_type,
        deducted: deductFromEntry,
        unit_currency_value: unitValue,
        currency: entry.currency || "",
      });

      remaining -= deductFromEntry;

      logStep("Deducted from ledger", {
        ledgerId: entry.id,
        cpType: entry.cp_type,
        deducted: deductFromEntry,
        entryRemaining: newRemaining,
        status: newRemaining <= 0 ? "depleted" : "active",
      });
    }

    if (remaining > 0) {
      // This should not happen if we checked balance, but safety net
      return new Response(
        JSON.stringify({ error: "deduction_incomplete", undeducted: remaining }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // ---- 4. Update wallet balances ----
    // Calculate how much was deducted from each CP type
    const deductedByType: Record<string, number> = { paid: 0, recharge_bonus: 0, activity: 0 };
    for (const deduction of deductions) {
      deductedByType[deduction.cp_type] = (deductedByType[deduction.cp_type] || 0) + deduction.deducted;
    }

    const newBalancePaid = Number(wallet.balance_paid) - deductedByType.paid;
    const newBalanceBonus = Number(wallet.balance_recharge_bonus) - deductedByType.recharge_bonus;
    const newBalanceActivity = Number(wallet.balance_activity) - deductedByType.activity;
    const newTotalBalance = newBalancePaid + newBalanceBonus + newBalanceActivity;

    // total_balance is a generated column — do NOT include it in the update
    const { error: walletUpdateError } = await supabaseAdmin
      .from("cp_wallets")
      .update({
        balance_paid: newBalancePaid,
        balance_recharge_bonus: newBalanceBonus,
        balance_activity: newBalanceActivity,
      })
      .eq("id", wallet.id);

    if (walletUpdateError) throw walletUpdateError;

    logStep("Wallet updated", {
      newBalancePaid,
      newBalanceBonus,
      newBalanceActivity,
      newTotalBalance,
    });

    // ---- 5. Record transaction ----
    // Determine primary cp_type based on which type had the most deduction
    const primaryCpType = deductedByType.paid > 0 ? "paid" : deductedByType.recharge_bonus > 0 ? "recharge_bonus" : "activity";

    const { data: txnRecord, error: txnError } = await supabaseAdmin
      .from("cp_transactions")
      .insert({
        user_id,
        transaction_type: "consumption",
        cp_type: primaryCpType,
        amount: -amount, // negative for consumption
        balance_after: newTotalBalance,
        balance_after_paid: newBalancePaid,
        balance_after_bonus: newBalanceBonus,
        balance_after_activity: newBalanceActivity,
        paid_used: deductedByType.paid,
        bonus_used: deductedByType.recharge_bonus,
        activity_used: deductedByType.activity,
        description,
        metadata: {
          service_type: service_type || null,
          service_id: service_id || null,
          deductions: deductions.map((deduction) => ({
            ledger_id: deduction.ledger_id,
            cp_type: deduction.cp_type,
            amount: deduction.deducted,
          })),
          currency_value: totalCurrencyValue,
        },
      })
      .select("id")
      .single();

    if (txnError) throw txnError;

    logStep("Transaction recorded", { transactionId: txnRecord?.id, amount: -amount, balanceAfter: newTotalBalance });

    // ---- 6. Return result ----
    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: txnRecord?.id || null,
        consumed: amount,
        currency_value: Math.round(totalCurrencyValue * 100) / 100,
        wallet: {
          total_balance: newTotalBalance,
          balance_paid: newBalancePaid,
          balance_recharge_bonus: newBalanceBonus,
          balance_activity: newBalanceActivity,
        },
        deductions: deductions.map((deduction) => ({
          cp_type: deduction.cp_type,
          amount: deduction.deducted,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : (typeof error === "object" && error !== null && "message" in error)
        ? (error as { message: string }).message
        : JSON.stringify(error);
    logStep("ERROR in consume-cp", { message: errorMessage, raw: JSON.stringify(error) });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
