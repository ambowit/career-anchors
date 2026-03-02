import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, PieChart, Download, Compass, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useOrgAnalytics, useOrgDepartments } from "@/hooks/useAdminData";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { generateAnalyticsCSV, downloadCSV } from "@/lib/exportReport";
import { toast } from "sonner";

const ANCHOR_COLORS: Record<string, string> = {
  TF: "#3b82f6",
  GM: "#ef4444",
  AU: "#f59e0b",
  SE: "#10b981",
  EC: "#8b5cf6",
  SV: "#ec4899",
  CH: "#f97316",
  LS: "#06b6d4",
};

export default function OrgAnalyticsPage() {
  const { language } = useTranslation();
  const { data: analytics, isLoading: loadingAnalytics } = useOrgAnalytics();
  const { data: departments, isLoading: loadingDepts } = useOrgDepartments();
  const { organizationId } = usePermissions();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!organizationId || exporting) return;
    setExporting(true);
    const { data: results, error } = await supabase
      .from("assessment_results")
      .select("*")
      .eq("organization_id", organizationId);
    setExporting(false);
    if (error) {
      toast.error(language === "en" ? "Export failed" : language === "zh-TW" ? "匯出失敗" : "导出失败");
      return;
    }
    const csvContent = generateAnalyticsCSV(results || [], language);
    downloadCSV(csvContent, `org-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success(language === "en" ? "Report exported" : language === "zh-TW" ? "報告已匯出" : "报告已导出");
  };

  const anchorLabels: Record<string, string> = {
    TF: language === "en" ? "Technical" : language === "zh-TW" ? "技術型" : "技术型",
    GM: language === "en" ? "Management" : language === "zh-TW" ? "管理型" : "管理型",
    AU: language === "en" ? "Autonomy" : language === "zh-TW" ? "自主型" : "自主型",
    SE: language === "en" ? "Security" : language === "zh-TW" ? "安全型" : "安全型",
    EC: language === "en" ? "Entrepreneurial" : language === "zh-TW" ? "創業型" : "创业型",
    SV: language === "en" ? "Service" : language === "zh-TW" ? "服務型" : "服务型",
    CH: language === "en" ? "Challenge" : language === "zh-TW" ? "挑戰型" : "挑战型",
    LS: language === "en" ? "Lifestyle" : language === "zh-TW" ? "生活型" : "生活型",
  };

  if (loadingAnalytics || loadingDepts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const anchorDistribution = analytics?.anchorDistribution || [];
  const monthlyTrend = analytics?.monthlyTrend || [];
  const totalAssessments = analytics?.total || 0;
  const topAnchorKey = analytics?.topAnchor || null;
  const avgRisk = analytics?.avgRisk || "0";

  const topLevelDepts = (departments || []).filter((department) => !department.parent_department_id);

  const stats = [
    { label: language === "en" ? "Total Assessments" : language === "zh-TW" ? "總測評數" : "总测评数", value: String(totalAssessments), icon: BarChart3, color: "#3b82f6" },
    { label: language === "en" ? "Anchor Types" : language === "zh-TW" ? "錨點類型數" : "锚点类型数", value: String(anchorDistribution.length), icon: Compass, color: "#10b981" },
    { label: language === "en" ? "Top Anchor" : language === "zh-TW" ? "最常見錨點" : "最常见锚点", value: topAnchorKey ? (anchorLabels[topAnchorKey] || topAnchorKey) : "—", icon: PieChart, color: "#8b5cf6" },
    { label: language === "en" ? "Avg. Risk" : language === "zh-TW" ? "平均風險指數" : "平均风险指数", value: `${avgRisk}%`, icon: TrendingUp, color: "#f59e0b" },
  ];

  const maxTrend = Math.max(...monthlyTrend.map((monthItem) => monthItem.completed), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{language === "en" ? "Organization Analytics" : language === "zh-TW" ? "機構數據分析" : "机构数据分析"}</h1>
          <p className="text-sm text-muted-foreground">{language === "en" ? "Comprehensive assessment data insights for your organization" : language === "zh-TW" ? "機構測評數據洞察與分析" : "机构测评数据洞察与分析"}</p>
        </div>
        <button onClick={handleExport} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-60 transition-colors">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {language === "en" ? "Export Analytics" : language === "zh-TW" ? "匯出分析報告" : "导出分析报告"}
        </button>
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

      <div className="grid grid-cols-5 gap-6 mb-6">
        {/* Anchor Distribution */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <PieChart className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Anchor Distribution" : language === "zh-TW" ? "錨點分佈" : "锚点分布"}</h3>
          </div>
          {anchorDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{language === "en" ? "No data yet" : language === "zh-TW" ? "暫無數據" : "暂无数据"}</p>
          ) : (
            <div className="space-y-3">
              {anchorDistribution.map((anchor) => (
                <div key={anchor.key} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: ANCHOR_COLORS[anchor.key] || "#888" }} />
                  <div className="w-16 text-sm text-muted-foreground">{anchorLabels[anchor.key] || anchor.key}</div>
                  <div className="flex-1">
                    <div className="h-5 bg-muted/20 rounded-md overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${anchor.percentage}%` }} transition={{ duration: 0.6, delay: 0.4 }} className="h-full rounded-md" style={{ backgroundColor: ANCHOR_COLORS[anchor.key] || "#888" }} />
                    </div>
                  </div>
                  <div className="w-8 text-right text-xs font-medium text-foreground">{anchor.percentage}%</div>
                  <div className="w-10 text-right text-xs text-muted-foreground">{anchor.count}{language === "en" ? "" : language === "zh-TW" ? "人" : "人"}</div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="col-span-3 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Monthly Trend" : language === "zh-TW" ? "月度趨勢" : "月度趋势"}</h3>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-muted-foreground">{language === "en" ? "Completed" : language === "zh-TW" ? "完成測評" : "完成测评"}</span>
              </div>
            </div>
          </div>
          {monthlyTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">{language === "en" ? "No trend data" : language === "zh-TW" ? "暫無趨勢數據" : "暂无趋势数据"}</p>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlyTrend.map((monthItem, index) => (
                <div key={monthItem.month || index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1 h-32">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(monthItem.completed / maxTrend) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                      className="flex-1 bg-sky-400/80 rounded-t-sm"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{language === "en" ? monthItem.monthEn : monthItem.month}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Department Comparison Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-semibold text-foreground text-sm">{language === "en" ? "Department Comparison" : language === "zh-TW" ? "部門對比分析" : "部门对比分析"}</h3>
        </div>
        {topLevelDepts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{language === "en" ? "No departments found" : language === "zh-TW" ? "暫無部門數據" : "暂无部门数据"}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Members" : language === "zh-TW" ? "人數" : "人数"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Completed" : language === "zh-TW" ? "已完成" : "已完成"}</th>
                <th className="text-left text-xs font-medium text-muted-foreground pb-3">{language === "en" ? "Completion" : language === "zh-TW" ? "完成率" : "完成率"}</th>
              </tr>
            </thead>
            <tbody>
              {topLevelDepts.map((dept) => {
                const memberCount = dept.memberCount || 0;
                const completedCount = dept.completedAssessments || 0;
                const rate = memberCount > 0 ? Math.round((completedCount / memberCount) * 100) : 0;
                return (
                  <tr key={dept.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                    <td className="py-3.5 text-sm font-medium text-foreground">{dept.name}</td>
                    <td className="py-3.5 text-sm text-muted-foreground">{memberCount}</td>
                    <td className="py-3.5 text-sm text-foreground">{completedCount}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-xs text-foreground font-medium">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
