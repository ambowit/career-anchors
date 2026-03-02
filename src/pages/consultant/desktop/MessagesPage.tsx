import { useState } from "react";
import { motion } from "framer-motion";
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
  ChevronRight,
  Plus,
  Users,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useInboxMessages, useSentMessages, useUnreadCount, useMarkAsRead, useSendMessage, type Message } from "@/hooks/useMessages";
import { useConsultantClients } from "@/hooks/useAdminData";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  system: { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-100" },
  notification: { icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
  personal: { icon: Mail, color: "text-emerald-600", bg: "bg-emerald-50" },
  report_share: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
  assessment_assign: { icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50" },
  reminder: { icon: Clock, color: "text-red-600", bg: "bg-red-50" },
};

function ClientRecipientSelect({ value, onChange, isEn }: { value: string; onChange: (v: string) => void; isEn: boolean }) {
  const { language } = useTranslation();
  const { data: clients = [] } = useConsultantClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const selectedClient = clients.find((c) => c.id === value);
  const filtered = clients.filter(
    (c) => !searchTerm || (c.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/30 flex items-center justify-between"
      >
        <span className={selectedClient ? "text-foreground" : "text-muted-foreground"}>
          {selectedClient ? `${selectedClient.full_name || selectedClient.email}` : (language === "en" ? "Select client..." : language === "zh-TW" ? "選擇客戶..." : "选择客户...")}
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
              <div className="px-3 py-3 text-xs text-muted-foreground text-center">{language === "en" ? "No clients found" : language === "zh-TW" ? "未找到客戶" : "未找到客户"}</div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onChange(c.id); setOpen(false); setSearchTerm(""); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-muted/10 transition-colors ${value === c.id ? "bg-emerald-50 text-emerald-600" : ""}`}
                >
                  <div className="font-medium">{c.full_name || c.email}</div>
                  <div className="text-muted-foreground text-[10px]">{c.email}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ConsultantMessagesPage() {
  const { language } = useTranslation();
  const { data: inbox = [], isLoading: inboxLoading } = useInboxMessages();
  const { data: sent = [], isLoading: sentLoading } = useSentMessages();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const sendMessage = useSendMessage();
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Message | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeContent, setComposeContent] = useState("");

  const isEn = language === "en";
  const messages = tab === "inbox" ? inbox : sent;
  const isLoading = tab === "inbox" ? inboxLoading : sentLoading;

  const filtered = messages.filter(
    (m) => !search || m.subject.toLowerCase().includes(search.toLowerCase()) || m.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (message: Message) => {
    setSelected(message);
    if (!message.is_read && tab === "inbox") markAsRead.mutate(message.id);
  };

  const handleSend = () => {
    if (!composeRecipient.trim() || !composeContent.trim()) {
      toast.error(isEn ? "Please fill in all fields" : "请填写所有字段");
      return;
    }
    sendMessage.mutate(
      {
        recipient_id: composeRecipient,
        subject: composeSubject,
        content: composeContent,
        channel: "consultant_client",
        message_type: "personal",
      },
      {
        onSuccess: () => {
          toast.success(isEn ? "Message sent" : "消息已发送");
          setShowCompose(false);
          setComposeRecipient("");
          setComposeSubject("");
          setComposeContent("");
        },
      }
    );
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isEn ? `${mins}m` : `${mins}分钟`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return isEn ? `${hrs}h` : `${hrs}小时`;
    const days = Math.floor(diff / 86400000);
    if (days < 7) return isEn ? `${days}d` : `${days}天`;
    return new Date(d).toLocaleDateString(isEn ? "en-US" : "zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{isEn ? "Messages" : "消息中心"}</h1>
          <p className="text-sm text-muted-foreground">
            {isEn ? "Communicate with clients and platform" : "与客户和平台沟通"}
            {unreadCount > 0 && ` · ${unreadCount} ${isEn ? "unread" : "条未读"}`}
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {isEn ? "New Message" : "新消息"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: isEn ? "Total Inbox" : "收件箱", value: inbox.length, icon: Inbox, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isEn ? "Unread" : "未读", value: unreadCount, icon: Mail, color: "text-red-600", bg: "bg-red-50" },
          { label: isEn ? "Sent" : "已发送", value: sent.length, icon: Send, color: "text-emerald-600", bg: "bg-emerald-50" },
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
            {[
              { key: "inbox" as const, icon: Inbox, label: isEn ? "Inbox" : "收件箱" },
              { key: "sent" as const, icon: Send, label: isEn ? "Sent" : "已发送" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSelected(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                  tab === t.key ? "text-emerald-600 border-b-2 border-emerald-500" : "text-muted-foreground"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.key === "inbox" && unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === "en" ? "Search..." : language === "zh-TW" ? "搜尋..." : "搜索..."}
                className="w-full pl-7 pr-3 py-1.5 bg-muted/10 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-10">
                <MailOpen className="w-8 h-8 text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">{isEn ? "No messages" : "暂无消息"}</p>
              </div>
            ) : (
              filtered.map((m) => {
                const cfg = TYPE_CONFIG[m.message_type] || TYPE_CONFIG.notification;
                const Icon = cfg.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m)}
                    className={`w-full text-left px-3 py-3 border-b border-border/30 transition-colors ${
                      selected?.id === m.id ? "bg-emerald-50/50" : m.is_read ? "hover:bg-muted/5" : "bg-blue-50/20"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-md ${cfg.bg} ${cfg.color} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`text-xs truncate ${!m.is_read ? "font-semibold" : "font-medium text-foreground/80"}`}>
                            {m.subject || (isEn ? "No subject" : "无主题")}
                          </span>
                          {!m.is_read && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
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
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(selected.created_at).toLocaleString(isEn ? "en-US" : "zh-CN")}</span>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{selected.content}</div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <Mail className="w-12 h-12 text-muted-foreground/15 mb-3" />
              <p className="text-sm text-muted-foreground">{isEn ? "Select a message" : "选择消息查看"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCompose(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold">{isEn ? "New Message" : "新消息"}</h3>
                <button onClick={() => setShowCompose(false)} className="p-1 rounded hover:bg-muted/20"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <ClientRecipientSelect value={composeRecipient} onChange={setComposeRecipient} isEn={isEn} />
                <input type="text" value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder={isEn ? "Subject" : "主题"} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                <textarea value={composeContent} onChange={(e) => setComposeContent(e.target.value)} placeholder={isEn ? "Message content..." : "消息内容..."} rows={5} className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
              </div>
              <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-sm text-muted-foreground">{isEn ? "Cancel" : "取消"}</button>
                <button onClick={handleSend} disabled={sendMessage.isPending} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 disabled:opacity-60 transition-colors">
                  <Send className="w-3.5 h-3.5" />
                  {isEn ? "Send" : "发送"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
