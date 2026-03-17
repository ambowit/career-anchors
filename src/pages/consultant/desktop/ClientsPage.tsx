import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, UserPlus, Mail, Eye, Trash2, X, Loader2, Pencil, Users, AlertTriangle, StickyNote, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import {
  useConsultantClients,
  useCreateConsultantClient,
  useCreateConsultantClientsBulk,
  useUpdateConsultantClient,
  useDeleteConsultantClient,
  useConsultantNotes,
} from "@/hooks/useAdminData";
import { toast } from "sonner";

type ModalMode = "add" | "edit" | "delete" | "bulk" | "notes" | null;

interface ClientForm {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
  status: string;
}

const EMPTY_FORM: ClientForm = { id: "", fullName: "", email: "", phone: "", notes: "", status: "active" };

export default function ConsultantClientsPage() {
  const { language } = useTranslation();
  const { data: clients, isLoading } = useConsultantClients();
  const { data: allNotes } = useConsultantNotes();
  const createMutation = useCreateConsultantClient();
  const bulkCreateMutation = useCreateConsultantClientsBulk();
  const updateMutation = useUpdateConsultantClient();
  const deleteMutation = useDeleteConsultantClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "inactive">("all");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState<ClientForm>(EMPTY_FORM);
  const [deletingClient, setDeletingClient] = useState<{ id: string; name: string } | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [viewingNotesClientId, setViewingNotesClientId] = useState<string | null>(null);
  const [viewingNotesClientName, setViewingNotesClientName] = useState("");

  const t3 = (en: string, zhTw: string, zhCn: string) => language === "en" ? en : language === "zh-TW" ? zhTw : zhCn;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const allClients = clients || [];

  const statusLabels: Record<string, { label: string; color: string }> = {
    active: { label: t3("Active", "活躍", "活跃"), color: "bg-emerald-50 text-emerald-600" },
    pending: { label: t3("Pending", "待啟用", "待激活"), color: "bg-amber-50 text-amber-600" },
    inactive: { label: t3("Inactive", "不活躍", "不活跃"), color: "bg-gray-100 text-gray-500" },
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

  const openAdd = () => {
    setFormData(EMPTY_FORM);
    setModalMode("add");
  };

  const openEdit = (client: typeof allClients[0]) => {
    setFormData({
      id: client.id,
      fullName: client.full_name || "",
      email: client.email || "",
      phone: (client as any).phone || "",
      notes: "",
      status: client.status || "active",
    });
    setModalMode("edit");
  };

  const openDelete = (client: typeof allClients[0]) => {
    setDeletingClient({ id: client.id, name: client.full_name || client.email || "" });
    setModalMode("delete");
  };

  const openBulk = () => {
    setBulkText("");
    setModalMode("bulk");
  };

  const openNotes = (client: typeof allClients[0]) => {
    setViewingNotesClientId(client.id);
    setViewingNotesClientName(client.full_name || client.email || "");
    setModalMode("notes");
  };

  // Get notes count per client
  const notesCountMap = new Map<string, number>();
  (allNotes || []).forEach((note) => {
    notesCountMap.set(note.client_id, (notesCountMap.get(note.client_id) || 0) + 1);
  });

  const handleSave = async () => {
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error(t3("Name and email are required", "姓名和信箱為必填", "姓名和邮箱为必填"));
      return;
    }
    try {
      if (modalMode === "add") {
        await createMutation.mutateAsync({
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          notes: formData.notes.trim(),
        });
        toast.success(t3("Client added", "客戶已新增", "客户已添加"));
      } else if (modalMode === "edit") {
        await updateMutation.mutateAsync({
          id: formData.id,
          full_name: formData.fullName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          status: formData.status,
        });
        toast.success(t3("Client updated", "客戶已更新", "客户已更新"));
      }
      setModalMode(null);
    } catch (error: any) {
      toast.error(error.message || t3("Operation failed", "操作失敗", "操作失败"));
    }
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    try {
      await deleteMutation.mutateAsync(deletingClient.id);
      toast.success(t3("Client removed", "客戶已移除", "客户已移除"));
      setModalMode(null);
      setDeletingClient(null);
    } catch (error: any) {
      toast.error(error.message || t3("Delete failed", "刪除失敗", "删除失败"));
    }
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.trim().split("\n").filter(Boolean);
    const parsedClients: { full_name: string; email: string }[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(/[,\t]/).map((part) => part.trim());
      if (parts.length < 2) {
        errors.push(`${t3("Line", "第", "第")} ${index + 1}: ${t3("needs name and email", "需要姓名和信箱", "需要姓名和邮箱")}`);
        return;
      }
      const [name, email] = parts;
      if (!name || !email || !email.includes("@")) {
        errors.push(`${t3("Line", "第", "第")} ${index + 1}: ${t3("invalid format", "格式不正確", "格式不正确")}`);
        return;
      }
      parsedClients.push({ full_name: name, email });
    });

    if (errors.length > 0) {
      toast.error(errors.slice(0, 3).join("; "));
      return;
    }

    if (parsedClients.length === 0) {
      toast.error(t3("No valid entries found", "未找到有效條目", "未找到有效条目"));
      return;
    }

    try {
      await bulkCreateMutation.mutateAsync(parsedClients);
      toast.success(t3(`${parsedClients.length} clients added`, `已新增 ${parsedClients.length} 位客戶`, `已添加 ${parsedClients.length} 位客户`));
      setModalMode(null);
    } catch (error: any) {
      toast.error(error.message || t3("Bulk add failed", "批量新增失敗", "批量添加失败"));
    }
  };

  const clientNotes = (allNotes || []).filter((note) => note.client_id === viewingNotesClientId);

  const isSaving = createMutation.isPending || updateMutation.isPending || bulkCreateMutation.isPending;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{t3("Client Management", "客戶管理", "客户管理")}</h1>
          <p className="text-sm text-muted-foreground">{t3("Manage your consulting clients and their assessments", "管理諮詢客戶及其測評", "管理咨询客户及其测评")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openBulk} className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-muted/20 transition-colors">
            <Users className="w-4 h-4" />
            {t3("Bulk Add", "批量新增", "批量添加")}
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
            <UserPlus className="w-4 h-4" />
            {t3("Add Client", "新增客戶", "添加客户")}
          </button>
        </div>
      </div>

      {/* Stats & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t3("Search by name or email...", "搜尋客戶姓名或信箱...", "搜索客户姓名或邮箱...")} className="w-full pl-9 pr-4 py-2 bg-muted/10 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
        <div className="flex items-center gap-1 bg-muted/10 rounded-lg p-1">
          {(["all", "active", "pending", "inactive"] as const).map((status) => (
            <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === status ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {statusLabels[status]?.label || t3("All", "全部", "全部")} ({activeCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Client Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/5">
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t3("Client", "客戶", "客户")}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t3("Assessments", "測評", "测评")}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t3("Last Anchor", "最近錨點", "最近锚点")}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t3("Notes", "筆記", "笔记")}</th>
              <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t3("Status", "狀態", "状态")}</th>
              <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{t3("Actions", "操作", "操作")}</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-sm text-muted-foreground">{t3("No clients found", "暫無客戶資料", "暂无客户数据")}</td></tr>
            ) : filteredClients.map((client) => {
              const clientStatus = (client.status || "active") as keyof typeof statusLabels;
              const statusInfo = statusLabels[clientStatus] || statusLabels.active;
              const displayName = client.full_name || client.email || "—";
              const noteCount = notesCountMap.get(client.id) || 0;
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
                  <td className="px-5 py-4">
                    <button onClick={() => openNotes(client)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-600 transition-colors">
                      <StickyNote className="w-3.5 h-3.5" />
                      <span>{noteCount}</span>
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => openEdit(client)} className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors" title={t3("Edit", "編輯", "编辑")}><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => openNotes(client)} className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors" title={t3("Notes", "筆記", "笔记")}><StickyNote className="w-4 h-4" /></button>
                      <button onClick={() => openDelete(client)} className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-red-500 transition-colors" title={t3("Remove", "移除", "移除")}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </motion.div>

      {/* Add / Edit Client Modal */}
      <AnimatePresence>
        {(modalMode === "add" || modalMode === "edit") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[440px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{modalMode === "edit" ? t3("Edit Client", "編輯客戶", "编辑客户") : t3("Add Client", "新增客戶", "添加客户")}</h3>
                <button onClick={() => setModalMode(null)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t3("Name", "姓名", "姓名")} *</label>
                  <input type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder={t3("Client name", "客戶姓名", "客户姓名")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t3("Email", "信箱", "邮箱")} *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder={t3("Client email", "客戶信箱", "客户邮箱")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{t3("Phone", "電話", "电话")}</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm" placeholder={t3("Phone number (optional)", "電話號碼（可選）", "电话号码（可选）")} />
                </div>
                {modalMode === "edit" && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">{t3("Status", "狀態", "状态")}</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm">
                      <option value="active">{t3("Active", "活躍", "活跃")}</option>
                      <option value="pending">{t3("Pending", "待啟用", "待激活")}</option>
                      <option value="inactive">{t3("Inactive", "不活躍", "不活跃")}</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t3("Cancel", "取消", "取消")}</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modalMode === "edit" ? t3("Save Changes", "儲存變更", "保存更改") : t3("Add Client", "新增客戶", "添加客户")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Add Modal */}
      <AnimatePresence>
        {modalMode === "bulk" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[520px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">{t3("Bulk Add Clients", "批量新增客戶", "批量添加客户")}</h3>
                <button onClick={() => setModalMode(null)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {t3(
                  "Enter one client per line in the format: Name, Email",
                  "每行輸入一位客戶，格式：姓名, 信箱",
                  "每行输入一位客户，格式：姓名, 邮箱"
                )}
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm font-mono h-48 resize-none"
                placeholder={`張小明, xiaoming@example.com\n李美玲, meiling@example.com\nWang Wei, wangwei@example.com`}
              />
              <div className="text-xs text-muted-foreground mt-2">
                {t3(
                  "Supports comma or tab separated values. Lines with errors will be skipped.",
                  "支持逗號或 Tab 分隔。格式錯誤的行會被略過。",
                  "支持逗号或 Tab 分隔。格式错误的行会被跳过。"
                )}
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t3("Cancel", "取消", "取消")}</button>
                <button onClick={handleBulkAdd} disabled={isSaving || !bulkText.trim()} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Users className="w-4 h-4" />
                  {t3("Add All", "全部新增", "全部添加")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {modalMode === "delete" && deletingClient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <h2 className="text-lg font-semibold text-foreground">{t3("Remove Client", "移除客戶", "移除客户")}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {t3(
                  `Remove "${deletingClient.name}" from your client list? This will unlink the client from your account.`,
                  `確定要將「${deletingClient.name}」從您的客戶名單中移除嗎？此操作將解除客戶關聯。`,
                  `确定要将「${deletingClient.name}」从您的客户列表中移除吗？此操作将解除客户关联。`
                )}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{t3("Cancel", "取消", "取消")}</button>
                <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t3("Remove", "移除", "移除")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client Notes Drawer */}
      <AnimatePresence>
        {modalMode === "notes" && viewingNotesClientId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[520px] max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{t3("Client Notes", "客戶筆記", "客户笔记")}</h3>
                  <p className="text-sm text-muted-foreground">{viewingNotesClientName}</p>
                </div>
                <button onClick={() => setModalMode(null)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              {clientNotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t3("No notes for this client", "此客戶暫無筆記", "此客户暂无笔记")}</p>
                  <p className="text-xs mt-1">{t3("Add notes from the Notes page", "可在諮詢筆記頁面新增", "可在咨询笔记页面新增")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clientNotes.map((note) => (
                    <div key={note.id} className="border border-border rounded-lg p-4">
                      <p className="text-sm text-foreground/80 leading-relaxed">{note.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        {note.is_internal && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-medium">{t3("Internal", "內部", "内部")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
