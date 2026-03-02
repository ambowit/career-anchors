import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, CheckCircle2, Clock, XCircle, X, ThumbsUp, ThumbsDown, FileText } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useOrgRenewals, useReviewRenewal } from "@/hooks/useCertification";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function RenewalApprovalPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { organizationId } = usePermissions();
  const { data: renewals = [], isLoading } = useOrgRenewals();
  const reviewMutation = useReviewRenewal();
  const [filterStatus, setFilterStatus] = useState<string>("submitted");
  const [profileMap, setProfileMap] = useState<Record<string, { full_name: string; email: string }>>({});
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    const userIds = [...new Set(renewals.map((r) => r.user_id))];
    if (userIds.length === 0) return;
    supabase.from("profiles").select("id, full_name, email").in("id", userIds).then(({ data }) => {
      const map: Record<string, { full_name: string; email: string }> = {};
      (data || []).forEach((p: { id: string; full_name: string; email: string }) => { map[p.id] = p; });
      setProfileMap(map);
    });
  }, [renewals]);

  const filteredRenewals = renewals.filter((r) => filterStatus === "all" || r.status === filterStatus);
  const pendingCount = renewals.filter((r) => r.status === "submitted" || r.status === "under_review").length;

  const handleReview = async (renewal: typeof renewals[0], decision: "approved" | "rejected") => {
    await reviewMutation.mutateAsync({
      renewalId: renewal.id,
      certificationId: renewal.certification_id,
      decision,
      comment: reviewComment,
      organizationId: organizationId || undefined,
    });
    toast.success(decision === "approved"
      ? { en: "Renewal approved — new certification cycle started", "zh-TW": "換證已批准 — 新認證周期已開始", "zh-CN": "换证已批准 — 新认证周期已开始" }[langKey]!
      : { en: "Renewal rejected", "zh-TW": "換證已駁回", "zh-CN": "换证已驳回" }[langKey]!);
    setShowDetailModal(null);
    setReviewComment("");
  };

  const selectedRenewal = renewals.find((r) => r.id === showDetailModal);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{{ en: "Renewal Approval", "zh-TW": "換證審核", "zh-CN": "换证审核" }[langKey]}</h1>
          <p className="text-sm text-muted-foreground">{{ en: "Review and approve certification renewal applications", "zh-TW": "審核並批准認證換證申請", "zh-CN": "审核并批准认证换证申请" }[langKey]}</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium">
            <Clock className="w-4 h-4" /> {pendingCount} {{ en: "pending", "zh-TW": "項待審核", "zh-CN": "项待审核" }[langKey]}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mb-4">
        {["submitted", "under_review", "approved", "rejected", "all"].map((status) => {
          const labels: Record<string, string> = { submitted: { en: "Submitted", "zh-TW": "已提交", "zh-CN": "已提交" }[langKey]!, under_review: { en: "Under Review", "zh-TW": "審核中", "zh-CN": "审核中" }[langKey]!, approved: { en: "Approved", "zh-TW": "已通過", "zh-CN": "已通过" }[langKey]!, rejected: { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]!, all: { en: "All", "zh-TW": "全部", "zh-CN": "全部" }[langKey]! };
          return (
            <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === status ? "bg-sky-500 text-white" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}>
              {labels[status]}
            </button>
          );
        })}
      </div>

      {/* Renewals List */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
        ) : filteredRenewals.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {{ en: "No renewal applications found", "zh-TW": "暫無換證申請", "zh-CN": "暂无换证申请" }[langKey]}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredRenewals.map((renewal) => {
              const profile = profileMap[renewal.user_id];
              const isPending = renewal.status === "submitted" || renewal.status === "under_review";
              return (
                <div key={renewal.id} className="px-5 py-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm flex-shrink-0">
                        {(profile?.full_name || "?")[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{profile?.full_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {{ en: "Submitted", "zh-TW": "提交於", "zh-CN": "提交于" }[langKey]} {new Date(renewal.application_date).toLocaleDateString()} · {Number(renewal.total_cdu_hours)}h CDU
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowDetailModal(renewal.id)} className="px-3 py-1 rounded-lg text-xs font-medium bg-muted/10 text-muted-foreground hover:bg-muted/20 transition-colors">
                        {{ en: "Details", "zh-TW": "詳情", "zh-CN": "详情" }[langKey]}
                      </button>
                      {isPending && (
                        <>
                          <button onClick={() => handleReview(renewal, "approved")} disabled={reviewMutation.isPending} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setShowDetailModal(renewal.id); }} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                      {!isPending && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${renewal.status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {renewal.status === "approved" ? { en: "Approved", "zh-TW": "已通過", "zh-CN": "已通过" }[langKey] : { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedRenewal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowDetailModal(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[560px] shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">{{ en: "Renewal Application Details", "zh-TW": "換證申請詳情", "zh-CN": "换证申请详情" }[langKey]}</h3>
                <button onClick={() => setShowDetailModal(null)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="space-y-4">
                <div className="bg-muted/5 rounded-lg p-4">
                  <div className="text-xs text-muted-foreground mb-1">{{ en: "Applicant", "zh-TW": "申請人", "zh-CN": "申请人" }[langKey]}</div>
                  <div className="text-sm font-medium text-foreground">{profileMap[selectedRenewal.user_id]?.full_name || "—"}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/5 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">{{ en: "Total CDU Hours", "zh-TW": "CDU 總學時", "zh-CN": "CDU 总学时" }[langKey]}</div>
                    <div className="text-lg font-bold text-foreground">{Number(selectedRenewal.total_cdu_hours)}h</div>
                  </div>
                  <div className="bg-muted/5 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">{{ en: "Application Date", "zh-TW": "申請日期", "zh-CN": "申请日期" }[langKey]}</div>
                    <div className="text-sm font-medium text-foreground">{new Date(selectedRenewal.application_date).toLocaleDateString()}</div>
                  </div>
                </div>

                {/* CDU Summary */}
                {Array.isArray(selectedRenewal.cdu_summary) && (selectedRenewal.cdu_summary as Array<{ title: string; type: string; hours: number; date: string }>).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> {{ en: "CDU Activities", "zh-TW": "CDU 活動", "zh-CN": "CDU 活动" }[langKey]}
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {(selectedRenewal.cdu_summary as Array<{ title: string; type: string; hours: number; date: string }>).map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-xs bg-muted/5 rounded-lg px-3 py-2">
                          <span className="text-foreground">{item.title}</span>
                          <span className="text-muted-foreground font-medium">{item.hours}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Section */}
                {(selectedRenewal.status === "submitted" || selectedRenewal.status === "under_review") && (
                  <div className="border-t border-border pt-4">
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Review Comment", "zh-TW": "審核意見", "zh-CN": "审核意见" }[langKey]}</label>
                    <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm resize-none" placeholder={{ en: "Optional comment...", "zh-TW": "選填審核意見...", "zh-CN": "选填审核意见..." }[langKey]} />
                    <div className="flex justify-end gap-2 mt-3">
                      <button onClick={() => handleReview(selectedRenewal, "rejected")} disabled={reviewMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" /> {{ en: "Reject", "zh-TW": "駁回", "zh-CN": "驳回" }[langKey]}
                      </button>
                      <button onClick={() => handleReview(selectedRenewal, "approved")} disabled={reviewMutation.isPending} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> {{ en: "Approve", "zh-TW": "批准", "zh-CN": "批准" }[langKey]}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
