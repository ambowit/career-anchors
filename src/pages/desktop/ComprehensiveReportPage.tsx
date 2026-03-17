import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Share2,
  Check,
  Loader2,
  Target,
  Heart,
  BarChart3,
  Compass,
  Trophy,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Route,
  Scale,
  Eye,
  AlertCircle,
} from "lucide-react";

import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTestAuth } from "@/hooks/useTestAuth";
import { useAuth } from "@/hooks/useAuth";
import { downloadLatestFusionReport } from "@/lib/reportFusionDownload";
import { getStageInterpretation, type CareerStage as InterpCareerStage } from "@/data/stageInterpretations";
import { getWorkExperienceDescription, type LanguageKey } from "@/hooks/useTestAuth";
import {
  IDEAL_CARDS,
  CATEGORY_CONFIG,
  getCardLabel,
  getCategoryLabel,
  type CardCategory,
} from "@/data/idealCards";
import { DIMENSION_NAMES } from "@/data/questions";
import { getActionPlan } from "@/data/actionPlans";
import RadarChart from "@/components/desktop/RadarChart";
import { cn, resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";


interface IdealCardResult {
  rank: number;
  cardId: number;
  category: CardCategory;
  label: string;
  labelEn: string;
}

// Career anchor -> ideal card category affinity map
const ANCHOR_CATEGORY_AFFINITY: Record<string, { primary: CardCategory; secondary: CardCategory; description: Record<string, string> }> = {
  TF: {
    primary: "intrinsic",
    secondary: "material",
    description: {
      "zh-CN": "技术/专业能力型锚定通常与「内在价值」高度关联——追求专业精深和自我实现。如果你的理想卡也集中在内在价值类，说明你的职业驱动力和人生价值观高度一致。",
      "zh-TW": "技術/專業能力型錨定通常與「內在價值」高度關聯——追求專業精深和自我實現。如果你的理想卡也集中在內在價值類，說明你的職業驅動力和人生價值觀高度一致。",
      en: "Technical/Functional anchoring typically aligns strongly with 'Intrinsic Values' — pursuing professional depth and self-actualization. If your ideal cards also concentrate on intrinsic values, your career drivers and life values are highly consistent.",
    },
  },
  GM: {
    primary: "interpersonal",
    secondary: "material",
    description: {
      "zh-CN": "管理型锚定与「人际关系」和「物质条件」相关——影响他人、建立团队、追求地位和成就。检查你的理想卡是否也反映了对领导力和社会影响力的渴望。",
      "zh-TW": "管理型錨定與「人際關係」和「物質條件」相關——影響他人、建立團隊、追求地位和成就。檢查你的理想卡是否也反映了對領導力和社會影響力的渴望。",
      en: "General Management anchoring relates to 'Interpersonal' and 'Material' values — influencing others, building teams, pursuing status and achievement. Check if your ideal cards also reflect desires for leadership and social influence.",
    },
  },
  AU: {
    primary: "lifestyle",
    secondary: "intrinsic",
    description: {
      "zh-CN": "自主/独立型锚定与「生活方式」密切相关——享受自由、独立和自主的生活节奏。如果理想卡也偏向生活方式类，说明你对「自由」的追求是从职业到人生的一致信念。",
      "zh-TW": "自主/獨立型錨定與「生活方式」密切相關——享受自由、獨立和自主的生活節奏。如果理想卡也偏向生活方式類，說明你對「自由」的追求是從職業到人生的一致信念。",
      en: "Autonomy anchoring closely relates to 'Lifestyle' values — enjoying freedom, independence, and self-directed rhythm. If your ideal cards also lean toward lifestyle, your pursuit of 'freedom' is a consistent belief from career to life.",
    },
  },
  SE: {
    primary: "material",
    secondary: "lifestyle",
    description: {
      "zh-CN": "安全/稳定型锚定与「物质条件」和「生活方式」关联——追求稳定、可预测的环境和物质保障。看看你的理想卡是否也体现了对安全感和稳定生活的重视。",
      "zh-TW": "安全/穩定型錨定與「物質條件」和「生活方式」關聯——追求穩定、可預測的環境和物質保障。看看你的理想卡是否也體現了對安全感和穩定生活的重視。",
      en: "Security anchoring relates to 'Material' and 'Lifestyle' values — seeking stable, predictable environments and material security. See if your ideal cards also reflect emphasis on security and stable living.",
    },
  },
  EC: {
    primary: "intrinsic",
    secondary: "material",
    description: {
      "zh-CN": "创业/创造型锚定与「内在价值」和「物质条件」关联——既追求创造新事物的满足感，也追求创业带来的物质回报。理想卡可以帮你判断你更看重创造本身还是创业成果。",
      "zh-TW": "創業/創造型錨定與「內在價值」和「物質條件」關聯——既追求創造新事物的滿足感，也追求創業帶來的物質回報。理想卡可以幫你判斷你更看重創造本身還是創業成果。",
      en: "Entrepreneurial anchoring relates to 'Intrinsic' and 'Material' values — pursuing both the satisfaction of creating new things and material returns from entrepreneurship. Your ideal cards help determine whether you value the creation itself or the outcomes.",
    },
  },
  SV: {
    primary: "interpersonal",
    secondary: "intrinsic",
    description: {
      "zh-CN": "服务/奉献型锚定与「人际关系」和「内在价值」高度关联——帮助他人、产生社会意义。如果你的理想卡也集中在这两个类别，说明你有非常强的利他动机和价值追求。",
      "zh-TW": "服務/奉獻型錨定與「人際關係」和「內在價值」高度關聯——幫助他人、產生社會意義。如果你的理想卡也集中在這兩個類別，說明你有非常強的利他動機和價值追求。",
      en: "Service anchoring strongly relates to 'Interpersonal' and 'Intrinsic' values — helping others and creating social meaning. If your ideal cards concentrate in these categories, you have a very strong altruistic motivation.",
    },
  },
  CH: {
    primary: "intrinsic",
    secondary: "material",
    description: {
      "zh-CN": "挑战型锚定主要与「内在价值」关联——不断征服困难和追求成就感。看看你的理想卡是否也体现了对挑战和成长的渴望，以及你是否在意挑战带来的外在认可。",
      "zh-TW": "挑戰型錨定主要與「內在價值」關聯——不斷征服困難和追求成就感。看看你的理想卡是否也體現了對挑戰和成長的渴望，以及你是否在意挑戰帶來的外在認可。",
      en: "Challenge anchoring mainly relates to 'Intrinsic Values' — continuously conquering difficulties and pursuing achievement. See if your ideal cards also reflect desires for challenge and growth, and whether you care about external recognition.",
    },
  },
  LS: {
    primary: "lifestyle",
    secondary: "interpersonal",
    description: {
      "zh-CN": "生活方式整合型锚定与「生活方式」和「人际关系」高度关联——追求工作与生活的和谐平衡。理想卡可以帮你进一步确认，你理想中「平衡」的具体模样是什么。",
      "zh-TW": "生活方式整合型錨定與「生活方式」和「人際關係」高度關聯——追求工作與生活的和諧平衡。理想卡可以幫你進一步確認，你理想中「平衡」的具體模樣是什麼。",
      en: "Lifestyle Integration anchoring strongly relates to 'Lifestyle' and 'Interpersonal' values — pursuing harmonious work-life balance. Your ideal cards help further clarify what your ideal 'balance' specifically looks like.",
    },
  },
};

const WORK_CATEGORIES: CardCategory[] = ["intrinsic", "material"];
const LIFE_CATEGORIES: CardCategory[] = ["lifestyle", "interpersonal"];

const ANCHOR_CORE_MEANINGS: Record<string, Record<string, string>> = {
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
  en: {
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

const ANCHOR_IF_PRESENT: Record<string, Record<string, string>> = {
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
  en: {
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

const ANCHOR_IF_ABSENT: Record<string, Record<string, string>> = {
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
  en: {
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

const getScoreLevel = (score: number, lang: string): { label: string; color: string } => {
  // Standardized 0-100 scale thresholds
  if (lang === "en") {
    if (score >= 80) return { label: "Core Advantage", color: "#dc2626" };
    if (score >= 65) return { label: "High-Sensitivity", color: "#d97706" };
    if (score >= 45) return { label: "Moderate", color: "#2563eb" };
    return { label: "Non-core", color: "#94a3b8" };
  }
  if (lang === "zh-TW") {
    if (score >= 80) return { label: "核心優勢", color: "#dc2626" };
    if (score >= 65) return { label: "高敏感區", color: "#d97706" };
    if (score >= 45) return { label: "中度影響", color: "#2563eb" };
    return { label: "非核心", color: "#94a3b8" };
  }
  if (score >= 80) return { label: "核心优势", color: "#dc2626" };
  if (score >= 65) return { label: "高敏感区", color: "#d97706" };
  if (score >= 45) return { label: "中度影响", color: "#2563eb" };
  return { label: "非核心", color: "#94a3b8" };
};

export default function ComprehensiveReportPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const reportRef = useRef<HTMLDivElement>(null);
  const { careerStage, workYears, isExecutive, isEntrepreneur } = useTestAuth();
  const { user, profile } = useAuth();

  const [careerAnchorData, setCareerAnchorData] = useState<any>(null);
  const [idealCardResults, setIdealCardResults] = useState<IdealCardResult[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const caData = sessionStorage.getItem("assessmentResults");
    const icData = sessionStorage.getItem("idealCardResults");

    if (!caData || !icData) {
      navigate(caData ? "/ideal-card-test" : "/assessment");
      return;
    }

    setCareerAnchorData(JSON.parse(caData));
    setIdealCardResults(JSON.parse(icData));
  }, [navigate]);

  const getDimensionName = (dim: string) => {
    return DIMENSION_NAMES[dim as keyof typeof DIMENSION_NAMES]?.[language] || dim;
  };

  // Category distribution
  const categoryDistribution = useMemo(() => {
    const dist: Record<CardCategory, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
    idealCardResults.forEach((r) => { dist[r.category]++; });
    return dist;
  }, [idealCardResults]);

  // Anchor-IdealCard alignment analysis
  const alignmentAnalysis = useMemo(() => {
    if (!careerAnchorData) return null;
    // Use first high-sensitivity anchor (>80) or fallback to mainAnchor
    const coreAdvAnchors = Object.entries(careerAnchorData.scores || {})
      .filter(([, s]) => s >= 80)
      .sort(([, a], [, b]) => b - a)
      .map(([d]) => d);
    const anchor = coreAdvAnchors[0] || careerAnchorData.mainAnchor;
    const affinity = ANCHOR_CATEGORY_AFFINITY[anchor];
    if (!affinity) return null;

    const primaryCount = categoryDistribution[affinity.primary];
    const secondaryCount = categoryDistribution[affinity.secondary];
    const alignmentScore = primaryCount * 2 + secondaryCount;
    const maxPossible = 20;
    const alignmentPercent = Math.round((alignmentScore / maxPossible) * 100);

    let alignmentLevel: "high" | "moderate" | "low";
    if (alignmentPercent >= 60) alignmentLevel = "high";
    else if (alignmentPercent >= 30) alignmentLevel = "moderate";
    else alignmentLevel = "low";

    return {
      anchor,
      affinity,
      primaryCount,
      secondaryCount,
      alignmentPercent,
      alignmentLevel,
    };
  }, [careerAnchorData, categoryDistribution]);

  // Download unified fusion report as professional PDF (includes V3 quantitative + AI sections)
  const handleDownload = useCallback(async () => {
    if (!careerAnchorData || idealCardResults.length === 0) return;
    setIsExporting(true);
    try {
      const userId = user?.id || "anonymous";
      const userName = resolveUserDisplayName(profile, user, language);

      const success = await downloadLatestFusionReport(
        userId,
        userName,
        profile?.career_stage || careerStage || "mid",
        resolveWorkExperienceYears(profile?.work_experience_years, workYears, profile?.career_stage || careerStage),
        language,
      );

      if (!success) {
        toast.error(language === "en" ? "No report data found" : language === "zh-TW" ? "未找到報告數據" : "未找到报告数据");
        return;
      }

      toast.success(language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载");
    } catch {
      toast.error(language === "en" ? "Download failed" : language === "zh-TW" ? "下載失敗" : "下载失败");
    } finally {
      setIsExporting(false);
    }
  }, [language, careerAnchorData, idealCardResults, user, profile, workYears, careerStage]);

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success(language === "en" ? "Link copied" : language === "zh-TW" ? "連結已複製" : "链接已复制");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error(language === "en" ? "Copy failed" : language === "zh-TW" ? "複製失敗" : "复制失败");
    }
  }, [language]);

  // Share link
  const handleShare = useCallback(async () => {
    const shareTitle = language === "en" ? "My Career & Life Values Report" : language === "zh-TW" ? "我的職業與人生價值觀報告" : "我的职业与人生价值观报告";
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(language === "en" ? "Link copied for sharing" : language === "zh-TW" ? "連結已複製，可直接分享" : "链接已复制，可直接分享");
    } catch {
      toast.error(language === "en" ? "Share failed" : language === "zh-TW" ? "分享失敗" : "分享失败");
    }
  }, [language]);

  // Work vs Life orientation analysis
  const idealCardOrientation = useMemo(() => {
    const workCount = idealCardResults.filter(r => WORK_CATEGORIES.includes(r.category)).length;
    const lifeCount = idealCardResults.filter(r => LIFE_CATEGORIES.includes(r.category)).length;
    const total = workCount + lifeCount;
    return {
      workPercent: total > 0 ? Math.round((workCount / total) * 100) : 50,
      lifePercent: total > 0 ? Math.round((lifeCount / total) * 100) : 50,
    };
  }, [idealCardResults]);

  // Top 3 value consistency
  const top3Consistency = useMemo(() => {
    if (idealCardResults.length < 3) return null;
    const topCategories = idealCardResults.slice(0, 3).map(r => r.category);
    const unique = new Set(topCategories);
    if (unique.size === 1) return "high" as const;
    if (unique.size === 2) return "moderate" as const;
    return "diverse" as const;
  }, [idealCardResults]);

  // Missing dimensions
  const missingDimensions = useMemo(() => {
    return (Object.keys(categoryDistribution) as CardCategory[]).filter(cat => categoryDistribution[cat] === 0);
  }, [categoryDistribution]);

  if (!careerAnchorData || idealCardResults.length === 0) return null;

  const topThree = idealCardResults.slice(0, 3);
  const medalColors = [
    { bg: "#1a3a5c", text: "#ffffff" },
    { bg: "#1a3a5c", text: "#ffffff" },
    { bg: "#1a3a5c", text: "#ffffff" },
  ];

  // Compute core advantage anchors for display
  const coreAdvAnchorsForReport = Object.entries(careerAnchorData.scores || {})
    .filter(([, s]) => s >= 80)
    .sort(([, a], [, b]) => b - a)
    .map(([d]) => d);
  const hasCoreAdv = coreAdvAnchorsForReport.length > 0;
  const displayAnchorForReport = coreAdvAnchorsForReport[0] || careerAnchorData.mainAnchor;
  const mainAnchorName = getDimensionName(displayAnchorForReport);

  const texts = {
    "zh-CN": {
      reportTitle: "综合分析报告",
      reportSubtitle: "职业锚测评 + 理想人生卡",
      chapterOne: "第一部分：职业锚分析",
      chapterOneDesc: "你在长期职业中不能被牺牲的核心需求",
      coreAdvAnchor: "核心优势锚点",
      noCoreAdv: "无核心优势锚点",
      structuralCombination: "当前为结构性驱动组合状态",
      chapterTwo: "第二部分：理想人生卡分析",
      chapterTwoDesc: "你人生中最重要的10个价值观",
      topThreeTitle: "最重要的三个价值",
      distributionTitle: "价值类别分布",
      orientationTitle: "工作取向 vs 生活取向",
      orientationDesc: "通过分析你选择的卡片类别，判断你更倾向于「工作取向」还是「生活取向」",
      workLabel: "工作取向",
      lifeLabel: "生活取向",
      chapterThree: "第三部分：综合解读",
      chapterThreeDesc: "包含职业锚详解、价值观分析和交叉对比",
      alignmentTitle: "一致性评估",
      alignmentHigh: "高度一致",
      alignmentModerate: "中度一致",
      alignmentLow: "需要关注",
      alignmentHighDesc: "你的职业驱动力与人生价值观高度契合，这意味着你更容易在职业中找到持久的满足感和意义感。",
      alignmentModerateDesc: "你的职业驱动力与人生价值观有一定的关联，但并非完全一致。你可能需要有意识地在工作中兼顾不同维度的需求。",
      alignmentLowDesc: "你的职业驱动力与人生价值观之间存在一定的张力。这不是坏事，但意味着你需要更有策略地平衡职业选择和生活追求。",
      download: "下载",
      copy: "复制",
      share: "分享",
      back: "返回",
      generatedAt: "生成于",
      chapterFour: "第四部分：执行建议",
      chapterFourDesc: "基于你的评估结果，量身定制的行动方向",
      learningTitle: "学习方向",
      learningDesc: "优先发展的能力领域",
      careerPathTitle: "职业路径",
      careerPathDesc: "适合你的发展方向",
      verificationTitle: "验证方式",
      verificationDesc: "通过实际经历验证评估结果",
      tradeoffTitle: "重要提醒：取舍是必然的",
      tradeoffDesc: "选择符合核心优势锚点的职业路径，意味着你可能需要放弃：",
      tradeoffConclusion: "这不是损失，而是聚焦。明确知道自己放弃什么，比模糊地什么都想要更有力量。",
      recommended: "推荐",
      timeline: "时间跨度",
      risk: "风险等级",
      ch3AnchorTitle: "职业锚详细解读",
      ch3CoreNeed: "核心需求",
      ch3IfPresent: "如果长期存在",
      ch3IfAbsent: "如果长期缺失",
      ch3ConflictTitle: "需要留意的拉扯",
      ch3ConflictNote: "你同时在意两种长期很难同时满足的东西。这不代表你不够好，而是任何人长期面对这种张力都会消耗。",
      ch3ScoreLevels: "各维度约束力",
      ch3IdealTitle: "理想人生卡详细解读",
      ch3OrientTitle: "工作取向 vs 生活取向",
      ch3WorkLabel: "工作取向",
      ch3LifeLabel: "生活取向",
      ch3ConsistTitle: "前三名价值一致性",
      ch3ConsistHigh: "你的前三名卡片属于同一类别，展现出高度聚焦的价值取向。你对这个维度有非常清晰的追求。",
      ch3ConsistMod: "你的前三名卡片集中在两个类别，有明确的价值主线，同时兼顾了不同维度的需求。",
      ch3ConsistDiv: "你的前三名卡片分散在三个类别，展现多元化的价值追求。你需要在多个维度上获得满足。",
      ch3MissingTitle: "被忽略的维度",
      ch3MissingNote: "这些维度在你的选择中完全缺失。它们可能是你目前不太在意的，也可能是被无意识忽略的盲区。值得思考：这些维度是否真的不重要？",
      ch3AllCovered: "你的选择覆盖了全部四个维度，显示出平衡的价值取向。",
      ch3CrossTitle: "交叉分析：职业锚 × 人生价值观",
      ch3StageTitle: "阶段性发展指引",
      ch3StageMeaning: "在你当前阶段的含义",
      ch3StageChars: "典型表现",
      ch3StageDev: "发展建议",
      ch3StageRisk: "需要警惕",
      ch3StageEntry: "职业初期（0-5年）",
      ch3StageMid: "职业中期（6-15年）",
      ch3StageSenior: "高管/资深（15年+）",
      ch3StageHr: "HR 视角",
      ch3StageNoData: "阶段性解读需要选择职业阶段后生成。",
    },
    "zh-TW": {
      reportTitle: "綜合分析報告",
      reportSubtitle: "職業錨測評 + 理想人生卡",
      chapterOne: "第一部分：職業錨分析",
      chapterOneDesc: "你在長期職業中不能被犧牲的核心需求",
      coreAdvAnchor: "核心優勢錨點",
      noCoreAdv: "無核心優勢錨點",
      structuralCombination: "當前為結構性驅動組合狀態",
      chapterTwo: "第二部分：理想人生卡分析",
      chapterTwoDesc: "你人生中最重要的10個價值觀",
      topThreeTitle: "最重要的三個價值",
      distributionTitle: "價值類別分佈",
      orientationTitle: "工作取向 vs 生活取向",
      orientationDesc: "透過分析你選擇的卡片類別，判斷你更傾向於「工作取向」還是「生活取向」",
      workLabel: "工作取向",
      lifeLabel: "生活取向",
      chapterThree: "第三部分：綜合解讀",
      chapterThreeDesc: "包含職業錨詳解、價值觀分析和交叉對比",
      alignmentTitle: "一致性評估",
      alignmentHigh: "高度一致",
      alignmentModerate: "中度一致",
      alignmentLow: "需要關注",
      alignmentHighDesc: "你的職業驅動力與人生價值觀高度契合，這意味著你更容易在職業中找到持久的滿足感和意義感。",
      alignmentModerateDesc: "你的職業驅動力與人生價值觀有一定的關聯，但並非完全一致。你可能需要有意識地在工作中兼顧不同維度的需求。",
      alignmentLowDesc: "你的職業驅動力與人生價值觀之間存在一定的張力。這不是壞事，但意味著你需要更有策略地平衡職業選擇和生活追求。",
      download: "下載",
      copy: "複製",
      share: "分享",
      back: "返回",
      generatedAt: "生成於",
      chapterFour: "第四部分：執行建議",
      chapterFourDesc: "基於你的評估結果，量身定制的行動方向",
      learningTitle: "學習方向",
      learningDesc: "優先發展的能力領域",
      careerPathTitle: "職業路徑",
      careerPathDesc: "適合你的發展方向",
      verificationTitle: "驗證方式",
      verificationDesc: "通過實際經歷驗證評估結果",
      tradeoffTitle: "重要提醒：取捨是必然的",
      tradeoffDesc: "選擇符合核心優勢錨點的職業路徑，意味著你可能需要放棄：",
      tradeoffConclusion: "這不是損失，而是聚焦。明確知道自己放棄什麼，比模糊地什麼都想要更有力量。",
      recommended: "推薦",
      timeline: "時間跨度",
      risk: "風險等級",
      ch3AnchorTitle: "職業錨詳細解讀",
      ch3CoreNeed: "核心需求",
      ch3IfPresent: "如果長期存在",
      ch3IfAbsent: "如果長期缺失",
      ch3ConflictTitle: "需要留意的拉扯",
      ch3ConflictNote: "你同時在意兩種長期很難同時滿足的東西。這不代表你不夠好，而是任何人長期面對這種張力都會消耗。",
      ch3ScoreLevels: "各維度約束力",
      ch3IdealTitle: "理想人生卡詳細解讀",
      ch3OrientTitle: "工作取向 vs 生活取向",
      ch3WorkLabel: "工作取向",
      ch3LifeLabel: "生活取向",
      ch3ConsistTitle: "前三名價值一致性",
      ch3ConsistHigh: "你的前三名卡片屬於同一類別，展現出高度聚焦的價值取向。你對這個維度有非常清晰的追求。",
      ch3ConsistMod: "你的前三名卡片集中在兩個類別，有明確的價值主線，同時兼顧了不同維度的需求。",
      ch3ConsistDiv: "你的前三名卡片分散在三個類別，展現多元化的價值追求。你需要在多個維度上獲得滿足。",
      ch3MissingTitle: "被忽略的維度",
      ch3MissingNote: "這些維度在你的選擇中完全缺失。它們可能是你目前不太在意的，也可能是被無意識忽略的盲區。值得思考：這些維度是否真的不重要？",
      ch3AllCovered: "你的選擇覆蓋了全部四個維度，顯示出平衡的價值取向。",
      ch3CrossTitle: "交叉分析：職業錨 × 人生價值觀",
      ch3StageTitle: "階段性發展指引",
      ch3StageMeaning: "在你當前階段的含義",
      ch3StageChars: "典型表現",
      ch3StageDev: "發展建議",
      ch3StageRisk: "需要警惕",
      ch3StageEntry: "職業初期（0-5年）",
      ch3StageMid: "職業中期（6-15年）",
      ch3StageSenior: "高管/資深（15年+）",
      ch3StageHr: "HR 視角",
      ch3StageNoData: "階段性解讀需要選擇職業階段後生成。",
    },
    en: {
      reportTitle: "Comprehensive Analysis Report",
      reportSubtitle: "Career Anchor Assessment + Espresso Cards",
      chapterOne: "Part 1: Career Anchor Analysis",
      chapterOneDesc: "Core needs that cannot be sacrificed in your long-term career",
      coreAdvAnchor: "Core Advantage Anchor",
      noCoreAdv: "No Core Advantage Anchor",
      structuralCombination: "Currently in structural drive combination state",
      chapterTwo: "Part 2: Espresso Card Analysis",
      chapterTwoDesc: "Your 10 most important life values",
      topThreeTitle: "Three Most Important Values",
      distributionTitle: "Value Category Distribution",
      orientationTitle: "Work vs Life Orientation",
      orientationDesc: "Analyzing your card categories to determine whether you lean more toward work or life values",
      workLabel: "Work Orientation",
      lifeLabel: "Life Orientation",
      chapterThree: "Part 3: Integrated Interpretation",
      chapterThreeDesc: "Including career anchor details, value analysis, and cross-comparison",
      alignmentTitle: "Consistency Assessment",
      alignmentHigh: "Highly Consistent",
      alignmentModerate: "Moderately Consistent",
      alignmentLow: "Needs Attention",
      alignmentHighDesc: "Your career drivers and life values are highly aligned, meaning you're more likely to find lasting satisfaction and meaning in your career.",
      alignmentModerateDesc: "Your career drivers and life values have some correlation but aren't fully aligned. You may need to consciously balance different dimensional needs at work.",
      alignmentLowDesc: "There's some tension between your career drivers and life values. This isn't bad, but means you'll need a more strategic approach to balancing career choices and life pursuits.",
      download: "Download",
      copy: "Copy",
      share: "Share",
      back: "Back",
      generatedAt: "Generated on",
      chapterFour: "Part 4: Action Recommendations",
      chapterFourDesc: "Tailored action directions based on your assessment results",
      learningTitle: "Learning Direction",
      learningDesc: "Priority capability areas to develop",
      careerPathTitle: "Career Paths",
      careerPathDesc: "Development directions that suit you",
      verificationTitle: "Verification Steps",
      verificationDesc: "Validate assessment results through real experiences",
      tradeoffTitle: "Important: Trade-offs are Inevitable",
      tradeoffDesc: "Choosing a career path aligned with your anchor means you may need to give up:",
      tradeoffConclusion: "This is not loss, but focus. Knowing clearly what you're giving up is more powerful than vaguely wanting everything.",
      recommended: "Recommended",
      timeline: "Timeline",
      risk: "Risk Level",
      ch3AnchorTitle: "Career Anchor Deep Interpretation",
      ch3CoreNeed: "Core Need",
      ch3IfPresent: "If present long-term",
      ch3IfAbsent: "If missing long-term",
      ch3ConflictTitle: "A tension to be aware of",
      ch3ConflictNote: "You care about two things that are structurally hard to satisfy simultaneously long-term. This isn't about you not being good enough \u2014 anyone would feel drained trying to maintain both.",
      ch3ScoreLevels: "Dimension Constraint Levels",
      ch3IdealTitle: "Espresso Card Deep Interpretation",
      ch3OrientTitle: "Work vs Life Orientation",
      ch3WorkLabel: "Work Orientation",
      ch3LifeLabel: "Life Orientation",
      ch3ConsistTitle: "Top 3 Value Consistency",
      ch3ConsistHigh: "Your top 3 cards belong to the same category, showing a highly focused value orientation with very clear pursuit.",
      ch3ConsistMod: "Your top 3 cards concentrate in two categories, showing a clear value thread while balancing different dimensions.",
      ch3ConsistDiv: "Your top 3 cards span three different categories, revealing diverse value pursuits requiring fulfillment across multiple dimensions.",
      ch3MissingTitle: "Overlooked Dimensions",
      ch3MissingNote: "These dimensions are completely absent from your selections. They may be things you don't currently prioritize, or blind spots you've unconsciously overlooked. Worth reflecting: are they truly unimportant?",
      ch3AllCovered: "Your selections cover all four dimensions, showing a balanced value orientation.",
      ch3CrossTitle: "Cross-Analysis: Career Anchor \u00d7 Life Values",
      ch3StageTitle: "Stage-Specific Development Guide",
      ch3StageMeaning: "What this means at your current stage",
      ch3StageChars: "Typical characteristics",
      ch3StageDev: "Development advice",
      ch3StageRisk: "Watch out for",
      ch3StageEntry: "Early Career (0-5 years)",
      ch3StageMid: "Mid-Career (6-15 years)",
      ch3StageSenior: "Executive/Senior (15+ years)",
      ch3StageHr: "HR Perspective",
      ch3StageNoData: "Stage-specific interpretation requires selecting a career stage first.",
    },
  };

  const txt = texts[language] || texts["zh-CN"];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(340, 20%, 97%)" }}>
      {/* Top navigation bar */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(255,255,255,0.92)", borderColor: "hsl(340, 30%, 90%)" }}
      >
        <div className={cn("mx-auto px-4 py-3 flex items-center justify-between", isMobile ? "max-w-full" : "max-w-5xl")}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {txt.back}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/fusion-report")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[#1a365d] text-[#1a365d] hover:bg-[#1a365d]/5 transition-colors"
              title={language === "en" ? "View Complete Report" : language === "zh-TW" ? "查看完整報告" : "查看完整报告"}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === "en" ? "View Report" : language === "zh-TW" ? "查看報告" : "查看报告"}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#1a365d" }}
              title={language === "en" ? "Download Complete Report" : language === "zh-TW" ? "下載完整報告" : "下载完整报告"}
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{language === "en" ? "Full Report" : language === "zh-TW" ? "完整報告" : "完整报告"}</span>
            </button>
            <button
              onClick={handleCopyLink}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCopied ? (language === "en" ? "Copied" : language === "zh-TW" ? "已複製" : "已复制") : txt.copy}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg text-white transition-colors"
              style={{ backgroundColor: "#e74c6f" }}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{txt.share}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div ref={reportRef} className={cn("mx-auto px-4 md:px-6 py-8 space-y-8", isMobile ? "max-w-full" : "max-w-5xl")}>
        {/* Report Header */}
        <motion.div
          className="text-center py-8 rounded-2xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8eaf6 100%)" }}
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #000 1px, transparent 0)", backgroundSize: "24px 24px" }} />
          <div className="relative">
            <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: "#e74c6f" }} />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">{txt.reportTitle}</h1>
            <p className="text-sm text-slate-500">{txt.reportSubtitle}</p>
            <p className="text-xs text-slate-400 mt-2">
              {txt.generatedAt} {new Date().toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN")}
            </p>
          </div>
        </motion.div>

        {/* ===== Personal Profile Banner ===== */}
        {(() => {
          const workExpDesc = getWorkExperienceDescription(workYears, isExecutive, isEntrepreneur, language as LanguageKey);
          if (!workExpDesc) return null;
          return (
            <motion.div
              className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 text-white"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <p className="text-base font-medium leading-relaxed">
                {workExpDesc}
                {language === "en"
                  ? ", here is your career anchor analysis report."
                  : language === "zh-TW"
                    ? "，以下是您的職業錨分析報告。"
                    : "，以下是您的职业锚分析报告。"}
              </p>
            </motion.div>
          );
        })()}

        {/* PDF break marker */}
        <div data-pdf-break aria-hidden="true" className="h-0" />

        {/* ===== CHAPTER 1: Career Anchor ===== */}
        <motion.section
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <Target className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">{txt.chapterOne}</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">{txt.chapterOneDesc}</p>

          <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-2")}>
            {/* Radar Chart */}
            <div>
              <RadarChart
                scores={careerAnchorData.scores}
                coreAdvantageAnchors={coreAdvAnchorsForReport}
                animate={!prefersReducedMotion}
              />
            </div>

            {/* Anchor Summary */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl text-white" style={{ background: "linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%)" }}>
                <span className="text-xs font-medium text-white/60">{hasCoreAdv ? txt.coreAdvAnchor : txt.noCoreAdv}</span>
                <div className="text-xl font-bold mt-1">{mainAnchorName}</div>
                {hasCoreAdv ? (
                  <div className="text-3xl font-bold mt-2">
                    {Number(careerAnchorData.scores[displayAnchorForReport]) || 0}
                  </div>
                ) : (
                  <div className="text-sm mt-2 text-white/70">{txt.structuralCombination}</div>
                )}
              </div>

              {/* Score bars */}
              <div className="space-y-2">
                {(() => {
                  const sortedEntries = Object.entries(careerAnchorData.scores)
                    .sort(([, a], [, b]) => Number(b) - Number(a));
                  const topScoreValue = Number(sortedEntries[0]?.[1]) || 1;
                  return sortedEntries.map(([key, rawScore]) => {
                    const score = Number(rawScore) || 0;
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-20 truncate">{getDimensionName(key)}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min((score / topScoreValue) * 100, 100)}%`,
                              backgroundColor: score >= 70 ? "#1a365d" : score >= 50 ? "#64748b" : "#cbd5e1",
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-10 text-right">{score}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </motion.section>

        {/* PDF break marker */}
        <div data-pdf-break aria-hidden="true" className="h-0" />

        {/* ===== CHAPTER 2: Ideal Cards ===== */}
        <motion.section
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <Heart className="w-5 h-5" style={{ color: "#e74c6f" }} />
            <h2 className="text-xl font-bold text-slate-800">{txt.chapterTwo}</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">{txt.chapterTwoDesc}</p>

          {/* Top 3 */}
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: "#FFD700" }} />
            {txt.topThreeTitle}
          </h3>
          <div className={cn("grid gap-3 mb-8", isMobile ? "grid-cols-1" : "grid-cols-3")}>
            {topThree.map((result, index) => {
              const card = IDEAL_CARDS.find((c) => c.id === result.cardId);
              if (!card) return null;
              const config = CATEGORY_CONFIG[result.category];
              return (
                <div
                  key={result.cardId}
                  className="rounded-xl border-2 p-4 text-center"
                  style={{ backgroundColor: config.bgColor, borderColor: config.borderColor }}
                >
                  <div
                    className="mx-auto w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 shadow-sm"
                    style={{ background: medalColors[index].bg, color: medalColors[index].text }}
                  >
                    {index + 1}
                  </div>
                  <div className="font-bold text-slate-800 mb-1">{getCardLabel(card, language)}</div>
                  <span className="text-xs" style={{ color: config.color }}>
                    {getCategoryLabel(result.category, language)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Distribution */}
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            {txt.distributionTitle}
          </h3>
          <div className="space-y-3">
            {(Object.entries(categoryDistribution) as [CardCategory, number][]).map(([cat, count]) => {
              const config = CATEGORY_CONFIG[cat];
              const percentage = Math.round((count / 10) * 100);
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-16">{getCategoryLabel(cat, language)}</span>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: config.color }} />
                  </div>
                  <span className="text-xs font-bold w-10 text-right" style={{ color: config.color }}>{count}/10</span>
                </div>
              );
            })}
          </div>

          {/* Work vs Life Orientation */}
          <div className="mt-8 mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Compass className="w-4 h-4" style={{ color: "#0891b2" }} />
              {txt.orientationTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-4">{txt.orientationDesc}</p>
            <div className="relative h-10 rounded-xl overflow-hidden flex">
              <div className="h-full flex items-center justify-center" style={{ backgroundColor: "#e74c6f", width: `${idealCardOrientation.workPercent}%` }}>
                <span className="text-white text-xs font-bold px-2 whitespace-nowrap">{txt.workLabel} {idealCardOrientation.workPercent}%</span>
              </div>
              <div className="h-full flex items-center justify-center" style={{ backgroundColor: "#7c3aed", width: `${idealCardOrientation.lifePercent}%` }}>
                <span className="text-white text-xs font-bold px-2 whitespace-nowrap">{txt.lifeLabel} {idealCardOrientation.lifePercent}%</span>
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: "#e74c6f" }} />
                {language === "en" ? "Intrinsic + Material" : language === "zh-TW" ? "內在價值 + 物質條件" : "内在价值 + 物质条件"}
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: "#7c3aed" }} />
                {language === "en" ? "Lifestyle + Interpersonal" : language === "zh-TW" ? "生活方式 + 人際關係" : "生活方式 + 人际关系"}
              </div>
            </div>
          </div>

          {/* Full list */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-2">
            {idealCardResults.map((result) => {
              const card = IDEAL_CARDS.find((c) => c.id === result.cardId);
              if (!card) return null;
              const config = CATEGORY_CONFIG[result.category];
              return (
                <div
                  key={result.cardId}
                  className="flex items-center gap-2 p-2 rounded-lg text-xs"
                  style={{ backgroundColor: config.bgColor }}
                >
                  <span className="font-bold text-slate-500 w-5">{result.rank}</span>
                  <span className="font-medium text-slate-700 truncate">{getCardLabel(card, language)}</span>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* PDF break marker */}
        <div data-pdf-break aria-hidden="true" className="h-0" />

        {/* ===== CHAPTER 3: Integrated Analysis ===== */}
        <motion.section
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
          initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
          animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-1">
            <LinkIcon className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-slate-800">{txt.chapterThree}</h2>
          </div>
          <p className="text-sm text-slate-500 mb-8">{txt.chapterThreeDesc}</p>

          {/* ---- 3.1 Career Anchor Deep Interpretation ---- */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Target className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800">{txt.ch3AnchorTitle}</h3>
            </div>

            {/* Main anchor meaning card */}
            {displayAnchorForReport && (
              <div className="p-5 rounded-xl mb-4" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #2d5a8c 100%)" }}>
                <div className="text-xs font-medium text-white/50 mb-1">{hasCoreAdv ? txt.coreAdvAnchor : txt.noCoreAdv}</div>
                <div className="text-xl font-bold text-white mb-3">{mainAnchorName}</div>
                {hasCoreAdv ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/10">
                      <div className="text-xs font-medium text-white/50 mb-1">{txt.ch3CoreNeed}</div>
                      <div className="text-sm text-white">{ANCHOR_CORE_MEANINGS[language]?.[displayAnchorForReport] || ANCHOR_CORE_MEANINGS["zh-CN"][displayAnchorForReport]}</div>
                    </div>
                    <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                      <div className="p-3 rounded-lg bg-emerald-500/15">
                        <div className="text-xs font-medium text-emerald-300/70 mb-1">{txt.ch3IfPresent}</div>
                        <div className="text-sm text-white/90">{ANCHOR_IF_PRESENT[language]?.[displayAnchorForReport] || ANCHOR_IF_PRESENT["zh-CN"][displayAnchorForReport]}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/15">
                        <div className="text-xs font-medium text-red-300/70 mb-1">{txt.ch3IfAbsent}</div>
                        <div className="text-sm text-white/90">{ANCHOR_IF_ABSENT[language]?.[displayAnchorForReport] || ANCHOR_IF_ABSENT["zh-CN"][displayAnchorForReport]}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-white/10">
                    <div className="text-sm text-white/80">{txt.structuralCombination}</div>
                  </div>
                )}
              </div>
            )}

            {/* Conflict anchors */}
            {careerAnchorData.conflictAnchors && careerAnchorData.conflictAnchors.length > 0 && (
              <div className="p-4 rounded-xl border-l-4 border-l-amber-400 bg-amber-50 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-sm text-slate-800">{txt.ch3ConflictTitle}</span>
                </div>
                <div className="space-y-2 mb-3">
                  {careerAnchorData.conflictAnchors.map(([anchor1, anchor2]: [string, string], index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-amber-200/50 text-amber-800 text-xs font-medium rounded-md">{getDimensionName(anchor1)}</span>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="px-2.5 py-1 bg-amber-200/50 text-amber-800 text-xs font-medium rounded-md">{getDimensionName(anchor2)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">{txt.ch3ConflictNote}</p>
              </div>
            )}

            {/* Score levels interpretation */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">{txt.ch3ScoreLevels}</span>
              </div>
              <div className="space-y-2">
                {(() => {
                  const sortedEntries2 = Object.entries(careerAnchorData.scores)
                    .sort(([, a], [, b]) => Number(b) - Number(a));
                  const topValue2 = Number(sortedEntries2[0]?.[1]) || 1;
                  return sortedEntries2.map(([key, rawScore]) => {
                    const score = Number(rawScore) || 0;
                    const level = getScoreLevel(score, language);
                    return (
                      <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg" style={{ backgroundColor: `${level.color}08` }}>
                        <span className="text-xs text-slate-600 w-20 truncate font-medium">{getDimensionName(key)}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min((score / topValue2) * 100, 100)}%`, backgroundColor: level.color }} />
                        </div>
                        <span className="text-xs font-bold w-10 text-right" style={{ color: level.color }}>{score}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${level.color}15`, color: level.color }}>
                          {level.label}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* ---- Stage-Specific Development Guide ---- */}
            {(() => {
              const validStage = careerStage as InterpCareerStage | null;
              if (!validStage || validStage === "hr") return null;

              const stageLabel = validStage === "entry" ? txt.ch3StageEntry : validStage === "mid" ? txt.ch3StageMid : txt.ch3StageSenior;
              const displayAnchorKey = displayAnchorForReport;
              const mainScore = Number(careerAnchorData.scores[displayAnchorKey]) || 0;
              const mainInterp = displayAnchorKey ? getStageInterpretation(displayAnchorKey, validStage, mainScore) : null;
              if (!mainInterp) return null;

              return (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-slate-800">{txt.ch3StageTitle}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-5">{stageLabel}</p>

                  {/* Main anchor stage interpretation */}
                  <div className="p-5 rounded-xl mb-4" style={{ background: "linear-gradient(135deg, #0f4c5c 0%, #1a6b7a 100%)" }}>
                    <div className="text-xs font-medium text-white/50 mb-1">{hasCoreAdv ? txt.coreAdvAnchor : txt.noCoreAdv} · {stageLabel}</div>
                    <div className="text-lg font-bold text-white mb-4">{mainAnchorName}</div>

                    {/* Meaning */}
                    <div className="p-3 rounded-lg bg-white/10 mb-3">
                      <div className="text-xs font-medium text-teal-300/70 mb-1">{txt.ch3StageMeaning}</div>
                      <div className="text-sm text-white leading-relaxed">
                        {mainInterp.meaning[language] || mainInterp.meaning["zh-CN"]}
                      </div>
                    </div>

                    {/* Characteristics */}
                    <div className="p-3 rounded-lg bg-white/10 mb-3">
                      <div className="text-xs font-medium text-teal-300/70 mb-2">{txt.ch3StageChars}</div>
                      <ul className="space-y-1.5">
                        {(mainInterp.characteristics[language] || mainInterp.characteristics["zh-CN"]).map((item, charIndex) => (
                          <li key={charIndex} className="flex items-start gap-2 text-sm text-white/90">
                            <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Development & Risk side-by-side */}
                    <div className={cn("grid gap-3", isMobile ? "grid-cols-1" : "grid-cols-2")}>
                      <div className="p-3 rounded-lg bg-emerald-500/15">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Lightbulb className="w-3.5 h-3.5 text-emerald-300/70" />
                          <div className="text-xs font-medium text-emerald-300/70">{txt.ch3StageDev}</div>
                        </div>
                        <div className="text-sm text-white/90 leading-relaxed">
                          {mainInterp.development[language] || mainInterp.development["zh-CN"]}
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-red-500/15">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-300/70" />
                          <div className="text-xs font-medium text-red-300/70">{txt.ch3StageRisk}</div>
                        </div>
                        <div className="text-sm text-white/90 leading-relaxed">
                          {mainInterp.risk[language] || mainInterp.risk["zh-CN"]}
                        </div>
                      </div>
                    </div>
                  </div>


                </div>
              );
            })()}
          </div>

          <div className="border-t border-slate-100 my-8" />
          {/* PDF break marker */}
          <div data-pdf-break aria-hidden="true" className="h-0" />

          {/* ---- 3.2 Ideal Card Deep Interpretation ---- */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Heart className="w-4 h-4" style={{ color: "#e74c6f" }} />
              <h3 className="font-bold text-slate-800">{txt.ch3IdealTitle}</h3>
            </div>

            {/* Work vs Life Orientation */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="w-4 h-4 text-cyan-600" />
                <span className="text-sm font-bold text-slate-700">{txt.ch3OrientTitle}</span>
              </div>
              <div className="relative h-10 rounded-xl overflow-hidden flex">
                <div className="h-full flex items-center justify-center" style={{ backgroundColor: "#e74c6f", width: `${idealCardOrientation.workPercent}%` }}>
                  <span className="text-white text-xs font-bold px-2 whitespace-nowrap">{txt.ch3WorkLabel} {idealCardOrientation.workPercent}%</span>
                </div>
                <div className="h-full flex items-center justify-center" style={{ backgroundColor: "#7c3aed", width: `${idealCardOrientation.lifePercent}%` }}>
                  <span className="text-white text-xs font-bold px-2 whitespace-nowrap">{txt.ch3LifeLabel} {idealCardOrientation.lifePercent}%</span>
                </div>
              </div>
            </div>

            {/* Top 3 Consistency */}
            {top3Consistency && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-slate-700">{txt.ch3ConsistTitle}</span>
                </div>
                <div
                  className="p-4 rounded-xl border-l-4"
                  style={{
                    backgroundColor: top3Consistency === "high" ? "#ecfdf5" : top3Consistency === "moderate" ? "#eff6ff" : "#fefce8",
                    borderLeftColor: top3Consistency === "high" ? "#059669" : top3Consistency === "moderate" ? "#2563eb" : "#ca8a04",
                  }}
                >
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {top3Consistency === "high" ? txt.ch3ConsistHigh : top3Consistency === "moderate" ? txt.ch3ConsistMod : txt.ch3ConsistDiv}
                  </p>
                </div>
              </div>
            )}

            {/* Missing Dimensions */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-red-500" />
                <span className="text-sm font-bold text-slate-700">{txt.ch3MissingTitle}</span>
              </div>
              {missingDimensions.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {missingDimensions.map((category) => {
                      const config = CATEGORY_CONFIG[category];
                      return (
                        <div key={category} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-dashed" style={{ borderColor: config.color, backgroundColor: `${config.bgColor}80` }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: config.color }} />
                          <span className="text-xs font-medium" style={{ color: config.color }}>{getCategoryLabel(category, language)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{txt.ch3MissingNote}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">{txt.ch3AllCovered}</p>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 my-8" />
          {/* PDF break marker */}
          <div data-pdf-break aria-hidden="true" className="h-0" />

          {/* ---- 3.3 Cross Analysis ---- */}
          <div className="flex items-center gap-2 mb-5">
            <LinkIcon className="w-4 h-4 text-purple-600" />
            <h3 className="font-bold text-slate-800">{txt.ch3CrossTitle}</h3>
          </div>

          {alignmentAnalysis && (
            <div className="space-y-6">
              {/* Alignment score */}
              <div
                className="p-5 rounded-xl border-l-4"
                style={{
                  backgroundColor:
                    alignmentAnalysis.alignmentLevel === "high" ? "#ecfdf5" :
                    alignmentAnalysis.alignmentLevel === "moderate" ? "#eff6ff" : "#fefce8",
                  borderLeftColor:
                    alignmentAnalysis.alignmentLevel === "high" ? "#059669" :
                    alignmentAnalysis.alignmentLevel === "moderate" ? "#2563eb" : "#ca8a04",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800">{txt.alignmentTitle}</h3>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-white"
                    style={{
                      backgroundColor:
                        alignmentAnalysis.alignmentLevel === "high" ? "#059669" :
                        alignmentAnalysis.alignmentLevel === "moderate" ? "#2563eb" : "#ca8a04",
                    }}
                  >
                    {alignmentAnalysis.alignmentLevel === "high" ? txt.alignmentHigh :
                     alignmentAnalysis.alignmentLevel === "moderate" ? txt.alignmentModerate : txt.alignmentLow}
                    {" "}({alignmentAnalysis.alignmentPercent}%)
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {alignmentAnalysis.alignmentLevel === "high" ? txt.alignmentHighDesc :
                   alignmentAnalysis.alignmentLevel === "moderate" ? txt.alignmentModerateDesc : txt.alignmentLowDesc}
                </p>
              </div>

              {/* Detailed anchor-category relationship */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <Compass className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-bold text-slate-700">
                    {language === "en" ? `${mainAnchorName} × Life Values` : language === "zh-TW" ? `${mainAnchorName} × 人生價值觀` : `${mainAnchorName} × 人生价值观`}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {alignmentAnalysis.affinity.description[language] || alignmentAnalysis.affinity.description["zh-CN"]}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: CATEGORY_CONFIG[alignmentAnalysis.affinity.primary].bgColor }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_CONFIG[alignmentAnalysis.affinity.primary].color }} />
                    <span className="text-xs font-medium" style={{ color: CATEGORY_CONFIG[alignmentAnalysis.affinity.primary].color }}>
                      {getCategoryLabel(alignmentAnalysis.affinity.primary, language)}: {alignmentAnalysis.primaryCount}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: CATEGORY_CONFIG[alignmentAnalysis.affinity.secondary].bgColor }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_CONFIG[alignmentAnalysis.affinity.secondary].color }} />
                    <span className="text-xs font-medium" style={{ color: CATEGORY_CONFIG[alignmentAnalysis.affinity.secondary].color }}>
                      {getCategoryLabel(alignmentAnalysis.affinity.secondary, language)}: {alignmentAnalysis.secondaryCount}/10
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.section>

        {/* PDF break marker */}
        <div data-pdf-break aria-hidden="true" className="h-0" />

        {/* ===== CHAPTER 4: Action Recommendations ===== */}
        {(() => {
          const actionPlan = getActionPlan(displayAnchorForReport || "TF", language);
          const riskColorMap: Record<string, string> = {
            "低": "#059669", "中": "#d97706", "高": "#dc2626",
            "Low": "#059669", "Medium": "#d97706", "High": "#dc2626",
          };
          return (
            <motion.section
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-1">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800">{txt.chapterFour}</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">{txt.chapterFourDesc}</p>

              {/* Learning Direction */}
              {actionPlan.learning.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-700">{txt.learningTitle}</h3>
                    <span className="text-xs text-slate-400">— {txt.learningDesc}</span>
                  </div>
                  <div className="space-y-3">
                    {actionPlan.learning.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#3b82f6" }}>
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800 mb-1 text-sm">{item.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                            {item.resources && item.resources.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.resources.map((resource, resourceIndex) => (
                                  <span key={resourceIndex} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-md font-medium">
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
              )}

              {/* Career Paths */}
              {actionPlan.paths.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Route className="w-4 h-4 text-purple-600" />
                    <h3 className="text-sm font-bold text-slate-700">{txt.careerPathTitle}</h3>
                    <span className="text-xs text-slate-400">— {txt.careerPathDesc}</span>
                  </div>
                  <div className="space-y-3">
                    {actionPlan.paths.map((path, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-xl border",
                          path.recommended ? "border-purple-200 bg-purple-50/50" : "border-slate-100 bg-slate-50/50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-800 text-sm">{path.title}</h4>
                          {path.recommended && (
                            <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-bold rounded-md flex-shrink-0">
                              {txt.recommended}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">{path.description}</p>
                        <div className="flex flex-wrap gap-4 text-xs">
                          <div>
                            <span className="text-slate-400">{txt.timeline}：</span>
                            <span className="font-medium text-slate-600">{path.timeline}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">{txt.risk}：</span>
                            <span className="font-bold" style={{ color: riskColorMap[path.risk] || "#64748b" }}>
                              {path.risk}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification Steps */}
              {actionPlan.verification.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-700">{txt.verificationTitle}</h3>
                    <span className="text-xs text-slate-400">— {txt.verificationDesc}</span>
                  </div>
                  <div className="space-y-2">
                    {actionPlan.verification.map((step, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-emerald-700">{index + 1}</span>
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-700">{step.action}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{step.purpose}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trade-offs */}
              {actionPlan.tradeoffs.length > 0 && (
                <div className="p-5 rounded-xl border-l-4 border-l-amber-400" style={{ backgroundColor: "#fffbeb" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-slate-800 text-sm">{txt.tradeoffTitle}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">{txt.tradeoffDesc}</p>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    {actionPlan.tradeoffs.map((tradeoff, index) => (
                      <li key={index} className="text-xs text-slate-600">{tradeoff}</li>
                    ))}
                  </ul>
                  <p className="text-sm font-semibold text-slate-700">
                    {txt.tradeoffConclusion}
                  </p>
                </div>
              )}
            </motion.section>
          );
        })()}

        {/* Footer */}
        <div className="text-center py-6 text-xs text-slate-400">
          <p>Career Anchor Assessment + Espresso Card System</p>
        </div>
      </div>
    </div>
  );
}
