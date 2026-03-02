import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[admin-reset-password] ${step}${detailsStr}`);
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
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      logStep("Auth verification failed", { error: callerError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "认证失败 / Authentication failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check caller role — only super_admin and org_admin can reset passwords
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role_type, organization_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || !["super_admin", "org_admin"].includes(callerProfile.role_type)) {
      logStep("Insufficient permissions", { role: callerProfile?.role_type });
      return new Response(
        JSON.stringify({ success: false, error: "权限不足，仅超级管理员和机构管理员可重置密码 / Insufficient permissions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const { user_id, new_password } = await req.json();

    if (!user_id || !new_password) {
      return new Response(
        JSON.stringify({ success: false, error: "用户ID和新密码为必填项 / User ID and new password are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: "密码长度至少6位 / Password must be at least 6 characters" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // For org_admin, verify target user belongs to their organization
    if (callerProfile.role_type === "org_admin") {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("organization_id")
        .eq("id", user_id)
        .single();

      if (!targetProfile || targetProfile.organization_id !== callerProfile.organization_id) {
        logStep("Org admin tried to reset password for user outside org", { targetOrg: targetProfile?.organization_id, callerOrg: callerProfile.organization_id });
        return new Response(
          JSON.stringify({ success: false, error: "只能重置本机构用户的密码 / Can only reset passwords for users in your organization" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Reset the password using admin API
    logStep("Resetting password", { userId: user_id, callerRole: callerProfile.role_type });

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) {
      logStep("Password reset failed", { error: updateError.message });
      return new Response(
        JSON.stringify({ success: false, error: `密码重置失败: ${updateError.message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Password reset successful", { userId: user_id });
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
