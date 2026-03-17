import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Send,
  Mail,
  MailOpen,
  Clock,
  Search,
  X,
  Bell,
  FileText,
  ClipboardList,
  AlertCircle,
  Plus,
  Building2,
  Users,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useInboxMessages, useSentMessages, useUnreadCount, useMarkAsRead, type Message } from "@/hooks/useMessages";
import { useOrgUsers, useOrgDepartments } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  system: { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-100" },
  notification: { icon: Bell, color: "text-sky-600", bg: "bg-sky-50" },
  personal: { icon: Mail, color: "text-blue-600", bg: "bg-blue-50" },
  report_share: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  assessment_assign: { icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
  reminder: { icon: Clock, color: "text-red-600", bg: "bg-red-50" },
};

function RecipientSelect({ value, onChange, isEn }: { value: string; onChange: (v: string) => void; isEn: boolean }) {
  const { language } = useTranslation();
  const { data: orgUsers = [] } = useOrgUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const selectedUser = orgUsers.find((u) => u.id === value);
  const filtered = orgUsers.filter(
    (u) => !searchTerm || (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-sky-500/30 flex items-center justify-between"
      >
        <span className={selectedUser ? "text-foreground" : "text-muted-foreground"}>
          {selectedUser ? `${selectedUser.full_name || selectedUser.email}` : (language === "en" ? "Select recipient..." : language === "zh-TW" ? "選擇收件人..." : "选择收件人...")}
        </span>
        <Users className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-border">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === "en" ? "Search..." : language === "zh-TW" ? "搜尋..." : "搜索..."}
              className="w-full px-2 py-1.5 bg-muted/10 border border-border rounded text-xs focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-36">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground text-center">{language === "en" ? "No users found" : language === "zh-TW" ? "未找到用戶" : "未找到用户"}</div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => { onChange(u.id); setOpen(false); setSearchTerm(""); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/10 transition-colors ${value === u.id ? "bg-sky-50 text-sky-600" : ""}`}
                >
                  <div className="font-medium">{u.full_name || u.email}</div>
                  <div className="text-muted-foreground text-[10px]">{u.email}{u.departmentName ? ` · ${u.departmentName}` : ""}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgMessagesPage() {
  const { language } = useTranslation();
  const { data: inbox = [], isLoading: inboxLoading } = useInboxMessages();
  const { data: sent = [] } = useSentMessages();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({ recipient: "", subject: "", content: "" });
  const [targetType, setTargetType] = useState<"all" | "department" | "individual">("all");
  const [targetDeptId, setTargetDeptId] = useState("");
  const [sending, setSending] = useState(false);
  const { data: departments = [] } = useOrgDepartments();
  const { data: orgUsers = [] } = useOrgUsers();
  const { user } = useAuth();

  const isEn = language === "en";
  const messages = tab === "inbox" ? inbox : sent;

  const filtered = messages.filter(
    (m) => !search || m.subject.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (message: Message) => {
    setSelected(message);
    if (!message.is_read && tab === "inbox") markAsRead.mutate(message.id);
  };

  const handleSend = async () => {
    if (!composeData.content) {
      toast.error(isEn ? "Please enter content" : language === "zh-TW" ? "請輸入內容" : "请输入内容");
      return;
    }
    let recipientIds: string[] = [];
    if (targetType === "all") {
      recipientIds = orgUsers.map((u) => u.id);
      if (recipientIds.length === 0) {
        toast.error(isEn ? "No members found" : language === "zh-TW" ? "未找到成員" : "未找到成员");
        return;
      }
    } else if (targetType === "department") {
      if (!targetDeptId) {
        toast.error(isEn ? "Please select a department" : language === "zh-TW" ? "請選擇部門" : "请选择部门");
        return;
      }
      recipientIds = orgUsers.filter((u) => u.department_id === targetDeptId).map((u) => u.id);
      if (recipientIds.length === 0) {
        toast.error(isEn ? "No members in this department" : language === "zh-TW" ? "該部門暫無成員" : "该部门暂无成员");
        return;
      }
    } else {
      if (!composeData.recipient) {
        toast.error(isEn ? "Please select a recipient" : language === "zh-TW" ? "請選擇收件人" : "请选择收件人");
        return;
      }
      recipientIds = [composeData.recipient];
    }
    setSending(true);
    const { error } = await supabase.from("messages").insert(
      recipientIds.map((recipientId) => ({
        sender_id: user?.id,
        recipient_id: recipientId,
        subject: composeData.subject,
        content: composeData.content,
        message_type: "notification",
        channel: "org_internal",
        is_read: false,
      }))
    );
    setSending(false);
    if (error) {
      toast.error(isEn ? "Send failed" : language === "zh-TW" ? "發送失敗" : "发送失败");
      return;
    }
    toast.success(
      isEn
        ? `Sent to ${recipientIds.length} member(s)`
        : language === "zh-TW"
          ? `已發送給 ${recipientIds.length} 位成員`
          : `已发送给 ${recipientIds.length} 位成员`
    );
    setShowCompose(false);
    setComposeData({ recipient: "", subject: "", content: "" });
    setTargetType("all");
    setTargetDeptId("");
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}${isEn ? "m" : language === "zh-TW" ? "分鐘" : "分钟"}`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}${isEn ? "h" : language === "zh-TW" ? "小時" : "小时"}`;
    return new Date(d).toLocaleDateString(isEn ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{isEn ? "Internal Messages" : language === "zh-TW" ? "機構消息" : "机构消息"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEn ? "Organizational notifications and announcements" : language === "zh-TW" ? "機構內部通知與公告" : "机构内部通知与公告"}
            {unreadCount > 0 && ` · ${unreadCount} ${isEn ? "unread" : language === "zh-TW" ? "條未讀" : "条未读"}`}
          </p>
        </div>
        <button onClick={() => setShowCompose(true)} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors">
          <Plus className="w-4 h-4" />
          {isEn ? "Announce" : language === "zh-TW" ? "發布通知" : "发布通知"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-5">
        {[
          { label: isEn ? "Inbox" : language === "zh-TW" ? "收件匣" : "收件箱", value: inbox.length, icon: Inbox, color: "text-sky-600", bg: "bg-sky-50" },
          { label: isEn ? "Unread" : language === "zh-TW" ? "未讀" : "未读", value: unreadCount, icon: Mail, color: "text-red-600", bg: "bg-red-50" },
          { label: isEn ? "Sent" : language === "zh-TW" ? "已發送" : "已发送", value: sent.length, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4" /></div>
            <div>
              <div className="text-lg font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-5 min-h-[50vh]">
        {/* List */}
        <div className="w-[340px] bg-card border border-border rounded-xl overflow-hidden flex flex-col shrink-0">
          <div className="flex border-b border-border">
            {(["inbox", "sent"] as const).map((key) => (
              <button
                key={key}
                onClick={() => { setTab(key); setSelected(null); }}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  tab === key ? "text-sky-600 border-b-2 border-sky-500" : "text-muted-foreground"
                }`}
              >
                {key === "inbox" ? (isEn ? "Inbox" : language === "zh-TW" ? "收件匣" : "收件箱") : (isEn ? "Sent" : language === "zh-TW" ? "已發送" : "已发送")}
                {key === "inbox" && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-sky-500 text-white text-[9px] font-bold rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="p-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={language === "en" ? "Search..." : language === "zh-TW" ? "搜尋..." : "搜索..."} className="w-full pl-7 pr-3 py-1.5 bg-muted/10 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/30" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inboxLoading ? (
              <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <MailOpen className="w-8 h-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">{isEn ? "No messages" : language === "zh-TW" ? "暫無消息" : "暂无消息"}</p>
              </div>
            ) : (
              filtered.map((m) => {
                const cfg = TYPE_ICONS[m.message_type] || TYPE_ICONS.notification;
                const Icon = cfg.icon;
                return (
                  <button key={m.id} onClick={() => handleSelect(m)} className={`w-full text-left px-3 py-3 border-b border-border/30 transition-colors ${selected?.id === m.id ? "bg-sky-50/50" : m.is_read ? "hover:bg-muted/5" : "bg-blue-50/20"}`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-md ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}><Icon className="w-3.5 h-3.5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-xs truncate ${!m.is_read ? "font-semibold" : "font-medium text-foreground/80"}`}>{m.subject || (isEn ? "No subject" : language === "zh-TW" ? "無主題" : "无主题")}</span>
                          {!m.is_read && <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{m.content}</p>
                        <span className="text-[10px] text-muted-foreground/60">{formatTime(m.created_at)}</span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground mb-1">{selected.subject || (isEn ? "No subject" : "无主题")}</h2>
                <span className="text-xs text-muted-foreground">{new Date(selected.created_at).toLocaleString(isEn ? "en-US" : "zh-CN")}</span>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.content}</div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <Building2 className="w-12 h-12 text-muted-foreground/15 mb-3" />
              <p className="text-sm text-muted-foreground">{isEn ? "Select a message" : language === "zh-TW" ? "選擇消息查看" : "选择消息查看"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCompose(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">{isEn ? "Send Notification" : language === "zh-TW" ? "發布通知" : "发布通知"}</h3>
                <button onClick={() => setShowCompose(false)} className="p-1 rounded hover:bg-muted/20"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    {isEn ? "Send To" : language === "zh-TW" ? "發送對象" : "发送对象"}
                  </label>
                  <div className="flex gap-2">
                    {(["all", "department", "individual"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setTargetType(type); setTargetDeptId(""); setComposeData({ ...composeData, recipient: "" }); }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                          targetType === type
                            ? "bg-sky-500 text-white"
                            : "bg-muted/10 border border-border text-muted-foreground hover:bg-muted/20"
                        }`}
                      >
                        {type === "all"
                          ? (isEn ? "All Members" : language === "zh-TW" ? "全員" : "全员")
                          : type === "department"
                            ? (isEn ? "By Dept" : language === "zh-TW" ? "按部門" : "按部门")
                            : (isEn ? "Individual" : language === "zh-TW" ? "指定個人" : "指定个人")}
                      </button>
                    ))}
                  </div>
                  {targetType === "department" && (
                    <select
                      value={targetDeptId}
                      onChange={(e) => setTargetDeptId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    >
                      <option value="">{isEn ? "Select department..." : language === "zh-TW" ? "選擇部門..." : "选择部门..."}</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  )}
                  {targetType === "individual" && (
                    <RecipientSelect value={composeData.recipient} onChange={(value) => setComposeData({ ...composeData, recipient: value })} isEn={isEn} />
                  )}
                </div>
                <input type="text" value={composeData.subject} onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })} placeholder={isEn ? "Subject" : "主题"} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                <textarea value={composeData.content} onChange={(e) => setComposeData({ ...composeData, content: e.target.value })} placeholder={isEn ? "Content..." : "内容..."} rows={4} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none" />
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-muted-foreground">{isEn ? "Cancel" : "取消"}</button>
                <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-60 transition-colors">
                  <Send className="w-3.5 h-3.5" />{isEn ? "Send" : "发送"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
