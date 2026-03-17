import { lazy, Suspense, type ComponentType } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Outlet,
  ScrollRestoration,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import NotFound from "@/pages/NotFound";
import RoleGuard from "@/components/desktop/RoleGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RouteErrorFallback from "@/components/RouteErrorFallback";
import ReportDownloadProgress from "@/components/desktop/ReportDownloadProgress";

// Layouts (keep eager - small files, always needed for shell)
import MainLayout from "@/layouts/MainLayout";
import MobileLayout from "@/layouts/MobileLayout";

// ─── Lazy-loaded pages ───────────────────────────────────
const DesktopHomePage = lazy(() => import("@/pages/desktop/HomePage"));
const DesktopAssessmentPage = lazy(() => import("@/pages/desktop/AssessmentPage"));
const DesktopResultsOverviewPage = lazy(() => import("@/pages/desktop/ResultsOverviewPage"));
const ReportViewPage = lazy(() => import("@/pages/desktop/ReportViewPage"));
const DesktopHistoryPage = lazy(() => import("@/pages/desktop/HistoryPage"));
const DesktopAuthPage = lazy(() => import("@/pages/desktop/AuthPage"));
const AuthCallbackPage = lazy(() => import("@/pages/desktop/AuthCallbackPage"));
const HowToUsePage = lazy(() => import("@/pages/desktop/HowToUsePage"));
const HRInterpretationPage = lazy(() => import("@/pages/desktop/HRInterpretationPage"));
const IdealCardTestPage = lazy(() => import("@/pages/desktop/IdealCardTestPage"));
const IdealCardResultsPage = lazy(() => import("@/pages/desktop/IdealCardResultsPage"));
const IdealCardReportViewPage = lazy(() => import("@/pages/desktop/IdealCardReportViewPage"));

const FusionReportV3Page = lazy(() => import("@/pages/desktop/FusionReportV3Page"));
const DesktopMessagesPage = lazy(() => import("@/pages/desktop/MessagesPage"));
const ChangePasswordPage = lazy(() => import("@/pages/desktop/ChangePasswordPage"));
const VerifyCertificatePage = lazy(() => import("@/pages/desktop/VerifyCertificatePage"));
const CpWalletPage = lazy(() => import("@/pages/desktop/CpWalletPage"));
const RechargePage = lazy(() => import("@/pages/desktop/RechargePage"));
const ReferralPage = lazy(() => import("@/pages/desktop/ReferralPage"));
const ReportDownloadPage = lazy(() => import("@/pages/desktop/ReportDownloadPage"));

const MobileHomePage = lazy(() => import("@/pages/mobile/HomePage"));
const MobileAssessmentPage = lazy(() => import("@/pages/mobile/AssessmentPage"));
const MobileResultsPage = lazy(() => import("@/pages/mobile/ResultsPage"));
const MobileAuthPage = lazy(() => import("@/pages/mobile/AuthPage"));
const MobileProfilePage = lazy(() => import("@/pages/mobile/ProfilePage"));

const AdminLayout = lazy(() => import("@/layouts/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const AdminQuestionsPage = lazy(() => import("@/pages/admin/QuestionsPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/AnalyticsPage"));
const AdminAssessmentsPage = lazy(() => import("@/pages/admin/AssessmentsPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/UsersPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));

const SuperAdminLayout = lazy(() => import("@/layouts/SuperAdminLayout"));
const SuperAdminDashboardPage = lazy(() => import("@/pages/super-admin/desktop/DashboardPage"));
const SuperAdminOrganizationsPage = lazy(() => import("@/pages/super-admin/desktop/OrganizationsPage"));
const SuperAdminConsultantsPage = lazy(() => import("@/pages/super-admin/desktop/ConsultantsPage"));
const SuperAdminAllUsersPage = lazy(() => import("@/pages/super-admin/desktop/AllUsersPage"));
const SuperAdminSSOConfigPage = lazy(() => import("@/pages/super-admin/desktop/SSOConfigPage"));
const SuperAdminAuditLogPage = lazy(() => import("@/pages/super-admin/desktop/AuditLogPage"));
const SuperAdminSubscriptionsPage = lazy(() => import("@/pages/super-admin/desktop/SubscriptionsPage"));
const SuperAdminReportTemplatesPage = lazy(() => import("@/pages/super-admin/desktop/ReportTemplatesPage"));
const SuperAdminMessagesMonitorPage = lazy(() => import("@/pages/super-admin/desktop/MessagesMonitorPage"));
const SuperAdminRolesPage = lazy(() => import("@/pages/super-admin/desktop/RolesPage"));
const SuperAdminAssessmentReportsPage = lazy(() => import("@/pages/super-admin/desktop/AssessmentReportsPage"));
const SuperAdminCertificationManagementPage = lazy(() => import("@/pages/super-admin/desktop/CertificationManagementPage"));
const SuperAdminCourseLibraryPage = lazy(() => import("@/pages/super-admin/desktop/CourseLibraryPage"));
const SuperAdminCduAuditPage = lazy(() => import("@/pages/super-admin/desktop/CduAuditPage"));
const SuperAdminBatchOperationsPage = lazy(() => import("@/pages/super-admin/desktop/BatchOperationsPage"));
const SuperAdminCceExportPage = lazy(() => import("@/pages/super-admin/desktop/CceExportPage"));
const SuperAdminCertificateRegistryPage = lazy(() => import("@/pages/super-admin/desktop/CertificateRegistryPage"));
const SuperAdminCertificationReviewPage = lazy(() => import("@/pages/super-admin/desktop/CertificationReviewPage"));
const SuperAdminBatchCduReviewPage = lazy(() => import("@/pages/super-admin/desktop/BatchCduReviewPage"));
const SuperAdminGcqaExportPage = lazy(() => import("@/pages/super-admin/desktop/GcqaExportPage"));
const SuperAdminMembershipRulesPage = lazy(() => import("@/pages/super-admin/desktop/MembershipRulesPage"));
const SuperAdminRewardManagementPage = lazy(() => import("@/pages/super-admin/desktop/RewardManagementPage"));
const SuperAdminReportGeneratorPage = lazy(() => import("@/pages/super-admin/desktop/ReportGeneratorPage"));
const SuperAdminCpRulesPage = lazy(() => import("@/pages/super-admin/desktop/CpRulesEnginePage"));
const SuperAdminLifeCardManagementPage = lazy(() => import("@/pages/super-admin/desktop/LifeCardManagementPage"));
const SuperAdminFusionRulesPage = lazy(() => import("@/pages/super-admin/desktop/FusionRulesPage"));
const SuperAdminOrgTypesPage = lazy(() => import("@/pages/super-admin/desktop/OrgTypesPage"));
const SuperAdminAnonymousBatchListPage = lazy(() => import("@/pages/super-admin/desktop/AnonymousBatchListPage"));
const SuperAdminCreateAnonymousBatchPage = lazy(() => import("@/pages/super-admin/desktop/CreateAnonymousBatchPage"));
const SuperAdminAnonymousBatchDetailPage = lazy(() => import("@/pages/super-admin/desktop/AnonymousBatchDetailPage"));
const SuperAdminAnonymousBatchReportPage = lazy(() => import("@/pages/super-admin/desktop/AnonymousBatchReportPage"));
const SuperAdminAnonymousPermissionsPage = lazy(() => import("@/pages/super-admin/desktop/AnonymousPermissionsPage"));

const OrgAdminLayout = lazy(() => import("@/layouts/OrgAdminLayout"));
const OrgDashboardPage = lazy(() => import("@/pages/org-admin/desktop/DashboardPage"));
const OrgUsersPage = lazy(() => import("@/pages/org-admin/desktop/UsersPage"));
const OrgDepartmentsPage = lazy(() => import("@/pages/org-admin/desktop/DepartmentsPage"));
const OrgAssessmentsPage = lazy(() => import("@/pages/org-admin/desktop/AssessmentsPage"));
const OrgAnalyticsPage = lazy(() => import("@/pages/org-admin/desktop/AnalyticsPage"));
const OrgReportsPage = lazy(() => import("@/pages/org-admin/desktop/ReportsPage"));
const OrgMessagesPage = lazy(() => import("@/pages/org-admin/desktop/MessagesPage"));
const OrgRolesPage = lazy(() => import("@/pages/org-admin/desktop/RolesPage"));
const OrgAssessmentReportsPage = lazy(() => import("@/pages/org-admin/desktop/AssessmentReportsPage"));
const OrgCertificationOverviewPage = lazy(() => import("@/pages/org-admin/desktop/CertificationOverviewPage"));
const OrgCduMonitoringPage = lazy(() => import("@/pages/org-admin/desktop/CduMonitoringPage"));
const OrgRenewalApprovalPage = lazy(() => import("@/pages/org-admin/desktop/RenewalApprovalPage"));
const OrgAnonymousAssessmentPage = lazy(() => import("@/pages/org-admin/desktop/AnonymousAssessmentPage"));

const ConsultantLayout = lazy(() => import("@/layouts/ConsultantLayout"));
const ConsultantDashboardPage = lazy(() => import("@/pages/consultant/desktop/DashboardPage"));
const ConsultantClientsPage = lazy(() => import("@/pages/consultant/desktop/ClientsPage"));
const ConsultantAssessmentsPage = lazy(() => import("@/pages/consultant/desktop/AssessmentsPage"));
const ConsultantReportsPage = lazy(() => import("@/pages/consultant/desktop/ReportsPage"));
const ConsultantNotesPage = lazy(() => import("@/pages/consultant/desktop/NotesPage"));
const ConsultantTrendsPage = lazy(() => import("@/pages/consultant/desktop/TrendsPage"));
const ConsultantMessagesPage = lazy(() => import("@/pages/consultant/desktop/MessagesPage"));
const ConsultantMyCertificationPage = lazy(() => import("@/pages/consultant/desktop/MyCertificationPage"));
const ConsultantMyCduRecordsPage = lazy(() => import("@/pages/consultant/desktop/MyCduRecordsPage"));
const ConsultantRenewalStatusPage = lazy(() => import("@/pages/consultant/desktop/RenewalStatusPage"));
const ConsultantCertificationApplicationPage = lazy(() => import("@/pages/consultant/desktop/CertificationApplicationPage"));

// Anonymous participant page (public, no auth required)
const AnonymousParticipantPage = lazy(() => import("@/pages/AnonymousParticipantPage"));

// Batch assessment participant page (public, no auth required)
const BatchAssessmentParticipantPage = lazy(() => import("@/pages/BatchAssessmentParticipantPage"));

// Shared report page (public, no auth required)
const SharedReportPage = lazy(() => import("@/pages/desktop/SharedReportPage"));

// Super Admin batch assessment pages
const SuperAdminBatchAssessmentListPage = lazy(() => import("@/pages/super-admin/desktop/BatchAssessmentListPage"));
const SuperAdminCreateBatchAssessmentPage = lazy(() => import("@/pages/super-admin/desktop/CreateBatchAssessmentPage"));
const SuperAdminBatchAssessmentDetailPage = lazy(() => import("@/pages/super-admin/desktop/BatchAssessmentDetailPage"));

// Org Admin batch assessment pages
const OrgBatchAssessmentListPage = lazy(() => import("@/pages/org-admin/desktop/BatchAssessmentListPage"));
const OrgCreateBatchAssessmentPage = lazy(() => import("@/pages/org-admin/desktop/CreateBatchAssessmentPage"));
const OrgBatchAssessmentDetailPage = lazy(() => import("@/pages/org-admin/desktop/BatchAssessmentDetailPage"));

// ─── Helpers ───────────────────────────────────────

const queryClient = new QueryClient();

function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Lazy({ Component }: { Component: ComponentType }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function ResponsivePage({
  desktop: Desktop,
  mobile: Mobile,
}: {
  desktop: ComponentType;
  mobile: ComponentType;
}) {
  const isMobile = useIsMobile();
  return (
    <Suspense fallback={<PageLoader />}>
      {isMobile ? <Mobile /> : <Desktop />}
    </Suspense>
  );
}

function ResponsiveLayout() {
  const isMobile = useIsMobile();
  return isMobile ? <MobileLayout /> : <MainLayout />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />} errorElement={<RouteErrorFallback />}>
      {/* User Routes */}
      <Route element={<ResponsiveLayout />} errorElement={<RouteErrorFallback />}>
        <Route path="/" element={<ResponsivePage desktop={DesktopHomePage} mobile={MobileHomePage} />} />
        <Route path="/assessment" element={<ResponsivePage desktop={DesktopAssessmentPage} mobile={MobileAssessmentPage} />} />
        <Route path="/results" element={<ResponsivePage desktop={DesktopResultsOverviewPage} mobile={MobileResultsPage} />} />
        <Route path="/report-view" element={<ResponsivePage desktop={ReportViewPage} mobile={ReportViewPage} />} />
        <Route path="/history" element={<ResponsivePage desktop={DesktopHistoryPage} mobile={DesktopHistoryPage} />} />
        <Route path="/how-to-use" element={<ResponsivePage desktop={HowToUsePage} mobile={HowToUsePage} />} />
        <Route path="/hr-guide" element={<ResponsivePage desktop={HRInterpretationPage} mobile={HRInterpretationPage} />} />
        <Route path="/ideal-card-test" element={<ResponsivePage desktop={IdealCardTestPage} mobile={IdealCardTestPage} />} />
        <Route path="/ideal-card-results" element={<ResponsivePage desktop={IdealCardResultsPage} mobile={IdealCardResultsPage} />} />
        <Route path="/ideal-card-report-view" element={<ResponsivePage desktop={IdealCardReportViewPage} mobile={IdealCardReportViewPage} />} />

            <Route path="/fusion-report" element={<ResponsivePage desktop={FusionReportV3Page} mobile={FusionReportV3Page} />} />
        <Route path="/my-reports" element={<Navigate to="/history" replace />} />
        <Route path="/messages" element={<ResponsivePage desktop={DesktopMessagesPage} mobile={DesktopMessagesPage} />} />
        <Route path="/profile" element={<Lazy Component={MobileProfilePage} />} />
        <Route path="/change-password" element={<Lazy Component={ChangePasswordPage} />} />
        <Route path="/cp-wallet" element={<Lazy Component={CpWalletPage} />} />
        <Route path="/recharge" element={<Lazy Component={RechargePage} />} />
        <Route path="/referral" element={<Lazy Component={ReferralPage} />} />
        <Route path="/report/download" element={<ResponsivePage desktop={ReportDownloadPage} mobile={ReportDownloadPage} />} />
        <Route path="/report/download/:id" element={<ResponsivePage desktop={ReportDownloadPage} mobile={ReportDownloadPage} />} />
      </Route>

      {/* Legacy Admin */}
      <Route path="/admin" element={<Lazy Component={AdminLayout} />}>
        <Route index element={<Lazy Component={AdminDashboardPage} />} />
        <Route path="questions" element={<Lazy Component={AdminQuestionsPage} />} />
        <Route path="analytics" element={<Lazy Component={AdminAnalyticsPage} />} />
        <Route path="assessments" element={<Lazy Component={AdminAssessmentsPage} />} />
        <Route path="users" element={<Lazy Component={AdminUsersPage} />} />
        <Route path="settings" element={<Lazy Component={AdminSettingsPage} />} />
      </Route>

      {/* Super Admin Console */}
      <Route
        path="/super-admin"
        element={
          <RoleGuard allowedRoles={["super_admin"]}>
            <Lazy Component={SuperAdminLayout} />
          </RoleGuard>
        }
      >
        <Route index element={<Lazy Component={SuperAdminDashboardPage} />} />
        <Route path="organizations" element={<Lazy Component={SuperAdminOrganizationsPage} />} />
        <Route path="consultants" element={<Lazy Component={SuperAdminConsultantsPage} />} />
        <Route path="users" element={<Lazy Component={SuperAdminAllUsersPage} />} />
        <Route path="roles" element={<Lazy Component={SuperAdminRolesPage} />} />
        <Route path="questions" element={<Lazy Component={AdminQuestionsPage} />} />
        <Route path="report-templates" element={<Lazy Component={SuperAdminReportTemplatesPage} />} />
        <Route path="report-generator" element={<Lazy Component={SuperAdminReportGeneratorPage} />} />
        <Route path="assessment-reports" element={<Lazy Component={SuperAdminAssessmentReportsPage} />} />
        <Route path="sso" element={<Lazy Component={SuperAdminSSOConfigPage} />} />
        <Route path="subscriptions" element={<Lazy Component={SuperAdminSubscriptionsPage} />} />
        <Route path="messages" element={<Lazy Component={SuperAdminMessagesMonitorPage} />} />
        <Route path="audit" element={<Lazy Component={SuperAdminAuditLogPage} />} />
        <Route path="certification" element={<Lazy Component={SuperAdminCertificationManagementPage} />} />
        <Route path="course-library" element={<Lazy Component={SuperAdminCourseLibraryPage} />} />
        <Route path="cdu-audit" element={<Lazy Component={SuperAdminCduAuditPage} />} />
        <Route path="batch-operations" element={<Lazy Component={SuperAdminBatchOperationsPage} />} />
        <Route path="cce-export" element={<Lazy Component={SuperAdminCceExportPage} />} />
        <Route path="certificate-registry" element={<Lazy Component={SuperAdminCertificateRegistryPage} />} />
        <Route path="certification-review" element={<Lazy Component={SuperAdminCertificationReviewPage} />} />
        <Route path="batch-cdu-review" element={<Lazy Component={SuperAdminBatchCduReviewPage} />} />
        <Route path="gcqa-export" element={<Lazy Component={SuperAdminGcqaExportPage} />} />
        <Route path="membership-rules" element={<Lazy Component={SuperAdminMembershipRulesPage} />} />
        <Route path="reward-management" element={<Lazy Component={SuperAdminRewardManagementPage} />} />
        <Route path="cp-rules" element={<Lazy Component={SuperAdminCpRulesPage} />} />
        <Route path="life-cards" element={<Lazy Component={SuperAdminLifeCardManagementPage} />} />
        <Route path="fusion-rules" element={<Lazy Component={SuperAdminFusionRulesPage} />} />
        <Route path="org-types" element={<Lazy Component={SuperAdminOrgTypesPage} />} />
        <Route path="anonymous-assessment" element={<Lazy Component={SuperAdminAnonymousBatchListPage} />} />
        <Route path="anonymous-assessment/create" element={<Lazy Component={SuperAdminCreateAnonymousBatchPage} />} />
        <Route path="anonymous-assessment/:batchId" element={<Lazy Component={SuperAdminAnonymousBatchDetailPage} />} />
        <Route path="anonymous-assessment/:batchId/report" element={<Lazy Component={SuperAdminAnonymousBatchReportPage} />} />
        <Route path="anonymous-assessment/permissions" element={<Lazy Component={SuperAdminAnonymousPermissionsPage} />} />
        <Route path="batch-assessment" element={<Lazy Component={SuperAdminBatchAssessmentListPage} />} />
        <Route path="batch-assessment/create" element={<Lazy Component={SuperAdminCreateBatchAssessmentPage} />} />
        <Route path="batch-assessment/:batchId" element={<Lazy Component={SuperAdminBatchAssessmentDetailPage} />} />
        <Route path="settings" element={<Lazy Component={AdminSettingsPage} />} />
        <Route path="change-password" element={<Lazy Component={ChangePasswordPage} />} />
      </Route>

      {/* Organization Admin Console */}
      <Route
        path="/org"
        element={
          <RoleGuard allowedRoles={["org_admin", "hr", "department_manager"]}>
            <Lazy Component={OrgAdminLayout} />
          </RoleGuard>
        }
      >
        <Route index element={<Lazy Component={OrgDashboardPage} />} />
        <Route path="users" element={<Lazy Component={OrgUsersPage} />} />
        <Route path="roles" element={<Lazy Component={OrgRolesPage} />} />
        <Route path="departments" element={<Lazy Component={OrgDepartmentsPage} />} />
        <Route path="assessments" element={<Lazy Component={OrgAssessmentsPage} />} />
        <Route path="analytics" element={<Lazy Component={OrgAnalyticsPage} />} />
        <Route path="reports" element={<Lazy Component={OrgReportsPage} />} />
        <Route path="assessment-reports" element={<Lazy Component={OrgAssessmentReportsPage} />} />
        <Route path="messages" element={<Lazy Component={OrgMessagesPage} />} />
        <Route path="certification-overview" element={<Lazy Component={OrgCertificationOverviewPage} />} />
        <Route path="cdu-monitoring" element={<Lazy Component={OrgCduMonitoringPage} />} />
        <Route path="renewal-approval" element={<Lazy Component={OrgRenewalApprovalPage} />} />
        <Route path="anonymous-assessment" element={<Lazy Component={OrgAnonymousAssessmentPage} />} />
        <Route path="batch-assessment" element={<Lazy Component={OrgBatchAssessmentListPage} />} />
        <Route path="batch-assessment/create" element={<Lazy Component={OrgCreateBatchAssessmentPage} />} />
        <Route path="batch-assessment/:batchId" element={<Lazy Component={OrgBatchAssessmentDetailPage} />} />
        <Route path="settings" element={<Lazy Component={AdminSettingsPage} />} />
        <Route path="change-password" element={<Lazy Component={ChangePasswordPage} />} />
      </Route>

      {/* Consultant Console */}
      <Route
        path="/consultant"
        element={
          <RoleGuard allowedRoles={["consultant", "collaborator"]}>
            <Lazy Component={ConsultantLayout} />
          </RoleGuard>
        }
      >
        <Route index element={<Lazy Component={ConsultantDashboardPage} />} />
        <Route path="clients" element={<Lazy Component={ConsultantClientsPage} />} />
        <Route path="assessments" element={<Lazy Component={ConsultantAssessmentsPage} />} />
        <Route path="reports" element={<Lazy Component={ConsultantReportsPage} />} />
        <Route path="notes" element={<Lazy Component={ConsultantNotesPage} />} />
        <Route path="trends" element={<Lazy Component={ConsultantTrendsPage} />} />
        <Route path="messages" element={<Lazy Component={ConsultantMessagesPage} />} />
        <Route path="my-certification" element={<Lazy Component={ConsultantMyCertificationPage} />} />
        <Route path="cdu-records" element={<Lazy Component={ConsultantMyCduRecordsPage} />} />
        <Route path="renewal" element={<Lazy Component={ConsultantRenewalStatusPage} />} />
        <Route path="certification-apply" element={<Lazy Component={ConsultantCertificationApplicationPage} />} />
        <Route path="change-password" element={<Lazy Component={ChangePasswordPage} />} />
      </Route>

      {/* Public Routes */}
      <Route path="/a/:token" element={<Lazy Component={AnonymousParticipantPage} />} />
      <Route path="/batch/:slug" element={<Lazy Component={BatchAssessmentParticipantPage} />} />
      <Route path="/shared-report/:token" element={<Lazy Component={SharedReportPage} />} />
      <Route path="/verify-certificate" element={<Lazy Component={VerifyCertificatePage} />} />

      {/* Auth Routes */}
      <Route path="/auth" element={<ResponsivePage desktop={DesktopAuthPage} mobile={MobileAuthPage} />} />
      <Route path="/auth/callback" element={<Lazy Component={AuthCallbackPage} />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Sonner />
            <ReportDownloadProgress />
            <RouterProvider router={router} />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
