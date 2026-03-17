import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Archive, Search, Eye, X, Filter, BarChart3, Target, TrendingUp, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useMyReports, useArchiveReport } from "@/hooks/useUserReports";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const REPORT_TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string; bgColor: string }> = {
  assessment: { icon: Target, color: "text-blue-600", bgColor: "bg-blue-50" },
  comprehensive: { icon: BarChart3, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  trend: { icon: TrendingUp, color: "text-purple-600", bgColor: "bg-purple-50" },
  ideal_card: { icon: Sparkles, color: "text-amber-600", bgColor: "bg-amber-50" },
};

export default function MyReportsPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: reports = [], isLoading } = useMyReports();
  const archiveReport = useArchiveReport();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [previewReport, setPreviewReport] = useState<(typeof reports)[0] | null>(null);

  const txt = (en: string, tw: string, cn: string) => language === "en" ? en : language === "zh-TW" ? tw : cn;

  const reportTypeLabels: Record<string, string> = {
    assessment: txt("Assessment Report", "測評報告", "测评报告"),
    comprehensive: txt("Comprehensive Report", "綜合報告", "综合报告"),
    trend: txt("Trend Report", "趨勢報告", "趋势报告"),
    ideal_card: txt("Espresso Card Report", "理想卡報告", "理想卡报告"),
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = !searchQuery || report.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || report.report_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleArchive = async (reportId: string) => {
    archiveReport.mutate(reportId, {
      onSuccess: () => toast.success(txt("Report archived", "報告已歸檔", "报告已归档")),
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">{txt("Please login to view your reports", "請登入查看您的報告", "请登录查看您的报告")}</h2>
        <p className="text-muted-foreground text-sm">{txt("Your assessment reports will be stored here", "您的測評報告將存儲在這裡", "您的测评报告将存储在这里")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{txt("My Reports", "我的報告", "我的报告")}</h1>
          <p className="text-sm text-muted-foreground">{txt("View and manage your assessment reports", "查看和管理您的測評報告", "查看和管理您的测评报告")}</p>
        </div>
        <button
          onClick={() => navigate("/assessment")}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          {txt("New Assessment", "新建測評", "新建测评")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: txt("Total Reports", "報告總數", "报告总数"), value: reports.length, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
          { label: txt("Assessments", "測評報告", "测评报告"), value: reports.filter((r) => r.report_type === "assessment").length, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: txt("Comprehensive", "綜合報告", "综合报告"), value: reports.filter((r) => r.report_type === "comprehensive").length, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
          { label: txt("Trend Reports", "趨勢報告", "趋势报告"), value: reports.filter((r) => r.report_type === "trend").length, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={txt("Search reports...", "搜尋報告...", "搜索报告...")}
            className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {["all", "assessment", "comprehensive", "trend", "ideal_card"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filterType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {type === "all" ? txt("All", "全部", "全部") : reportTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{txt("Loading reports...", "載入報告中...", "加载报告中...")}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 bg-card border border-border rounded-xl">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">{txt("No reports yet", "暫無報告", "暂无报告")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{txt("Complete an assessment to see your reports here", "完成一次測評後，報告將顯示在這裡", "完成一次测评后，报告将显示在这里")}</p>
          <button
            onClick={() => navigate("/assessment")}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            {txt("Start Assessment", "開始測評", "开始测评")}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredReports.map((report, index) => {
            const config = REPORT_TYPE_CONFIG[report.report_type] || REPORT_TYPE_CONFIG.assessment;
            const IconComponent = config.icon;
            const reportData = report.report_data as Record<string, unknown>;
            const mainAnchor = reportData.main_anchor as string | undefined;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center`}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bgColor} ${config.color}`}>
                    {reportTypeLabels[report.report_type]}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1 truncate">{report.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {new Date(report.created_at).toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", { year: "numeric", month: "short", day: "numeric" })}
                  {mainAnchor && ` · ${txt("Anchor:", "核心錨:", "核心锚:")} ${mainAnchor}`}
                </p>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setPreviewReport(report)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted/30 text-muted-foreground hover:text-foreground text-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {txt("View", "查看", "查看")}
                  </button>
                  <button
                    onClick={() => handleArchive(report.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-muted/30 text-muted-foreground hover:text-destructive text-xs transition-colors"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    {txt("Archive", "歸檔", "归档")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {previewReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8"
            onClick={() => setPreviewReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-foreground">{previewReport.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(previewReport.created_at).toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <button onClick={() => setPreviewReport(null)} className="p-1.5 hover:bg-muted/20 rounded-lg">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="p-6 overflow-auto max-h-[60vh]">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                  {JSON.stringify(previewReport.report_data, null, 2)}
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
