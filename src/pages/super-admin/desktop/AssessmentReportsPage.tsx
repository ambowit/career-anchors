import AssessmentReportsView from "@/components/desktop/AssessmentReportsView";
import { useAllAssessmentReports, useAllUserReports } from "@/hooks/useAdminData";

export default function SuperAdminAssessmentReportsPage() {
  const { data: assessments, isLoading: loadingAssessments } = useAllAssessmentReports();
  const { data: idealCards, isLoading: loadingIdealCards } = useAllUserReports("ideal_card");

  return (
    <AssessmentReportsView
      assessmentResults={assessments}
      idealCardReports={idealCards}
      isLoadingAssessments={loadingAssessments}
      isLoadingIdealCards={loadingIdealCards}
      scope="super_admin"
    />
  );
}
