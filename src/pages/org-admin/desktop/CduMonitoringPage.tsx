import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, CheckCircle2, Clock, XCircle, Search, ThumbsUp, ThumbsDown,
  Filter, Zap, FileText, Shield,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useOrgCduRecords, useReviewCduRecord, useBatchReviewCdu, type CduRecord } from "@/hooks/useCertification";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function getActivityLabel(type: string, langKey: string) {
  const labels: Record<string, Record<string, string>> = {
    training: { en: "Training", "zh-TW": "培訓", "zh-CN": "培训" },
    workshop: { en: "Workshop", "zh-TW": "工作坊", "zh-CN": "工作坊" },
    conference: { en: "Conference", "zh-TW": "研討會", "zh-CN": "研讨会" },
    supervision: { en: "Supervision", "zh-TW": "督導", "zh-CN": "督导" },
    research: { en: "Research", "zh-TW": "研究", "zh-CN": "研究" },
    publication: { en: "Publication", "zh-TW": "論文發表", "zh-CN": "论文发表" },
    teaching: { en: "Teaching", "zh-TW": "教學", "zh-CN": "教学" },
  };
  return labels[type]?.[langKey] || type;
}

export default function CduMonitoringPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { organizationId } = usePermissions();
  const { data: records = [], isLoading } = useOrgCduRecords();
  const reviewMutation = useReviewCduRecord();
  const batchReviewMutation = useBatchReviewCdu();

  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<"approved" | "rejected">("approved");
  const [batchComment, setBatchComment] = useState("");
  const [profileMap, setProfileMap] = useState<Record<string, { full_name: string; email: string }>>({});

  useEffect(() => {
    const userIds = [...new Set(records.map((r) => r.user_id))];
    if (userIds.length === 0) return;
    supabase.from("profiles").select("id, full_name, email").in("id", userIds).then(({ data }) => {
      const map: Record<string, { full_name: string; email: string }> = {};
      (data || []).forEach((p: { id: string; full_name: string; email: string }) => { map[p.id] = p; });
      setProfileMap(map);
    });
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => filterStatus === "all" || r.approval_status === filterStatus)
      .filter((r) => filterType === "all" || r.cdu_type === filterType)
      .filter((r) => {
        if (!searchTerm) return true;
        const profile = profileMap[r.user_id];
        const term = searchTerm.toLowerCase();
        return (profile?.full_name || "").toLowerCase().includes(term) || r.activity_title.toLowerCase().includes(term);
      });
  }, [records, filterStatus, filterType, searchTerm, profileMap]);

  const stats = useMemo(() => {
    const pending = records.filter((r) => r.approval_status === "pending");
    const pendingB = pending.filter((r) => r.cdu_type === "B");
    const typeA = records.filter((r) => r.cdu_type === "A");
    return { pending: pending.length, pendingB: pendingB.length, typeA: typeA.length, total: records.length };
  }, [records]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingFilteredIds = filteredRecords.filter((r) => r.approval_status === "pending" && r.cdu_type === "B").map((r) => r.id);
    if (pendingFilteredIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingFilteredIds));
    }
  };

  const handleReview = async (recordId: string, decision: "approved" | "rejected") => {
    await reviewMutation.mutateAsync({ recordId, decision, comment: reviewComment, organizationId: organizationId || undefined });
    toast.success(decision === "approved"
      ? { en: "CDU record approved", "zh-TW": "CDU 記錄已批准", "zh-CN": "CDU 记录已批准" }[langKey]!
      : { en: "CDU record rejected", "zh-TW": "CDU 記錄已駁回", "zh-CN": "CDU 记录已驳回" }[langKey]!);
    setReviewingId(null);
    setReviewComment("");
  };

  const handleBatchReview = async () => {
    if (selectedIds.size === 0) return;
    await batchReviewMutation.mutateAsync({
      recordIds: Array.from(selectedIds),
      decision: batchAction,
      comment: batchComment || undefined,
      organizationId: organizationId || undefined,
    });
    toast.success(
      batchAction === "approved"
        ? { en: `${selectedIds.size} records approved`, "zh-TW": `${selectedIds.size} 筆記錄已批准`, "zh-CN": `${selectedIds.size} 条记录已批准` }[langKey]!
        : { en: `${selectedIds.size} records rejected`, "zh-TW": `${selectedIds.size} 筆記錄已駁回`, "zh-CN": `${selectedIds.size} 条记录已驳回` }[langKey]!
    );
    setSelectedIds(new Set());
    setShowBatchModal(false);
    setBatchComment("");
  };

  const pendingBInFiltered = filteredRecords.filter((r) => r.approval_status === "pending" && r.cdu_type === "B");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{{ en: "CDU Monitoring", "zh-TW": "CDU 監控", "zh-CN": "CDU 监控" }[langKey]}</h1>
          <p className="text-sm text-muted-foreground">{{ en: "Review and approve CDU credit records for your organization", "zh-TW": "審核並批准機構內的 CDU 學分記錄", "zh-CN": "审核并批准机构内的 CDU 学分记录" }[langKey]}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: { en: "Total Records", "zh-TW": "總記錄", "zh-CN": "总记录" }[langKey]!, value: stats.total, icon: BookOpen, color: "text-slate-600" },
          { label: { en: "Pending Review", "zh-TW": "待審核", "zh-CN": "待审核" }[langKey]!, value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: { en: "Pending B-Type", "zh-TW": "待審 B 類", "zh-CN": "待审 B 类" }[langKey]!, value: stats.pendingB, icon: FileText, color: "text-purple-600" },
          { label: { en: "A-Type (Auto)", "zh-TW": "A 類（自動）", "zh-CN": "A 类（自动）" }[langKey]!, value: stats.typeA, icon: Zap, color: "text-blue-600" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={{ en: "Search...", "zh-TW": "搜尋...", "zh-CN": "搜索..." }[langKey]} className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-muted-foreground mr-1" />
          {["pending", "approved", "rejected", "all"].map((status) => (
            <button key={status} onClick={() => setFilterStatus(status)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === status ? "bg-sky-500 text-white" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}>
              {status === "all" ? { en: "All", "zh-TW": "全部", "zh-CN": "全部" }[langKey]
                : status === "pending" ? { en: "Pending", "zh-TW": "待審核", "zh-CN": "待审核" }[langKey]
                : status === "approved" ? { en: "Approved", "zh-TW": "已批准", "zh-CN": "已批准" }[langKey]
                : { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          {["all", "A", "B"].map((type) => (
            <button key={type} onClick={() => setFilterType(type)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === type ? "bg-indigo-500 text-white" : "bg-muted/10 text-muted-foreground hover:bg-muted/20"}`}>
              {type === "all" ? { en: "All Types", "zh-TW": "全部類型", "zh-CN": "全部类型" }[langKey]
                : type === "A" ? { en: "A-Type", "zh-TW": "A 類", "zh-CN": "A 类" }[langKey]
                : { en: "B-Type", "zh-TW": "B 類", "zh-CN": "B 类" }[langKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4 px-4 py-3 bg-sky-50 border border-sky-200 rounded-xl">
          <span className="text-sm font-medium text-sky-700">
            {{ en: `${selectedIds.size} selected`, "zh-TW": `已選擇 ${selectedIds.size} 項`, "zh-CN": `已选择 ${selectedIds.size} 项` }[langKey]}
          </span>
          <div className="flex-1" />
          <button onClick={() => { setBatchAction("approved"); setShowBatchModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" />
            {{ en: "Batch Approve", "zh-TW": "批次核准", "zh-CN": "批量批准" }[langKey]}
          </button>
          <button onClick={() => { setBatchAction("rejected"); setShowBatchModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors">
            <ThumbsDown className="w-3.5 h-3.5" />
            {{ en: "Batch Reject", "zh-TW": "批次駁回", "zh-CN": "批量驳回" }[langKey]}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {{ en: "Clear", "zh-TW": "清除", "zh-CN": "清除" }[langKey]}
          </button>
        </motion.div>
      )}

      {/* Records */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {{ en: "No CDU records found", "zh-TW": "暫無 CDU 記錄", "zh-CN": "暂无 CDU 记录" }[langKey]}
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {/* Select All Header for pending B-type */}
            {filterStatus === "pending" && pendingBInFiltered.length > 0 && (
              <div className="flex items-center gap-3 px-5 py-2.5 bg-muted/5 border-b border-border">
                <input type="checkbox" checked={pendingBInFiltered.length > 0 && pendingBInFiltered.every((r) => selectedIds.has(r.id))} onChange={toggleSelectAll} className="rounded border-border" />
                <span className="text-xs font-medium text-muted-foreground">
                  {{ en: "Select all pending B-type", "zh-TW": "全選待審 B 類", "zh-CN": "全选待审 B 类" }[langKey]}
                  ({pendingBInFiltered.length})
                </span>
              </div>
            )}
            {filteredRecords.map((record) => {
              const profile = profileMap[record.user_id];
              const isReviewing = reviewingId === record.id;
              const isPendingBType = record.approval_status === "pending" && record.cdu_type === "B";
              return (
                <div key={record.id} className="px-5 py-4 hover:bg-muted/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {isPendingBType && (
                        <input type="checkbox" checked={selectedIds.has(record.id)} onChange={() => toggleSelection(record.id)} className="rounded border-border flex-shrink-0" />
                      )}
                      <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-sm flex-shrink-0">
                        {(profile?.full_name || "?")[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{record.activity_title}</span>
                          <span className={`inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${record.cdu_type === "A" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                            {record.cdu_type === "A" && <Zap className="w-2.5 h-2.5" />}
                            {record.cdu_type}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">{profile?.full_name || "—"} · {getActivityLabel(record.activity_type, langKey)} · {record.activity_date}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-bold text-foreground">{Number(record.cdu_hours)}h</span>
                      {record.approval_status === "pending" && record.cdu_type === "B" ? (
                        <div className="flex items-center gap-1.5">
                          {isReviewing ? (
                            <div className="flex items-center gap-2">
                              <input value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder={{ en: "Comment (optional)", "zh-TW": "備註（選填）", "zh-CN": "备注（选填）" }[langKey]} className="px-2 py-1 bg-muted/10 border border-border rounded text-xs w-40" />
                              <button onClick={() => handleReview(record.id, "approved")} disabled={reviewMutation.isPending} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleReview(record.id, "rejected")} disabled={reviewMutation.isPending} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { setReviewingId(null); setReviewComment(""); }} className="text-xs text-muted-foreground hover:text-foreground">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => setReviewingId(record.id)} className="px-3 py-1 rounded-lg bg-sky-50 text-sky-600 text-xs font-medium hover:bg-sky-100 transition-colors">
                              {{ en: "Review", "zh-TW": "審核", "zh-CN": "审核" }[langKey]}
                            </button>
                          )}
                        </div>
                      ) : record.approval_status === "pending" && record.cdu_type === "A" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {{ en: "Auto-verified", "zh-TW": "自動核驗", "zh-CN": "自动核验" }[langKey]}
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${record.approval_status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {record.approval_status === "approved" ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
                          {record.approval_status === "approved" ? { en: "Approved", "zh-TW": "已批准", "zh-CN": "已批准" }[langKey] : { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]}
                        </span>
                      )}
                    </div>
                  </div>
                  {record.proof_document_url && (
                    <div className="ml-12 mt-1.5">
                      <a href={record.proof_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-600 hover:underline">
                        {{ en: "View proof document", "zh-TW": "查看證明文件", "zh-CN": "查看证明文件" }[langKey]} →
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Batch Review Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowBatchModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {batchAction === "approved"
                  ? { en: "Batch Approve B-Type CDU", "zh-TW": "批次核准 B 類 CDU", "zh-CN": "批量批准 B 类 CDU" }[langKey]
                  : { en: "Batch Reject B-Type CDU", "zh-TW": "批次駁回 B 類 CDU", "zh-CN": "批量驳回 B 类 CDU" }[langKey]}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {{ en: `${selectedIds.size} records will be ${batchAction}`, "zh-TW": `${selectedIds.size} 筆記錄將被${batchAction === "approved" ? "批准" : "駁回"}`, "zh-CN": `${selectedIds.size} 条记录将被${batchAction === "approved" ? "批准" : "驳回"}` }[langKey]}
              </p>
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {{ en: "Comment (optional)", "zh-TW": "備註（選填）", "zh-CN": "备注（选填）" }[langKey]}
                </label>
                <textarea value={batchComment} onChange={(e) => setBatchComment(e.target.value)} rows={3} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm resize-none" />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowBatchModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {{ en: "Cancel", "zh-TW": "取消", "zh-CN": "取消" }[langKey]}
                </button>
                <button
                  onClick={handleBatchReview}
                  disabled={batchReviewMutation.isPending}
                  className={`px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${batchAction === "approved" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"}`}
                >
                  {batchReviewMutation.isPending
                    ? { en: "Processing...", "zh-TW": "處理中...", "zh-CN": "处理中..." }[langKey]
                    : { en: "Confirm", "zh-TW": "確認", "zh-CN": "确认" }[langKey]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
