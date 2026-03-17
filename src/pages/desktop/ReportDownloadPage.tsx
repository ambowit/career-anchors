/**
 * Unified Report Download Page — /report/download/:id
 *
 * Supports two flows:
 *   1. By report ID (URL param) — fetches saved report from generated_anchor_reports
 *   2. By session data — reads current assessment from sessionStorage and generates V3 on-the-fly
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Loader2, AlertCircle, CheckCircle, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { useTestAuth } from "@/hooks/useTestAuth";
import {
  downloadV3ReportAsPdf,
  downloadSavedReportAsPdf,
  assessmentResultToV3Params,
  type V3DownloadParams,
} from "@/lib/reportV3Download";
import { standardizeScores } from "@/data/questions";
import type { LangKey } from "@/lib/reportDataFetcher";
import { resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";
import type { V3ReportOutput } from "@/lib/reportV3Generator";

type DownloadStatus = "idle" | "loading" | "success" | "error";

export default function ReportDownloadPage() {
  const { id: reportId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user, profile } = useAuth();
  const { careerStage, workYears } = useTestAuth();

  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>("idle");
  const [reportOutput, setReportOutput] = useState<V3ReportOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const labels = {
    title: isEn ? "V3 Report Download" : isTW ? "V3 報告下載" : "V3 报告下载",
    subtitle: isEn
      ? "Your career anchor assessment report is being generated with the latest V3 template."
      : isTW
        ? "正在使用最新 V3 模板生成您的職業錨測評報告。"
        : "正在使用最新 V3 模板生成您的职业锚测评报告。",
    generating: isEn ? "Generating report..." : isTW ? "正在生成報告…" : "正在生成报告…",
    fetchingData: isEn ? "Fetching template data..." : isTW ? "正在獲取模板數據…" : "正在获取模板数据…",
    success: isEn ? "Report downloaded successfully!" : isTW ? "報告下載成功！" : "报告下载成功！",
    downloadAgain: isEn ? "Download Again" : isTW ? "再次下載" : "再次下载",
    backToResults: isEn ? "Back to Results" : isTW ? "返回結果" : "返回结果",
    error: isEn ? "Failed to generate report" : isTW ? "生成報告失敗" : "生成报告失败",
    noData: isEn ? "No assessment data found. Please complete an assessment first." : isTW ? "未找到測評數據，請先完成測評。" : "未找到测评数据，请先完成测评。",
    startAssessment: isEn ? "Start Assessment" : isTW ? "開始測評" : "开始测评",
    aiWarning: isEn
      ? "Some sections are awaiting expert content or AI generation:"
      : isTW
        ? "部分章節正在等待專家內容或AI生成："
        : "部分章节正在等待专家内容或AI生成：",
    reportNumber: isEn ? "Report Number" : isTW ? "報告編號" : "报告编号",
  };

  // Download handler for session-based flow
  const handleSessionDownload = useCallback(async () => {
    const sessionData = sessionStorage.getItem("assessmentResults");
    if (!sessionData) {
      setDownloadStatus("error");
      setErrorMessage(labels.noData);
      return;
    }

    setDownloadStatus("loading");

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

    const downloadParams: V3DownloadParams = {
      scores,
      careerStage: profile?.career_stage || careerStage || "mid",
      userName: resolveUserDisplayName(profile, user, language),
      workExperienceYears: resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
      userId: user?.id || "anonymous",
      language: language as LangKey,
    };

    const output = await downloadV3ReportAsPdf(downloadParams);
    setReportOutput(output);
    setDownloadStatus("success");
    toast.success(labels.success);
  }, [language, careerStage, workYears, user, profile, isEn, labels.noData, labels.success]);

  // Download handler for saved report flow
  const handleSavedDownload = useCallback(async () => {
    if (!reportId) return;

    setDownloadStatus("loading");

    const output = await downloadSavedReportAsPdf(reportId, language as LangKey);
    if (output) {
      setReportOutput(output);
      setDownloadStatus("success");
      toast.success(labels.success);
    } else {
      setDownloadStatus("error");
      setErrorMessage(isEn ? "Report not found or could not be generated." : isTW ? "找不到報告或無法生成。" : "找不到报告或无法生成。");
    }
  }, [reportId, language, isEn, isTW, labels.success]);

  // Auto-trigger download on mount
  useEffect(() => {
    if (reportId) {
      handleSavedDownload();
    }
    // For session-based, wait for user to click
  }, [reportId, handleSavedDownload]);

  const handleRetry = () => {
    setDownloadStatus("idle");
    setErrorMessage("");
    if (reportId) {
      handleSavedDownload();
    } else {
      handleSessionDownload();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full text-center"
      >
        {/* Icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          {downloadStatus === "loading" && <Loader2 className="w-10 h-10 text-primary animate-spin" />}
          {downloadStatus === "success" && <CheckCircle className="w-10 h-10 text-green-600" />}
          {downloadStatus === "error" && <AlertCircle className="w-10 h-10 text-destructive" />}
          {downloadStatus === "idle" && <FileText className="w-10 h-10 text-primary" />}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">{labels.title}</h1>
        <p className="text-muted-foreground mb-8">{labels.subtitle}</p>

        {/* Status-specific content */}
        {downloadStatus === "loading" && (
          <div className="space-y-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "80%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </div>
            <p className="text-sm text-muted-foreground">{labels.generating}</p>
          </div>
        )}

        {downloadStatus === "success" && reportOutput && (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-400 font-medium">{labels.success}</p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                {labels.reportNumber}: <span className="font-mono font-bold">{reportOutput.reportNumber}</span>
              </p>
            </div>

            {/* AI generation warnings */}
            {reportOutput.aiGenerationNeeded.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-left">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">{labels.aiWarning}</p>
                <ul className="space-y-1">
                  {reportOutput.aiGenerationNeeded.slice(0, 5).map((flag, index) => (
                    <li key={index} className="text-xs text-amber-600 dark:text-amber-500">
                      {flag.chapterTitle}{flag.anchorType ? ` (${flag.anchorType})` : ""}
                    </li>
                  ))}
                  {reportOutput.aiGenerationNeeded.length > 5 && (
                    <li className="text-xs text-amber-500">
                      +{reportOutput.aiGenerationNeeded.length - 5} more...
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleRetry}>
                <Download className="w-4 h-4 mr-2" />
                {labels.downloadAgain}
              </Button>
              <Button asChild>
                <Link to="/results">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {labels.backToResults}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {downloadStatus === "error" && (
          <div className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-400 text-sm">{errorMessage || labels.error}</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleRetry}>
                {isEn ? "Retry" : isTW ? "重試" : "重试"}
              </Button>
              <Button asChild>
                <Link to="/assessment">
                  {labels.startAssessment}
                </Link>
              </Button>
            </div>
          </div>
        )}

        {downloadStatus === "idle" && !reportId && (
          <div className="space-y-6">
            <Button size="lg" onClick={handleSessionDownload} className="px-8">
              <Download className="w-5 h-5 mr-2" />
              {isEn ? "Generate & Download V3 Report" : isTW ? "生成並下載 V3 報告" : "生成并下载 V3 报告"}
            </Button>
            <div>
              <Button variant="ghost" asChild>
                <Link to="/results">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {labels.backToResults}
                </Link>
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
