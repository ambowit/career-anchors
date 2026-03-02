import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MailOpen,
  Search,
  Eye,
  X,
  Bell,
  FileText,
  ClipboardList,
  AlertCircle,
  Clock,
  Shield,
  Building2,
  Users,
  MessageSquare,
  Activity,
  Filter,
  BarChart3,
  TrendingUp,
  Send,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useAllMessages, type Message } from "@/hooks/useMessages";
import { AnimatePresence } from "framer-motion";

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; label: Record<string, string> }> = {
  system: { icon: AlertCircle, color: "text-slate-600", bg: "bg-slate-100", label: { en: "System", "zh-TW": "系統", "zh-CN": "系统" } },
  notification: { icon: Bell, color: "text-blue-600", bg: "bg-blue-50", label: { en: "Notification", "zh-TW": "通知", "zh-CN": "通知" } },
  personal: { icon: Mail, color: "text-emerald-600", bg: "bg-emerald-50", label: { en: "Personal", "zh-TW": "私信", "zh-CN": "私信" } },
  report_share: { icon: FileText, color: "text-purple-600", bg: "bg-purple-50", label: { en: "Report", "zh-TW": "報告", "zh-CN": "报告" } },
  assessment_assign: { icon: ClipboardList, color: "text-amber-600", bg: "bg-amber-50", label: { en: "Assignment", "zh-TW": "派發", "zh-CN": "派发" } },
  reminder: { icon: Clock, color: "text-red-600", bg: "bg-red-50", label: { en: "Reminder", "zh-TW": "提醒", "zh-CN": "提醒" } },
};

const CHANNEL_CONFIG: Record<string, { icon: typeof Building2; color: string; bg: string; label: Record<string, string> }> = {
  org_internal: { icon: Building2, color: "text-sky-600", bg: "bg-sky-50", label: { en: "Organization", "zh-TW": "機構內部", "zh-CN": "机构内部" } },
  consultant_client: { icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", label: { en: "Consultant-Client", "zh-TW": "諮詢師-客戶", "zh-CN": "咨询师-客户" } },
  platform_user: { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50", label: { en: "Platform-User", "zh-TW": "平台-用戶", "zh-CN": "平台-用户" } },
  system: { icon: Shield, color: "text-red-600", bg: "bg-red-50", label: { en: "System", "zh-TW": "系統", "zh-CN": "系统" } },
};

export default function MessagesMonitorPage() {
  const { language } = useTranslation();
  const isEn = language === "en";
  const langKey = isEn ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";

  const [channelFilter, setChannelFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data: allMessages = [], isLoading } = useAllMessages({
    channel: channelFilter,
    messageType: typeFilter,
  });

  const filteredMessages = useMemo(() => {
    return allMessages.filter(
      (m) =>
        !search ||
        m.subject.toLowerCase().includes(search.toLowerCase()) ||
        m.content.toLowerCase().includes(search.toLowerCase()) ||
        m.sender_id?.toLowerCase().includes(search.toLowerCase()) ||
        m.recipient_id.toLowerCase().includes(search.toLowerCase())
    );
  }, [allMessages, search]);

  // Analytics
  const analytics = useMemo(() => {
    const total = allMessages.length;
    const unread = allMessages.filter((m) => !m.is_read).length;
    const byChannel: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const todayCount = allMessages.filter((m) => {
      const d = new Date(m.created_at);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    }).length;

    for (const m of allMessages) {
      byChannel[m.channel] = (byChannel[m.channel] || 0) + 1;
      byType[m.message_type] = (byType[m.message_type] || 0) + 1;
    }

    return { total, unread, todayCount, byChannel, byType };
  }, [allMessages]);

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}${isEn ? "m ago" : language === "zh-TW" ? "分鐘前" : "分钟前"}`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}${isEn ? "h ago" : language === "zh-TW" ? "小時前" : "小时前"}`;
    return new Date(d).toLocaleDateString(isEn ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{isEn ? "Message Monitoring" : language === "zh-TW" ? "訊息監控" : "消息监控"}</h1>
        <p className="text-sm text-muted-foreground">{isEn ? "Monitor all platform messages across channels" : language === "zh-TW" ? "全平台訊息監控與管理" : "全平台消息监控与管理"}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: isEn ? "Total Messages" : language === "zh-TW" ? "訊息總量" : "消息总量", value: analytics.total, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: isEn ? "Unread" : language === "zh-TW" ? "未讀訊息" : "未读消息", value: analytics.unread, icon: MailOpen, color: "text-red-600", bg: "bg-red-50" },
          { label: isEn ? "Today" : language === "zh-TW" ? "今日訊息" : "今日消息", value: analytics.todayCount, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: isEn ? "Channels" : language === "zh-TW" ? "活躍通道" : "活跃通道", value: Object.keys(analytics.byChannel).length, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}><stat.icon className="w-5 h-5" /></div>
            <div>
              <div className="text-xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Channel Distribution */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {Object.entries(CHANNEL_CONFIG).map(([key, config]) => {
          const count = analytics.byChannel[key] || 0;
          const Icon = config.icon;
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setChannelFilter(channelFilter === key ? "all" : key)}
              className={`bg-white border rounded-xl p-4 flex items-center gap-3 transition-all ${
                channelFilter === key ? "border-red-300 ring-1 ring-red-200 shadow-sm" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-900">{count}</div>
                <div className="text-[11px] text-slate-500">{config.label[langKey]}</div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isEn ? "Search messages, sender ID, recipient ID..." : language === "zh-TW" ? "搜尋訊息內容、發送者ID、接收者ID..." : "搜索消息内容、发送者ID、接收者ID..."} className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-300" />
        </div>
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
          <button onClick={() => setTypeFilter("all")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === "all" ? "bg-red-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
            {isEn ? "All Types" : language === "zh-TW" ? "全部類型" : "全部类型"}
          </button>
          {Object.entries(TYPE_CONFIG).map(([key, config]) => (
            <button key={key} onClick={() => setTypeFilter(typeFilter === key ? "all" : key)} className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${typeFilter === key ? "bg-red-500 text-white" : "text-slate-500 hover:bg-slate-50"}`}>
              {config.label[langKey]}
            </button>
          ))}
        </div>
      </div>

      {/* Message Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Shield className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">{isEn ? "No messages found" : language === "zh-TW" ? "無匹配訊息" : "无匹配消息"}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-3">{isEn ? "Type" : language === "zh-TW" ? "類型" : "类型"}</th>
                <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-3">{isEn ? "Channel" : "通道"}</th>
                <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-3">{isEn ? "Subject / Content" : language === "zh-TW" ? "主題 / 內容" : "主题 / 内容"}</th>
                <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-3">{isEn ? "Status" : language === "zh-TW" ? "狀態" : "状态"}</th>
                <th className="text-left text-[11px] font-medium text-slate-500 px-4 py-3">{isEn ? "Time" : language === "zh-TW" ? "時間" : "时间"}</th>
                <th className="text-right text-[11px] font-medium text-slate-500 px-4 py-3">{isEn ? "Action" : "操作"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.slice(0, 50).map((message) => {
                const typeConfig = TYPE_CONFIG[message.message_type] || TYPE_CONFIG.notification;
                const channelConfig = CHANNEL_CONFIG[message.channel] || CHANNEL_CONFIG.system;
                const TypeIcon = typeConfig.icon;
                const ChannelIcon = channelConfig.icon;

                return (
                  <tr key={message.id} className="border-b border-slate-100/50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeConfig.label[langKey]}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <ChannelIcon className="w-3.5 h-3.5" />
                        {channelConfig.label[langKey]}
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[300px]">
                      <div className="text-sm font-medium text-slate-900 truncate">{message.subject || (isEn ? "No subject" : language === "zh-TW" ? "無主題" : "无主题")}</div>
                      <div className="text-xs text-slate-400 truncate">{message.content}</div>
                    </td>
                    <td className="px-4 py-3">
                      {message.is_read ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><MailOpen className="w-3 h-3" />{isEn ? "Read" : language === "zh-TW" ? "已讀" : "已读"}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium"><Mail className="w-3 h-3" />{isEn ? "Unread" : language === "zh-TW" ? "未讀" : "未读"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">{formatTime(message.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedMessage(message)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {filteredMessages.length > 50 && (
          <div className="px-4 py-3 text-center text-xs text-slate-400 border-t border-slate-100">
            {isEn ? `Showing 50 of ${filteredMessages.length} messages` : language === "zh-TW" ? `顯示 ${filteredMessages.length} 則中的前 50 則` : `显示 ${filteredMessages.length} 条中的前 50 条`}
          </div>
        )}
      </motion.div>

      {/* Message Detail Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8" onClick={() => setSelectedMessage(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-semibold text-slate-900">{isEn ? "Message Detail" : language === "zh-TW" ? "訊息詳情" : "消息详情"}</span>
                </div>
                <button onClick={() => setSelectedMessage(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{isEn ? "Sender ID" : language === "zh-TW" ? "發送者ID" : "发送者ID"}</div>
                    <div className="text-xs text-slate-700 font-mono truncate">{selectedMessage.sender_id || (isEn ? "System" : language === "zh-TW" ? "系統" : "系统")}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{isEn ? "Recipient ID" : language === "zh-TW" ? "接收者ID" : "接收者ID"}</div>
                    <div className="text-xs text-slate-700 font-mono truncate">{selectedMessage.recipient_id}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{isEn ? "Channel" : "通道"}</div>
                    <div className="text-xs text-slate-700">{CHANNEL_CONFIG[selectedMessage.channel]?.label[langKey] || selectedMessage.channel}</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{isEn ? "Type" : language === "zh-TW" ? "類型" : "类型"}</div>
                    <div className="text-xs text-slate-700">{TYPE_CONFIG[selectedMessage.message_type]?.label[langKey] || selectedMessage.message_type}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{isEn ? "Subject" : language === "zh-TW" ? "主題" : "主题"}</div>
                  <div className="text-sm font-medium text-slate-900">{selectedMessage.subject || (isEn ? "No subject" : language === "zh-TW" ? "無主題" : "无主题")}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{isEn ? "Content" : language === "zh-TW" ? "內容" : "内容"}</div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-lg p-4">{selectedMessage.content}</div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{isEn ? "Status" : language === "zh-TW" ? "狀態" : "状态"}: {selectedMessage.is_read ? (isEn ? "Read" : language === "zh-TW" ? "已讀" : "已读") : (isEn ? "Unread" : language === "zh-TW" ? "未讀" : "未读")}</span>
                  <span>{new Date(selectedMessage.created_at).toLocaleString(isEn ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN")}</span>
                </div>
                {Object.keys(selectedMessage.metadata).length > 0 && (
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{isEn ? "Metadata" : language === "zh-TW" ? "元資料" : "元数据"}</div>
                    <pre className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 overflow-auto font-mono">{JSON.stringify(selectedMessage.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
