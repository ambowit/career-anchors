import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Plus, X, CheckCircle2, Clock, XCircle, Upload, Filter,
  Zap, FileText, Shield,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useMyCduRecords, useCreateCduRecord, useMyCertification, useCduSummary } from "@/hooks/useCertification";
import { toast } from "sonner";

const ACTIVITY_TYPES = ["training", "workshop", "conference", "supervision", "research", "publication", "teaching"] as const;

function getActivityLabel(type: string, language: string) {
  const labels: Record<string, Record<string, string>> = {
    training: { en: "Training", "zh-TW": "培訓", "zh-CN": "培训" },
    workshop: { en: "Workshop", "zh-TW": "工作坊", "zh-CN": "工作坊" },
    conference: { en: "Conference", "zh-TW": "研討會", "zh-CN": "研讨会" },
    supervision: { en: "Supervision", "zh-TW": "督導", "zh-CN": "督导" },
    research: { en: "Research", "zh-TW": "研究", "zh-CN": "研究" },
    publication: { en: "Publication", "zh-TW": "論文發表", "zh-CN": "论文发表" },
    teaching: { en: "Teaching", "zh-TW": "教學", "zh-CN": "教学" },
  };
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  return labels[type]?.[langKey] || type;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

export default function MyCduRecordsPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: certification } = useMyCertification();
  const { data: records = [], isLoading } = useMyCduRecords(certification?.id);
  const cduSummary = useCduSummary(certification?.id);
  const createMutation = useCreateCduRecord();

  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCduType, setFilterCduType] = useState<string>("all");
  const [formData, setFormData] = useState({
    activity_type: "training" as string,
    activity_title: "",
    activity_provider: "",
    activity_date: new Date().toISOString().split("T")[0],
    start_date: "",
    end_date: "",
    cdu_hours: "",
    proof_document_url: "",
  });

  const filteredRecords = records
    .filter((r) => filterStatus === "all" || r.approval_status === filterStatus)
    .filter((r) => filterCduType === "all" || r.cdu_type === filterCduType);

  const pendingBTypeHours = records
    .filter((r) => r.cdu_type === "B" && r.approval_status === "pending")
    .reduce((s, r) => s + Number(r.cdu_hours), 0);

  const handleSubmit = async () => {
    if (!certification) {
      toast.error({ en: "No active certification found", "zh-TW": "未找到有效認證", "zh-CN": "未找到有效认证" }[langKey]!);
      return;
    }
    if (!formData.activity_title || !formData.cdu_hours) {
      toast.error({ en: "Please fill in all required fields", "zh-TW": "請填寫所有必填項", "zh-CN": "请填写所有必填项" }[langKey]!);
      return;
    }
    await createMutation.mutateAsync({
      certification_id: certification.id,
      user_id: certification.user_id,
      activity_type: formData.activity_type,
      activity_title: formData.activity_title,
      activity_provider: formData.activity_provider || null,
      activity_date: formData.activity_date,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      cdu_hours: parseFloat(formData.cdu_hours),
      proof_document_url: formData.proof_document_url || null,
      cdu_type: "B" as const,
      auto_verified: false,
      course_catalog_id: null,
      organization_id: certification.organization_id,
    });
    toast.success({ en: "B-Type CDU record submitted for review", "zh-TW": "B 類 CDU 記錄已提交審核", "zh-CN": "B 类 CDU 记录已提交审核" }[langKey]!);
    setShowAddModal(false);
    setFormData({ activity_type: "training", activity_title: "", activity_provider: "", activity_date: new Date().toISOString().split("T")[0], start_date: "", end_date: "", cdu_hours: "", proof_document_url: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "My CDU Records", "zh-TW": "我的 CDU 記錄", "zh-CN": "我的 CDU 记录" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "Track your Continuing Development Unit credits (A-type auto-approved, B-type requires review)", "zh-TW": "追蹤您的持續發展單元學分（A 類自動核准，B 類需審核）", "zh-CN": "追踪您的持续发展单元学分（A 类自动核准，B 类需审核）" }[langKey]}
          </p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
          <Plus className="w-4 h-4" />
          {{ en: "Submit B-Type CDU", "zh-TW": "提交 B 類 CDU", "zh-CN": "提交 B 类 CDU" }[langKey]}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: { en: "A-Type Hours", "zh-TW": "A 類學時", "zh-CN": "A 类学时" }[langKey]!, value: `${cduSummary.typeAHours}h`, icon: Zap, color: "text-blue-600", bgColor: "bg-blue-50" },
          { label: { en: "B-Type Hours", "zh-TW": "B 類學時", "zh-CN": "B 类学时" }[langKey]!, value: `${cduSummary.typeBHours}h`, icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50" },
          { label: { en: "B-Type Pending", "zh-TW": "B 類待審核", "zh-CN": "B 类待审核" }[langKey]!, value: `${pendingBTypeHours}h`, icon: Clock, color: "text-amber-600", bgColor: "bg-amber-50" },
          { label: { en: "Total Approved", "zh-TW": "已批准總計", "zh-CN": "已批准总计" }[langKey]!, value: `${cduSummary.totalApprovedHours}h`, icon: CheckCircle2, color: "text-emerald-600", bgColor: "bg-emerald-50" },
          { label: { en: "Required / Remaining", "zh-TW": "需要 / 剩餘", "zh-CN": "需要 / 剩余" }[langKey]!, value: `${cduSummary.minimumRequired}h / ${cduSummary.remainingHours}h`, icon: Shield, color: "text-slate-600", bgColor: "bg-slate-50" },
        ].map((card, index) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-6 h-6 rounded-md ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
            </div>
            <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-foreground">
            {{ en: "Renewal Progress", "zh-TW": "換證進度", "zh-CN": "换证进度" }[langKey]}
          </span>
          <span className="text-muted-foreground">
            {cduSummary.totalApprovedHours} / {cduSummary.minimumRequired} {{ en: "hours", "zh-TW": "學時", "zh-CN": "学时" }[langKey]}
          </span>
        </div>
        <div className="w-full h-3 bg-muted/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${cduSummary.progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${cduSummary.progressPercent >= 100 ? "bg-emerald-500" : cduSummary.progressPercent >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> A {{ en: "Type", "zh-TW": "類", "zh-CN": "类" }[langKey]}: {cduSummary.typeAHours}h</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> B {{ en: "Type", "zh-TW": "類", "zh-CN": "类" }[langKey]}: {cduSummary.typeBHours}h</span>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-1.5">
          {["all", "A", "B"].map((type) => (
            <button key={type} onClick={() => setFilterCduType(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterCduType === type ? "bg-indigo-500 text-white" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}>
              {type === "all" ? { en: "All Types", "zh-TW": "全部類型", "zh-CN": "全部类型" }[langKey]
                : type === "A" ? { en: "A-Type (Auto)", "zh-TW": "A 類（自動）", "zh-CN": "A 类（自动）" }[langKey]
                : { en: "B-Type (Manual)", "zh-TW": "B 類（手動）", "zh-CN": "B 类（手动）" }[langKey]}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === status ? "bg-foreground text-background" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}>
              {status === "all" ? { en: "All Status", "zh-TW": "全部狀態", "zh-CN": "全部状态" }[langKey]
                : status === "pending" ? { en: "Pending", "zh-TW": "待審核", "zh-CN": "待审核" }[langKey]
                : status === "approved" ? { en: "Approved", "zh-TW": "已批准", "zh-CN": "已批准" }[langKey]
                : { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Records Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {{ en: "No CDU records found", "zh-TW": "暫無 CDU 記錄", "zh-CN": "暂无 CDU 记录" }[langKey]}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Activity", "zh-TW": "活動", "zh-CN": "活动" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "CDU Type", "zh-TW": "CDU 類型", "zh-CN": "CDU 类型" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Activity Type", "zh-TW": "活動類型", "zh-CN": "活动类型" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Date", "zh-TW": "日期", "zh-CN": "日期" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Hours", "zh-TW": "學時", "zh-CN": "学时" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Status", "zh-TW": "狀態", "zh-CN": "状态" }[langKey]}</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "Proof", "zh-TW": "證明", "zh-CN": "证明" }[langKey]}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const SIcon = STATUS_ICONS[record.approval_status] || Clock;
                return (
                  <tr key={record.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-foreground">{record.activity_title}</div>
                      {record.activity_provider && <div className="text-xs text-muted-foreground mt-0.5">{record.activity_provider}</div>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${record.cdu_type === "A" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                        {record.cdu_type === "A" && <Zap className="w-3 h-3" />}
                        {record.cdu_type === "A" ? { en: "A-Auto", "zh-TW": "A-自動", "zh-CN": "A-自动" }[langKey] : { en: "B-Manual", "zh-TW": "B-手動", "zh-CN": "B-手动" }[langKey]}
                        {record.auto_verified && <CheckCircle2 className="w-3 h-3 text-blue-500" />}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {getActivityLabel(record.activity_type, language)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground">
                      {record.start_date && record.end_date && record.start_date !== record.end_date
                        ? `${record.start_date} ~ ${record.end_date}`
                        : record.activity_date}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-foreground">{Number(record.cdu_hours)}h</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[record.approval_status]}`}>
                        <SIcon className="w-3 h-3" />
                        {record.approval_status === "pending" ? { en: "Pending", "zh-TW": "待審核", "zh-CN": "待审核" }[langKey]
                          : record.approval_status === "approved" ? { en: "Approved", "zh-TW": "已批准", "zh-CN": "已批准" }[langKey]
                          : { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]}
                      </span>
                      {record.review_comment && (
                        <div className="text-[10px] text-muted-foreground mt-1 max-w-[200px] truncate" title={record.review_comment}>{record.review_comment}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {record.cdu_type === "A" ? (
                        <span className="text-xs text-blue-500 font-medium">{{ en: "Auto-verified", "zh-TW": "自動核驗", "zh-CN": "自动核验" }[langKey]}</span>
                      ) : record.proof_document_url ? (
                        <a href={record.proof_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline">
                          {{ en: "View", "zh-TW": "查看", "zh-CN": "查看" }[langKey]}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Add B-Type CDU Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[560px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{{ en: "Submit B-Type CDU Record", "zh-TW": "提交 B 類 CDU 記錄", "zh-CN": "提交 B 类 CDU 记录" }[langKey]}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {{ en: "External activities require proof documents and manual review", "zh-TW": "外部活動需要提供證明文件並經過人工審核", "zh-CN": "外部活动需要提供证明文件并经过人工审核" }[langKey]}
                  </p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-muted/20 transition-colors"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Activity Type", "zh-TW": "活動類型", "zh-CN": "活动类型" }[langKey]} *</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {ACTIVITY_TYPES.map((type) => (
                      <button key={type} onClick={() => setFormData({ ...formData, activity_type: type })} className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all ${formData.activity_type === type ? "border-purple-500 bg-purple-50 text-purple-700" : "border-border text-muted-foreground hover:border-purple-300"}`}>
                        {getActivityLabel(type, language)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Activity Title", "zh-TW": "活動名稱", "zh-CN": "活动名称" }[langKey]} *</label>
                  <input value={formData.activity_title} onChange={(e) => setFormData({ ...formData, activity_title: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder={{ en: "e.g. External Coaching Certification Program", "zh-TW": "例如：外部教練認證課程", "zh-CN": "例如：外部教练认证课程" }[langKey]} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Provider", "zh-TW": "機構", "zh-CN": "机构" }[langKey]}</label>
                    <input value={formData.activity_provider} onChange={(e) => setFormData({ ...formData, activity_provider: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "CDU Hours", "zh-TW": "CDU 學時", "zh-CN": "CDU 学时" }[langKey]} *</label>
                    <input type="number" step="0.5" min="0.5" value={formData.cdu_hours} onChange={(e) => setFormData({ ...formData, cdu_hours: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder="e.g. 8" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Activity Date", "zh-TW": "活動日期", "zh-CN": "活动日期" }[langKey]} *</label>
                    <input type="date" value={formData.activity_date} onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Start Date", "zh-TW": "開始日期", "zh-CN": "开始日期" }[langKey]}</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "End Date", "zh-TW": "結束日期", "zh-CN": "结束日期" }[langKey]}</label>
                    <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{{ en: "Proof Document URL", "zh-TW": "證明文件連結", "zh-CN": "证明文件链接" }[langKey]}</label>
                  <div className="relative">
                    <input value={formData.proof_document_url} onChange={(e) => setFormData({ ...formData, proof_document_url: e.target.value })} className="w-full px-3 py-2 pr-9 bg-muted/10 border border-border rounded-lg text-sm" placeholder="https://..." />
                    <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {{ en: "Upload certificate, attendance record, or completion letter", "zh-TW": "上傳證書、出勤記錄或完成函", "zh-CN": "上传证书、出勤记录或完成函" }[langKey]}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">{{ en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" }[langKey]}</button>
                <button onClick={handleSubmit} disabled={createMutation.isPending} className="px-5 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50">
                  {createMutation.isPending ? { en: "Submitting...", "zh-TW": "提交中...", "zh-CN": "提交中..." }[langKey] : { en: "Submit for Review", "zh-TW": "提交審核", "zh-CN": "提交审核" }[langKey]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
