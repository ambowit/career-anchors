import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, ArrowRight, Loader2, LogIn, TrendingUp } from "lucide-react";
import { DIMENSIONS, getHighSensitivityAnchors } from "@/hooks/useAssessment";
import { useAssessmentHistory, convertStoredToResult } from "@/hooks/useAssessmentResults";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import TrendChart from "@/components/desktop/TrendChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const { isTestLoggedIn, testRole } = useTestAuth();
  const { data: historyData, isLoading, error } = useAssessmentHistory();
  const [selectedDimensions, setSelectedDimensions] = useState(["TF", "GM", "AU", "SE"]);

  const isLoggedIn = !!user || isTestLoggedIn;

  const handleViewResult = (resultId: string) => {
    const result = historyData?.find(r => r.id === resultId);
    if (result) {
      const assessmentResult = convertStoredToResult(result);
      sessionStorage.setItem("assessmentResults", JSON.stringify(assessmentResult));
      sessionStorage.setItem("currentResultId", resultId);
      navigate("/results");
    }
  };

  const toggleDimension = (dimensionKey: string) => {
    setSelectedDimensions(prev =>
      prev.includes(dimensionKey)
        ? prev.filter(d => d !== dimensionKey)
        : [...prev, dimensionKey]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
              {t("history.title")}
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {language === "en" 
                ? "Login to view past assessments and compare career anchor changes over time."
                : language === "zh-TW"
                  ? "登入後可查看過往測評記錄，對比不同時期的職業錨變化。"
                  : "登录后可查看过往测评记录，对比不同时期的职业锚变化。"}
            </p>
          </div>
        </section>

        <section className="py-6 sm:py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-24">
              <LogIn className="w-12 h-12 text-muted-foreground/50 mx-auto mb-6" />
              <h2 className="text-xl font-medium text-foreground mb-2">
                {language === "en" ? "Please login first" : language === "zh-TW" ? "請先登入" : "请先登录"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {language === "en" 
                  ? "Please select a role to login from the top right corner of the homepage."
                  : language === "zh-TW"
                    ? "請通過首頁右上角選擇角色登入。"
                    : "请通过首页右上角选择角色登录。"}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm btn-mechanical hover:bg-primary/90 transition-colors"
              >
                {language === "en" ? "Go to Homepage" : language === "zh-TW" ? "返回首頁登入" : "返回首页登录"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Note: Test accounts now use real Supabase auth, so isTestLoggedIn && !user
  // will never be true. Test users can save and view history like regular users.

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <section className="py-8 sm:py-16 px-4 sm:px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="data-label text-primary mb-4">Assessment History</div>
            <h1 className="font-display text-xl sm:text-3xl md:text-4xl text-foreground mb-4">
              {t("history.title")}
            </h1>
          </div>
        </section>

        <section className="py-6 sm:py-12 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-24">
              <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-6" />
              <h2 className="text-xl font-medium text-foreground mb-2">
                {language === "en" 
                  ? "Failed to load history"
                  : language === "zh-TW"
                    ? "載入歷史記錄失敗"
                    : "加载历史记录失败"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {language === "en" 
                  ? "Please try again later."
                  : language === "zh-TW"
                    ? "請稍後重試。"
                    : "请稍后重试。"}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm btn-mechanical hover:bg-primary/90 transition-colors"
              >
                {language === "en" ? "Back to Home" : language === "zh-TW" ? "返回首頁" : "返回首页"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const hasHistory = historyData && historyData.length > 0;
  const hasTrendData = historyData && historyData.length >= 2;

  return (
    <div className="min-h-screen pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <section className="py-8 sm:py-16 px-4 sm:px-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="data-label text-primary mb-4">Assessment History</div>
          <h1 className="font-display text-xl sm:text-3xl md:text-4xl text-foreground mb-4">
            {t("history.title")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {language === "en" 
              ? "View past assessments and compare career anchor changes over time. Career anchors typically become clearer with experience and reflection."
              : language === "zh-TW"
                ? "查看過往測評記錄，對比不同時期的職業錨變化。職業錨通常隨著經歷和反思而逐漸清晰。"
                : "查看过往测评记录，对比不同时期的职业锚变化。职业锚通常随着经历和反思而逐渐清晰。"}
          </p>
        </div>
      </section>

      <section className="py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="text-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{t("common.loading")}</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <p className="text-destructive mb-4">
                {language === "en" ? "Failed to load. Please refresh." : language === "zh-TW" ? "載入失敗，請刷新頁面重試" : "加载失败，请刷新页面重试"}
              </p>
            </div>
          ) : !hasHistory ? (
            <div className="text-center py-24">
              <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-6" />
              <h2 className="text-xl font-medium text-foreground mb-2">
                {t("history.empty")}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t("history.emptyDesc")}
              </p>
              <Link
                to="/assessment"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm btn-mechanical hover:bg-primary/90 transition-colors"
              >
                {t("home.startAssessment")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              {hasTrendData ? (
                <Tabs defaultValue="list" className="mb-8">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="list">
                      <Clock className="w-4 h-4 mr-2" />
                      {language === "en" ? "Record List" : language === "zh-TW" ? "記錄列表" : "记录列表"}
                    </TabsTrigger>
                    <TabsTrigger value="trend">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      {language === "en" ? "Trend Analysis" : language === "zh-TW" ? "趨勢分析" : "趋势分析"}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="list" className="mt-6">
                    <HistoryList
                      historyData={historyData}
                      onViewResult={handleViewResult}
                      formatDate={formatDate}
                      language={language}
                      t={t}
                    />
                  </TabsContent>

                  <TabsContent value="trend" className="mt-6 space-y-6">
                    <TrendChart 
                      results={historyData} 
                      selectedDimensions={selectedDimensions}
                    />

                    <div className="p-6 bg-card border border-border rounded-sm">
                      <h4 className="data-label mb-3">
                        {language === "en" ? "Select dimensions to display" : language === "zh-TW" ? "選擇顯示的維度" : "选择显示的维度"}
                      </h4>
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
                                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground"
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
                <HistoryList
                  historyData={historyData}
                  onViewResult={handleViewResult}
                  formatDate={formatDate}
                  language={language}
                  t={t}
                />
              )}


            </>
          )}
        </div>
      </section>
    </div>
  );
}

interface HistoryListProps {
  historyData: ReturnType<typeof useAssessmentHistory>["data"];
  onViewResult: (id: string) => void;
  formatDate: (date: string) => string;
  language: string;
  t: (key: string) => string;
}

function HistoryList({ historyData, onViewResult, formatDate, language, t }: HistoryListProps) {
  if (!historyData) return null;

  return (
    <div className="space-y-4">
      {historyData.map((record, index) => {
        const recordScores: Record<string, number> = typeof record.scores === "object" && record.scores ? (record.scores as Record<string, number>) : {};
        const recordHighSens = getHighSensitivityAnchors(recordScores);
        const hasRecordHighSens = recordHighSens.length > 0;
        const displayAnchorKey = recordHighSens[0] || record.main_anchor;
        const displayAnchorName = t(`assessment.dimensions.${displayAnchorKey}`);

        const isLatest = index === 0;

        return (
          <div
            key={record.id}
            className={cn(
              "p-6 border rounded-sm transition-colors",
              isLatest
                ? "bg-primary/5 border-primary"
                : "bg-card border-border hover:border-muted-foreground/50"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-foreground font-medium">
                      {formatDate(record.created_at)}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-sm">
                        {language === "en" ? "Latest" : language === "zh-TW" ? "最新" : "最新"}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("results.riskIndex")}: {record.risk_index} · 
                    {record.stability === "mature"
                      ? t("results.mature")
                      : record.stability === "developing"
                        ? t("results.developing")
                        : t("results.unclear")}
                    {record.question_count && ` · ${record.question_count} ${language === "en" ? "questions" : language === "zh-TW" ? "題" : "题"}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="data-label mb-1">
                    {hasRecordHighSens
                      ? (language === "en" ? "High-Sensitivity Anchor" : language === "zh-TW" ? "高敏感錨" : "高敏感锚")
                      : (language === "en" ? "Top Anchor" : language === "zh-TW" ? "最高分錨點" : "最高分锚点")}
                  </div>
                  <div className="text-foreground font-medium">
                    {displayAnchorName}
                  </div>
                </div>

              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewResult(record.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-sm transition-colors"
                >
                  {language === "en" ? "View Details" : language === "zh-TW" ? "查看詳情" : "查看详情"}
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

interface TrendInsightsProps {
  historyData: NonNullable<ReturnType<typeof useAssessmentHistory>["data"]>;
  language: string;
  t: (key: string) => string;
}

function TrendInsights({ historyData, language, t }: TrendInsightsProps) {
  const latestResult = historyData[0];
  const earliestResult = historyData[historyData.length - 1];
  
  const latestScores: Record<string, number> = typeof latestResult.scores === "object" && latestResult.scores ? (latestResult.scores as Record<string, number>) : {};
  const earliestScores: Record<string, number> = typeof earliestResult.scores === "object" && earliestResult.scores ? (earliestResult.scores as Record<string, number>) : {};
  const latestHighSens = getHighSensitivityAnchors(latestScores);
  const earliestHighSens = getHighSensitivityAnchors(earliestScores);
  const latestDisplayAnchor = latestHighSens[0] || latestResult.main_anchor;
  const earliestDisplayAnchor = earliestHighSens[0] || earliestResult.main_anchor;
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
              ? `Risk index changed from ${earliestResult.risk_index} to ${latestResult.risk_index}${riskIndexImproved ? ", indicating your career anchor is becoming clearer" : ", there may be new internal conflicts to address"}`
              : language === "zh-TW"
                ? `風險指數從 ${earliestResult.risk_index} 變化到 ${latestResult.risk_index}${riskIndexImproved ? "，說明你的職業錨定位越來越清晰" : "，可能存在新的內在衝突需要處理"}`
                : `风险指数从 ${earliestResult.risk_index} 变化到 ${latestResult.risk_index}${riskIndexImproved ? "，说明你的职业锚定位越来越清晰" : "，可能存在新的内在冲突需要处理"}`}
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
