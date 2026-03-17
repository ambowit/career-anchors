/**
 * Combined Assessment Report View Page
 *
 * Mirrors the career-anchor ReportViewPage / IdealCardReportViewPage pattern:
 *   1. Reads anchor scores + ranked cards from sessionStorage
 *   2. Fetches spectrum, quadrant, & AI card descriptions from DB
 *   3. Calls generateCombinedFusionHTML() — single source of truth
 *   4. Renders the HTML body via dangerouslySetInnerHTML
 *   5. Provides "Download PDF" using downloadReportWithCover()
 *
 * Web view and PDF content are always 100% consistent.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import {
  generateCombinedFusionHTML,
  fetchIdealCardGeneratorData,
  fetchAiCardDescriptions,
  COMBINED_FUSION_CSS,
  type CombinedFusionData,
} from "@/lib/reportFusionDownload";
import { downloadReportWithCover } from "@/lib/exportReport";
import type { CardCategory } from "@/data/idealCards";
import { cn, getLocalDateString, resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";
import ReportWebCover from "@/components/desktop/ReportWebCover";

/* ─────────────── Types ─────────────── */

interface StoredRankedCard {
  rank: number;
  cardId: number;
  category: CardCategory;
  label?: string;
  labelEn?: string;
}

type LoadingStep = "anchor" | "cards" | "spectrum" | "ai" | "fusion" | "render";

/* ─────────────── Component ─────────────── */

export default function FusionReportV3Page() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user, profile } = useAuth();
  const { careerStage, workYears } = useTestAuth();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("anchor");
  const [reportHtml, setReportHtml] = useState("");
  const [fusionFullHtml, setFusionFullHtml] = useState("");
  const [reportNumber, setReportNumber] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const isEnglish = language === "en";
  const isTradChinese = language === "zh-TW";

  /* ─── Generate combined report on mount ─── */
  useEffect(() => {
    let cancelled = false;

    const buildReport = async () => {
      // Step 1 — Load career anchor scores from sessionStorage
      setLoadingStep("anchor");
      const assessmentRaw = sessionStorage.getItem("assessmentResults");
      if (!assessmentRaw) {
        navigate("/");
        return;
      }
      const parsedAssessment = JSON.parse(assessmentRaw);
      const anchorScores: Record<string, number> = parsedAssessment.scores || {};

      if (Object.keys(anchorScores).length === 0) {
        navigate("/");
        return;
      }

      // Step 2 — Load ranked cards from sessionStorage
      setLoadingStep("cards");
      let rankedCards: StoredRankedCard[] = [];
      const idealCardRaw = sessionStorage.getItem("idealCardResults");
      if (idealCardRaw) {
        rankedCards = JSON.parse(idealCardRaw) as StoredRankedCard[];
      }

      if (rankedCards.length === 0) {
        navigate("/");
        return;
      }

      // Step 3 — Fetch spectrum & quadrant data from DB
      setLoadingStep("spectrum");
      const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(rankedCards, language);

      // Step 4 — AI card descriptions (best-effort)
      setLoadingStep("ai");
      let aiDescriptions: Record<number, string> = {};
      if (Object.keys(quadrantMap).length > 0) {
        aiDescriptions = await fetchAiCardDescriptions(rankedCards, quadrantMap, language);
      }

      // Step 5 — Generate combined HTML (V3 anchor + ideal card + fusion analysis)
      setLoadingStep("fusion");
      const userId = user?.id || "anonymous";
      const userName = resolveUserDisplayName(profile, user, language);

      const combinedData: CombinedFusionData = {
        anchorScores,
        careerStage: profile?.career_stage || careerStage || "mid",
        rankedCards,
        quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
        spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
        aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
        userId,
        userName,
        workExperienceYears: resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
        language,
      };

      const result = await generateCombinedFusionHTML(combinedData);

      if (cancelled) return;

      if (!result) {
        setStatus("error");
        return;
      }

      // Step 6 — Extract inner content for web display, store full HTML for PDF
      setLoadingStep("render");
      const rootTag = '<div class="cpc-report-root">';
      const rootIdx = result.fullHtml.indexOf(rootTag);
      const webHtml = rootIdx !== -1
        ? result.fullHtml.substring(rootIdx + rootTag.length, result.fullHtml.lastIndexOf("</div>")).trim()
        : result.fullHtml;
      setReportHtml(webHtml);
      setFusionFullHtml(result.fullHtml);
      setReportNumber(result.reportNumber);
      setStatus("ready");
    };

    buildReport().catch((err) => {
      console.error("[FusionReportV3] Failed:", err);
      if (!cancelled) setStatus("error");
    });

    return () => { cancelled = true; };
  }, [navigate, language, user, profile, careerStage, workYears, isEnglish]);

  /* ─── Download PDF ─── */
  const handleDownloadPdf = useCallback(async () => {
    if (!reportHtml) return;
    setIsDownloading(true);

    const fullHtml = fusionFullHtml;

    const dateStr = getLocalDateString(language);

    try {
      await downloadReportWithCover(
        fullHtml,
        {
          reportType: "fusion",
          userName: resolveUserDisplayName(profile, user, language),
          workExperienceYears: resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
          careerStage: profile?.career_stage || careerStage || "mid",
          reportVersion: "professional",
          language,
          userId: user?.id || "anonymous",
          reportNumber,
        },
        `SCPC-Fusion-Report-${reportNumber}-${dateStr}.pdf`,
      );
      toast.success(
        isEnglish ? "Report downloaded" : isTradChinese ? "\u5831\u544a\u5df2\u4e0b\u8f09" : "\u62a5\u544a\u5df2\u4e0b\u8f7d",
      );
    } catch {
      toast.error(
        isEnglish ? "Download failed" : isTradChinese ? "\u4e0b\u8f09\u5931\u6557" : "\u4e0b\u8f7d\u5931\u8d25",
      );
    } finally {
      setIsDownloading(false);
    }
  }, [fusionFullHtml, reportNumber, language, user, profile, careerStage, workYears, isEnglish, isTradChinese]);

  /* ─── Loading step labels ─── */
  const stepLabels: Record<LoadingStep, string> = {
    anchor: isEnglish
      ? "Loading career anchor data..."
      : isTradChinese
        ? "\u6b63\u5728\u8f09\u5165\u8077\u696d\u9328\u8cc7\u6599\u2026"
        : "\u6b63\u5728\u8f7d\u5165\u804c\u4e1a\u951a\u6570\u636e\u2026",
    cards: isEnglish
      ? "Loading espresso card data..."
      : isTradChinese
        ? "\u6b63\u5728\u8f09\u5165\u7406\u60f3\u4eba\u751f\u5361\u8cc7\u6599\u2026"
        : "\u6b63\u5728\u8f7d\u5165\u7406\u60f3\u4eba\u751f\u5361\u6570\u636e\u2026",
    spectrum: isEnglish
      ? "Loading value spectrum data..."
      : isTradChinese
        ? "\u6b63\u5728\u8f09\u5165\u5149\u8b5c\u8cc7\u6599\u2026"
        : "\u6b63\u5728\u8f7d\u5165\u5149\u8c31\u6570\u636e\u2026",
    ai: isEnglish
      ? "Generating AI analysis..."
      : isTradChinese
        ? "\u6b63\u5728\u751f\u6210 AI \u5206\u6790\u2026"
        : "\u6b63\u5728\u751f\u6210 AI \u5206\u6790\u2026",
    fusion: isEnglish
      ? "Generating combined assessment report..."
      : isTradChinese
        ? "\u6b63\u5728\u751f\u6210\u806f\u5408\u6e2c\u8a55\u5831\u544a\u2026"
        : "\u6b63\u5728\u751f\u6210\u8054\u5408\u6d4b\u8bc4\u62a5\u544a\u2026",
    render: isEnglish
      ? "Rendering report..."
      : isTradChinese
        ? "\u6b63\u5728\u6e32\u67d3\u5831\u544a\u2026"
        : "\u6b63\u5728\u6e32\u67d3\u62a5\u544a\u2026",
  };

  const stepProgress: Record<LoadingStep, number> = {
    anchor: 8,
    cards: 15,
    spectrum: 30,
    ai: 50,
    fusion: 75,
    render: 95,
  };

  /* ─── Loading state ─── */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
        <div className="text-center space-y-5 w-72">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#1C2857]" />
          <div className="space-y-2">
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1C2857] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${stepProgress[loadingStep]}%` }}
              />
            </div>
            <p className="text-sm text-slate-500 transition-opacity duration-300">
              {stepLabels[loadingStep]}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error state ─── */
  if (status === "error" || !reportHtml) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
        <div className="text-center space-y-4">
          <p className="text-slate-600">
            {isEnglish
              ? "Failed to generate combined report. Please try again."
              : isTradChinese
                ? "\u806f\u5408\u5831\u544a\u751f\u6210\u5931\u6557\uff0c\u8acb\u91cd\u8a66\u3002"
                : "\u8054\u5408\u62a5\u544a\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5\u3002"}
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-[#1C2857] text-white rounded-lg text-sm"
          >
            {isEnglish ? "Back" : isTradChinese ? "\u8fd4\u56de" : "\u8fd4\u56de"}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Ready state ─── */
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f8f6" }}>
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: "rgba(248,248,246,0.92)",
          borderColor: "#e5e5e0",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEnglish ? "Back" : isTradChinese ? "\u8fd4\u56de" : "\u8fd4\u56de"}
          </button>

          <h1 className="text-sm font-bold text-slate-800 tracking-wide">
            {isEnglish
              ? "Combined Assessment Report"
              : isTradChinese
                ? "\u806f\u5408\u6e2c\u8a55\u5831\u544a"
                : "\u8054\u5408\u6d4b\u8bc4\u62a5\u544a"}
          </h1>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50",
            )}
            style={{ backgroundColor: "#1C2857" }}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloading
              ? (isEnglish ? "Downloading..." : isTradChinese ? "\u4e0b\u8f09\u4e2d..." : "\u4e0b\u8f7d\u4e2d...")
              : (isEnglish ? "Download PDF" : isTradChinese ? "\u4e0b\u8f09 PDF" : "\u4e0b\u8f7d PDF")}
          </button>
        </div>
      </div>

      {/* Cover page */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        <ReportWebCover
          reportType="fusion"
          userName={resolveUserDisplayName(profile, user, language)}
          workExperienceYears={resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage)}
          careerStage={profile?.career_stage || careerStage || "mid"}
          reportNumber={reportNumber}
          language={language as "en" | "zh-TW" | "zh-CN"}
          reportVersion="professional"
        />
      </div>

      {/* Report HTML content */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <style dangerouslySetInnerHTML={{ __html: COMBINED_FUSION_CSS }} />
        <div
          className="cpc-report-root bg-white rounded-lg shadow-sm"
          dangerouslySetInnerHTML={{ __html: reportHtml }}
        />
      </div>

      {/* Bottom download bar */}
      <div
        className="max-w-[900px] mx-auto px-4 pb-12 pt-4"
        style={{ paddingBottom: "calc(3rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="flex justify-center">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1C2857" }}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isDownloading
              ? (isEnglish ? "Downloading..." : isTradChinese ? "\u4e0b\u8f09\u4e2d..." : "\u4e0b\u8f7d\u4e2d...")
              : (isEnglish ? "Download Complete Report (PDF)" : isTradChinese ? "\u4e0b\u8f09\u5b8c\u6574\u5831\u544a (PDF)" : "\u4e0b\u8f7d\u5b8c\u6574\u62a5\u544a (PDF)")}
          </button>
        </div>
      </div>
    </div>
  );
}
