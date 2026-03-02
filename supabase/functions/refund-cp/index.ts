import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[refund-cp] ${step}${detailsStr}`);
};

/**
 * CP Refund Edge Function
 *
 * Two modes:
 *   1. Full refund  — refund_amount omitted or equals original consumption amount
 *   2. Partial refund — refund_amount < original consumption amount
 *
 * Refund restores CP as NEW ledger entries (activity type for bonus/activity,
 * paid type for paid CP), preserving original expiry dates.
 *
 * Currency value calculation:
 *   Only paid CP has currency value. The refundable amount is calculated from
 *   the stored unit_currency_value of each consumed paid CP ledger entry.
 *
 * The function returns the calculated currency refund amount so the caller
 * (e.g. super-admin or automated system) can process the monetary refund
 * through the appropriate payment channel.
 */

interface RefundRequest {
  user_id: string;
  transaction_id: string; // the consumption transaction to refund
  refund_amount?: number; // CP amount to refund (defaults to full refund)
  reason: string; // refund reason
  admin_id?: string; // admin who approved the refund
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
    const { user_id, transaction_id, refund_amount, reason, admin_id } =
      (await req.json()) as RefundRequest;

    if (!user_id || !transaction_id || !reason) {
      return new Response(
        JSON.stringify({ error: "user_id, transaction_id, and reason are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Start refund", { user_id, transaction_id, refund_amount, reason });

    // ---- 1. Look up original consumption transaction ----
    const { data: originalTxn, error: txnError } = await supabaseAdmin
      .from("cp_transactions")
      .select("*")
      .eq("id", transaction_id)
      .eq("user_id", user_id)
      .eq("transaction_type", "consumption")
      .single();

    if (txnError || !originalTxn) {
      return new Response(
        JSON.stringify({ error: "Consumption transaction not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    const consumedAmount = Math.abs(Number(originalTxn.amount));
    const cpToRefund = refund_amount ? Math.min(refund_amount, consumedAmount) : consumedAmount;
    const isFullRefund = cpToRefund >= consumedAmount;

    logStep("Original transaction found", {
      consumedAmount,
      cpToRefund,
      isFullRefund,
    });

    // ---- 2. Check for existing refunds on this transaction ----
    const { data: existingRefunds } = await supabaseAdmin
      .from("cp_transactions")
      .select("amount")
      .eq("user_id", user_id)
      .eq("transaction_type", "refund")
      .eq("metadata->>original_transaction_id", transaction_id);

    const alreadyRefunded = (existingRefunds || []).reduce(
      (sum, refundRecord) => sum + Math.abs(Number(refundRecord.amount)),
      0
    );

    const maxRefundable = consumedAmount - alreadyRefunded;
    if (cpToRefund > maxRefundable) {
      return new Response(
        JSON.stringify({
          error: "refund_exceeds_limit",
          max_refundable: maxRefundable,
          already_refunded: alreadyRefunded,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Refund eligibility verified", { alreadyRefunded, maxRefundable });

    // ---- 3. Parse deductions from original transaction metadata ----
    const metadata = originalTxn.metadata as Record<string, unknown>;
    const originalDeductions = (metadata?.deductions as Array<{
      ledger_id: string;
      cp_type: string;
      amount: number;
    }>) || [];

    // ---- 4. Proportional refund per deduction ----
    // If partial refund, distribute proportionally across deducted types
    const refundRatio = cpToRefund / consumedAmount;
    let refundedCurrencyValue = 0;
    let refundedPaid = 0;
    let refundedBonus = 0;
    let refundedActivity = 0;
    const now = new Date().toISOString();

    for (const deduction of originalDeductions) {
      const refundFromDeduction = isFullRefund
        ? deduction.amount
        : Math.round(deduction.amount * refundRatio * 100) / 100;

      if (refundFromDeduction <= 0) continue;

      // Look up original ledger entry for expiry and unit value
      const { data: originalLedger } = await supabaseAdmin
        .from("cp_ledger_entries")
        .select("*")
        .eq("id", deduction.ledger_id)
        .single();

      if (originalLedger) {
        // Restore remaining_amount on original ledger if still exists
        const currentRemaining = Number(originalLedger.remaining_amount);
        const newRemaining = currentRemaining + refundFromDeduction;

        const { error: restoreError } = await supabaseAdmin
          .from("cp_ledger_entries")
          .update({
            remaining_amount: newRemaining,
            status: "active",
          })
          .eq("id", originalLedger.id);

        if (restoreError) throw restoreError;

        // Calculate currency value for paid CP
        if (deduction.cp_type === "paid") {
          const unitValue = Number(originalLedger.unit_currency_value) || 0;
          refundedCurrencyValue += refundFromDeduction * unitValue;
        }

        logStep("Restored to ledger", {
          ledgerId: originalLedger.id,
          cpType: deduction.cp_type,
          restored: refundFromDeduction,
          newRemaining,
        });
      } else {
        // If original ledger was deleted or expired, create a new entry
        const expiresAt = new Date(
          Date.now() + 24 * 30 * 24 * 60 * 60 * 1000
        ).toISOString(); // 24 months

        const { error: newLedgerError } = await supabaseAdmin
          .from("cp_ledger_entries")
          .insert({
            user_id,
            cp_type: deduction.cp_type,
            original_amount: refundFromDeduction,
            remaining_amount: refundFromDeduction,
            unit_currency_value: 0,
            currency: "",
            source_description: `Refund: ${reason}`,
            acquired_at: now,
            expires_at: expiresAt,
            status: "active",
          });

        if (newLedgerError) throw newLedgerError;

        logStep("Created new ledger for refund", {
          cpType: deduction.cp_type,
          amount: refundFromDeduction,
        });
      }

      // Accumulate by type
      if (deduction.cp_type === "paid") refundedPaid += refundFromDeduction;
      else if (deduction.cp_type === "recharge_bonus") refundedBonus += refundFromDeduction;
      else refundedActivity += refundFromDeduction;
    }

    // ---- 5. Update wallet ----
    const { data: currentWallet, error: walletFetchError } = await supabaseAdmin
      .from("cp_wallets")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (walletFetchError || !currentWallet) throw walletFetchError || new Error("Wallet not found");

    const newBalancePaid = Number(currentWallet.balance_paid) + refundedPaid;
    const newBalanceBonus = Number(currentWallet.balance_recharge_bonus) + refundedBonus;
    const newBalanceActivity = Number(currentWallet.balance_activity) + refundedActivity;
    const newTotalBalance = newBalancePaid + newBalanceBonus + newBalanceActivity;

    const { error: walletUpdateError } = await supabaseAdmin
      .from("cp_wallets")
      .update({
        balance_paid: newBalancePaid,
        balance_recharge_bonus: newBalanceBonus,
        balance_activity: newBalanceActivity,
        total_balance: newTotalBalance,
      })
      .eq("id", currentWallet.id);

    if (walletUpdateError) throw walletUpdateError;

    logStep("Wallet updated", { newBalancePaid, newBalanceBonus, newBalanceActivity, newTotalBalance });

    // ---- 6. Record refund transaction ----
    const { error: refundTxnError } = await supabaseAdmin
      .from("cp_transactions")
      .insert({
        user_id,
        transaction_type: "refund",
        cp_type: "paid",
        amount: cpToRefund, // positive for refund (CP returned)
        balance_after: newTotalBalance,
        description: `Refund: ${reason}`,
        metadata: {
          original_transaction_id: transaction_id,
          refund_ratio: refundRatio,
          is_full_refund: isFullRefund,
          currency_refund: Math.round(refundedCurrencyValue * 100) / 100,
          admin_id: admin_id || null,
          refunded_by_type: {
            paid: refundedPaid,
            recharge_bonus: refundedBonus,
            activity: refundedActivity,
          },
        },
      });

    if (refundTxnError) throw refundTxnError;

    logStep("Refund transaction recorded", {
      cpRefunded: cpToRefund,
      currencyRefund: Math.round(refundedCurrencyValue * 100) / 100,
    });

    // ---- 7. Return result ----
    return new Response(
      JSON.stringify({
        success: true,
        refunded_cp: cpToRefund,
        is_full_refund: isFullRefund,
        currency_refund: Math.round(refundedCurrencyValue * 100) / 100,
        refunded_by_type: {
          paid: refundedPaid,
          recharge_bonus: refundedBonus,
          activity: refundedActivity,
        },
        wallet: {
          total_balance: newTotalBalance,
          balance_paid: newBalancePaid,
          balance_recharge_bonus: newBalanceBonus,
          balance_activity: newBalanceActivity,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in refund-cp", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
