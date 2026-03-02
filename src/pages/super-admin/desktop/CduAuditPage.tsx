import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Search, CheckCircle2, Clock, XCircle,
  ThumbsUp, ThumbsDown, Filter, Shield, Zap, FileText,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useAllCduRecords, useBatchReviewCdu, type CduRecord } from "@/hooks/useCertification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

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

export default function CduAuditPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: records = [], isLoading } = useAllCduRecords();
  const batchReviewMutation = useBatchReviewCdu();

  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchComment, setBatchComment] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<"approved" | "rejected">("approved");
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
        return (
          (profile?.full_name || "").toLowerCase().includes(term) ||
          (profile?.email || "").toLowerCase().includes(term) ||
          r.activity_title.toLowerCase().includes(term)
        );
      });
  }, [records, filterStatus, filterType, searchTerm, profileMap]);

  const stats = useMemo(() => {
    const pending = records.filter((r) => r.approval_status === "pending");
    const typeA = records.filter((r) => r.cdu_type === "A");
    const typeB = records.filter((r) => r.cdu_type === "B");
    const pendingBType = pending.filter((r) => r.cdu_type === "B");
    return {
      total: records.length,
      pending: pending.length,
      typeA: typeA.length,
      typeB: typeB.length,
      pendingBType: pendingBType.length,
      totalHours: records.filter((r) => r.approval_status === "approved").reduce((s, r) => s + Number(r.cdu_hours), 0),
    };
  }, [records]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pendingFilteredIds = filteredRecords.filter((r) => r.approval_status === "pending").map((r) => r.id);
    if (pendingFilteredIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingFilteredIds));
    }
  };

  const handleBatchReview = async () => {
    if (selectedIds.size === 0) return;
    await batchReviewMutation.mutateAsync({
      recordIds: Array.from(selectedIds),
      decision: batchAction,
      comment: batchComment || undefined,
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

  const pendingInSelection = filteredRecords.filter((r) => r.approval_status === "pending");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {{ en: "CDU Audit Center", "zh-TW": "CDU 審核中心", "zh-CN": "CDU 审核中心" }[langKey]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {{ en: "Review and manage all CDU records across the platform", "zh-TW": "審核和管理平台所有 CDU 記錄", "zh-CN": "审核和管理平台所有 CDU 记录" }[langKey]}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: { en: "Total Records", "zh-TW": "總記錄", "zh-CN": "总记录" }[langKey]!, value: stats.total, icon: BookOpen, color: "text-slate-600" },
          { label: { en: "Pending Review", "zh-TW": "待審核", "zh-CN": "待审核" }[langKey]!, value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: { en: "A-Type (Auto)", "zh-TW": "A 類（自動）", "zh-CN": "A 类（自动）" }[langKey]!, value: stats.typeA, icon: Zap, color: "text-blue-600" },
          { label: { en: "B-Type (Manual)", "zh-TW": "B 類（手動）", "zh-CN": "B 类（手动）" }[langKey]!, value: stats.typeB, icon: FileText, color: "text-purple-600" },
          { label: { en: "Approved Hours", "zh-TW": "已批准學時", "zh-CN": "已批准学时" }[langKey]!, value: `${stats.totalHours}h`, icon: Shield, color: "text-emerald-600" },
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
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={{ en: "Search by name, email, activity...", "zh-TW": "搜尋姓名、信箱、活動...", "zh-CN": "搜索姓名、邮箱、活动..." }[langKey]} className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm" />
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
          <button
            onClick={() => { setBatchAction("approved"); setShowBatchModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            {{ en: "Batch Approve", "zh-TW": "批次核准", "zh-CN": "批量批准" }[langKey]}
          </button>
          <button
            onClick={() => { setBatchAction("rejected"); setShowBatchModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            {{ en: "Batch Reject", "zh-TW": "批次駁回", "zh-CN": "批量驳回" }[langKey]}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {{ en: "Clear", "zh-TW": "清除", "zh-CN": "清除" }[langKey]}
          </button>
        </motion.div>
      )}

      {/* Records Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full" /></div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {{ en: "No CDU records found", "zh-TW": "暫無 CDU 記錄", "zh-CN": "暂无 CDU 记录" }[langKey]}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/5">
                {filterStatus === "pending" && (
                  <th className="w-10 px-3 py-3">
                    <input type="checkbox" checked={pendingInSelection.length > 0 && pendingInSelection.every((r) => selectedIds.has(r.id))} onChange={toggleSelectAll} className="rounded border-border" />
                  </th>
                )}
                <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{{ en: "User", "zh-TW": "使用者", "zh-CN": "用户" }[langKey]}</th>
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
                const profile = profileMap[record.user_id];
                return (
                  <tr key={record.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                    {filterStatus === "pending" && (
                      <td className="w-10 px-3 py-3">
                        {record.approval_status === "pending" && (
                          <input type="checkbox" checked={selectedIds.has(record.id)} onChange={() => toggleSelection(record.id)} className="rounded border-border" />
                        )}
                      </td>
                    )}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold text-xs flex-shrink-0">
                          {(profile?.full_name || "?")[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">{profile?.full_name || "—"}</div>
                          <div className="text-[10px] text-muted-foreground">{profile?.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-sm font-medium text-foreground max-w-[200px] truncate">{record.activity_title}</div>
                      {record.activity_provider && <div className="text-[10px] text-muted-foreground">{record.activity_provider}</div>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${record.cdu_type === "A" ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
                        {record.cdu_type === "A" && <Zap className="w-3 h-3" />}
                        {record.cdu_type === "A" ? "A" : "B"}
                        {record.auto_verified && (
                          <CheckCircle2 className="w-3 h-3 text-blue-500" />
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                        {getActivityLabel(record.activity_type, langKey)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{record.activity_date}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-foreground">{Number(record.cdu_hours)}h</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[record.approval_status]}`}>
                        {record.approval_status === "pending" ? <Clock className="w-3 h-3" /> : record.approval_status === "approved" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {record.approval_status === "pending" ? { en: "Pending", "zh-TW": "待審核", "zh-CN": "待审核" }[langKey]
                          : record.approval_status === "approved" ? { en: "Approved", "zh-TW": "已批准", "zh-CN": "已批准" }[langKey]
                          : { en: "Rejected", "zh-TW": "已駁回", "zh-CN": "已驳回" }[langKey]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {record.proof_document_url ? (
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

      {/* Batch Review Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowBatchModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {batchAction === "approved"
                  ? { en: "Batch Approve CDU Records", "zh-TW": "批次核准 CDU 記錄", "zh-CN": "批量批准 CDU 记录" }[langKey]
                  : { en: "Batch Reject CDU Records", "zh-TW": "批次駁回 CDU 記錄", "zh-CN": "批量驳回 CDU 记录" }[langKey]}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {{ en: `${selectedIds.size} records will be ${batchAction}`, "zh-TW": `${selectedIds.size} 筆記錄將被${batchAction === "approved" ? "批准" : "駁回"}`, "zh-CN": `${selectedIds.size} 条记录将被${batchAction === "approved" ? "批准" : "驳回"}` }[langKey]}
              </p>
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  {{ en: "Comment (optional)", "zh-TW": "備註（選填）", "zh-CN": "备注（选填）" }[langKey]}
                </label>
                <textarea value={batchComment} onChange={(e) => setBatchComment(e.target.value)} rows={3} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm resize-none" placeholder={{ en: "Add a review comment...", "zh-TW": "添加審核備註...", "zh-CN": "添加审核备注..." }[langKey]} />
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
                    : batchAction === "approved"
                      ? { en: "Confirm Approve", "zh-TW": "確認批准", "zh-CN": "确认批准" }[langKey]
                      : { en: "Confirm Reject", "zh-TW": "確認駁回", "zh-CN": "确认驳回" }[langKey]}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
