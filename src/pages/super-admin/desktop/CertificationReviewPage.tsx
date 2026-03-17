import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import {
  useCertificateTypes,
  generateCertificateNumber,
  generateCertificateHash,
} from "@/hooks/useCertification";
import { notifyCertificationIssued } from "@/lib/certificationNotifications";
import { toast } from "sonner";
import {
  ClipboardCheck, ChevronRight, User, Calendar, FileText,
  Check, X, Send, Loader2, Clock, AlertCircle, Award,
  Shield, Briefcase, GraduationCap, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface CertApplication {
  id: string;
  user_id: string;
  certificate_type_id: string;
  certification_type: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  full_name_zh: string | null;
  application_data: Record<string, unknown> | null;
  supporting_documents: unknown[] | null;
  status: string;
  reviewer_id: string | null;
  review_comment: string | null;
  reviewed_at: string | null;
  certification_id: string | null;
  organization_id: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
}

interface ProfileInfo {
  id: string;
  full_name: string | null;
  email: string | null;
}

type ReviewStatus = "submitted" | "under_review" | "sent_to_gcqa" | "certificate_issuing" | "approved" | "rejected";

const STATUS_FLOW: ReviewStatus[] = ["submitted", "under_review", "sent_to_gcqa", "certificate_issuing"];

const APPLICATION_DATA_LABELS: Record<string, Record<string, string>> = {
  years_experience: { en: "Years of Experience", "zh-TW": "從業年資", "zh-CN": "从业年资" },
  highest_degree: { en: "Highest Degree", "zh-TW": "最高學歷", "zh-CN": "最高学历" },
  specialization: { en: "Specialization", "zh-TW": "專業領域", "zh-CN": "专业领域" },
  motivation: { en: "Motivation", "zh-TW": "申請動機", "zh-CN": "申请动机" },
};

export default function CertificationReviewPage() {
  const { language } = useTranslation();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<CertApplication | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewAction, setReviewAction] = useState<string>("");

  const { data: certificateTypes = [] } = useCertificateTypes();

  const txt = {
    title: { en: "Certification Review", "zh-TW": "認證審查", "zh-CN": "认证审查" }[langKey]!,
    subtitle: { en: "Review certification applications and issue certificates", "zh-TW": "審查認證申請並頒發證號", "zh-CN": "审查认证申请并颁发证号" }[langKey]!,
    all: { en: "All", "zh-TW": "全部", "zh-CN": "全部" }[langKey]!,
    submitted: { en: "Submitted", "zh-TW": "已提交", "zh-CN": "已提交" }[langKey]!,
    underReview: { en: "Under Review", "zh-TW": "審查中", "zh-CN": "审查中" }[langKey]!,
    sentToGcqa: { en: "Sent to GCQA", "zh-TW": "已送 GCQA", "zh-CN": "已送 GCQA" }[langKey]!,
    certIssuing: { en: "Certificate Issuing", "zh-TW": "證號發放中", "zh-CN": "证号发放中" }[langKey]!,
    approved: { en: "Approved", "zh-TW": "已通過", "zh-CN": "已通过" }[langKey]!,
    rejected: { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]!,
    review: { en: "Review", "zh-TW": "審查", "zh-CN": "审查" }[langKey]!,
    reviewTitle: { en: "Review Application", "zh-TW": "審查申請", "zh-CN": "审查申请" }[langKey]!,
    comment: { en: "Review Comment", "zh-TW": "審查意見", "zh-CN": "审查意见" }[langKey]!,
    advanceStatus: { en: "Advance to Next Status", "zh-TW": "推進至下一狀態", "zh-CN": "推进至下一状态" }[langKey]!,
    approve: { en: "Approve & Issue Certificate", "zh-TW": "通過並頒發證號", "zh-CN": "通过并颁发证号" }[langKey]!,
    reject: { en: "Reject", "zh-TW": "駁回", "zh-CN": "驳回" }[langKey]!,
    confirm: { en: "Confirm", "zh-TW": "確認", "zh-CN": "确认" }[langKey]!,
    cancel: { en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" }[langKey]!,
    noApps: { en: "No applications found", "zh-TW": "暫無申請", "zh-CN": "暂无申请" }[langKey]!,
    filterStatus: { en: "Filter Status", "zh-TW": "篩選狀態", "zh-CN": "筛选状态" }[langKey]!,
    applicantInfo: { en: "Applicant Information", "zh-TW": "申請人資訊", "zh-CN": "申请人信息" }[langKey]!,
    certType: { en: "Certificate Type", "zh-TW": "證照類型", "zh-CN": "证照类型" }[langKey]!,
    profBackground: { en: "Professional Background", "zh-TW": "專業背景", "zh-CN": "专业背景" }[langKey]!,
    willIssueCert: { en: "A certificate will be auto-generated upon approval", "zh-TW": "通過後將自動生成證號", "zh-CN": "通过后将自动生成证号" }[langKey]!,
    issueSuccess: { en: "Certificate issued successfully", "zh-TW": "證號已頒發", "zh-CN": "证号已颁发" }[langKey]!,
    statusUpdated: { en: "Status updated", "zh-TW": "狀態已更新", "zh-CN": "状态已更新" }[langKey]!,
    rejected_toast: { en: "Application rejected", "zh-TW": "申請已駁回", "zh-CN": "申请已驳回" }[langKey]!,
  };

  const statusLabelMap: Record<string, string> = {
    submitted: txt.submitted,
    under_review: txt.underReview,
    sent_to_gcqa: txt.sentToGcqa,
    certificate_issuing: txt.certIssuing,
    approved: txt.approved,
    rejected: txt.rejected,
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      submitted: { label: txt.submitted, variant: "outline" },
      under_review: { label: txt.underReview, variant: "secondary" },
      sent_to_gcqa: { label: txt.sentToGcqa, variant: "default" },
      certificate_issuing: { label: txt.certIssuing, variant: "default" },
      approved: { label: txt.approved, variant: "default" },
      rejected: { label: txt.rejected, variant: "destructive" },
    };
    const statusConfig = config[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  const getNextStatus = (currentStatus: string): ReviewStatus | null => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus as ReviewStatus);
    if (currentIndex < 0 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  // Query ALL certification applications (filter in frontend for proper tab counts)
  const { data: allApplications = [], isLoading } = useQuery({
    queryKey: ["cert-applications-all", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("certification_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CertApplication[];
    },
  });

  // Fetch profile info for all applicants
  const applicantIds = useMemo(
    () => [...new Set(allApplications.map((a) => a.user_id))],
    [allApplications]
  );

  const { data: profilesMap = {} } = useQuery({
    queryKey: ["applicant-profiles", applicantIds],
    queryFn: async () => {
      if (applicantIds.length === 0) return {};
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", applicantIds);
      if (error) throw error;
      const mapped: Record<string, ProfileInfo> = {};
      (data || []).forEach((profileItem) => {
        mapped[profileItem.id] = profileItem as ProfileInfo;
      });
      return mapped;
    },
    enabled: applicantIds.length > 0,
  });

  // Group applications by cert_code for tab counts
  const certCodeTabs = useMemo(() => {
    const codes = certificateTypes.map((ct) => ct.cert_code);
    return codes.length > 0 ? codes : ["SCPC", "SCPS", "ELF"];
  }, [certificateTypes]);

  const applicationsByCertCode = useMemo(() => {
    const grouped: Record<string, CertApplication[]> = { all: allApplications };
    certCodeTabs.forEach((code) => {
      grouped[code] = allApplications.filter((app) => {
        // Match by certificate_type_id → cert_code, or fallback to certification_type string (case-insensitive)
        const certType = certificateTypes.find((ct) => ct.id === app.certificate_type_id);
        if (certType) return certType.cert_code === code;
        return (app.certification_type || "").toUpperCase() === code;
      });
    });
    return grouped;
  }, [allApplications, certCodeTabs, certificateTypes]);

  const displayedApplications = applicationsByCertCode[activeTab] || [];

  // Review mutation with certificate issuance on approval
  const reviewMutation = useMutation({
    mutationFn: async ({
      appId,
      newStatus,
      comment,
      application,
    }: {
      appId: string;
      newStatus: string;
      comment: string;
      application: CertApplication;
    }) => {
      const previousStatus = application.status;

      // Update application status
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        reviewer_id: user?.id,
        review_comment: comment || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // If approving, issue a certificate first
      if (newStatus === "approved") {
        const certType = certificateTypes.find((ct) => ct.id === application.certificate_type_id);
        if (!certType) throw new Error("Certificate type not found");

        const accountSuffix = application.user_id.substring(0, 4).toUpperCase();
        const certNumber = await generateCertificateNumber(
          certType.cert_code,
          certType.gcqa_code || null,
          accountSuffix
        );
        const certificateHash = await generateCertificateHash(certNumber);

        const cycleYears = certType.renewal_cycle_years || 5;
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        const expiryDate = new Date(today);
        expiryDate.setFullYear(expiryDate.getFullYear() + cycleYears);
        const expiryStr = expiryDate.toISOString().split("T")[0];

        // Create certification record
        const { data: certificationData, error: certError } = await supabase
          .from("certifications")
          .insert({
            user_id: application.user_id,
            certification_type: certType.cert_code,
            certification_number: certNumber,
            issue_date: todayStr,
            expiry_date: expiryStr,
            cycle_start_date: todayStr,
            renewal_cycle_years: cycleYears,
            minimum_cdu_hours: certType.minimum_cdu_hours || 80,
            issued_by: user!.id,
            organization_id: application.organization_id || null,
            certification_status: "active",
            certificate_hash: certificateHash,
            cert_code: certType.cert_code,
            first_name_en: application.first_name_en || null,
            last_name_en: application.last_name_en || null,
            recertification_date: todayStr,
            recertification_count: 0,
            certificate_type_id: certType.id,
          })
          .select()
          .single();
        if (certError) throw certError;

        // Link certification back to application
        updatePayload.certification_id = certificationData.id;

        // Log certification issuance
        await supabase.from("certification_review_logs").insert({
          reviewer_id: user!.id,
          reviewer_email: profile?.email || null,
          target_type: "certification",
          target_id: certificationData.id,
          action: "issue",
          new_status: "active",
          comment: `Issued ${certType.cert_code} certification: ${certNumber} (via application approval)`,
          organization_id: application.organization_id || null,
        });

        // Notify the applicant
        notifyCertificationIssued({
          recipientId: application.user_id,
          certificationNumber: certNumber,
          certificationType: certType.cert_code,
          expiryDate: expiryStr,
          organizationId: application.organization_id || undefined,
        });
      }

      // Update application status
      const { error: updateError } = await supabase
        .from("certification_applications")
        .update(updatePayload)
        .eq("id", appId);
      if (updateError) throw updateError;

      // Log the review action
      await supabase.from("certification_review_logs").insert({
        reviewer_id: user!.id,
        reviewer_email: profile?.email || null,
        target_type: "certification_application",
        target_id: appId,
        action: newStatus === "rejected" ? "reject" : newStatus === "approved" ? "approve" : "advance",
        previous_status: previousStatus,
        new_status: newStatus,
        comment: comment || null,
        organization_id: application.organization_id || null,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["cert-applications-all"] });
      queryClient.invalidateQueries({ queryKey: ["all-certifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-review-logs"] });

      if (variables.newStatus === "approved") {
        toast.success(txt.issueSuccess);
      } else if (variables.newStatus === "rejected") {
        toast.success(txt.rejected_toast);
      } else {
        toast.success(txt.statusUpdated);
      }

      setReviewDialogOpen(false);
      setSelectedApp(null);
      setReviewComment("");
      setReviewAction("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleReview = (app: CertApplication) => {
    setSelectedApp(app);
    setReviewComment(app.review_comment || "");
    setReviewAction("");
    setReviewDialogOpen(true);
  };

  const handleConfirmReview = () => {
    if (!selectedApp || !reviewAction) return;
    reviewMutation.mutate({
      appId: selectedApp.id,
      newStatus: reviewAction,
      comment: reviewComment,
      application: selectedApp,
    });
  };

  const getCertTypeName = (application: CertApplication) => {
    const certType = certificateTypes.find((ct) => ct.id === application.certificate_type_id);
    if (!certType) return application.certification_type || "—";
    return langKey === "en"
      ? certType.cert_name_en
      : langKey === "zh-TW"
      ? certType.cert_name_zh_tw || certType.cert_name_en
      : certType.cert_name_zh_cn || certType.cert_name_en;
  };

  const getCertCode = (application: CertApplication) => {
    const certType = certificateTypes.find((ct) => ct.id === application.certificate_type_id);
    return certType?.cert_code || (application.certification_type || "").toUpperCase();
  };

  const allTabs = ["all", ...certCodeTabs];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-primary" />
          {txt.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{txt.subtitle}</p>
      </div>

      {/* Tabs by certification type */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            {allTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="gap-1.5">
                {tab === "all" ? txt.all : tab}
                {(applicationsByCertCode[tab] || []).length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1.5 h-5 text-xs">
                    {(applicationsByCertCode[tab] || []).length}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={txt.filterStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{txt.all}</SelectItem>
              <SelectItem value="submitted">{txt.submitted}</SelectItem>
              <SelectItem value="under_review">{txt.underReview}</SelectItem>
              <SelectItem value="sent_to_gcqa">{txt.sentToGcqa}</SelectItem>
              <SelectItem value="certificate_issuing">{txt.certIssuing}</SelectItem>
              <SelectItem value="approved">{txt.approved}</SelectItem>
              <SelectItem value="rejected">{txt.rejected}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {allTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="border border-border rounded-lg overflow-hidden bg-card">
              {isLoading ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                </div>
              ) : displayedApplications.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                  {txt.noApps}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {displayedApplications.map((app) => {
                    const userProfile = profilesMap[app.user_id];
                    const certCode = getCertCode(app);
                    return (
                      <div key={app.id} className="p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground flex items-center gap-2">
                                {app.full_name_zh || userProfile?.full_name || "—"}
                                <Badge variant="outline" className="text-[10px] px-1.5 h-5 font-mono">
                                  {certCode}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {app.first_name_en} {app.last_name_en}
                                {userProfile?.email && ` · ${userProfile.email}`}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {new Date(app.submitted_at).toLocaleDateString()}
                              </div>
                            </div>
                            {getStatusBadge(app.status)}
                            {!["approved", "rejected"].includes(app.status) && (
                              <Button size="sm" variant="outline" onClick={() => handleReview(app)} className="gap-1">
                                {txt.review}
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            )}
                            {app.status === "approved" && app.certification_id && (
                              <Badge variant="default" className="bg-emerald-500 gap-1">
                                <Award className="w-3 h-3" />
                                { { en: "Issued", "zh-TW": "已頒發", "zh-CN": "已颁发" }[langKey] }
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {txt.reviewTitle}
            </DialogTitle>
          </DialogHeader>

          {selectedApp && (() => {
            const userProfile = profilesMap[selectedApp.user_id];
            const certType = certificateTypes.find((ct) => ct.id === selectedApp.certificate_type_id);
            const certCode = getCertCode(selectedApp);

            return (
              <div className="space-y-4 py-2">
                {/* Certificate Type Info */}
                <div className="p-3 bg-primary/5 border border-primary/15 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{txt.certType}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">{certCode}</Badge>
                    <span className="text-sm text-foreground">{getCertTypeName(selectedApp)}</span>
                  </div>
                  {certType && (
                    <div className="text-xs text-muted-foreground mt-1">
                      { { en: "Cycle", "zh-TW": "週期", "zh-CN": "周期" }[langKey] }: {certType.renewal_cycle_years}{ { en: " years", "zh-TW": "年", "zh-CN": "年" }[langKey] }
                      {" · "}
                      { { en: "Min CDU", "zh-TW": "最低 CDU", "zh-CN": "最低 CDU" }[langKey] }: {certType.minimum_cdu_hours}h
                      {certType.gcqa_code && ` · GCQA: ${certType.gcqa_code}`}
                    </div>
                  )}
                </div>

                {/* Applicant Info */}
                <div className="p-3 bg-muted/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{txt.applicantInfo}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">{ { en: "Chinese Name", "zh-TW": "中文姓名", "zh-CN": "中文姓名" }[langKey] }</span>
                      <div className="font-medium text-foreground">{selectedApp.full_name_zh || userProfile?.full_name || "—"}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{ { en: "English Name", "zh-TW": "英文姓名", "zh-CN": "英文姓名" }[langKey] }</span>
                      <div className="font-medium text-foreground">{selectedApp.first_name_en} {selectedApp.last_name_en}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Email</span>
                      <div className="text-foreground">{userProfile?.email || "—"}</div>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        { { en: "Submitted", "zh-TW": "提交時間", "zh-CN": "提交时间" }[langKey] }
                      </span>
                      <div className="text-foreground">{new Date(selectedApp.submitted_at).toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Application Data (Professional Background) */}
                {selectedApp.application_data && Object.keys(selectedApp.application_data).length > 0 && (
                  <div className="p-3 bg-muted/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-foreground">{txt.profBackground}</span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(selectedApp.application_data).map(([key, value]) => {
                        if (!value || String(value).trim() === "") return null;
                        const labelObj = APPLICATION_DATA_LABELS[key];
                        const displayLabel = labelObj
                          ? labelObj[langKey]
                          : key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
                        return (
                          <div key={key} className="text-sm">
                            <span className="text-xs text-muted-foreground">{displayLabel}</span>
                            <div className="text-foreground mt-0.5">{String(value)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Status Flow Visualization */}
                <div className="flex items-center gap-1 text-xs py-1">
                  {STATUS_FLOW.map((status, index) => {
                    const currentIndex = STATUS_FLOW.indexOf(selectedApp.status as ReviewStatus);
                    const isCompleted = currentIndex >= 0 && index < currentIndex;
                    const isCurrent = selectedApp.status === status;
                    return (
                      <div key={status} className="flex items-center gap-1 flex-1">
                        <div className={`px-2 py-1 rounded flex-1 text-center text-[10px] ${
                          isCurrent ? "bg-primary text-primary-foreground font-medium" :
                          isCompleted ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {statusLabelMap[status] || status.replace(/_/g, " ")}
                        </div>
                        {index < STATUS_FLOW.length - 1 && <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Comment */}
                <div>
                  <label className="text-sm font-medium">{txt.comment}</label>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="mt-1"
                    placeholder={{ en: "Optional review notes...", "zh-TW": "審查備註（選填）...", "zh-CN": "审查备注（选填）..." }[langKey]}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {getNextStatus(selectedApp.status) && (
                    <Button
                      variant={reviewAction === getNextStatus(selectedApp.status) ? "default" : "outline"}
                      className="flex-1 gap-1"
                      onClick={() => setReviewAction(getNextStatus(selectedApp.status)!)}
                    >
                      <Send className="w-4 h-4" />
                      {txt.advanceStatus}
                    </Button>
                  )}
                  {selectedApp.status === "certificate_issuing" && (
                    <Button
                      className={`flex-1 gap-1 ${reviewAction === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-500 hover:bg-emerald-600"}`}
                      onClick={() => setReviewAction("approved")}
                    >
                      <Check className="w-4 h-4" />
                      {txt.approve}
                    </Button>
                  )}
                  <Button
                    variant={reviewAction === "rejected" ? "destructive" : "outline"}
                    className="gap-1"
                    onClick={() => setReviewAction("rejected")}
                  >
                    <X className="w-4 h-4" />
                    {txt.reject}
                  </Button>
                </div>

                {/* Action preview */}
                {reviewAction && (
                  <div className={`p-3 rounded-lg text-sm border ${
                    reviewAction === "approved"
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800"
                      : reviewAction === "rejected"
                      ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                      : "bg-primary/5 border-primary/20"
                  }`}>
                    <div className="flex items-center gap-2">
                      {reviewAction === "approved" && <Shield className="w-4 h-4 text-emerald-600" />}
                      {reviewAction === "rejected" && <X className="w-4 h-4 text-red-600" />}
                      {!["approved", "rejected"].includes(reviewAction) && <Send className="w-4 h-4 text-primary" />}
                      <span>
                        { { en: "Will change status to: ", "zh-TW": "將變更狀態為：", "zh-CN": "将变更状态为：" }[langKey] }
                        <Badge className="ml-1">{statusLabelMap[reviewAction] || reviewAction.replace(/_/g, " ")}</Badge>
                      </span>
                    </div>
                    {reviewAction === "approved" && (
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {txt.willIssueCert}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              {txt.cancel}
            </Button>
            <Button
              onClick={handleConfirmReview}
              disabled={!reviewAction || reviewMutation.isPending}
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {txt.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
