import AssessmentReportsView from "@/components/desktop/AssessmentReportsView";
import { useOrgAssessmentReports, useOrgUserReports } from "@/hooks/useAdminData";

export default function OrgAssessmentReportsPage() {
  const { data: assessments, isLoading: loadingAssessments } = useOrgAssessmentReports();
  const { data: idealCards, isLoading: loadingIdealCards } = useOrgUserReports("ideal_card");

  return (
    <AssessmentReportsView
      assessmentResults={assessments}
      idealCardReports={idealCards}
      isLoadingAssessments={loadingAssessments}
      isLoadingIdealCards={loadingIdealCards}
      scope="org"
    />
  );
}
