import { forwardRef } from "react";
import { Target, Zap, AlertTriangle } from "lucide-react";
import { DIMENSIONS, type AssessmentResult, getHighSensitivityAnchors } from "@/hooks/useAssessment";
import { useTranslation } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  results: AssessmentResult;
  className?: string;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  ({ results, className }, ref) => {
    const { language } = useTranslation();
    
    // Get dimension name in current language
    const getDimensionName = (dim: string) => {
      return DIMENSIONS[dim as keyof typeof DIMENSIONS]?.[language] || dim;
    };

    const highSensAnchors = results.highSensitivityAnchors?.length
      ? results.highSensitivityAnchors
      : getHighSensitivityAnchors(results.scores);
    const hasHighSens = highSensAnchors.length > 0;
    const displayAnchor = highSensAnchors[0] || results.mainAnchor || "";
    const displayAnchorName = getDimensionName(displayAnchor);

    // Multilingual texts
    const texts = {
      "zh-CN": {
        reportTitle: "职业锚测评报告",
        highSensAnchor: "高敏感锚",
        noHighSens: "无高敏感锚",

        scoreDistribution: "维度得分分布",
        riskIndex: "风险指数",
        stability: "稳定度",
        mature: "成熟稳定",
        developing: "发展中",
        unclear: "尚不清晰",
        conflictWarning: "冲突锚警示",
        footerText: "基于 Edgar Schein 职业锚理论",
      },
      "zh-TW": {
        reportTitle: "職業錨測評報告",
        highSensAnchor: "高敏感錨",
        noHighSens: "無高敏感錨",

        scoreDistribution: "維度得分分佈",
        riskIndex: "風險指數",
        stability: "穩定度",
        mature: "成熟穩定",
        developing: "發展中",
        unclear: "尚不清晰",
        conflictWarning: "衝突錨警示",
        footerText: "基於 Edgar Schein 職業錨理論",
      },
      "en": {
        reportTitle: "Career Anchor Report",
        highSensAnchor: "High-Sensitivity",
        noHighSens: "No High-Sensitivity Anchor",

        scoreDistribution: "Score Distribution",
        riskIndex: "Risk Index",
        stability: "Stability",
        mature: "Mature",
        developing: "Developing",
        unclear: "Unclear",
        conflictWarning: "Conflict Warning",
        footerText: "Based on Edgar Schein's Career Anchor Theory",
      },
    };

    const txt = texts[language];

    // Get top 4 scores for mini radar visualization
    const sortedScores = Object.entries(results.scores)
      .map(([key, score]) => ({
        key,
        name: getDimensionName(key),
        score,
        isHighSens: highSensAnchors.includes(key),
      }))
      .sort((a, b) => b.score - a.score);

    return (
      <div
        ref={ref}
        className={cn(
          "w-[400px] bg-background p-6 rounded-sm border border-border",
          className
        )}
        style={{
          fontFamily: "'Inter', 'Noto Sans SC', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              Career Anchor Report
            </div>
            <div className="text-xs text-muted-foreground">
              SCPC Assessment
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            {txt.reportTitle}
          </h2>
        </div>

        {/* High-Sensitivity Anchor */}
        <div className="bg-primary text-primary-foreground p-4 rounded-sm mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium opacity-80">
              {hasHighSens ? txt.highSensAnchor : txt.noHighSens}
            </span>
          </div>
          {hasHighSens ? (
            <div className="flex items-end justify-between">
              <span className="text-lg font-semibold">{displayAnchorName}</span>
              <span className="text-2xl font-bold tabular-nums">
                {results.scores[displayAnchor]}
              </span>
            </div>
          ) : (
            <div className="text-sm opacity-80">
              {language === "en" ? "Structural combination state" : language === "zh-TW" ? "結構性組合狀態" : "结构性组合状态"}
            </div>
          )}
        </div>

        {/* Score Distribution */}
        <div className="mb-4">
          <div className="text-xs font-medium text-muted-foreground mb-3">
            {txt.scoreDistribution}
          </div>
          <div className="space-y-2">
            {(() => {
              const maxScoreVal = sortedScores[0]?.score || 1;
              return sortedScores.slice(0, 5).map(({ key, name, score, isHighSens }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-muted-foreground truncate">
                    {name.substring(0, 4)}
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isHighSens ? "bg-primary" : "bg-muted-foreground/30"
                      )}
                      style={{ width: `${Math.min((score / maxScoreVal) * 100, 100)}%` }}
                    />
                  </div>
                  <div
                    className={cn(
                      "w-10 text-xs font-medium text-right tabular-nums",
                      isHighSens ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {score}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Risk Index */}
          <div className="p-3 bg-card border border-border rounded-sm">
            <div className="text-xs text-muted-foreground mb-1">{txt.riskIndex}</div>
            <div
              className={cn(
                "text-lg font-bold tabular-nums",
                (results.riskIndex ?? 0) < 40
                  ? "text-primary"
                  : (results.riskIndex ?? 0) < 60
                    ? "text-warning"
                    : "text-destructive"
              )}
            >
              {results.riskIndex ?? 0}
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>

          {/* Stability */}
          <div className="p-3 bg-card border border-border rounded-sm">
            <div className="text-xs text-muted-foreground mb-1">{txt.stability}</div>
            <div
              className={cn(
                "text-sm font-semibold",
                results.stability === "mature"
                  ? "text-primary"
                  : results.stability === "developing"
                    ? "text-warning"
                    : "text-muted-foreground"
              )}
            >
              {results.stability === "mature" && txt.mature}
              {results.stability === "developing" && txt.developing}
              {results.stability === "unclear" && txt.unclear}
            </div>
          </div>
        </div>

        {/* Conflict Warning (if exists) */}
        {results.conflictAnchors.length > 0 && (
          <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-sm mb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3 h-3 text-destructive" />
              <span className="text-xs font-medium text-destructive">
                {txt.conflictWarning}
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {results.conflictAnchors.map((anchor) => (
                <span
                  key={anchor}
                  className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-sm"
                >
                  {getDimensionName(anchor)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {txt.footerText}
          </div>
          <div className="text-xs font-medium text-primary">
            scpc.ai
          </div>
        </div>
      </div>
    );
  }
);

ShareCard.displayName = "ShareCard";

export default ShareCard;
