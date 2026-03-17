import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Compass,
  CheckCircle,
  ArrowRight,
  Download,
  Loader2,
} from "lucide-react";
import { DIMENSIONS, type AssessmentResult } from "@/hooks/useAssessment";
import { useTranslation } from "@/hooks/useLanguage";
import { getActionPlan, type ActionPlanData } from "@/data/actionPlans";
import { cn, resolveUserDisplayName } from "@/lib/utils";
import { downloadLatestV3Report } from "@/lib/reportV3Download";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useAuth } from "@/hooks/useAuth";
import type { LangKey } from "@/lib/reportDataFetcher";
import { toast } from "sonner";

export default function ActionPlanPage() {
  const { language } = useTranslation();
  const { workYears, isExecutive, isEntrepreneur } = useTestAuth();
  const { user, profile } = useAuth();
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Helper to get localized dimension name
  const getDimensionName = (dim: string) => {
    return DIMENSIONS[dim as keyof typeof DIMENSIONS]?.[language] || dim;
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("assessmentResults");
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      navigate("/");
    }
  }, []);

  // Determine career stage code for comprehensive report
  const getCareerStageCode = (): string | null => {
    if (isExecutive) return "executive";
    if (isEntrepreneur) return "entrepreneur";
    if (workYears !== null) {
      if (workYears <= 5) return "entry";
      if (workYears <= 10) return "mid";
      return "senior";
    }
    return null;
  };

  const handleExportReport = async () => {
    if (!user) return;
    setIsExporting(true);
    
    try {
      const reportOutput = await downloadLatestV3Report(
        user.id,
        resolveUserDisplayName(profile, user, language),
        getCareerStageCode() || "mid",
        workYears,
        language as LangKey,
      );
      if (!reportOutput) {
        toast.error(language === "en" ? "No assessment data found" : language === "zh-TW" ? "未找到測評數據" : "未找到测评数据");
        return;
      }
      toast.success(language === "en" ? "Report exported successfully" : language === "zh-TW" ? "報告匯出成功" : "报告导出成功");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(language === "en" ? "Export failed" : language === "zh-TW" ? "匯出失敗" : "导出失败");
    } finally {
      setIsExporting(false);
    }
  };

  if (!results) return null;

  const coreAdvAnchors = results.coreAdvantageAnchors?.length
    ? results.coreAdvantageAnchors
    : Object.entries(results.scores).filter(([, s]) => s >= 80).sort(([, a], [, b]) => b - a).map(([d]) => d);
  const displayAnchor = coreAdvAnchors[0] || results.mainAnchor || "TF";
  const mainAnchorName = getDimensionName(displayAnchor);
  const actionPlan = getActionPlan(displayAnchor, language);
  const isEn = language === "en";

  return (
    <div className="min-h-screen pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 border-b border-border">
        <div className="max-w-4xl mx-auto">
          <div className="data-label text-primary mb-4">
            {isEn ? "Action Plan" : language === "zh-TW" ? "行動建議" : "行动建议"}
          </div>
          <h1 className="font-display text-xl sm:text-3xl md:text-4xl text-foreground mb-4">
            {isEn ? "Action Plan" : language === "zh-TW" ? "行動建議" : "行动建议"}
          </h1>
          <p className="text-muted-foreground">
            {isEn 
              ? `Based on your ${coreAdvAnchors.length > 0 ? 'core advantage anchor' : 'top anchor'} [${mainAnchorName}], here are specific, actionable next steps. Not comfort, but direction.`
              : language === "zh-TW"
                ? `基於你的${coreAdvAnchors.length > 0 ? '核心優勢錨點' : '最高分錨點'}【${mainAnchorName}】，以下是具體的、可執行的下一步建議。不是安慰，而是方向。`
              : `基于你的${coreAdvAnchors.length > 0 ? '核心优势锚点' : '最高分锚点'}【${mainAnchorName}】，以下是具体的、可执行的下一步建议。不是安慰，而是方向。`}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Learning Direction */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="data-label">
                  {isEn ? "Learning Direction" : language === "zh-TW" ? "學習方向" : "学习方向"}
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isEn ? "Learning Direction" : language === "zh-TW" ? "學習方向" : "学习方向"}
                </h2>
              </div>
            </div>
            <div className="grid gap-4">
              {actionPlan.learning.map((item, index) => (
                <div
                  key={index}
                  className="p-6 bg-card border border-border rounded-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="data-label text-primary w-6 flex-shrink-0">
                      {(index + 1).toString().padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-2">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {item.description}
                      </p>
                      {item.resources && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.resources.map((resource, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary/10 text-sm text-foreground font-medium rounded-sm"
                            >
                              {resource}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Career Path */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-sm bg-warning/10 flex items-center justify-center">
                <Compass className="w-5 h-5 text-warning" />
              </div>
              <div>
                <div className="data-label">
                  {isEn ? "Career Path" : language === "zh-TW" ? "職業路徑" : "职业路径"}
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isEn ? "Career Path" : language === "zh-TW" ? "職業路徑" : "职业路径"}
                </h2>
              </div>
            </div>
            <div className="space-y-4">
              {actionPlan.paths.map((path, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-6 border rounded-sm",
                    path.recommended
                      ? "bg-primary/5 border-primary"
                      : "bg-card border-border"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-foreground">
                      {path.title}
                    </h3>
                    {path.recommended && (
                      <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-sm">
                        {isEn ? "Recommended" : language === "zh-TW" ? "推薦" : "推荐"}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {path.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{isEn ? "Timeline: " : language === "zh-TW" ? "時間跨度：" : "时间跨度："}</span>
                      <span className="text-foreground font-medium">
                        {path.timeline}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{isEn ? "Risk Level: " : language === "zh-TW" ? "風險等級：" : "风险等级："}</span>
                      <span
                        className={cn(
                          "font-medium",
                          (path.risk === "Low" || path.risk === "低")
                            ? "text-primary"
                            : (path.risk === "Medium" || path.risk === "中")
                              ? "text-warning"
                              : "text-destructive"
                        )}
                      >
                        {path.risk}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Steps */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-sm bg-muted/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="data-label">
                  {isEn ? "Verification" : language === "zh-TW" ? "驗證方式" : "验证方式"}
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {isEn ? "Verification Steps" : language === "zh-TW" ? "驗證方式" : "验证方式"}
                </h2>
              </div>
            </div>
            <div className="info-block">
              <p className="text-muted-foreground mb-4">
                {isEn 
                  ? "Assessment results need to be verified through real experiences. Here are the recommended verification steps:"
                  : language === "zh-TW"
                    ? "測評結果需要通過實際經歷來驗證。以下是建議的驗證步驟："
                    : "测评结果需要通过实际经历来验证。以下是建议的验证步骤："}
              </p>
            </div>
            <div className="mt-6 space-y-3">
              {actionPlan.verification.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-card border border-border rounded-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="text-foreground font-medium">{step.action}</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {step.purpose}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade-off Reminder */}
          <div className="alert-insight mb-12">
            <h3 className="font-semibold text-foreground mb-3">
              {isEn ? "Important: Trade-offs are Inevitable" : language === "zh-TW" ? "重要提醒：取捨是必然的" : "重要提醒：Trade-off 是必然的"}
            </h3>
            <div className="reading-body text-muted-foreground space-y-3">
              <p>
                {isEn 
                  ? "Choosing a career path aligned with your anchor means you may need to give up:"
                  : language === "zh-TW"
                    ? "選擇符合核心優勢錨點的職業路徑，意味著你可能需要放棄："
                    : "选择符合核心优势锚点的职业路径，意味着你可能需要放弃："}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                {actionPlan.tradeoffs.map((tradeoff, index) => (
                  <li key={index}>{tradeoff}</li>
                ))}
              </ul>
              <p className="font-sans font-medium text-foreground pt-2">
                {isEn 
                  ? "This is not loss, but focus. Knowing clearly what you're giving up is more powerful than vaguely wanting everything."
                  : language === "zh-TW"
                    ? "這不是損失，而是聚焦。明確知道自己放棄什麼，比模糊地什麼都想要更有力量。"
                    : "这不是损失，而是聚焦。明确知道自己放弃什么，比模糊地什么都想要更有力量。"}
              </p>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border">
            <Link
              to="/results"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground font-medium rounded-sm hover:bg-accent transition-colors"
            >
              {isEn ? "Back to Results" : language === "zh-TW" ? "返回結果總覽" : "返回结果总览"}
            </Link>
            <button 
              onClick={() => handleExportReport()}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm btn-mechanical hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isEn ? "Export Full Report" : language === "zh-TW" ? "匯出完整報告" : "导出完整报告"}
            </button>
            <Link
              to="/history"
              className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground font-medium rounded-sm hover:bg-accent transition-colors"
            >
              {isEn ? "View History" : language === "zh-TW" ? "查看歷史記錄" : "查看历史记录"}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}


