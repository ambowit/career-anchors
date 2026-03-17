import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Clock,
  ArrowRight,
  Loader2,
  LogIn,
  TrendingUp,
  Download,
  Compass,
  Heart,
  Sparkles,
} from "lucide-react";
import { downloadLatestIdealCardReport } from "@/lib/reportIdealCardDownload";
import { downloadLatestFusionReport } from "@/lib/reportFusionDownload";
import { downloadV3ReportAsPdf, assessmentResultToV3Params } from "@/lib/reportV3Download";
import type { LangKey } from "@/lib/reportDataFetcher";
import { toast } from "sonner";
import { DIMENSIONS, getCoreAdvantageAnchors } from "@/hooks/useAssessment";
import { useAssessmentHistory, convertStoredToResult } from "@/hooks/useAssessmentResults";
import { useIdealCardHistory, type StoredIdealCardResult } from "@/hooks/useIdealCardHistory";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { cn, resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";
import { getCategoryLabel, getCardLabel, IDEAL_CARDS, type CardCategory } from "@/data/idealCards";
import TrendChart from "@/components/desktop/TrendChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ---------------------------------------------------------------------------
// i18n text map
// ---------------------------------------------------------------------------

function getTexts(language: string) {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  return {
    pageTitle: isEn ? "Assessment History" : isTW ? "測評歷史" : "测评历史",
    pageDesc: isEn
      ? "View past assessments and compare changes over time."
      : isTW
        ? "查看過往測評記錄，對比不同時期的變化趨勢。"
        : "查看过往测评记录，对比不同时期的变化趋势。",
    tabAnchor: isEn ? "Career Anchor" : isTW ? "職業錨" : "职业锚",
    tabIdealCard: isEn ? "Espresso Card" : isTW ? "理想人生卡" : "理想人生卡",
    tabFusion: isEn ? "Integration Assessment" : isTW ? "整合測評" : "整合测评",
    latest: isEn ? "Latest" : "最新",
    recordList: isEn ? "Record List" : isTW ? "記錄列表" : "记录列表",
    trendAnalysis: isEn ? "Trend Analysis" : isTW ? "趨勢分析" : "趋势分析",
    selectDimensions: isEn ? "Select dimensions to display" : isTW ? "選擇顯示的維度" : "选择显示的维度",
    completeReport: isEn ? "Complete Report" : isTW ? "完整報告" : "完整报告",
    viewDetails: isEn ? "View Details" : isTW ? "查看詳情" : "查看详情",
    downloadReport: isEn ? "Download Report" : isTW ? "下載報告" : "下载报告",
    downloadFusion: isEn ? "Integration Report" : isTW ? "整合報告" : "整合报告",
    noRecords: isEn ? "No records yet" : isTW ? "暫無記錄" : "暂无记录",
    noAnchorDesc: isEn
      ? "Complete a career anchor assessment to see your results here."
      : isTW
        ? "完成職業錨測評後，結果將顯示在這裡。"
        : "完成职业锚测评后，结果将显示在这里。",
    noIdealCardDesc: isEn
      ? "Complete an Espresso Card assessment to see your results here."
      : isTW
        ? "完成理想人生卡測評後，結果將顯示在這裡。"
        : "完成理想人生卡测评后，结果将显示在这里。",
    noFusionDesc: isEn
      ? "Complete both career anchor and Espresso Card assessments to generate fusion analysis."
      : isTW
        ? "同時完成職業錨和理想人生卡測評後，即可生成整合分析。"
        : "同时完成职业锚和理想人生卡测评后，即可生成整合分析。",
    startAnchor: isEn ? "Start Career Anchor Assessment" : isTW ? "開始職業錨測評" : "开始职业锚测评",
    startIdealCard: isEn ? "Start Espresso Card Assessment" : isTW ? "開始理想人生卡測評" : "开始理想人生卡测评",
    viewFusion: isEn ? "View Integration Report" : isTW ? "查看整合報告" : "查看整合报告",
    fusionAvailable: isEn ? "Integration analysis available" : isTW ? "可生成整合分析" : "可生成整合分析",
    fusionPairLabel: isEn ? "Career Anchor + Espresso Card" : isTW ? "職業錨 + 理想人生卡" : "职业锚 + 理想人生卡",
    loginFirst: isEn ? "Please login first" : isTW ? "請先登入" : "请先登录",
    loginDesc: isEn
      ? "Please select a role to login from the top right corner of the homepage."
      : isTW
        ? "請通過首頁右上角選擇角色登入。"
        : "请通过首页右上角选择角色登录。",
    goHome: isEn ? "Go to Homepage" : isTW ? "返回首頁登入" : "返回首页登录",
    questions: isEn ? "questions" : isTW ? "題" : "题",
    cards: isEn ? "cards" : isTW ? "張卡片" : "张卡片",
    downloaded: isEn ? "Report downloaded" : isTW ? "報告已下載" : "报告已下载",
    downloadFailed: isEn ? "Download failed" : isTW ? "下載失敗" : "下载失败",
  };
}

// ---------------------------------------------------------------------------
// Category label helper for ideal card
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<CardCategory, string> = {
  intrinsic: "text-violet-600",
  lifestyle: "text-emerald-600",
  interpersonal: "text-rose-600",
  material: "text-amber-600",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, profile, loading: authLoading } = useAuth();
  const { isTestLoggedIn, careerStage, workYears } = useTestAuth();
  const { data: anchorHistory, isLoading: anchorLoading, error: anchorError } = useAssessmentHistory();
  const { data: idealCardHistory, isLoading: idealCardLoading } = useIdealCardHistory();
  const [activeTab, setActiveTab] = useState("anchor");
  const [selectedDimensions, setSelectedDimensions] = useState(["TF", "GM", "AU", "SE"]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const txt = getTexts(language);
  const isLoggedIn = !!user || isTestLoggedIn;
  const isLoading = anchorLoading || idealCardLoading;

  // Fusion records: pair latest anchor + latest ideal card
  const fusionRecords = useMemo(() => {
    if (!anchorHistory?.length || !idealCardHistory?.length) return [];
    // Create fusion entries from anchor records that have a matching ideal card
    // Simple approach: each anchor record that exists AFTER the first ideal card was created
    const earliestIdealCard = idealCardHistory[idealCardHistory.length - 1]?.created_at;
    if (!earliestIdealCard) return [];

    return anchorHistory
      .filter(anchorRecord => {
        // Find the closest ideal card record created before or same time as anchor
        return idealCardHistory.some(ic => true); // User has at least one ideal card
      })
      .map(anchorRecord => {
        // Find the closest ideal card result
        const closestIdealCard = idealCardHistory.reduce((best, current) => {
          const anchorTime = new Date(anchorRecord.created_at).getTime();
          const currentDiff = Math.abs(new Date(current.created_at).getTime() - anchorTime);
          const bestDiff = Math.abs(new Date(best.created_at).getTime() - anchorTime);
          return currentDiff < bestDiff ? current : best;
        });
        return {
          anchorRecord,
          idealCardRecord: closestIdealCard,
          created_at: anchorRecord.created_at, // Use anchor date as primary
        };
      });
  }, [anchorHistory, idealCardHistory]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(
      language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN",
      { year: "numeric", month: "long", day: "numeric" },
    );
  };

  // ---- Anchor handlers ----

  const handleViewAnchorResult = (resultId: string) => {
    const result = anchorHistory?.find((r) => r.id === resultId);
    if (!result) return;
    const assessmentResult = convertStoredToResult(result as any);
    sessionStorage.setItem("assessmentResults", JSON.stringify(assessmentResult));
    navigate("/report-view", { state: { fromHistory: true } });
  };

  const handleDownloadAnchorReport = async (record: {
    id: string;
    score_tf: number; score_gm: number; score_au: number; score_se: number;
    score_ec: number; score_sv: number; score_ch: number; score_ls: number;
    user_id: string;
    created_at?: string;
  }) => {
    setDownloadingId(record.id);
    try {
      const v3Params = assessmentResultToV3Params(
        record,
        resolveUserDisplayName(profile, user, language),
        profile?.career_stage || careerStage || "mid",
        resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
        language as LangKey,
      );
      if (record.created_at) {
        v3Params.assessmentDate = new Date(record.created_at).toLocaleDateString(
          language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN"
        );
      }
      await downloadV3ReportAsPdf(v3Params);
      toast.success(txt.downloaded);
    } catch {
      toast.error(txt.downloadFailed);
    } finally {
      setDownloadingId(null);
    }
  };

  // ---- Ideal card handlers ----

  const handleViewIdealCardResult = (record: StoredIdealCardResult) => {
    // Store to sessionStorage and navigate to results page
    const rankedCards = record.ranked_cards || [];
    sessionStorage.setItem("idealCardResults", JSON.stringify(rankedCards));
    navigate("/ideal-card-results");
  };

  const handleDownloadIdealCardReport = async (recordId: string) => {
    if (!user) return;
    setDownloadingId(recordId);
    try {
      await downloadLatestIdealCardReport(
        user.id,
        resolveUserDisplayName(profile, user, language),
        profile?.career_stage || careerStage || "mid",
        language as "en" | "zh-CN" | "zh-TW",
        undefined,
        resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
      );
      toast.success(txt.downloaded);
    } catch {
      toast.error(txt.downloadFailed);
    } finally {
      setDownloadingId(null);
    }
  };

  // ---- Fusion handlers ----

  const handleViewFusionReport = (anchorRecord: any, idealCardRecord: StoredIdealCardResult) => {
    // Load both into sessionStorage and navigate
    const assessmentResult = convertStoredToResult(anchorRecord);
    sessionStorage.setItem("assessmentResults", JSON.stringify(assessmentResult));
    sessionStorage.setItem("idealCardResults", JSON.stringify(idealCardRecord.ranked_cards));
    navigate("/fusion-report");
  };

  const handleDownloadFusionReport = async (fusionId: string) => {
    if (!user) return;
    setDownloadingId(fusionId);
    try {
      await downloadLatestFusionReport(
        user.id,
        resolveUserDisplayName(profile, user, language),
        profile?.career_stage || careerStage || "mid",
        resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
        language as "en" | "zh-CN" | "zh-TW",
      );
      toast.success(txt.downloaded);
    } catch {
      toast.error(txt.downloadFailed);
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleDimension = (dimensionKey: string) => {
    setSelectedDimensions((prev) =>
      prev.includes(dimensionKey) ? prev.filter((d) => d !== dimensionKey) : [...prev, dimensionKey],
    );
  };

  // ---- Loading / Auth guard ----

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <section className="py-8 sm:py-16 px-4 sm:px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="data-label text-primary mb-4">Assessment History</div>
            <h1 className="font-display text-xl sm:text-3xl md:text-4xl text-foreground mb-4">
              {txt.pageTitle}
            </h1>
          </div>
        </section>
        <section className="py-6 sm:py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center py-24">
            <LogIn className="w-12 h-12 text-muted-foreground/50 mx-auto mb-6" />
            <h2 className="text-xl font-medium text-foreground mb-2">{txt.loginFirst}</h2>
            <p className="text-muted-foreground mb-8">{txt.loginDesc}</p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors"
            >
              {txt.goHome}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---- Main content ----

  return (
    <div className="min-h-screen pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="data-label text-primary mb-4">Assessment History</div>
          <h1 className="font-display text-xl sm:text-3xl md:text-4xl text-foreground mb-4">
            {txt.pageTitle}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">{txt.pageDesc}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Three-tab category selector */}
          <div className="flex gap-2 mb-8 border-b border-border pb-0 overflow-x-auto">
            {[
              { key: "anchor", label: txt.tabAnchor, icon: Compass, count: anchorHistory?.length || 0 },
              { key: "idealCard", label: txt.tabIdealCard, icon: Heart, count: idealCardHistory?.length || 0 },
              { key: "fusion", label: txt.tabFusion, icon: Sparkles, count: fusionRecords.length },
            ].map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30",
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count > 0 && (
                  <span className={cn(
                    "ml-1 px-1.5 min-w-[20px] h-5 inline-flex items-center justify-center rounded-full text-xs font-semibold leading-none",
                    activeTab === key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab: Career Anchor */}
          {activeTab === "anchor" && (
            <AnchorHistoryTab
              historyData={anchorHistory}
              onViewResult={handleViewAnchorResult}
              onDownloadReport={handleDownloadAnchorReport}
              downloadingId={downloadingId}
              formatDate={formatDate}
              selectedDimensions={selectedDimensions}
              toggleDimension={toggleDimension}
              language={language}
              t={t}
              txt={txt}
            />
          )}

          {/* Tab: Ideal Life Card */}
          {activeTab === "idealCard" && (
            <IdealCardHistoryTab
              historyData={idealCardHistory}
              onViewResult={handleViewIdealCardResult}
              onDownloadReport={handleDownloadIdealCardReport}
              downloadingId={downloadingId}
              formatDate={formatDate}
              language={language}
              txt={txt}
            />
          )}

          {/* Tab: Fusion */}
          {activeTab === "fusion" && (
            <FusionHistoryTab
              fusionRecords={fusionRecords}
              onViewReport={handleViewFusionReport}
              onDownloadReport={handleDownloadFusionReport}
              downloadingId={downloadingId}
              formatDate={formatDate}
              language={language}
              txt={txt}
            />
          )}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Career Anchor History Tab
// ---------------------------------------------------------------------------

interface AnchorHistoryTabProps {
  historyData: ReturnType<typeof useAssessmentHistory>["data"];
  onViewResult: (id: string) => void;
  onDownloadReport: (record: any) => void;
  downloadingId: string | null;
  formatDate: (date: string) => string;
  selectedDimensions: string[];
  toggleDimension: (key: string) => void;
  language: string;
  t: (key: string) => string;
  txt: ReturnType<typeof getTexts>;
}

function AnchorHistoryTab({
  historyData,
  onViewResult,
  onDownloadReport,
  downloadingId,
  formatDate,
  selectedDimensions,
  toggleDimension,
  language,
  t,
  txt,
}: AnchorHistoryTabProps) {
  const hasHistory = historyData && historyData.length > 0;
  const hasTrendData = historyData && historyData.length >= 2;

  if (!hasHistory) {
    return (
      <EmptyState
        icon={Compass}
        title={txt.noRecords}
        description={txt.noAnchorDesc}
        actionLabel={txt.startAnchor}
        actionLink="/assessment"
      />
    );
  }

  return (
    <>
      {hasTrendData ? (
        <Tabs defaultValue="list" className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">
              <Clock className="w-4 h-4 mr-2" />
              {txt.recordList}
            </TabsTrigger>
            <TabsTrigger value="trend">
              <TrendingUp className="w-4 h-4 mr-2" />
              {txt.trendAnalysis}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <AnchorList
              historyData={historyData}
              onViewResult={onViewResult}
              onDownloadReport={onDownloadReport}
              downloadingId={downloadingId}
              formatDate={formatDate}
              language={language}
              t={t}
              txt={txt}
            />
          </TabsContent>

          <TabsContent value="trend" className="mt-6 space-y-6">
            <TrendChart results={historyData} selectedDimensions={selectedDimensions} />
            <div className="p-6 bg-card border border-border rounded-sm">
              <h4 className="data-label mb-3">{txt.selectDimensions}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(DIMENSIONS).map(([key]) => {
                  const isSelected = selectedDimensions.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleDimension(key)}
                      className={cn(
                        "px-4 py-2 text-sm font-medium rounded-sm border transition-colors text-left",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-muted-foreground",
                      )}
                    >
                      {t(`assessment.dimensions.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <TrendInsights historyData={historyData} language={language} t={t} />
          </TabsContent>
        </Tabs>
      ) : (
        <AnchorList
          historyData={historyData}
          onViewResult={onViewResult}
          onDownloadReport={onDownloadReport}
          downloadingId={downloadingId}
          formatDate={formatDate}
          language={language}
          t={t}
          txt={txt}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Anchor List
// ---------------------------------------------------------------------------

interface AnchorListProps {
  historyData: NonNullable<ReturnType<typeof useAssessmentHistory>["data"]>;
  onViewResult: (id: string) => void;
  onDownloadReport: (record: any) => void;
  downloadingId: string | null;
  formatDate: (date: string) => string;
  language: string;
  t: (key: string) => string;
  txt: ReturnType<typeof getTexts>;
}

function AnchorList({ historyData, onViewResult, onDownloadReport, downloadingId, formatDate, language, t, txt }: AnchorListProps) {
  return (
    <div className="space-y-4">
      {historyData.map((record, index) => {
        const recordScores: Record<string, number> =
          typeof record.scores === "object" && record.scores ? (record.scores as Record<string, number>) : {};
        const recordCoreAdvAnchors = getCoreAdvantageAnchors(recordScores);
        const hasRecordCoreAdv = recordCoreAdvAnchors.length > 0;
        const displayAnchorKey = recordCoreAdvAnchors[0] || record.main_anchor;
        const displayAnchorName = t(`assessment.dimensions.${displayAnchorKey}`);
        const isLatest = index === 0;

        return (
          <div
            key={record.id}
            className={cn(
              "p-6 border rounded-sm transition-colors",
              isLatest ? "bg-primary/5 border-primary" : "bg-card border-border hover:border-muted-foreground/50",
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground font-medium">{formatDate(record.created_at)}</span>
                    {isLatest && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-sm">
                        {txt.latest}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {record.question_count && `${record.question_count} ${txt.questions}`}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="data-label mb-1">
                    {hasRecordCoreAdv
                      ? (language === "en" ? "Core Advantage Anchor" : language === "zh-TW" ? "核心優勢錨點" : "核心优势锚点")
                      : (language === "en" ? "Top Anchor" : language === "zh-TW" ? "最高分錨點" : "最高分锚点")}
                  </div>
                  <div className="text-foreground font-medium">{displayAnchorName}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onDownloadReport(record)}
                  disabled={downloadingId === record.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {downloadingId === record.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {txt.completeReport}
                </button>
                <button
                  onClick={() => onViewResult(record.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-sm transition-colors"
                >
                  {txt.viewDetails}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ideal Life Card History Tab
// ---------------------------------------------------------------------------

interface IdealCardHistoryTabProps {
  historyData: StoredIdealCardResult[] | undefined;
  onViewResult: (record: StoredIdealCardResult) => void;
  onDownloadReport: (recordId: string) => void;
  downloadingId: string | null;
  formatDate: (date: string) => string;
  language: string;
  txt: ReturnType<typeof getTexts>;
}

function IdealCardHistoryTab({
  historyData,
  onViewResult,
  onDownloadReport,
  downloadingId,
  formatDate,
  language,
  txt,
}: IdealCardHistoryTabProps) {
  if (!historyData || historyData.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={txt.noRecords}
        description={txt.noIdealCardDesc}
        actionLabel={txt.startIdealCard}
        actionLink="/ideal-card-test"
      />
    );
  }

  return (
    <div className="space-y-4">
      {historyData.map((record, index) => {
        const isLatest = index === 0;
        const distribution = record.category_distribution || {};
        const topCards = (record.ranked_cards || []).slice(0, 3);

        return (
          <div
            key={record.id}
            className={cn(
              "p-6 border rounded-sm transition-colors",
              isLatest ? "bg-rose-50/50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800" : "bg-card border-border hover:border-muted-foreground/50",
            )}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground font-medium">{formatDate(record.created_at)}</span>
                    {isLatest && (
                      <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-medium rounded-sm">
                        {txt.latest}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {(record.ranked_cards || []).length} {txt.cards}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="data-label mb-1">
                    {language === "en" ? "Top 3" : "前三名"}
                  </div>
                  <div className="flex gap-1.5 justify-end flex-wrap">
                    {topCards.map((card, cardIndex) => {
                      const idealCard = IDEAL_CARDS.find(c => c.id === card.cardId);
                      const label = idealCard ? getCardLabel(idealCard, language) : card.label || `#${card.cardId}`;
                      return (
                        <span
                          key={cardIndex}
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-sm bg-muted",
                            CATEGORY_COLORS[card.category] || "text-foreground",
                          )}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownloadReport(record.id)}
                  disabled={downloadingId === record.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-rose-500 text-white rounded-sm hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {downloadingId === record.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {txt.downloadReport}
                </button>
                <button
                  onClick={() => onViewResult(record)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-sm transition-colors"
                >
                  {txt.viewDetails}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fusion History Tab
// ---------------------------------------------------------------------------

interface FusionHistoryTabProps {
  fusionRecords: Array<{
    anchorRecord: any;
    idealCardRecord: StoredIdealCardResult;
    created_at: string;
  }>;
  onViewReport: (anchorRecord: any, idealCardRecord: StoredIdealCardResult) => void;
  onDownloadReport: (fusionId: string) => void;
  downloadingId: string | null;
  formatDate: (date: string) => string;
  language: string;
  txt: ReturnType<typeof getTexts>;
}

function FusionHistoryTab({
  fusionRecords,
  onViewReport,
  onDownloadReport,
  downloadingId,
  formatDate,
  language,
  txt,
}: FusionHistoryTabProps) {
  if (fusionRecords.length === 0) {
    return (
      <EmptyState
        icon={Sparkles}
        title={txt.noRecords}
        description={txt.noFusionDesc}
        actionLabel={txt.startAnchor}
        actionLink="/assessment"
      />
    );
  }

  return (
    <div className="space-y-4">
      {fusionRecords.map((record, index) => {
        const isLatest = index === 0;
        const anchorScores: Record<string, number> =
          typeof record.anchorRecord.scores === "object" && record.anchorRecord.scores
            ? (record.anchorRecord.scores as Record<string, number>)
            : {};
        const coreAnchors = getCoreAdvantageAnchors(anchorScores);
        const mainAnchorKey = coreAnchors[0] || record.anchorRecord.main_anchor;
        const topCards = (record.idealCardRecord.ranked_cards || []).slice(0, 3);
        const fusionId = `fusion-${record.anchorRecord.id}`;

        return (
          <div
            key={fusionId}
            className={cn(
              "p-6 border rounded-sm transition-colors",
              isLatest
                ? "bg-gradient-to-r from-primary/5 to-rose-50/50 border-primary/50 dark:from-primary/10 dark:to-rose-950/20"
                : "bg-card border-border hover:border-muted-foreground/50",
            )}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground font-medium">{formatDate(record.created_at)}</span>
                    {isLatest && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-primary to-rose-500 text-white text-xs font-medium rounded-sm">
                        {txt.latest}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">{txt.fusionPairLabel}</div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
                  <div className="text-left sm:text-right">
                    <div className="data-label mb-1">
                      <Compass className="w-3 h-3 inline mr-1" />
                      {txt.tabAnchor}
                    </div>
                    <div className="text-foreground font-medium text-sm">
                      {language === "en"
                        ? DIMENSIONS[mainAnchorKey as keyof typeof DIMENSIONS]?.en || mainAnchorKey
                        : DIMENSIONS[mainAnchorKey as keyof typeof DIMENSIONS]?.zh || mainAnchorKey}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="data-label mb-1">
                      <Heart className="w-3 h-3 inline mr-1" />
                      {language === "en" ? "Top Card" : "首位卡片"}
                    </div>
                    <div className="text-foreground font-medium text-sm">
                      {(() => {
                        const firstCard = topCards[0];
                        if (!firstCard) return "-";
                        const idealCard = IDEAL_CARDS.find(c => c.id === firstCard.cardId);
                        return idealCard ? getCardLabel(idealCard, language) : firstCard.label || "-";
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownloadReport(fusionId)}
                  disabled={downloadingId === fusionId}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {downloadingId === fusionId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {txt.downloadFusion}
                </button>
                <button
                  onClick={() => onViewReport(record.anchorRecord, record.idealCardRecord)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-sm transition-colors"
                >
                  {txt.viewFusion}
                  <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared Empty State
// ---------------------------------------------------------------------------

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionLink,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionLink: string;
}) {
  return (
    <div className="text-center py-24">
      <Icon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-6" />
      <h2 className="text-xl font-medium text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground mb-8">{description}</p>
      <Link
        to={actionLink}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors"
      >
        {actionLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend Insights (Career Anchor only)
// ---------------------------------------------------------------------------

interface TrendInsightsProps {
  historyData: NonNullable<ReturnType<typeof useAssessmentHistory>["data"]>;
  language: string;
  t: (key: string) => string;
}

function TrendInsights({ historyData, language, t }: TrendInsightsProps) {
  const latestResult = historyData[0];
  const earliestResult = historyData[historyData.length - 1];

  const latestScores: Record<string, number> =
    typeof latestResult.scores === "object" && latestResult.scores ? (latestResult.scores as Record<string, number>) : {};
  const earliestScores: Record<string, number> =
    typeof earliestResult.scores === "object" && earliestResult.scores ? (earliestResult.scores as Record<string, number>) : {};
  const latestCoreAdv = getCoreAdvantageAnchors(latestScores);
  const earliestCoreAdv = getCoreAdvantageAnchors(earliestScores);
  const latestDisplayAnchor = latestCoreAdv[0] || latestResult.main_anchor;
  const earliestDisplayAnchor = earliestCoreAdv[0] || earliestResult.main_anchor;
  const anchorChanged = latestDisplayAnchor !== earliestDisplayAnchor;
  const riskIndexImproved = latestResult.risk_index < earliestResult.risk_index;

  const latestAnchorName = t(`assessment.dimensions.${latestDisplayAnchor}`);
  const earliestAnchorName = t(`assessment.dimensions.${earliestDisplayAnchor}`);

  return (
    <div className="p-6 bg-card border border-border rounded-sm">
      <h3 className="font-semibold text-foreground mb-4">
        {language === "en" ? "Career Anchor Evolution Insights" : language === "zh-TW" ? "職業錨演變洞察" : "职业锚演变洞察"}
      </h3>
      <div className="reading-body text-muted-foreground space-y-3">
        <p>
          {language === "en"
            ? `Based on your ${historyData.length} assessments, your career anchor has shown the following changes:`
            : language === "zh-TW"
              ? `根據你的 ${historyData.length} 次測評記錄，你的職業錨在過去一段時間內呈現以下變化：`
              : `根据你的 ${historyData.length} 次测评记录，你的职业锚在过去一段时间内呈现以下变化：`}
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            {language === "en"
              ? `Top anchor from [${earliestAnchorName}] ${anchorChanged ? `changed to [${latestAnchorName}]` : "remained stable"}`
              : language === "zh-TW"
                ? `最高分錨點從【${earliestAnchorName}】${anchorChanged ? `變化到【${latestAnchorName}】` : "保持穩定"}`
                : `最高分锚点从【${earliestAnchorName}】${anchorChanged ? `变化到【${latestAnchorName}】` : "保持稳定"}`}
          </li>
          <li>
            {language === "en"
              ? `Clarity index changed from ${earliestResult.risk_index} to ${latestResult.risk_index}${riskIndexImproved ? ", indicating your career anchor is becoming clearer" : ", there may be new internal conflicts to address"}`
              : language === "zh-TW"
                ? `錨定清晰度從 ${earliestResult.risk_index} 變化到 ${latestResult.risk_index}${riskIndexImproved ? "，說明你的職業錨定位越來越清晰" : "，可能存在新的內在衝突需要處理"}`
                : `锚定清晰度从 ${earliestResult.risk_index} 变化到 ${latestResult.risk_index}${riskIndexImproved ? "，说明你的职业锚定位越来越清晰" : "，可能存在新的内在冲突需要处理"}`}
          </li>
          {anchorChanged && (
            <li>
              {language === "en"
                ? "The change in top anchor may reflect accumulated career experience or major life events. It's recommended to deeply reflect on the reasons for this change."
                : language === "zh-TW"
                  ? "最高分錨點的變化可能反映了你職業經歷的積累或重大人生事件的影響，建議深入反思這一變化的原因"
                  : "最高分锚点的变化可能反映了你职业经历的积累或重大人生事件的影响，建议深入反思这一变化的原因"}
            </li>
          )}
        </ul>
        <p className="font-sans font-medium text-foreground pt-2">
          {language === "en"
            ? "It's recommended to reassess every 6-12 months, especially after major career changes."
            : language === "zh-TW"
              ? "建議每6-12個月重新測評一次，尤其是在重大職業變化後。"
              : "建议每6-12个月重新测评一次，尤其是在重大职业变化后。"}
        </p>
      </div>
    </div>
  );
}
