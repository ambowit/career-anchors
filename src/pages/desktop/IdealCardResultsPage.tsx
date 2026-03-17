import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
    Heart,
  Sparkles,
  Trophy,
  BarChart3,
  Compass,
  Eye,
  Briefcase,
  Smile,
  Users,
  Gem,
  Download,
  BookOpen,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/hooks/useAuth";
import { useTestAuth } from "@/hooks/useTestAuth";
import { downloadLatestIdealCardReport } from "@/lib/reportIdealCardDownload";

import { supabase } from "@/integrations/supabase/client";
import {
  IDEAL_CARDS,
  CATEGORY_CONFIG,
  getCardLabel,
  getCategoryLabel,
  type CardCategory,
} from "@/data/idealCards";
import { cn, resolveUserDisplayName, resolveWorkExperienceYears } from "@/lib/utils";
import { IdealCardReportCard } from "@/components/desktop/IdealCardReportCard";
import { MISSING_DIMENSION_TEXTS, REFLECTION_HEADER } from "@/data/missingDimensionTexts";

/* ─────────────────────── Types ─────────────────────── */

interface IdealCardResult {
  rank: number;
  cardId: number;
  category: CardCategory;
  label: string;
  labelEn: string;
}

interface QuadrantContent {
  external: string;
  internal: string;
  career: string;
  relationship: string;
}

/* ─────────────────────── Constants ─────────────────────── */

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

const WORK_CATEGORIES: CardCategory[] = ["intrinsic", "material"];
const LIFE_CATEGORIES: CardCategory[] = ["lifestyle", "interpersonal"];

const SPECTRUM_DISPLAY = {
  career: {
    color: "#1C2857",
    bgLight: "#e8edf5",
    label: { "zh-CN": "职涯取向", "zh-TW": "職涯取向", en: "Career-Oriented" },
  },
  neutral: {
    color: "#8B6914",
    bgLight: "#faf5e4",
    label: { "zh-CN": "中性平衡", "zh-TW": "中性平衡", en: "Neutral" },
  },
  lifestyle: {
    color: "#1B6B3A",
    bgLight: "#e6f5ec",
    label: { "zh-CN": "生活取向", "zh-TW": "生活取向", en: "Lifestyle-Oriented" },
  },
} as const;

const MEDAL_STYLES = [
  {
    gradient: "linear-gradient(145deg, #FFD700 0%, #F5C400 40%, #FFA000 100%)",
    shadowColor: "rgba(255,215,0,0.5)",
    ringGlow: "0 0 16px rgba(255,215,0,0.35), 0 0 0 3px rgba(255,215,0,0.2)",
    rankBg: "linear-gradient(145deg, #FFD700, #E6B800)",
    rankShadow: "0 3px 10px rgba(255,193,7,0.45)",
  },
  {
    gradient: "linear-gradient(145deg, #FFD700 0%, #F5C400 40%, #FFA000 100%)",
    shadowColor: "rgba(255,215,0,0.5)",
    ringGlow: "0 0 16px rgba(255,215,0,0.35), 0 0 0 3px rgba(255,215,0,0.2)",
    rankBg: "linear-gradient(145deg, #FFD700, #E6B800)",
    rankShadow: "0 3px 10px rgba(255,193,7,0.45)",
  },
  {
    gradient: "linear-gradient(145deg, #FFD700 0%, #F5C400 40%, #FFA000 100%)",
    shadowColor: "rgba(255,215,0,0.5)",
    ringGlow: "0 0 16px rgba(255,215,0,0.35), 0 0 0 3px rgba(255,215,0,0.2)",
    rankBg: "linear-gradient(145deg, #FFD700, #E6B800)",
    rankShadow: "0 3px 10px rgba(255,193,7,0.45)",
  },
];

/* ─────────────────────── Component ─────────────────────── */

export default function IdealCardResultsPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const { user, profile } = useAuth();
  const { careerStage } = useTestAuth();

  const [results, setResults] = useState<IdealCardResult[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Report data from DB (spectrum + quadrant)
  const [spectrumMap, setSpectrumMap] = useState<Record<number, "career" | "neutral" | "lifestyle">>({});
  const [quadrantMap, setQuadrantMap] = useState<Record<number, QuadrantContent>>({});

  // AI card descriptions
  const [cardDescriptions, setCardDescriptions] = useState<Record<number, string>>({});
  const [isGeneratingDescriptions, setIsGeneratingDescriptions] = useState(false);

  /* ── Load results from sessionStorage ── */
  useEffect(() => {
    const storedData = sessionStorage.getItem("idealCardResults");
    if (!storedData) {
      navigate("/ideal-card-test");
      return;
    }
    setResults(JSON.parse(storedData));
  }, [navigate]);

  /* ── Fetch spectrum_type + quadrant content from DB ── */
  useEffect(() => {
    if (results.length === 0) return;

    const fetchReportData = async () => {
      const cardSortOrders = results.map((r) => r.cardId);

      const { data: lifeCards } = await supabase
        .from("life_cards")
        .select("id, sort_order, spectrum_type")
        .in("sort_order", cardSortOrders);

      if (!lifeCards || lifeCards.length === 0) return;

      const newSpectrumMap: Record<number, "career" | "neutral" | "lifestyle"> = {};
      const sortOrderToUuid: Record<number, string> = {};

      for (const lifeCard of lifeCards) {
        const sortOrder = lifeCard.sort_order as number;
        sortOrderToUuid[sortOrder] = lifeCard.id as string;
        if (lifeCard.spectrum_type) {
          newSpectrumMap[sortOrder] = lifeCard.spectrum_type as "career" | "neutral" | "lifestyle";
        }
      }
      setSpectrumMap(newSpectrumMap);

      const uuids = Object.values(sortOrderToUuid);
      const { data: quadrants } = await supabase
        .from("life_card_quadrant_contents")
        .select("card_id, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked")
        .in("card_id", uuids)
        .eq("language", language);

      if (quadrants && quadrants.length > 0) {
        const uuidToSort: Record<string, number> = {};
        for (const [sortOrderStr, uuid] of Object.entries(sortOrderToUuid)) {
          uuidToSort[uuid] = Number(sortOrderStr);
        }

        const newQuadrantMap: Record<number, QuadrantContent> = {};
        for (const quadrant of quadrants) {
          const sortOrder = uuidToSort[quadrant.card_id as string];
          if (sortOrder === undefined) continue;
          const hasContent =
            quadrant.quadrant_external || quadrant.quadrant_internal || quadrant.quadrant_career || quadrant.quadrant_relationship;
          if (!hasContent) continue;
          newQuadrantMap[sortOrder] = {
            external: (quadrant.quadrant_external as string) || "",
            internal: (quadrant.quadrant_internal as string) || "",
            career: (quadrant.quadrant_career as string) || "",
            relationship: (quadrant.quadrant_relationship as string) || "",
          };
        }
        setQuadrantMap(newQuadrantMap);
      }
    };

    fetchReportData();
  }, [results, language]);

  /* ── Auto-generate AI card descriptions ── */
  useEffect(() => {
    if (Object.keys(quadrantMap).length === 0) return;
    if (Object.keys(cardDescriptions).length > 0) return;
    if (isGeneratingDescriptions) return;

    const generateDescriptions = async () => {
      setIsGeneratingDescriptions(true);
      try {
        const cardsForAI = results.map((r) => ({
          rank: r.rank,
          card_name: r.label,
          category: r.category,
          quadrant: quadrantMap[r.cardId],
        }));

        const { data, error } = await supabase.functions.invoke("ideal-card-analysis", {
          body: {
            mode: "card_descriptions",
            cards: cardsForAI,
            language,
          },
        });

        if (error) throw error;
        if (data?.descriptions) {
          const descMap: Record<number, string> = {};
          for (const desc of data.descriptions as { rank: number; description: string }[]) {
            const result = results.find((r) => r.rank === desc.rank);
            if (result) descMap[result.cardId] = desc.description;
          }
          setCardDescriptions(descMap);
        }
      } catch (err) {
        console.error("Failed to generate card descriptions:", err);
      } finally {
        setIsGeneratingDescriptions(false);
      }
    };

    generateDescriptions();
  }, [quadrantMap]);

  /* ── Category distribution ── */
  const categoryDistribution = useMemo(() => {
    const distribution: Record<CardCategory, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
    results.forEach((r) => { distribution[r.category]++; });
    return distribution;
  }, [results]);

  /* ── Work vs Life orientation ── */
  const orientation = useMemo(() => {
    const workCount = results.filter((r) => WORK_CATEGORIES.includes(r.category)).length;
    const lifeCount = results.filter((r) => LIFE_CATEGORIES.includes(r.category)).length;
    const total = workCount + lifeCount;
    return {
      workPercent: total > 0 ? Math.round((workCount / total) * 100) : 50,
      lifePercent: total > 0 ? Math.round((lifeCount / total) * 100) : 50,
      workCount,
      lifeCount,
    };
  }, [results]);

  /* ── Spectrum groups ── */
  const spectrumGroups = useMemo(() => {
    const groups: Record<string, { cardId: number; label: string }[]> = { career: [], neutral: [], lifestyle: [] };
    results.forEach((r) => {
      const specType = spectrumMap[r.cardId];
      if (specType && groups[specType]) {
        const card = IDEAL_CARDS.find((c) => c.id === r.cardId);
        groups[specType].push({ cardId: r.cardId, label: card ? getCardLabel(card, language) : r.label });
      }
    });
    return groups;
  }, [results, spectrumMap, language]);

  const spectrumTotal = useMemo(() => {
    return spectrumGroups.career.length + spectrumGroups.neutral.length + spectrumGroups.lifestyle.length;
  }, [spectrumGroups]);

  /* ── Missing dimensions ── */
  const missingDimensions = useMemo(() => {
    return (Object.keys(categoryDistribution) as CardCategory[]).filter(
      (category) => categoryDistribution[category] === 0
    );
  }, [categoryDistribution]);

  /* ── Top 3 shorthand ── */
  const topThree = useMemo(() => results.slice(0, 3), [results]);

  /* ── Texts ── */
  const texts = useMemo(
    () => ({
      "zh-CN": {
        pageTitle: "理想人生卡解读报告",
        pageSubtitle: "基于焦点解决牌卡技术的价值观深度分析",
        topThreeTitle: "排名前三的职涯价值卡",
        topThreeDesc: "这三张卡片代表了你内心最深处的渴望和追求，它们是你做人生重要决策时的指南针。",
        distributionTitle: "四大类别分布",
        distributionDesc: "你选出的10张卡片在四个价值维度上的分布情况，反映了你的整体价值倾向。",
        orientationTitle: "职涯取向 vs 生活取向",
        orientationDesc: "透过分析你选择的卡片类别，判断你更倾向于「职涯取向」还是「生活取向」。",
        workLabel: "职涯取向",
        lifeLabel: "生活取向",
        missingTitle: "被忽略的维度",
        allCoveredTitle: "全面的价值覆盖",
        allCoveredDesc: "你的10张卡片覆盖了全部四个维度，说明你对不同类型的人生价值都有关注。这是一种平衡的价值取向。",
        rankLabel: "第{rank}名",
        spectrumTitle: "光谱分布",
        spectrumDesc: "你选择的10张卡片在「职涯取向—中性平衡—生活取向」三段光谱上的分布。",
        reportTitle: "Top 10 卡片深度解读",
        reportDesc: "每张卡片从四个象限角度的专业深度解读，结合 AI 中性描述，帮助你全方位理解自己的核心价值。",
      },
      "zh-TW": {
        pageTitle: "理想人生卡解讀報告",
        pageSubtitle: "基於焦點解決牌卡技術的價值觀深度分析",
        topThreeTitle: "排名前三的職涯價值卡",
        topThreeDesc: "這三張卡片代表了你內心最深處的渴望和追求，它們是你做人生重要決策時的指南針。",
        distributionTitle: "四大類別分佈",
        distributionDesc: "你選出的10張卡片在四個價值維度上的分佈情況，反映了你的整體價值傾向。",
        orientationTitle: "職涯取向 vs 生活取向",
        orientationDesc: "透過分析你選擇的卡片類別，判斷你更傾向於「職涯取向」還是「生活取向」。",
        workLabel: "職涯取向",
        lifeLabel: "生活取向",
        missingTitle: "被忽略的維度",
        allCoveredTitle: "全面的價值覆蓋",
        allCoveredDesc: "你的10張卡片覆蓋了全部四個維度，說明你對不同類型的人生價值都有關注。這是一種平衡的價值取向。",
        rankLabel: "第{rank}名",
        spectrumTitle: "光譜分佈",
        spectrumDesc: "你選擇的10張卡片在「職涯取向—中性平衡—生活取向」三段光譜上的分佈。",
        reportTitle: "Top 10 卡片深度解讀",
        reportDesc: "每張卡片從四個象限角度的專業深度解讀，結合 AI 中性描述，幫助你全方位理解自己的核心價值。",
      },
      en: {
        pageTitle: "Espresso Card Interpretation Report",
        pageSubtitle: "In-depth value analysis based on Solution-Focused Card Technique",
        topThreeTitle: "Top 3 Career Value Cards",
        topThreeDesc: "These three cards represent your deepest desires and pursuits — they are the compass for your most important life decisions.",
        distributionTitle: "Category Distribution",
        distributionDesc: "How your 10 selected cards are distributed across four value dimensions.",
        orientationTitle: "Career vs Life Orientation",
        orientationDesc: 'Analyzing your card categories to determine whether you lean toward "career orientation" or "life orientation".',
        workLabel: "Career Orientation",
        lifeLabel: "Life Orientation",
        missingTitle: "Overlooked Dimensions",
        allCoveredTitle: "Comprehensive Value Coverage",
        allCoveredDesc: "Your 10 cards cover all four dimensions, indicating a balanced value orientation.",
        rankLabel: "#{rank}",
        spectrumTitle: "Spectrum Distribution",
        spectrumDesc: "How your 10 cards are distributed across the Career-Oriented — Neutral — Lifestyle-Oriented spectrum.",
        reportTitle: "Top 10 Card Deep Interpretation",
        reportDesc: "Professional quadrant-based interpretation for each card with AI neutral descriptions, helping you fully understand your core values.",
      },
    }),
    []
  );

  const txt = texts[language] || texts["zh-CN"];

  /* ── Animation variants ── */
  const itemVariants = prefersReducedMotion
    ? {}
    : { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

  const containerVariants = prefersReducedMotion
    ? {}
    : { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.15 } } };

  if (results.length === 0) return null;

  /* ─────────────────────── Render ─────────────────────── */
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#F5F7FA" }}>
      {/* ═══ HERO ═══ */}
      <motion.section
        className="relative overflow-hidden py-16 px-6"
        style={{ background: "linear-gradient(135deg, #1C2857 0%, #2a3f7a 40%, #3b5998 100%)" }}
        initial={prefersReducedMotion ? {} : { opacity: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{ backgroundColor: "rgba(181,210,96,0.15)", border: "1px solid rgba(181,210,96,0.25)" }}
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#B5D260" }} />
            <span className="text-sm font-medium" style={{ color: "#B5D260" }}>
              {txt.pageSubtitle}
            </span>
          </motion.div>
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-white mb-4"
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
          {/* ═══ TOP 3 — Gold / Silver / Bronze ═══ */}
          <motion.section
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5" style={{ color: "#FFD700" }} />
              <h2 className="text-xl font-bold text-slate-800">{txt.topThreeTitle}</h2>
            </div>
            <p className="text-sm text-slate-500 mb-6">{txt.topThreeDesc}</p>

            <div className={cn("grid gap-5", isMobile ? "grid-cols-1" : "grid-cols-3")}>
              {topThree.map((result, index) => {
                const card = IDEAL_CARDS.find((c) => c.id === result.cardId);
                if (!card) return null;
                const categoryConfig = CATEGORY_CONFIG[result.category];
                const medal = MEDAL_STYLES[index];
                const label = getCardLabel(card, language);

                return (
                  <motion.div
                    key={result.cardId}
                    className="relative rounded-2xl p-6 text-center overflow-hidden"
                    style={{
                      background: `linear-gradient(160deg, white 30%, ${categoryConfig.bgColor} 100%)`,
                      border: `1px solid ${categoryConfig.borderColor}`,
                      boxShadow: `
                        0 2px 4px rgba(0,0,0,0.03),
                        0 8px 20px ${medal.shadowColor},
                        inset 0 1px 0 rgba(255,255,255,0.9),
                        inset 0 -1px 0 rgba(0,0,0,0.02)
                      `,
                    }}
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 20, rotateX: 8 }}
                    animate={prefersReducedMotion ? {} : { opacity: 1, y: 0, rotateX: 0 }}
                    transition={{ delay: 0.3 + index * 0.15, type: "spring", stiffness: 200, damping: 20 }}
                    whileHover={prefersReducedMotion ? {} : { y: -4, scale: 1.02 }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.04] pointer-events-none"
                      style={{ background: "linear-gradient(135deg, transparent 40%, white 55%, transparent 70%)" }}
                    />
                    <div
                      className="mx-auto w-14 h-14 rounded-full flex items-center justify-center font-black text-xl mb-4 relative"
                      style={{
                        background: medal.gradient,
                        boxShadow: medal.ringGlow,
                        color: "white",
                        textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="font-bold text-xl text-slate-800 mb-2 relative">{label}</div>
                    <div className="flex items-center justify-center gap-1.5 relative">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: categoryConfig.color }} />
                      <span className="text-xs font-medium" style={{ color: categoryConfig.color }}>
                        {getCategoryLabel(result.category, language)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ═══ CATEGORY DISTRIBUTION ═══ */}
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
              {(Object.entries(categoryDistribution) as [CardCategory, number][]).map(([category, count]) => {
                const config = CATEGORY_CONFIG[category];
                const display = CATEGORY_DISPLAY[category];
                const IconComponent = display.icon;
                const percentage = Math.round((count / 10) * 100);
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" style={{ color: config.color }} />
                        <span className="text-sm font-semibold text-slate-700">{getCategoryLabel(category, language)}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: config.color }}>{count} / 10</span>
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
                    <p className="text-xs text-slate-400">{display.description[language] || display.description["zh-CN"]}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* ═══ WORK VS LIFE ORIENTATION ═══ */}
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
              <div className="flex justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#e74c6f" }} />
                  <span>{language === "en" ? "Intrinsic + Material" : language === "zh-TW" ? "內在價值 + 物質條件" : "内在价值 + 物质条件"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#7c3aed" }} />
                  <span>{language === "en" ? "Lifestyle + Interpersonal" : language === "zh-TW" ? "生活方式 + 人際關係" : "生活方式 + 人际关系"}</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ═══ SPECTRUM CHART ═══ */}
          {spectrumTotal > 0 && (
            <motion.section
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
              variants={prefersReducedMotion ? undefined : itemVariants}
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5" style={{ color: "#1C2857" }} />
                <h2 className="text-xl font-bold text-slate-800">{txt.spectrumTitle}</h2>
              </div>
              <p className="text-sm text-slate-500 mb-6">{txt.spectrumDesc}</p>

              <div className="relative h-14 rounded-xl overflow-hidden flex mb-5">
                {(["career", "neutral", "lifestyle"] as const).map((specType) => {
                  const count = spectrumGroups[specType].length;
                  if (count === 0) return null;
                  const percent = Math.round((count / spectrumTotal) * 100);
                  const config = SPECTRUM_DISPLAY[specType];
                  return (
                    <motion.div
                      key={specType}
                      className="h-full flex items-center justify-center"
                      style={{ backgroundColor: config.color }}
                      initial={prefersReducedMotion ? { width: `${percent}%` } : { width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    >
                      <span className="text-white text-xs font-bold px-2 whitespace-nowrap">
                        {config.label[language] || config.label["zh-CN"]} ({count})
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className={cn("grid gap-4", isMobile ? "grid-cols-1" : "grid-cols-3")}>
                {(["career", "neutral", "lifestyle"] as const).map((specType) => {
                  const cards = spectrumGroups[specType];
                  if (cards.length === 0) return null;
                  const config = SPECTRUM_DISPLAY[specType];
                  return (
                    <div
                      key={specType}
                      className="rounded-xl p-4"
                      style={{ backgroundColor: config.bgLight, borderLeft: `4px solid ${config.color}` }}
                    >
                      <div className="text-xs font-bold mb-2" style={{ color: config.color }}>
                        {config.label[language] || config.label["zh-CN"]}
                      </div>
                      <div className="space-y-1.5">
                        {cards.map((cardItem) => (
                          <div key={cardItem.cardId} className="text-sm text-slate-700">{cardItem.label}</div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ═══ MISSING DIMENSIONS ═══ */}
          {missingDimensions.length > 0 && (
            <motion.section
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-8"
              variants={prefersReducedMotion ? undefined : itemVariants}
            >
              <div className="flex items-center gap-3 mb-2">
                <Eye className="w-5 h-5" style={{ color: "#dc2626" }} />
                <h2 className="text-xl font-bold text-slate-800">{txt.missingTitle}</h2>
              </div>
              <div className="space-y-6 mt-4">
                {missingDimensions.map((category) => {
                  const config = CATEGORY_CONFIG[category];
                  const fixedText = MISSING_DIMENSION_TEXTS[category];
                  const lang = language as "zh-TW" | "zh-CN" | "en";
                  return (
                    <div
                      key={category}
                      className="rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${config.borderColor}` }}
                    >
                      <div
                        className="px-5 py-3 flex items-center gap-2"
                        style={{ backgroundColor: config.bgColor, borderBottom: `1px solid ${config.borderColor}` }}
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                        <span className="text-sm font-bold" style={{ color: config.color }}>
                          {fixedText.title[lang] || fixedText.title["zh-TW"]}
                        </span>
                      </div>
                      <div className="px-5 py-4 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748b" }}>
                          {REFLECTION_HEADER[lang] || REFLECTION_HEADER["zh-TW"]}
                        </div>
                        <ul className="space-y-2">
                          {(fixedText.questions[lang] || fixedText.questions["zh-TW"]).map((question, questionIndex) => (
                            <li key={questionIndex} className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
                              <span className="text-slate-400 mt-0.5 flex-shrink-0">•</span>
                              <span>{question}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm text-slate-500 leading-relaxed pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
                          {fixedText.closing[lang] || fixedText.closing["zh-TW"]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ═══ TOP 10 CARD INTERPRETATION REPORT ═══ */}
          <motion.section variants={prefersReducedMotion ? undefined : itemVariants}>
            {/* Section header card */}
            <div
              className="rounded-2xl p-6 md:p-8 mb-8"
              style={{
                background: "linear-gradient(135deg, #1C2857 0%, #2a3f7a 100%)",
                boxShadow: "0 4px 16px rgba(28,40,87,0.2)",
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-white/80" />
                <h2 className="text-xl font-bold text-white">{txt.reportTitle}</h2>
              </div>
              <p className="text-sm text-white/60">{txt.reportDesc}</p>
            </div>

            {/* Report cards — 2-column grid */}
            <div className={cn("grid gap-5", isMobile ? "grid-cols-1" : "grid-cols-2")} style={{ alignItems: "stretch" }}>
              {results.map((result) => {
                const card = IDEAL_CARDS.find((c) => c.id === result.cardId);
                if (!card) return null;
                return (
                  <motion.div
                    key={result.cardId}
                    className="h-full"
                    initial={prefersReducedMotion ? {} : { opacity: 0, y: 16 }}
                    whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.45 }}
                  >
                    <IdealCardReportCard
                      rank={result.rank}
                      label={getCardLabel(card, language)}
                      category={result.category}
                      quadrant={quadrantMap[result.cardId]}
                      spectrumType={spectrumMap[result.cardId]}
                      aiDescription={cardDescriptions[result.cardId]}
                      isLoadingDescription={isGeneratingDescriptions && !cardDescriptions[result.cardId]}
                      language={language}
                      isMobile={isMobile}
                    />
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* ═══ BOTTOM ACTIONS ═══ */}
          <motion.div
            className="flex flex-col sm:flex-row gap-3 pt-4 pb-8"
            variants={prefersReducedMotion ? undefined : itemVariants}
          >
            <button
              onClick={async () => {
                if (isDownloading) return;
                setIsDownloading(true);
                try {
                  const userName = resolveUserDisplayName(profile, user, language);
                  const success = await downloadLatestIdealCardReport(
                    user?.id || "anonymous",
                    userName,
                    profile?.career_stage || careerStage || "mid",
                    language,
                    Object.keys(cardDescriptions).length > 0 ? cardDescriptions : undefined,
                    resolveWorkExperienceYears(profile?.work_experience_years, null, profile?.career_stage || careerStage),
                  );
                  if (success) {
                    toast.success(language === "en" ? "Report downloaded" : language === "zh-TW" ? "報告已下載" : "报告已下载");
                  } else {
                    toast.error(language === "en" ? "Download failed" : language === "zh-TW" ? "下載失敗" : "下载失败");
                  }
                } catch {
                  toast.error(language === "en" ? "Download failed" : language === "zh-TW" ? "下載失敗" : "下载失败");
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="flex-1 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.005] active:scale-[0.995] disabled:opacity-70"
              style={{ backgroundColor: "#1C2857" }}
            >
              {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isDownloading
                ? (language === "en" ? "Generating Report..." : language === "zh-TW" ? "報告生成中…" : "报告生成中…")
                : (language === "en" ? "Download Report" : language === "zh-TW" ? "下載完整報告" : "下载完整报告")
              }
            </button>


          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
