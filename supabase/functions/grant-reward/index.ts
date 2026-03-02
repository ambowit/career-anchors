import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[grant-reward] ${step}${detailsStr}`);
};

interface GrantRewardRequest {
  referrer_id: string;
  referred_id?: string;
  reward_type: "consultation_completed" | "successful_referral" | "sale_achieved";
  description?: string;
  metadata?: Record<string, unknown>;
}

interface BatchGrantRequest {
  user_ids: string[];
  cp_amount: number;
  description: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const action = body.action || "grant_reward";

    // =================== Action: grant_reward ===================
    // Grant a reward based on reward_type (uses membership_rules for CP amount)
    if (action === "grant_reward") {
      const {
        referrer_id,
        referred_id,
        reward_type,
        description,
        metadata,
      } = body as GrantRewardRequest;

      if (!referrer_id || !reward_type) {
        return new Response(
          JSON.stringify({ error: "referrer_id and reward_type are required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      logStep("Grant reward", { referrer_id, reward_type });

      // Get reward CP amount from membership_rules
      const ruleKeyMap: Record<string, string> = {
        consultation_completed: "consultation_reward_cp",
        successful_referral: "referral_reward_cp",
        sale_achieved: "sale_reward_cp",
      };

      const ruleKey = ruleKeyMap[reward_type];
      const { data: rule, error: ruleError } = await supabase
        .from("membership_rules")
        .select("rule_value")
        .eq("rule_key", ruleKey)
        .single();

      if (ruleError || !rule) {
        logStep("Rule not found", { ruleKey, error: ruleError?.message });
        return new Response(
          JSON.stringify({ error: `Reward rule not found: ${ruleKey}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const cpAmount =
        typeof rule.rule_value === "object"
          ? (rule.rule_value as Record<string, number>).amount
          : JSON.parse(rule.rule_value).amount;

      if (!cpAmount || cpAmount <= 0) {
        return new Response(
          JSON.stringify({ error: "Invalid reward CP amount in rules" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      logStep("Reward CP amount", { cpAmount, ruleKey });

      // Build description text
      const rewardDescriptions: Record<string, string> = {
        consultation_completed: "Consultation completion reward",
        successful_referral: "Referral reward",
        sale_achieved: "Sale achievement reward",
      };
      const descriptionText =
        description || rewardDescriptions[reward_type] || reward_type;

      // Call grant_activity_cp DB function
      const { data: grantResult, error: grantError } = await supabase.rpc(
        "grant_activity_cp",
        {
          p_user_id: referrer_id,
          p_amount: cpAmount,
          p_description: descriptionText,
          p_transaction_type: "activity_grant",
        }
      );

      if (grantError) {
        logStep("Grant activity CP error", { error: grantError.message });
        return new Response(
          JSON.stringify({ error: grantError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      logStep("Activity CP granted", grantResult);

      // Record in referral_rewards
      const { error: rewardError } = await supabase
        .from("referral_rewards")
        .insert({
          referrer_id,
          referred_id: referred_id || null,
          reward_type,
          cp_amount: cpAmount,
          status: "granted",
          granted_at: new Date().toISOString(),
          ledger_entry_id: grantResult?.ledger_entry_id || null,
          description: descriptionText,
          metadata: metadata || {},
        });

      if (rewardError) {
        logStep("Record reward error", { error: rewardError.message });
        // CP already granted, log but don't fail
      }

      return new Response(
        JSON.stringify({
          success: true,
          cp_amount: cpAmount,
          reward_type,
          balance_after: grantResult?.balance_after,
          ledger_entry_id: grantResult?.ledger_entry_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // =================== Action: batch_grant ===================
    // Admin batch grant activity CP to multiple users
    if (action === "batch_grant") {
      const { user_ids, cp_amount, description } = body as BatchGrantRequest;

      if (!user_ids || user_ids.length === 0 || !cp_amount || cp_amount <= 0) {
        return new Response(
          JSON.stringify({ error: "user_ids, cp_amount (>0) are required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      logStep("Batch grant", { userCount: user_ids.length, cpAmount: cp_amount });

      const results: Array<{
        user_id: string;
        success: boolean;
        error?: string;
      }> = [];

      for (const userId of user_ids) {
        const { data: grantResult, error: grantError } = await supabase.rpc(
          "grant_activity_cp",
          {
            p_user_id: userId,
            p_amount: cp_amount,
            p_description: description || "Admin batch grant",
            p_transaction_type: "activity_grant",
          }
        );

        if (grantError) {
          results.push({ user_id: userId, success: false, error: grantError.message });
        } else {
          results.push({ user_id: userId, success: true });
          // Record as referral reward (type: sale_achieved for admin grants)
          await supabase.from("referral_rewards").insert({
            referrer_id: userId,
            reward_type: "sale_achieved",
            cp_amount,
            status: "granted",
            granted_at: new Date().toISOString(),
            ledger_entry_id: grantResult?.ledger_entry_id || null,
            description: description || "Admin batch grant",
            metadata: { batch: true },
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      logStep("Batch grant complete", { successCount, totalCount: user_ids.length });

      return new Response(
        JSON.stringify({
          success: true,
          total: user_ids.length,
          succeeded: successCount,
          failed: user_ids.length - successCount,
          results,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // =================== Action: cancel_reward ===================
    // Cancel a pending reward
    if (action === "cancel_reward") {
      const { reward_id } = body;

      if (!reward_id) {
        return new Response(
          JSON.stringify({ error: "reward_id is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const { error: cancelError } = await supabase
        .from("referral_rewards")
        .update({ status: "cancelled" })
        .eq("id", reward_id)
        .eq("status", "pending");

      if (cancelError) {
        return new Response(
          JSON.stringify({ error: cancelError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Reward cancelled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in grant-reward", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
