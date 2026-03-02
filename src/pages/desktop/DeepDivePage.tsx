import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Loader2,
  RefreshCw,
  Target,
  Zap,
  MessageCircle,
  Lightbulb,
  Shield,
  CheckCircle2,
  Eye,
  TrendingUp,
  Activity,
  Compass,
  Brain,
} from "lucide-react";
import { DIMENSIONS, type AssessmentResult } from "@/hooks/useAssessment";
import { DIMENSION_NAMES } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useLanguage";
import { useTestAuth, getWorkExperienceDescription, type LanguageKey } from "@/hooks/useTestAuth";
import { Button } from "@/components/ui/button";

// New 6-section Developmental Career Architecture Analysis
interface AIDeepDiveAnalysis {
  stageIdentification?: {
    stageCode: string;
    stageLabel: string;
    stageDefinition: string;
    stageImplication: string;
  };
  primaryAnchorInterpretation?: {
    coreMeaning: string;
    stageContext: string;
    ifAligned: string;
    ifMisaligned: string;
  };
  behavioralPatterns?: string[];
  tensionOrRiskSignals?: {
    type: string;
    signals: Array<{
      signal: string;
      interpretation: string;
      recommendation: string;
    }>;
    burnoutSignalPattern?: string;
    earlyWarnings?: string[];
    derailmentPattern?: string;
    decisionStyle?: string;
    powerOrientation?: string;
    riskPreference?: string;
    controlMode?: string;
    shadowSide?: string;
    organizationalImpact?: string;
    conflictExplanation?: string | null;
  };
  imbalancePatterns?: {
    overExpression: string;
    underExpression: string;
    stageSpecificRisk: string;
  };
  developmentRecommendations?: Array<{
    direction: string;
    rationale: string;
    action: string;
  }>;
  closingNote?: string;
  rawContent?: string;
  // Legacy fields for backward compatibility
  openingExplanation?: string;
  primaryAnchorExplanation?: {
    coreMeaning: string;
    ifPresent: string;
    ifAbsent: string;
    clarification: string;
  };
  conflictAnchorExplanation?: {
    acknowledgment: string;
    essence: string;
    reassurance: string;
    advice: string;
  } | null;
  practicalDirections?: string[];
}

export default function DeepDivePage() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  const getDimensionName = (dim: string) => {
    return DIMENSION_NAMES[dim as keyof typeof DIMENSION_NAMES]?.[language] || dim;
  };

  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIDeepDiveAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const texts = {
    "zh-CN": {
      title: "深度解读",
      subtitle: "AI 帮你真正理解自己的职业锚",
      loading: "正在生成个性化分析...",
      generateButton: "生成 AI 深度解读",
      refreshButton: "重新生成",
      errorText: "AI 分析暂时不可用，请稍后重试",
      loginHint: "登录后可获得 AI 个性化分析",
      stageSection: "你的职业阶段",
      primaryAnchor: "你的高敏感锚",
      behavioralSection: "行为特征",
      tensionSection: "张力与风险信号",
      imbalanceSection: "失衡模式",
      developmentSection: "发展建议",
      closingTitle: "写在最后",
      actionPlan: "查看行动建议",
      ifAligned: "如果当前环境支持这个锚点",
      ifMisaligned: "如果当前环境与这个锚点冲突",
      burnoutPattern: "倦怠信号模式",
      earlyWarnings: "早期预警信号",
      derailmentPattern: "职业偏离模式",
      overExpression: "过度表达",
      underExpression: "被压抑",
      stageRisk: "阶段性特有风险",
      conflictExplanation: "冲突锚分析",
      decisionStyle: "决策风格",
      powerOrientation: "权力使用模式",
      riskPreference: "风险偏好",
      controlMode: "控制模式",
      shadowSide: "阴影面",
      orgImpact: "对组织文化的影响",
    },
    "zh-TW": {
      title: "深度解讀",
      subtitle: "AI 幫你真正理解自己的職業錨",
      loading: "正在生成個性化分析...",
      generateButton: "生成 AI 深度解讀",
      refreshButton: "重新生成",
      errorText: "AI 分析暫時不可用，請稍後重試",
      loginHint: "登入後可獲得 AI 個性化分析",
      stageSection: "你的職業階段",
      primaryAnchor: "你的高敏感錨",
      behavioralSection: "行為特徵",
      tensionSection: "張力與風險信號",
      imbalanceSection: "失衡模式",
      developmentSection: "發展建議",
      closingTitle: "寫在最後",
      actionPlan: "查看行動建議",
      ifAligned: "如果當前環境支持這個錨點",
      ifMisaligned: "如果當前環境與這個錨點衝突",
      burnoutPattern: "倦怠信號模式",
      earlyWarnings: "早期預警信號",
      derailmentPattern: "職業偏離模式",
      overExpression: "過度表達",
      underExpression: "被壓抑",
      stageRisk: "階段性特有風險",
      conflictExplanation: "衝突錨分析",
      decisionStyle: "決策風格",
      powerOrientation: "權力使用模式",
      riskPreference: "風險偏好",
      controlMode: "控制模式",
      shadowSide: "陰影面",
      orgImpact: "對組織文化的影響",
    },
    "en": {
      title: "Deep Dive",
      subtitle: "AI helps you truly understand your career anchors",
      loading: "Generating personalized analysis...",
      generateButton: "Generate AI Deep Dive",
      refreshButton: "Regenerate",
      errorText: "AI analysis temporarily unavailable. Please try again later.",
      loginHint: "Log in to get AI personalized analysis",
      stageSection: "Your Career Stage",
      primaryAnchor: "Your High-Sensitivity Anchor",
      behavioralSection: "Behavioral Patterns",
      tensionSection: "Tension & Risk Signals",
      imbalanceSection: "Imbalance Patterns",
      developmentSection: "Development Recommendations",
      closingTitle: "Final note",
      actionPlan: "View Action Plan",
      ifAligned: "If current environment supports this anchor",
      ifMisaligned: "If current environment conflicts with this anchor",
      burnoutPattern: "Burnout Signal Pattern",
      earlyWarnings: "Early Warning Signs",
      derailmentPattern: "Derailment Pattern",
      overExpression: "Over-expression",
      underExpression: "Suppressed",
      stageRisk: "Stage-specific Risk",
      conflictExplanation: "Conflict Anchor Analysis",
      decisionStyle: "Decision-making Style",
      powerOrientation: "Power Orientation",
      riskPreference: "Risk Preference",
      controlMode: "Control Mode",
      shadowSide: "Shadow Side",
      orgImpact: "Organizational Culture Impact",
    },
  };

  const txt = texts[language];

  useEffect(() => {
    const stored = sessionStorage.getItem("assessmentResults");
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      setResults({
        scores: {
          TF: 82, GM: 45, AU: 75, SE: 35,
          EC: 68, SV: 55, CH: 70, LS: 48,
        },
        mainAnchor: "TF",
        highSensitivityAnchors: ["TF"],
        conflictAnchors: [["AU", "SE"]],
        salienceQuestionIds: ["Q001", "Q003", "Q021", "Q041", "Q061"],
        stability: "mature",
        interpretation: {
          TF: { level: "nonNegotiable", label: "不可妥协的长期约束", score: 82 },
          GM: { level: "conditional", label: "条件性约束", score: 45 },
          AU: { level: "highSensitive", label: "高敏感约束", score: 75 },
          SE: { level: "nonCore", label: "非核心维度", score: 35 },
          EC: { level: "highSensitive", label: "高敏感约束", score: 68 },
          SV: { level: "conditional", label: "条件性约束", score: 55 },
          CH: { level: "highSensitive", label: "高敏感约束", score: 70 },
          LS: { level: "conditional", label: "条件性约束", score: 48 },
        },
      });
    }
  }, []);

  useEffect(() => {
    if (results && user && !hasLoadedOnce) {
      fetchAIAnalysis();
    }
  }, [results, user]);

  const fetchAIAnalysis = async () => {
    if (!results) return;

    setIsLoadingAI(true);
    setAiError(null);

    try {
      const { workYears, isExecutive, isEntrepreneur } = useTestAuth.getState();
      const workExpDesc = getWorkExperienceDescription(workYears, isExecutive, isEntrepreneur, language as LanguageKey);
      const { data, error } = await supabase.functions.invoke("personalized-analysis", {
        body: {
          result: results,
          analysisType: "deep_dive",
          language: language,
          workExpDescription: workExpDesc,
          workYears: workYears,
          isExecutive: isExecutive,
          isEntrepreneur: isEntrepreneur,
        },
      });

      if (error) throw error;

      if (data?.analysis) {
        setAiAnalysis(data.analysis);
        setHasLoadedOnce(true);
      }
    } catch (error) {
      console.error("AI analysis error:", error);
      setAiError(txt.errorText);
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (!results) return null;

  // Use high-sensitivity anchors if available, otherwise fallback to mainAnchor
  const highSensAnchors = results.highSensitivityAnchors?.length
    ? results.highSensitivityAnchors
    : (results.scores ? Object.entries(results.scores).filter(([, s]) => s > 80).sort(([, a], [, b]) => b - a).map(([d]) => d) : []);
  const displayAnchor = highSensAnchors[0] || results.mainAnchor || "TF";
  const mainAnchorName = getDimensionName(displayAnchor);

  // Detect if response is new 6-section format or legacy
  const isNewFormat = aiAnalysis?.stageIdentification || aiAnalysis?.primaryAnchorInterpretation;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const motionProps = prefersReducedMotion
    ? {}
    : { initial: "hidden", animate: "visible" };

  // Determine tension section type
  const tensionType = aiAnalysis?.tensionOrRiskSignals?.type;
  const isStructuralRisk = tensionType === "structural_risk";
  const isArchitectureAnalysis = tensionType === "architecture_analysis";

  return (
    <div className="min-h-screen pb-24" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {/* Header */}
      <motion.section
        className="py-8 sm:py-16 px-4 sm:px-6 border-b border-border"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 data-label text-primary mb-3 sm:mb-4">
            <Sparkles className="w-4 h-4" />
            {txt.title}
          </div>
          <h1 className="font-display text-xl sm:text-3xl md:text-4xl text-foreground mb-4">
            {txt.subtitle}
          </h1>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Loading State */}
          {isLoadingAI && (
            <motion.div
              className="flex flex-col items-center justify-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="p-4 rounded-full bg-primary/10 mb-4">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground">{txt.loading}</p>
            </motion.div>
          )}

          {/* Error State */}
          {aiError && !isLoadingAI && (
            <motion.div
              className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <p className="text-destructive font-medium">{aiError}</p>
              </div>
              <Button onClick={fetchAIAnalysis} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {txt.refreshButton}
              </Button>
            </motion.div>
          )}

          {/* Not logged in */}
          {!user && !isLoadingAI && (
            <motion.div
              className="p-8 bg-muted/50 border border-border rounded-lg text-center mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">{txt.loginHint}</p>
              <Link to="/auth">
                <Button>{isEn ? "Log In" : "登录"}</Button>
              </Link>
            </motion.div>
          )}

          {/* Generate Button */}
          {user && !aiAnalysis && !isLoadingAI && !aiError && (
            <motion.div
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button onClick={fetchAIAnalysis} size="lg" className="gap-2">
                <Sparkles className="w-5 h-5" />
                {txt.generateButton}
              </Button>
            </motion.div>
          )}

          {/* AI Analysis — New 6-Section Format */}
          {aiAnalysis && !isLoadingAI && isNewFormat && (
            <motion.div
              className="space-y-8"
              variants={prefersReducedMotion ? undefined : containerVariants}
              {...motionProps}
            >
              {/* Section 1: Stage Identification */}
              {aiAnalysis.stageIdentification && (
                <motion.div
                  className="p-5 sm:p-6 bg-primary/5 border border-primary/20 rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Compass className="w-5 h-5 text-primary" />
                    <span className="data-label text-primary">{txt.stageSection}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {aiAnalysis.stageIdentification.stageLabel}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {aiAnalysis.stageIdentification.stageDefinition}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {aiAnalysis.stageIdentification.stageImplication}
                  </p>
                </motion.div>
              )}

              {/* Section 2: Primary Anchor Interpretation */}
              {aiAnalysis.primaryAnchorInterpretation && (
                <motion.div
                  className="p-4 sm:p-6 bg-primary text-primary-foreground rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Target className="w-5 h-5" />
                    <span className="text-sm font-medium text-primary-foreground/70">
                      {txt.primaryAnchor}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">
                    {mainAnchorName}
                  </h2>

                  <p className="text-base sm:text-lg font-medium mb-3">
                    {aiAnalysis.primaryAnchorInterpretation.coreMeaning}
                  </p>

                  {aiAnalysis.primaryAnchorInterpretation.stageContext && (
                    <p className="text-sm text-primary-foreground/80 mb-4 sm:mb-6 leading-relaxed">
                      {aiAnalysis.primaryAnchorInterpretation.stageContext}
                    </p>
                  )}

                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-4 rounded-lg bg-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground/70" />
                        <span className="text-xs font-medium text-primary-foreground/60">
                          {txt.ifAligned}
                        </span>
                      </div>
                      <p className="text-sm text-primary-foreground/90">
                        {aiAnalysis.primaryAnchorInterpretation.ifAligned}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-primary-foreground/70" />
                        <span className="text-xs font-medium text-primary-foreground/60">
                          {txt.ifMisaligned}
                        </span>
                      </div>
                      <p className="text-sm text-primary-foreground/90">
                        {aiAnalysis.primaryAnchorInterpretation.ifMisaligned}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Section 3: Behavioral Patterns */}
              {aiAnalysis.behavioralPatterns && aiAnalysis.behavioralPatterns.length > 0 && (
                <motion.div
                  className="p-5 sm:p-6 bg-muted/30 border border-border rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-foreground/70" />
                    <span className="data-label">{txt.behavioralSection}</span>
                  </div>
                  <div className="grid gap-3">
                    {aiAnalysis.behavioralPatterns.map((pattern, index) => (
                      <div
                        key={index}
                        className="flex gap-3 p-3 bg-background border border-border rounded-lg"
                      >
                        <div className="w-6 h-6 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {index + 1}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed flex-1">
                          {pattern}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Section 4: Tension / Risk Signals */}
              {aiAnalysis.tensionOrRiskSignals && (
                <motion.div
                  className={`p-5 sm:p-6 rounded-lg border-l-4 ${
                    isStructuralRisk
                      ? "bg-destructive/5 border-destructive/50"
                      : isArchitectureAnalysis
                      ? "bg-primary/5 border-primary/50"
                      : "bg-warning/10 border-warning"
                  }`}
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className={`w-5 h-5 ${
                      isStructuralRisk ? "text-destructive" : isArchitectureAnalysis ? "text-primary" : "text-warning"
                    }`} />
                    <span className={`data-label ${
                      isStructuralRisk ? "text-destructive" : isArchitectureAnalysis ? "text-primary" : "text-warning"
                    }`}>
                      {txt.tensionSection}
                    </span>
                  </div>

                  {/* Signals */}
                  {aiAnalysis.tensionOrRiskSignals.signals?.map((signalItem, index) => (
                    <div key={index} className="mb-4 p-4 bg-background border border-border rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">
                        {signalItem.signal}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {signalItem.interpretation}
                      </p>
                      <p className="text-sm text-primary font-medium">
                        {signalItem.recommendation}
                      </p>
                    </div>
                  ))}

                  {/* Conflict Explanation */}
                  {aiAnalysis.tensionOrRiskSignals.conflictExplanation && (
                    <div className="mb-4 p-4 bg-warning/5 border border-warning/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-warning" />
                        <span className="text-xs font-medium text-warning">{txt.conflictExplanation}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {aiAnalysis.tensionOrRiskSignals.conflictExplanation}
                      </p>
                    </div>
                  )}

                  {/* Stage C: Burnout / Early Warning / Derailment */}
                  {isStructuralRisk && (
                    <div className="space-y-4 mt-4">
                      {aiAnalysis.tensionOrRiskSignals.burnoutSignalPattern && (
                        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                          <span className="text-xs font-medium text-destructive block mb-2">
                            {txt.burnoutPattern}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">
                            {aiAnalysis.tensionOrRiskSignals.burnoutSignalPattern}
                          </p>
                        </div>
                      )}
                      {aiAnalysis.tensionOrRiskSignals.earlyWarnings && aiAnalysis.tensionOrRiskSignals.earlyWarnings.length > 0 && (
                        <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                          <span className="text-xs font-medium text-warning block mb-2">
                            {txt.earlyWarnings}
                          </span>
                          <ul className="space-y-2">
                            {aiAnalysis.tensionOrRiskSignals.earlyWarnings.map((warning, warningIndex) => (
                              <li key={warningIndex} className="flex gap-2 text-sm text-foreground">
                                <span className="text-warning mt-0.5">•</span>
                                <span>{warning}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiAnalysis.tensionOrRiskSignals.derailmentPattern && (
                        <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                          <span className="text-xs font-medium text-destructive block mb-2">
                            {txt.derailmentPattern}
                          </span>
                          <p className="text-sm text-foreground leading-relaxed">
                            {aiAnalysis.tensionOrRiskSignals.derailmentPattern}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage D: Executive Architecture Analysis */}
                  {isArchitectureAnalysis && (
                    <div className="grid gap-3 mt-4">
                      {[
                        { key: "decisionStyle", label: txt.decisionStyle, icon: Brain },
                        { key: "powerOrientation", label: txt.powerOrientation, icon: Zap },
                        { key: "riskPreference", label: txt.riskPreference, icon: Activity },
                        { key: "controlMode", label: txt.controlMode, icon: Shield },
                        { key: "shadowSide", label: txt.shadowSide, icon: AlertTriangle },
                        { key: "organizationalImpact", label: txt.orgImpact, icon: TrendingUp },
                      ].map(({ key, label, icon: Icon }) => {
                        const value = aiAnalysis.tensionOrRiskSignals?.[key as keyof typeof aiAnalysis.tensionOrRiskSignals];
                        if (!value || typeof value !== "string") return null;
                        return (
                          <div key={key} className="p-4 bg-background border border-border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className="w-4 h-4 text-primary/60" />
                              <span className="text-xs font-medium text-muted-foreground">{label}</span>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">{value}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Section 5: Imbalance Patterns */}
              {aiAnalysis.imbalancePatterns && (
                <motion.div
                  className="p-5 sm:p-6 bg-muted/30 border border-border rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-foreground/70" />
                    <span className="data-label">{txt.imbalanceSection}</span>
                  </div>
                  <div className="grid gap-3">
                    {aiAnalysis.imbalancePatterns.overExpression && (
                      <div className="p-4 bg-background border border-border rounded-lg">
                        <span className="text-xs font-medium text-warning block mb-2">
                          {txt.overExpression}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">
                          {aiAnalysis.imbalancePatterns.overExpression}
                        </p>
                      </div>
                    )}
                    {aiAnalysis.imbalancePatterns.underExpression && (
                      <div className="p-4 bg-background border border-border rounded-lg">
                        <span className="text-xs font-medium text-muted-foreground block mb-2">
                          {txt.underExpression}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">
                          {aiAnalysis.imbalancePatterns.underExpression}
                        </p>
                      </div>
                    )}
                    {aiAnalysis.imbalancePatterns.stageSpecificRisk && (
                      <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                        <span className="text-xs font-medium text-destructive block mb-2">
                          {txt.stageRisk}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">
                          {aiAnalysis.imbalancePatterns.stageSpecificRisk}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Section 6: Development Recommendations */}
              {aiAnalysis.developmentRecommendations && aiAnalysis.developmentRecommendations.length > 0 && (
                <motion.div
                  className="p-5 sm:p-6 bg-primary/5 border border-primary/20 rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <span className="data-label text-primary">{txt.developmentSection}</span>
                  </div>
                  <div className="grid gap-4">
                    {aiAnalysis.developmentRecommendations.map((rec, index) => (
                      <div
                        key={index}
                        className="p-4 bg-background border border-border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl font-display text-primary leading-none">
                            {String(index + 1).padStart(2, "0")}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-foreground mb-1">
                              {rec.direction}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {rec.rationale}
                            </p>
                            <p className="text-sm text-primary font-medium">
                              {rec.action}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Closing Note */}
              {aiAnalysis.closingNote && (
                <motion.div
                  className="p-5 sm:p-6 bg-muted/50 border border-border rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="data-label mb-2">{txt.closingTitle}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {aiAnalysis.closingNote}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Refresh + Action Plan */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4"
                variants={prefersReducedMotion ? undefined : itemVariants}
              >
                <Button
                  variant="outline"
                  onClick={fetchAIAnalysis}
                  disabled={isLoadingAI}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {txt.refreshButton}
                </Button>

                <Link
                  to="/action-plan"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors group"
                >
                  {txt.actionPlan}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* Legacy format fallback */}
          {aiAnalysis && !isLoadingAI && !isNewFormat && (
            <motion.div
              className="space-y-8"
              variants={prefersReducedMotion ? undefined : containerVariants}
              {...motionProps}
            >
              {aiAnalysis.openingExplanation && (
                <motion.div
                  className="p-6 bg-primary/5 border border-primary/20 rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground leading-relaxed">
                      {aiAnalysis.openingExplanation}
                    </p>
                  </div>
                </motion.div>
              )}

              {aiAnalysis.primaryAnchorExplanation && (
                <motion.div
                  className="p-4 sm:p-6 bg-primary text-primary-foreground rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Target className="w-5 h-5" />
                    <span className="text-sm font-medium text-primary-foreground/70">
                      {txt.primaryAnchor}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">{mainAnchorName}</h2>
                  <p className="text-base sm:text-lg font-medium mb-4 sm:mb-6">
                    {aiAnalysis.primaryAnchorExplanation.coreMeaning}
                  </p>
                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    <div className="p-4 rounded-lg bg-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-primary-foreground/70" />
                        <span className="text-xs font-medium text-primary-foreground/60">
                          {txt.ifAligned}
                        </span>
                      </div>
                      <p className="text-sm text-primary-foreground/90">
                        {aiAnalysis.primaryAnchorExplanation.ifPresent}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-primary-foreground/70" />
                        <span className="text-xs font-medium text-primary-foreground/60">
                          {txt.ifMisaligned}
                        </span>
                      </div>
                      <p className="text-sm text-primary-foreground/90">
                        {aiAnalysis.primaryAnchorExplanation.ifAbsent}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-primary-foreground/60 italic">
                    {aiAnalysis.primaryAnchorExplanation.clarification}
                  </p>
                </motion.div>
              )}

              {aiAnalysis.practicalDirections && aiAnalysis.practicalDirections.length > 0 && (
                <motion.div
                  className="p-6 bg-primary/5 border border-primary/20 rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <span className="data-label text-primary">{txt.developmentSection}</span>
                  </div>
                  <div className="grid gap-4">
                    {aiAnalysis.practicalDirections.map((direction, index) => (
                      <div
                        key={index}
                        className="flex gap-4 p-4 bg-background border border-border rounded-lg"
                      >
                        <div className="text-2xl font-display text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed flex-1">
                          {direction}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {aiAnalysis.closingNote && (
                <motion.div
                  className="p-6 bg-muted/50 border border-border rounded-lg"
                  variants={prefersReducedMotion ? undefined : itemVariants}
                >
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="data-label mb-2">{txt.closingTitle}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {aiAnalysis.closingNote}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4"
                variants={prefersReducedMotion ? undefined : itemVariants}
              >
                <Button
                  variant="outline"
                  onClick={fetchAIAnalysis}
                  disabled={isLoadingAI}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {txt.refreshButton}
                </Button>
                <Link
                  to="/action-plan"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors group"
                >
                  {txt.actionPlan}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>
          )}

          {/* Raw content fallback */}
          {aiAnalysis && !isLoadingAI && aiAnalysis.rawContent && !isNewFormat && !aiAnalysis.openingExplanation && !aiAnalysis.primaryAnchorExplanation && (
            <motion.div
              className="p-6 bg-muted/50 border border-border rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {aiAnalysis.rawContent}
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
