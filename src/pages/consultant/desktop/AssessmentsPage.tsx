import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Send, Search, Calendar, CheckCircle2, Clock, X, Bell, Loader2, Save } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { useConsultantAssessments, useConsultantClients, useCreateAssignment } from "@/hooks/useAdminData";

export default function ConsultantAssessmentsPage() {
  const { language } = useTranslation();
  const { data: rawAssessments, isLoading } = useConsultantAssessments();
  const { data: rawClients } = useConsultantClients();
  const createMutation = useCreateAssignment();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({ clientId: "", version: "SCPC v1.4", dueDate: "", notes: "" });

  const assessments = rawAssessments || [];
  const clients = rawClients || [];

  const statusMap: Record<string, { label: string; color: string }> = {
    completed: { label: language === "en" ? "Completed" : "已完成", color: "bg-emerald-50 text-emerald-600" },
    in_progress: { label: language === "en" ? "In Progress" : language === "zh-TW" ? "進行中" : "进行中", color: "bg-blue-50 text-blue-600" },
    pending: { label: language === "en" ? "Pending" : language === "zh-TW" ? "待開始" : "待开始", color: "bg-amber-50 text-amber-600" },
    expired: { label: language === "en" ? "Expired" : language === "zh-TW" ? "已過期" : "已过期", color: "bg-red-50 text-red-500" },
    cancelled: { label: language === "en" ? "Cancelled" : "已取消", color: "bg-gray-50 text-gray-500" },
  };

  const filteredAssessments = assessments.filter((assessment) => {
    const matchSearch = !searchQuery || (assessment.clientName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || assessment.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts: Record<string, number> = {
    all: assessments.length,
    completed: assessments.filter((a) => a.status === "completed").length,
    in_progress: assessments.filter((a) => a.status === "in_progress").length,
    pending: assessments.filter((a) => a.status === "pending").length,
    expired: assessments.filter((a) => a.status === "expired").length,
  };

  const stats = [
    { label: language === "en" ? "Total Assigned" : language === "zh-TW" ? "已派發" : "已派发", value: assessments.length, icon: ClipboardList, color: "#3b82f6" },
    { label: language === "en" ? "Completed" : "已完成", value: statusCounts.completed, icon: CheckCircle2, color: "#10b981" },
    { label: language === "en" ? "In Progress" : language === "zh-TW" ? "進行中" : "进行中", value: statusCounts.in_progress, icon: Clock, color: "#f59e0b" },
    { label: language === "en" ? "Pending" : language === "zh-TW" ? "待開始" : "待开始", value: statusCounts.pending, icon: Calendar, color: "#8b5cf6" },
  ];

  const handleAssign = async () => {
    if (!assignForm.clientId || !assignForm.dueDate) {
      toast.error(language === "en" ? "Client and due date are required" : language === "zh-TW" ? "請選擇客戶和截止日期" : "请选择客户和截止日期");
      return;
    }
    await createMutation.mutateAsync({
      assigned_to: assignForm.clientId,
      assessment_version: assignForm.version,
      due_date: new Date(assignForm.dueDate).toISOString(),
      notes: assignForm.notes,
    });
    toast.success(language === "en" ? "Assessment assigned" : language === "zh-TW" ? "測評派發成功" : "测评派发成功");
    setShowAssignModal(false);
    setAssignForm({ clientId: "", version: "SCPC v1.4", dueDate: "", notes: "" });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Assessment Management" : language === "zh-TW" ? "測評管理" : "测评管理"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Assign and track client assessments" : language === "zh-TW" ? "派發和追蹤客戶測評" : "派发和跟踪客户测评"}</p>
        </div>
        <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
          <Send className="w-4 h-4" /> {language === "en" ? "Assign Assessment" : language === "zh-TW" ? "派發測評" : "派发测评"}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-6">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={language === "en" ? "Search by client name..." : language === "zh-TW" ? "搜尋客戶姓名..." : "搜索客户姓名..."} className="w-full pl-9 pr-4 py-2 bg-muted/10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
        <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-1">
          {(["all", "completed", "in_progress", "pending", "expired"] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === status ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {status === "all" ? (language === "en" ? "All" : "全部") : statusMap[status]?.label || status} ({statusCounts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-border bg-muted/5">
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Client" : language === "zh-TW" ? "客戶" : "客户"}</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Version" : "版本"}</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Assigned" : language === "zh-TW" ? "派發日期" : "派发日期"}</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Due" : "截止日期"}</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Actions" : "操作"}</th>
          </tr></thead>
          <tbody>
            {filteredAssessments.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">{language === "en" ? "No assessments found" : language === "zh-TW" ? "暫無測評資料" : "暂无测评数据"}</td></tr>
            ) : filteredAssessments.map((assessment) => {
              const statusInfo = statusMap[assessment.status || ""] || statusMap.pending;
              return (
                <tr key={assessment.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{(assessment.clientName || "?")[0]}</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{assessment.clientName || "—"}</div>
                        <div className="text-xs text-muted-foreground">{assessment.clientEmail || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{assessment.assessment_version || "—"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(assessment.created_at)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(assessment.due_date)}</td>
                  <td className="px-5 py-4"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span></td>
                  <td className="px-5 py-4 text-right">
                    {(assessment.status === "pending" || assessment.status === "in_progress") && (
                      <button className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-amber-500 transition-colors" title={language === "en" ? "Send Reminder" : language === "zh-TW" ? "傳送提醒" : "发送提醒"}>
                        <Bell className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Assign Modal */}
      <AnimatePresence>
        {showAssignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAssignModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[460px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{language === "en" ? "Assign Assessment" : language === "zh-TW" ? "派發測評" : "派发测评"}</h3>
                <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Select Client" : language === "zh-TW" ? "選擇客戶" : "选择客户"} *</label>
                  <select value={assignForm.clientId} onChange={(e) => setAssignForm({ ...assignForm, clientId: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm">
                    <option value="">{language === "en" ? "-- Select Client --" : language === "zh-TW" ? "-- 選擇客戶 --" : "-- 选择客户 --"}</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.full_name || client.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Assessment Version" : language === "zh-TW" ? "測評版本" : "测评版本"}</label>
                  <select value={assignForm.version} onChange={(e) => setAssignForm({ ...assignForm, version: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm">
                    <option>SCPC v1.4</option>
                    <option>SCPC v1.3</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Due Date" : "截止日期"} *</label>
                  <input type="date" value={assignForm.dueDate} onChange={(e) => setAssignForm({ ...assignForm, dueDate: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Notes" : language === "zh-TW" ? "備註" : "备注"}</label>
                  <textarea value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm h-16 resize-none" placeholder={language === "en" ? "Optional notes for the client" : language === "zh-TW" ? "給客戶的備註資訊（可選）" : "给客户的备注信息（可选）"} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{language === "en" ? "Cancel" : "取消"}</button>
                <button onClick={handleAssign} disabled={createMutation.isPending} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {createMutation.isPending ? (language === "en" ? "Assigning..." : language === "zh-TW" ? "派發中..." : "派发中...") : (language === "en" ? "Assign" : language === "zh-TW" ? "派發" : "派发")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
