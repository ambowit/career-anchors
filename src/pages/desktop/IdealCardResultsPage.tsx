import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Heart,
  Sparkles,
  Trophy,
  BarChart3,
  Compass,
  AlertTriangle,
  Eye,
  Target,
  Briefcase,
  Smile,
  Users,
  Gem,
  Lightbulb,
  Download,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import {
  downloadReportWithCover,
  generateIdealCardReportHTML,
} from "@/lib/exportReport";
import {
  IDEAL_CARDS,
  CATEGORY_CONFIG,
  getCardLabel,
  getCategoryLabel,
  type IdealCard,
  type CardCategory,
} from "@/data/idealCards";
import { cn } from "@/lib/utils";

interface IdealCardResult {
  rank: number;
  cardId: number;
  category: CardCategory;
  label: string;
  labelEn: string;
}

// Category display config with icons
const CATEGORY_DISPLAY: Record<
  CardCategory,
  { icon: typeof Heart; description: Record<string, string> }
> = {
  intrinsic: {
    icon: Gem,
    description: {
      "zh-CN": "追求内心的满足感、意义感和自我实现",
      "zh-TW": "追求內心的滿足感、意義感和自我實現",
      en: "Seeking inner fulfillment, meaning, and self-actualization",
    },
  },
  lifestyle: {
    icon: Smile,
    description: {
      "zh-CN": "注重生活品质、身心健康和生活节奏",
      "zh-TW": "注重生活品質、身心健康和生活節奏",
      en: "Focusing on quality of life, well-being, and life rhythm",
    },
  },
  interpersonal: {
    icon: Users,
    description: {
      "zh-CN": "重视人际关系、社会连接和情感归属",
      "zh-TW": "重視人際關係、社會連接和情感歸屬",
      en: "Valuing relationships, social connection, and emotional belonging",
    },
  },
  material: {
    icon: Briefcase,
    description: {
      "zh-CN": "关注物质保障、经济独立和外在成就",
      "zh-TW": "關注物質保障、經濟獨立和外在成就",
      en: "Focusing on material security, financial independence, and external achievement",
    },
  },
};

// Work vs Life orientation mapping
const WORK_CATEGORIES: CardCategory[] = ["intrinsic", "material"];
const LIFE_CATEGORIES: CardCategory[] = ["lifestyle", "interpersonal"];

export default function IdealCardResultsPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const [results, setResults] = useState<IdealCardResult[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { user, profile } = useAuth();
  const { careerStage } = useTestAuth();

  useEffect(() => {
    const storedData = sessionStorage.getItem("idealCardResults");
    if (!storedData) {
      navigate("/ideal-card-test");
      return;
    }
    setResults(JSON.parse(storedData));
  }, [navigate]);

  // Category distribution analysis
  const categoryDistribution = useMemo(() => {
    const distribution: Record<CardCategory, number> = {
      intrinsic: 0,
      lifestyle: 0,
      interpersonal: 0,
      material: 0,
    };
    results.forEach((result) => {
      distribution[result.category]++;
    });
    return distribution;
  }, [results]);

  // Work vs Life orientation
  const orientation = useMemo(() => {
    const workCount = results.filter((r) =>
      WORK_CATEGORIES.includes(r.category)
    ).length;
    const lifeCount = results.filter((r) =>
      LIFE_CATEGORIES.includes(r.category)
    ).length;
    const total = workCount + lifeCount;
    return {
      workPercent: total > 0 ? Math.round((workCount / total) * 100) : 50,
      lifePercent: total > 0 ? Math.round((lifeCount / total) * 100) : 50,
      workCount,
      lifeCount,
    };
  }, [results]);

  // Top 3 consistency analysis
  const consistencyAnalysis = useMemo(() => {
    if (results.length < 3) return null;
    const topThree = results.slice(0, 3);
    const categories = topThree.map((r) => r.category);
    const uniqueCategories = new Set(categories);

    if (uniqueCategories.size === 1) {
      return {
        type: "high" as const,
        message: {
          "zh-CN": `你的前三名卡片都属于「${getCategoryLabel(categories[0], language)}」，表现出高度一致的价值取向。这说明你对这个维度有非常清晰的追求和认知。`,
          "zh-TW": `你的前三名卡片都屬於「${getCategoryLabel(categories[0], language)}」，表現出高度一致的價值取向。這說明你對這個維度有非常清晰的追求和認知。`,
          en: `Your top 3 cards all belong to "${getCategoryLabel(categories[0], language)}", showing a highly consistent value orientation. This indicates a very clear pursuit in this dimension.`,
        },
      };
    } else if (uniqueCategories.size === 2) {
      return {
        type: "moderate" as const,
        message: {
          "zh-CN": "你的前三名卡片集中在两个类别，显示出较为聚焦的价值取向。你的核心价值观有明确的主线，同时兼顾了不同维度的需求。",
          "zh-TW": "你的前三名卡片集中在兩個類別，顯示出較為聚焦的價值取向。你的核心價值觀有明確的主線，同時兼顧了不同維度的需求。",
          en: "Your top 3 cards are concentrated in two categories, showing a fairly focused value orientation with a clear main thread while balancing different dimensions.",
        },
      };
    } else {
      return {
        type: "diverse" as const,
        message: {
          "zh-CN": "你的前三名卡片分布在三个不同类别，展现了多元化的价值追求。这意味着你需要在多个维度上都得到满足，才能感到真正的幸福。",
          "zh-TW": "你的前三名卡片分佈在三個不同類別，展現了多元化的價值追求。這意味著你需要在多個維度上都得到滿足，才能感到真正的幸福。",
          en: "Your top 3 cards span three different categories, revealing diverse value pursuits. This means you need fulfillment across multiple dimensions to feel truly happy.",
        },
      };
    }
  }, [results, language]);

  // Missing dimensions analysis
  const missingDimensions = useMemo(() => {
    const missing: CardCategory[] = [];
    (Object.keys(categoryDistribution) as CardCategory[]).forEach(
      (category) => {
        if (categoryDistribution[category] === 0) {
          missing.push(category);
        }
      }
    );
    return missing;
  }, [categoryDistribution]);

  // Texts
  const texts = useMemo(
    () => ({
      "zh-CN": {
        pageTitle: "理想人生卡解读",
        pageSubtitle: "基于焦点解决牌卡技术的价值观深度分析",
        topThreeTitle: "你最重要的三个人生价值",
        topThreeDesc:
          "这三张卡片代表了你内心最深处的渴望和追求，它们是你做人生重要决策时的指南针。",
        distributionTitle: "四大类别分布",
        distributionDesc:
          "你选出的10张卡片在四个价值维度上的分布情况，反映了你的整体价值倾向。",
        orientationTitle: "工作取向 vs 生活取向",
        orientationDesc:
          "通过分析你选择的卡片类别，判断你更倾向于「工作取向」还是「生活取向」。",
        workLabel: "工作取向",
        lifeLabel: "生活取向",
        consistencyTitle: "价值观一致性分析",
        missingTitle: "被忽略的维度",
        missingDesc:
          "这些维度在你的选择中完全缺失。它们可能是你目前不太在意的，也可能是被无意识忽略的盲区。",
        missingAdvice: "建议你思考：这些维度是否真的对你不重要？还是你习惯性地忽视了它们？有时候，被忽略的需求反而是导致长期不满足感的根源。",
        allCoveredTitle: "全面的价值覆盖",
        allCoveredDesc:
          "你的10张卡片覆盖了全部四个维度，说明你对不同类型的人生价值都有关注。这是一种平衡的价值取向。",
        actionTitle: "行动建议",
        viewReport: "查看完整报告",
        startCareerAnchor: "重新做职业锚测试",
        rankLabel: "第{rank}名",
      },
      "zh-TW": {
        pageTitle: "理想人生卡解讀",
        pageSubtitle: "基於焦點解決牌卡技術的價值觀深度分析",
        topThreeTitle: "你最重要的三個人生價值",
        topThreeDesc:
          "這三張卡片代表了你內心最深處的渴望和追求，它們是你做人生重要決策時的指南針。",
        distributionTitle: "四大類別分佈",
        distributionDesc:
          "你選出的10張卡片在四個價值維度上的分佈情況，反映了你的整體價值傾向。",
        orientationTitle: "工作取向 vs 生活取向",
        orientationDesc:
          "透過分析你選擇的卡片類別，判斷你更傾向於「工作取向」還是「生活取向」。",
        workLabel: "工作取向",
        lifeLabel: "生活取向",
        consistencyTitle: "價值觀一致性分析",
        missingTitle: "被忽略的維度",
        missingDesc:
          "這些維度在你的選擇中完全缺失。它們可能是你目前不太在意的，也可能是被無意識忽略的盲區。",
        missingAdvice: "建議你思考：這些維度是否真的對你不重要？還是你習慣性地忽視了它們？有時候，被忽略的需求反而是導致長期不滿足感的根源。",
        allCoveredTitle: "全面的價值覆蓋",
        allCoveredDesc:
          "你的10張卡片覆蓋了全部四個維度，說明你對不同類型的人生價值都有關注。這是一種平衡的價值取向。",
        actionTitle: "行動建議",
        viewReport: "查看完整報告",
        startCareerAnchor: "重新做職業錨測試",
        rankLabel: "第{rank}名",
      },
      en: {
        pageTitle: "Ideal Life Card Interpretation",
        pageSubtitle:
          "In-depth value analysis based on Solution-Focused Card Technique",
        topThreeTitle: "Your Three Most Important Life Values",
        topThreeDesc:
          "These three cards represent your deepest desires and pursuits — they are the compass for your most important life decisions.",
        distributionTitle: "Category Distribution",
        distributionDesc:
          "How your 10 selected cards are distributed across four value dimensions, reflecting your overall value orientation.",
        orientationTitle: "Work vs Life Orientation",
        orientationDesc:
          'Analyzing your card categories to determine whether you lean more toward "career achievement" or "quality of life".',
        workLabel: "Work Orientation",
        lifeLabel: "Life Orientation",
        consistencyTitle: "Value Consistency Analysis",
        missingTitle: "Overlooked Dimensions",
        missingDesc:
          "These dimensions are completely absent from your selections. They may be things you currently don't prioritize, or blind spots you've unconsciously overlooked.",
        missingAdvice:
          "Consider: Are these dimensions truly unimportant to you? Or have you habitually ignored them? Sometimes, overlooked needs are the root cause of long-term dissatisfaction.",
        allCoveredTitle: "Comprehensive Value Coverage",
        allCoveredDesc:
          "Your 10 cards cover all four dimensions, indicating attention to different types of life values. This shows a balanced value orientation.",
        actionTitle: "Action Recommendations",
        viewReport: "View Full Report",
        startCareerAnchor: "Retake Career Anchor Test",
        rankLabel: "#{rank}",
      },
    }),
    []
  );

  const txt = texts[language] || texts["zh-CN"];

  // Compute topThree before early return to keep hooks order stable
  const topThree = useMemo(() => results.slice(0, 3), [results]);

  // Action recommendations based on analysis — MUST be before early return
  const actionItems = useMemo(() => {
    const items: { icon: typeof Heart; title: Record<string, string>; desc: Record<string, string> }[] = [];

    // Based on top card category
    if (topThree.length > 0) {
      const topCategory = topThree[0].category;
      if (topCategory === "intrinsic") {
        items.push({
          icon: Gem,
          title: { "zh-CN": "寻找意义感", "zh-TW": "尋找意義感", en: "Seek Meaning" },
          desc: {
            "zh-CN": "你最看重内在价值。在职业选择中，优先考虑工作是否能带来成就感和自我实现，而非仅看薪资。",
            "zh-TW": "你最看重內在價值。在職業選擇中，優先考慮工作是否能帶來成就感和自我實現，而非僅看薪資。",
            en: "You value intrinsic meaning most. In career choices, prioritize whether the work brings fulfillment and self-actualization, not just salary.",
          },
        });
      } else if (topCategory === "interpersonal") {
        items.push({
          icon: Users,
          title: { "zh-CN": "珍惜关系", "zh-TW": "珍惜關係", en: "Cherish Relationships" },
          desc: {
            "zh-CN": "人际关系是你的核心驱动力。确保你的生活和工作环境能提供深度的人际连接和情感支持。",
            "zh-TW": "人際關係是你的核心驅動力。確保你的生活和工作環境能提供深度的人際連接和情感支持。",
            en: "Relationships are your core driver. Ensure your life and work environment provide deep interpersonal connections and emotional support.",
          },
        });
      } else if (topCategory === "lifestyle") {
        items.push({
          icon: Smile,
          title: { "zh-CN": "守护生活品质", "zh-TW": "守護生活品質", en: "Guard Quality of Life" },
          desc: {
            "zh-CN": "生活方式对你至关重要。在追求事业时，不要牺牲身心健康和生活节奏，找到可持续的平衡点。",
            "zh-TW": "生活方式對你至關重要。在追求事業時，不要犧牲身心健康和生活節奏，找到可持續的平衡點。",
            en: "Lifestyle matters deeply to you. Don't sacrifice well-being and life rhythm for career advancement — find a sustainable balance.",
          },
        });
      } else {
        items.push({
          icon: Briefcase,
          title: { "zh-CN": "规划物质基础", "zh-TW": "規劃物質基礎", en: "Plan Material Foundation" },
          desc: {
            "zh-CN": "物质保障是你的重要驱动力。建立清晰的财务规划和职业发展路径，为你的目标打下坚实基础。",
            "zh-TW": "物質保障是你的重要驅動力。建立清晰的財務規劃和職業發展路徑，為你的目標打下堅實基礎。",
            en: "Material security drives you significantly. Build clear financial plans and career paths to lay a solid foundation for your goals.",
          },
        });
      }
    }

    // Orientation-based advice
    if (orientation.workPercent > 70) {
      items.push({
        icon: AlertTriangle,
        title: { "zh-CN": "注意工作与生活平衡", "zh-TW": "注意工作與生活平衡", en: "Watch Work-Life Balance" },
        desc: {
          "zh-CN": "你的价值取向明显偏向工作成就。提醒自己关注生活品质和人际关系，避免长期的单一追求导致倦怠。",
          "zh-TW": "你的價值取向明顯偏向工作成就。提醒自己關注生活品質和人際關係，避免長期的單一追求導致倦怠。",
          en: "Your values lean strongly toward career achievement. Remember to attend to quality of life and relationships to avoid burnout.",
        },
      });
    } else if (orientation.lifePercent > 70) {
      items.push({
        icon: Target,
        title: { "zh-CN": "设定职业目标", "zh-TW": "設定職業目標", en: "Set Career Goals" },
        desc: {
          "zh-CN": "你更注重生活品质，这很好。同时考虑设定清晰的职业目标，确保经济基础能支撑你理想的生活方式。",
          "zh-TW": "你更注重生活品質，這很好。同時考慮設定清晰的職業目標，確保經濟基礎能支撐你理想的生活方式。",
          en: "You focus more on quality of life, which is great. Also consider setting clear career goals to ensure financial support for your ideal lifestyle.",
        },
      });
    }

    // Missing dimension advice
    if (missingDimensions.length > 0) {
      items.push({
        icon: Eye,
        title: { "zh-CN": "关注盲区", "zh-TW": "關注盲區", en: "Address Blind Spots" },
        desc: {
          "zh-CN": `你的选择中缺少「${missingDimensions.map((d) => getCategoryLabel(d, language)).join("、")}」维度。定期反思这些被忽略的需求是否在影响你的幸福感。`,
          "zh-TW": `你的選擇中缺少「${missingDimensions.map((d) => getCategoryLabel(d, language)).join("、")}」維度。定期反思這些被忽略的需求是否在影響你的幸福感。`,
          en: `Your selections are missing the "${missingDimensions.map((d) => getCategoryLabel(d, "en")).join(", ")}" dimension(s). Periodically reflect on whether these overlooked needs affect your well-being.`,
        },
      });
    }

    return items;
  }, [topThree, orientation, missingDimensions, language]);

  // Download PDF with professional cover
  const handleDownloadPdf = useCallback(async () => {
    if (results.length === 0) return;
    setIsExporting(true);
    try {
      const userId = user?.id || "anonymous";
      const userName = profile?.full_name || "";

      const reportHtml = generateIdealCardReportHTML(
        {
          rankedCards: results.map((r) => ({
            rank: r.rank,
            cardId: r.cardId,
            category: r.category,
          })),
          userName: userName || undefined,
          createdAt: new Date().toLocaleString(
            language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN"
          ),
        },
        language
      );

      await downloadReportWithCover(
        reportHtml,
        {
          reportType: "ideal_card",
          userName: userName || (language === "en" ? "User" : "用戶"),
          workExperienceYears: null,
          careerStage: careerStage || "mid",
          reportVersion: "professional",
          language,
          userId,
        },
        `ideal-card-report-${new Date().toISOString().slice(0, 10)}.pdf`
      );

      toast.success(
        language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载"
      );
    } catch {
      toast.error(
        language === "en" ? "Download failed" : language === "zh-TW" ? "下載失敗" : "下载失败"
      );
    } finally {
      setIsExporting(false);
    }
  }, [results, language, user, profile, careerStage]);

  const itemVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
      };

  const containerVariants = prefersReducedMotion
    ? {}
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.12, delayChildren: 0.15 },
        },
      };

  if (results.length === 0) return null;

  const medalColors = [
    { bg: "#1a3a5c", text: "#ffffff", ring: "#1a3a5c" },
    { bg: "#1a3a5c", text: "#ffffff", ring: "#1a3a5c" },
    { bg: "#1a3a5c", text: "#ffffff", ring: "#1a3a5c" },
  ];

  // Career anchor data check
  const hasCareerAnchor = !!sessionStorage.getItem("assessmentResults");

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(340, 30%, 97%)" }}>
      {/* Hero Header */}
      <motion.section
        className="relative overflow-hidden py-16 px-6"
        style={{
          background: "linear-gradient(135deg, #fce4ec 0%, #f3e5f5 50%, #e8eaf6 100%)",
        }}
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, #000 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: "rgba(231,76,111,0.1)" }}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#e74c6f" }} />
            <span className="text-sm font-medium" style={{ color: "#e74c6f" }}>
              {txt.pageSubtitle}
            </span>
          </motion.div>
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-slate-800 mb-4"
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 10 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {txt.pageTitle}
          </motion.h1>
        </div>
      </motion.section>

      <div className={cn("mx-auto px-4 md:px-6", isMobile ? "max-w-full" : "max-w-5xl")}>
        <motion.div
          className="space-y-8 -mt-6"
          variants={prefersReducedMotion ? undefined : containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* === TOP 3 CARDS === */}
          <motion.section
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5" style={{ color: "#FFD700" }} />
              <h2 className="text-xl font-bold text-slate-800">{txt.topThreeTitle}</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">{txt.topThreeDesc}</p>

            <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-3")}>
              {topThree.map((result, index) => {
                const card = IDEAL_CARDS.find((c) => c.id === result.cardId);
                if (!card) return null;
                const categoryConfig = CATEGORY_CONFIG[result.category];
                const medal = medalColors[index];
                const label = getCardLabel(card, language);

                return (
                  <motion.div
                    key={result.cardId}
                    className="relative rounded-xl border-2 p-5 text-center"
                    style={{
                      backgroundColor: categoryConfig.bgColor,
                      borderColor: categoryConfig.borderColor,
                    }}
                    initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.9 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.15 }}
                  >
                    {/* Medal badge */}
                    <div
                      className="mx-auto w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mb-3 shadow-md"
                      style={{ background: medal.bg, color: medal.text }}
                    >
                      {index + 1}
                    </div>
                    <div className="font-bold text-lg text-slate-800 mb-2">{label}</div>
                    <div className="flex items-center justify-center gap-1.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: categoryConfig.color }}
                      />
                      <span className="text-xs font-medium" style={{ color: categoryConfig.color }}>
                        {getCategoryLabel(result.category, language)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* === CATEGORY DISTRIBUTION === */}
          <motion.section
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5" style={{ color: "#7c3aed" }} />
              <h2 className="text-xl font-bold text-slate-800">{txt.distributionTitle}</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">{txt.distributionDesc}</p>

            <div className="space-y-4">
              {(Object.entries(categoryDistribution) as [CardCategory, number][]).map(
                ([category, count]) => {
                  const config = CATEGORY_CONFIG[category];
                  const display = CATEGORY_DISPLAY[category];
                  const IconComponent = display.icon;
                  const percentage = Math.round((count / 10) * 100);

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" style={{ color: config.color }} />
                          <span className="text-sm font-semibold text-slate-700">
                            {getCategoryLabel(category, language)}
                          </span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: config.color }}>
                          {count} / 10
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: config.color }}
                          initial={prefersReducedMotion ? { width: `${percentage}%` } : { width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-xs text-slate-400">
                        {display.description[language] || display.description["zh-CN"]}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          </motion.section>

          {/* === WORK VS LIFE ORIENTATION === */}
          <motion.section
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex items-center gap-3 mb-2">
              <Compass className="w-5 h-5" style={{ color: "#0891b2" }} />
              <h2 className="text-xl font-bold text-slate-800">{txt.orientationTitle}</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">{txt.orientationDesc}</p>

            <div className="space-y-4">
              {/* Visual bar */}
              <div className="relative h-12 rounded-xl overflow-hidden flex">
                <motion.div
                  className="h-full flex items-center justify-center"
                  style={{ backgroundColor: "#e74c6f" }}
                  initial={prefersReducedMotion ? { width: `${orientation.workPercent}%` } : { width: 0 }}
                  animate={{ width: `${orientation.workPercent}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  <span className="text-white text-sm font-bold px-2 whitespace-nowrap">
                    {txt.workLabel} {orientation.workPercent}%
                  </span>
                </motion.div>
                <motion.div
                  className="h-full flex items-center justify-center"
                  style={{ backgroundColor: "#7c3aed" }}
                  initial={prefersReducedMotion ? { width: `${orientation.lifePercent}%` } : { width: 0 }}
                  animate={{ width: `${orientation.lifePercent}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                >
                  <span className="text-white text-sm font-bold px-2 whitespace-nowrap">
                    {txt.lifeLabel} {orientation.lifePercent}%
                  </span>
                </motion.div>
              </div>

              {/* Legend */}
              <div className="flex justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#e74c6f" }} />
                  <span>
                    {language === "en"
                      ? "Intrinsic Values + Material Conditions"
                      : language === "zh-TW"
                      ? "內在價值 + 物質條件"
                      : "内在价值 + 物质条件"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#7c3aed" }} />
                  <span>
                    {language === "en"
                      ? "Lifestyle + Interpersonal"
                      : language === "zh-TW"
                      ? "生活方式 + 人際關係"
                      : "生活方式 + 人际关系"}
                  </span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* === CONSISTENCY ANALYSIS === */}
          {consistencyAnalysis && (
            <motion.section
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
              variants={prefersReducedMotion ? undefined : itemVariants}
            >
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5" style={{ color: "#059669" }} />
                <h2 className="text-xl font-bold text-slate-800">{txt.consistencyTitle}</h2>
              </div>
              <div
                className="mt-4 p-4 rounded-xl"
                style={{
                  backgroundColor:
                    consistencyAnalysis.type === "high"
                      ? "#ecfdf5"
                      : consistencyAnalysis.type === "moderate"
                      ? "#eff6ff"
                      : "#fefce8",
                  borderLeft: `4px solid ${
                    consistencyAnalysis.type === "high"
                      ? "#059669"
                      : consistencyAnalysis.type === "moderate"
                      ? "#2563eb"
                      : "#ca8a04"
                  }`,
                }}
              >
                <p className="text-sm text-slate-700 leading-relaxed">
                  {consistencyAnalysis.message[language] || consistencyAnalysis.message["zh-CN"]}
                </p>
              </div>
            </motion.section>
          )}

          {/* === MISSING DIMENSIONS === */}
          <motion.section
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex items-center gap-3 mb-2">
              <Eye className="w-5 h-5" style={{ color: "#dc2626" }} />
              <h2 className="text-xl font-bold text-slate-800">
                {missingDimensions.length > 0 ? txt.missingTitle : txt.allCoveredTitle}
              </h2>
            </div>
            {missingDimensions.length > 0 ? (
              <div className="space-y-4 mt-4">
                <p className="text-sm text-slate-500">{txt.missingDesc}</p>
                <div className="flex flex-wrap gap-3">
                  {missingDimensions.map((category) => {
                    const config = CATEGORY_CONFIG[category];
                    return (
                      <div
                        key={category}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed"
                        style={{ borderColor: config.color, backgroundColor: `${config.bgColor}80` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="text-sm font-medium" style={{ color: config.color }}>
                          {getCategoryLabel(category, language)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border-l-4 border-amber-400">
                  <p className="text-sm text-amber-800 leading-relaxed">{txt.missingAdvice}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mt-2">{txt.allCoveredDesc}</p>
            )}
          </motion.section>

          {/* === COMPLETE TOP 10 LIST === */}
          <motion.section
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-5 h-5" style={{ color: "#e74c6f" }} />
              <h2 className="text-xl font-bold text-slate-800">
                {language === "en" ? "Your Complete Top 10" : language === "zh-TW" ? "你的完整排序" : "你的完整排序"}
              </h2>
            </div>
            <div className="space-y-2">
              {results.map((result) => {
                const card = IDEAL_CARDS.find((c) => c.id === result.cardId);
                if (!card) return null;
                const categoryConfig = CATEGORY_CONFIG[result.category];
                const label = getCardLabel(card, language);

                return (
                  <div
                    key={result.cardId}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ backgroundColor: categoryConfig.bgColor }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 text-white shadow-sm"
                      style={{ backgroundColor: "#1a3a5c" }}
                    >
                      {result.rank}
                    </div>
                    <span className="text-sm font-semibold text-slate-800 flex-1">{label}</span>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: categoryConfig.color }}
                      />
                      <span className="text-xs" style={{ color: categoryConfig.color }}>
                        {getCategoryLabel(result.category, language)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* === ACTION RECOMMENDATIONS === */}
          <motion.section
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-5 h-5" style={{ color: "#f59e0b" }} />
              <h2 className="text-xl font-bold text-slate-800">{txt.actionTitle}</h2>
            </div>
            <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-2")}>
              {actionItems.map((item, index) => {
                const IconComp = item.icon;
                return (
                  <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <IconComp className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-bold text-slate-700">
                        {item.title[language] || item.title["zh-CN"]}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {item.desc[language] || item.desc["zh-CN"]}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* === BOTTOM ACTIONS === */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 pt-4 pb-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            {/* Download PDF */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-60"
              style={{ backgroundColor: "#1a3a5c" }}
            >
              {isExporting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              {isExporting
                ? (language === "en" ? "Generating..." : language === "zh-TW" ? "生成中..." : "生成中...")
                : (language === "en" ? "Download PDF" : language === "zh-TW" ? "下載報告" : "下载报告")}
            </button>

            {hasCareerAnchor && (
              <button
                onClick={() => navigate("/comprehensive-report")}
                className="flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.005] active:scale-[0.995]"
                style={{
                  background: "linear-gradient(135deg, #e74c6f 0%, #7c3aed 100%)",
                }}
              >
                <BarChart3 className="w-5 h-5" />
                {txt.viewReport}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {!hasCareerAnchor && (
              <button
                onClick={() => navigate("/assessment")}
                className="flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: "#e74c6f" }}
              >
                <Compass className="w-5 h-5" />
                {txt.startCareerAnchor}
              </button>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
