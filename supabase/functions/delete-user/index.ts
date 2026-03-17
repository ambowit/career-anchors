import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[delete-user] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error: missing service role key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      logStep("ERROR: Auth verification failed", { error: callerError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "认证失败，请重新登录 / Authentication failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check caller permissions
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role_type, organization_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || !["super_admin", "org_admin", "hr"].includes(callerProfile.role_type)) {
      logStep("ERROR: Insufficient permissions", { role: callerProfile?.role_type });
      return new Response(
        JSON.stringify({ success: false, error: "权限不足 / Insufficient permissions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: "userId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Prevent self-deletion
    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ success: false, error: "不能删除自己 / Cannot delete yourself" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // For org_admin/hr, verify the target user belongs to their organization
    if (callerProfile.role_type !== "super_admin") {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (!targetProfile || targetProfile.organization_id !== callerProfile.organization_id) {
        logStep("ERROR: Cross-org deletion blocked", { callerId: caller.id, targetId: userId });
        return new Response(
          JSON.stringify({ success: false, error: "只能删除本机构用户 / Can only delete users in your own organization" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    logStep("Deleting user", { userId, callerRole: callerProfile.role_type });

    // Step 0: SET NULL on all soft-reference FK fields to prevent FK constraint violations
    const nullifyOps = [
      adminClient.from("certifications").update({ issued_by: null }).eq("issued_by", userId),
      adminClient.from("certification_review_logs").update({ reviewer_id: null }).eq("reviewer_id", userId),
      adminClient.from("renewal_applications").update({ reviewer_id: null }).eq("reviewer_id", userId),
      adminClient.from("certification_applications").update({ reviewer_id: null }).eq("reviewer_id", userId),
      adminClient.from("report_versions").update({ created_by: null }).eq("created_by", userId),
      adminClient.from("anchor_text_blocks").update({ created_by: null }).eq("created_by", userId),
      adminClient.from("anchor_combination_mapping").update({ created_by: null }).eq("created_by", userId),
      adminClient.from("anchor_tri_mapping").update({ created_by: null }).eq("created_by", userId),
      adminClient.from("life_cards").update({ created_by: null, locked_by: null }).eq("created_by", userId),
      adminClient.from("life_cards").update({ locked_by: null }).eq("locked_by", userId),
      adminClient.from("life_card_text_blocks").update({ created_by: null }).eq("created_by", userId),
      adminClient.from("report_text_blocks").update({ created_by: null }).eq("created_by", userId),
      adminClient.from("generator_bindings").update({ bound_by: null }).eq("bound_by", userId),
      adminClient.from("career_stage_descriptions").update({ updated_by: null }).eq("updated_by", userId),
      adminClient.from("cdu_records").update({ reviewer_id: null }).eq("reviewer_id", userId),
      adminClient.from("cdu_course_catalog").update({ created_by: null }).eq("created_by", userId),
      adminClient.from("partner_products").update({ reviewer_id: null }).eq("reviewer_id", userId),
      adminClient.from("product_partners").update({ approved_by: null }).eq("approved_by", userId),
    ];
    const nullifyResults = await Promise.allSettled(nullifyOps);
    const nullifyFailures = nullifyResults.filter((r) => r.status === "rejected");
    if (nullifyFailures.length > 0) {
      logStep("WARNING: Some FK nullifications failed", { count: nullifyFailures.length });
    }

    // Step 1: Delete from profiles table
    const { error: profileDeleteError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      logStep("WARNING: Profile deletion failed", { error: profileDeleteError.message });
      // Continue to delete auth user anyway
    }

    // Step 2: Delete from auth.users (this is the critical step that was missing)
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      logStep("ERROR: Auth user deletion failed", { error: authDeleteError.message });
      return new Response(
        JSON.stringify({
          success: false,
          error: `认证记录删除失败: ${authDeleteError.message} / Auth record deletion failed`,
          profileDeleted: !profileDeleteError,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("User fully deleted", { userId });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("CRITICAL ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: `服务器错误: ${errorMessage}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
