import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[process-recharge] ${step}${detailsStr}`);
};

/** Safely extract a human-readable error message from any thrown value. */
function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const asRecord = error as Record<string, unknown>;
    if (typeof asRecord.message === "string") return asRecord.message;
    if (typeof asRecord.details === "string") return asRecord.details;
    if (typeof asRecord.hint === "string") return asRecord.hint;
    return JSON.stringify(error);
  }
  return String(error);
}

interface RechargeRequest {
  user_id: string;
  package_id: string;
  payment_method?: string;
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
    const { user_id, package_id, payment_method = "platform" } =
      (await req.json()) as RechargeRequest;

    if (!user_id || !package_id) {
      return new Response(
        JSON.stringify({ error: "user_id and package_id are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Starting recharge", { user_id, package_id, payment_method });

    // 1. Fetch recharge package
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from("recharge_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .single();

    if (pkgError || !pkg) {
      logStep("Package not found or inactive", { pkgError });
      return new Response(
        JSON.stringify({ error: "Package not found or inactive" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    logStep("Package found", { name: pkg.package_name_en, cp: pkg.cp_amount, bonus: pkg.bonus_cp_amount });

    // 2. Fetch user's current membership for discount
    const { data: membership } = await supabaseAdmin
      .from("user_memberships")
      .select("*, current_tier:membership_tiers!user_memberships_current_tier_id_fkey(*)")
      .eq("user_id", user_id)
      .maybeSingle();

    const discountRate = membership?.current_tier?.discount_rate
      ? Number(membership.current_tier.discount_rate)
      : 1.0;

    const finalPrice = Number(pkg.price_amount) * discountRate;

    logStep("Discount applied", { discountRate, originalPrice: pkg.price_amount, finalPrice });

    // 3. Create recharge order
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(); // ~24 months

    const { data: order, error: orderError } = await supabaseAdmin
      .from("recharge_orders")
      .insert({
        user_id,
        package_id,
        price_amount: finalPrice,
        currency: pkg.currency,
        cp_amount: pkg.cp_amount,
        bonus_cp_amount: pkg.bonus_cp_amount,
        payment_method,
        payment_status: "completed",
        payment_reference: `RCH-${Date.now()}`,
        completed_at: now,
      })
      .select()
      .single();

    if (orderError) {
      logStep("Order creation failed", { error: extractErrorMessage(orderError) });
      throw orderError;
    }

    logStep("Order created", { orderId: order.id });

    // 4. Create ledger entry for paid CP
    const unitCurrencyValue =
      pkg.cp_amount > 0 ? finalPrice / pkg.cp_amount : 0;

    const { data: paidLedger, error: paidLedgerError } = await supabaseAdmin
      .from("cp_ledger_entries")
      .insert({
        user_id,
        cp_type: "paid",
        original_amount: pkg.cp_amount,
        remaining_amount: pkg.cp_amount,
        unit_currency_value: unitCurrencyValue,
        currency: pkg.currency,
        source_order_id: order.id,
        source_description: `Recharge: ${pkg.package_name_en}`,
        acquired_at: now,
        expires_at: expiresAt,
        status: "active",
      })
      .select()
      .single();

    if (paidLedgerError) {
      logStep("Paid ledger creation failed", { error: extractErrorMessage(paidLedgerError) });
      throw paidLedgerError;
    }

    logStep("Paid ledger created", { ledgerId: paidLedger.id, amount: pkg.cp_amount });

    // 5. Create ledger entry for bonus CP (if any)
    let bonusLedger: Record<string, unknown> | null = null;
    if (pkg.bonus_cp_amount > 0) {
      const { data: bonusLedgerData, error: bonusLedgerError } = await supabaseAdmin
        .from("cp_ledger_entries")
        .insert({
          user_id,
          cp_type: "recharge_bonus",
          original_amount: pkg.bonus_cp_amount,
          remaining_amount: pkg.bonus_cp_amount,
          unit_currency_value: 0,
          currency: pkg.currency,
          source_order_id: order.id,
          source_description: `Recharge Bonus: ${pkg.package_name_en}`,
          acquired_at: now,
          expires_at: expiresAt,
          status: "active",
        })
        .select()
        .single();

      if (bonusLedgerError) {
        logStep("Bonus ledger creation failed", { error: extractErrorMessage(bonusLedgerError) });
        throw bonusLedgerError;
      }
      bonusLedger = bonusLedgerData;
      logStep("Bonus ledger created", { ledgerId: bonusLedger.id, amount: pkg.bonus_cp_amount });
    }

    // 6. Ensure cp_wallets row exists (upsert pattern)
    const { data: existingWallet } = await supabaseAdmin
      .from("cp_wallets")
      .select("*")
      .eq("user_id", user_id)
      .maybeSingle();

    let wallet: Record<string, unknown>;
    const cpAmount = Number(pkg.cp_amount);
    const bonusCpAmount = Number(pkg.bonus_cp_amount);

    if (!existingWallet) {
      const newBalancePaid = cpAmount;
      const newBalanceBonus = bonusCpAmount;
      const newBalanceActivity = 0;
      const newTotal = newBalancePaid + newBalanceBonus + newBalanceActivity;

      const { data: newWallet, error: walletCreateError } = await supabaseAdmin
        .from("cp_wallets")
        .insert({
          user_id,
          balance_paid: newBalancePaid,
          balance_recharge_bonus: newBalanceBonus,
          balance_activity: newBalanceActivity,
          lifetime_recharged: finalPrice,
        })
        .select()
        .single();

      if (walletCreateError) {
        logStep("Wallet creation failed", { error: extractErrorMessage(walletCreateError) });
        throw walletCreateError;
      }
      wallet = newWallet;
      logStep("Wallet created", { walletId: wallet.id, totalBalance: newTotal });
    } else {
      const newBalancePaid = Number(existingWallet.balance_paid) + cpAmount;
      const newBalanceBonus = Number(existingWallet.balance_recharge_bonus) + bonusCpAmount;
      const newBalanceActivity = Number(existingWallet.balance_activity);
      const newTotal = newBalancePaid + newBalanceBonus + newBalanceActivity;
      const newLifetimeRecharged = Number(existingWallet.lifetime_recharged) + finalPrice;

      const { data: updatedWallet, error: walletUpdateError } = await supabaseAdmin
        .from("cp_wallets")
        .update({
          balance_paid: newBalancePaid,
          balance_recharge_bonus: newBalanceBonus,
          lifetime_recharged: newLifetimeRecharged,
        })
        .eq("id", existingWallet.id)
        .select()
        .single();

      if (walletUpdateError) {
        logStep("Wallet update failed", { error: extractErrorMessage(walletUpdateError) });
        throw walletUpdateError;
      }
      wallet = updatedWallet;
      logStep("Wallet updated", { newTotal, newLifetimeRecharged });
    }

    // 7. Create transaction records with full balance snapshots
    const walletBalancePaid = Number(wallet.balance_paid);
    const walletBalanceBonus = Number(wallet.balance_recharge_bonus);
    const walletBalanceActivity = Number(wallet.balance_activity);
    const walletTotalBalance = Number(wallet.total_balance);

    const paidTxnData = {
      user_id,
      transaction_type: "recharge",
      cp_type: "paid",
      amount: cpAmount,
      balance_after: walletTotalBalance,
      balance_after_paid: walletBalancePaid,
      balance_after_bonus: walletBalanceBonus,
      balance_after_activity: walletBalanceActivity,
      paid_used: 0,
      bonus_used: 0,
      activity_used: 0,
      related_order_id: order.id,
      related_ledger_id: paidLedger.id,
      description: `Recharge: ${pkg.package_name_en} (+${cpAmount} CP)`,
      metadata: { package_id, price: finalPrice, currency: pkg.currency },
    };

    const { error: paidTxnError } = await supabaseAdmin.from("cp_transactions").insert(paidTxnData);
    if (paidTxnError) {
      logStep("Paid transaction insert failed", { error: extractErrorMessage(paidTxnError) });
      // Non-fatal: wallet and ledger already created successfully
    }

    if (bonusLedger) {
      const bonusTxnData = {
        user_id,
        transaction_type: "recharge_bonus",
        cp_type: "recharge_bonus",
        amount: bonusCpAmount,
        balance_after: walletTotalBalance,
        balance_after_paid: walletBalancePaid,
        balance_after_bonus: walletBalanceBonus,
        balance_after_activity: walletBalanceActivity,
        paid_used: 0,
        bonus_used: 0,
        activity_used: 0,
        related_order_id: order.id,
        related_ledger_id: bonusLedger.id as string,
        description: `Recharge Bonus: ${pkg.package_name_en} (+${bonusCpAmount} CP)`,
        metadata: { package_id },
      };
      const { error: bonusTxnError } = await supabaseAdmin.from("cp_transactions").insert(bonusTxnData);
      if (bonusTxnError) {
        logStep("Bonus transaction insert failed", { error: extractErrorMessage(bonusTxnError) });
      }
    }

    logStep("Transactions recorded");

    // 8. Update membership rolling 12-month total
    if (membership) {
      const newRollingTotal = Number(membership.rolling_12m_recharge_total) + finalPrice;
      await supabaseAdmin
        .from("user_memberships")
        .update({ rolling_12m_recharge_total: newRollingTotal })
        .eq("id", membership.id);

      logStep("Membership rolling total updated", { newRollingTotal });

      // 9. Check for tier upgrade
      const { data: allTiers } = await supabaseAdmin
        .from("membership_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: false });

      if (allTiers) {
        for (const tier of allTiers) {
          const meetsThreshold = newRollingTotal >= Number(tier.recharge_threshold_12m);
          const meetsSingle =
            !tier.single_recharge_threshold || finalPrice >= Number(tier.single_recharge_threshold);
          if (meetsThreshold && meetsSingle && tier.sort_order > (membership.current_tier?.sort_order ?? 0)) {
            await supabaseAdmin
              .from("user_memberships")
              .update({
                current_tier_id: tier.id,
                previous_tier_id: membership.current_tier_id,
                tier_achieved_at: now,
                has_purchase_history: true,
              })
              .eq("id", membership.id);
            logStep("Tier upgraded!", { from: membership.current_tier?.tier_code, to: tier.tier_code });
            break;
          }
        }
      }
    } else {
      // First purchase — create membership
      const { data: defaultTier } = await supabaseAdmin
        .from("membership_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .single();

      // Find appropriate tier based on recharge amount
      const { data: allTiers } = await supabaseAdmin
        .from("membership_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: false });

      let assignedTier = defaultTier;
      if (allTiers) {
        for (const tier of allTiers) {
          const meetsThreshold = finalPrice >= Number(tier.recharge_threshold_12m);
          const meetsSingle =
            !tier.single_recharge_threshold || finalPrice >= Number(tier.single_recharge_threshold);
          if (meetsThreshold && meetsSingle) {
            assignedTier = tier;
            break;
          }
        }
      }

      if (assignedTier) {
        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setFullYear(nextYear.getFullYear() + 1);

        const { error: membershipCreateError } = await supabaseAdmin
          .from("user_memberships")
          .insert({
            user_id,
            current_tier_id: assignedTier.id,
            tier_achieved_at: now,
            has_purchase_history: true,
            rolling_12m_recharge_total: finalPrice,
            rolling_12m_start_date: today.toISOString().split("T")[0],
            next_evaluation_date: nextYear.toISOString().split("T")[0],
          });

        if (membershipCreateError) {
          logStep("Membership creation failed (non-fatal)", { error: extractErrorMessage(membershipCreateError) });
        } else {
          logStep("First membership created", { tier: assignedTier.tier_code });
        }
      }
    }

    logStep("Recharge completed successfully", { orderId: order.id });

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          cp_amount: cpAmount,
          bonus_cp_amount: bonusCpAmount,
          total_cp: cpAmount + bonusCpAmount,
          price_paid: finalPrice,
          currency: pkg.currency,
          payment_reference: order.payment_reference,
        },
        wallet: {
          total_balance: walletTotalBalance,
          balance_paid: walletBalancePaid,
          balance_recharge_bonus: walletBalanceBonus,
          balance_activity: walletBalanceActivity,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = extractErrorMessage(error);
    logStep("ERROR in process-recharge", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
