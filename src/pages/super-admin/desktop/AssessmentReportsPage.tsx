import AssessmentReportsView from "@/components/desktop/AssessmentReportsView";
import { useAllAssessmentReports, useAllIdealCardResults, useAllFusionReports } from "@/hooks/useAdminData";

export default function SuperAdminAssessmentReportsPage() {
  const { data: assessments, isLoading: loadingAssessments } = useAllAssessmentReports();
  const { data: idealCards, isLoading: loadingIdealCards } = useAllIdealCardResults();
  const { data: fusionReports, isLoading: loadingFusion } = useAllFusionReports();

  return (
    <AssessmentReportsView
      assessmentResults={assessments}
      idealCardReports={idealCards}
      fusionReports={fusionReports}
      isLoadingAssessments={loadingAssessments}
      isLoadingIdealCards={loadingIdealCards}
      isLoadingFusion={loadingFusion}
      scope="super_admin"
    />
  );
}
