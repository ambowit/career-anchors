import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Loader2,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation, Language } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateAnalyticsCSV, downloadCSV } from "@/lib/exportReport";
import type { StoredAssessmentResult } from "@/hooks/useAssessmentResults";
import { toast } from "sonner";

const getWeeklyData = (t: (key: string) => string) => [
  { day: t("admin.monday"), count: 156, completed: 142 },
  { day: t("admin.tuesday"), count: 189, completed: 168 },
  { day: t("admin.wednesday"), count: 234, completed: 215 },
  { day: t("admin.thursday"), count: 198, completed: 182 },
  { day: t("admin.friday"), count: 267, completed: 248 },
  { day: t("admin.saturday"), count: 145, completed: 132 },
  { day: t("admin.sunday"), count: 123, completed: 108 },
];

const getAnchorTrends = (language: Language) => {
  const anchors: Record<Language, string[]> = {
    "zh-CN": ["技术/专业能力型", "管理型", "自主/独立型", "安全/稳定型", "创业/创造型", "服务/奉献型", "挑战型", "生活方式整合型"],
    "zh-TW": ["技術/專業能力型", "管理型", "自主/獨立型", "安全/穩定型", "創業/創造型", "服務/奉獻型", "挑戰型", "生活方式整合型"],
    "en": ["Technical/Functional", "General Management", "Autonomy/Independence", "Security/Stability", "Entrepreneurial Creativity", "Service/Dedication", "Pure Challenge", "Lifestyle Integration"],
  };
  
  const values = [
    { current: 18.2, previous: 17.5, change: 0.7 },
    { current: 14.6, previous: 15.2, change: -0.6 },
    { current: 16.8, previous: 15.9, change: 0.9 },
    { current: 12.9, previous: 13.4, change: -0.5 },
    { current: 11.1, previous: 10.3, change: 0.8 },
    { current: 10.0, previous: 10.8, change: -0.8 },
    { current: 8.5, previous: 8.1, change: 0.4 },
    { current: 7.9, previous: 8.8, change: -0.9 },
  ];
  
  return anchors[language].map((name, i) => ({ name, ...values[i] }));
};

const getCareerStageData = (language: Language) => {
  const stages: Record<Language, string[]> = {
    "zh-CN": ["职场新人", "职场中期", "高管/创业者", "HR/组织发展"],
    "zh-TW": ["職場新人", "職場中期", "高管/創業者", "HR/組織發展"],
    "en": ["Entry Level", "Mid-Career", "Senior/Entrepreneur", "HR/OD Professional"],
  };
  
  const values = [
    { count: 4521, percentage: 35.2 },
    { count: 5234, percentage: 40.7 },
    { count: 1876, percentage: 14.6 },
    { count: 1216, percentage: 9.5 },
  ];
  
  return stages[language].map((stage, i) => ({ stage, ...values[i] }));
};

const getTimeRanges = (t: (key: string) => string) => [
  { key: "today", label: t("admin.today") },
  { key: "thisWeek", label: t("admin.thisWeek") },
  { key: "thisMonth", label: t("admin.thisMonth") },
  { key: "thisQuarter", label: t("admin.thisQuarter") },
  { key: "thisYear", label: t("admin.thisYear") },
];

export default function AdminAnalyticsPage() {
  const { t, language } = useTranslation();
  const [selectedRange, setSelectedRange] = useState("thisWeek");
  const [isExporting, setIsExporting] = useState(false);
  
  const weeklyData = getWeeklyData(t);
  const anchorTrends = getAnchorTrends(language);
  const careerStageData = getCareerStageData(language);
  const timeRanges = getTimeRanges(t);
  
  const maxCount = Math.max(...weeklyData.map(d => d.count));

  // Fetch all assessment results for export
  const { data: allAssessments } = useQuery({
    queryKey: ["all-assessments-export"],
    queryFn: async (): Promise<StoredAssessmentResult[]> => {
      const { data, error } = await supabase
        .from("assessment_results")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as StoredAssessmentResult[];
    },
  });

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      if (!allAssessments || allAssessments.length === 0) {
        toast.error(language === "en" ? "No data to export" : language === "zh-TW" ? "沒有資料可匯出" : "没有数据可导出");
        return;
      }
      
      const csvContent = generateAnalyticsCSV(allAssessments, language);
      const filename = `career-anchor-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(csvContent, filename);
      toast.success(language === "en" ? "Report exported successfully" : language === "zh-TW" ? "報告匯出成功" : "报告导出成功");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(language === "en" ? "Export failed" : language === "zh-TW" ? "匯出失敗" : "导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{t("admin.analyticsTitle")}</h1>
          <p className="text-muted-foreground">
            {t("admin.analyticsDesc")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
            {timeRanges.map((range) => (
              <button
                key={range.key}
                onClick={() => setSelectedRange(range.key)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors",
                  selectedRange === range.key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.label}
              </button>
            ))}
          </div>
          <button className="p-2.5 bg-card border border-border rounded-lg hover:bg-muted/20 transition-colors">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
          <Link 
            to="/admin/assessments"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            {language === "en" ? "Assessment Analysis" : language === "zh-TW" ? "測評分析" : "测评分析"}
          </Link>
          <button 
            onClick={handleExportReport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {t("admin.exportReport")}
          </button>
        </div>
      </div>

      {/* Weekly Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-foreground">{t("admin.assessmentTrend")}</h3>
            <p className="text-sm text-muted-foreground">{t("admin.dailyStats")}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(228, 51%, 23%)" }} />
              <span className="text-muted-foreground">{t("admin.startedAssessment")}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(75, 55%, 50%)" }} />
              <span className="text-muted-foreground">{t("admin.completedAssessment")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between h-64 gap-4">
          {weeklyData.map((data, index) => (
            <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex gap-1 justify-center" style={{ height: "200px" }}>
                {/* Started bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.count / maxCount) * 100}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  className="w-5 rounded-t-lg"
                  style={{ backgroundColor: "hsl(228, 51%, 23%)" }}
                />
                {/* Completed bar */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.completed / maxCount) * 100}%` }}
                  transition={{ delay: index * 0.05 + 0.1, duration: 0.5 }}
                  className="w-5 rounded-t-lg"
                  style={{ backgroundColor: "hsl(75, 55%, 50%)" }}
                />
              </div>
              <div className="text-sm text-muted-foreground">{data.day}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anchor Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">{t("admin.anchorTrendChange")}</h3>
              <p className="text-sm text-muted-foreground">{t("admin.comparedToPrevious")}</p>
            </div>
          </div>

          <div className="space-y-4">
            {anchorTrends.map((anchor) => (
              <div key={anchor.name} className="flex items-center justify-between">
                <div className="text-sm text-foreground">{anchor.name}</div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-foreground">
                    {anchor.current}%
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                      anchor.change > 0
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600"
                    )}
                  >
                    {anchor.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {anchor.change > 0 ? "+" : ""}{anchor.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Career Stage Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">{t("admin.careerStageDistribution")}</h3>
              <p className="text-sm text-muted-foreground">{t("admin.userComposition")}</p>
            </div>
          </div>

          <div className="space-y-4">
            {careerStageData.map((stage, index) => (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-foreground">{stage.stage}</div>
                  <div className="text-sm text-muted-foreground">
                    {stage.count.toLocaleString()} ({stage.percentage}%)
                  </div>
                </div>
                <div className="h-3 bg-muted/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: `hsl(${75 + index * 40}, 55%, 50%)` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-border">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-foreground">12,847</div>
                <div className="text-sm text-muted-foreground">{t("admin.totalAssessments")}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">89.2%</div>
                <div className="text-sm text-muted-foreground">{t("admin.completionRate")}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
