import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, X, CheckCircle2, Clock, XCircle, AlertCircle, Send, ArrowRight, Loader2, Award } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import {
  useActiveCertificateTypes,
  useMyCertificationApplications,
  useCreateCertificationApplication,
} from "@/hooks/useCertification";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ElementType; label: Record<string, string> }> = {
  draft: { color: "text-slate-600", bgColor: "bg-slate-50 border-slate-200", icon: FileText, label: { en: "Draft", "zh-TW": "草稿", "zh-CN": "草稿" } },
  submitted: { color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200", icon: Send, label: { en: "Submitted", "zh-TW": "已提交", "zh-CN": "已提交" } },
  under_review: { color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200", icon: Clock, label: { en: "Under Review", "zh-TW": "審核中", "zh-CN": "审核中" } },
  sent_to_gcqa: { color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200", icon: ArrowRight, label: { en: "Sent to GCQA", "zh-TW": "已送 GCQA", "zh-CN": "已送 GCQA" } },
  certificate_issuing: { color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200", icon: Award, label: { en: "Issuing", "zh-TW": "發證中", "zh-CN": "发证中" } },
  approved: { color: "text-emerald-600", bgColor: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, label: { en: "Approved", "zh-TW": "已通過", "zh-CN": "已通过" } },
  rejected: { color: "text-red-600", bgColor: "bg-red-50 border-red-200", icon: XCircle, label: { en: "Rejected", "zh-TW": "已退件", "zh-CN": "已退件" } },
  withdrawn: { color: "text-slate-500", bgColor: "bg-slate-50 border-slate-200", icon: AlertCircle, label: { en: "Withdrawn", "zh-TW": "已撤回", "zh-CN": "已撤回" } },
};

const STATUS_FLOW = ["submitted", "under_review", "sent_to_gcqa", "certificate_issuing", "approved"];

interface ApplicationForm {
  certificateTypeId: string;
  firstNameEn: string;
  lastNameEn: string;
  fullNameZh: string;
  yearsExperience: string;
  highestDegree: string;
  specialization: string;
  motivation: string;
}

const EMPTY_FORM: ApplicationForm = {
  certificateTypeId: "",
  firstNameEn: "",
  lastNameEn: "",
  fullNameZh: "",
  yearsExperience: "",
  highestDegree: "",
  specialization: "",
  motivation: "",
};

export default function CertificationApplicationPage() {
  const { language } = useTranslation();
  const { profile } = useAuth();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";

  const { data: certificateTypes = [] } = useActiveCertificateTypes();
  const { data: myApplications = [], isLoading } = useMyCertificationApplications();
  const createMutation = useCreateCertificationApplication();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [form, setForm] = useState<ApplicationForm>(EMPTY_FORM);
  const [showDetailId, setShowDetailId] = useState<string | null>(null);

  const selectedCertType = certificateTypes.find((ct) => ct.id === form.certificateTypeId);

  const handleSubmit = async () => {
    if (!form.certificateTypeId || !form.firstNameEn || !form.lastNameEn || !form.fullNameZh) {
      toast.error({ en: "Please fill all required fields", "zh-TW": "請填寫所有必填欄位", "zh-CN": "请填写所有必填字段" }[langKey]!);
      return;
    }

    const certType = certificateTypes.find((ct) => ct.id === form.certificateTypeId);
    if (!certType) return;

    // Check for existing pending/in-review application for same cert type
    const existingActive = myApplications.find(
      (app) =>
        app.certificate_type_id === form.certificateTypeId &&
        ["submitted", "under_review", "sent_to_gcqa", "certificate_issuing"].includes(app.status)
    );
    if (existingActive) {
      toast.error({ en: "You already have an active application for this certificate type", "zh-TW": "您已有此證照類型的進行中申請", "zh-CN": "您已有此证照类型的进行中申请" }[langKey]!);
      return;
    }

    await createMutation.mutateAsync({
      certificateTypeId: form.certificateTypeId,
      certificationType: certType.cert_code,
      firstNameEn: form.firstNameEn,
      lastNameEn: form.lastNameEn,
      fullNameZh: form.fullNameZh,
      applicationData: {
        years_experience: form.yearsExperience,
        highest_degree: form.highestDegree,
        specialization: form.specialization,
        motivation: form.motivation,
      },
    });

    toast.success({ en: "Application submitted successfully!", "zh-TW": "申請已成功提交！", "zh-CN": "申请已成功提交！" }[langKey]!);
    setShowApplyModal(false);
    setForm(EMPTY_FORM);
  };

  const detailApp = myApplications.find((app) => app.id === showDetailId);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "Certification Application", "zh-TW": "認證申請", "zh-CN": "认证申请" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "Apply for professional certification and track your application status", "zh-TW": "申請專業認證並追蹤申請狀態", "zh-CN": "申请专业认证并跟踪申请状态" }[langKey]}
          </p>
        </div>
        <button
          onClick={() => {
            setForm({
              ...EMPTY_FORM,
              fullNameZh: profile?.full_name || "",
            });
            setShowApplyModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {{ en: "New Application", "zh-TW": "新申請", "zh-CN": "新申请" }[langKey]}
        </button>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      ) : myApplications.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16 bg-card border border-border rounded-2xl">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {{ en: "No Applications Yet", "zh-TW": "尚無申請", "zh-CN": "尚无申请" }[langKey]}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {{ en: "Start your certification journey by submitting an application for SCPC, SCPS, or ELF certification.", "zh-TW": "提交 SCPC、SCPS 或 ELF 認證申請，開始您的認證之旅。", "zh-CN": "提交 SCPC、SCPS 或 ELF 认证申请，开始您的认证之旅。" }[langKey]}
          </p>
          <button
            onClick={() => {
              setForm({ ...EMPTY_FORM, fullNameZh: profile?.full_name || "" });
              setShowApplyModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {{ en: "Submit Your First Application", "zh-TW": "提交您的第一個申請", "zh-CN": "提交您的第一个申请" }[langKey]}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {myApplications.map((app, index) => {
            const statusConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
            const StatusIcon = statusConf.icon;
            const certType = certificateTypes.find((ct) => ct.id === app.certificate_type_id);
            const certLabel = certType
              ? langKey === "en"
                ? certType.cert_name_en
                : langKey === "zh-TW"
                ? certType.cert_name_zh_tw || certType.cert_name_en
                : certType.cert_name_zh_cn || certType.cert_name_en
              : app.certification_type || "—";

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => setShowDetailId(app.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusConf.bgColor} border`}>
                      <StatusIcon className={`w-5 h-5 ${statusConf.color}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{certLabel}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {certType?.cert_code || ""} &middot; {app.first_name_en} {app.last_name_en} &middot; {new Date(app.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border font-medium ${statusConf.bgColor} ${statusConf.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConf.label[langKey]}
                  </span>
                </div>

                {/* Status flow visualization */}
                {["submitted", "under_review", "sent_to_gcqa", "certificate_issuing"].includes(app.status) && (
                  <div className="flex items-center gap-1 mt-4 px-2">
                    {STATUS_FLOW.map((step, stepIndex) => {
                      const currentIndex = STATUS_FLOW.indexOf(app.status);
                      const isCompleted = stepIndex < currentIndex;
                      const isCurrent = stepIndex === currentIndex;
                      const stepConf = STATUS_CONFIG[step];
                      return (
                        <div key={step} className="flex items-center gap-1 flex-1">
                          <div className={`h-1.5 flex-1 rounded-full ${isCompleted ? "bg-emerald-400" : isCurrent ? "bg-blue-400" : "bg-slate-200"}`} />
                          {stepIndex < STATUS_FLOW.length - 1 && <div className="w-0.5" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {app.review_comment && app.status === "rejected" && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    <span className="font-medium">{{ en: "Review Comment", "zh-TW": "審核意見", "zh-CN": "审核意见" }[langKey]}:</span> {app.review_comment}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Application Detail Modal */}
      <AnimatePresence>
        {showDetailId && detailApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowDetailId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-[520px] shadow-xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">
                  {{ en: "Application Details", "zh-TW": "申請詳情", "zh-CN": "申请详情" }[langKey]}
                </h3>
                <button onClick={() => setShowDetailId(null)} className="p-1 rounded-lg hover:bg-muted/20">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Status Banner */}
              {(() => {
                const sc = STATUS_CONFIG[detailApp.status] || STATUS_CONFIG.draft;
                const SI = sc.icon;
                return (
                  <div className={`p-4 rounded-xl border mb-5 ${sc.bgColor}`}>
                    <div className="flex items-center gap-3">
                      <SI className={`w-6 h-6 ${sc.color}`} />
                      <div>
                        <div className={`text-lg font-bold ${sc.color}`}>{sc.label[langKey]}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {{ en: "Submitted", "zh-TW": "提交時間", "zh-CN": "提交时间" }[langKey]}: {detailApp.submitted_at ? new Date(detailApp.submitted_at).toLocaleString() : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Application Info */}
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/5 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">{{ en: "First Name (EN)", "zh-TW": "名 (英文)", "zh-CN": "名 (英文)" }[langKey]}</div>
                    <div className="font-medium text-foreground">{detailApp.first_name_en || "—"}</div>
                  </div>
                  <div className="bg-muted/5 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">{{ en: "Last Name (EN)", "zh-TW": "姓 (英文)", "zh-CN": "姓 (英文)" }[langKey]}</div>
                    <div className="font-medium text-foreground">{detailApp.last_name_en || "—"}</div>
                  </div>
                </div>
                <div className="bg-muted/5 p-3 rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">{{ en: "Chinese Name", "zh-TW": "中文姓名", "zh-CN": "中文姓名" }[langKey]}</div>
                  <div className="font-medium text-foreground">{detailApp.full_name_zh || "—"}</div>
                </div>
                {detailApp.application_data && (
                  <div className="space-y-2">
                    {Object.entries(detailApp.application_data).map(([key, value]) => (
                      <div key={key} className="bg-muted/5 p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">{key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</div>
                        <div className="font-medium text-foreground text-xs">{String(value) || "—"}</div>
                      </div>
                    ))}
                  </div>
                )}
                {detailApp.review_comment && (
                  <div className={`p-3 rounded-lg border ${detailApp.status === "rejected" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}>
                    <div className="text-xs font-medium mb-1 text-muted-foreground">
                      {{ en: "Reviewer Comment", "zh-TW": "審核意見", "zh-CN": "审核意见" }[langKey]}
                    </div>
                    <div className="text-sm text-foreground">{detailApp.review_comment}</div>
                    {detailApp.reviewed_at && (
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {new Date(detailApp.reviewed_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button onClick={() => setShowDetailId(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {{ en: "Close", "zh-TW": "關閉", "zh-CN": "关闭" }[langKey]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Application Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
            onClick={() => setShowApplyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 w-[560px] shadow-xl max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-foreground">
                  {{ en: "New Certification Application", "zh-TW": "新認證申請", "zh-CN": "新认证申请" }[langKey]}
                </h3>
                <button onClick={() => setShowApplyModal(false)} className="p-1 rounded-lg hover:bg-muted/20">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Certificate Type */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    {{ en: "Certificate Type", "zh-TW": "證照類型", "zh-CN": "证照类型" }[langKey]} *
                  </label>
                  <select
                    value={form.certificateTypeId}
                    onChange={(e) => setForm({ ...form, certificateTypeId: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm"
                  >
                    <option value="">{{ en: "Select...", "zh-TW": "選擇...", "zh-CN": "选择..." }[langKey]}</option>
                    {certificateTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>
                        {ct.cert_code} — {langKey === "en" ? ct.cert_name_en : langKey === "zh-TW" ? (ct.cert_name_zh_tw || ct.cert_name_en) : (ct.cert_name_zh_cn || ct.cert_name_en)}
                      </option>
                    ))}
                  </select>
                  {selectedCertType && (
                    <div className="mt-1.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                      {{ en: "Renewal cycle", "zh-TW": "換證週期", "zh-CN": "换证周期" }[langKey]}: {selectedCertType.renewal_cycle_years} {{ en: "years", "zh-TW": "年", "zh-CN": "年" }[langKey]}
                      &nbsp;&middot;&nbsp;
                      {{ en: "Min CDU", "zh-TW": "最低 CDU", "zh-CN": "最低 CDU" }[langKey]}: {selectedCertType.minimum_cdu_hours}h
                    </div>
                  )}
                </div>

                {/* Names */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "First Name (EN)", "zh-TW": "名 (英文)", "zh-CN": "名 (英文)" }[langKey]} *</label>
                    <input value={form.firstNameEn} onChange={(e) => setForm({ ...form, firstNameEn: e.target.value })} placeholder="John" className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Last Name (EN)", "zh-TW": "姓 (英文)", "zh-CN": "姓 (英文)" }[langKey]} *</label>
                    <input value={form.lastNameEn} onChange={(e) => setForm({ ...form, lastNameEn: e.target.value })} placeholder="Doe" className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Chinese Name", "zh-TW": "中文姓名", "zh-CN": "中文姓名" }[langKey]} *</label>
                  <input value={form.fullNameZh} onChange={(e) => setForm({ ...form, fullNameZh: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                </div>

                <div className="border-t border-border pt-4">
                  <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                    {{ en: "Professional Background", "zh-TW": "專業背景", "zh-CN": "专业背景" }[langKey]}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Years of Experience", "zh-TW": "從業年資", "zh-CN": "从业年资" }[langKey]}</label>
                      <input type="number" value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Highest Degree", "zh-TW": "最高學歷", "zh-CN": "最高学历" }[langKey]}</label>
                      <input value={form.highestDegree} onChange={(e) => setForm({ ...form, highestDegree: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Specialization", "zh-TW": "專業領域", "zh-CN": "专业领域" }[langKey]}</label>
                  <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder={{ en: "Career counseling, HR management...", "zh-TW": "職涯諮詢、人力資源管理...", "zh-CN": "职业咨询、人力资源管理..." }[langKey]} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Motivation", "zh-TW": "申請動機", "zh-CN": "申请动机" }[langKey]}</label>
                  <textarea value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} rows={3} placeholder={{ en: "Why do you want to obtain this certification?", "zh-TW": "請說明您為什麼想取得此認證", "zh-CN": "请说明您为什么想取得此认证" }[langKey]} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm resize-none" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={() => setShowApplyModal(false)} className="px-4 py-2 text-sm text-muted-foreground">
                  {{ en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" }[langKey]}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {{ en: "Submit Application", "zh-TW": "提交申請", "zh-CN": "提交申请" }[langKey]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
