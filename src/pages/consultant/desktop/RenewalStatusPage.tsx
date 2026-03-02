import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, CheckCircle2, Clock, XCircle, Send, AlertTriangle, FileCheck, BookOpen } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useMyCertification, useMyRenewals, useCduSummary, useCreateRenewal, useMyCduRecords } from "@/hooks/useCertification";
import { toast } from "sonner";

const RENEWAL_STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: Record<string, string> }> = {
  draft: { color: "text-slate-600", bgColor: "bg-slate-50", icon: Clock, label: { en: "Draft", "zh-TW": "草稿", "zh-CN": "草稿" } },
  submitted: { color: "text-blue-600", bgColor: "bg-blue-50", icon: Send, label: { en: "Submitted", "zh-TW": "已提交", "zh-CN": "已提交" } },
  under_review: { color: "text-amber-600", bgColor: "bg-amber-50", icon: Clock, label: { en: "Under Review", "zh-TW": "審核中", "zh-CN": "审核中" } },
  approved: { color: "text-emerald-600", bgColor: "bg-emerald-50", icon: CheckCircle2, label: { en: "Approved", "zh-TW": "已通過", "zh-CN": "已通过" } },
  rejected: { color: "text-red-600", bgColor: "bg-red-50", icon: XCircle, label: { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" } },
  withdrawn: { color: "text-slate-500", bgColor: "bg-slate-50", icon: XCircle, label: { en: "Withdrawn", "zh-TW": "已撤回", "zh-CN": "已撤回" } },
};

const TXT = {
  en: {
    title: "Renewal Status",
    subtitle: "Apply for certification renewal and track your application status",
    applyRenewal: "Apply for Renewal",
    eligible: "You are eligible for renewal!",
    notEligible: "CDU requirements not yet met",
    hoursCompleted: "hours completed",
    hoursRemaining: "hours remaining",
    cduBreakdown: "CDU Breakdown",
    typeAClass: "A-Class",
    typeBClass: "B-Class",
    total: "Total",
    progress: "Progress",
    applicationHistory: "Application History",
    noApplications: "No renewal applications yet",
    renewalApplication: "Renewal Application",
    cduHours: "CDU Hours",
    newExpiry: "New Expiry",
    reviewed: "Reviewed",
    reviewerComment: "Reviewer comment",
    cduNotMet: "CDU requirements not met. Please complete the minimum hours.",
    alreadyActive: "You already have an active renewal application.",
    submitSuccess: "Renewal application submitted successfully!",
  },
  "zh-TW": {
    title: "換證狀態",
    subtitle: "申請認證換證並追蹤申請進度",
    applyRenewal: "申請換證",
    eligible: "您符合換證條件！",
    notEligible: "CDU 學分尚未達標",
    hoursCompleted: "小時已完成",
    hoursRemaining: "小時待完成",
    cduBreakdown: "CDU 學分明細",
    typeAClass: "A 類",
    typeBClass: "B 類",
    total: "合計",
    progress: "進度",
    applicationHistory: "申請歷史",
    noApplications: "暫無換證申請記錄",
    renewalApplication: "換證申請",
    cduHours: "CDU 學時",
    newExpiry: "新到期日",
    reviewed: "審核日期",
    reviewerComment: "審核意見",
    cduNotMet: "CDU 學分未達要求，請先完成最低學時。",
    alreadyActive: "您已有進行中的換證申請。",
    submitSuccess: "換證申請已提交成功！",
  },
  "zh-CN": {
    title: "换证状态",
    subtitle: "申请认证换证并追踪申请进度",
    applyRenewal: "申请换证",
    eligible: "您符合换证条件！",
    notEligible: "CDU 学分尚未达标",
    hoursCompleted: "小时已完成",
    hoursRemaining: "小时待完成",
    cduBreakdown: "CDU 学分明细",
    typeAClass: "A 类",
    typeBClass: "B 类",
    total: "合计",
    progress: "进度",
    applicationHistory: "申请历史",
    noApplications: "暂无换证申请记录",
    renewalApplication: "换证申请",
    cduHours: "CDU 学时",
    newExpiry: "新到期日",
    reviewed: "审核日期",
    reviewerComment: "审核意见",
    cduNotMet: "CDU 学分未达要求，请先完成最低学时。",
    alreadyActive: "您已有进行中的换证申请。",
    submitSuccess: "换证申请已提交成功！",
  },
};

export default function RenewalStatusPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const txt = TXT[langKey];
  const { data: certification } = useMyCertification();
  const { data: renewals = [], isLoading } = useMyRenewals(certification?.id);
  const { data: cduRecords = [] } = useMyCduRecords(certification?.id);
  const cduSummary = useCduSummary(certification?.id);
  const createRenewalMutation = useCreateRenewal();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasActiveApplication = renewals.some((renewalItem) => ["submitted", "under_review", "draft"].includes(renewalItem.status));

  const handleApplyRenewal = async () => {
    if (!certification) return;
    if (!cduSummary.isEligibleForRenewal) {
      toast.error(txt.cduNotMet);
      return;
    }
    if (hasActiveApplication) {
      toast.error(txt.alreadyActive);
      return;
    }

    setIsSubmitting(true);
    const approvedCduRecords = cduRecords.filter((record) => record.approval_status === "approved");
    const cduSummaryData = approvedCduRecords.map((record) => ({
      id: record.id,
      title: record.activity_title,
      type: record.activity_type,
      hours: Number(record.cdu_hours),
      date: record.activity_date,
      cdu_type: record.cdu_type,
    }));

    await createRenewalMutation.mutateAsync({
      certification_id: certification.id,
      total_cdu_hours: cduSummary.totalApprovedHours,
      cdu_summary: cduSummaryData,
      organization_id: certification.organization_id || undefined,
    });
    toast.success(txt.submitSuccess);
    setIsSubmitting(false);
  };

  // CDU breakdown percentages
  const totalApproved = cduSummary.totalApprovedHours;
  const minimumRequired = cduSummary.minimumRequired;
  const typeAPercent = totalApproved > 0 ? (cduSummary.typeAHours / totalApproved) * 100 : 0;
  const typeBPercent = totalApproved > 0 ? (cduSummary.typeBHours / totalApproved) * 100 : 0;
  const overallProgress = Math.min(100, cduSummary.progressPercent);

  // Color theme based on progress
  const progressTheme = overallProgress >= 100
    ? { barColor: "bg-emerald-500", textColor: "text-emerald-700", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" }
    : overallProgress >= 50
      ? { barColor: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200" }
      : { barColor: "bg-amber-500", textColor: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200" };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{txt.title}</h1>
          <p className="text-sm text-muted-foreground">{txt.subtitle}</p>
        </div>
        {certification && !hasActiveApplication && (
          <button
            onClick={handleApplyRenewal}
            disabled={isSubmitting || !cduSummary.isEligibleForRenewal}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
            {txt.applyRenewal}
          </button>
        )}
      </div>

      {/* Eligibility + CDU Breakdown */}
      {certification && !hasActiveApplication && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`border rounded-xl p-5 mb-6 ${cduSummary.isEligibleForRenewal ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            {cduSummary.isEligibleForRenewal ? (
              <FileCheck className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            )}
            <div>
              <div className={`font-semibold text-sm ${cduSummary.isEligibleForRenewal ? "text-emerald-700" : "text-amber-700"}`}>
                {cduSummary.isEligibleForRenewal ? txt.eligible : txt.notEligible}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {totalApproved} / {minimumRequired} {txt.hoursCompleted}
                {!cduSummary.isEligibleForRenewal && ` · ${cduSummary.remainingHours} ${txt.hoursRemaining}`}
              </div>
            </div>
          </div>

          {/* A/B CDU Breakdown */}
          <div className="bg-white/60 rounded-lg p-4 border border-white/80">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{txt.cduBreakdown}</span>
            </div>

            {/* Breakdown stats */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-700">{cduSummary.typeAHours}h</div>
                <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {txt.typeAClass}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-700">{cduSummary.typeBHours}h</div>
                <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  {txt.typeBClass}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${progressTheme.textColor}`}>{totalApproved}h</div>
                <div className="text-[10px] text-muted-foreground font-medium">
                  {txt.total} / {minimumRequired}h
                </div>
              </div>
            </div>

            {/* Visual breakdown bar */}
            <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
              {totalApproved > 0 && (
                <>
                  {/* A-type (green) */}
                  <div
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-l-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (cduSummary.typeAHours / minimumRequired) * 100)}%` }}
                  />
                  {/* B-type (blue), starts after A-type */}
                  <div
                    className="absolute top-0 h-full bg-blue-500 transition-all duration-500"
                    style={{
                      left: `${Math.min(100, (cduSummary.typeAHours / minimumRequired) * 100)}%`,
                      width: `${Math.min(100 - (cduSummary.typeAHours / minimumRequired) * 100, (cduSummary.typeBHours / minimumRequired) * 100)}%`,
                    }}
                  />
                </>
              )}
              {/* Target marker at 100% */}
              <div className="absolute top-0 right-0 h-full w-px bg-slate-400" />
            </div>

            {/* Progress label */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{txt.typeAClass}: {cduSummary.typeAHours}h</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />{txt.typeBClass}: {cduSummary.typeBHours}h</span>
              </div>
              <span className={`text-xs font-bold ${progressTheme.textColor}`}>{txt.progress}: {Math.round(overallProgress)}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Renewal History */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground text-sm">{txt.applicationHistory}</h3>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : renewals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {txt.noApplications}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {renewals.map((renewal, index) => {
              const config = RENEWAL_STATUS_CONFIG[renewal.status] || RENEWAL_STATUS_CONFIG.draft;
              const SIcon = config.icon;
              return (
                <motion.div key={renewal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="px-5 py-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor}`}>
                        <SIcon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{txt.renewalApplication}</div>
                        <div className="text-xs text-muted-foreground">{new Date(renewal.application_date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${config.color} ${config.bgColor}`}>
                      <SIcon className="w-3 h-3" />
                      {config.label[langKey]}
                    </span>
                  </div>
                  <div className="ml-11 grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">{txt.cduHours}：</span>
                      <span className="font-medium text-foreground">{Number(renewal.total_cdu_hours)}h</span>
                    </div>
                    {renewal.new_expiry_date && (
                      <div>
                        <span className="text-muted-foreground">{txt.newExpiry}：</span>
                        <span className="font-medium text-foreground">{renewal.new_expiry_date}</span>
                      </div>
                    )}
                    {renewal.reviewed_at && (
                      <div>
                        <span className="text-muted-foreground">{txt.reviewed}：</span>
                        <span className="font-medium text-foreground">{new Date(renewal.reviewed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  {renewal.review_comment && (
                    <div className="ml-11 mt-2 text-xs text-muted-foreground bg-muted/10 rounded-lg p-2.5">
                      {txt.reviewerComment}：{renewal.review_comment}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
