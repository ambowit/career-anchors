import { useState, Fragment, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Compass, Heart, Eye, Download, X, ChevronDown,
  ChevronUp, Loader2, Target, AlertTriangle,
  ListChecks, Layers, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CPC_WEB_BODY_RESET } from "@/lib/reportDesignSystem";
import { useTranslation } from "@/hooks/useLanguage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { QUESTIONS_DATA, standardizeScores } from "@/data/questions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { downloadV3ReportAsPdf } from "@/lib/reportV3Download";
import type { Language } from "@/hooks/useLanguage";

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
  careerStage?: string | null;
}

interface IdealCardReport {
  id: string;
  user_id: string;
  top10_cards: Array<{ rank: number; cardId: number; category: string; label?: string; labelEn?: string }>;
  category_distribution: Record<string, number>;
  created_at: string;
  userName: string;
  userEmail: string;
  orgName?: string | null;
  deptName?: string | null;
  careerStage?: string | null;
}

interface FusionReport {
  id: string;
  user_id: string;
  anchor_scores: Record<string, number>;
  value_ranking: Array<{ rank: number; cardId: number; category: string; label?: string; labelEn?: string }>;
  conflict_index: number;
  motivation_alignment: number;
  core_positioning: string;
  generated_at: string;
  userName: string;
  userEmail: string;
  orgName?: string | null;
  deptName?: string | null;
  careerStage?: string | null;
}

interface AssessmentReportsViewProps {
  assessmentResults?: AssessmentRecord[];
  idealCardReports?: IdealCardReport[];
  fusionReports?: FusionReport[];
  isLoadingAssessments?: boolean;
  isLoadingIdealCards?: boolean;
  isLoadingFusion?: boolean;
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

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  intrinsic: { "zh-CN": "内在价值", "zh-TW": "內在價值", en: "Intrinsic" },
  material: { "zh-CN": "物质保障", "zh-TW": "物質保障", en: "Material" },
  interpersonal: { "zh-CN": "人际连结", "zh-TW": "人際連結", en: "Interpersonal" },
  lifestyle: { "zh-CN": "生活方式", "zh-TW": "生活方式", en: "Lifestyle" },
};

const CATEGORY_COLORS: Record<string, string> = {
  intrinsic: "bg-indigo-50 text-indigo-600 border-indigo-200",
  material: "bg-emerald-50 text-emerald-600 border-emerald-200",
  interpersonal: "bg-rose-50 text-rose-600 border-rose-200",
  lifestyle: "bg-sky-50 text-sky-600 border-sky-200",
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

type TabType = "career_anchor" | "ideal_card" | "combined";

export default function AssessmentReportsView({
  assessmentResults = [],
  idealCardReports = [],
  fusionReports = [],
  isLoadingAssessments = false,
  isLoadingIdealCards = false,
  isLoadingFusion = false,
  scope,
}: AssessmentReportsViewProps) {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("career_anchor");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [answerExpandedId, setAnswerExpandedId] = useState<string | null>(null);
  const [detailRecord, setDetailRecord] = useState<AssessmentRecord | null>(null);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<{ id: string; name: string; tab: TabType } | null>(null);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const queryClient = useQueryClient();

  const isLoading = activeTab === "career_anchor"
    ? isLoadingAssessments
    : activeTab === "ideal_card"
      ? isLoadingIdealCards
      : isLoadingFusion;

  // Column count for career anchor table (no risk column now)
  const totalColumns = 8;

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
    const cardLabels = (report.top10_cards || []).map((card) =>
      language === "en" ? (card.labelEn || card.label || "") : (card.label || "")
    ).join(" ").toLowerCase();
    return (
      report.userName.toLowerCase().includes(query) ||
      report.userEmail.toLowerCase().includes(query) ||
      cardLabels.includes(query)
    );
  });

  // Filter out records with empty value_ranking (corrupted / legacy data)
  const validFusionReports = fusionReports.filter(
    (report) => report.value_ranking && report.value_ranking.length > 0,
  );

  const filteredFusion = validFusionReports.filter((report) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      report.userName.toLowerCase().includes(query) ||
      report.userEmail.toLowerCase().includes(query)
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

  /** Derive main anchor from anchor_scores jsonb */
  const getMainAnchorFromScores = (scores: Record<string, number>): string => {
    let maxKey = "TF";
    let maxVal = -1;
    for (const [key, val] of Object.entries(scores)) {
      if (val > maxVal) { maxVal = val; maxKey = key; }
    }
    return maxKey;
  };

  // ─── Career Anchor Handlers ───

  const handleDownloadV3Pdf = async (record: AssessmentRecord) => {
    setDownloadingReportId(record.id);
    toast.info(language === "en" ? "Generating report, please wait..." : language === "zh-TW" ? "正在生成報告，請稍候..." : "正在生成报告，请稍候...");
    try {
      const displayScores = buildStandardizedScores(record);
      await downloadV3ReportAsPdf({
        scores: displayScores,
        careerStage: record.careerStage || "mid",
        userName: record.userName,
        workExperienceYears: null,
        userId: record.user_id,
        language: language as "zh-CN" | "zh-TW" | "en",
        assessmentDate: formatDate(record.created_at),
      });
      toast.success(language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载");
    } catch {
      toast.error(language === "en" ? "Report generation failed" : language === "zh-TW" ? "報告生成失敗" : "报告生成失败");
    } finally {
      setDownloadingReportId(null);
    }
  };

  const handleViewReport = async (record: AssessmentRecord) => {
    setViewingReportId(record.id);
    toast.info(language === "en" ? "Generating report, please wait..." : language === "zh-TW" ? "正在生成報告，請稍候..." : "正在生成报告，请稍候...");
    try {
      const displayScores = buildStandardizedScores(record);
      const { generateV3Report } = await import("@/lib/reportV3Generator");
      const reportOutput = await generateV3Report(
        {
          scores: displayScores,
          careerStage: record.careerStage || "mid",
          userName: record.userName,
          workExperienceYears: null,
          userId: record.user_id,
          reportVersion: "professional",
          reportType: "career_anchor",
        },
        language as "zh-CN" | "zh-TW" | "en",
        undefined,
        { showWeights: false }
      );
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`<style>${CPC_WEB_BODY_RESET}</style>` + reportOutput.bodyHtml);
        newWindow.document.close();
      }
    } catch {
      toast.error(language === "en" ? "Failed to generate report" : language === "zh-TW" ? "報告生成失敗" : "报告生成失败");
    } finally {
      setViewingReportId(null);
    }
  };

  // ─── Ideal Card Handlers ───

  const handleViewIdealCardReport = async (report: IdealCardReport) => {
    setViewingReportId(report.id);
    toast.info(language === "en" ? "Generating report, please wait..." : language === "zh-TW" ? "正在生成報告，請稍候..." : "正在生成报告，请稍候...");
    try {
      const { generateIdealCardReportHTML } = await import("@/lib/exportReport");
      const { downloadLatestIdealCardReport } = await import("@/lib/reportIdealCardDownload");
      // Use the download function's data pipeline but intercept for viewing
      // Simplification: open in new window using the same HTML generation logic
      const rankedCards = (report.top10_cards || []).map((card) => ({
        rank: card.rank,
        cardId: card.cardId,
        category: card.category as "intrinsic" | "material" | "interpersonal" | "lifestyle",
      }));

      // Fetch generator data (spectrum + quadrant)
      const { supabase } = await import("@/integrations/supabase/client");
      const cardIds = rankedCards.map((card) => card.cardId);
      const { data: lifeCards } = await supabase
        .from("life_cards")
        .select("id, sort_order, spectrum_type")
        .in("sort_order", cardIds);

      const spectrumMap: Record<number, "career" | "neutral" | "lifestyle"> = {};
      const sortOrderToUuid: Record<number, string> = {};
      if (lifeCards) {
        for (const lifeCard of lifeCards) {
          sortOrderToUuid[lifeCard.sort_order as number] = lifeCard.id as string;
          if (lifeCard.spectrum_type) {
            spectrumMap[lifeCard.sort_order as number] = lifeCard.spectrum_type as "career" | "neutral" | "lifestyle";
          }
        }
      }

      const quadrantMap: Record<number, { external: string; internal: string; career: string; relationship: string }> = {};
      const lifeCardUuids = Object.values(sortOrderToUuid);
      if (lifeCardUuids.length > 0) {
        const { data: quadrants } = await supabase
          .from("life_card_quadrant_contents")
          .select("card_id, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship")
          .in("card_id", lifeCardUuids)
          .eq("language", language);

        if (quadrants) {
          const uuidToSortOrder: Record<string, number> = {};
          for (const [sortOrder, uuid] of Object.entries(sortOrderToUuid)) {
            uuidToSortOrder[uuid] = Number(sortOrder);
          }
          for (const quadrant of quadrants) {
            const sortOrder = uuidToSortOrder[quadrant.card_id as string];
            if (sortOrder === undefined) continue;
            quadrantMap[sortOrder] = {
              external: (quadrant.quadrant_external as string) || "",
              internal: (quadrant.quadrant_internal as string) || "",
              career: (quadrant.quadrant_career as string) || "",
              relationship: (quadrant.quadrant_relationship as string) || "",
            };
          }
        }
      }

      const isEn = language === "en";
      const isTW = language === "zh-TW";
      const reportHtml = generateIdealCardReportHTML(
        {
          rankedCards,
          userName: report.userName || undefined,
          createdAt: new Date(report.created_at).toLocaleString(isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN"),
          quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
          spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
        },
        language as Language,
      );

      const resetStyleTag = `<style>${CPC_WEB_BODY_RESET}</style>`;
      const adjustedHtml = reportHtml.includes("</head>")
        ? reportHtml.replace("</head>", resetStyleTag + "</head>")
        : resetStyleTag + reportHtml;
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(adjustedHtml);
        newWindow.document.close();
      }
    } catch {
      toast.error(language === "en" ? "Failed to generate report" : language === "zh-TW" ? "報告生成失敗" : "报告生成失败");
    } finally {
      setViewingReportId(null);
    }
  };

  const handleDownloadIdealCardPdf = async (report: IdealCardReport) => {
    setDownloadingReportId(report.id);
    toast.info(language === "en" ? "Generating report, please wait..." : language === "zh-TW" ? "正在生成報告，請稍候..." : "正在生成报告，请稍候...");
    try {
      const { downloadLatestIdealCardReport } = await import("@/lib/reportIdealCardDownload");
      const success = await downloadLatestIdealCardReport(
        report.user_id,
        report.userName,
        report.careerStage || "mid",
        language as Language,
      );
      if (success) {
        toast.success(language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载");
      } else {
        toast.error(language === "en" ? "No data found" : language === "zh-TW" ? "找不到數據" : "找不到数据");
      }
    } catch {
      toast.error(language === "en" ? "Report generation failed" : language === "zh-TW" ? "報告生成失敗" : "报告生成失败");
    } finally {
      setDownloadingReportId(null);
    }
  };

  // ─── Fusion / Combined Handlers ───

  /** Shared logic: build combined fusion HTML from the report data directly */
  const buildFusionReportFromData = useCallback(async (report: FusionReport) => {
    const anchorScores = report.anchor_scores || {};
    const rankedCards = (report.value_ranking || []).map((card) => ({
      rank: card.rank,
      cardId: card.cardId,
      category: card.category as "intrinsic" | "material" | "interpersonal" | "lifestyle",
      label: card.label || "",
      labelEn: card.labelEn || "",
    }));

    if (Object.keys(anchorScores).length === 0 || rankedCards.length === 0) {
      return null;
    }

    const {
      fetchIdealCardGeneratorData,
      fetchAiCardDescriptions,
      generateCombinedFusionHTML,
    } = await import("@/lib/reportFusionDownload");

    const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(rankedCards, language as Language);
    const aiDescriptions = await fetchAiCardDescriptions(rankedCards, quadrantMap, language as Language);

    const result = await generateCombinedFusionHTML({
      anchorScores,
      careerStage: report.careerStage || "mid",
      rankedCards,
      quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
      spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
      aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
      userId: report.user_id,
      userName: report.userName,
      workExperienceYears: null,
      language: language as Language,
      assessmentDate: report.generated_at
        ? new Date(report.generated_at).toLocaleDateString(
            language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN",
          )
        : undefined,
    });

    return result;
  }, [language]);

  const handleViewFusionReport = async (report: FusionReport) => {
    if (!report.value_ranking || report.value_ranking.length === 0) {
      toast.error(
        language === "en"
          ? "This participant's ideal life card data was not captured (possibly completed before the database field was added). Please ask the participant to retake the ideal life card portion."
          : language === "zh-TW"
            ? "此參與者的理想人生卡排名數據未被記錄（可能在資料庫欄位新增前完成）。請安排參與者重新完成理想人生卡部分。"
            : "此参与者的理想人生卡排名数据未被记录（可能在数据库字段新增前完成）。请安排参与者重新完成理想人生卡部分。",
        { duration: 6000 },
      );
      return;
    }
    setViewingReportId(report.id);
    toast.info(language === "en" ? "Generating integration report, please wait..." : language === "zh-TW" ? "正在生成整合報告，請稍候..." : "正在生成整合报告，请稍候...");
    try {
      const result = await buildFusionReportFromData(report);
      if (result) {
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(`<style>${CPC_WEB_BODY_RESET}</style>` + result.fullHtml);
          newWindow.document.close();
        }
      } else {
        toast.error(language === "en" ? "Insufficient data" : language === "zh-TW" ? "數據不足" : "数据不足");
      }
    } catch {
      toast.error(language === "en" ? "Report generation failed" : language === "zh-TW" ? "報告生成失敗" : "报告生成失败");
    } finally {
      setViewingReportId(null);
    }
  };

  const handleDownloadFusionPdf = async (report: FusionReport) => {
    if (!report.value_ranking || report.value_ranking.length === 0) {
      toast.error(
        language === "en"
          ? "This participant's Espresso Card data was not captured (possibly completed before the database field was added). Please ask the participant to retake the Espresso Card portion."
          : language === "zh-TW"
            ? "此參與者的理想人生卡排名數據未被記錄（可能在資料庫欄位新增前完成）。請安排參與者重新完成理想人生卡部分。"
            : "此参与者的理想人生卡排名数据未被记录（可能在数据库字段新增前完成）。请安排参与者重新完成理想人生卡部分。",
        { duration: 6000 },
      );
      return;
    }
    setDownloadingReportId(report.id);
    toast.info(language === "en" ? "Generating integration report, please wait..." : language === "zh-TW" ? "正在生成整合報告，請稍候..." : "正在生成整合报告，请稍候...");
    try {
      const result = await buildFusionReportFromData(report);
      if (!result) {
        toast.error(language === "en" ? "Insufficient data" : language === "zh-TW" ? "數據不足" : "数据不足");
        return;
      }
      const { downloadReportWithCover } = await import("@/lib/exportReport");
      await downloadReportWithCover(
        result.fullHtml,
        {
          reportType: "fusion",
          userName: report.userName || (language === "en" ? "User" : "\u7528\u6236"),
          workExperienceYears: null,
          careerStage: report.careerStage || "mid",
          reportVersion: "professional",
          language: language as Language,
          userId: report.user_id,
          reportNumber: result.reportNumber,
          assessmentDate: report.generated_at
            ? new Date(report.generated_at).toLocaleDateString(
                language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN",
              )
            : undefined,
        },
        `SCPC-Fusion-Report-${result.reportNumber}-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success(language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载");
    } catch {
      toast.error(language === "en" ? "Report generation failed" : language === "zh-TW" ? "報告生成失敗" : "报告生成失败");
    } finally {
      setDownloadingReportId(null);
    }
  };

  // ─── Delete Assessment Record (super admin only) ───

  const handleDeleteRecord = useCallback(async () => {
    if (!deleteConfirmRecord) return;
    setIsDeletingReport(true);
    try {
      const isIndividualRecord = deleteConfirmRecord.id.startsWith("ind-");
      const realId = isIndividualRecord ? deleteConfirmRecord.id.slice(4) : deleteConfirmRecord.id;
      const tableName = isIndividualRecord ? "assessment_results" : "scpc_assessment_results";
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", realId);
      if (error) throw error;

      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      queryClient.invalidateQueries({ queryKey: ["org"] });

      toast.success(
        language === "en"
          ? `Report for "${deleteConfirmRecord.name}" has been deleted`
          : language === "zh-TW"
            ? `已刪除「${deleteConfirmRecord.name}」的測評報告`
            : `已删除「${deleteConfirmRecord.name}」的测评报告`,
      );
    } catch {
      toast.error(
        language === "en" ? "Failed to delete report" : language === "zh-TW" ? "刪除失敗" : "删除失败",
      );
    } finally {
      setIsDeletingReport(false);
      setDeleteConfirmRecord(null);
    }
  }, [deleteConfirmRecord, language, queryClient]);

  // ─── CSV Export ───

  const handleExportCSV = () => {
    if (activeTab === "career_anchor") {
      const headers = [
        language === "en" ? "Name" : "姓名",
        language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱",
        language === "en" ? "Core Advantage" : language === "zh-TW" ? "核心優勢錨" : "核心优势锚",
        language === "en" ? "Second Anchor" : language === "zh-TW" ? "次高分錨" : "次高分锚",
        ...DIMENSION_KEYS.map((dimensionKey) => ANCHOR_LABELS[dimensionKey]?.[language] || dimensionKey),
        language === "en" ? "Clarity Index" : language === "zh-TW" ? "錨定清晰度" : "锚定清晰度",
        language === "en" ? "Assessment Date" : language === "zh-TW" ? "測評日期" : "测评日期",
      ];
      const rows = filteredAssessments.map((record) => {
        const standardizedCsv = buildStandardizedScores(record);
        return [
          record.userName,
          record.userEmail,
          getAnchorLabel(record.main_anchor),
          getAnchorLabel(record.secondary_anchor),
          ...DIMENSION_KEYS.map((dimension) => standardizedCsv[dimension] ?? 0),
          record.risk_index,
          formatDate(record.created_at),
        ];
      });
      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `career-anchor-reports-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(language === "en" ? "CSV exported" : language === "zh-TW" ? "CSV 已匯出" : "CSV 已导出");
    } else if (activeTab === "ideal_card") {
      const headers = [
        language === "en" ? "Name" : "姓名",
        language === "en" ? "Email" : language === "zh-TW" ? "信箱" : "邮箱",
        language === "en" ? "Top 3 Cards" : language === "zh-TW" ? "前三張價值卡" : "前三张价值卡",
        language === "en" ? "Date" : "日期",
      ];
      const rows = filteredIdealCards.map((report) => {
        const topCards = (report.top10_cards || []).slice(0, 3);
        const cardNames = topCards.map((card) =>
          language === "en" ? (card.labelEn || card.label || "") : (card.label || "")
        ).join(" / ");
        return [
          report.userName,
          report.userEmail,
          cardNames,
          formatDate(report.created_at),
        ];
      });
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

  const getAnswers = (record: AssessmentRecord): StoredAnswer[] => {
    if (!record.answers) return [];
    if (Array.isArray(record.answers)) return record.answers as StoredAnswer[];
    return [];
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setSearchQuery("");
    setExpandedRowId(null);
    setAnswerExpandedId(null);
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
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl mb-6 w-fit">
        <button
          onClick={() => switchTab("career_anchor")}
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
          onClick={() => switchTab("ideal_card")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "ideal_card"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Heart className="w-4 h-4" />
          {language === "en" ? "Espresso Card" : language === "zh-TW" ? "理想人生卡" : "理想人生卡"}
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {idealCardReports.length}
          </span>
        </button>
        <button
          onClick={() => switchTab("combined")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === "combined"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-4 h-4" />
          {language === "en" ? "Integration" : language === "zh-TW" ? "整合測評" : "整合测评"}
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {validFusionReports.length}
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

      {/* ═══ Career Anchor Tab ═══ */}
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
              <table className="w-full" style={{ tableLayout: "fixed", minWidth: 900 }}>
                <colgroup>
                  <col style={{ width: 190 }} />
                  <col style={{ width: 140 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 100 }} />
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
                      {language === "en" ? "Core Adv." : language === "zh-TW" ? "核心優勢" : "核心优势"}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {language === "en" ? "2nd Anchor" : language === "zh-TW" ? "次高分" : "次高分"}
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
                                onClick={(event) => { event.stopPropagation(); handleViewReport(record); }}
                                disabled={viewingReportId === record.id}
                                className={cn("p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-primary transition-colors", viewingReportId === record.id && "opacity-50 pointer-events-none")}
                                title={language === "en" ? "View Full Report" : language === "zh-TW" ? "查看完整報告" : "查看完整报告"}
                              >
                                {viewingReportId === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={(event) => { event.stopPropagation(); handleDownloadV3Pdf(record); }}
                                disabled={downloadingReportId === record.id}
                                className={cn("p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-emerald-600 transition-colors", downloadingReportId === record.id && "opacity-50 pointer-events-none")}
                                title={language === "en" ? "Download Full Report" : language === "zh-TW" ? "下載完整報告" : "下载完整报告"}
                              >
                                {downloadingReportId === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
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
                                        {(() => {
                                          const standardized = buildStandardizedScores(record);
                                          return DIMENSION_KEYS.map((dimension) => {
                                            const score = standardized[dimension] ?? 0;
                                            const isCoreAdv = score >= 80;
                                            const isTopAnchor = record.main_anchor === dimension;
                                            return (
                                              <div
                                                key={dimension}
                                                className={cn(
                                                  "flex items-center gap-3 p-2.5 rounded-lg border",
                                                  isCoreAdv ? "border-primary/30 bg-primary/5" :
                                                  isTopAnchor ? "border-amber-300/40 bg-amber-50/30" :
                                                  "border-border bg-card"
                                                )}
                                              >
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-xs font-medium text-foreground">
                                                      {getAnchorLabel(dimension)}
                                                    </span>
                                                    {isCoreAdv && <Target className="w-3 h-3 text-primary" />}
                                                  </div>
                                                  <div className="mt-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                                    <div
                                                      className={cn(
                                                        "h-full rounded-full transition-all",
                                                        isCoreAdv ? "bg-primary" :
                                                        score >= 70 ? "bg-emerald-500" :
                                                        score >= 50 ? "bg-amber-500" : "bg-slate-300"
                                                      )}
                                                      style={{ width: `${Math.min(score, 100)}%` }}
                                                    />
                                                  </div>
                                                </div>
                                                <span className={cn(
                                                  "text-sm font-bold tabular-nums",
                                                  isCoreAdv ? "text-primary" : "text-foreground"
                                                )}>
                                                  {score}
                                                </span>
                                              </div>
                                            );
                                          });
                                        })()}
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

                                      {/* Action buttons row */}
                                      <div className="mt-4 flex items-center gap-4">
                                        {answers.length > 0 && (
                                          <button
                                            onClick={(event) => { event.stopPropagation(); setAnswerExpandedId(isAnswerExpanded ? null : record.id); }}
                                            className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                          >
                                            <ListChecks className="w-3.5 h-3.5" />
                                            {language === "en" ? "Answer Details" : language === "zh-TW" ? "查看答題詳情" : "查看答题详情"}
                                            {isAnswerExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                          </button>
                                        )}
                                        <button
                                          onClick={(event) => { event.stopPropagation(); handleViewReport(record); }}
                                          disabled={viewingReportId === record.id}
                                          className={cn("flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors", viewingReportId === record.id && "opacity-50 pointer-events-none")}
                                        >
                                          {viewingReportId === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                          {language === "en" ? "View Report" : language === "zh-TW" ? "查看完整報告" : "查看完整报告"}
                                        </button>
                                        <button
                                          onClick={(event) => { event.stopPropagation(); handleDownloadV3Pdf(record); }}
                                          disabled={downloadingReportId === record.id}
                                          className={cn("flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors", downloadingReportId === record.id && "opacity-50 pointer-events-none")}
                                        >
                                          {downloadingReportId === record.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                          {language === "en" ? "Download PDF" : language === "zh-TW" ? "下載完整報告" : "下载完整报告"}
                                        </button>
                                      </div>
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
                                                    <th className="text-center font-medium text-muted-foreground px-3 py-2 w-24">{language === "en" ? "Dim" : language === "zh-TW" ? "維度" : "维度"}</th>
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

      {/* ═══ Ideal Card Tab ═══ */}
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
            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout: "fixed", minWidth: 800 }}>
                <colgroup>
                  <col style={{ width: 200 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 260 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 100 }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/5">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{language === "en" ? "User" : language === "zh-TW" ? "使用者" : "用户"}</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {scope === "super_admin"
                        ? (language === "en" ? "Organization" : language === "zh-TW" ? "所屬機構" : "所属机构")
                        : (language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门")}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">{language === "en" ? "Top 3 Cards" : language === "zh-TW" ? "前三張價值卡" : "前三张价值卡"}</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">{language === "en" ? "Date" : "日期"}</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredIdealCards.map((report) => {
                    const topCards = report.top10_cards || [];
                    const isExpanded = expandedRowId === report.id;

                    return (
                      <Fragment key={report.id}>
                        <tr
                          className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors cursor-pointer"
                          onClick={() => setExpandedRowId(isExpanded ? null : report.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {report.userName[0] || "?"}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{report.userName}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{report.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-muted-foreground truncate block">
                              {scope === "super_admin" ? (report.orgName || "-") : (report.deptName || "-")}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {topCards.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {topCards.slice(0, 3).map((card, index) => (
                                  <span key={index} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600 border border-pink-200">
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
                          <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(report.created_at)}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={(event) => { event.stopPropagation(); handleViewIdealCardReport(report); }}
                                disabled={viewingReportId === report.id}
                                className={cn("p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-primary transition-colors", viewingReportId === report.id && "opacity-50 pointer-events-none")}
                                title={language === "en" ? "View Report" : language === "zh-TW" ? "查看報告" : "查看报告"}
                              >
                                {viewingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={(event) => { event.stopPropagation(); handleDownloadIdealCardPdf(report); }}
                                disabled={downloadingReportId === report.id}
                                className={cn("p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-emerald-600 transition-colors", downloadingReportId === report.id && "opacity-50 pointer-events-none")}
                                title={language === "en" ? "Download Report" : language === "zh-TW" ? "下載報告" : "下载报告"}
                              >
                                {downloadingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                              </button>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded: Top 10 Cards Detail */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <AnimatePresence>
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-muted/5 border-b border-border/50 px-6 py-4">
                                    <div className="text-xs font-medium text-muted-foreground mb-3">
                                      {language === "en" ? "Top 10 Value Cards" : language === "zh-TW" ? "前十張價值卡排名" : "前十张价值卡排名"}
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                      {topCards.slice(0, 10).map((card, index) => {
                                        const categoryColor = CATEGORY_COLORS[card.category] || "bg-muted text-muted-foreground border-border";
                                        return (
                                          <div key={index} className={cn("flex items-center gap-2 p-2 rounded-lg border", categoryColor)}>
                                            <span className="text-xs font-bold text-muted-foreground w-4 text-right">#{card.rank}</span>
                                            <div className="min-w-0 flex-1">
                                              <div className="text-xs font-medium truncate">
                                                {language === "en"
                                                  ? (card.labelEn || card.label)
                                                  : language === "zh-TW" && card.label
                                                    ? (idealCardLabelMap.get(card.label) || card.label)
                                                    : card.label}
                                              </div>
                                              <div className="text-[10px] opacity-70">
                                                {CATEGORY_LABELS[card.category]?.[language] || card.category}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Category Distribution */}
                                    {report.category_distribution && (
                                      <div className="mt-4">
                                        <div className="text-xs font-medium text-muted-foreground mb-2">
                                          {language === "en" ? "Category Distribution" : language === "zh-TW" ? "類別分佈" : "类别分布"}
                                        </div>
                                        <div className="flex gap-3">
                                          {Object.entries(report.category_distribution).map(([category, count]) => (
                                            <div key={category} className="flex items-center gap-1.5">
                                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", CATEGORY_COLORS[category] || "bg-muted text-muted-foreground border-border")}>
                                                {CATEGORY_LABELS[category]?.[language] || category}
                                              </span>
                                              <span className="text-xs font-semibold text-foreground">{count as number}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Action buttons */}
                                    <div className="mt-4 flex items-center gap-4">
                                      <button
                                        onClick={(event) => { event.stopPropagation(); handleViewIdealCardReport(report); }}
                                        disabled={viewingReportId === report.id}
                                        className={cn("flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors", viewingReportId === report.id && "opacity-50 pointer-events-none")}
                                      >
                                        {viewingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                        {language === "en" ? "View Report" : language === "zh-TW" ? "查看完整報告" : "查看完整报告"}
                                      </button>
                                      <button
                                        onClick={(event) => { event.stopPropagation(); handleDownloadIdealCardPdf(report); }}
                                        disabled={downloadingReportId === report.id}
                                        className={cn("flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors", downloadingReportId === report.id && "opacity-50 pointer-events-none")}
                                      >
                                        {downloadingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        {language === "en" ? "Download PDF" : language === "zh-TW" ? "下載完整報告" : "下载完整报告"}
                                      </button>
                                    </div>
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

      {/* ═══ Combined / Fusion Tab ═══ */}
      {!isLoading && activeTab === "combined" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl overflow-hidden"
        >
          {filteredFusion.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {language === "en" ? "No integration assessment reports found" : language === "zh-TW" ? "暫無整合測評報告" : "暂无整合测评报告"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ tableLayout: "fixed", minWidth: 860 }}>
                <colgroup>
                  <col style={{ width: 190 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 100 }} />
                  <col style={{ width: 160 }} />
                  <col style={{ width: 80 }} />
                  <col style={{ width: 120 }} />
                  <col style={{ width: 100 }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/5">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">{language === "en" ? "User" : language === "zh-TW" ? "使用者" : "用户"}</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {scope === "super_admin"
                        ? (language === "en" ? "Organization" : language === "zh-TW" ? "所屬機構" : "所属机构")
                        : (language === "en" ? "Department" : language === "zh-TW" ? "部門" : "部门")}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {language === "en" ? "Core Anchor" : language === "zh-TW" ? "核心錨點" : "核心锚点"}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">
                      {language === "en" ? "Top Card" : language === "zh-TW" ? "首選卡" : "首选卡"}
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-2 py-3">
                      {language === "en" ? "Align" : language === "zh-TW" ? "一致性" : "一致性"}
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-3 py-3">{language === "en" ? "Date" : "日期"}</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredFusion.map((report) => {
                    const isExpanded = expandedRowId === report.id;
                    const mainAnchor = getMainAnchorFromScores(report.anchor_scores || {});
                    const topCard = (report.value_ranking || [])[0];
                    const alignmentValue = Math.round(report.motivation_alignment || 0);

                    return (
                      <Fragment key={report.id}>
                        <tr
                          className="border-b border-border/50 last:border-0 hover:bg-muted/5 transition-colors cursor-pointer"
                          onClick={() => setExpandedRowId(isExpanded ? null : report.id)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {report.userName[0] || "?"}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{report.userName}</div>
                                <div className="text-[11px] text-muted-foreground truncate">{report.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-xs text-muted-foreground truncate block">
                              {scope === "super_admin" ? (report.orgName || "-") : (report.deptName || "-")}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium border whitespace-nowrap inline-block", ANCHOR_COLORS[mainAnchor] || "bg-muted text-muted-foreground")}>
                              {getAnchorLabel(mainAnchor)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {topCard && (
                              <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", CATEGORY_COLORS[topCard.category] || "bg-muted text-muted-foreground border-border")}>
                                {language === "en"
                                  ? (topCard.labelEn || topCard.label || "")
                                  : language === "zh-TW" && topCard.label
                                    ? (idealCardLabelMap.get(topCard.label) || topCard.label)
                                    : (topCard.label || "")}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className={cn(
                              "text-xs font-semibold",
                              alignmentValue >= 60 ? "text-emerald-500" :
                              alignmentValue >= 30 ? "text-amber-500" : "text-red-400"
                            )}>
                              {alignmentValue}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(report.generated_at)}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={(event) => { event.stopPropagation(); handleViewFusionReport(report); }}
                                disabled={viewingReportId === report.id}
                                className={cn("p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-primary transition-colors", viewingReportId === report.id && "opacity-50 pointer-events-none")}
                                title={language === "en" ? "View Report" : language === "zh-TW" ? "查看報告" : "查看报告"}
                              >
                                {viewingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={(event) => { event.stopPropagation(); handleDownloadFusionPdf(report); }}
                                disabled={downloadingReportId === report.id}
                                className={cn("p-1.5 rounded-lg hover:bg-muted/20 text-muted-foreground hover:text-emerald-600 transition-colors", downloadingReportId === report.id && "opacity-50 pointer-events-none")}
                                title={language === "en" ? "Download Report" : language === "zh-TW" ? "下載報告" : "下载报告"}
                              >
                                {downloadingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                              </button>
                              {scope === "super_admin" && (
                                <button
                                  onClick={(event) => { event.stopPropagation(); setDeleteConfirmRecord({ id: report.id, name: report.userName, tab: "combined" }); }}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors"
                                  title={language === "en" ? "Delete Record" : language === "zh-TW" ? "刪除記錄" : "删除记录"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-primary" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded: Fusion Details */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <AnimatePresence>
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-muted/5 border-b border-border/50 px-6 py-4">
                                    {/* Anchor Scores */}
                                    <div className="text-xs font-medium text-muted-foreground mb-3">
                                      {language === "en" ? "Career Anchor Scores" : language === "zh-TW" ? "職業錨得分" : "职业锚得分"}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                      {DIMENSION_KEYS.map((dimension) => {
                                        const score = Math.round(Number(report.anchor_scores?.[dimension]) || 0);
                                        const isCoreAdv = score >= 80;
                                        return (
                                          <div key={dimension} className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border",
                                            isCoreAdv ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                                          )}>
                                            <div className="flex-1 min-w-0">
                                              <span className="text-xs font-medium text-foreground">{getAnchorLabel(dimension)}</span>
                                              <div className="mt-1 h-1 rounded-full bg-muted/30 overflow-hidden">
                                                <div
                                                  className={cn("h-full rounded-full", isCoreAdv ? "bg-primary" : score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-slate-300")}
                                                  style={{ width: `${Math.min(score, 100)}%` }}
                                                />
                                              </div>
                                            </div>
                                            <span className={cn("text-xs font-bold tabular-nums", isCoreAdv ? "text-primary" : "text-foreground")}>{score}</span>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Top 3 Value Cards */}
                                    <div className="text-xs font-medium text-muted-foreground mb-2">
                                      {language === "en" ? "Top 3 Value Cards" : language === "zh-TW" ? "前三張價值卡" : "前三张价值卡"}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {(report.value_ranking || []).slice(0, 3).map((card, index) => (
                                        <span key={index} className={cn("text-[10px] px-2 py-1 rounded-lg border font-medium", CATEGORY_COLORS[card.category] || "bg-muted text-muted-foreground border-border")}>
                                          #{card.rank} {language === "en" ? (card.labelEn || card.label) : language === "zh-TW" && card.label ? (idealCardLabelMap.get(card.label) || card.label) : card.label}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-3 gap-3">
                                      <div className="p-2.5 rounded-lg bg-card border border-border">
                                        <div className="text-[10px] text-muted-foreground">{language === "en" ? "Alignment" : language === "zh-TW" ? "一致性" : "一致性"}</div>
                                        <div className={cn("text-lg font-bold", alignmentValue >= 60 ? "text-emerald-500" : alignmentValue >= 30 ? "text-amber-500" : "text-red-400")}>
                                          {alignmentValue}%
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-card border border-border">
                                        <div className="text-[10px] text-muted-foreground">{language === "en" ? "Conflict Index" : language === "zh-TW" ? "衝突指數" : "冲突指数"}</div>
                                        <div className={cn(
                                          "text-lg font-bold",
                                          Number(report.conflict_index) >= 60 ? "text-red-500" :
                                          Number(report.conflict_index) >= 30 ? "text-amber-500" : "text-emerald-500"
                                        )}>
                                          {Math.round(Number(report.conflict_index) || 0)}
                                        </div>
                                      </div>
                                      <div className="p-2.5 rounded-lg bg-card border border-border">
                                        <div className="text-[10px] text-muted-foreground">{language === "en" ? "Positioning" : language === "zh-TW" ? "核心定位" : "核心定位"}</div>
                                        <div className="text-sm font-semibold text-foreground truncate">
                                          {report.core_positioning || "-"}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-4 flex items-center gap-4">
                                      <button
                                        onClick={(event) => { event.stopPropagation(); handleViewFusionReport(report); }}
                                        disabled={viewingReportId === report.id}
                                        className={cn("flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors", viewingReportId === report.id && "opacity-50 pointer-events-none")}
                                      >
                                        {viewingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                                        {language === "en" ? "View Report" : language === "zh-TW" ? "查看完整報告" : "查看完整报告"}
                                      </button>
                                      <button
                                        onClick={(event) => { event.stopPropagation(); handleDownloadFusionPdf(report); }}
                                        disabled={downloadingReportId === report.id}
                                        className={cn("flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors", downloadingReportId === report.id && "opacity-50 pointer-events-none")}
                                      >
                                        {downloadingReportId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                        {language === "en" ? "Download PDF" : language === "zh-TW" ? "下載完整報告" : "下载完整报告"}
                                      </button>
                                      {scope === "super_admin" && (
                                        <button
                                          onClick={(event) => { event.stopPropagation(); setDeleteConfirmRecord({ id: report.id, name: report.userName, tab: "combined" }); }}
                                          className="flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          {language === "en" ? "Delete" : language === "zh-TW" ? "刪除記錄" : "删除记录"}
                                        </button>
                                      )}
                                    </div>
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
                    onClick={() => handleViewReport(detailRecord)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {language === "en" ? "View Report" : language === "zh-TW" ? "查看完整報告" : "查看完整报告"}
                  </button>
                  <button
                    onClick={() => handleDownloadV3Pdf(detailRecord)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {language === "en" ? "Download PDF" : language === "zh-TW" ? "下載完整報告" : "下载完整报告"}
                  </button>
                  <button onClick={() => setDetailRecord(null)} className="p-2 hover:bg-muted/20 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(80vh-72px)]">
                {(() => {
                  const standardizedDetail = buildStandardizedScores(detailRecord);
                  return (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="text-xs text-muted-foreground mb-1">{language === "en" ? "Core Advantage Anchor" : language === "zh-TW" ? "核心優勢錨點" : "核心优势锚点"}</div>
                        <div className="text-lg font-bold text-primary">{getAnchorFullLabel(detailRecord.main_anchor)}</div>
                        <div className="text-2xl font-black text-primary mt-1">{standardizedDetail[detailRecord.main_anchor] ?? 0}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/40">
                        <div className="text-xs text-muted-foreground mb-1">{language === "en" ? "Second Highest" : language === "zh-TW" ? "次高分錨點" : "次高分锚点"}</div>
                        {detailRecord.secondary_anchor && ANCHOR_SHORT[detailRecord.secondary_anchor] ? (
                          <>
                            <div className="text-lg font-bold text-amber-700">{getAnchorFullLabel(detailRecord.secondary_anchor)}</div>
                            <div className="text-2xl font-black text-amber-600 mt-1">{standardizedDetail[detailRecord.secondary_anchor] ?? 0}</div>
                          </>
                        ) : (
                          <div className="text-lg font-bold text-muted-foreground mt-2">-</div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-foreground mb-3">{language === "en" ? "All Dimension Scores" : language === "zh-TW" ? "八維度得分" : "八维度得分"}</h4>
                  <div className="space-y-2.5">
                    {(() => {
                      const standardizedModal = buildStandardizedScores(detailRecord);
                      return DIMENSION_KEYS.map((dimension) => {
                        const score = standardizedModal[dimension] ?? 0;
                        const isCoreAdvDetail = score >= 80;
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
                                  isCoreAdvDetail ? "bg-primary" :
                                  score >= 70 ? "bg-emerald-500" :
                                  score >= 50 ? "bg-amber-500" : "bg-slate-300"
                                )}
                              />
                            </div>
                            <span className={cn("w-8 text-right text-sm font-bold tabular-nums", isCoreAdvDetail ? "text-primary" : "text-foreground")}>
                              {score}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmRecord} onOpenChange={(open) => { if (!open) setDeleteConfirmRecord(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "en" ? "Delete Assessment Report" : language === "zh-TW" ? "刪除測評報告" : "删除测评报告"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "en"
                ? `Are you sure you want to permanently delete the report for "${deleteConfirmRecord?.name}"? This action cannot be undone.`
                : language === "zh-TW"
                  ? `確定要永久刪除「${deleteConfirmRecord?.name}」的測評報告嗎？此操作無法復原。`
                  : `确定要永久删除「${deleteConfirmRecord?.name}」的测评报告吗？此操作无法撤销。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingReport}>
              {language === "en" ? "Cancel" : language === "zh-TW" ? "取消" : "取消"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecord}
              disabled={isDeletingReport}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeletingReport
                ? (language === "en" ? "Deleting..." : language === "zh-TW" ? "刪除中..." : "删除中...")
                : (language === "en" ? "Delete" : language === "zh-TW" ? "確定刪除" : "确定删除")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
