import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, AlertTriangle, Target, Zap, Shield, AlertCircle, Lightbulb, Compass, MessageCircle, Download, Loader2 } from "lucide-react";
import RadarChart from "@/components/desktop/RadarChart";

import { DIMENSIONS, type AssessmentResult, SCORE_INTERPRETATION, getCoreAdvantageAnchors } from "@/hooks/useAssessment";
import { DIMENSION_NAMES } from "@/data/questions";
import { useTranslation } from "@/hooks/useLanguage";
import { cn, resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";
import { useTestAuth, getWorkExperienceDescription, type LanguageKey } from "@/hooks/useTestAuth";
import { downloadV3ReportAsPdf } from "@/lib/reportV3Download";
import type { LangKey } from "@/lib/reportDataFetcher";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function ResultsOverviewPage() {
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { workYears, isExecutive, isEntrepreneur, careerStage } = useTestAuth();
  const { user, profile } = useAuth();
  const location = useLocation();
  const isFromHistory = !!(location.state as { fromHistory?: boolean })?.fromHistory;
  const workExpDescription = getWorkExperienceDescription(workYears, isExecutive, isEntrepreneur, language as LanguageKey);
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [downloadingV3, setDownloadingV3] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("assessmentResults");
    if (stored) {
      setResults(JSON.parse(stored));
    } else {
      navigate("/");
    }
  }, [navigate]);

  if (!results) return null;

  // Get dimension name in current language
  const getDimensionName = (dim: string) => {
    return DIMENSION_NAMES[dim as keyof typeof DIMENSION_NAMES]?.[language] || dim;
  };

  // Core advantage anchors (score >= 80)
  const coreAdvAnchors = results.coreAdvantageAnchors?.length
    ? results.coreAdvantageAnchors
    : getCoreAdvantageAnchors(results.scores);
  const hasCoreAdvantage = coreAdvAnchors.length > 0;
  const isMultipleCoreAdv = coreAdvAnchors.length > 1;
  // For display: use first core advantage anchor, or top-scoring anchor as fallback
  const primaryDisplayAnchor = coreAdvAnchors[0] || results.mainAnchor || null;
  const primaryDisplayName = primaryDisplayAnchor ? getDimensionName(primaryDisplayAnchor) : null;

  // Score level colors
  const getLevelColor = (level: string) => {
    switch (level) {
      case "coreAdvantage": return { bg: "hsl(0, 70%, 94%)", text: "hsl(0, 70%, 40%)", border: "hsl(0, 70%, 80%)" };
      case "highSensitive": return { bg: "hsl(35, 90%, 94%)", text: "hsl(35, 90%, 35%)", border: "hsl(35, 90%, 80%)" };
      case "moderate": return { bg: "hsl(210, 50%, 94%)", text: "hsl(210, 50%, 40%)", border: "hsl(210, 50%, 80%)" };
      case "nonCore": return { bg: "hsl(0, 0%, 95%)", text: "hsl(0, 0%, 50%)", border: "hsl(0, 0%, 85%)" };
      default: return { bg: "hsl(0, 0%, 95%)", text: "hsl(0, 0%, 50%)", border: "hsl(0, 0%, 85%)" };
    }
  };

  // User-friendly score interpretation
  const getScoreUserLanguage = (score: number) => {
    if (language === "en") {
      if (score >= 80) return "Very hard to compromise long-term";
      if (score >= 65) return "High-sensitivity anchor, sustainable development";
      if (score >= 45) return "Matters to you, but not a bottom line";
      return "Not your main decision factor";
    } else if (language === "zh-TW") {
      if (score >= 80) return "很難長期妥協";
      if (score >= 65) return "高敏感錨點，可持續發展";
      if (score >= 45) return "有意義，但不是底線";
      return "不是做選擇時最在意的點";
    }
    // zh-CN
    if (score >= 80) return "很难长期妥协";
    if (score >= 65) return "高敏感锚点，可持续发展";
    if (score >= 45) return "有意义，但不是底线";
    return "不是做选择时最在意的点";
  };

  // Multilingual texts - User-friendly language (SCPC compliant)
  const texts = {
    "zh-CN": {
      resultsLabel: "你的职业锚评测结果",
      title: "探索你最值得坚持与发展的\n职涯核心需求",
      // Opening explanation
      openingTitle: "这个结果代表什么？",
      openingText: "这不是能力测评，也不是性格测试。你的分数不代表你强或弱，而代表：在长期职业选择中，哪些条件如果反复被忽视，你会逐渐痛苦、消耗，甚至离开。",
      scoreHighMeaning: "分数高 = 对你很重要",
      scoreLowMeaning: "分数低 = 对你不是核心驱动力（不是缺点）",
      // Radar guide
      radarTitle: "如何看这张图？",
      radarGuide: "这张图不是在比较你像谁，而是在显示：不同职业需求对你来说，「有多不可妥协」。越接近外圈，代表越难被牺牲；越靠近中心，代表你对此相对灵活。",
      // Main anchor
      coreAdvAnchor: "您的核心优势锚点",
      multiCoreAdv: "多重核心优势锚点",
      noCoreAdv: "当前无核心优势锚点",
      noCoreAdvAdvice: "建议关注高分锚点结构组合。",
      coreAdvIntro: "对你来说，真正重要的是——",
      coreAdvNote: "最不愿放弃的自我概念中的核心要素。",
      ifPresent: "如果这个条件长期存在",
      ifAbsent: "如果这个条件长期不存在",
      // Conflict
      conflictLabel: "需要留意的拉扯",
      conflictAcknowledge: "很多认真思考职业的人，都会有这种拉扯。",
      conflictEssence: "你同时在意两种长期很难同时满足的东西。",
      conflictReassurance: "这不是你不够好，而是任何人长期这样都会内耗。",
      conflictAdvice: "未来你可能需要特别留意：在关键选择时，不要假设「两边都能长期兼顾」。",
      // Practical directions
      directionsTitle: "你可以怎么用这个结果",
      direction1: "在做重要选择前，先问自己：「这个选择，会不会长期踩到我的高分项？」",
      direction2: "当你感到持续疲惫或抗拒时：不是马上怀疑自己能力，而是回头看看，是不是某个核心需求被忽视了。",
      direction3: "把这个结果当作「长期导航参考」，而不是一次性答案。",
      // Closing
      closingTitle: "写在最后",
      closingText: "这个结果不是给你一个标准答案，而是帮你更清楚地知道：如果你要走很远，哪些要素是您的核心坚持。",
      // Actions
      howToUse: "如何使用结果",
      howToUseDesc: "用这份结果做职业决策",
      viewReport: "查看完整报告",
      downloadReport: "下载完整报告",
    },
    "zh-TW": {
      resultsLabel: "你的職業錨評測結果",
      title: "探索你最值得堅持與發展的\n職涯核心需求",
      openingTitle: "這個結果代表什麼？",
      openingText: "這不是能力測評，也不是性格測試。你的分數不代表你強或弱，而代表：在長期職業選擇中，哪些條件如果反覆被忽視，你會逐漸痛苦、消耗，甚至離開。",
      scoreHighMeaning: "分數高 = 對你很重要",
      scoreLowMeaning: "分數低 = 對你不是核心驅動力（不是缺點）",
      radarTitle: "如何看這張圖？",
      radarGuide: "這張圖不是在比較你像誰，而是在顯示：不同職業需求對你來說，「有多不可妥協」。越接近外圈，代表越難被犧牲；越靠近中心，代表你對此相對靈活。",
      coreAdvAnchor: "您的核心優勢錨點",
      multiCoreAdv: "多重核心優勢錨點",
      noCoreAdv: "當前無核心優勢錨點",
      noCoreAdvAdvice: "建議關注高分錨點結構組合。",
      coreAdvIntro: "對你來說，真正重要的是——",
      coreAdvNote: "最不願放棄的自我概念中的核心要素。",
      ifPresent: "如果這個條件長期存在",
      ifAbsent: "如果這個條件長期不存在",
      conflictLabel: "需要留意的拉扯",
      conflictAcknowledge: "很多認真思考職業的人，都會有這種拉扯。",
      conflictEssence: "你同時在意兩種長期很難同時滿足的東西。",
      conflictReassurance: "這不是你不夠好，而是任何人長期這樣都會內耗。",
      conflictAdvice: "未來你可能需要特別留意：在關鍵選擇時，不要假設「兩邊都能長期兼顧」。",
      directionsTitle: "你可以怎麼用這個結果",
      direction1: "在做重要選擇前，先問自己：「這個選擇，會不會長期踩到我的高分項？」",
      direction2: "當你感到持續疲憊或抗拒時：不是馬上懷疑自己能力，而是回頭看看，是不是某個核心需求被忽視了。",
      direction3: "把這個結果當作「長期導航參考」，而不是一次性答案。",
      closingTitle: "寫在最後",
      closingText: "這個結果不是給你一個標準答案，而是幫你更清楚地知道：如果你要走很遠，哪些要素是您的核心堅持。",
      howToUse: "如何使用結果",
      howToUseDesc: "用這份結果做職業決策",
      viewReport: "查看完整報告",
      downloadReport: "下載完整報告",
    },
    "en": {
      resultsLabel: "Your Career Anchor Results",
      title: "Explore the Core Career Needs\nWorth Persisting and Developing",
      openingTitle: "What does this result mean?",
      openingText: "This is not an ability test or personality assessment. Your scores don't indicate strength or weakness—they show: in long-term career choices, which conditions, if repeatedly ignored, will gradually cause you pain, drain, or even make you leave.",
      scoreHighMeaning: "High score = Very important to you",
      scoreLowMeaning: "Low score = Not your core driver (not a weakness)",
      radarTitle: "How to read this chart?",
      radarGuide: "This chart isn't comparing you to anyone. It shows: for different career needs, 'how non-negotiable' they are for you. Closer to the outer ring means harder to sacrifice; closer to the center means you're more flexible about it.",
      coreAdvAnchor: "Your Core Advantage Anchor",
      multiCoreAdv: "Multiple Core Advantage Anchors",
      noCoreAdv: "No Core Advantage Anchor Currently",
      noCoreAdvAdvice: "Focus on understanding your structural anchor combination.",
      coreAdvIntro: "For you, what truly matters is—",
      coreAdvNote: "The core element of your self-concept you are least willing to give up.",
      ifPresent: "If this condition exists long-term",
      ifAbsent: "If this condition is missing long-term",
      conflictLabel: "A tension to be aware of",
      conflictAcknowledge: "Many people who think seriously about careers experience this kind of tension.",
      conflictEssence: "You care about two things that are structurally hard to satisfy simultaneously long-term.",
      conflictReassurance: "This isn't about you not being good enough—anyone would feel drained trying to maintain both long-term.",
      conflictAdvice: "In future key decisions, don't assume 'I can balance both forever.'",
      directionsTitle: "How you can use this result",
      direction1: "Before important decisions, ask yourself: 'Will this choice step on my high-score areas long-term?'",
      direction2: "When you feel persistently tired or resistant: instead of immediately doubting your ability, look back to see if a core need has been neglected.",
      direction3: "Treat this result as a 'long-term navigation reference,' not a one-time answer.",
      closingTitle: "Final note",
      closingText: "This result doesn't give you a standard answer—it helps you see more clearly: if you want to go far, which elements are your core commitments.",
      howToUse: "How to Use Results",
      howToUseDesc: "Make career decisions with this report",
      viewReport: "View Complete Report",
      downloadReport: "Download Complete Report",
    },
  };

  const txt = texts[language];

  // Anchor core meanings (user-friendly, non-technical)
  const anchorCoreMeanings: Record<string, Record<string, string>> = {
    "zh-CN": {
      TF: "在某个专业领域做到精深和卓越",
      GM: "带领团队、整合资源、对整体结果负责",
      AU: "自己决定工作方式、时间和节奏",
      SE: "稳定、可预测、有保障的职业环境",
      EC: "创造新事物、建立属于自己的事业",
      SV: "让工作与价值观一致，产生社会意义",
      CH: "持续挑战困难、征服复杂问题",
      LS: "工作与个人生活的整合与平衡",
    },
    "zh-TW": {
      TF: "在某個專業領域做到精深和卓越",
      GM: "帶領團隊、整合資源、對整體結果負責",
      AU: "自己決定工作方式、時間和節奏",
      SE: "穩定、可預測、有保障的職業環境",
      EC: "創造新事物、建立屬於自己的事業",
      SV: "讓工作與價值觀一致，產生社會意義",
      CH: "持續挑戰困難、征服複雜問題",
      LS: "工作與個人生活的整合與平衡",
    },
    "en": {
      TF: "achieving depth and excellence in a specialized field",
      GM: "leading teams, integrating resources, being responsible for results",
      AU: "deciding your own work methods, schedule, and pace",
      SE: "a stable, predictable, and secure career environment",
      EC: "creating something new and building your own venture",
      SV: "aligning work with values and creating social meaning",
      CH: "continuously tackling difficulties and conquering complex problems",
      LS: "integration and balance between work and personal life",
    },
  };

  // If-present/if-absent descriptions
  const anchorIfPresent: Record<string, Record<string, string>> = {
    "zh-CN": {
      TF: "你会更稳定、更有力量，感觉自己在做有价值的事",
      GM: "你会感到被需要、有掌控感，工作充满意义",
      AU: "你会更自在、更有创造力，工作不再是负担",
      SE: "你会安心、踏实，能专注于工作本身",
      EC: "你会充满热情、主动投入，每天都有动力",
      SV: "你会感到工作与内心一致，有持续的满足感",
      CH: "你会保持活力、不断成长，享受征服的成就感",
      LS: "你会更从容、更持久，不会被工作掏空",
    },
    "zh-TW": {
      TF: "你會更穩定、更有力量，感覺自己在做有價值的事",
      GM: "你會感到被需要、有掌控感，工作充滿意義",
      AU: "你會更自在、更有創造力，工作不再是負擔",
      SE: "你會安心、踏實，能專注於工作本身",
      EC: "你會充滿熱情、主動投入，每天都有動力",
      SV: "你會感到工作與內心一致，有持續的滿足感",
      CH: "你會保持活力、不斷成長，享受征服的成就感",
      LS: "你會更從容、更持久，不會被工作掏空",
    },
    "en": {
      TF: "You'll feel more stable and empowered, knowing your work is valuable",
      GM: "You'll feel needed, in control, and find deep meaning in your work",
      AU: "You'll feel more at ease and creative—work won't feel like a burden",
      SE: "You'll feel secure and grounded, able to focus on the work itself",
      EC: "You'll feel passionate and proactive, energized every day",
      SV: "You'll feel aligned with your values, with lasting satisfaction",
      CH: "You'll stay energized, keep growing, and enjoy the thrill of achievement",
      LS: "You'll feel more at ease and sustainable—not drained by work",
    },
  };

  const anchorIfAbsent: Record<string, Record<string, string>> = {
    "zh-CN": {
      TF: "逐渐感到自己在「贬值」，失去专业尊严和成就感",
      GM: "感到无力、被边缘化，工作变得毫无意义",
      AU: "产生强烈的压抑和抗拒，想要逃离",
      SE: "持续焦虑不安，很难专注和发挥",
      EC: "感到窒息和无聊，失去工作热情",
      SV: "感到空虚和迷失，不知道为什么要工作",
      CH: "感到无聊、停滞，失去前进的动力",
      LS: "逐渐被掏空，工作和生活都难以为继",
    },
    "zh-TW": {
      TF: "逐漸感到自己在「貶值」，失去專業尊嚴和成就感",
      GM: "感到無力、被邊緣化，工作變得毫無意義",
      AU: "產生強烈的壓抑和抗拒，想要逃離",
      SE: "持續焦慮不安，很難專注和發揮",
      EC: "感到窒息和無聊，失去工作熱情",
      SV: "感到空虛和迷失，不知道為什麼要工作",
      CH: "感到無聊、停滯，失去前進的動力",
      LS: "逐漸被掏空，工作和生活都難以為繼",
    },
    "en": {
      TF: "Gradually feel 'devalued,' losing professional dignity and achievement",
      GM: "Feel powerless and marginalized—work becomes meaningless",
      AU: "Feel strongly suppressed and resistant, wanting to escape",
      SE: "Constant anxiety, difficulty focusing and performing",
      EC: "Feel suffocated and bored, losing passion for work",
      SV: "Feel empty and lost, not knowing why you're working",
      CH: "Feel bored and stagnant, losing motivation to move forward",
      LS: "Gradually drained—both work and life become unsustainable",
    },
  };

  const getAnchorCoreMeaning = (anchor: string): string => {
    return anchorCoreMeanings[language]?.[anchor] || anchorCoreMeanings["zh-CN"][anchor] || "";
  };

  const getAnchorIfPresent = (anchor: string): string => {
    return anchorIfPresent[language]?.[anchor] || anchorIfPresent["zh-CN"][anchor] || "";
  };

  const getAnchorIfAbsent = (anchor: string): string => {
    return anchorIfAbsent[language]?.[anchor] || anchorIfAbsent["zh-CN"][anchor] || "";
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: "hidden",
        animate: "visible",
      };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <motion.section
        className="py-16 px-6 border-b border-border"
        variants={prefersReducedMotion ? undefined : headerVariants}
        {...motionProps}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="data-label text-primary mb-4">{txt.resultsLabel}</div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-4 whitespace-pre-line">
            {txt.title}
          </h1>
          {workExpDescription && (
            <p className="text-base text-muted-foreground mb-2">{workExpDescription}</p>
          )}
        </div>
      </motion.section>

      {/* Opening Explanation - REQUIRED by framework */}
      <motion.section
        className="py-12 px-6 bg-muted/30"
        variants={prefersReducedMotion ? undefined : itemVariants}
        {...motionProps}
      >
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-xl bg-primary/10">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">{txt.openingTitle}</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {txt.openingText}
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium text-primary">{txt.scoreHighMeaning}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <span className="font-medium text-muted-foreground">{txt.scoreLowMeaning}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Main Content */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="swiss-grid"
            variants={prefersReducedMotion ? undefined : containerVariants}
            {...motionProps}
          >
            {/* Radar Chart with Guide */}
            <motion.div
              className="swiss-cell col-span-12 lg:col-span-7"
              variants={prefersReducedMotion ? undefined : itemVariants}
            >
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-5 h-5 text-primary" />
                <span className="data-label">{txt.radarTitle}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {txt.radarGuide}
              </p>
              <RadarChart
                scores={results.scores}
                coreAdvantageAnchors={coreAdvAnchors}
                animate={!prefersReducedMotion}
              />

              {/* Score Legend with user-friendly interpretation */}
              <motion.div
                className="mt-8 space-y-2"
                variants={prefersReducedMotion ? undefined : containerVariants}
              >
                {Object.entries(results.scores)
                  .sort(([,a], [,b]) => b - a)
                  .map(([key, score], index) => {
                    const interpretation = results.interpretation?.[key];
                    const levelColors = getLevelColor(interpretation?.level || "nonCore");
                    
                    return (
                      <motion.div
                        key={key}
                        className="flex items-center gap-3 p-3 rounded-lg transition-all"
                        style={{ backgroundColor: levelColors.bg }}
                        variants={prefersReducedMotion ? undefined : itemVariants}
                        custom={index}
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: levelColors.text }}
                        />
                        <span className="text-sm font-medium flex-1" style={{ color: levelColors.text }}>
                          {getDimensionName(key)}
                        </span>
                        <span
                          className="text-xs px-2 py-1 rounded-full hidden sm:inline-block"
                          style={{ 
                            backgroundColor: levelColors.border,
                            color: levelColors.text 
                          }}
                        >
                          {getScoreUserLanguage(score)}
                        </span>
                        <span
                          className="text-lg font-bold tabular-nums min-w-[3rem] text-right"
                          style={{ color: levelColors.text }}
                        >
                          {score}
                        </span>
                      </motion.div>
                    );
                  })}
              </motion.div>
            </motion.div>

            {/* High-Sensitivity Anchor Card */}
            <motion.div
              className="swiss-cell col-span-12 lg:col-span-5 bg-primary text-primary-foreground"
              variants={prefersReducedMotion ? undefined : itemVariants}
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5" />
                <span className="data-label text-primary-foreground/80">
                  {hasCoreAdvantage
                    ? (isMultipleCoreAdv ? txt.multiCoreAdv : txt.coreAdvAnchor)
                    : txt.noCoreAdv}
                </span>
              </div>

              {hasCoreAdvantage ? (
                <>
                  {coreAdvAnchors.map((anchor, index) => (
                    <div key={anchor} className={index > 0 ? "mt-6 pt-6 border-t border-primary-foreground/20" : ""}>
                      <h2 className="text-2xl font-semibold mb-3">{getDimensionName(anchor)}</h2>
                      <p className="text-lg font-medium mb-3">
                        {txt.coreAdvIntro}
                        <span className="text-primary-foreground">{getAnchorCoreMeaning(anchor)}</span>
                      </p>
                      <div className="space-y-3 mb-3">
                        <div className="p-3 rounded-lg bg-white/10">
                          <div className="text-xs font-medium text-primary-foreground/60 mb-1">{txt.ifPresent}</div>
                          <div className="text-sm text-primary-foreground/90">{getAnchorIfPresent(anchor)}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-white/10">
                          <div className="text-xs font-medium text-primary-foreground/60 mb-1">{txt.ifAbsent}</div>
                          <div className="text-sm text-primary-foreground/90">{getAnchorIfAbsent(anchor)}</div>
                        </div>
                      </div>
                      <motion.div
                        className="text-4xl font-display"
                        initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.5 }}
                        animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 + index * 0.2, duration: 0.5, ease: "easeOut" }}
                      >
                        {results.scores[anchor]}
                      </motion.div>
                    </div>
                  ))}
                  <p className="text-xs text-primary-foreground/60 italic mt-4">
                    {txt.coreAdvNote}
                  </p>
                </>
              ) : (
                <div className="py-6">
                  <p className="text-lg font-medium text-primary-foreground/80 mb-2">
                    {txt.noCoreAdvAdvice}
                  </p>
                  <p className="text-sm text-primary-foreground/60">
                    {language === "en"
                      ? "No single anchor scored above 80. Your career drivers form a balanced structural combination rather than a single dominant force."
                      : language === "zh-TW"
                      ? "目前沒有任何錨點得分超過80分。你的職業驅動力呈現結構性組合狀態，而非單一強勢力量。"
                      : "目前没有任何锚点得分超过80分。你的职业驱动力呈现结构性组合状态，而非单一强势力量。"}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Conflict Anchors - User-friendly warning */}
            {results.conflictAnchors && results.conflictAnchors.length > 0 && (
              <motion.div
                className="swiss-cell col-span-12 md:col-span-6 lg:col-span-7 border-l-4 border-warning"
                variants={prefersReducedMotion ? undefined : itemVariants}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <span className="data-label text-warning">
                    {txt.conflictLabel}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  {results.conflictAnchors.map(([anchor1, anchor2], index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-warning/10 rounded-lg"
                    >
                      <span className="px-3 py-1 bg-warning/20 text-warning text-sm font-medium rounded-sm">
                        {getDimensionName(anchor1)}
                      </span>
                      <AlertCircle className="w-4 h-4 text-warning" />
                      <span className="px-3 py-1 bg-warning/20 text-warning text-sm font-medium rounded-sm">
                        {getDimensionName(anchor2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>{txt.conflictAcknowledge}</p>
                  <p className="font-medium text-foreground">{txt.conflictEssence}</p>
                  <p>{txt.conflictReassurance}</p>
                  <p className="text-warning font-medium">{txt.conflictAdvice}</p>
                </div>
              </motion.div>
            )}

            {/* Practical Directions */}
            <motion.div
              className="swiss-cell col-span-12 bg-primary/5 border border-primary/20"
              variants={prefersReducedMotion ? undefined : itemVariants}
            >
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-primary" />
                <span className="data-label text-primary">{txt.directionsTitle}</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="text-2xl font-display text-primary mb-2">01</div>
                  <p className="text-sm text-foreground leading-relaxed">{txt.direction1}</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="text-2xl font-display text-primary mb-2">02</div>
                  <p className="text-sm text-foreground leading-relaxed">{txt.direction2}</p>
                </div>
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="text-2xl font-display text-primary mb-2">03</div>
                  <p className="text-sm text-foreground leading-relaxed">{txt.direction3}</p>
                </div>
              </div>
            </motion.div>

            {/* Closing Note - Required by framework */}
            <motion.div
              className="swiss-cell col-span-12 border border-border bg-muted/30"
              variants={prefersReducedMotion ? undefined : itemVariants}
            >
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <div className="data-label mb-2">{txt.closingTitle}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {txt.closingText}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Action Links */}
      <motion.section
        className="py-12 px-6"
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto">
          {/* How to use results */}
          <Link
            to="/how-to-use"
            className="flex items-center justify-between p-6 bg-primary/5 border border-primary/20 rounded-sm hover:border-primary transition-colors group mb-6"
          >
            <div>
              <div className="data-label mb-2 text-primary">{txt.howToUse}</div>
              <div className="font-medium text-foreground">
                {txt.howToUseDesc}
              </div>
            </div>
            <Compass className="w-5 h-5 text-primary" />
          </Link>

          {/* View & Download buttons */}
          <div className="flex justify-end gap-3 flex-wrap">
            <Link
              to="/report-view"
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground font-medium rounded-sm hover:bg-muted transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              {txt.viewReport}
            </Link>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={downloadingV3}
              onClick={async () => {
                if (!user) return;
                setDownloadingV3(true);
                try {
                  // Use same sessionStorage data displayed on this page
                  const reportOutput = await downloadV3ReportAsPdf({
                    scores: results.scores,
                    careerStage: profile?.career_stage || careerStage || "mid",
                    userName: resolveUserDisplayName(profile, user, language),
                    workExperienceYears: resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
                    userId: user.id,
                    language: language as LangKey,
                  });
                  if (!reportOutput) {
                    toast.error(
                      language === "en" ? "No assessment data found" : language === "zh-TW" ? "未找到測評數據" : "未找到测评数据"
                    );
                    return;
                  }
                  toast.success(
                    language === "en"
                      ? "Report downloaded"
                      : language === "zh-TW"
                      ? "完整報告已下載"
                      : "完整报告已下载"
                  );
                } catch {
                  toast.error(
                    language === "en"
                      ? "Failed to generate report"
                      : language === "zh-TW"
                      ? "報告生成失敗"
                      : "报告生成失败"
                  );
                } finally {
                  setDownloadingV3(false);
                }
              }}
            >
              {downloadingV3 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {txt.downloadReport}
            </button>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
