/**
 * Public Shared Report Page — /shared-report/:token
 *
 * Renders a shared assessment report without authentication.
 * Fetches assessment results by share_token, regenerates the report HTML,
 * and displays it with a minimal navigation bar.
 */

import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Home } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateCombinedFusionHTML, COMBINED_FUSION_CSS, fetchIdealCardGeneratorData, fetchAiCardDescriptions } from "@/lib/reportFusionDownload";
import { generateIdealCardReportHTML, downloadReportWithCover } from "@/lib/exportReport";
import { generateV3Report } from "@/lib/reportV3Generator";
import { CPC_REPORT_CSS, CPC_WEB_BODY_RESET } from "@/lib/reportDesignSystem";
import { downloadV3ReportAsPdf } from "@/lib/reportV3Download";
import { getLocalDateString, resolveWorkExperienceYears } from "@/lib/utils";
import { generateReportNumber } from "@/lib/reportNumberGenerator";
import ReportWebCover from "@/components/desktop/ReportWebCover";
import type { CardCategory } from "@/data/idealCards";
import type { CombinedFusionData } from "@/lib/reportFusionDownload";
import type { V3ReportInput } from "@/lib/reportV3Generator";
import type { V3DownloadParams } from "@/lib/reportV3Download";

type Language = "en" | "zh-TW" | "zh-CN";

function text(lang: string, zhCn: string, zhTw: string, en: string): string {
  if (lang === "en") return en;
  if (lang === "zh-TW") return zhTw;
  return zhCn;
}

export default function SharedReportPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<"loading" | "ready" | "error" | "not_found">("loading");
  const [reportHtml, setReportHtml] = useState("");
  const [reportCss, setReportCss] = useState("");
  const [reportNumber, setReportNumber] = useState("");
  const [language, setLanguage] = useState<Language>("zh-TW");
  const [participantName, setParticipantName] = useState("");
  const [assessmentType, setAssessmentType] = useState("");
  const [workYears, setWorkYears] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Result data for PDF download
  const [resultData, setResultData] = useState<{
    scores: Record<string, number>;
    valueRanking: Array<{ rank: number; cardId: number; category: CardCategory }>;
    sessionId: string;
  } | null>(null);

  const [fusionFullHtml, setFusionFullHtml] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("not_found");
      return;
    }

    let cancelled = false;

    // Fallback: look up ideal_card_results for regular user shared reports
    const tryLoadIdealCardResult = async (shareToken: string): Promise<boolean> => {
      const { data: icrResult } = await supabase
        .from("ideal_card_results")
        .select("*")
        .eq("share_token", shareToken)
        .maybeSingle();

      if (!icrResult) return false;

      // Get user profile for name / work_years / language
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, work_experience_years, career_stage, language")
        .eq("id", icrResult.user_id)
        .maybeSingle();

      const lang = (profileData?.language || "zh-TW") as Language;
      const name = profileData?.full_name || (lang === "en" ? "User" : "用戶");
      const years = resolveWorkExperienceYears(profileData?.work_experience_years, null, profileData?.career_stage);
      const ranking = (icrResult.ranked_cards || []) as Array<{ rank: number; cardId: number; category: CardCategory; label?: string; labelEn?: string }>;

      const rankedForReport = ranking.map((r) => ({
        rank: r.rank,
        cardId: r.cardId,
        category: r.category,
      }));

      const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(
        rankedForReport.map((r) => ({ ...r, label: "", labelEn: "" })),
        lang,
      );

      let aiDescriptions: Record<number, string> = {};
      try {
        aiDescriptions = await fetchAiCardDescriptions(
          rankedForReport.map((r) => ({ ...r, label: "", labelEn: "" })),
          quadrantMap,
          lang,
        );
      } catch { /* best-effort */ }

      const reportBodyHtml = generateIdealCardReportHTML(
        {
          rankedCards: rankedForReport,
          userName: name,
          createdAt: new Date(icrResult.created_at).toLocaleString(
            lang === "en" ? "en-US" : lang === "zh-TW" ? "zh-TW" : "zh-CN",
          ),
          quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
          spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
          aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
        },
        lang,
      );

      const bodyMatch = reportBodyHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);

      if (!cancelled) {
        setReportHtml(bodyMatch ? bodyMatch[1] : reportBodyHtml);
        setReportCss(CPC_REPORT_CSS);
        setReportNumber(generateReportNumber(icrResult.user_id || "shared"));
        setLanguage(lang);
        setAssessmentType("life_card");
        setParticipantName(name);
        setWorkYears(years);
        setResultData({
          scores: {},
          valueRanking: rankedForReport,
          sessionId: icrResult.id,
        });
      }

      return true;
    };

    const loadReport = async () => {
      // Fetch result by share_token
      const { data: result, error } = await supabase
        .from("scpc_assessment_results")
        .select("*, scpc_assessment_batches!inner(assessment_type, language)")
        .eq("share_token", token)
        .maybeSingle();

      if (error || !result) {
        // Fallback: check ideal_card_results for regular user share tokens
        const found = await tryLoadIdealCardResult(token);
        if (found) {
          if (!cancelled) setStatus("ready");
        } else if (!cancelled) {
          setStatus("not_found");
        }
        return;
      }

      const batchData = result.scpc_assessment_batches as unknown as { assessment_type: string; language: string };
      const lang = (batchData.language || "zh-TW") as Language;
      const type = batchData.assessment_type || "career_anchor";
      const scores = (result.calculated_scores || {}) as Record<string, number>;
      const ranking = (result.value_ranking || []) as Array<{ rank: number; cardId: number; category: CardCategory; label?: string; labelEn?: string }>;
      const name = result.participant_name || "";
      const years = result.work_years;

      if (!cancelled) {
        setLanguage(lang);
        setAssessmentType(type);
        setParticipantName(name);
        setWorkYears(years);
        setResultData({
          scores,
          valueRanking: ranking.map((r) => ({ rank: r.rank, cardId: r.cardId, category: r.category })),
          sessionId: result.session_id || result.id,
        });
      }

      const stageFromYears = years === null ? "mid" : years <= 5 ? "early" : years <= 10 ? "mid" : "senior";

      if (type === "combined") {
        // Regenerate combined fusion report
        const rankedCards = ranking.map((r) => ({
          rank: r.rank,
          cardId: r.cardId,
          category: r.category,
          label: r.label || "",
          labelEn: r.labelEn || "",
        }));

        const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(rankedCards, lang);
        let aiDescriptions: Record<number, string> = {};
        try {
          aiDescriptions = await fetchAiCardDescriptions(rankedCards, quadrantMap, lang);
        } catch { /* best-effort */ }

        const combinedData: CombinedFusionData = {
          anchorScores: scores,
          careerStage: stageFromYears,
          rankedCards,
          quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
          spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
          aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
          userId: result.session_id || "shared",
          userName: name || (lang === "en" ? "Participant" : "受測者"),
          workExperienceYears: years,
          language: lang,
        };

        const fusionResult = await generateCombinedFusionHTML(combinedData);
        if (cancelled || !fusionResult) {
          if (!cancelled) setStatus("error");
          return;
        }

        // Extract inner content for web display
        const rootTag = '<div class="cpc-report-root">';
        const rootIdx = fusionResult.fullHtml.indexOf(rootTag);
        const webHtml = rootIdx !== -1
          ? fusionResult.fullHtml.substring(rootIdx + rootTag.length, fusionResult.fullHtml.lastIndexOf("</div>")).trim()
          : fusionResult.fullHtml;

        if (!cancelled) {
          setReportHtml(webHtml);
          setReportCss(COMBINED_FUSION_CSS);
          setFusionFullHtml(fusionResult.fullHtml);
          setReportNumber(fusionResult.reportNumber);
        }

      } else if (type === "life_card") {
        // Regenerate ideal card report
        const rankedForReport = ranking.map((r) => ({
          rank: r.rank,
          cardId: r.cardId,
          category: r.category,
        }));

        const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(
          rankedForReport.map((r) => ({ ...r, label: "", labelEn: "" })),
          lang,
        );

        let aiDescriptions: Record<number, string> = {};
        try {
          aiDescriptions = await fetchAiCardDescriptions(
            rankedForReport.map((r) => ({ ...r, label: "", labelEn: "" })),
            quadrantMap,
            lang,
          );
        } catch { /* best-effort */ }

        const reportBodyHtml = generateIdealCardReportHTML(
          {
            rankedCards: rankedForReport,
            userName: name || (lang === "en" ? "Participant" : "受測者"),
            createdAt: new Date().toISOString(),
            quadrantContents: Object.keys(quadrantMap).length > 0 ? quadrantMap : undefined,
            spectrumTypes: Object.keys(spectrumMap).length > 0 ? spectrumMap : undefined,
            aiDescriptions: Object.keys(aiDescriptions).length > 0 ? aiDescriptions : undefined,
          },
          lang,
        );

        const bodyMatch = reportBodyHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);

        if (!cancelled) {
          setReportHtml(bodyMatch ? bodyMatch[1] : reportBodyHtml);
          setReportCss(CPC_REPORT_CSS);
          setReportNumber("");
        }

      } else {
        // Career anchor V3 report
        const reportInput: V3ReportInput = {
          scores,
          careerStage: stageFromYears,
          userName: name || (lang === "en" ? "Participant" : "受測者"),
          workExperienceYears: years,
          userId: result.session_id || "shared",
          assessmentDate: new Date().toISOString().slice(0, 10),
          reportType: "career_anchor",
        };

        const output = await generateV3Report(reportInput, lang);
        if (cancelled) return;

        if (!cancelled) {
          setReportHtml(output.bodyHtml);
          setReportCss(CPC_REPORT_CSS);
          setReportNumber(output.reportNumber);
        }
      }

      if (!cancelled) setStatus("ready");
    };

    loadReport().catch((err) => {
      console.error("[SharedReport] Failed:", err);
      if (!cancelled) setStatus("error");
    });

    return () => { cancelled = true; };
  }, [token]);

  const isEnglish = language === "en";

  const handleDownloadPdf = async () => {
    if (!reportHtml || !resultData) return;
    setIsDownloading(true);

    const stageFromYears = workYears === null ? "mid" : workYears <= 5 ? "early" : workYears <= 10 ? "mid" : "senior";
    const dateStr = getLocalDateString(language);

    try {
      if (assessmentType === "combined" && fusionFullHtml) {
        await downloadReportWithCover(
          fusionFullHtml,
          {
            reportType: "fusion",
            userName: participantName || (isEnglish ? "Participant" : "受測者"),
            workExperienceYears: workYears,
            careerStage: stageFromYears,
            reportVersion: "professional",
            language,
            userId: resultData.sessionId,
            reportNumber,
          },
          `SCPC-Fusion-Report-${reportNumber}-${dateStr}.pdf`,
        );
      } else if (assessmentType === "life_card") {
        const lifeCardHtmlForPdf = `<style>${reportCss}</style><div class="cpc-report-root">${reportHtml}</div>`;
        await downloadReportWithCover(
          lifeCardHtmlForPdf,
          {
            reportType: "ideal_card",
            userName: participantName || (isEnglish ? "Participant" : "受測者"),
            workExperienceYears: workYears,
            careerStage: stageFromYears,
            reportVersion: "professional",
            language,
            userId: resultData.sessionId,
            reportNumber,
          },
          `SCPC-Espresso-Card-Report-${reportNumber}-${dateStr}.pdf`,
        );
      } else {
        const pdfParams: V3DownloadParams = {
          scores: resultData.scores,
          careerStage: stageFromYears,
          userName: participantName,
          workExperienceYears: workYears,
          userId: resultData.sessionId,
          language,
          assessmentDate: new Date().toISOString().slice(0, 10),
        };
        await downloadV3ReportAsPdf(pdfParams);
      }

      toast.success(text(language, "报告已下载", "報告已下載", "Report downloaded"));
    } catch {
      toast.error(text(language, "下载失败", "下載失敗", "Download failed"));
    } finally {
      setIsDownloading(false);
    }
  };

  if (status === "not_found") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ backgroundColor: "rgba(28, 40, 87, 0.1)" }}>
            <svg className="w-8 h-8" style={{ color: "#1C2857" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "#1C2857" }}>
            {text(language, "报告未找到", "報告未找到", "Report Not Found")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {text(language, "此分享链接无效或已过期", "此分享連結無效或已過期", "This share link is invalid or has expired.")}
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#1C2857" }}
          >
            <Home className="w-4 h-4" />
            {text(language, "返回首页", "返回首頁", "Go to Homepage")}
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: "#1C2857" }} />
          <p className="text-sm text-muted-foreground">
            {text(language, "正在加载报告...", "正在載入報告...", "Loading report...")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-xl font-bold" style={{ color: "#1C2857" }}>
            {text(language, "报告加载失败", "報告載入失敗", "Failed to Load Report")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {text(language, "请稍后重试", "請稍後重試", "Please try again later.")}
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#1C2857" }}
          >
            <Home className="w-4 h-4" />
            {text(language, "返回首页", "返回首頁", "Go to Homepage")}
          </button>
        </div>
      </div>
    );
  }

  const reportTypeForCover = assessmentType === "combined" ? "fusion" : assessmentType === "life_card" ? "ideal_card" : "career_anchor";
  const stageFromYears = workYears === null ? "mid" : workYears <= 5 ? "early" : workYears <= 10 ? "mid" : "senior";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f0f4f8 0%, #e8edf4 100%)" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: "#E9ECEF" }}>
        <div className="max-w-[900px] mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: "#1C2857" }}
          >
            <Home className="w-4 h-4" />
            {text(language, "SCPC 首页", "SCPC 首頁", "SCPC Home")}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1C2857" }}
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {text(language, "下载 PDF", "下載 PDF", "Download PDF")}
          </button>
        </div>
      </div>

      {/* Cover */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <ReportWebCover
          reportType={reportTypeForCover as "career_anchor" | "ideal_card" | "fusion"}
          userName={participantName}
          workExperienceYears={workYears}
          careerStage={stageFromYears}
          reportNumber={reportNumber}
          language={language}
        />
      </div>

      {/* Report content */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <style dangerouslySetInnerHTML={{ __html: reportCss + CPC_WEB_BODY_RESET }} />
        <div
          className="cpc-report-root bg-white rounded-lg shadow-sm"
          dangerouslySetInnerHTML={{ __html: reportHtml }}
        />
      </div>

      {/* Footer */}
      <div className="max-w-[900px] mx-auto px-4 pb-12 text-center">
        <p className="text-xs text-muted-foreground/50">SCPC — Strategic Career Planning Consultant</p>
      </div>
    </div>
  );
}
