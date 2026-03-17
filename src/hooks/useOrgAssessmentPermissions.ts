import { useFeaturePermissions } from "@/hooks/useFeaturePermissions";

export interface OrgAssessmentPermissions {
  enableCareerAnchor: boolean;
  enableIdealCard: boolean;
  enableCombined: boolean;
}

/**
 * @deprecated Use useFeaturePermissions() instead for the full 11-key permission system.
 * This wrapper maintains backward compatibility by delegating to the new hook.
 */
export function useOrgAssessmentPermissions() {
  const { isCareerAnchorEnabled, isIdealCardEnabled, isCombinedEnabled } = useFeaturePermissions();

  return {
    data: {
      enableCareerAnchor: isCareerAnchorEnabled,
      enableIdealCard: isIdealCardEnabled,
      enableCombined: isCombinedEnabled,
    } as OrgAssessmentPermissions,
    isLoading: false,
    error: null,
  };
}
