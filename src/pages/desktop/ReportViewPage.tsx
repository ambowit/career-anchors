/**
 * Unified Report View Page — /report-view
 *
 * Renders the exact same V3 HTML that the PDF download generates,
 * ensuring web view and PDF content are always 100% consistent.
 *
 * Data flow:
 *   1. Reads scores from sessionStorage (assessmentResults)
 *   2. Calls generateV3Report() — the single source of truth
 *   3. Renders bodyHtml via dangerouslySetInnerHTML
 *   4. Provides a "Download PDF" button using downloadV3ReportAsPdf()
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { generateV3Report, type V3ReportOutput } from "@/lib/reportV3Generator";
import { downloadV3ReportAsPdf, type V3DownloadParams } from "@/lib/reportV3Download";
import { standardizeScores } from "@/data/questions";
import type { LangKey } from "@/lib/reportDataFetcher";
import { CPC_REPORT_CSS, CPC_WEB_BODY_RESET } from "@/lib/reportDesignSystem";
import { cn, resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";
import ReportWebCover from "@/components/desktop/ReportWebCover";

type ViewStatus = "loading" | "ready" | "error";
type LoadingStep = "version" | "data" | "ai" | "render";

export default function ReportViewPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user, profile } = useAuth();
  const { careerStage, workYears } = useTestAuth();
  const { isSuperAdmin } = usePermissions();

  const [viewStatus, setViewStatus] = useState<ViewStatus>("loading");
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("version");
  const [reportOutput, setReportOutput] = useState<V3ReportOutput | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  // Keep the same params used for web generation so PDF is identical
  const [reportParams, setReportParams] = useState<V3DownloadParams | null>(null);

  const isEnglish = language === "en";
  const isTradChinese = language === "zh-TW";

  // Generate report HTML on mount
  useEffect(() => {
    const generateReport = async () => {
      const sessionData = sessionStorage.getItem("assessmentResults");
      if (!sessionData) {
        navigate("/");
        return;
      }

      setViewStatus("loading");

      const parsed = JSON.parse(sessionData);
      const scores = parsed.scores || standardizeScores({
        TF: parsed.score_tf || 0,
        GM: parsed.score_gm || 0,
        AU: parsed.score_au || 0,
        SE: parsed.score_se || 0,
        EC: parsed.score_ec || 0,
        SV: parsed.score_sv || 0,
        CH: parsed.score_ch || 0,
        LS: parsed.score_ls || 0,
      });

      const resolvedParams: V3DownloadParams = {
        scores,
        careerStage: profile?.career_stage || careerStage || "mid",
        userName: resolveUserDisplayName(profile, user, language),
        workExperienceYears: resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
        userId: user?.id || "anonymous",
        language: language as LangKey,
        reportVersion: "professional",
        showWeights: isSuperAdmin,
      };

      const output = await generateV3Report(
        {
          scores: resolvedParams.scores,
          careerStage: resolvedParams.careerStage,
          userName: resolvedParams.userName,
          workExperienceYears: resolvedParams.workExperienceYears,
          userId: resolvedParams.userId,
          reportVersion: resolvedParams.reportVersion,
          reportType: "career_anchor",
        },
        language as LangKey,
        (step) => setLoadingStep(step),
        { showWeights: isSuperAdmin },
      );

      setReportParams(resolvedParams);
      setReportOutput(output);
      setViewStatus("ready");
    };

    generateReport().catch(() => {
      setViewStatus("error");
    });
  }, [navigate, language, careerStage, workYears, user, profile, isEnglish, isSuperAdmin]);

  // Download PDF using the exact same data that the web view displays
  const handleDownloadPdf = useCallback(async () => {
    if (!reportParams) return;
    setIsDownloading(true);
    try {
      await downloadV3ReportAsPdf(reportParams);
      toast.success(isEnglish ? "Report downloaded" : isTradChinese ? "完整報告已下載" : "完整报告已下载");
    } catch {
      toast.error(isEnglish ? "Download failed" : isTradChinese ? "下載失敗" : "下载失败");
    } finally {
      setIsDownloading(false);
    }
  }, [reportParams, isEnglish, isTradChinese]);

  // Loading step labels
  const stepLabels: Record<LoadingStep, string> = {
    version: isEnglish ? "Checking report configuration..." : isTradChinese ? "正在檢查報告配置…" : "正在检查报告配置…",
    data: isEnglish ? "Loading assessment data..." : isTradChinese ? "正在載入測評資料…" : "正在载入测评资料…",
    ai: isEnglish ? "Generating AI analysis..." : isTradChinese ? "正在生成 AI 分析…" : "正在生成 AI 分析…",
    render: isEnglish ? "Rendering report..." : isTradChinese ? "正在渲染報告…" : "正在渲染报告…",
  };

  const stepProgress: Record<LoadingStep, number> = { version: 15, data: 40, ai: 75, render: 95 };

  // Loading state
  if (viewStatus === "loading") {
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

  // Error state
  if (viewStatus === "error" || !reportOutput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f6]">
        <div className="text-center space-y-4">
          <p className="text-slate-600">
            {isEnglish ? "Failed to generate report. Please try again." : isTradChinese ? "報告生成失敗，請重試。" : "报告生成失败，请重试。"}
          </p>
          <button
            onClick={() => navigate("/results")}
            className="px-4 py-2 bg-[#1C2857] text-white rounded-lg text-sm"
          >
            {isEnglish ? "Back to Results" : isTradChinese ? "返回結果" : "返回结果"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8f8f6" }}>
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(248,248,246,0.92)", borderColor: "#e5e5e0", paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-[900px] mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEnglish ? "Back" : isTradChinese ? "返回" : "返回"}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50",
            )}
            style={{ backgroundColor: "#1C2857" }}
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isEnglish ? "Download PDF" : isTradChinese ? "下載 PDF" : "下载 PDF"}
          </button>
        </div>
      </div>

      {/* Cover page */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        <ReportWebCover
          reportType="career_anchor"
          userName={resolveUserDisplayName(profile, user, language)}
          workExperienceYears={resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage)}
          careerStage={profile?.career_stage || careerStage || "mid"}
          reportNumber={reportOutput.reportNumber}
          language={language as "en" | "zh-TW" | "zh-CN"}
          reportVersion="professional"
        />
      </div>

      {/* Chapter title banner */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8">
        <div
          className="rounded-xl text-center overflow-hidden relative"
          style={{
            padding: "36px 32px",
            background: "linear-gradient(135deg, #1C2857 0%, #1e3470 50%, #2a3d6e 100%)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #D4A017, #E8B731, #D4A017)" }} />
          <div className="text-[13px] font-bold tracking-[6px] uppercase mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
            {isEnglish ? "CAREER ANCHOR ASSESSMENT" : isTradChinese ? "\u8077\u696d\u9328\u6e2c\u8a55" : "\u804c\u4e1a\u951a\u6d4b\u8bc4"}
          </div>
          <div className="text-2xl font-extrabold text-white leading-snug">
            {isEnglish ? "Career Anchor Assessment Report" : isTradChinese ? "\u8077\u696d\u9328\u6e2c\u8a55\u5831\u544a" : "\u804c\u4e1a\u951a\u6d4b\u8bc4\u62a5\u544a"}
          </div>
        </div>
      </div>

      {/* Report HTML content */}
      <div className="max-w-[900px] mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <style dangerouslySetInnerHTML={{ __html: CPC_REPORT_CSS + CPC_WEB_BODY_RESET }} />
        <div
          className="cpc-report-root bg-white rounded-lg shadow-sm overflow-hidden"
          dangerouslySetInnerHTML={{ __html: reportOutput.bodyHtml }}
        />
      </div>

      {/* Bottom download bar */}
      <div className="max-w-[900px] mx-auto px-4 pb-12 pt-4" style={{ paddingBottom: "calc(3rem + env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex justify-center">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#1C2857" }}
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isEnglish ? "Download Complete Report (PDF)" : isTradChinese ? "下載完整報告 (PDF)" : "下载完整报告 (PDF)"}
          </button>
        </div>
      </div>
    </div>
  );
}
