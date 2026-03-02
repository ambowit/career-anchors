import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, Plus, Search, Edit3, Trash2, X, Lock, Calendar, Loader2, Save, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { useConsultantNotes, useConsultantClients, useCreateNote, useUpdateNote, useDeleteNote } from "@/hooks/useAdminData";

type ModalMode = "add" | "edit" | "delete" | null;

export default function ConsultantNotesPage() {
  const { language } = useTranslation();
  const { data: rawNotes, isLoading } = useConsultantNotes();
  const { data: rawClients } = useConsultantClients();
  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterClient, setFilterClient] = useState("all");
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [formData, setFormData] = useState({ id: "", clientId: "", assessmentId: "", content: "", isInternal: true });
  const [deletingNote, setDeletingNote] = useState<{ id: string; clientName: string } | null>(null);

  const notes = rawNotes || [];
  const clients = rawClients || [];

  const uniqueClients = [...new Map(notes.map((note) => [note.client_id, note.clientName || note.client_id])).entries()];

  const filteredNotes = notes.filter((note) => {
    const matchSearch = !searchQuery || (note.content || "").toLowerCase().includes(searchQuery.toLowerCase()) || (note.clientName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchClient = filterClient === "all" || note.client_id === filterClient;
    return matchSearch && matchClient;
  });

  const openAdd = () => {
    setFormData({ id: "", clientId: clients[0]?.id || "", assessmentId: "", content: "", isInternal: true });
    setModalMode("add");
  };

  const openEdit = (note: typeof notes[0]) => {
    setFormData({ id: note.id, clientId: note.client_id, assessmentId: note.assessment_id || "", content: note.content || "", isInternal: note.is_internal ?? true });
    setModalMode("edit");
  };

  const openDelete = (note: typeof notes[0]) => {
    setDeletingNote({ id: note.id, clientName: note.clientName || "" });
    setModalMode("delete");
  };

  const handleSave = async () => {
    if (!formData.content.trim() || !formData.clientId) {
      toast.error(language === "en" ? "Client and content are required" : language === "zh-TW" ? "請選擇客戶並填寫內容" : "请选择客户并填写内容");
      return;
    }
    if (modalMode === "add") {
      await createMutation.mutateAsync({
        client_id: formData.clientId,
        assessment_id: formData.assessmentId || null,
        content: formData.content.trim(),
        is_internal: formData.isInternal,
      });
      toast.success(language === "en" ? "Note created" : language === "zh-TW" ? "筆記已建立" : "笔记已创建");
    } else if (modalMode === "edit") {
      await updateMutation.mutateAsync({
        id: formData.id,
        content: formData.content.trim(),
        is_internal: formData.isInternal,
        assessment_id: formData.assessmentId || null,
      });
      toast.success(language === "en" ? "Note updated" : language === "zh-TW" ? "筆記已更新" : "笔记已更新");
    }
    setModalMode(null);
  };

  const handleDelete = async () => {
    if (!deletingNote) return;
    await deleteMutation.mutateAsync(deletingNote.id);
    toast.success(language === "en" ? "Note deleted" : language === "zh-TW" ? "筆記已刪除" : "笔记已删除");
    setDeletingNote(null);
    setModalMode(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Consultation Notes" : language === "zh-TW" ? "諮詢筆記" : "咨询笔记"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Private consultation notes for your clients" : language === "zh-TW" ? "客戶諮詢私人筆記" : "客户咨询私人笔记"}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors">
          <Plus className="w-4 h-4" /> {language === "en" ? "New Note" : language === "zh-TW" ? "新增筆記" : "新建笔记"}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={language === "en" ? "Search notes..." : language === "zh-TW" ? "搜尋筆記內容..." : "搜索笔记内容..."} className="w-full pl-9 pr-4 py-2 bg-muted/10 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
        </div>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm text-foreground">
          <option value="all">{language === "en" ? "All Clients" : language === "zh-TW" ? "所有客戶" : "所有客户"}</option>
          {uniqueClients.map(([clientId, clientName]) => (
            <option key={clientId} value={clientId}>{clientName}</option>
          ))}
        </select>
      </div>

      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <StickyNote className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{language === "en" ? "No notes found" : language === "zh-TW" ? "暫無筆記" : "暂无笔记"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note, index) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="bg-card border border-border rounded-xl p-5 hover:border-emerald-200 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{(note.clientName || "?")[0]}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{note.clientName || "—"}</span>
                      {note.is_internal && (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">
                          <Lock className="w-2.5 h-2.5" /> {language === "en" ? "Internal" : language === "zh-TW" ? "內部" : "内部"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{note.assessmentLabel || ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(note)} className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => openDelete(note)} className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">{note.content}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {language === "en" ? "Created" : language === "zh-TW" ? "建立" : "创建"}: {formatDate(note.created_at)}</div>
                {note.updated_at && note.updated_at !== note.created_at && (
                  <div className="flex items-center gap-1"><Edit3 className="w-3 h-3" /> {language === "en" ? "Updated" : "更新"}: {formatDate(note.updated_at)}</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Note Modal */}
      <AnimatePresence>
        {(modalMode === "add" || modalMode === "edit") && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-card border border-border rounded-2xl p-6 w-[520px] shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">{modalMode === "edit" ? (language === "en" ? "Edit Note" : language === "zh-TW" ? "編輯筆記" : "编辑笔记") : (language === "en" ? "New Note" : language === "zh-TW" ? "新增筆記" : "新建笔记")}</h3>
                <button onClick={() => setModalMode(null)} className="p-1 rounded-lg hover:bg-muted/20"><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Client" : language === "zh-TW" ? "客戶" : "客户"} *</label>
                  <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })} disabled={modalMode === "edit"} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm disabled:opacity-60">
                    <option value="">{language === "en" ? "-- Select Client --" : language === "zh-TW" ? "-- 選擇客戶 --" : "-- 选择客户 --"}</option>
                    {clients.map((client) => <option key={client.id} value={client.id}>{client.full_name || client.email}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">{language === "en" ? "Note Content" : language === "zh-TW" ? "筆記內容" : "笔记内容"} *</label>
                  <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-3 py-2 bg-muted/10 border border-border rounded-lg text-sm h-32 resize-none" placeholder={language === "en" ? "Write your consultation notes here..." : language === "zh-TW" ? "在此輸入諮詢筆記..." : "在此输入咨询笔记..."} />
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={formData.isInternal} onChange={(e) => setFormData({ ...formData, isInternal: e.target.checked })} className="w-4 h-4 rounded border-border text-emerald-500" />
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  {language === "en" ? "Internal note (client cannot see)" : language === "zh-TW" ? "內部筆記（客戶不可見）" : "内部笔记（客户不可见）"}
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{language === "en" ? "Cancel" : "取消"}</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isSaving ? (language === "en" ? "Saving..." : language === "zh-TW" ? "儲存中..." : "保存中...") : modalMode === "edit" ? (language === "en" ? "Save Changes" : language === "zh-TW" ? "儲存變更" : "保存更改") : (language === "en" ? "Create Note" : language === "zh-TW" ? "建立筆記" : "创建笔记")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {modalMode === "delete" && deletingNote && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setModalMode(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-500" /></div>
                <h2 className="text-lg font-semibold text-foreground">{language === "en" ? "Delete Note" : language === "zh-TW" ? "刪除筆記" : "删除笔记"}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {language === "en" ? `Delete the note for "${deletingNote.clientName}"? This cannot be undone.` : language === "zh-TW" ? `確定要刪除關於「${deletingNote.clientName}」的筆記嗎？此操作不可撤銷。` : `确定要删除关于「${deletingNote.clientName}」的笔记吗？此操作不可撤销。`}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setModalMode(null)} className="px-4 py-2 text-sm text-muted-foreground">{language === "en" ? "Cancel" : "取消"}</button>
                <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg disabled:opacity-50">
                  {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleteMutation.isPending ? (language === "en" ? "Deleting..." : language === "zh-TW" ? "刪除中..." : "删除中...") : (language === "en" ? "Delete" : language === "zh-TW" ? "刪除" : "删除")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
