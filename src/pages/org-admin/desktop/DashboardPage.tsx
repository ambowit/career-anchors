import { motion } from "framer-motion";
import { Users, ClipboardList, TrendingUp, Clock, ArrowUpRight, Target, BarChart3, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useOrgDashboardStats, useOrgDepartments } from "@/hooks/useAdminData";

export default function OrgDashboardPage() {
  const { language } = useTranslation();
  const { data: dashStats, isLoading: loadingStats } = useOrgDashboardStats();
  const { data: departments, isLoading: loadingDepts } = useOrgDepartments();

  if (loadingStats || loadingDepts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const stats = [
    { label: language === "en" ? "Total Employees" : language === "zh-TW" ? "員工總數" : "员工总数", value: String(dashStats?.totalUsers || 0), icon: Users, color: "#3b82f6" },
    { label: language === "en" ? "Assessments Completed" : language === "zh-TW" ? "已完成測評" : "已完成测评", value: String(dashStats?.completedAssessments || 0), icon: ClipboardList, color: "#10b981" },
    { label: language === "en" ? "Completion Rate" : language === "zh-TW" ? "完成率" : "完成率", value: dashStats?.completionRate || "0%", icon: TrendingUp, color: "#f59e0b" },
    { label: language === "en" ? "Avg. Time" : language === "zh-TW" ? "平均用時" : "平均用时", value: dashStats?.avgTimeMinutes || "0m", icon: Clock, color: "#8b5cf6" },
  ];

  const topLevelDepts = (departments || []).filter((department) => !department.parent_department_id);

  const departmentStats = topLevelDepts.map((department) => {
    const total = department.memberCount || 0;
    const completed = department.completedAssessments || 0;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      name: department.name,
      total,
      completed,
      rate,
    };
  });

  const pendingActions = [
    { text: language === "en" ? `${Math.max(0, (dashStats?.totalUsers || 0) - (dashStats?.completedAssessments || 0))} employees haven't completed assessment` : language === "zh-TW" ? `${Math.max(0, (dashStats?.totalUsers || 0) - (dashStats?.completedAssessments || 0))}名員工尚未完成測評` : `${Math.max(0, (dashStats?.totalUsers || 0) - (dashStats?.completedAssessments || 0))}名员工尚未完成测评`, urgent: true },
    { text: language === "en" ? "Monthly report ready for review" : language === "zh-TW" ? "月度報告待審閱" : "月度报告待审阅", urgent: false },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Organization Dashboard" : language === "zh-TW" ? "機構儀表板" : "机构仪表盘"}</h1>
        <p className="text-sm text-muted-foreground">{language === "en" ? "Overview of your organization's assessment activity" : language === "zh-TW" ? "機構測評活動概覽" : "机构测评活动概览"}</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
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

      <div className="grid grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Department Progress" : language === "zh-TW" ? "部門完成進度" : "部门完成进度"}</h3>
          </div>
          {departmentStats.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{language === "en" ? "No departments found" : language === "zh-TW" ? "暫無部門數據" : "暂无部门数据"}</p>
          ) : (
            <div className="space-y-4">
              {departmentStats.map((dept) => (
                <div key={dept.name} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-muted-foreground truncate">{dept.name}</div>
                  <div className="flex-1">
                    <div className="h-7 bg-muted/20 rounded-lg overflow-hidden relative">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${dept.rate}%` }} transition={{ duration: 0.6, delay: 0.3 }} className="h-full rounded-lg bg-sky-500" />
                      <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                        {dept.completed}/{dept.total}
                      </div>
                    </div>
                  </div>
                  <div className="w-12 text-right text-sm font-medium text-foreground">{dept.rate}%</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Pending Actions" : language === "zh-TW" ? "待處理事項" : "待处理事项"}</h3>
          </div>
          <div className="space-y-3">
            {pendingActions.map((action, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${action.urgent ? "bg-red-500" : "bg-amber-500"}`} />
                <span className="text-sm text-foreground">{action.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
