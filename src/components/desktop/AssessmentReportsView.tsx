import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Compass, Heart, Eye, Download, X, ChevronDown,
  ChevronUp, Loader2, Target, AlertTriangle, FileText,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { QUESTIONS_DATA, standardizeScores } from "@/data/questions";
import { downloadHtmlAsPdf, generateComprehensiveReportHTML } from "@/lib/exportReport";
import { getHighSensitivityAnchors } from "@/hooks/useAssessment";
import { IDEAL_CARDS } from "@/data/idealCards";

// Build a zh-CN → zh-TW label map for ideal card translations
const idealCardLabelMap = new Map<string, string>();
IDEAL_CARDS.forEach((card) => {
  if (card["zh-CN"] !== card["zh-TW"]) {
    idealCardLabelMap.set(card["zh-CN"], card["zh-TW"]);
  }
});

interface StoredAnswer {
  questionId: string;
  value: number;
  dimension: string;
  weight: number;
}

interface AssessmentRecord {
  id: string;
  user_id: string;
  score_tf: number;
  score_gm: number;
  score_au: number;
  score_se: number;
  score_ec: number;
  score_sv: number;
  score_ch: number;
  score_ls: number;
  main_anchor: string;
  secondary_anchor: string;
  conflict_anchors: string[];
  risk_index: number;
  stability: string;
  question_count: number;
  completion_time_seconds: number;
  created_at: string;
  answers: unknown;
  userName: string;
  userEmail: string;
  orgName?: string | null;
  deptName?: string | null;
}

interface IdealCardReport {
  id: string;
  user_id: string;
  report_type: string;
  title: string;
  report_data: Record<string, unknown>;
  created_at: string;
  userName: string;
  userEmail: string;
}

interface AssessmentReportsViewProps {
  assessmentResults?: AssessmentRecord[];
  idealCardReports?: IdealCardReport[];
  isLoadingAssessments?: boolean;
  isLoadingIdealCards?: boolean;
  scope: "super_admin" | "org";
}

const ANCHOR_LABELS: Record<string, Record<string, string>> = {
  TF: { "zh-CN": "技术/专业能力型", "zh-TW": "技術/專業能力型", en: "Technical/Functional" },
  GM: { "zh-CN": "管理型", "zh-TW": "管理型", en: "General Management" },
  AU: { "zh-CN": "自主/独立型", "zh-TW": "自主/獨立型", en: "Autonomy/Independence" },
  SE: { "zh-CN": "安全/稳定型", "zh-TW": "安全/穩定型", en: "Security/Stability" },
  EC: { "zh-CN": "创业/创造型", "zh-TW": "創業/創造型", en: "Entrepreneurial Creativity" },
  SV: { "zh-CN": "服务/奉献型", "zh-TW": "服務/奉獻型", en: "Service/Dedication" },
  CH: { "zh-CN": "挑战型", "zh-TW": "挑戰型", en: "Pure Challenge" },
  LS: { "zh-CN": "生活方式整合型", "zh-TW": "生活方式整合型", en: "Lifestyle Integration" },
};

const ANCHOR_SHORT: Record<string, Record<string, string>> = {
  TF: { "zh-CN": "技术型", "zh-TW": "技術型", en: "Technical" },
  GM: { "zh-CN": "管理型", "zh-TW": "管理型", en: "Management" },
  AU: { "zh-CN": "自主型", "zh-TW": "自主型", en: "Autonomy" },
  SE: { "zh-CN": "安全型", "zh-TW": "安全型", en: "Security" },
  EC: { "zh-CN": "创业型", "zh-TW": "創業型", en: "Entrepreneurial" },
  SV: { "zh-CN": "服务型", "zh-TW": "服務型", en: "Service" },
  CH: { "zh-CN": "挑战型", "zh-TW": "挑戰型", en: "Challenge" },
  LS: { "zh-CN": "生活型", "zh-TW": "生活型", en: "Lifestyle" },
};

const ANCHOR_COLORS: Record<string, string> = {
  TF: "bg-blue-50 text-blue-600 border-blue-200",
  GM: "bg-red-50 text-red-600 border-red-200",
  AU: "bg-amber-50 text-amber-600 border-amber-200",
  SE: "bg-green-50 text-green-600 border-green-200",
  EC: "bg-purple-50 text-purple-600 border-purple-200",
  SV: "bg-pink-50 text-pink-600 border-pink-200",
  CH: "bg-orange-50 text-orange-600 border-orange-200",
  LS: "bg-cyan-50 text-cyan-600 border-cyan-200",
};

const DIMENSION_KEYS = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"] as const;
const SCORE_FIELDS: Record<string, string> = {
  TF: "score_tf", GM: "score_gm", AU: "score_au", SE: "score_se",
  EC: "score_ec", SV: "score_sv", CH: "score_ch", LS: "score_ls",
};

const LIKERT_LABELS: Record<string, string[]> = {
  "zh-CN": ["完全不符合", "有点符合", "比较符合", "非常符合"],
  "zh-TW": ["完全不符合", "有點符合", "比較符合", "非常符合"],
  en: ["Not true", "Slightly true", "Mostly true", "Very true"],
};

const questionsMap = new Map(QUESTIONS_DATA.map((questionItem) => [questionItem.id, questionItem]));

const STABILITY_LABELS: Record<string, Record<string, string>> = {
  mature: { "zh-CN": "成熟", "zh-TW": "成熟", en: "Mature" },
  developing: { "zh-CN": "发展中", "zh-TW": "發展中", en: "Developing" },
  unclear: { "zh-CN": "不明确", "zh-TW": "不明確", en: "Unclear" },
};

const getStabilityLabel = (stability: string, language: string): string => {
  return STABILITY_LABELS[stability]?.[language] || stability;
};

/** Calculate the total column count for the table */
function getColumnCount(scope: "super_admin" | "org"): number {
  // user, org/dept, main_anchor, sub_anchor, risk, questions, time, date, actions
  return 9;
}

export default function AssessmentReportsView({
  assessmentResults = [],
  idealCardReports = [],
  isLoadingAssessments = false,
  isLoadingIdealCards = false,
  scope,
}: AssessmentReportsViewProps) {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<"career_anchor" | "ideal_card">("career_anchor");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [answerExpandedId, setAnswerExpandedId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<AssessmentRecord | null>(null);

  const isLoading = activeTab === "career_anchor" ? isLoadingAssessments : isLoadingIdealCards;
  const totalColumns = getColumnCount(scope);

  const filteredAssessments = assessmentResults.filter((record) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      record.userName.toLowerCase().includes(query) ||
      record.userEmail.toLowerCase().includes(query) ||
      (record.main_anchor && ANCHOR_SHORT[record.main_anchor]?.[language]?.toLowerCase().includes(query))
    );
  });

  const filteredIdealCards = idealCardReports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.userName.toLowerCase().includes(query) ||
      report.userEmail.toLowerCase().includes(query) ||
      report.title.toLowerCase().includes(query)
    );
  });

  const getAnchorLabel = (code: string) => ANCHOR_SHORT[code]?.[language] || code;
  const getAnchorFullLabel = (code: string) => ANCHOR_LABELS[code]?.[language] || code;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN",
      { year: "numeric", month: "long", day: "numeric" }
    );
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  };

  const getScoreValue = (record: AssessmentRecord, dimension: string): number => {
    const field = SCORE_FIELDS[dimension] as keyof AssessmentRecord;
    return Number(record[field]) || 0;
  };

  const getAnswers = (record: AssessmentRecord): StoredAnswer[] => {
    if (!record.answers) return [];
    if (Array.isArray(record.answers)) return record.answers as StoredAnswer[];
    return [];
  };

  /** Build standardized scores from a record for the comprehensive report */
  const buildStandardizedScores = (record: AssessmentRecord): Record<string, number> => {
    return standardizeScores({
      TF: record.score_tf,
      GM: record.score_gm,
      AU: record.score_au,
      SE: record.score_se,
      EC: record.score_ec,
      SV: record.score_sv,
      CH: record.score_ch,
      LS: record.score_ls,
    });
  };

  /** Download comprehensive 5-part PDF report */
  const handleDownloadPdf = async (record: AssessmentRecord) => {
    toast.info(language === "en" ? "Generating comprehensive PDF..." : language === "zh-TW" ? "正在生成完整報告PDF..." : "正在生成完整报告PDF...");

    const displayScores = buildStandardizedScores(record);
    const answers = getAnswers(record);

    const highSensAnchors = getHighSensitivityAnchors(displayScores);
    const reportData = {
      mainAnchor: record.main_anchor,
      highSensitivityAnchors: highSensAnchors,
      scores: displayScores,
      stability: record.stability,
      riskIndex: Number(record.risk_index),
      conflictAnchors: record.conflict_anchors || [],
      createdAt: new Date(record.created_at).toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN"),
      questionCount: record.question_count,
      completionTime: record.completion_time_seconds || undefined,
      userName: record.userName,
      careerStage: null,
      answers: answers.length > 0 ? answers : null,
    };

    const htmlContent = generateComprehensiveReportHTML(reportData, language);

    try {
      await downloadHtmlAsPdf(htmlContent, `comprehensive-report-${record.userName}-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(language === "en" ? "Comprehensive PDF downloaded" : language === "zh-TW" ? "完整報告PDF已下載" : "完整报告PDF已下载");
    } catch {
      toast.error(language === "en" ? "PDF generation failed" : language === "zh-TW" ? "PDF 生成失敗" : "PDF 生成失败");
    }
  };

  const handleExportCSV = () => {
    if (activeTab === "career_anchor") {
      const headers = [
        language === "en" ? "Name" : "姓名",
        language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱",
        language === "en" ? "High-Sens Anchor" : language === "zh-TW" ? "高敏感錨" : "高敏感锚",
        language === "en" ? "Second Anchor" : language === "zh-TW" ? "次高分錨" : "次高分锚",
        ...DIMENSION_KEYS.map((dimensionKey) => ANCHOR_LABELS[dimensionKey]?.[language] || dimensionKey),
        language === "en" ? "Risk Index" : language === "zh-TW" ? "風險指數" : "风险指数",
        language === "en" ? "Assessment Date" : language === "zh-TW" ? "測評日期" : "测评日期",
      ];
      const rows = filteredAssessments.map((record) => [
        record.userName,
        record.userEmail,
        getAnchorLabel(record.main_anchor),
        getAnchorLabel(record.secondary_anchor),
        ...DIMENSION_KEYS.map((dimension) => getScoreValue(record, dimension)),
        record.risk_index,
        formatDate(record.created_at),
      ]);
      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `career-anchor-reports-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(language === "en" ? "CSV exported" : language === "zh-TW" ? "CSV 已匯出" : "CSV 已导出");
    } else {
      const headers = [
        language === "en" ? "Name" : "姓名",
        language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱",
        language === "en" ? "Report Title" : language === "zh-TW" ? "報告標題" : "报告标题",
        language === "en" ? "Date" : "日期",
      ];
      const rows = filteredIdealCards.map((report) => [
        report.userName,
        report.userEmail,
        report.title,
        formatDate(report.created_at),
      ]);
      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ideal-card-reports-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(language === "en" ? "CSV exported" : language === "zh-TW" ? "CSV 已匯出" : "CSV 已导出");
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {language === "en" ? "Assessment Reports" : language === "zh-TW" ? "測評報告" : "测评报告"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {scope === "super_admin"
              ? (language === "en" ? "View all users' assessment process data and reports" : language === "zh-TW" ? "檢視所有測試人員的測評過程資料和測評報告" : "查看所有测试人员的测评过程数据和测评报告")
              : (language === "en" ? "View organization members' assessment process data and reports" : language === "zh-TW" ? "檢視機構人員的測評過程資料和測評報告" : "查看机构人员的测评过程数据和测评报告")}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          {language === "en" ? "Export CSV" : language === "zh-TW" ? "匯出CSV" : "导出CSV"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl mb-6 w-fit">
        <button
          onClick={() => { setActiveTab("career_anchor"); setSearchQuery(""); setExpandedRowId(null); setAnswerExpandedId(null); }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "career_anchor"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Compass className="w-4 h-4" />
          {language === "en" ? "Career Anchor" : language === "zh-TW" ? "職業錨" : "职业锚"}
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {assessmentResults.length}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab("ideal_card"); setSearchQuery(""); setExpandedRowId(null); setAnswerExpandedId(null); }}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "ideal_card"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className="w-4 h-4" />
          {language === "en" ? "Ideal Life Card" : language === "zh-TW" ? "理想人生卡" : "理想人生卡"}
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {idealCardReports.length}
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={language === "en" ? "Search by name, email, or anchor type..." : language === "zh-TW" ? "搜尋姓名、信箱或錨點類型..." : "搜索姓名、邮箱或锚点类型..."}
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Career Anchor Tab */}
      {!isLoading && activeTab === "career_anchor" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          {filteredAssessments.length === 0 ? (
            <div className="text-center py-16">
              <Compass className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "No assessment records found" : language === "zh-TW" ? "暫無測評記錄" : "暂无测评记录"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout: "fixed", minWidth: 960 }}>
                <colgroup>
                  <col style={{ width: 180 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 60 }} />
                  <col style={{ width: 55 }} />
                  <col style={{ width: 60 }} />
                  <col style={{ width: 125 }} />
                  <col style={{ width: 100 }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/5">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">
                      {language === "en" ? "User" : language === "zh-TW" ? "使用者" : "用户"}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {scope === "super_admin"
                        ? (language === "en" ? "Organization" : language === "zh-TW" ? "所屬機構" : "所属机构")
                        : (language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门")}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {language === "en" ? "High-Sens" : language === "zh-TW" ? "高敏感錨" : "高敏感锚"}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {language === "en" ? "2nd Anchor" : language === "zh-TW" ? "次高分" : "次高分"}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-2 py-3">
                      {language === "en" ? "Risk" : language === "zh-TW" ? "風險" : "风险"}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-2 py-3">
                      {language === "en" ? "Q" : language === "zh-TW" ? "題數" : "题数"}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-2 py-3">
                      {language === "en" ? "Time" : language === "zh-TW" ? "用時" : "用时"}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {language === "en" ? "Date" : "日期"}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredAssessments.map((record) => {
                    const isExpanded = expandedRowId === record.id;
                    const isAnswerExpanded = answerExpandedId === record.id;
                    const answers = getAnswers(record);

                    return (
                      <Fragment key={record.id}>
                        {/* Main data row */}
                        <tr
                          className="border-b border-border/50 hover:bg-muted/5 transition-colors cursor-pointer"
                          onClick={() => { setExpandedRowId(isExpanded ? null : record.id); if (isExpanded) setAnswerExpandedId(null); }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {record.userName[0] || "?"}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{record.userName}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{record.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-muted-foreground truncate block">
                              {scope === "super_admin" ? (record.orgName || "-") : (record.deptName || "-")}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {record.main_anchor && (
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap inline-block", ANCHOR_COLORS[record.main_anchor] || "bg-muted text-muted-foreground")}>
                                {getAnchorLabel(record.main_anchor)}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {record.secondary_anchor && ANCHOR_SHORT[record.secondary_anchor] ? (
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap inline-block", ANCHOR_COLORS[record.secondary_anchor] || "bg-muted text-muted-foreground border-border")}>
                                {getAnchorLabel(record.secondary_anchor)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={cn(
                              "text-xs font-semibold",
                              Number(record.risk_index) >= 70 ? "text-red-500" :
                              Number(record.risk_index) >= 40 ? "text-amber-500" : "text-green-500"
                            )}>
                              {Number(record.risk_index).toFixed(0)}
                            </span>
                          </td>
                          <td className="px-2 py-3 text-center text-xs text-muted-foreground">
                            {record.question_count}
                          </td>
                          <td className="px-2 py-3 text-center text-xs text-muted-foreground">
                            {formatTime(record.completion_time_seconds)}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(record.created_at)}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={(event) => { event.stopPropagation(); setDetailRecord(record); }}
                                className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
                                title={language === "en" ? "View Detail" : language === "zh-TW" ? "查看詳情" : "查看详情"}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(event) => { event.stopPropagation(); handleDownloadPdf(record); }}
                                className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-primary transition-colors"
                                title={language === "en" ? "Download PDF" : language === "zh-TW" ? "下載PDF" : "下载PDF"}
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Score Detail row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={totalColumns} className="p-0">
                              <AnimatePresence>
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-muted/5 border-b border-border/50">
                                    <div className="px-6 py-4">
                                      <div className="text-xs font-medium text-muted-foreground mb-3">
                                        {language === "en" ? "Dimension Scores" : language === "zh-TW" ? "八維度得分詳情" : "八维度得分详情"}
                                      </div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {DIMENSION_KEYS.map((dimension) => {
                                          const score = getScoreValue(record, dimension);
                                          const isHighSens = score > 80;
                                          const isTopAnchor = record.main_anchor === dimension;
                                          return (
                                            <div
                                              key={dimension}
                                              className={cn(
                                                "flex items-center gap-3 p-2.5 rounded-lg border",
                                                isHighSens ? "border-primary/30 bg-primary/5" :
                                                isTopAnchor ? "border-amber-300/40 bg-amber-50/30" :
                                                "border-border bg-card"
                                              )}
                                            >
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-xs font-medium text-foreground">
                                                    {getAnchorLabel(dimension)}
                                                  </span>
                                                  {isHighSens && <Target className="w-3 h-3 text-primary" />}
                                                </div>
                                                <div className="mt-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                                  <div
                                                    className={cn(
                                                      "h-full rounded-full transition-all",
                                                      isHighSens ? "bg-primary" :
                                                      score >= 70 ? "bg-emerald-500" :
                                                      score >= 50 ? "bg-amber-500" : "bg-slate-300"
                                                    )}
                                                    style={{ width: `${Math.min(score, 100)}%` }}
                                                  />
                                                </div>
                                              </div>
                                              <span className={cn(
                                                "text-sm font-bold tabular-nums",
                                                isMain ? "text-primary" : "text-foreground"
                                              )}>
                                                {score.toFixed(0)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {record.conflict_anchors && record.conflict_anchors.length > 0 && (
                                        <div className="mt-3 flex items-center gap-2">
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                          <span className="text-xs text-amber-600">
                                            {language === "en" ? "Conflict Anchors:" : language === "zh-TW" ? "衝突錨:" : "冲突锚:"}
                                            {" "}
                                            {record.conflict_anchors.map((anchor) => getAnchorLabel(anchor)).join(", ")}
                                          </span>
                                        </div>
                                      )}

                                      {/* Answer Details Toggle */}
                                      {answers.length > 0 && (
                                        <button
                                          onClick={(event) => { event.stopPropagation(); setAnswerExpandedId(isAnswerExpanded ? null : record.id); }}
                                          className="mt-4 flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                        >
                                          <ListChecks className="w-3.5 h-3.5" />
                                          {language === "en" ? "Answer Details" : language === "zh-TW" ? "查看答題詳情" : "查看答题详情"}
                                          {isAnswerExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                          <span className="text-muted-foreground font-normal">({answers.length} {language === "en" ? "questions" : language === "zh-TW" ? "題" : "题"})</span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Answer Details Table */}
                                    <AnimatePresence>
                                      {isAnswerExpanded && answers.length > 0 && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: "auto", opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="px-6 pb-4">
                                            <div className="border border-border rounded-lg overflow-hidden bg-card">
                                              <table className="w-full text-xs">
                                                <thead>
                                                  <tr className="bg-muted/10">
                                                    <th className="text-center font-medium text-muted-foreground px-3 py-2 w-10">#</th>
                                                    <th className="text-left font-medium text-muted-foreground px-3 py-2">{language === "en" ? "Question" : language === "zh-TW" ? "題目" : "题目"}</th>
                                                    <th className="text-center font-medium text-muted-foreground px-3 py-2 w-16">{language === "en" ? "Dim" : language === "zh-TW" ? "維度" : "维度"}</th>
                                                    <th className="text-center font-medium text-muted-foreground px-3 py-2 w-20">{language === "en" ? "Answer" : language === "zh-TW" ? "回答" : "回答"}</th>
                                                    {scope === "super_admin" && (
                                                    <th className="text-center font-medium text-muted-foreground px-3 py-2 w-14">{language === "en" ? "Wt" : language === "zh-TW" ? "權重" : "权重"}</th>
                                                    )}
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {answers.map((answer, answerIndex) => {
                                                    const questionData = questionsMap.get(answer.questionId);
                                                    const questionText = questionData?.text?.[language as "zh-CN" | "zh-TW" | "en"] || answer.questionId;
                                                    const likertLabels = LIKERT_LABELS[language] || LIKERT_LABELS["zh-CN"];
                                                    return (
                                                      <tr key={answerIndex} className={cn("border-t border-border/30", answerIndex % 2 === 0 ? "" : "bg-muted/5")}>
                                                        <td className="text-center text-muted-foreground px-3 py-2">{answerIndex + 1}</td>
                                                        <td className="px-3 py-2 text-foreground leading-relaxed">{questionText}</td>
                                                        <td className="text-center px-3 py-2">
                                                          <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border", ANCHOR_COLORS[answer.dimension] || "bg-muted text-muted-foreground")}>
                                                            {getAnchorLabel(answer.dimension)}
                                                          </span>
                                                        </td>
                                                        <td className="text-center px-3 py-2 text-foreground">{likertLabels[answer.value] || answer.value}</td>
                                                        {scope === "super_admin" && (
                                                        <td className="text-center px-3 py-2 text-muted-foreground">x{answer.weight}</td>
                                                        )}
                                                      </tr>
                                                    );
                                                  })}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </motion.div>
                              </AnimatePresence>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* Ideal Card Tab */}
      {!isLoading && activeTab === "ideal_card" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          {filteredIdealCards.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "No ideal card reports found" : language === "zh-TW" ? "暫無理想人生卡報告" : "暂无理想人生卡报告"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/5">
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "User" : language === "zh-TW" ? "使用者" : "用户"}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Report Title" : language === "zh-TW" ? "報告標題" : "报告标题"}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Date" : "日期"}</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-5 py-3">{language === "en" ? "Actions" : language === "zh-TW" ? "操作" : "操作"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredIdealCards.map((report) => {
                  const reportData = report.report_data || {};
                  const topCards = (reportData.selectedCards as Array<{ rank: number; label?: string; labelEn?: string }>) || [];
                  return (
                    <tr key={report.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {report.userName[0] || "?"}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-foreground">{report.userName}</div>
                            <div className="text-[11px] text-muted-foreground">{report.userEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm text-foreground">{report.title}</div>
                        {topCards.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {topCards.slice(0, 3).map((card, index) => (
                              <span key={index} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">
                                {language === "en"
                                  ? (card.labelEn || card.label)
                                  : language === "zh-TW" && card.label
                                    ? (idealCardLabelMap.get(card.label) || card.label)
                                    : card.label}
                              </span>
                            ))}
                            {topCards.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{topCards.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {formatDate(report.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          className="p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-colors"
                          title={language === "en" ? "View" : language === "zh-TW" ? "查看" : "查看"}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>
      )}

      {/* Detail Modal for Career Anchor */}
      <AnimatePresence>
        {detailRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
            onClick={() => setDetailRecord(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {detailRecord.userName[0] || "?"}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{detailRecord.userName}</div>
                    <div className="text-xs text-muted-foreground">{detailRecord.userEmail} · {formatDate(detailRecord.created_at)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPdf(detailRecord)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {language === "en" ? "Full PDF" : language === "zh-TW" ? "下載完整報告" : "下载完整报告"}
                  </button>
                  <button onClick={() => setDetailRecord(null)} className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-72px)]">
                {/* Main & Secondary Anchor */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">{language === "en" ? "High-Sensitivity Anchor" : language === "zh-TW" ? "高敏感錨" : "高敏感锚"}</div>
                    <div className="text-lg font-bold text-primary">{getAnchorFullLabel(detailRecord.main_anchor)}</div>
                    <div className="text-2xl font-black text-primary mt-1">{getScoreValue(detailRecord, detailRecord.main_anchor).toFixed(0)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/40">
                    <div className="text-xs text-muted-foreground mb-1">{language === "en" ? "Second Highest" : language === "zh-TW" ? "次高分錨點" : "次高分锚点"}</div>
                    {detailRecord.secondary_anchor && ANCHOR_SHORT[detailRecord.secondary_anchor] ? (
                      <>
                        <div className="text-lg font-bold text-amber-700">{getAnchorFullLabel(detailRecord.secondary_anchor)}</div>
                        <div className="text-2xl font-black text-amber-600 mt-1">{getScoreValue(detailRecord, detailRecord.secondary_anchor).toFixed(0)}</div>
                      </>
                    ) : (
                      <div className="text-lg font-bold text-muted-foreground mt-2">-</div>
                    )}
                  </div>
                </div>

                {/* All Scores */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">{language === "en" ? "All Dimension Scores" : language === "zh-TW" ? "八維度得分" : "八维度得分"}</h4>
                  <div className="space-y-2.5">
                    {DIMENSION_KEYS.map((dimension) => {
                      const score = getScoreValue(detailRecord, dimension);
                      const isHighSensDetail = score > 80;
                      return (
                        <div key={dimension} className="flex items-center gap-3">
                          <div className="w-20 text-xs font-medium text-foreground">{getAnchorLabel(dimension)}</div>
                          <div className="flex-1 h-3 rounded-full bg-muted/20 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(score, 100)}%` }}
                              transition={{ duration: 0.5, delay: 0.1 }}
                              className={cn(
                                "h-full rounded-full",
                                isHighSensDetail ? "bg-primary" :
                                score >= 70 ? "bg-emerald-500" :
                                score >= 50 ? "bg-amber-500" : "bg-slate-300"
                              )}
                            />
                          </div>
                          <span className={cn("w-8 text-right text-sm font-bold tabular-nums", isHighSensDetail ? "text-primary" : "text-foreground")}>
                            {score.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/10 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === "en" ? "Risk Index" : language === "zh-TW" ? "風險指數" : "风险指数"}</div>
                    <div className={cn(
                      "text-lg font-bold",
                      Number(detailRecord.risk_index) >= 70 ? "text-red-500" :
                      Number(detailRecord.risk_index) >= 40 ? "text-amber-500" : "text-green-500"
                    )}>
                      {Number(detailRecord.risk_index).toFixed(0)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/10 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === "en" ? "Stability" : language === "zh-TW" ? "穩定性" : "稳定性"}</div>
                    <div className="text-lg font-bold text-foreground">{detailRecord.stability ? getStabilityLabel(detailRecord.stability, language) : "-"}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/10 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === "en" ? "Questions" : language === "zh-TW" ? "題目數" : "题目数"}</div>
                    <div className="text-lg font-bold text-foreground">{detailRecord.question_count}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/10 border border-border">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{language === "en" ? "Time" : language === "zh-TW" ? "用時" : "用时"}</div>
                    <div className="text-lg font-bold text-foreground">{formatTime(detailRecord.completion_time_seconds)}</div>
                  </div>
                </div>

                {/* Conflict Anchors */}
                {detailRecord.conflict_anchors && detailRecord.conflict_anchors.length > 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50/50 border border-amber-200/40">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-medium text-amber-700">
                        {language === "en" ? "Conflict Anchors" : language === "zh-TW" ? "衝突錨" : "冲突锚"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {detailRecord.conflict_anchors.map((anchor) => (
                        <span key={anchor} className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {getAnchorFullLabel(anchor)}
                        </span>
                      ))}
                    </div>
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


