import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Mail, Eye, Trash2, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useConsultantClients } from "@/hooks/useAdminData";

export default function ConsultantClientsPage() {
  const { language } = useTranslation();
  const { data: clients, isLoading } = useConsultantClients();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "inactive">("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allClients = clients || [];

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: language === "en" ? "Active" : language === "zh-TW" ? "活躍" : "活跃", color: "bg-emerald-50 text-emerald-600" },
    pending: { label: language === "en" ? "Pending" : language === "zh-TW" ? "待啟用" : "待激活", color: "bg-amber-50 text-amber-600" },
    inactive: { label: language === "en" ? "Inactive" : language === "zh-TW" ? "不活躍" : "不活跃", color: "bg-gray-100 text-gray-500" },
  };

  const filteredClients = allClients.filter((client) => {
    const matchSearch = !searchQuery || (client.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (client.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const clientStatus = client.status || "active";
    const matchStatus = statusFilter === "all" || clientStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCounts = {
    all: allClients.length,
    active: allClients.filter((client) => (client.status || "active") === "active").length,
    pending: allClients.filter((client) => client.status === "pending").length,
    inactive: allClients.filter((client) => client.status === "inactive").length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Client Management" : language === "zh-TW" ? "客戶管理" : "客户管理"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Manage your consulting clients and their assessments" : language === "zh-TW" ? "管理諮詢客戶及其測評" : "管理咨询客户及其测评"}</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
          <UserPlus className="w-4 h-4" />
          {language === "en" ? "Add Client" : language === "zh-TW" ? "新增客戶" : "添加客户"}
        </button>
      </div>

      {/* Stats & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={language === "en" ? "Search by name or email..." : language === "zh-TW" ? "搜尋客戶姓名或信箱..." : "搜索客户姓名或邮箱..."} className="w-full pl-9 pr-4 py-2 bg-muted/10 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
        <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-1">
          {(["all", "active", "pending", "inactive"] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === status ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {statusLabels[status]?.label || (language === "en" ? "All" : language === "zh-TW" ? "全部" : "全部")} ({activeCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/5">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Client" : language === "zh-TW" ? "客戶" : "客户"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Assessments" : language === "zh-TW" ? "測評" : "测评"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Last Anchor" : language === "zh-TW" ? "最近錨點" : "最近锚点"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Last Assessment" : language === "zh-TW" ? "最近測評" : "最近测评"}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Actions" : language === "zh-TW" ? "操作" : "操作"}</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">{language === "en" ? "No clients found" : language === "zh-TW" ? "暫無客戶資料" : "暂无客户数据"}</td></tr>
            ) : filteredClients.map((client) => {
              const clientStatus = (client.status || "active") as keyof typeof statusLabels;
              const statusInfo = statusLabels[clientStatus] || statusLabels.active;
              const displayName = client.full_name || client.email || "—";
              return (
                <tr key={client.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{displayName[0]}</div>
                      <div>
                        <div className="text-sm font-medium text-foreground">{displayName}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-foreground font-medium">{client.assessmentCount || 0}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{client.lastAnchor || "—"}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{formatDate(client.lastAssessmentDate)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"><Eye className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"><Mail className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Add Client Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[440px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{language === "en" ? "Add Client" : language === "zh-TW" ? "新增客戶" : "添加客户"}</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Name" : language === "zh-TW" ? "姓名" : "姓名"} *</label>
                  <input type="text" className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder={language === "en" ? "Client name" : language === "zh-TW" ? "客戶姓名" : "客户姓名"} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱"} *</label>
                  <input type="email" className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder={language === "en" ? "Client email" : language === "zh-TW" ? "客戶信箱" : "客户邮箱"} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Notes" : language === "zh-TW" ? "備註" : "备注"}</label>
                  <textarea className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm h-20 resize-none" placeholder={language === "en" ? "Optional notes about this client" : language === "zh-TW" ? "關於客戶的備註資訊（可選）" : "关于客户的备注信息（可选）"} />
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border text-emerald-500" />
                  {language === "en" ? "Send invitation email" : language === "zh-TW" ? "發送邀請郵件" : "发送邀请邮件"}
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}</button>
                <button onClick={() => setShowAddModal(false)} className="px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">{language === "en" ? "Add Client" : language === "zh-TW" ? "新增客戶" : "添加客户"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
