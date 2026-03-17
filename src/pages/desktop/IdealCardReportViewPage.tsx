/**
 * Ideal Life Card Report View Page — /ideal-card-report-view
 *
 * Mirrors the career-anchor ReportViewPage pattern:
 *   1. Reads ranked cards from sessionStorage (idealCardResults)
 *   2. Fetches spectrum & quadrant data from DB
 *   3. Optionally generates AI card descriptions
 *   4. Calls generateIdealCardReportHTML() — single source of truth
 *   5. Renders bodyHtml via dangerouslySetInnerHTML
 *   6. Provides "Download PDF" via downloadReportWithCover()
 *
 * Web view and PDF content are always 100 % consistent.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  generateIdealCardReportHTML,
  downloadReportWithCover,
} from "@/lib/exportReport";
import { CPC_REPORT_CSS, CPC_WEB_BODY_RESET } from "@/lib/reportDesignSystem";
import type { CardCategory } from "@/data/idealCards";
import { cn, resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";
import { generateReportNumber } from "@/lib/reportNumberGenerator";
import ReportWebCover from "@/components/desktop/ReportWebCover";

/* ─────────────── Types ─────────────── */

interface StoredRankedCard {
  rank: number;
  cardId: number;
  category: CardCategory;
  label?: string;
  labelEn?: string;
}

interface QuadrantContent {
  external: string;
  internal: string;
  career: string;
  relationship: string;
}

type LoadingStep = "data" | "spectrum" | "ai" | "render";

/* ─────────────── Component ─────────────── */

export default function IdealCardReportViewPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user, profile } = useAuth();
  const { careerStage, workYears } = useTestAuth();

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("data");
  const [reportHtml, setReportHtml] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [reportNumber, setReportNumber] = useState("");

  // Keep these around so the PDF download can reuse them
  const [rankedCards, setRankedCards] = useState<StoredRankedCard[]>([]);

  const isEnglish = language === "en";
  const isTradChinese = language === "zh-TW";

  /* ─── Generate report on mount ─── */
  useEffect(() => {
    const buildReport = async () => {
      // Step 1 — Load ranked cards from sessionStorage or DB
      setLoadingStep("data");
      let cards: StoredRankedCard[] = [];

      const storedData = sessionStorage.getItem("idealCardResults");
      if (storedData) {
        cards = JSON.parse(storedData) as StoredRankedCard[];
      }

      // Fallback: try DB
      if (cards.length === 0 && user?.id) {
        const { data: latestRecord } = await supabase
          .from("ideal_card_results")
          .select("ranked_cards")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestRecord?.ranked_cards) {
          cards = latestRecord.ranked_cards as StoredRankedCard[];
        }
      }

      if (cards.length === 0) {
        navigate("/ideal-card-test");
        return;
      }

      setRankedCards(cards);

      // Step 2 — Fetch spectrum & quadrant from DB
      setLoadingStep("spectrum");
      const cardSortOrders = cards.map((card) => card.cardId);

      const quadrantMap: Record<number, QuadrantContent> = {};
      const spectrumMap: Record<number, "career" | "neutral" | "lifestyle"> = {};

      const { data: lifeCards } = await supabase
        .from("life_cards")
        .select("id, sort_order, spectrum_type")
        .in("sort_order", cardSortOrders);

      if (lifeCards && lifeCards.length > 0) {
        const sortOrderToUuid: Record<number, string> = {};
        for (const lifeCard of lifeCards) {
          const sortOrder = lifeCard.sort_order as number;
          sortOrderToUuid[sortOrder] = lifeCard.id as string;
          if (lifeCard.spectrum_type) {
            spectrumMap[sortOrder] = lifeCard.spectrum_type as "career" | "neutral" | "lifestyle";
          }
        }

        const uuids = Object.values(sortOrderToUuid);
        const { data: quadrants } = await supabase
          .from("life_card_quadrant_contents")
          .select(
            "card_id, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked",
          )
          .in("card_id", uuids)
          .eq("language", language);

        if (quadrants && quadrants.length > 0) {
          const uuidToSort: Record<string, number> = {};
          for (const [sortOrderStr, uuid] of Object.entries(sortOrderToUuid)) {
            uuidToSort[uuid] = Number(sortOrderStr);
          }
          for (const quadrant of quadrants) {
            const sortOrder = uuidToSort[quadrant.card_id as string];
            if (sortOrder === undefined) continue;
            const hasContent =
              quadrant.quadrant_external ||
              quadrant.quadrant_internal ||
              quadrant.quadrant_career ||
              quadrant.quadrant_relationship;
            if (!hasContent) continue;
            quadrantMap[sortOrder] = {
              external: (quadrant.quadrant_external as string) || "",
              internal: (quadrant.quadrant_internal as string) || "",
              career: (quadrant.quadrant_career as string) || "",
              relationship: (quadrant.quadrant_relationship as string) || "",
            };
          }
        }
      }

      // Step 3 — AI card descriptions (optional, non-blocking)
      setLoadingStep("ai");
      let aiDescriptions: Record<number, string> = {};

      if (Object.keys(quadrantMap).length > 0) {
        const cardsForAI = cards.map((card) => ({
          rank: card.rank,
          card_name: card.label,
          category: card.category,
          quadrant: quadrantMap[card.cardId],
        }));

        const { data: aiData, error: aiError } = await supabase.functions.invoke(
          "ideal-card-analysis",
          {
            body: { mode: "card_descriptions", cards: cardsForAI, language },
          },
        );

        if (!aiError && aiData?.descriptions) {
          for (const desc of aiData.descriptions as { rank: number; description: string }[]) {
            const matched = cards.find((card) => card.rank === desc.rank);
            if (matched) aiDescriptions[matched.cardId] = desc.description;
          }
        }
      }

      // Step 4 — Render HTML
      setLoadingStep("render");
      const userName = resolveUserDisplayName(profile, user, language);
      const createdAt = new Date().toLocaleString(
        isEnglish ? "en-US" : isTradChinese ? "zh-TW" : "zh-CN",
      );

      const html = generateIdealCardReportHTML(
        {
          rankedCards: cards.map((card) => ({
            rank: card.rank,
            cardId: card.cardId,
            category: card.category,
          })),
          userName,
          createdAt,
          quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
          spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
          aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
        },
        language,
      );

      // The function returns a full HTML document; extract the <body> content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      setReportHtml(bodyMatch ? bodyMatch[1] : html);
      setReportNumber(generateReportNumber(user?.id || "anonymous"));
      setStatus("ready");
    };

    buildReport().catch((err) => {
      console.error("[IdealCardReportView] Failed:", err);
      setStatus("error");
    });
  }, [navigate, language, user, profile, isEnglish, isTradChinese]);

  /* ─── Download PDF ─── */
  const handleDownloadPdf = useCallback(async () => {
    if (rankedCards.length === 0) return;
    setIsDownloading(true);

    const userName = resolveUserDisplayName(profile, user, language);
    const createdAt = new Date().toLocaleString(
      isEnglish ? "en-US" : isTradChinese ? "zh-TW" : "zh-CN",
    );

    // Re-wrap the body HTML into the full document structure for the PDF renderer
    const fullHtml = `
      <style>${CPC_REPORT_CSS}</style>
      <div class="cpc-report-root">${reportHtml}</div>
    `;

    try {
      await downloadReportWithCover(
        fullHtml,
        {
          reportType: "ideal_card",
          userName,
          workExperienceYears: resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
          careerStage: profile?.career_stage || careerStage || "mid",
          reportVersion: "professional",
          language,
          userId: user?.id || "anonymous",
        },
        `SCPC-Espresso-Card-Report-${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success(
        isEnglish ? "Report downloaded" : isTradChinese ? "報告已下載" : "报告已下载",
      );
    } catch {
      toast.error(
        isEnglish ? "Download failed" : isTradChinese ? "下載失敗" : "下载失败",
      );
    } finally {
      setIsDownloading(false);
    }
  }, [rankedCards, reportHtml, language, user, profile, careerStage, workYears, isEnglish, isTradChinese]);

  /* ─── Share report ─── */
  const handleShare = useCallback(async () => {
    if (!user?.id) return;
    setIsSharing(true);
    try {
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const { error: updateError } = await supabase
        .from("ideal_card_results")
        .update({ share_token: token } as Record<string, unknown>)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (updateError) throw updateError;
      const shareUrl = `${window.location.origin}/shared-report/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success(
        isEnglish ? "Share link copied to clipboard" : isTradChinese ? "分享連結已複製到剪貼簿" : "分享链接已复制到剪贴板",
      );
    } catch (err) {
      console.error("Share failed:", err);
      toast.error(
        isEnglish ? "Failed to generate share link" : isTradChinese ? "分享連結產生失敗" : "分享链接生成失败",
      );
    } finally {
      setIsSharing(false);
    }
  }, [user, isEnglish, isTradChinese]);

  /* ─── Loading step labels ─── */
  const stepLabels: Record<LoadingStep, string> = {
    data: isEnglish
      ? "Loading assessment data..."
      : isTradChinese
        ? "正在載入測評資料…"
        : "正在载入测评资料…",
    spectrum: isEnglish
      ? "Loading value spectrum data..."
      : isTradChinese
        ? "正在載入光譜資料…"
        : "正在载入光谱资料…",
    ai: isEnglish
      ? "Generating AI card descriptions..."
      : isTradChinese
        ? "正在生成 AI 卡片解讀…"
        : "正在生成 AI 卡片解读…",
    render: isEnglish
      ? "Rendering report..."
      : isTradChinese
        ? "正在渲染報告…"
        : "正在渲染报告…",
  };

  const stepProgress: Record<LoadingStep, number> = {
    data: 15,
    spectrum: 35,
    ai: 70,
    render: 95,
  };

  /* ─── Loading state ─── */
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
        <div className="text-center space-y-5 w-64">
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
              ? "Failed to generate report. Please try again."
              : isTradChinese
                ? "報告生成失敗，請重試。"
                : "报告生成失败，请重试。"}
          </p>
          <button
            onClick={() => navigate("/ideal-card-results")}
            className="px-4 py-2 bg-[#1C2857] text-white rounded-lg text-sm"
          >
            {isEnglish ? "Back to Results" : isTradChinese ? "返回結果" : "返回结果"}
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
            {isEnglish ? "Back" : isTradChinese ? "返回" : "返回"}
          </button>
          <div className="flex items-center gap-2">
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
              {isEnglish ? "Download PDF" : isTradChinese ? "下載 PDF" : "下载 PDF"}
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
              style={{ borderColor: "#1C2857", color: "#1C2857" }}
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {isEnglish ? "Share" : isTradChinese ? "分享" : "分享"}
            </button>
          </div>
        </div>
      </div>

      {/* Cover page */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        <ReportWebCover
          reportType="ideal_card"
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
        <style dangerouslySetInnerHTML={{ __html: CPC_REPORT_CSS + CPC_WEB_BODY_RESET }} />
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
        <div className="flex justify-center gap-3">
          <>
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
              {isEnglish
                ? "Download Complete Report (PDF)"
                : isTradChinese
                  ? "下載完整報告 (PDF)"
                  : "下载完整报告 (PDF)"}
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
              style={{ borderColor: "#1C2857", color: "#1C2857" }}
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              {isEnglish ? "Share Report" : isTradChinese ? "分享報告" : "分享报告"}
            </button>
          </>
        </div>
      </div>
    </div>
  );
}
