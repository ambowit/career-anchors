// BatchAssessmentDetailPage - Org Admin batch assessment detail view
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Copy, RefreshCw, PlayCircle, PauseCircle, XCircle,
  Loader2, Users, CheckCircle2, Clock, BarChart3, Mail,
  Eye, EyeOff, Download, TrendingUp, Activity, FileText, ShieldCheck,
  Pencil, Save, X, FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { copyToClipboard } from "@/lib/clipboard";
import { SITE_ORIGIN } from "@/lib/utils";
import {
  useBatchDetail, useBatchSessions, useBatchResults,
  useUpdateBatchStatus, useResetAccessCode, useUpdateBatch,
} from "@/hooks/useBatchAssessment";
import { DIMENSION_CODES } from "@/data/questions";
import { generateV3ReportBlob, type V3DownloadParams } from "@/lib/reportV3Download";
import { downloadReportWithCover, downloadBlob } from "@/lib/exportReport";
import type { Language } from "@/hooks/useLanguage";

const PRIMARY = "#1C2857";

const STATUS_CONFIG: Record<string, { label: Record<string, string>; color: string; bgColor: string }> = {
  draft: { label: { en: "Draft", "zh-TW": "草稿", "zh-CN": "草稿" }, color: "#6B7280", bgColor: "#F3F4F6" },
  active: { label: { en: "Active", "zh-TW": "進行中", "zh-CN": "进行中" }, color: "#059669", bgColor: "#ECFDF5" },
  paused: { label: { en: "Paused", "zh-TW": "已暫停", "zh-CN": "已暂停" }, color: "#D97706", bgColor: "#FFFBEB" },
  closed: { label: { en: "Closed", "zh-TW": "已結束", "zh-CN": "已结束" }, color: "#DC2626", bgColor: "#FEF2F2" },
  archived: { label: { en: "Archived", "zh-TW": "已歸檔", "zh-CN": "已归档" }, color: "#6B7280", bgColor: "#F9FAFB" },
};

const ANCHOR_NAMES: Record<string, Record<string, string>> = {
  TF: { en: "Technical/Functional", "zh-TW": "技術/專業能力型", "zh-CN": "技术/专业能力型" },
  GM: { en: "General Management", "zh-TW": "管理型", "zh-CN": "管理型" },
  AU: { en: "Autonomy/Independence", "zh-TW": "自主/獨立型", "zh-CN": "自主/独立型" },
  SE: { en: "Security/Stability", "zh-TW": "安全/穩定型", "zh-CN": "安全/稳定型" },
  EC: { en: "Entrepreneurial Creativity", "zh-TW": "創業/創造型", "zh-CN": "创业/创造型" },
  SV: { en: "Service/Dedication", "zh-TW": "服務/奉獻型", "zh-CN": "服务/奉献型" },
  CH: { en: "Pure Challenge", "zh-TW": "挑戰型", "zh-CN": "挑战型" },
  LS: { en: "Lifestyle Integration", "zh-TW": "生活方式整合型", "zh-CN": "生活方式整合型" },
};

function deriveStageFromWorkYears(workYears: number | null): string {
  if (workYears === null) return "mid";
  if (workYears <= 5) return "early";
  if (workYears <= 10) return "mid";
  return "senior";
}

function toLocalDatetimeValue(isoString: string): string {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function OrgBatchAssessmentDetailPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedResultId && detailPanelRef.current) {
      detailPanelRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedResultId]);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editBatchName, setEditBatchName] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDownloadingReports, setIsDownloadingReports] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  const t = (en: string, zhTw: string) => language === "en" ? en : zhTw;

  const { data: batch, isLoading: batchLoading } = useBatchDetail(batchId);
  const { data: sessions = [] } = useBatchSessions(batchId);
  const { data: results = [] } = useBatchResults(batchId);
  const updateStatus = useUpdateBatchStatus();
  const resetCode = useResetAccessCode();
  const updateBatch = useUpdateBatch();

  const totalParticipants = sessions.length;
  const completedCount = sessions.filter(sessionItem => sessionItem.status === "completed").length;
  const inProgressCount = sessions.filter(sessionItem => sessionItem.status === "in_progress").length;
  const completionRate = totalParticipants > 0 ? Math.round((completedCount / totalParticipants) * 100) : 0;

  const todayCompleted = useMemo(() => {
    const today = new Date().toDateString();
    return results.filter(resultItem => new Date(resultItem.completed_at).toDateString() === today).length;
  }, [results]);

  const recentCompletions = useMemo(() => results.slice(0, 5), [results]);

  const averageScores = useMemo(() => {
    if (results.length === 0) return {} as Record<string, number>;
    const totals: Record<string, number> = {};
    DIMENSION_CODES.forEach(dim => { totals[dim] = 0; });
    results.forEach(resultItem => {
      const scores = resultItem.calculated_scores || {};
      DIMENSION_CODES.forEach(dim => { totals[dim] += (scores[dim] || 0); });
    });
    const averages: Record<string, number> = {};
    DIMENSION_CODES.forEach(dim => { averages[dim] = Math.round((totals[dim] / results.length) * 10) / 10; });
    return averages;
  }, [results]);

  const anchorDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    results.forEach(resultItem => {
      const anchor = resultItem.main_anchor || "unknown";
      dist[anchor] = (dist[anchor] || 0) + 1;
    });
    return Object.entries(dist).sort(([, a], [, b]) => b - a);
  }, [results]);

  const departmentDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    results.forEach(resultItem => {
      const dept = resultItem.department || t("Unspecified", "未指定");
      dist[dept] = (dist[dept] || 0) + 1;
    });
    return Object.entries(dist).sort(([, a], [, b]) => b - a);
  }, [results, language]);

  const workYearsDistribution = useMemo(() => {
    const groups = { "0-3": 0, "3-7": 0, "7-15": 0, "15+": 0 };
    results.forEach(resultItem => {
      const years = resultItem.work_years || 0;
      if (years <= 3) groups["0-3"]++;
      else if (years <= 7) groups["3-7"]++;
      else if (years <= 15) groups["7-15"]++;
      else groups["15+"]++;
    });
    return groups;
  }, [results]);

  // Selection helpers
  const allSelected = results.length > 0 && selectedIds.size === results.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < results.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(resultItem => resultItem.id)));
    }
  }, [allSelected, results]);

  const toggleSelect = useCallback((resultId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(resultId)) next.delete(resultId);
      else next.add(resultId);
      return next;
    });
  }, []);

  // Edit handlers
  const handleStartEdit = useCallback(() => {
    if (!batch) return;
    setEditBatchName(batch.batch_name);
    setEditStartTime(toLocalDatetimeValue(batch.start_time));
    setEditEndTime(toLocalDatetimeValue(batch.end_time));
    setIsEditing(true);
  }, [batch]);

  const handleSaveEdit = useCallback(async () => {
    if (!batchId || !editBatchName.trim()) return;
    try {
      await updateBatch.mutateAsync({
        batchId,
        batch_name: editBatchName.trim(),
        start_time: new Date(editStartTime).toISOString(),
        end_time: new Date(editEndTime).toISOString(),
      });
      setIsEditing(false);
      toast.success(t("Batch updated", "批次已更新"));
    } catch {
      toast.error(t("Failed to update", "更新失敗"));
    }
  }, [batchId, editBatchName, editStartTime, editEndTime]);

  const handleCopyLink = useCallback(() => {
    if (!batch) return;
    copyToClipboard(`${SITE_ORIGIN}/batch/${encodeURIComponent(batch.batch_slug)}`);
    toast.success(t("Link copied", "連結已複製"));
  }, [batch]);

  const handleCopyCode = useCallback(() => {
    if (!batch) return;
    copyToClipboard(batch.access_code);
    toast.success(t("Code copied", "驗證碼已複製"));
  }, [batch]);

  const handleCopyEmailTemplate = useCallback(() => {
    if (!batch) return;
    const url = `${SITE_ORIGIN}/batch/${encodeURIComponent(batch.batch_slug)}`;
    const deadline = new Date(batch.end_time).toLocaleString();
    const assessmentType = batch.assessment_type || "career_anchor";
    const batchLang = batch.language || language;

    let template: string;
    if (assessmentType === "combined") {
      template = batchLang === "en"
        ? `You are invited to participate in "${batch.batch_name}" — Career Anchor × Espresso Card Integrated Assessment.\n\nThis integrated assessment combines two scientifically-validated tools: the Career Anchor Assessment identifies your deep and stable career driving forces, while the Espresso Card Assessment reveals your core life values. Results are solely for personal career planning reference, unrelated to performance reviews. Upon completion, you will receive a comprehensive integrated report to help you build a clear decision-making framework.\n\nPlease follow the instructions below to complete the assessment:\n\n[Enter Assessment]\n▼ Deadline: ${deadline}\n▼ Assessment Link:\n${url}\n▼ Access Code: ${batch.access_code}\n▼ Time Required: Approx. 25-35 minutes (single-session link, please use on a stable network)\n\n[Assessment Guidelines]\n✅ Identity Calibration: Please accurately fill in your "Work Experience Years" and "Management Role" to receive career-stage-specific analysis.\n✅ Genuine Responses: Please answer based on your true preferences, without considering social expectations.\n✅ Environment: Please complete the assessment in a quiet, undisturbed environment.\n✅ Download Report: After completing both assessments, you can download the full integrated report immediately.\n\nAnswer thoughtfully, and this analysis report will provide substantial assistance for your career decisions.\nLet's begin!`
        : batchLang === "zh-CN"
        ? `您已被邀请参加「${batch.batch_name}」— 职业锚 × 理想人生卡整合测评。\n\n本整合测评结合两项经科学验证的工具：职业锚测评辨识您深层且稳定的职涯驱动力，理想人生卡测评揭示您核心的人生价值取向。填答结果仅供个人职涯规划参考，无关绩效考核或职位评价。完成后，您将获得一份完整的整合分析报告，协助您建立清晰的决策架构。\n\n请参考下方指引完成测试：\n\n【进入测评】\n▼ 截止时间：${deadline}\n▼ 测评链接：\n${url}\n▼ 登录账密：${batch.access_code}\n▼ 时间安排：约 25-35 分钟（单次链接，请在稳定的网络下使用）\n\n【作答须知】\n✅ 身份校准：请先填写真实「工作年资」与「管理身份」，以获得对应职涯阶段的精准分析。\n✅ 真实倾向：请依真实想法作答，不必考虑社会期待。您的认真投入将直接决定报告的参考价值。\n✅ 环境要求：请在安静、不受打扰的环境下专注作答。\n✅ 下载报告：两项测评皆完成后，即可自行下载完整整合报告留存。\n\n用心作答，这份分析报告，便能为您的职涯决策提供实质协助。\n开始吧！`
        : `您已被邀請參加「${batch.batch_name}」— 職業錨 × 理想人生卡整合測評。\n\n本整合測評結合兩項經科學驗證的工具：職業錨測評辨識您深層且穩定的職涯驅動力，理想人生卡測評揭示您核心的人生價值取向。填答結果僅供個人職涯規劃參考，無關績效考核或職位評價。完成後，您將獲得一份完整的整合分析報告，協助您建立清晰的決策架構。\n\n請參考下方指引完成測試：\n\n【進入測評】\n▼ 截止時間：${deadline}\n▼ 測評連結：\n${url}\n▼ 登入帳密：${batch.access_code}\n▼ 時間安排：約 25-35 分鐘（單次連結，請在穩定的網路下使用）\n\n【作答須知】\n✅ 身分校準：請先填寫真實「工作年資」與「管理身分」，以獲得對應職涯階段的精準分析。\n✅ 真實傾向：請依真實想法作答，不必考慮社會期待。您的認真投入將直接決定報告的參考價值。\n✅ 環境要求：請在安靜、不受打擾的環境下專注作答。\n✅ 下載報告：兩項測評皆完成後，即可自行下載完整整合報告留存。\n\n用心作答，這份分析報告，便能為您的職涯決策提供實質協助。\n開始吧！`;
    } else if (assessmentType === "life_card") {
      template = batchLang === "en"
        ? `You are invited to participate in "${batch.batch_name}" — Espresso Card Assessment.\n\nThis assessment helps you identify your core life values through an interactive card-ranking experience. By prioritizing value cards across multiple dimensions, it reveals your deepest life priorities and career orientation. Results are solely for personal career planning reference, unrelated to performance reviews. Upon completion, you will receive a comprehensive report with value spectrum analysis.\n\nPlease follow the instructions below to complete the assessment:\n\n[Enter Assessment]\n▼ Deadline: ${deadline}\n▼ Assessment Link:\n${url}\n▼ Access Code: ${batch.access_code}\n▼ Time Required: Approx. 10-15 minutes (single-session link, please use on a stable network)\n\n[Assessment Guidelines]\n✅ Identity Calibration: Please accurately fill in your "Work Experience Years" to receive career-stage-specific analysis.\n✅ Genuine Responses: Please rank cards based on your true preferences, without considering social expectations.\n✅ Environment: Please complete the assessment in a quiet, undisturbed environment.\n✅ Download Report: After completing the assessment, you can download the full report immediately.\n\nAnswer thoughtfully, and this analysis report will provide substantial assistance for your life and career decisions.\nLet's begin!`
        : batchLang === "zh-CN"
        ? `您已被邀请参加「${batch.batch_name}」— 理想人生卡测评。\n\n本测评通过互动式卡片排序体验，协助您辨识核心的人生价值取向。借由对多面向价值卡片的优先排序，揭示您内心深处的人生优先顺序与职涯取向。填答结果仅供个人职涯规划参考，无关绩效考核或职位评价。完成后，您将获得一份包含价值光谱分析的完整报告。\n\n请参考下方指引完成测试：\n\n【进入测评】\n▼ 截止时间：${deadline}\n▼ 测评链接：\n${url}\n▼ 登录账密：${batch.access_code}\n▼ 时间安排：约 10-15 分钟（单次链接，请在稳定的网络下使用）\n\n【作答须知】\n✅ 身份校准：请先填写真实「工作年资」，以获得对应职涯阶段的精准分析。\n✅ 真实倾向：请依真实想法排序卡片，不必考虑社会期待。您的认真投入将直接决定报告的参考价值。\n✅ 环境要求：请在安静、不受打扰的环境下专注作答。\n✅ 下载报告：测评完成后，即可自行下载完整报告留存。\n\n用心作答，这份分析报告，便能为您的人生与职涯决策提供实质协助。\n开始吧！`
        : `您已被邀請參加「${batch.batch_name}」— 理想人生卡測評。\n\n本測評透過互動式卡片排序體驗，協助您辨識核心的人生價值取向。藉由對多面向價值卡片的優先排序，揭示您內心深處的人生優先順序與職涯取向。填答結果僅供個人職涯規劃參考，無關績效考核或職位評價。完成後，您將獲得一份包含價值光譜分析的完整報告。\n\n請參考下方指引完成測試：\n\n【進入測評】\n▼ 截止時間：${deadline}\n▼ 測評連結：\n${url}\n▼ 登入帳密：${batch.access_code}\n▼ 時間安排：約 10-15 分鐘（單次連結，請在穩定的網路下使用）\n\n【作答須知】\n✅ 身分校準：請先填寫真實「工作年資」，以獲得對應職涯階段的精準分析。\n✅ 真實傾向：請依真實想法排序卡片，不必考慮社會期待。您的認真投入將直接決定報告的參考價值。\n✅ 環境要求：請在安靜、不受打擾的環境下專注作答。\n✅ 下載報告：測評完成後，即可自行下載完整報告留存。\n\n用心作答，這份分析報告，便能為您的人生與職涯決策提供實質協助。\n開始吧！`;
    } else {
      template = batchLang === "en"
        ? `You are invited to participate in "${batch.batch_name}" online assessment.\n\nThis tool identifies your deep and stable career driving forces. Unlike personality tests, this assessment does not use MBTI or zodiac labels — conclusions are entirely based on data and logic. Results are solely for personal career planning reference, unrelated to performance reviews or position evaluations. Upon completion, you will receive a comprehensive report of 10+ pages to help you build a clear decision-making framework and reduce career choice costs.\n\nPlease follow the instructions below to complete the assessment:\n\n[Enter Assessment]\n▼ Deadline: ${deadline}\n▼ Assessment Link:\n${url}\n▼ Access Code: ${batch.access_code}\n▼ Time Required: Approx. 15-20 minutes (single-session link, please use on a stable network)\n\n[Assessment Guidelines]\n✅ Identity Calibration: Please accurately fill in your "Work Experience Years" and "Management Role" to receive career-stage-specific analysis.\n✅ Genuine Responses: Please answer based on your true preferences, without considering social expectations. Your sincere input directly determines the reference value of "Action Paths" and "Risk Assessment" in the report.\n✅ Environment: Please complete the assessment in a quiet, undisturbed environment.\n✅ Download Report: After completing all 40 questions, you can download the full report immediately.\n\nAnswer thoughtfully, and this analysis report will provide substantial assistance for your career decisions.\nLet's begin!`
        : batchLang === "zh-CN"
        ? `您已被邀请参加「${batch.batch_name}」线上测评。\n\n本工具核心在于辨识您深层且稳定的职涯驱动力。不同于性格测试，本测评不使用 MBTI 或星座标签，结论完全基于数据与逻辑推导。填答结果仅供个人职涯规划参考，无关绩效考核或职位评价。完成后，您将获得一份 10 页以上的深度报告，协助您建立清晰的决策架构，降低职涯选择成本。\n\n请参考下方指引完成测试：\n\n【进入测评】\n▼ 截止时间：${deadline}\n▼ 测评链接：\n${url}\n▼ 登录账密：${batch.access_code}\n▼ 时间安排：约 15-20 分钟（单次链接，请在稳定的网络下使用）\n\n【作答须知】\n✅ 身份校准：请先填写真实「工作年资」与「管理身份」，以获得对应职涯阶段的精准分析。\n✅ 真实倾向：请依真实想法作答，不必考虑社会期待。您的认真投入将直接决定报告中「行动路径」与「风险预判」的参考价值。\n✅ 环境要求：请在安静、不受打扰的环境下专注作答。\n✅ 下载报告：40 题作答完成后，即可自行下载完整报告留存。\n\n用心作答，这份分析报告，便能为您的职涯决策提供实质协助。\n开始吧！`
        : `您已被邀請參加「${batch.batch_name}」線上測評。\n\n本工具核心在於辨識您深層且穩定的職涯驅動力。不同於性格測試，本測評不使用 MBTI 或星座標籤，結論完全基於數據與邏輯推導。填答結果僅供個人職涯規劃參考，無關績效考核或職位評價。完成後，您將獲得一份 10 頁以上的深度報告，協助您建立清晰的決策架構，降低職涯選擇成本。\n\n請參考下方指引完成測試：\n\n【進入測評】\n▼ 截止時間：${deadline}\n▼ 測評連結：\n${url}\n▼ 登入帳密：${batch.access_code}\n▼ 時間安排：約 15-20 分鐘（單次連結，請在穩定的網路下使用）\n\n【作答須知】\n✅ 身分校準：請先填寫真實「工作年資」與「管理身分」，以獲得對應職涯階段的精準分析。\n✅ 真實傾向：請依真實想法作答，不必考慮社會期待。您的認真投入將直接決定報告中「行動路徑」與「風險預判」的參考價值。\n✅ 環境要求：請在安靜、不受打擾的環境下專注作答。\n✅ 下載報告：40 題作答完成後，即可自行下載完整報告留存。\n\n用心作答，這份分析報告，便能為您的職涯決策提供實質協助。\n開始吧！`;
    }
    copyToClipboard(template);
    toast.success(t("Email template copied", "郵件範本已複製"));
  }, [batch, language]);

  const handleResetCode = useCallback(async () => {
    if (!batchId) return;
    try {
      const newCode = await resetCode.mutateAsync(batchId);
      toast.success(t(`Code reset to: ${newCode}`, `驗證碼已重設為: ${newCode}`));
    } catch { toast.error(t("Failed to reset code", "重設失敗")); }
  }, [batchId]);

  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!batchId) return;
    try {
      await updateStatus.mutateAsync({ batchId, status: newStatus });
      toast.success(t("Status updated", "狀態已更新"));
    } catch { toast.error(t("Failed to update", "更新失敗")); }
  }, [batchId]);

  const handleExportCSV = useCallback(() => {
    if (results.length === 0) return;
    const headers = ["Name", "Department", "Email", "Work Years", "Completed At", "Main Anchor", ...DIMENSION_CODES];
    const rows = results.map(resultItem => [
      resultItem.participant_name, resultItem.department, resultItem.email,
      String(resultItem.work_years ?? ""), new Date(resultItem.completed_at).toLocaleString(),
      resultItem.main_anchor,
      ...DIMENSION_CODES.map(dim => String(resultItem.calculated_scores?.[dim] ?? "")),
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${batch?.batch_name || "batch"}_results.csv`);
    toast.success(t("Exported", "已匯出"));
  }, [results, batch]);

  const handleBatchDownloadReports = useCallback(async () => {
    if (selectedIds.size === 0) {
      toast.error(t("Please select employees first", "請先勾選員工"));
      return;
    }
    const selectedResults = results.filter(resultItem => selectedIds.has(resultItem.id));
    if (selectedResults.length === 0) return;

    setIsDownloadingReports(true);
    setDownloadProgress({ current: 0, total: selectedResults.length });

    const batchLang = (batch?.language || "zh-TW") as "en" | "zh-TW" | "zh-CN";
    const assessmentType = batch?.assessment_type || "career_anchor";
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    let successCount = 0;

    for (let index = 0; index < selectedResults.length; index++) {
      const resultItem = selectedResults[index];
      setDownloadProgress({ current: index + 1, total: selectedResults.length });
      try {
        const stage = deriveStageFromWorkYears(resultItem.work_years);
        const userId = resultItem.session_id || resultItem.id;
        const dateStr = new Date(resultItem.completed_at).toISOString().slice(0, 10);

        if (assessmentType === "combined") {
          // Generate fusion report blob
          const { generateCombinedFusionHTML, fetchIdealCardGeneratorData, fetchAiCardDescriptions, COMBINED_FUSION_CSS } = await import("@/lib/reportFusionDownload");
          const anchorScores = resultItem.calculated_scores || {};
          // Use value_ranking from the already-fetched result (select "*")
          // Fall back to a separate query only if not present
          let rankedCards = (resultItem.value_ranking as any[] | undefined) || [];
          if (rankedCards.length === 0) {
            const { data: cardResult } = await (await import("@/integrations/supabase/client")).supabase
              .from("scpc_assessment_results")
              .select("value_ranking")
              .eq("session_id", resultItem.session_id || resultItem.id)
              .maybeSingle();
            rankedCards = (cardResult?.value_ranking as any[]) || [];
          }
          if (rankedCards.length > 0 && Object.keys(anchorScores).length > 0) {
            const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(rankedCards, batchLang);
            const aiDescriptions = await fetchAiCardDescriptions(rankedCards, quadrantMap, batchLang);
            const fusionResult = await generateCombinedFusionHTML({
              anchorScores, careerStage: stage, rankedCards,
              quadrantContents: quadrantMap, spectrumTypes: spectrumMap, aiDescriptions,
              userId, userName: resultItem.participant_name,
              workExperienceYears: resultItem.work_years, language: batchLang,
            });
            if (fusionResult) {
              const fusionHtml = fusionResult.fullHtml;
              const filename = `SCPC-Fusion-Report-${resultItem.participant_name}-${fusionResult.reportNumber}-${dateStr}.pdf`;
              const blob = await downloadReportWithCover(
                fusionHtml,
                { reportType: "fusion", userName: resultItem.participant_name, workExperienceYears: resultItem.work_years, careerStage: stage, reportVersion: "professional", language: batchLang, userId, reportNumber: fusionResult.reportNumber },
                filename, true,
              ) as Blob;
              zip.file(filename, blob);
              successCount++;
            }
          } else if (Object.keys(anchorScores).length > 0) {
            // Fallback: life card not completed, generate career anchor only report
            const fallbackParams: V3DownloadParams = {
              scores: anchorScores, careerStage: stage,
              userName: resultItem.participant_name,
              workExperienceYears: resultItem.work_years,
              userId, language: batchLang, assessmentDate: dateStr,
            };
            const { blob, filename } = await generateV3ReportBlob(fallbackParams);
            zip.file(filename, blob);
            successCount++;
          }
        } else if (assessmentType === "life_card") {
          // Generate ideal card report blob
          const { generateIdealCardReportHTML } = await import("@/lib/exportReport");
          let rawRankedCards = (resultItem.value_ranking as any[] | undefined) || [];
          if (rawRankedCards.length === 0) {
            const { data: cardResult } = await (await import("@/integrations/supabase/client")).supabase
              .from("scpc_assessment_results")
              .select("value_ranking")
              .eq("session_id", resultItem.session_id || resultItem.id)
              .maybeSingle();
            rawRankedCards = (cardResult?.value_ranking as any[]) || [];
          }
          const rankedCards = rawRankedCards.map((c: any) => ({ rank: c.rank, cardId: c.cardId, category: c.category }));
          if (rankedCards.length > 0) {
            const reportHtml = generateIdealCardReportHTML({ rankedCards, userName: resultItem.participant_name }, batchLang);
            const filename = `SCPC-Espresso-Card-Report-${resultItem.participant_name}-${dateStr}.pdf`;
            const blob = await downloadReportWithCover(
              reportHtml,
              { reportType: "ideal_card", userName: resultItem.participant_name, workExperienceYears: resultItem.work_years, careerStage: stage, reportVersion: "professional", language: batchLang, userId },
              filename, true,
            ) as Blob;
            zip.file(filename, blob);
            successCount++;
          }
        } else {
          // Default: career anchor V3 report
          const params: V3DownloadParams = {
            scores: resultItem.calculated_scores || {},
            careerStage: stage,
            userName: resultItem.participant_name,
            workExperienceYears: resultItem.work_years,
            userId,
            language: batchLang,
            assessmentDate: dateStr,
          };
          const { blob, filename } = await generateV3ReportBlob(params);
          zip.file(filename, blob);
          successCount++;
        }
      } catch (downloadError) {
        console.error(`Failed to generate report for ${resultItem.participant_name}:`, downloadError);
        toast.error(t(`Failed: ${resultItem.participant_name}`, `生成失敗：${resultItem.participant_name}`));
      }
    }

    if (successCount > 0) {
      const zipBlob = await zip.generateAsync({ type: "blob" });
      downloadBlob(zipBlob, `${batch?.batch_name || "batch"}_reports_${new Date().toISOString().slice(0, 10)}.zip`);
    }

    setIsDownloadingReports(false);
    toast.success(t(`Downloaded ${successCount} reports as ZIP`, `已打包下載 ${successCount} 份報告`));
  }, [selectedIds, results, batch]);

  const [downloadingItemId, setDownloadingItemId] = useState<string | null>(null);

  const handleSingleDownload = useCallback(async (resultItem: typeof results[0]) => {
    if (!batch) return;
    setDownloadingItemId(resultItem.id);
    const batchLang = (batch.language || "zh-TW") as "en" | "zh-TW" | "zh-CN";
    const assessmentType = batch.assessment_type || "career_anchor";
    const stage = deriveStageFromWorkYears(resultItem.work_years);
    const userId = resultItem.session_id || resultItem.id;
    const dateStr = new Date(resultItem.completed_at).toISOString().slice(0, 10);

    try {
      if (assessmentType === "combined") {
        const { generateCombinedFusionHTML, fetchIdealCardGeneratorData, fetchAiCardDescriptions, COMBINED_FUSION_CSS } = await import("@/lib/reportFusionDownload");
        const anchorScores = resultItem.calculated_scores || {};
        let rankedCards = (resultItem.value_ranking as any[] | undefined) || [];
        if (rankedCards.length === 0) {
          const { data: cardResult } = await (await import("@/integrations/supabase/client")).supabase
            .from("scpc_assessment_results").select("value_ranking")
            .eq("session_id", resultItem.session_id || resultItem.id).maybeSingle();
          rankedCards = (cardResult?.value_ranking as any[]) || [];
        }
        if (rankedCards.length > 0 && Object.keys(anchorScores).length > 0) {
          const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(rankedCards, batchLang);
          const aiDescriptions = await fetchAiCardDescriptions(rankedCards, quadrantMap, batchLang);
          const fusionResult = await generateCombinedFusionHTML({
            anchorScores, careerStage: stage, rankedCards,
            quadrantContents: quadrantMap, spectrumTypes: spectrumMap, aiDescriptions,
            userId, userName: resultItem.participant_name,
            workExperienceYears: resultItem.work_years, language: batchLang,
          });
          if (fusionResult) {
            const fusionHtml = fusionResult.fullHtml;
            const filename = `SCPC-Fusion-Report-${resultItem.participant_name}-${fusionResult.reportNumber}-${dateStr}.pdf`;
            await downloadReportWithCover(
              fusionHtml,
              { reportType: "fusion", userName: resultItem.participant_name, workExperienceYears: resultItem.work_years, careerStage: stage, reportVersion: "professional", language: batchLang, userId, reportNumber: fusionResult.reportNumber },
              filename,
            );
          }
        } else if (Object.keys(anchorScores).length > 0) {
          const fallbackParams: V3DownloadParams = {
            scores: anchorScores, careerStage: stage,
            userName: resultItem.participant_name,
            workExperienceYears: resultItem.work_years,
            userId, language: batchLang, assessmentDate: dateStr,
          };
          const { blob, filename } = await generateV3ReportBlob(fallbackParams);
          downloadBlob(blob, filename);
        }
      } else if (assessmentType === "life_card") {
        const { generateIdealCardReportHTML } = await import("@/lib/exportReport");
        let rawRankedCards = (resultItem.value_ranking as any[] | undefined) || [];
        if (rawRankedCards.length === 0) {
          const { data: cardResult } = await (await import("@/integrations/supabase/client")).supabase
            .from("scpc_assessment_results").select("value_ranking")
            .eq("session_id", resultItem.session_id || resultItem.id).maybeSingle();
          rawRankedCards = (cardResult?.value_ranking as any[]) || [];
        }
        const rankedCards = rawRankedCards.map((c: any) => ({ rank: c.rank, cardId: c.cardId, category: c.category }));
        if (rankedCards.length > 0) {
          const reportHtml = generateIdealCardReportHTML({ rankedCards, userName: resultItem.participant_name }, batchLang);
          const filename = `SCPC-Espresso-Card-Report-${resultItem.participant_name}-${dateStr}.pdf`;
          await downloadReportWithCover(
            reportHtml,
            { reportType: "ideal_card", userName: resultItem.participant_name, workExperienceYears: resultItem.work_years, careerStage: stage, reportVersion: "professional", language: batchLang, userId },
            filename,
          );
        }
      } else {
        const params: V3DownloadParams = {
          scores: resultItem.calculated_scores || {}, careerStage: stage,
          userName: resultItem.participant_name,
          workExperienceYears: resultItem.work_years,
          userId, language: batchLang, assessmentDate: dateStr,
        };
        const { blob, filename } = await generateV3ReportBlob(params);
        downloadBlob(blob, filename);
      }
      toast.success(t(`Downloaded: ${resultItem.participant_name}`, `已下載：${resultItem.participant_name}`));
    } catch (error) {
      console.error("Single download failed:", error);
      toast.error(t(`Failed: ${resultItem.participant_name}`, `下載失敗：${resultItem.participant_name}`));
    } finally {
      setDownloadingItemId(null);
    }
  }, [batch]);

  if (batchLoading || !batch) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  const statusConfig = STATUS_CONFIG[batch.status] || STATUS_CONFIG.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/org/batch-assessment")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Batch Name", "批次名稱")}</Label>
                <Input value={editBatchName} onChange={(event) => setEditBatchName(event.target.value)} className="max-w-md" />
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("Start Time", "開始時間")}</Label>
                  <Input type="datetime-local" value={editStartTime} onChange={(event) => setEditStartTime(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t("End Time", "截止時間")}</Label>
                  <Input type="datetime-local" value={editEndTime} onChange={(event) => setEditEndTime(event.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={updateBatch.isPending} style={{ backgroundColor: "#059669" }}>
                  {updateBatch.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
                  {t("Save", "儲存")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  <X className="w-4 h-4 mr-1.5" /> {t("Cancel", "取消")}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold" style={{ color: PRIMARY }}>{batch.batch_name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}>
                  {statusConfig.label[language] || statusConfig.label.en}
                </span>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleStartEdit}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {new Date(batch.start_time).toLocaleDateString()} – {new Date(batch.end_time).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {batch.status === "draft" && <Button size="sm" onClick={() => handleStatusChange("active")} style={{ backgroundColor: "#059669" }}><PlayCircle className="w-4 h-4 mr-1.5" /> {t("Activate", "啟用")}</Button>}
          {batch.status === "active" && <Button size="sm" variant="outline" onClick={() => handleStatusChange("paused")}><PauseCircle className="w-4 h-4 mr-1.5" /> {t("Pause", "暫停")}</Button>}
          {batch.status === "paused" && <Button size="sm" onClick={() => handleStatusChange("active")} style={{ backgroundColor: "#059669" }}><PlayCircle className="w-4 h-4 mr-1.5" /> {t("Resume", "恢復")}</Button>}
          {(batch.status === "active" || batch.status === "paused") && <Button size="sm" variant="destructive" onClick={() => handleStatusChange("closed")}><XCircle className="w-4 h-4 mr-1.5" /> {t("Close", "結束")}</Button>}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: "#E9ECEF" }}>
          <p className="text-xs font-medium text-muted-foreground">{t("Assessment Link", "施測連結")}</p>
          <code className="block text-xs bg-gray-50 rounded px-2 py-1.5 break-all select-all" style={{ wordBreak: "break-all" }}>{`${SITE_ORIGIN}/batch/${encodeURIComponent(batch.batch_slug)}`}</code>
          <Button variant="outline" size="sm" className="w-full" onClick={handleCopyLink}><Copy className="w-4 h-4 mr-2" />{t("Copy Link", "複製連結")}</Button>
        </div>
        <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: "#E9ECEF" }}>
          <p className="text-xs font-medium text-muted-foreground">{t("Access Code", "驗證碼")}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xl font-mono font-bold tracking-[0.2em] text-center" style={{ color: PRIMARY }}>{batch.access_code}</code>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCopyCode}><Copy className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleResetCode}><RefreshCw className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 space-y-3" style={{ borderColor: "#E9ECEF" }}>
          <p className="text-xs font-medium text-muted-foreground">{t("Quick Actions", "快捷操作")}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={handleCopyEmailTemplate}><Mail className="w-4 h-4 mr-2" />{t("Copy Email Template", "複製郵件範本")}</Button>
        </div>
      </div>

      {/* Report Access Mode Badge */}
      <div className="bg-white rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: "#E9ECEF" }}>
        <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: PRIMARY }} />
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{t("Employee Report Permissions", "員工報告權限")}</p>
          <p className="text-sm font-medium mt-0.5" style={{ color: PRIMARY }}>
            {batch.employee_report_access_mode === "view_and_download"
              ? t("View & Download", "可查看並下載")
              : batch.employee_report_access_mode === "view_only"
              ? t("View Only (No Download)", "可查看不可下載")
              : t("Hidden from Employees", "員工不可查看")}
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
          backgroundColor: batch.employee_report_access_mode === "view_and_download" ? "#ECFDF5" : batch.employee_report_access_mode === "view_only" ? "#FFFBEB" : "#FEF2F2",
          color: batch.employee_report_access_mode === "view_and_download" ? "#059669" : batch.employee_report_access_mode === "view_only" ? "#D97706" : "#DC2626",
        }}>
          {batch.employee_report_access_mode === "view_and_download" ? t("Full Access", "完整權限") : batch.employee_report_access_mode === "view_only" ? t("Restricted", "部分限制") : t("Restricted", "完全限制")}
        </span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1.5"><Activity className="w-3.5 h-3.5" />{t("Dashboard", "儀表盤")}</TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5"><FileText className="w-3.5 h-3.5" />{t("Results", "結果")}</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><BarChart3 className="w-3.5 h-3.5" />{t("Team Stats", "團隊統計")}</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: t("Participants", "參與人數"), value: totalParticipants, icon: Users, color: PRIMARY },
              { label: t("Completed", "已完成"), value: completedCount, icon: CheckCircle2, color: "#059669" },
              { label: t("In Progress", "進行中"), value: inProgressCount, icon: Clock, color: "#D97706" },
              { label: t("Completion Rate", "完成率"), value: `${completionRate}%`, icon: TrendingUp, color: "#6366F1" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border p-4" style={{ borderColor: "#E9ECEF" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: kpi.color }}>{kpi.value}</p>
                  </div>
                  <kpi.icon className="w-5 h-5" style={{ color: kpi.color + "60" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t("Overall Progress", "整體進度")}</span>
              <span className="text-sm font-bold" style={{ color: PRIMARY }}>{completionRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%`, backgroundColor: "#059669" }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{t("Today", "今日")}: {todayCompleted}</span>
              <span>{completedCount} / {totalParticipants}</span>
            </div>
          </div>

          {recentCompletions.length > 0 && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: PRIMARY }}>{t("Recent Completions", "最近完成")}</h3>
              <div className="space-y-2">
                {recentCompletions.map((resultItem) => (
                  <div key={resultItem.id} className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: "#F0F2F5" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: PRIMARY }}>{resultItem.participant_name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium">{resultItem.participant_name}</p>
                        <p className="text-xs text-muted-foreground">{resultItem.department || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color: PRIMARY }}>{ANCHOR_NAMES[resultItem.main_anchor]?.[language] || resultItem.main_anchor}</p>
                      <p className="text-xs text-muted-foreground">{new Date(resultItem.completed_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
              <h3 className="text-sm font-bold mb-4" style={{ color: PRIMARY }}>{t("Average Scores", "平均分數")}</h3>
              <div className="space-y-2.5">
                {DIMENSION_CODES.map((dim) => {
                  const score = averageScores[dim] || 0;
                  return (
                    <div key={dim} className="flex items-center gap-3">
                      <div className="w-7 text-xs font-bold" style={{ color: PRIMARY }}>{dim}</div>
                      <div className="flex-1"><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: score >= 65 ? "#059669" : score >= 45 ? "#2980B9" : "#95A5A6" }} /></div></div>
                      <div className="w-10 text-xs font-medium text-right" style={{ color: "#555" }}>{score}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t(`${results.length} results`, `共 ${results.length} 筆結果`)}
              {selectedIds.size > 0 && (
                <span className="ml-2 font-medium" style={{ color: PRIMARY }}>
                  ({t(`${selectedIds.size} selected`, `已選 ${selectedIds.size} 筆`)})
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDownloadReports}
                disabled={selectedIds.size === 0 || isDownloadingReports || results.length === 0}
              >
                {isDownloadingReports ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {`${downloadProgress.current}/${downloadProgress.total}`}
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    {t("Download ZIP", "打包下載報告")}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={results.length === 0}><Download className="w-4 h-4 mr-2" />{t("Export CSV", "匯出 CSV")}</Button>
            </div>
          </div>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><FileText className="w-12 h-12 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">{t("No results yet", "尚無結果")}</p></div>
          ) : (
            <div className="bg-white rounded-xl border overflow-x-auto" style={{ borderColor: "#E9ECEF" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#E9ECEF", backgroundColor: "#FAFBFC" }}>
                    <th className="w-10 px-3 py-3">
                      <Checkbox checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={toggleSelectAll} />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Name", "姓名")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Dept", "部門")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Yrs", "年資")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Time", "時間")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t("Anchor", "主錨")}</th>
                    {DIMENSION_CODES.map((dim) => <th key={dim} className="text-center px-2 py-3 font-medium text-muted-foreground">{dim}</th>)}
                    <th className="text-right px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((resultItem) => (
                    <tr key={resultItem.id} className={`border-b last:border-b-0 transition-colors ${selectedResultId === resultItem.id ? "bg-blue-50/70" : "hover:bg-gray-50/50"}`} style={{ borderColor: "#E9ECEF" }}>
                      <td className="w-10 px-3 py-3">
                        <Checkbox checked={selectedIds.has(resultItem.id)} onCheckedChange={() => toggleSelect(resultItem.id)} />
                      </td>
                      <td className="px-4 py-3 font-medium">{resultItem.participant_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{resultItem.department || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{resultItem.work_years ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(resultItem.completed_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: PRIMARY + "10", color: PRIMARY }}>{resultItem.main_anchor}</span></td>
                      {DIMENSION_CODES.map((dim) => <td key={dim} className="px-2 py-3 text-center text-xs tabular-nums" style={{ color: (resultItem.calculated_scores?.[dim] ?? 0) >= 65 ? "#059669" : "#555" }}>{resultItem.calculated_scores?.[dim] ?? 0}</td>)}
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSelectedResultId(selectedResultId === resultItem.id ? null : resultItem.id)}>{selectedResultId === resultItem.id ? <EyeOff className="w-3.5 h-3.5 text-primary" /> : <Eye className="w-3.5 h-3.5" />}</Button><Button variant="ghost" size="sm" className="h-7 px-2" disabled={downloadingItemId === resultItem.id} onClick={() => handleSingleDownload(resultItem)}>{downloadingItemId === resultItem.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}</Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedResultId && (() => {
            const selected = results.find(r => r.id === selectedResultId);
            if (!selected) return null;
            const scores = selected.calculated_scores || {};
            return (
              <div ref={detailPanelRef} className="bg-white rounded-xl border p-6 animate-in fade-in slide-in-from-top-2 duration-200" style={{ borderColor: PRIMARY + "30", boxShadow: `0 0 0 1px ${PRIMARY}15, 0 4px 12px ${PRIMARY}08` }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: PRIMARY }}>{selected.participant_name} — {t("Detail", "詳情")}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {DIMENSION_CODES.map((dim) => {
                    const score = scores[dim] || 0;
                    const levelColor = score >= 80 ? "#C0392B" : score >= 65 ? "#E47E22" : score >= 45 ? "#2980B9" : "#95A5A6";
                    return (
                      <div key={dim} className="rounded-lg border p-3" style={{ borderColor: "#E9ECEF" }}>
                        <div className="flex items-center justify-between mb-1"><span className="text-xs font-bold" style={{ color: PRIMARY }}>{dim}</span><span className="text-sm font-bold" style={{ color: levelColor }}>{score}</span></div>
                        <p className="text-xs text-muted-foreground">{ANCHOR_NAMES[dim]?.[language] || dim}</p>
                        <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: levelColor }} /></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </TabsContent>

        {/* Team Stats */}
        <TabsContent value="team" className="space-y-4 mt-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center"><BarChart3 className="w-12 h-12 text-muted-foreground/30 mb-3" /><p className="text-muted-foreground">{t("Not enough data", "數據不足")}</p></div>
          ) : (
            <>
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: PRIMARY }}>{t("Main Anchor Distribution", "主錨點分布")}</h3>
                <div className="space-y-2">
                  {anchorDistribution.map(([anchor, count]) => {
                    const percent = Math.round((count / results.length) * 100);
                    return (
                      <div key={anchor} className="flex items-center gap-3">
                        <div className="w-7 text-xs font-bold" style={{ color: PRIMARY }}>{anchor}</div>
                        <div className="flex-1"><div className="h-6 bg-gray-50 rounded overflow-hidden relative"><div className="h-full rounded" style={{ width: `${percent}%`, backgroundColor: PRIMARY + "20" }} /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium">{ANCHOR_NAMES[anchor]?.[language] || anchor}</span></div></div>
                        <div className="w-16 text-right text-xs"><span className="font-bold" style={{ color: PRIMARY }}>{count}</span><span className="text-muted-foreground ml-1">({percent}%)</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: PRIMARY }}>{t("Department Distribution", "部門分布")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {departmentDistribution.map(([dept, count]) => (<div key={dept} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50"><span className="text-sm">{dept}</span><span className="text-sm font-bold" style={{ color: PRIMARY }}>{count}</span></div>))}
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: PRIMARY }}>{t("Work Experience Distribution", "年資分布")}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(workYearsDistribution).map(([range, count]) => {
                    const rangeLabels: Record<string, string> = { "0-3": t("0-3 yrs", "0-3 年"), "3-7": t("3-7 yrs", "3-7 年"), "7-15": t("7-15 yrs", "7-15 年"), "15+": t("15+ yrs", "15+ 年") };
                    const percent = results.length > 0 ? Math.round((count / results.length) * 100) : 0;
                    return (<div key={range} className="bg-gray-50 rounded-lg p-3 text-center"><p className="text-xs text-muted-foreground">{rangeLabels[range]}</p><p className="text-xl font-bold mt-1" style={{ color: PRIMARY }}>{count}</p><p className="text-xs text-muted-foreground">{percent}%</p></div>);
                  })}
                </div>
              </div>
              <div className="bg-white rounded-xl border p-5" style={{ borderColor: "#E9ECEF" }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: PRIMARY }}>{t("Team Average Scores", "團隊平均分數")}</h3>
                <div className="space-y-2.5">
                  {DIMENSION_CODES.map((dim) => {
                    const score = averageScores[dim] || 0;
                    return (
                      <div key={dim} className="flex items-center gap-3">
                        <div className="w-20 text-xs"><span className="font-bold" style={{ color: PRIMARY }}>{dim}</span></div>
                        <div className="flex-1"><div className="h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: score >= 65 ? "#059669" : score >= 45 ? "#2980B9" : "#95A5A6" }} /></div></div>
                        <div className="w-12 text-right text-sm font-bold" style={{ color: PRIMARY }}>{score}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end"><Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="w-4 h-4 mr-2" />{t("Export Report", "匯出報告")}</Button></div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
