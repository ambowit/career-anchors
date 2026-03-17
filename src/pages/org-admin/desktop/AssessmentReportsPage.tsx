import AssessmentReportsView from "@/components/desktop/AssessmentReportsView";
import { useOrgAssessmentReports, useOrgIdealCardResults, useOrgFusionReports } from "@/hooks/useAdminData";

export default function OrgAssessmentReportsPage() {
  const { data: assessments, isLoading: loadingAssessments } = useOrgAssessmentReports();
  const { data: idealCards, isLoading: loadingIdealCards } = useOrgIdealCardResults();
  const { data: fusionReports, isLoading: loadingFusion } = useOrgFusionReports();

  return (
    <AssessmentReportsView
      assessmentResults={assessments}
      idealCardReports={idealCards}
      fusionReports={fusionReports}
      isLoadingAssessments={loadingAssessments}
      isLoadingIdealCards={loadingIdealCards}
      isLoadingFusion={loadingFusion}
      scope="org"
    />
  );
}
