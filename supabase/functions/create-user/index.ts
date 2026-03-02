import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[create-user] ${step}${detailsStr}`);
};

interface CreateUserRequest {
  email: string;
  password?: string;
  full_name: string;
  role_type: string;
  organization_id?: string | null;
  department_id?: string | null;
  phone?: string;
}

interface BatchCreateRequest {
  users: CreateUserRequest[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is a super_admin, org_admin, or hr
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      logStep("ERROR: Missing authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!serviceRoleKey) {
      logStep("ERROR: SUPABASE_SERVICE_ROLE_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error: missing service role key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Verify caller with anon client
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
    if (callerError || !caller) {
      logStep("ERROR: Auth verification failed", { error: callerError?.message });
      return new Response(
        JSON.stringify({ success: false, error: "认证失败，请重新登录 / Authentication failed, please re-login" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check caller role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerProfile, error: profileFetchError } = await adminClient
      .from("profiles")
      .select("role_type, organization_id")
      .eq("id", caller.id)
      .single();

    if (profileFetchError) {
      logStep("ERROR: Could not fetch caller profile", { error: profileFetchError.message });
      return new Response(
        JSON.stringify({ success: false, error: "无法获取用户信息 / Could not fetch user profile" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (!callerProfile || !["super_admin", "org_admin", "hr"].includes(callerProfile.role_type)) {
      logStep("ERROR: Insufficient permissions", { role: callerProfile?.role_type });
      return new Response(
        JSON.stringify({ success: false, error: "权限不足 / Insufficient permissions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const body = await req.json();
    logStep("Request body received", { callerRole: callerProfile.role_type, callerOrg: callerProfile.organization_id });

    // Check if batch or single
    const isBatch = Array.isArray(body.users);
    const usersToCreate: CreateUserRequest[] = isBatch ? body.users : [body];

    logStep("Creating users", { count: usersToCreate.length });

    // For org_admin/hr, enforce that they can only create users in their own org
    if (callerProfile.role_type !== "super_admin") {
      for (const userInput of usersToCreate) {
        // If org_admin/hr didn't specify org, use their own
        if (!userInput.organization_id) {
          userInput.organization_id = callerProfile.organization_id;
        }
        // If org_admin/hr tries to create in a different org, block it
        if (userInput.organization_id !== callerProfile.organization_id) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "只能在本机构中创建用户 / Can only create users in your own organization",
              created: 0,
              failed: usersToCreate.length,
              results: usersToCreate.map((u) => ({
                email: u.email,
                success: false,
                error: "组织不匹配 / Organization mismatch",
              })),
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
          );
        }
      }
    }

    // ─── Seat limit check ───
    const orgUserCounts = new Map<string, number>();
    for (const userInput of usersToCreate) {
      if (userInput.organization_id) {
        orgUserCounts.set(
          userInput.organization_id,
          (orgUserCounts.get(userInput.organization_id) || 0) + 1
        );
      }
    }

    const seatCheckErrors = new Map<string, { maxSeats: number; currentUsers: number; orgName: string }>();

    for (const [orgId, newUserCount] of orgUserCounts.entries()) {
      const { data: orgData } = await adminClient
        .from("organizations")
        .select("max_seats, name")
        .eq("id", orgId)
        .single();

      if (!orgData) {
        logStep("WARNING: Organization not found", { orgId });
        continue;
      }

      const { count: existingUserCount } = await adminClient
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .neq("status", "deactivated");

      const currentUsers = existingUserCount || 0;
      const maxSeats = orgData.max_seats || 0;

      if (currentUsers + newUserCount > maxSeats) {
        seatCheckErrors.set(orgId, { maxSeats, currentUsers, orgName: orgData.name || orgId });
      }
    }

    if (seatCheckErrors.size > 0) {
      const errorDetails = Array.from(seatCheckErrors.entries()).map(([orgId, info]) => ({
        organization_id: orgId,
        organization_name: info.orgName,
        max_seats: info.maxSeats,
        current_users: info.currentUsers,
        remaining_seats: Math.max(0, info.maxSeats - info.currentUsers),
      }));

      const firstError = errorDetails[0];
      const remainingSeats = firstError.remaining_seats;

      return new Response(
        JSON.stringify({
          success: false,
          error: "seat_limit_exceeded",
          message: `席位不足：机构「${firstError.organization_name}」最大席位 ${firstError.max_seats}，当前已有 ${firstError.current_users} 个用户，剩余 ${remainingSeats} 个席位。请购买更多席位后再试。`,
          message_en: `Seat limit exceeded: Organization "${firstError.organization_name}" has ${firstError.max_seats} max seats, currently ${firstError.current_users} users, ${remainingSeats} remaining. Please purchase more seats.`,
          seat_details: errorDetails,
          created: 0,
          failed: usersToCreate.length,
          results: usersToCreate.map((u) => ({
            email: u.email,
            success: false,
            error: "席位不足 / Seat limit exceeded",
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ─── Create users ───
    const results: Array<{ email: string; success: boolean; error?: string; userId?: string }> = [];

    for (const userInput of usersToCreate) {
      const { email, full_name, role_type, organization_id, department_id, phone } = userInput;
      const password = userInput.password || "scpc2026";

      if (!email || !full_name) {
        results.push({ email: email || "unknown", success: false, error: "邮箱和姓名为必填项 / Email and name are required" });
        continue;
      }

      try {
        logStep("Creating auth user", { email, role_type, organization_id });

        // Create auth user with admin API
        // The handle_new_user trigger will create a basic profile row
        const { data: authUser, error: authError } =
          await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role_type },
          });

        if (authError) {
          logStep("Auth user creation failed", { email, error: authError.message });
          // Translate common errors
          let errorMsg = authError.message;
          if (errorMsg.includes("already been registered") || errorMsg.includes("already exists")) {
            errorMsg = "该邮箱已被注册 / Email already registered";
          }
          results.push({ email, success: false, error: errorMsg });
          continue;
        }

        const userId = authUser.user.id;
        logStep("Auth user created", { email, userId });

        // Determine role (admin vs user)
        const isAdminRole = ["super_admin", "org_admin", "hr", "department_manager"].includes(role_type);

        // Wait briefly for the trigger to complete, then UPDATE the profile
        // The trigger creates a basic profile; we need to update it with full data
        // Using UPDATE instead of UPSERT for more reliable behavior
        const profileData = {
          email,
          full_name,
          role: isAdminRole ? "admin" : "user",
          role_type,
          organization_id: organization_id || null,
          department_id: department_id || null,
          phone: phone || "",
          avatar_url: "",
          status: "active",
          updated_at: new Date().toISOString(),
        };

        // First try UPDATE (profile should exist from trigger)
        const { data: updatedProfile, error: updateError } = await adminClient
          .from("profiles")
          .update(profileData)
          .eq("id", userId)
          .select("id")
          .single();

        if (updateError || !updatedProfile) {
          logStep("Update failed, trying upsert", { email, error: updateError?.message });
          // Fallback to upsert if UPDATE fails (trigger might not have fired)
          const { error: upsertError } = await adminClient.from("profiles").upsert({
            id: userId,
            ...profileData,
          });

          if (upsertError) {
            logStep("Profile upsert also failed", { email, error: upsertError.message });
            results.push({ email, success: false, error: `用户创建成功但资料更新失败: ${upsertError.message}`, userId });
            continue;
          }
        }

        logStep("User created successfully", { email, userId, role_type, organization_id });
        results.push({ email, success: true, userId });
      } catch (innerError) {
        const errorMessage = innerError instanceof Error ? innerError.message : String(innerError);
        logStep("Unexpected error creating user", { email, error: errorMessage });
        results.push({ email, success: false, error: errorMessage });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    logStep("Batch complete", { successCount, failCount });

    return new Response(
      JSON.stringify({
        success: failCount === 0,
        created: successCount,
        failed: failCount,
        results,
      }),
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
