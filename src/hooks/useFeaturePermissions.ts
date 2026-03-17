import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ─── 11 Feature Permission Keys ──────────────────────────────────────
export const FEATURE_KEYS = [
  "career_anchor",
  "ideal_card",
  "combined",
  "report_download",
  "analytics",
  "client_management",
  "consultant_notes",
  "trend_analysis",
  "certification",
  "cdu_records",
  "message",
  "anonymous_assessment",
  "cp_points",
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

// ─── Permission Resolution ──────────────────────────────────────────
// Priority:
//   1. super_admin → always all enabled
//   2. profiles.feature_permissions (consultant/collaborator individual override)
//   3. organizations.feature_permissions (org-level baseline)
//   4. No org, no individual override → all enabled (individual users)

export function useFeaturePermissions() {
  const { profile } = useAuth();
  const userId = profile?.id;
  const organizationId = profile?.organization_id;
  const roleType = profile?.role_type;

  // Org-level feature_permissions
  const { data: orgPermissions } = useQuery({
    queryKey: ["org-feature-permissions", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("feature_permissions")
        .eq("id", organizationId!)
        .single();
      if (error) throw error;
      return (data?.feature_permissions as Record<string, boolean>) || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  // Individual-level feature_permissions (for consultant / collaborator overrides)
  const isConsultantLike = roleType === "consultant" || roleType === "collaborator";
  const { data: userPermissions } = useQuery({
    queryKey: ["user-feature-permissions", userId],
    enabled: !!userId && isConsultantLike,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("feature_permissions")
        .eq("id", userId!)
        .single();
      if (error) throw error;
      return (data?.feature_permissions as Record<string, boolean>) || {};
    },
    staleTime: 5 * 60 * 1000,
  });

  const hasFeature = (key: FeatureKey): boolean => {
    // Super admin bypasses all checks
    if (roleType === "super_admin") return true;

    // Consultant/collaborator individual override takes priority
    if (isConsultantLike && userPermissions && Object.keys(userPermissions).length > 0) {
      return userPermissions[key] === true;
    }

    // Org-level permissions
    if (organizationId && orgPermissions && Object.keys(orgPermissions).length > 0) {
      return orgPermissions[key] === true;
    }

    // Individual users without org: all enabled by default
    return true;
  };

  return {
    hasFeature,
    // Convenience booleans for common checks
    isCareerAnchorEnabled: hasFeature("career_anchor"),
    isIdealCardEnabled: hasFeature("ideal_card"),
    isCombinedEnabled: hasFeature("combined"),
    isReportDownloadEnabled: hasFeature("report_download"),
    isAnalyticsEnabled: hasFeature("analytics"),
    isClientManagementEnabled: hasFeature("client_management"),
    isConsultantNotesEnabled: hasFeature("consultant_notes"),
    isTrendAnalysisEnabled: hasFeature("trend_analysis"),
    isCertificationEnabled: hasFeature("certification"),
    isCduRecordsEnabled: hasFeature("cdu_records"),
    isMessageEnabled: hasFeature("message"),
    isAnonymousAssessmentEnabled: hasFeature("anonymous_assessment"),
    isCpPointsEnabled: hasFeature("cp_points"),
  };
}
