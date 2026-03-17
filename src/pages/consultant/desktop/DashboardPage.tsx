import { motion } from "framer-motion";
import { Users, ClipboardList, FileText, Star, Clock, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useConsultantDashboard } from "@/hooks/useAdminData";
import CertificationInfoCard from "@/components/desktop/CertificationInfoCard";

export default function ConsultantDashboardPage() {
  const { language } = useTranslation();
  const langKey = language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  const { data: dashboard, isLoading } = useConsultantDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: { en: "Active Clients", "zh-TW": "活躍客戶", "zh-CN": "活跃客户" }[langKey]!, value: String(dashboard?.clientCount || 0), icon: Users, color: "#10b981" },
    { label: { en: "Assessments", "zh-TW": "測評總數", "zh-CN": "测评总数" }[langKey]!, value: String(dashboard?.assessmentCount || 0), icon: ClipboardList, color: "#3b82f6" },
    { label: { en: "Notes", "zh-TW": "諮詢筆記", "zh-CN": "咨询笔记" }[langKey]!, value: String(dashboard?.noteCount || 0), icon: FileText, color: "#8b5cf6" },
    { label: { en: "Clients This Month", "zh-TW": "本月新客戶", "zh-CN": "本月新客户" }[langKey]!, value: String(dashboard?.recentClients?.filter((client) => { const daysDiff = (Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24); return daysDiff <= 30; }).length || 0), icon: Star, color: "#f59e0b" },
  ];

  const recentAssessments = (dashboard?.recentAssessments || []).slice(0, 5);
  const recentClients = (dashboard?.recentClients || []).slice(0, 3);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  const pendingTasks = [
    { text: { en: `${dashboard?.assessmentCount || 0} total assessments completed`, "zh-TW": `共完成 ${dashboard?.assessmentCount || 0} 次測評`, "zh-CN": `共完成 ${dashboard?.assessmentCount || 0} 次测评` }[langKey]!, type: "info", urgent: false },
    { text: { en: `${dashboard?.noteCount || 0} consultation notes recorded`, "zh-TW": `已記錄 ${dashboard?.noteCount || 0} 條諮詢筆記`, "zh-CN": `已记录 ${dashboard?.noteCount || 0} 条咨询笔记` }[langKey]!, type: "info", urgent: false },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {{ en: "Consultant Dashboard", "zh-TW": "顧問工作台", "zh-CN": "顾问工作台" }[langKey]}
        </h1>
        <p className="text-sm text-muted-foreground">
          {{ en: "Overview of your consulting practice", "zh-TW": "諮詢業務概覽", "zh-CN": "咨询业务概览" }[langKey]}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-8">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}18`, color: stat.color }}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Certification Info Card — full width above the 3-column grid */}
      <div className="mb-6">
        <CertificationInfoCard langKey={langKey} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Assessments */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="sm:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">
              {{ en: "Recent Assessments", "zh-TW": "最近測評", "zh-CN": "最近测评" }[langKey]}
            </h3>
          </div>
          {recentAssessments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {{ en: "No assessments yet", "zh-TW": "暫無測評記錄", "zh-CN": "暂无测评记录" }[langKey]}
            </p>
          ) : (
            <div className="space-y-3">
              {recentAssessments.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/5 hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      {(item.clientName || "?")[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.clientName}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(item.created_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.main_anchor && (
                      <span className="text-xs text-muted-foreground">{item.main_anchor}</span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-600">
                      {{ en: "Completed", "zh-TW": "已完成", "zh-CN": "已完成" }[langKey]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Clients */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">
                {{ en: "Recent Clients", "zh-TW": "最近客戶", "zh-CN": "最近客户" }[langKey]}
              </h3>
            </div>
            {recentClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {{ en: "No clients yet", "zh-TW": "暫無客戶", "zh-CN": "暂无客户" }[langKey]}
              </p>
            ) : (
              <div className="space-y-3">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                      {(client.full_name || client.email || "?")[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{client.full_name || client.email}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(client.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Quick Summary */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">
                {{ en: "Quick Summary", "zh-TW": "快速摘要", "zh-CN": "快速摘要" }[langKey]}
              </h3>
            </div>
            <div className="space-y-2.5">
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/5">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${task.urgent ? "bg-red-500" : "bg-emerald-500"}`} />
                  <span className="text-sm text-foreground">{task.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
