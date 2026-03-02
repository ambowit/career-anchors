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
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useInboxMessages, useSentMessages, useUnreadCount, useMarkAsRead, type Message } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";

const MESSAGE_TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bgColor: string; label: Record<string, string> }> = {
  system: { icon: AlertCircle, color: "text-slate-600", bgColor: "bg-slate-100", label: { en: "System", tw: "系統", zh: "系统" } },
  notification: { icon: Bell, color: "text-blue-600", bgColor: "bg-blue-50", label: { en: "Notification", tw: "通知", zh: "通知" } },
  personal: { icon: Mail, color: "text-emerald-600", bgColor: "bg-emerald-50", label: { en: "Message", tw: "訊息", zh: "消息" } },
  report_share: { icon: FileText, color: "text-purple-600", bgColor: "bg-purple-50", label: { en: "Report", tw: "報告", zh: "报告" } },
  assessment_assign: { icon: ClipboardList, color: "text-amber-600", bgColor: "bg-amber-50", label: { en: "Assignment", tw: "派發", zh: "派发" } },
  reminder: { icon: Clock, color: "text-red-600", bgColor: "bg-red-50", label: { en: "Reminder", tw: "提醒", zh: "提醒" } },
};

const CHANNEL_LABELS: Record<string, Record<string, string>> = {
  org_internal: { en: "Organization", tw: "機構內部", zh: "机构内部" },
  consultant_client: { en: "Consultant", tw: "諮詢師", zh: "咨询师" },
  platform_user: { en: "Platform", tw: "平台", zh: "平台" },
  system: { en: "System", tw: "系統", zh: "系统" },
};

export default function MessagesPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { data: inboxMessages = [], isLoading: inboxLoading } = useInboxMessages();
  // Sent tab removed per QC: regular users cannot compose messages, making it useless
  // const { data: sentMessages = [], isLoading: sentLoading } = useSentMessages();
  const { data: unreadCount = 0 } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const [activeTab] = useState<"inbox">("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const txt = (en: string, tw: string, cn: string) => language === "en" ? en : language === "zh-TW" ? tw : cn;
  const isLoading = inboxLoading;
  const messages = inboxMessages;
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "tw" : "zh";

  const filteredMessages = messages.filter(
    (message) =>
      !searchQuery ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read && activeTab === "inbox") {
      markAsRead.mutate(message.id);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return txt("Just now", "剛剛", "刚刚");
    if (diffMins < 60) return txt(`${diffMins}m ago`, `${diffMins}分鐘前`, `${diffMins}分钟前`);
    if (diffHours < 24) return txt(`${diffHours}h ago`, `${diffHours}小時前`, `${diffHours}小时前`);
    if (diffDays < 7) return txt(`${diffDays}d ago`, `${diffDays}天前`, `${diffDays}天前`);
    return date.toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", { month: "short", day: "numeric" });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <Mail className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{txt("Please login to view messages", "請登入查看訊息", "请登录查看消息")}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{txt("Messages", "訊息中心", "消息中心")}</h1>
        <p className="text-sm text-muted-foreground">
          {txt(`${unreadCount} unread messages`, `${unreadCount} 封未讀訊息`, `${unreadCount} 条未读消息`)}
        </p>
      </div>

      <div className="flex gap-6 min-h-[60vh]">
        {/* Left: Message List */}
        <div className="w-[380px] flex flex-col bg-card border border-border rounded-xl overflow-hidden shrink-0">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => { setActiveTab("inbox"); setSelectedMessage(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === "inbox" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Inbox className="w-4 h-4" />
              {txt("Inbox", "收件箱", "收件箱")}
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>

          </div>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={txt("Search messages...", "搜尋訊息...", "搜索消息...")}
                className="w-full pl-8 pr-3 py-2 bg-muted/10 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MailOpen className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">{txt("No messages", "暫無訊息", "暂无消息")}</p>
              </div>
            ) : (
              filteredMessages.map((message) => {
                const typeConfig = MESSAGE_TYPE_CONFIG[message.message_type] || MESSAGE_TYPE_CONFIG.notification;
                const TypeIcon = typeConfig.icon;
                const isSelected = selectedMessage?.id === message.id;

                return (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message)}
                    className={`w-full text-left px-4 py-3.5 border-b border-border/50 transition-colors ${
                      isSelected ? "bg-primary/5" : message.is_read ? "hover:bg-muted/5" : "bg-blue-50/30 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${typeConfig.bgColor} ${typeConfig.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className={`text-sm truncate ${!message.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                            {message.subject || typeConfig.label[langKey]}
                          </span>
                          {!message.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 ml-2" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-1">{message.content}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/70">{formatTime(message.created_at)}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground/70">
                            {CHANNEL_LABELS[message.channel]?.[langKey] || message.channel}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Detail */}
        <div className="flex-1 bg-card border border-border rounded-xl overflow-hidden">
          {selectedMessage ? (
            <motion.div key={selectedMessage.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-foreground">{selectedMessage.subject || txt("No subject", "無主題", "无主题")}</h2>
                  <button onClick={() => setSelectedMessage(null)} className="p-1.5 hover:bg-muted/20 rounded-lg lg:hidden">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{CHANNEL_LABELS[selectedMessage.channel]?.[langKey]}</span>
                  <span>·</span>
                  <span>{MESSAGE_TYPE_CONFIG[selectedMessage.message_type]?.label[langKey]}</span>
                  <span>·</span>
                  <span>{new Date(selectedMessage.created_at).toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN")}</span>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-auto">
                <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Mail className="w-16 h-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-1">{txt("Select a message", "選擇一封訊息", "选择一条消息")}</h3>
              <p className="text-sm text-muted-foreground/70">{txt("Click on a message to read it here", "點擊左側訊息查看詳情", "点击左侧消息查看详情")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
