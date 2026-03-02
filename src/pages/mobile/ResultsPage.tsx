import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Target, Zap, AlertTriangle, Share2, ChevronRight, Download } from "lucide-react";
import { DIMENSIONS, type AssessmentResult, getHighSensitivityAnchors } from "@/hooks/useAssessment";
import ShareDialog from "@/components/desktop/ShareDialog";
import { useTranslation } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

export default function MobileResultsPage() {
  const navigate = useNavigate();
  const { language, t } = useTranslation();
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [hasIdealCards, setHasIdealCards] = useState(false);

  // Helper to get localized dimension name
  const getDimensionName = (dim: string) => {
    return DIMENSIONS[dim as keyof typeof DIMENSIONS]?.[language] || dim;
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("assessmentResults");
    const idealCards = sessionStorage.getItem("idealCardResults");
    setHasIdealCards(!!idealCards && idealCards !== "[]");
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      // Demo data for preview (standardized 0-100)
      setResults({
        scores: {
          TF: 82,
          GM: 45,
          AU: 75,
          SE: 35,
          EC: 68,
          SV: 55,
          CH: 70,
          LS: 48,
        },
        mainAnchor: "TF",
        highSensitivityAnchors: ["TF"],
        conflictAnchors: ["AU", "SE"],
        riskIndex: 42,
        stability: "mature",
      });
    }
  }, []);

  if (!results) return null;

  // High-sensitivity anchors
  const highSensAnchors = results.highSensitivityAnchors?.length
    ? results.highSensitivityAnchors
    : getHighSensitivityAnchors(results.scores);
  const hasHighSensitivity = highSensAnchors.length > 0;
  const primaryDisplayAnchor = highSensAnchors[0] || results.mainAnchor || "TF";
  const primaryDisplayName = getDimensionName(primaryDisplayAnchor);

  // Sort scores for display
  const sortedScores = Object.entries(results.scores)
    .map(([key, score]) => ({
      key,
      name: getDimensionName(key),
      score,
      isHighSens: highSensAnchors.includes(key),
    }))
    .sort((a, b) => b.score - a.score);

  // Stability text
  const getStabilityText = () => {
    if (language === "en") {
      if (results.stability === "mature") return "Stable";
      if (results.stability === "developing") return "Developing";
      return "Unclear";
    }
    if (language === "zh-TW") {
      if (results.stability === "mature") return "成熟穩定";
      if (results.stability === "developing") return "發展中";
      return "尚不清晰";
    }
    if (results.stability === "mature") return "成熟稳定";
    if (results.stability === "developing") return "发展中";
    return "尚不清晰";
  };

  return (
    <div className="min-h-screen bg-background pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <motion.section
        className="px-5 pt-8 pb-6 bg-primary text-primary-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-xs font-semibold tracking-wider uppercase opacity-70 mb-2">
          {language === "en" ? "Assessment Complete" : language === "zh-TW" ? "測評完成" : "测评完成"}
        </div>
        <h1 className="text-xl font-bold mb-2">
          {language === "en" ? "Your Career Anchor Report" : language === "zh-TW" ? "你的職業錨報告" : "你的职业锚报告"}
        </h1>
        <p className="text-sm opacity-80">
          {language === "en" 
            ? "Based on your responses, we've identified your core career drivers" 
            : language === "zh-TW" ? "基於你的回答，識別出你的核心職業驅動力"
            : "基于你的回答，识别出你的核心职业驱动力"}
        </p>
      </motion.section>

      {/* Main Anchor Card */}
      <section className="px-5 -mt-4 relative z-10">
        <motion.div
          className="bg-card rounded-xl border border-border p-5 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {hasHighSensitivity
                ? (highSensAnchors.length > 1
                  ? (language === "en" ? "Multiple High-Sensitivity Anchors" : language === "zh-TW" ? "多重高敏感錨" : "多重高敏感锚")
                  : (language === "en" ? "High-Sensitivity Anchor" : language === "zh-TW" ? "高敏感錨" : "高敏感锚"))
                : (language === "en" ? "No High-Sensitivity Anchor" : language === "zh-TW" ? "當前無高敏感錨" : "当前无高敏感锚")}
            </span>
          </div>

          {hasHighSensitivity ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {primaryDisplayName}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {getAnchorDescription(primaryDisplayAnchor, language)}
              </p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold" style={{ color: "hsl(75, 55%, 45%)" }}>
                  {results.scores[primaryDisplayAnchor]}
                </span>
              </div>
              {highSensAnchors.length > 1 && (
                <div className="mt-3 pt-3 border-t border-border">
                  {highSensAnchors.slice(1).map(anchor => (
                    <div key={anchor} className="flex items-center justify-between py-1">
                      <span className="text-sm font-medium text-foreground">{getDimensionName(anchor)}</span>
                      <span className="text-lg font-bold" style={{ color: "hsl(75, 55%, 45%)" }}>{results.scores[anchor]}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {language === "en"
                ? "No anchor scored above 80. Your career drivers form a balanced structural combination."
                : language === "zh-TW"
                ? "目前沒有任何錨點得分超過80分。你的職業驅動力呈現結構性組合狀態。"
                : "目前没有任何锚点得分超过80分。你的职业驱动力呈现结构性组合状态。"}
            </p>
          )}
        </motion.div>
      </section>

      {/* Score Distribution */}
      <motion.section
        className="px-5 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">
          {language === "en" ? "8-Dimension Score Distribution" : language === "zh-TW" ? "8維度得分分佈" : "8维度得分分布"}
        </h3>
        <div className="space-y-3">
          {(() => {
            const maxScoreValue = sortedScores[0]?.score || 1;
            return sortedScores.map(({ key, name, score, isHighSens }, index) => (
              <motion.div
                key={key}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <div className="w-20 text-sm text-muted-foreground truncate">
                  {language === "en" ? name : name.substring(0, 4)}
                </div>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      isHighSens
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((score / maxScoreValue) * 100, 100)}%` }}
                    transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                  />
                </div>
                <div
                  className={cn(
                    "w-10 text-sm font-medium text-right tabular-nums",
                    isHighSens
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {score}
                </div>
              </motion.div>
            ));
          })()}
        </div>
      </motion.section>

      {/* Metrics */}
      <motion.section
        className="px-5 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <div className="grid grid-cols-2 gap-3">
          {/* Risk Index */}
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-xs text-muted-foreground mb-2">
              {language === "en" ? "Risk Index" : language === "zh-TW" ? "風險指數" : "风险指数"}
            </div>
            <div className="flex items-end gap-1">
              <span
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  results.riskIndex < 40
                    ? "text-primary"
                    : results.riskIndex < 60
                      ? "text-warning"
                      : "text-destructive"
                )}
              >
                {results.riskIndex}
              </span>
              <span className="text-xs text-muted-foreground mb-1">/100</span>
            </div>
            <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  results.riskIndex < 40
                    ? "bg-primary"
                    : results.riskIndex < 60
                      ? "bg-warning"
                      : "bg-destructive"
                )}
                style={{ width: `${results.riskIndex}%` }}
              />
            </div>
          </div>

          {/* Stability */}
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="text-xs text-muted-foreground mb-2">
              {language === "en" ? "Stability" : language === "zh-TW" ? "穩定度" : "稳定度"}
            </div>
            <div
              className={cn(
                "text-lg font-semibold",
                results.stability === "mature"
                  ? "text-primary"
                  : results.stability === "developing"
                    ? "text-warning"
                    : "text-muted-foreground"
              )}
            >
              {getStabilityText()}
            </div>
          </div>
        </div>
      </motion.section>

      {/* Conflict Warning */}
      {results.conflictAnchors.length > 0 && (
        <motion.section
          className="px-5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs font-semibold text-destructive uppercase tracking-wider">
                {language === "en" ? "Conflict Warning" : language === "zh-TW" ? "衝突錨警示" : "冲突锚警示"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {language === "en" 
                ? "These dimensions have internal tension that may cause career burnout"
                : language === "zh-TW" ? "以下維度存在內在張力，可能導致職業內耗"
                : "以下维度存在内在张力，可能导致职业内耗"}
            </p>
            <div className="flex flex-wrap gap-2">
              {results.conflictAnchors.map((anchor) => (
                <span
                  key={anchor}
                  className="px-2.5 py-1 bg-destructive/10 text-destructive text-xs font-medium rounded-lg"
                >
                  {getDimensionName(anchor)}
                </span>
              ))}
            </div>
          </div>
        </motion.section>
      )}

      {/* Action Links */}
      <motion.section
        className="px-5 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Link
          to="/deep-dive"
          className="flex items-center justify-between p-4 bg-card rounded-xl border border-border mb-3"
        >
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {language === "en" ? "Deep Dive" : language === "zh-TW" ? "深度解讀" : "深度解读"}
            </div>
            <div className="font-medium text-foreground">
              {language === "en" ? "View Full Analysis Report" : language === "zh-TW" ? "檢視完整分析報告" : "查看完整分析报告"}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>

        <Link
          to="/action-plan"
          className="flex items-center justify-between p-4 bg-card rounded-xl border border-border"
        >
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              {language === "en" ? "Action Plan" : language === "zh-TW" ? "行動建議" : "行动建议"}
            </div>
            <div className="font-medium text-foreground">
              {language === "en" ? "Get Actionable Next Steps" : language === "zh-TW" ? "獲取可執行的下一步" : "获取可执行的下一步"}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </Link>

        {hasIdealCards && (
          <Link
            to="/comprehensive-report"
            className="flex items-center justify-between p-4 bg-card rounded-xl border border-border mt-3"
          >
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                {language === "en" ? "Complete Report" : language === "zh-TW" ? "完整報告" : "完整报告"}
              </div>
              <div className="font-medium text-foreground flex items-center gap-2">
                <Download className="w-4 h-4" />
                {language === "en" ? "View & Download Full Report" : language === "zh-TW" ? "檢視並下載綜合分析報告" : "查看并下载综合分析报告"}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        )}
      </motion.section>

      {/* Share Button */}
      <motion.section
        className="px-5 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <ShareDialog
          results={results}
          trigger={
            <button className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-semibold rounded-xl transition-all active:scale-[0.98]">
              <Share2 className="w-4 h-4" />
              {language === "en" ? "Share My Report" : language === "zh-TW" ? "分享我的報告" : "分享我的报告"}
            </button>
          }
        />
      </motion.section>

      {/* New Assessment */}
      <div className="px-5 mt-4 pb-8">
        <Link
          to="/assessment"
          className="block text-center text-sm text-primary font-medium py-3"
        >
          {language === "en" ? "Retake Assessment" : language === "zh-TW" ? "重新測評" : "重新测评"}
        </Link>
      </div>
    </div>
  );
}

function getAnchorDescription(anchor: string, language: string): string {
  const descriptionsZh: Record<string, string> = {
    TF: "你追求在特定专业领域达到卓越水平。专业身份是你职业满足感的核心来源。",
    GM: "你渴望整合资源、协调团队、为整体结果负责。组织层级的晋升是你的核心驱动力。",
    AU: "你需要按照自己的方式和节奏工作。组织的规则和他人的控制会让你感到窒息。",
    SE: "稳定、可预测、有保障是你职业选择的优先考虑。你愿意为长期安全感牺牲短期机会。",
    EC: "你有强烈的冲动去创建属于自己的事业。从无到有创造新价值是你的核心需求。",
    SV: "你的工作必须与核心价值观一致，能够帮助他人或对社会产生积极影响。",
    CH: "你被看似不可能完成的任务所激励。击败对手、克服障碍是你的核心驱动力。",
    LS: "你追求工作与生活的整合与平衡。职业必须服务于你理想的整体生活方式。",
  };

  const descriptionsZhTW: Record<string, string> = {
    TF: "你追求在特定專業領域達到卓越水平。專業身份是你職業滿足感的核心來源。",
    GM: "你渴望整合資源、協調團隊、為整體結果負責。組織層級的晉升是你的核心驅動力。",
    AU: "你需要按照自己的方式和節奏工作。組織的規則和他人的控制會讓你感到窒息。",
    SE: "穩定、可預測、有保障是你職業選擇的優先考慮。你願意為長期安全感犧牲短期機會。",
    EC: "你有強烈的衝動去創建屬於自己的事業。從無到有創造新價值是你的核心需求。",
    SV: "你的工作必須與核心價值觀一致，能夠幫助他人或對社會產生積極影響。",
    CH: "你被看似不可能完成的任務所激勵。擊敗對手、克服障礙是你的核心驅動力。",
    LS: "你追求工作與生活的整合與平衡。職業必須服務於你理想的整體生活方式。",
  };
  
  const descriptionsEn: Record<string, string> = {
    TF: "You strive for excellence in a specific professional field. Your professional identity is the core source of your career satisfaction.",
    GM: "You desire to integrate resources, coordinate teams, and take responsibility for overall results. Organizational advancement is your core driver.",
    AU: "You need to work in your own way and at your own pace. Organizational rules and others' control feel suffocating to you.",
    SE: "Stability, predictability, and security are your top priorities in career choices. You're willing to sacrifice short-term opportunities for long-term security.",
    EC: "You have a strong urge to build something of your own. Creating new value from scratch is your core need.",
    SV: "Your work must align with your core values and positively impact others or society.",
    CH: "You're motivated by seemingly impossible challenges. Overcoming obstacles and defeating competitors is your core driver.",
    LS: "You pursue integration and balance between work and life. Your career must serve your ideal overall lifestyle.",
  };
  
  if (language === "en") {
    return descriptionsEn[anchor] || "";
  }
  if (language === "zh-TW") {
    return descriptionsZhTW[anchor] || "";
  }
  return descriptionsZh[anchor] || "";
}
