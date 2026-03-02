import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";

// ─── Super Admin: Organizations ───
export function useOrganizations() {
  return useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useOrganizationsWithCounts() {
  return useQuery({
    queryKey: ["admin", "organizations-with-counts"],
    queryFn: async () => {
      const { data: orgs, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (orgError) throw orgError;

      const orgIds = orgs.map((o) => o.id);
      if (orgIds.length === 0) return [];

      // Get user counts per org
      const { data: userCounts, error: ucError } = await supabase
        .from("profiles")
        .select("organization_id")
        .in("organization_id", orgIds);
      if (ucError) throw ucError;

      // Get assessment counts per org
      const { data: assessmentCounts, error: acError } = await supabase
        .from("assessment_results")
        .select("organization_id")
        .in("organization_id", orgIds);
      if (acError) throw acError;

      // Get SSO status per org
      const { data: ssoConfigs, error: ssoError } = await supabase
        .from("sso_configurations")
        .select("organization_id, is_active")
        .in("organization_id", orgIds);
      if (ssoError) throw ssoError;

      const userCountMap = new Map<string, number>();
      userCounts.forEach((profile) => {
        if (profile.organization_id) {
          userCountMap.set(profile.organization_id, (userCountMap.get(profile.organization_id) || 0) + 1);
        }
      });

      const assessmentCountMap = new Map<string, number>();
      assessmentCounts.forEach((result) => {
        if (result.organization_id) {
          assessmentCountMap.set(result.organization_id, (assessmentCountMap.get(result.organization_id) || 0) + 1);
        }
      });

      const ssoMap = new Map<string, boolean>();
      ssoConfigs.forEach((sso) => {
        if (sso.is_active) ssoMap.set(sso.organization_id, true);
      });

      return orgs.map((org) => ({
        ...org,
        userCount: userCountMap.get(org.id) || 0,
        assessmentCount: assessmentCountMap.get(org.id) || 0,
        ssoEnabled: ssoMap.has(org.id),
      }));
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; domain: string; plan_type: string; max_seats: number }) => {
      const { data, error } = await supabase
        .from("organizations")
        .insert({
          name: input.name,
          domain: input.domain,
          plan_type: input.plan_type,
          max_seats: input.max_seats,
          status: "active",
          logo_url: "",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });
}

// ─── Super Admin: All Users ───
export function useAllProfiles() {
  return useQuery({
    queryKey: ["admin", "all-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role_type, organization_id, status, last_login_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllProfilesWithOrgs() {
  return useQuery({
    queryKey: ["admin", "all-profiles-with-orgs"],
    queryFn: async () => {
      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role_type, organization_id, department_id, status, last_login_at, created_at, additional_roles")
        .order("created_at", { ascending: false });
      if (profError) throw profError;

      const orgIds = [...new Set(profiles.filter((p) => p.organization_id).map((p) => p.organization_id!))];
      let orgMap = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase
          .from("organizations")
          .select("id, name")
          .in("id", orgIds);
        if (orgs) orgs.forEach((o) => orgMap.set(o.id, o.name));
      }

      return profiles.map((p) => ({
        ...p,
        organizationName: p.organization_id ? orgMap.get(p.organization_id) || null : null,
      }));
    },
  });
}

// ─── Super Admin: Consultants ───
export function useConsultants() {
  return useQuery({
    queryKey: ["admin", "consultants"],
    queryFn: async () => {
      const { data: consultants, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, status, created_at")
        .eq("role_type", "consultant")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const consultantIds = consultants.map((c) => c.id);
      if (consultantIds.length === 0) return consultants.map((c) => ({ ...c, clientCount: 0, assessmentCount: 0 }));

      // Client counts
      const { data: clients } = await supabase
        .from("profiles")
        .select("consultant_id")
        .in("consultant_id", consultantIds);

      const clientCountMap = new Map<string, number>();
      clients?.forEach((cl) => {
        if (cl.consultant_id) {
          clientCountMap.set(cl.consultant_id, (clientCountMap.get(cl.consultant_id) || 0) + 1);
        }
      });

      // Assessment counts
      const { data: results } = await supabase
        .from("assessment_results")
        .select("consultant_id")
        .in("consultant_id", consultantIds);

      const assessmentCountMap = new Map<string, number>();
      results?.forEach((r) => {
        if (r.consultant_id) {
          assessmentCountMap.set(r.consultant_id, (assessmentCountMap.get(r.consultant_id) || 0) + 1);
        }
      });

      return consultants.map((c) => ({
        ...c,
        clientCount: clientCountMap.get(c.id) || 0,
        assessmentCount: assessmentCountMap.get(c.id) || 0,
      }));
    },
  });
}

// ─── Super Admin: SSO Configurations ───
export function useSSOConfigurations() {
  return useQuery({
    queryKey: ["admin", "sso-configurations"],
    queryFn: async () => {
      const { data: configs, error } = await supabase
        .from("sso_configurations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const orgIds = [...new Set(configs.map((c) => c.organization_id))];
      let orgMap = new Map<string, string>();
      if (orgIds.length > 0) {
        const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", orgIds);
        if (orgs) orgs.forEach((o) => orgMap.set(o.id, o.name));
      }

      return configs.map((c) => ({
        ...c,
        orgName: orgMap.get(c.organization_id) || "Unknown",
      }));
    },
  });
}

// ─── Super Admin: Audit Logs ───
export function useAuditLogs(operationFilter?: string | null) {
  return useQuery({
    queryKey: ["admin", "audit-logs", operationFilter],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (operationFilter) {
        query = query.eq("operation_type", operationFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// ─── Super Admin: Subscriptions ───
export function useSubscriptions() {
  return useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: async () => {
      const { data: subs, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Resolve entity names
      const orgIds = subs.filter((s) => s.entity_type === "organization").map((s) => s.entity_id);
      const profileIds = subs.filter((s) => s.entity_type !== "organization").map((s) => s.entity_id);

      let orgMap = new Map<string, string>();
      let profileMap = new Map<string, string>();

      if (orgIds.length > 0) {
        const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", orgIds);
        if (orgs) orgs.forEach((o) => orgMap.set(o.id, o.name));
      }
      if (profileIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", profileIds);
        if (profiles) profiles.forEach((p) => profileMap.set(p.id, p.full_name || p.email || "Unknown"));
      }

      return subs.map((s) => ({
        ...s,
        entityName: s.entity_type === "organization"
          ? orgMap.get(s.entity_id) || "Unknown"
          : profileMap.get(s.entity_id) || "Unknown",
      }));
    },
  });
}

// ─── Super Admin: Dashboard Stats ───
export function usePlatformStats() {
  return useQuery({
    queryKey: ["admin", "platform-stats"],
    queryFn: async () => {
      const [orgResult, consultantResult, userResult, assessmentResult] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role_type", "consultant"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("assessment_results").select("id", { count: "exact", head: true }),
      ]);

      return {
        totalOrgs: orgResult.count || 0,
        totalConsultants: consultantResult.count || 0,
        totalUsers: userResult.count || 0,
        totalAssessments: assessmentResult.count || 0,
      };
    },
  });
}

// ─── Org Admin: Seat Info ───
export function useOrgSeatInfo() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org", "seat-info", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      // Get org max_seats
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("max_seats, name")
        .eq("id", organizationId!)
        .single();
      if (orgError) throw orgError;

      // Count active users in org
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId!)
        .neq("status", "deactivated");
      if (countError) throw countError;

      const maxSeats = orgData.max_seats || 0;
      const currentUsers = count || 0;
      const remaining = Math.max(0, maxSeats - currentUsers);

      return {
        maxSeats,
        currentUsers,
        remaining,
        isAtLimit: remaining <= 0,
        orgName: orgData.name || "",
      };
    },
  });
}

// ─── Org Admin: Users in My Org ───
export function useOrgUsers() {
  const { organizationId, isDepartmentManager, departmentId } = usePermissions();
  return useQuery({
    queryKey: ["org", "users", organizationId, isDepartmentManager, departmentId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, role_type, department_id, organization_id, status, last_login_at, created_at, phone, additional_roles")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get department names
      const deptIds = [...new Set(users.filter((u) => u.department_id).map((u) => u.department_id!))];
      let deptMap = new Map<string, string>();
      if (deptIds.length > 0) {
        const { data: depts } = await supabase.from("departments").select("id, name").in("id", deptIds);
        if (depts) depts.forEach((d) => deptMap.set(d.id, d.name));
      }

      // Get assessment counts
      const userIds = users.map((u) => u.id);
      const { data: results } = await supabase
        .from("assessment_results")
        .select("user_id")
        .in("user_id", userIds);

      const assessmentCountMap = new Map<string, number>();
      results?.forEach((r) => {
        assessmentCountMap.set(r.user_id, (assessmentCountMap.get(r.user_id) || 0) + 1);
      });

      const enrichedUsers = users.map((u) => ({
        ...u,
        departmentName: u.department_id ? deptMap.get(u.department_id) || "" : "",
        assessmentCount: assessmentCountMap.get(u.id) || 0,
      }));

      // Department managers can only see users in their own department,
      // excluding org_admin, hr, and super_admin roles
      if (isDepartmentManager && departmentId) {
        const hiddenRoles = ["org_admin", "hr", "super_admin"];
        return enrichedUsers.filter(
          (u) => u.department_id === departmentId && !hiddenRoles.includes(u.role_type || "")
        );
      }

      return enrichedUsers;
    },
  });
}

// ─── Org Admin: Departments ───
export function useOrgDepartments() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org", "departments", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data: depts, error } = await supabase
        .from("departments")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("name");
      if (error) throw error;

      // Get member counts per department
      const deptIds = depts.map((d) => d.id);
      if (deptIds.length === 0) return [];

      const { data: members } = await supabase
        .from("profiles")
        .select("department_id")
        .eq("organization_id", organizationId!)
        .in("department_id", deptIds);

      const memberCountMap = new Map<string, number>();
      members?.forEach((m) => {
        if (m.department_id) {
          memberCountMap.set(m.department_id, (memberCountMap.get(m.department_id) || 0) + 1);
        }
      });

      // Get completed assessments per department
      const { data: allOrgResults } = await supabase
        .from("assessment_results")
        .select("user_id")
        .eq("organization_id", organizationId!);

      const usersWithResults = new Set(allOrgResults?.map((r) => r.user_id) || []);

      const { data: profilesInDepts } = await supabase
        .from("profiles")
        .select("id, department_id")
        .eq("organization_id", organizationId!)
        .in("department_id", deptIds);

      const completedMap = new Map<string, number>();
      profilesInDepts?.forEach((p) => {
        if (p.department_id && usersWithResults.has(p.id)) {
          completedMap.set(p.department_id, (completedMap.get(p.department_id) || 0) + 1);
        }
      });

      // Get manager names
      const managerIds = [...new Set(depts.filter((d) => d.manager_id).map((d) => d.manager_id))];
      let managerMap = new Map<string, string>();
      if (managerIds.length > 0) {
        const { data: managers } = await supabase.from("profiles").select("id, full_name").in("id", managerIds);
        if (managers) managers.forEach((m) => managerMap.set(m.id, m.full_name || ""));
      }

      return depts.map((d) => ({
        ...d,
        memberCount: memberCountMap.get(d.id) || 0,
        completedAssessments: completedMap.get(d.id) || 0,
        managerName: d.manager_id ? managerMap.get(d.manager_id) || "" : "",
        children: depts.filter((child) => child.parent_department_id === d.id),
      }));
    },
  });
}

// ─── Org Admin: Assessment Assignments ───
export interface AssignmentBatch {
  id: string;
  batch_id: string;
  target_description: string | null;
  assessment_version: string;
  status: string;
  due_date: string | null;
  created_at: string;
  target_count: number;
  completed_count: number;
}

export function useOrgAssessments() {
  const { organizationId } = usePermissions();
  return useQuery<AssignmentBatch[]>({
    queryKey: ["org", "assessments", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_assignments")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Group by batch_id for aggregated view
      const batchMap = new Map<string, AssignmentBatch>();
      for (const row of data || []) {
        const batchKey = row.batch_id || row.id;
        const existing = batchMap.get(batchKey);
        if (existing) {
          existing.target_count += 1;
          if (row.status === "completed") existing.completed_count += 1;
          // Use worst status for the batch
          if (row.status === "cancelled") existing.status = "cancelled";
        } else {
          batchMap.set(batchKey, {
            id: row.id,
            batch_id: batchKey,
            target_description: row.target_description || null,
            assessment_version: row.assessment_version || "SCPC v1.4",
            status: row.status || "pending",
            due_date: row.due_date,
            created_at: row.created_at,
            target_count: 1,
            completed_count: row.status === "completed" ? 1 : 0,
          });
        }
      }
      return Array.from(batchMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

// ─── Org Admin: Dashboard Stats ───
export function useOrgDashboardStats() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org", "dashboard-stats", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const [userResult, assessmentResult] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("organization_id", organizationId!),
        supabase.from("assessment_results").select("id, completion_time_seconds", { count: "exact" }).eq("organization_id", organizationId!),
      ]);

      const totalUsers = userResult.count || 0;
      const completedAssessments = assessmentResult.count || 0;
      const completionRate = totalUsers > 0 ? ((completedAssessments / totalUsers) * 100).toFixed(1) : "0";

      const avgTime = assessmentResult.data && assessmentResult.data.length > 0
        ? (assessmentResult.data.reduce((sum, r) => sum + (r.completion_time_seconds || 0), 0) / assessmentResult.data.length / 60).toFixed(1)
        : "0";

      return {
        totalUsers,
        completedAssessments,
        completionRate: `${completionRate}%`,
        avgTimeMinutes: `${avgTime}m`,
      };
    },
  });
}

// ─── Org Admin: Analytics ───
export function useOrgAnalytics() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org", "analytics", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from("assessment_results")
        .select("main_anchor, created_at, completion_time_seconds, risk_index, user_id")
        .eq("organization_id", organizationId!);
      if (error) throw error;

      // Anchor distribution
      const anchorCounts = new Map<string, number>();
      results.forEach((r) => {
        if (r.main_anchor) {
          anchorCounts.set(r.main_anchor, (anchorCounts.get(r.main_anchor) || 0) + 1);
        }
      });

      const total = results.length;
      const anchorDistribution = Array.from(anchorCounts.entries())
        .map(([key, count]) => ({
          key,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Monthly trend (last 6 months)
      const now = new Date();
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        const monthResults = results.filter((r) => {
          const d = new Date(r.created_at);
          return d >= monthDate && d < nextMonth;
        });
        monthlyTrend.push({
          month: `${monthDate.getMonth() + 1}月`,
          monthEn: monthDate.toLocaleString("en", { month: "short" }),
          completed: monthResults.length,
        });
      }

      // Average risk
      const avgRisk = total > 0
        ? (results.reduce((sum, r) => sum + Number(r.risk_index || 0), 0) / total).toFixed(1)
        : "0";

      return {
        total,
        anchorDistribution,
        monthlyTrend,
        avgRisk,
        topAnchor: anchorDistribution[0]?.key || null,
      };
    },
  });
}

// ─── Consultant: Dashboard ───
export function useConsultantDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultant", "dashboard", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const consultantId = user!.id;

      const [clientsResult, assessmentsResult, notesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, status, created_at").eq("consultant_id", consultantId).order("created_at", { ascending: false }),
        supabase.from("assessment_results").select("id, user_id, main_anchor, created_at").eq("consultant_id", consultantId).order("created_at", { ascending: false }),
        supabase.from("consultant_notes").select("id").eq("consultant_id", consultantId),
      ]);

      const clients = clientsResult.data || [];
      const assessments = assessmentsResult.data || [];

      // Get client names for recent assessments
      const clientIds = [...new Set(assessments.map((a) => a.user_id))];
      let clientNameMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clientProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", clientIds);
        if (clientProfiles) clientProfiles.forEach((p) => clientNameMap.set(p.id, p.full_name || p.email || ""));
      }

      return {
        clientCount: clients.length,
        assessmentCount: assessments.length,
        noteCount: notesResult.data?.length || 0,
        recentClients: clients.slice(0, 10),
        recentAssessments: assessments.slice(0, 10).map((a) => ({
          ...a,
          clientName: clientNameMap.get(a.user_id) || "Unknown",
        })),
      };
    },
  });
}

// ─── Consultant: Clients ───
export function useConsultantClients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultant", "clients", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, status, created_at, phone")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get assessment counts per client
      const clientIds = clients.map((c) => c.id);
      if (clientIds.length === 0) return [];

      const { data: results } = await supabase
        .from("assessment_results")
        .select("user_id, created_at, main_anchor")
        .in("user_id", clientIds)
        .order("created_at", { ascending: false });

      const assessmentMap = new Map<string, { count: number; lastAnchor: string | null; lastDate: string | null }>();
      results?.forEach((r) => {
        const existing = assessmentMap.get(r.user_id);
        if (!existing) {
          assessmentMap.set(r.user_id, { count: 1, lastAnchor: r.main_anchor, lastDate: r.created_at });
        } else {
          existing.count++;
        }
      });

      return clients.map((c) => ({
        ...c,
        assessmentCount: assessmentMap.get(c.id)?.count || 0,
        lastAnchor: assessmentMap.get(c.id)?.lastAnchor || null,
        lastAssessmentDate: assessmentMap.get(c.id)?.lastDate || null,
      }));
    },
  });
}

// ─── Consultant: Notes ───
export function useConsultantNotes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultant", "notes", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: notes, error } = await supabase
        .from("consultant_notes")
        .select("*")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get client names
      const clientIds = [...new Set(notes.map((n) => n.client_id))];
      let clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase.from("profiles").select("id, full_name, email").in("id", clientIds);
        if (clients) clients.forEach((c) => clientMap.set(c.id, c.full_name || c.email || ""));
      }

      return notes.map((n) => ({
        ...n,
        clientName: clientMap.get(n.client_id) || "Unknown",
      }));
    },
  });
}

// ─── Consultant: Assessments (results for consultant's clients) ───
export function useConsultantAssessments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultant", "assessments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from("assessment_results")
        .select("id, user_id, main_anchor, completion_time_seconds, created_at")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const clientIds = [...new Set(results.map((r) => r.user_id))];
      let clientMap = new Map<string, { name: string; email: string }>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", clientIds);
        if (clients) clients.forEach((c) => clientMap.set(c.id, { name: c.full_name || c.email || "", email: c.email || "" }));
      }

      return results.map((r) => ({
        ...r,
        clientName: clientMap.get(r.user_id)?.name || "Unknown",
        clientEmail: clientMap.get(r.user_id)?.email || "",
      }));
    },
  });
}

// ─── Consultant: Assignments (from assessment_assignments table) ───
export function useConsultantAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultant", "assignments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("assessment_assignments")
        .select("*")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const clientIds = [...new Set(assignments.map((a) => a.assigned_to))];
      const clientMap = new Map<string, { name: string; email: string }>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase.from("profiles").select("id, full_name, email").in("id", clientIds);
        if (clients) clients.forEach((c) => clientMap.set(c.id, { name: c.full_name || c.email || "", email: c.email || "" }));
      }

      return assignments.map((a) => ({
        ...a,
        clientName: clientMap.get(a.assigned_to)?.name || "Unknown",
        clientEmail: clientMap.get(a.assigned_to)?.email || "",
      }));
    },
  });
}

// ─── MUTATIONS: Organizations ───
export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; domain?: string; plan_type?: string; max_seats?: number; status?: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase.from("organizations").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin"] }); },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin"] }); },
  });
}

// ─── MUTATIONS: Profiles ───
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; full_name?: string; role_type?: string; department_id?: string | null; organization_id?: string | null; status?: string; phone?: string; consultant_id?: string | null }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase.from("profiles").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin"] }); queryClient.invalidateQueries({ queryKey: ["org"] }); queryClient.invalidateQueries({ queryKey: ["consultant"] }); },
  });
}

export interface AdditionalRole {
  role_type: string;
  organization_id: string | null;
  organization_name?: string;
  department_id: string | null;
}

export function useAddRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; newRole: AdditionalRole }) => {
      // Fetch current additional_roles
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("additional_roles")
        .eq("id", input.userId)
        .single();
      if (fetchError) throw fetchError;

      const currentRoles: AdditionalRole[] = (profile.additional_roles as AdditionalRole[]) || [];

      // Check for duplicate (same role_type + organization_id)
      const isDuplicate = currentRoles.some(
        (existingRole) =>
          existingRole.role_type === input.newRole.role_type &&
          existingRole.organization_id === input.newRole.organization_id
      );
      if (isDuplicate) {
        throw new Error("DUPLICATE_ROLE");
      }

      const updatedRoles = [...currentRoles, input.newRole];

      const { data, error } = await supabase
        .from("profiles")
        .update({ additional_roles: updatedRoles, updated_at: new Date().toISOString() })
        .eq("id", input.userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["org"] });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; roleIndex: number }) => {
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("additional_roles")
        .eq("id", input.userId)
        .single();
      if (fetchError) throw fetchError;

      const currentRoles: AdditionalRole[] = (profile.additional_roles as AdditionalRole[]) || [];
      const updatedRoles = currentRoles.filter((_, index) => index !== input.roleIndex);

      const { data, error } = await supabase
        .from("profiles")
        .update({ additional_roles: updatedRoles, updated_at: new Date().toISOString() })
        .eq("id", input.userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["org"] });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin"] }); queryClient.invalidateQueries({ queryKey: ["org"] }); },
  });
}

export function useCreateOrgProfile() {
  const queryClient = useQueryClient();
  const { organizationId } = usePermissions();
  return useMutation({
    mutationFn: async (input: { email: string; full_name: string; role_type: string; department_id?: string; phone?: string }) => {
      const { data, error } = await supabase.from("profiles").insert({
        id: crypto.randomUUID(),
        email: input.email,
        full_name: input.full_name,
        role_type: input.role_type,
        department_id: input.department_id || null,
        organization_id: organizationId,
        phone: input.phone || "",
        status: "invited",
        avatar_url: "",
        role: "user",
        career_stage: "",
        notes: "",
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org"] }); },
  });
}

// ─── MUTATIONS: Departments ───
export function useCreateDepartment() {
  const queryClient = useQueryClient();
  const { organizationId } = usePermissions();
  return useMutation({
    mutationFn: async (input: { name: string; parent_department_id?: string | null; manager_id?: string | null }) => {
      const { data, error } = await supabase.from("departments").insert({
        organization_id: organizationId!,
        name: input.name,
        parent_department_id: input.parent_department_id || null,
        manager_id: input.manager_id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org"] }); },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; parent_department_id?: string | null; manager_id?: string | null }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase.from("departments").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org"] }); },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["org"] }); },
  });
}

// ─── MUTATIONS: Consultant Notes ───
export function useCreateNote() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { client_id: string; assessment_id?: string | null; content: string; is_internal: boolean }) => {
      const { data, error } = await supabase.from("consultant_notes").insert({
        consultant_id: user!.id,
        client_id: input.client_id,
        assessment_id: input.assessment_id || null,
        content: input.content,
        is_internal: input.is_internal,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consultant"] }); },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; content?: string; is_internal?: boolean; assessment_id?: string | null }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase.from("consultant_notes").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consultant"] }); },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("consultant_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consultant"] }); },
  });
}

// ─── MUTATIONS: Assessment Assignments ───
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { assigned_to: string; organization_id?: string | null; assessment_version: string; due_date: string; notes?: string }) => {
      const { data, error } = await supabase.from("assessment_assignments").insert({
        assigned_by: user!.id,
        assigned_to: input.assigned_to,
        organization_id: input.organization_id || null,
        consultant_id: user!.id,
        assessment_version: input.assessment_version,
        status: "pending",
        due_date: input.due_date,
        notes: input.notes || "",
        reminder_sent: false,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["consultant"] }); queryClient.invalidateQueries({ queryKey: ["org"] }); },
  });
}

// ─── Consultant: Trends ───
// ─── Assessment Reports: All (Super Admin) ───
export function useAllAssessmentReports() {
  return useQuery({
    queryKey: ["admin", "all-assessment-reports"],
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from("assessment_results")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(results.map((r) => r.user_id))];
      let userMap = new Map<string, { name: string; email: string; orgId: string | null; orgName: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, organization_id")
          .in("id", userIds);
        if (profiles) {
          const orgIds = [...new Set(profiles.filter((p) => p.organization_id).map((p) => p.organization_id!))];
          let orgMap = new Map<string, string>();
          if (orgIds.length > 0) {
            const { data: orgs } = await supabase.from("organizations").select("id, name").in("id", orgIds);
            if (orgs) orgs.forEach((o) => orgMap.set(o.id, o.name));
          }
          profiles.forEach((p) =>
            userMap.set(p.id, {
              name: p.full_name || p.email || "",
              email: p.email || "",
              orgId: p.organization_id,
              orgName: p.organization_id ? orgMap.get(p.organization_id) || null : null,
            })
          );
        }
      }

      return results.map((r) => ({
        ...r,
        userName: userMap.get(r.user_id)?.name || "",
        userEmail: userMap.get(r.user_id)?.email || "",
        orgName: userMap.get(r.user_id)?.orgName || null,
      }));
    },
  });
}

// ─── Assessment Reports: Org-scoped (Org Admin / HR) ───
export function useOrgAssessmentReports() {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org", "assessment-reports", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from("assessment_results")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(results.map((r) => r.user_id))];
      let userMap = new Map<string, { name: string; email: string; deptId: string | null; deptName: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, department_id")
          .in("id", userIds);
        if (profiles) {
          const deptIds = [...new Set(profiles.filter((p) => p.department_id).map((p) => p.department_id!))];
          let deptMap = new Map<string, string>();
          if (deptIds.length > 0) {
            const { data: depts } = await supabase.from("departments").select("id, name").in("id", deptIds);
            if (depts) depts.forEach((d) => deptMap.set(d.id, d.name));
          }
          profiles.forEach((p) =>
            userMap.set(p.id, {
              name: p.full_name || p.email || "",
              email: p.email || "",
              deptId: p.department_id,
              deptName: p.department_id ? deptMap.get(p.department_id) || null : null,
            })
          );
        }
      }

      return results.map((r) => ({
        ...r,
        userName: userMap.get(r.user_id)?.name || "",
        userEmail: userMap.get(r.user_id)?.email || "",
        deptName: userMap.get(r.user_id)?.deptName || null,
      }));
    },
  });
}

// ─── User Reports: All (Super Admin) ───
export function useAllUserReports(reportType?: string) {
  return useQuery({
    queryKey: ["admin", "all-user-reports", reportType],
    queryFn: async () => {
      let query = supabase
        .from("user_reports")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (reportType) {
        query = query.eq("report_type", reportType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set(data.map((r) => r.user_id))];
      let userMap = new Map<string, { name: string; email: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        if (profiles) profiles.forEach((p) => userMap.set(p.id, { name: p.full_name || p.email || "", email: p.email || "" }));
      }

      return data.map((r) => ({
        ...r,
        userName: userMap.get(r.user_id)?.name || "",
        userEmail: userMap.get(r.user_id)?.email || "",
      }));
    },
  });
}

// ─── User Reports: Org-scoped ───
export function useOrgUserReports(reportType?: string) {
  const { organizationId } = usePermissions();
  return useQuery({
    queryKey: ["org", "user-reports", organizationId, reportType],
    enabled: !!organizationId,
    queryFn: async () => {
      let query = supabase
        .from("user_reports")
        .select("*")
        .eq("organization_id", organizationId!)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (reportType) {
        query = query.eq("report_type", reportType);
      }

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set(data.map((r) => r.user_id))];
      let userMap = new Map<string, { name: string; email: string }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        if (profiles) profiles.forEach((p) => userMap.set(p.id, { name: p.full_name || p.email || "", email: p.email || "" }));
      }

      return data.map((r) => ({
        ...r,
        userName: userMap.get(r.user_id)?.name || "",
        userEmail: userMap.get(r.user_id)?.email || "",
      }));
    },
  });
}

// ─── Consultant: Reports from DB ───
export function useConsultantReports() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultant", "reports", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from("assessment_results")
        .select("id, user_id, main_anchor, secondary_anchor, score_tf, score_gm, score_au, score_se, score_ec, score_sv, score_ch, score_ls, created_at, completion_time_seconds")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const clientIds = [...new Set(results.map((r) => r.user_id))];
      let clientMap = new Map<string, { name: string; email: string }>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", clientIds);
        if (clients) clients.forEach((c) => clientMap.set(c.id, { name: c.full_name || c.email || "", email: c.email || "" }));
      }

      // Check which have been sent via user_reports
      const resultIds = results.map((r) => r.id);
      let sentMap = new Map<string, string>();
      if (resultIds.length > 0) {
        const { data: reports } = await supabase
          .from("user_reports")
          .select("assessment_id, created_at")
          .in("assessment_id", resultIds)
          .eq("report_type", "assessment");
        if (reports) reports.forEach((rep) => {
          if (rep.assessment_id) sentMap.set(rep.assessment_id, rep.created_at);
        });
      }

      return results.map((r) => ({
        ...r,
        clientName: clientMap.get(r.user_id)?.name || "",
        clientEmail: clientMap.get(r.user_id)?.email || "",
        isSent: sentMap.has(r.id),
        sentDate: sentMap.get(r.id) || null,
      }));
    },
  });
}

export function useConsultantTrends() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["consultant", "trends", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: results, error } = await supabase
        .from("assessment_results")
        .select("id, user_id, main_anchor, created_at")
        .eq("consultant_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Anchor distribution
      const anchorCounts = new Map<string, number>();
      results.forEach((r) => {
        if (r.main_anchor) {
          anchorCounts.set(r.main_anchor, (anchorCounts.get(r.main_anchor) || 0) + 1);
        }
      });
      const total = results.length;
      const anchorDistribution = Array.from(anchorCounts.entries())
        .map(([key, count]) => ({ key, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);

      // Client progress
      const clientIds = [...new Set(results.map((r) => r.user_id))];
      let clientMap = new Map<string, string>();
      if (clientIds.length > 0) {
        const { data: clients } = await supabase.from("profiles").select("id, full_name, email").in("id", clientIds);
        if (clients) clients.forEach((c) => clientMap.set(c.id, c.full_name || c.email || ""));
      }

      // Group results by client
      const clientResults = new Map<string, typeof results>();
      results.forEach((r) => {
        if (!clientResults.has(r.user_id)) clientResults.set(r.user_id, []);
        clientResults.get(r.user_id)!.push(r);
      });

      const clientProgress = Array.from(clientResults.entries()).map(([userId, userResults]) => {
        const sorted = [...userResults].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const firstAnchor = sorted[0]?.main_anchor || "";
        const currentAnchor = sorted[sorted.length - 1]?.main_anchor || "";
        return {
          name: clientMap.get(userId) || "Unknown",
          sessions: userResults.length,
          firstAnchor,
          currentAnchor,
          trend: userResults.length === 1 ? "new" : firstAnchor === currentAnchor ? "stable" : "shift",
        };
      }).slice(0, 10);

      // Quarterly data (last 4 quarters)
      const now = new Date();
      const quarterlyData = [];
      for (let i = 3; i >= 0; i--) {
        const quarterStart = new Date(now.getFullYear(), now.getMonth() - (i + 1) * 3, 1);
        const quarterEnd = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
        const quarterLabel = `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`;
        const quarterResults = results.filter((r) => {
          const d = new Date(r.created_at);
          return d >= quarterStart && d < quarterEnd;
        });
        const uniqueClients = new Set(quarterResults.map((r) => r.user_id));
        quarterlyData.push({
          quarter: quarterLabel,
          clients: uniqueClients.size,
          assessments: quarterResults.length,
        });
      }

      return { anchorDistribution, clientProgress, quarterlyData, totalAssessments: total, totalClients: clientIds.length };
    },
  });
}
