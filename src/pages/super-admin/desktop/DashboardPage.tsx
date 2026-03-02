import { motion } from "framer-motion";
import {
  Building2, Users, UserCog, TrendingUp,
  ArrowUpRight, Activity, Globe, Loader2,
} from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { usePlatformStats, useOrganizationsWithCounts, useAuditLogs } from "@/hooks/useAdminData";

export default function SuperAdminDashboardPage() {
  const { language } = useTranslation();
  const { data: platformStats, isLoading: statsLoading } = usePlatformStats();
  const { data: orgsWithCounts, isLoading: orgsLoading } = useOrganizationsWithCounts();
  const { data: auditLogs, isLoading: logsLoading } = useAuditLogs();

  const isLoading = statsLoading || orgsLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: language === "en" ? "Organizations" : language === "zh-TW" ? "機構數" : "机构数", value: String(platformStats?.totalOrgs || 0), icon: Building2, color: "#ef4444" },
    { label: language === "en" ? "Consultants" : language === "zh-TW" ? "諮詢師" : "咨询师", value: String(platformStats?.totalConsultants || 0), icon: UserCog, color: "#f59e0b" },
    { label: language === "en" ? "Total Users" : language === "zh-TW" ? "總用戶數" : "总用户数", value: (platformStats?.totalUsers || 0).toLocaleString(), icon: Users, color: "#3b82f6" },
    { label: language === "en" ? "Total Assessments" : language === "zh-TW" ? "總測評數" : "总测评数", value: (platformStats?.totalAssessments || 0).toLocaleString(), icon: Activity, color: "#10b981" },
  ];

  const topOrgs = (orgsWithCounts || [])
    .sort((a, b) => b.assessmentCount - a.assessmentCount)
    .slice(0, 5);

  const recentLogs = (auditLogs || []).slice(0, 5);

  const planLabels: Record<string, string> = {
    trial: "Trial",
    standard: "Standard",
    professional: "Professional",
    enterprise: "Enterprise",
  };

  const operationLabels: Record<string, { en: string; "zh-TW": string; "zh-CN": string }> = {
    login: { en: "Login", "zh-TW": "登入", "zh-CN": "登录" },
    logout: { en: "Logout", "zh-TW": "登出", "zh-CN": "退出" },
    create_user: { en: "Create User", "zh-TW": "建立用戶", "zh-CN": "创建用户" },
    bulk_import: { en: "Bulk Import", "zh-TW": "批次匯入", "zh-CN": "批量导入" },
    assign_assessment: { en: "Assign", "zh-TW": "派發測評", "zh-CN": "派发测评" },
    export_report: { en: "Export", "zh-TW": "匯出報告", "zh-CN": "导出报告" },
    role_change: { en: "Role Change", "zh-TW": "角色變更", "zh-CN": "角色变更" },
    sso_config_change: { en: "SSO Config", "zh-TW": "SSO 設定", "zh-CN": "SSO 配置" },
    delete_user: { en: "Delete User", "zh-TW": "刪除用戶", "zh-CN": "删除用户" },
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {language === "en" ? "Platform Overview" : language === "zh-TW" ? "平台總覽" : "平台总览"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {language === "en" ? "Monitor all organizations, consultants, and platform health" : language === "zh-TW" ? "監控所有機構、諮詢師和平台運行狀態" : "监控所有机构、咨询师和平台运行状态"}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="bg-card border border-border rounded-xl p-5"
          >
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

      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-2 bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Top Organizations" : language === "zh-TW" ? "活躍機構" : "活跃机构"}</h3>
            </div>
          </div>
          {topOrgs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{language === "en" ? "No organizations yet" : language === "zh-TW" ? "暫無機構資料" : "暂无机构数据"}</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border">
                  <th className="text-left pb-3 font-medium">{language === "en" ? "Organization" : language === "zh-TW" ? "機構" : "机构"}</th>
                  <th className="text-right pb-3 font-medium">{language === "en" ? "Users" : language === "zh-TW" ? "用戶數" : "用户数"}</th>
                  <th className="text-right pb-3 font-medium">{language === "en" ? "Assessments" : language === "zh-TW" ? "測評數" : "测评数"}</th>
                  <th className="text-right pb-3 font-medium">{language === "en" ? "Plan" : language === "zh-TW" ? "方案" : "套餐"}</th>
                </tr>
              </thead>
              <tbody>
                {topOrgs.map((org) => (
                  <tr key={org.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-sm font-medium text-foreground">{org.name}</td>
                    <td className="py-3 text-sm text-right text-muted-foreground">{org.userCount}</td>
                    <td className="py-3 text-sm text-right text-muted-foreground">{org.assessmentCount.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        org.plan_type === "enterprise" ? "bg-purple-100 text-purple-700" :
                        org.plan_type === "professional" ? "bg-blue-100 text-blue-700" :
                        org.plan_type === "standard" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {planLabels[org.plan_type] || org.plan_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Recent Events" : "最近事件"}</h3>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">{language === "en" ? "No events yet" : language === "zh-TW" ? "暫無事件" : "暂无事件"}</p>
          ) : (
            <div className="space-y-4">
              {recentLogs.map((log) => {
                const opLabel = operationLabels[log.operation_type];
                const timeAgo = getTimeAgo(log.created_at, language);
                return (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-foreground truncate">
                        {opLabel ? opLabel[language === "en" ? "en" : language === "zh-TW" ? "zh-TW" : "zh-CN"] : log.operation_type}
                        {log.user_email ? ` · ${log.user_email}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{timeAgo}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string, language: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 60) {
    return language === "en" ? `${diffMinutes}m ago` : `${diffMinutes}${language === "zh-TW" ? "分鐘前" : "分钟前"}`;
  }
  if (diffHours < 24) {
    return language === "en" ? `${diffHours}h ago` : `${diffHours}${language === "zh-TW" ? "小時前" : "小时前"}`;
  }
  return language === "en" ? `${diffDays}d ago` : `${diffDays}天前`;
}
