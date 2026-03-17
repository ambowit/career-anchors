/**
 * V4.2 Report Download Utility
 *
 * Orchestrates the full pipeline:
 *   V4.2 Generator → HTML (cover + body) → PDF with headers/footers
 *
 * Also provides a "fetch from database" path for previously generated reports.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  generateV3Report,
  type V3ReportInput,
  type V3ReportOutput,
} from "@/lib/reportV3Generator";
import {
  downloadReportWithCover,
  type ReportWithCoverOptions,
} from "@/lib/exportReport";
import { standardizeScores } from "@/data/questions";
import type { LangKey } from "@/lib/reportDataFetcher";
import { getLocalDateString } from "@/lib/utils";
import {
  reportProgressStart,
  reportProgressUpdate,
  getStepLabel,
} from "@/lib/reportProgressStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface V3DownloadParams {
  scores: Record<string, number>;
  careerStage: string;
  userName: string;
  workExperienceYears: number | null;
  userId: string;
  language: LangKey;
  reportVersion?: string;
  assessmentDate?: string;
  showWeights?: boolean;
}

// ---------------------------------------------------------------------------
// Primary download function — generates V3 report and triggers PDF download
// ---------------------------------------------------------------------------

export async function downloadV3ReportAsPdf(
  params: V3DownloadParams,
): Promise<V3ReportOutput> {
  const {
    scores,
    careerStage,
    userName,
    workExperienceYears,
    userId,
    language,
    reportVersion = "professional",
    showWeights = false,
  } = params;

  // Step 1: Generate the V3 report (cover + body HTML + AI flags)
  reportProgressStart(getStepLabel("generating", language));
  const reportOutput = await generateV3Report(
    {
      scores,
      careerStage,
      userName,
      workExperienceYears,
      userId,
      reportVersion,
      reportType: "career_anchor",
    },
    language,
    undefined,
    { showWeights },
  );

  // Step 2: Use existing downloadReportWithCover to render PDF
  // This function handles: cover → body pages → headers/footers → jsPDF save
  // Progress note: downloadReportWithCover will take over progress from here
  reportProgressUpdate(30, getStepLabel("generating", language));
  const coverOptions: ReportWithCoverOptions = {
    reportType: "career_anchor",
    userName,
    workExperienceYears,
    careerStage,
    reportVersion,
    language: language as "en" | "zh-TW" | "zh-CN",
    userId,
    assessmentDate: params.assessmentDate,
    reportNumber: reportOutput.reportNumber,
  };

  const filename = `SCPC-Report-${reportOutput.reportNumber}-${getLocalDateString(language)}.pdf`;

  await downloadReportWithCover(reportOutput.bodyHtml, coverOptions, filename, false, 30);

  return reportOutput;
}

// ---------------------------------------------------------------------------
// Generate V3 report as Blob (for ZIP packaging) — does NOT trigger download
// ---------------------------------------------------------------------------

export async function generateV3ReportBlob(
  params: V3DownloadParams,
): Promise<{ blob: Blob; filename: string }> {
  const {
    scores,
    careerStage,
    userName,
    workExperienceYears,
    userId,
    language,
    reportVersion = "professional",
    showWeights = false,
  } = params;

  const reportOutput = await generateV3Report(
    {
      scores,
      careerStage,
      userName,
      workExperienceYears,
      userId,
      reportVersion,
      reportType: "career_anchor",
    },
    language,
    undefined,
    { showWeights },
  );

  const coverOptions: ReportWithCoverOptions = {
    reportType: "career_anchor",
    userName,
    workExperienceYears,
    careerStage,
    reportVersion,
    language: language as "en" | "zh-TW" | "zh-CN",
    userId,
    assessmentDate: params.assessmentDate,
    reportNumber: reportOutput.reportNumber,
  };

  const filename = `SCPC-Report-${userName || "User"}-${reportOutput.reportNumber}.pdf`;

  const blob = await downloadReportWithCover(
    reportOutput.bodyHtml, coverOptions, filename, true
  ) as Blob;

  return { blob, filename };
}

// ---------------------------------------------------------------------------
// Fetch saved report from database and download
// ---------------------------------------------------------------------------

export async function downloadSavedReportAsPdf(
  reportId: string,
  language: LangKey,
): Promise<V3ReportOutput | null> {
  // Fetch from generated_anchor_reports
  const { data, error } = await supabase
    .from("generated_anchor_reports")
    .select("*, report_data")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    console.error("Failed to fetch report:", error);
    return null;
  }

  // If PDF URL already exists, download directly
  if (data.pdf_url) {
    window.open(data.pdf_url, "_blank");
    return null;
  }

  // Otherwise regenerate from saved report_data
  const reportData = data.report_data as Record<string, unknown>;
  if (!reportData) return null;

  const anchorScores = (data.anchor_scores || reportData.scores) as Record<string, number>;

  const downloadParams: V3DownloadParams = {
    scores: anchorScores,
    careerStage: (reportData.careerStage as string) || "mid",
    userName: (reportData.userName as string) || "",
    workExperienceYears: (reportData.workExperienceYears as number) ?? null,
    userId: data.user_id || "anonymous",
    language,
    reportVersion: (reportData.reportVersion as string) || "professional",
    assessmentDate: new Date(data.created_at || data.generated_at).toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN"
    ),
  };

  return downloadV3ReportAsPdf(downloadParams);
}

// ---------------------------------------------------------------------------
// Convenience: Fetch latest assessment from DB and download V4.2 report
// Guarantees identical output to HistoryPage downloads.
// ---------------------------------------------------------------------------

export async function downloadLatestV3Report(
  userId: string,
  userName: string,
  careerStage: string,
  workExperienceYears: number | null,
  language: LangKey,
): Promise<V3ReportOutput | null> {
  const { data: latestRecord, error } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !latestRecord) {
    console.error("Failed to fetch latest assessment for report:", error);
    return null;
  }

  const v3Params = assessmentResultToV3Params(
    latestRecord as {
      score_tf: number; score_gm: number; score_au: number; score_se: number;
      score_ec: number; score_sv: number; score_ch: number; score_ls: number;
      user_id: string;
    },
    userName,
    careerStage,
    workExperienceYears,
    language,
  );

  // Use actual assessment timestamp from DB for the cover page date
  if (latestRecord.created_at) {
    v3Params.assessmentDate = new Date(latestRecord.created_at).toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN"
    );
  }

  return downloadV3ReportAsPdf(v3Params);
}

// ---------------------------------------------------------------------------
// Helper: Convert StoredAssessmentResult raw scores to V3 download params
// ---------------------------------------------------------------------------

export function assessmentResultToV3Params(
  storedResult: {
    score_tf: number;
    score_gm: number;
    score_au: number;
    score_se: number;
    score_ec: number;
    score_sv: number;
    score_ch: number;
    score_ls: number;
    user_id: string;
  },
  userName: string,
  careerStage: string,
  workExperienceYears: number | null,
  language: LangKey,
): V3DownloadParams {
  const standardized = standardizeScores({
    TF: storedResult.score_tf,
    GM: storedResult.score_gm,
    AU: storedResult.score_au,
    SE: storedResult.score_se,
    EC: storedResult.score_ec,
    SV: storedResult.score_sv,
    CH: storedResult.score_ch,
    LS: storedResult.score_ls,
  });

  return {
    scores: standardized,
    careerStage,
    userName,
    workExperienceYears,
    userId: storedResult.user_id,
    language,
  };
}
