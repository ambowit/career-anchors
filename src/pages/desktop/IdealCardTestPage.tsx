import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, GripVertical, Heart, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  IDEAL_CARDS,
  CATEGORY_CONFIG,
  getCardLabel,
  getCategoryLabel,
  shuffleCards,
  type IdealCard,
  type CardCategory,
} from "@/data/idealCards";
import { cn } from "@/lib/utils";

type TestPhase = "intro" | "select30" | "select10" | "rank";

const PHASE_LABELS = {
  select30: { "zh-CN": "第一轮：选出30张", "zh-TW": "第一輪：選出30張", en: "Round 1: Pick 30 Cards" },
  select10: { "zh-CN": "第二轮：精选10张", "zh-TW": "第二輪：精選10張", en: "Round 2: Pick 10 Cards" },
  rank: { "zh-CN": "第三轮：按优先级排序", "zh-TW": "第三輪：按優先級排序", en: "Round 3: Rank by Priority" },
};

const PHASE_DESCRIPTIONS = {
  select30: {
    "zh-CN": "从以下70张理想人生卡中，选出对你最重要的30张",
    "zh-TW": "從以下70張理想人生卡中，選出對你最重要的30張",
    en: "From these 70 Espresso Cards, pick the 30 most important to you",
  },
  select10: {
    "zh-CN": "从刚才选出的30张中，再精选出最核心的10张",
    "zh-TW": "從剛才選出的30張中，再精選出最核心的10張",
    en: "From your 30 cards, narrow down to the 10 most essential",
  },
  rank: {
    "zh-CN": "拖动排列你最终的10张卡片，第1名是你人生中最重要的价值",
    "zh-TW": "拖動排列你最終的10張卡片，第1名是你人生中最重要的價值",
    en: "Drag to rank your final 10 cards — #1 is your most important life value",
  },
};

export default function IdealCardTestPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isMobile = useIsMobile();

  const [phase, setPhase] = useState<TestPhase>("intro");
  const [selectedPhase1, setSelectedPhase1] = useState<Set<number>>(new Set());
  const [selectedPhase2, setSelectedPhase2] = useState<Set<number>>(new Set());
  const [rankedCards, setRankedCards] = useState<IdealCard[]>([]);

  // Shuffle cards once on mount
  const shuffledCards = useMemo(() => shuffleCards(IDEAL_CARDS), []);

  // Phase 2 cards = the ones selected in Phase 1, re-shuffled
  const phase2Cards = useMemo(() => {
    const selected = shuffledCards.filter((card) => selectedPhase1.has(card.id));
    return shuffleCards(selected);
  }, [shuffledCards, selectedPhase1]);

  const isEn = language === "en";

  const handleTogglePhase1 = useCallback((cardId: number) => {
    setSelectedPhase1((prev) => {
      const updated = new Set(prev);
      if (updated.has(cardId)) {
        updated.delete(cardId);
      } else {
        if (updated.size < 30) updated.add(cardId);
      }
      return updated;
    });
  }, []);

  const handleTogglePhase2 = useCallback((cardId: number) => {
    setSelectedPhase2((prev) => {
      const updated = new Set(prev);
      if (updated.has(cardId)) {
        updated.delete(cardId);
      } else {
        if (updated.size < 10) updated.add(cardId);
      }
      return updated;
    });
  }, []);

  const handleGoToPhase2 = () => {
    setPhase("select10");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoToRank = () => {
    const selected = IDEAL_CARDS.filter((card) => selectedPhase2.has(card.id));
    setRankedCards(selected);
    setPhase("rank");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToPhase1 = () => {
    setSelectedPhase2(new Set());
    setPhase("select30");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToPhase2 = () => {
    setPhase("select10");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const { user } = useAuth();

  const handleComplete = async () => {
    // Save ranked results to sessionStorage
    const idealCardResults = rankedCards.map((card, index) => ({
      rank: index + 1,
      cardId: card.id,
      category: card.category,
      label: getCardLabel(card, language),
      labelEn: card.en,
    }));
    sessionStorage.setItem("idealCardResults", JSON.stringify(idealCardResults));

    // Persist to ideal_card_results table (best-effort, don't block navigation)
    if (user) {
      const categoryDistribution: Record<string, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
      idealCardResults.forEach(card => { categoryDistribution[card.category] = (categoryDistribution[card.category] || 0) + 1; });

      supabase
        .from("ideal_card_results")
        .insert({
          user_id: user.id,
          ranked_cards: idealCardResults,
          top10_cards: idealCardResults.slice(0, 10),
          category_distribution: categoryDistribution,
        })
        .then(({ error }) => {
          if (error) console.error("Failed to save ideal card results:", error);
        });
    }

    // If career anchor results also exist, go directly to comprehensive report
    const hasCareerAnchorResults = !!sessionStorage.getItem("assessmentResults");
    if (hasCareerAnchorResults) {
      navigate("/fusion-report");
    } else {
      navigate("/ideal-card-report-view");
    }
  };

  const handleStartTest = () => {
    setPhase("select30");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Intro screen
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(160deg, #fce4ec 0%, #f3e5f5 40%, #e8eaf6 70%, #e0f2f1 100%)" }}>
        <motion.div
          className="max-w-lg w-full text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Decorative icon */}
          <motion.div
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-lg"
            style={{ background: "linear-gradient(135deg, #e74c6f, #c2185b)" }}
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Heart className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            className="text-3xl md:text-4xl font-bold text-slate-800 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {isEn ? "Espresso Cards" : language === "zh-TW" ? "理想人生卡" : "理想人生卡"}
          </motion.h1>

          <motion.p
            className="text-slate-500 leading-relaxed mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {isEn
              ? "Discover your most important life values through 70 carefully designed cards. This test uses the Solution-Focused Card Technique to help you uncover what truly matters to you."
              : language === "zh-TW"
              ? "通過70張精心設計的價值卡片，發現你人生中最重要的價值觀。本測試採用焦點解決牌卡技術，幫助你找到內心最真實的渴望。"
              : "通过70张精心设计的价值卡片，发现你人生中最重要的价值观。本测试采用焦点解决牌卡技术，帮助你找到内心最真实的渴望。"}
          </motion.p>

          <motion.button
            onClick={handleStartTest}
            className="w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #e74c6f, #c2185b)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles className="w-5 h-5" />
            {isEn ? "Start Assessment" : language === "zh-TW" ? "開始測評" : "开始测评"}
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.p
            className="text-xs text-slate-400 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {isEn ? "Takes about 10-15 minutes" : language === "zh-TW" ? "預計用時 10-15 分鐘" : "预计用时 10-15 分钟"}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // Current phase info
  const phaseLabel = PHASE_LABELS[phase as keyof typeof PHASE_LABELS][language] || PHASE_LABELS[phase as keyof typeof PHASE_LABELS]["zh-CN"];
  const phaseDesc = PHASE_DESCRIPTIONS[phase as keyof typeof PHASE_DESCRIPTIONS][language] || PHASE_DESCRIPTIONS[phase as keyof typeof PHASE_DESCRIPTIONS]["zh-CN"];
  const phaseNumber = phase === "select30" ? 1 : phase === "select10" ? 2 : 3;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "hsl(350, 40%, 97%)" }}
    >
      {/* Top Header Bar */}
      <div
        className="sticky top-0 z-30 border-b backdrop-blur-md"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          borderColor: "hsl(350, 30%, 90%)",
          paddingTop: "env(safe-area-inset-top, 0px)",
        }}
      >
        <div className={cn("mx-auto px-4 py-3", isMobile ? "max-w-full" : "max-w-5xl")}>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step < phaseNumber && "text-white",
                    step === phaseNumber && "text-white shadow-md",
                    step > phaseNumber && "text-slate-400 border-2 border-slate-300"
                  )}
                  style={
                    step <= phaseNumber
                      ? { backgroundColor: "#e74c6f" }
                      : {}
                  }
                >
                  {step < phaseNumber ? <Check className="w-3.5 h-3.5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className="w-8 h-0.5 rounded-full"
                    style={{
                      backgroundColor: step < phaseNumber ? "#e74c6f" : "#e2e8f0",
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Phase Title + Counter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {phase !== "select30" && (
                <button
                  onClick={phase === "select10" ? handleBackToPhase1 : handleBackToPhase2}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                </button>
              )}
              <div>
                <h2 className="text-sm font-bold text-slate-800">{phaseLabel}</h2>
                <p className="text-xs text-slate-500 hidden sm:block">{phaseDesc}</p>
              </div>
            </div>

            {/* Counter Badge */}
            {phase !== "rank" && (
              <SelectionCounter
                current={phase === "select30" ? selectedPhase1.size : selectedPhase2.size}
                target={phase === "select30" ? 30 : 10}
                language={language}
              />
            )}
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <div className={cn("mx-auto px-4 py-6", isMobile ? "max-w-full" : "max-w-5xl")}>
        {/* Mobile phase description */}
        <p className="text-xs text-slate-500 mb-4 sm:hidden">{phaseDesc}</p>

        <AnimatePresence mode="wait">
          {phase === "select30" && (
            <motion.div
              key="phase1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <CardGrid
                cards={shuffledCards}
                selectedIds={selectedPhase1}
                onToggle={handleTogglePhase1}
                language={language}
                isMobile={isMobile}
                showCategory={false}
                phase="select30"
              />
            </motion.div>
          )}

          {phase === "select10" && (
            <motion.div
              key="phase2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              <CardGrid
                cards={phase2Cards}
                selectedIds={selectedPhase2}
                onToggle={handleTogglePhase2}
                language={language}
                isMobile={isMobile}
                showCategory={false}
                phase="select10"
              />
            </motion.div>
          )}

          {phase === "rank" && (
            <motion.div
              key="phase3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <RankPhase
                cards={rankedCards}
                onReorder={setRankedCards}
                language={language}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action Bar */}
      <div
        className="sticky bottom-0 z-30 border-t"
        style={{
          backgroundColor: "rgba(255,255,255,0.95)",
          borderColor: "hsl(350, 30%, 90%)",
          backdropFilter: "blur(8px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div className={cn("mx-auto px-4 py-3", isMobile ? "max-w-full" : "max-w-5xl")}>
          {phase === "select30" && (
            <button
              onClick={handleGoToPhase2}
              disabled={selectedPhase1.size !== 30}
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm",
                selectedPhase1.size === 30
                  ? "text-white shadow-lg hover:shadow-xl hover:scale-[1.005] active:scale-[0.995]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
              style={selectedPhase1.size === 30 ? { backgroundColor: "#e74c6f" } : {}}
            >
              {isEn ? "Continue to Round 2" : language === "zh-TW" ? "進入第二輪" : "进入第二轮"}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          {phase === "select10" && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToPhase1}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {isEn ? "Previous" : language === "zh-TW" ? "上一步" : "上一步"}
              </button>
              <button
                onClick={handleGoToRank}
                disabled={selectedPhase2.size !== 10}
                className={cn(
                  "flex-1 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm",
                  selectedPhase2.size === 10
                    ? "text-white shadow-lg hover:shadow-xl hover:scale-[1.005] active:scale-[0.995]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
                style={selectedPhase2.size === 10 ? { backgroundColor: "#e74c6f" } : {}}
              >
                {isEn ? "Continue to Ranking" : language === "zh-TW" ? "進入排序" : "进入排序"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {phase === "rank" && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToPhase2}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {isEn ? "Previous" : language === "zh-TW" ? "上一步" : "上一步"}
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm text-white shadow-lg hover:shadow-xl hover:scale-[1.005] active:scale-[0.995]"
                style={{ backgroundColor: "#e74c6f" }}
              >
                <Sparkles className="w-4 h-4" />
                {isEn ? "Complete & View Results" : language === "zh-TW" ? "完成並查看結果" : "完成并查看结果"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// Sub-components
// ========================================

function SelectionCounter({
  current,
  target,
  language,
}: {
  current: number;
  target: number;
  language: string;
}) {
  const isFull = current === target;
  const isOver = current > target;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all",
        isFull && "shadow-sm"
      )}
      style={{
        backgroundColor: isFull ? "#fce4ec" : isOver ? "#ffebee" : "#f1f5f9",
        color: isFull ? "#e74c6f" : isOver ? "#c62828" : "#64748b",
      }}
    >
      <Heart className="w-3.5 h-3.5" />
      <span>{current}</span>
      <span style={{ color: "#94a3b8" }}>/</span>
      <span>{target}</span>
    </div>
  );
}

function CardGrid({
  cards,
  selectedIds,
  onToggle,
  language,
  isMobile,
  showCategory,
  phase = "select30",
}: {
  cards: IdealCard[];
  selectedIds: Set<number>;
  onToggle: (id: number) => void;
  language: string;
  isMobile: boolean;
  showCategory: boolean;
  phase?: TestPhase;
}) {
  return (
    <div
      className={cn(
        "grid",
        isMobile ? "grid-cols-2 gap-2" : "grid-cols-4 lg:grid-cols-5 gap-2.5"
      )}
    >
      {cards.map((card) => {
        const isSelected = selectedIds.has(card.id);
        const categoryConfig = CATEGORY_CONFIG[card.category];
        const label = getCardLabel(card, language as any);

        return (
          <motion.button
            key={card.id}
            onClick={() => onToggle(card.id)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative text-left rounded-xl border transition-all p-3",
              isMobile ? "min-h-[64px]" : "min-h-[80px]",
              isSelected
                ? ""
                : "bg-white hover:shadow-lg"
            )}
            style={
              isSelected
                ? phase === "rank"
                  ? {
                      backgroundColor: categoryConfig.bgColor,
                      borderColor: categoryConfig.borderColor,
                      borderWidth: 2,
                      boxShadow: `0 4px 16px ${categoryConfig.color}30, 0 2px 4px ${categoryConfig.color}15`,
                      transform: "translateY(-1px)",
                    }
                  : {
                      backgroundColor: "#fef2f2",
                      borderColor: "#e74c6f",
                      borderWidth: 2,
                      boxShadow: "0 4px 16px rgba(231,76,111,0.2), 0 2px 4px rgba(231,76,111,0.1)",
                      transform: "translateY(-1px)",
                    }
                : {
                    borderColor: "#e2e8f0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
                  }
            }
          >
            {/* Selected checkmark */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: phase === "rank" ? categoryConfig.color : "#e74c6f" }}
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}

            {/* Category dot */}
            {showCategory && (
              <div
                className="w-2 h-2 rounded-full mb-1.5"
                style={{ backgroundColor: categoryConfig.color }}
              />
            )}

            <span
              className={cn(
                "text-sm font-medium leading-snug block pr-5",
                isSelected ? "text-slate-800" : "text-slate-700"
              )}
            >
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

function RankPhase({
  cards,
  onReorder,
  language,
  isMobile,
}: {
  cards: IdealCard[];
  onReorder: (cards: IdealCard[]) => void;
  language: string;
  isMobile: boolean;
}) {
  const isEn = language === "en";

  return (
    <div className={cn("mx-auto", isMobile ? "max-w-full" : "max-w-2xl")}>
      <Reorder.Group
        axis="y"
        values={cards}
        onReorder={onReorder}
        className="flex flex-col gap-3"
      >
        {cards.map((card, index) => (
          <RankItem
            key={card.id}
            card={card}
            rank={index + 1}
            language={language}
            isMobile={isMobile}
          />
        ))}
      </Reorder.Group>

      <div className="mt-5 text-center">
        <p className="text-xs text-slate-400">
          {isEn
            ? "Drag cards to reorder — your #1 is your most important life value"
            : language === "zh-TW"
            ? "拖動卡片重新排序 — 第1名是你人生中最重要的價值"
            : "拖动卡片重新排序 — 第1名是你人生中最重要的价值"}
        </p>
      </div>
    </div>
  );
}

function RankItem({
  card,
  rank,
  language,
  isMobile,
}: {
  card: IdealCard;
  rank: number;
  language: string;
  isMobile: boolean;
}) {
  const categoryConfig = CATEGORY_CONFIG[card.category];
  const label = getCardLabel(card, language as any);
  const categoryLabel = getCategoryLabel(card.category, language as any);

  const isTopThree = rank >= 1 && rank <= 3;

  return (
    <Reorder.Item
      value={card}
      className="relative cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
      whileDrag={{
        scale: 1.03,
        zIndex: 50,
        boxShadow: `0 20px 40px ${categoryConfig.color}30, 0 8px 16px rgba(0,0,0,0.1)`,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* 3D card shell */}
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
        style={{
          background: `linear-gradient(135deg, ${categoryConfig.bgColor} 0%, white 35%, ${categoryConfig.bgColor}cc 70%, ${categoryConfig.bgColor} 100%)`,
          boxShadow: [
            `0 1px 2px ${categoryConfig.color}08`,
            `0 4px 12px ${categoryConfig.color}0c`,
            `0 8px 28px ${categoryConfig.color}06`,
            `inset 0 1px 0 rgba(255,255,255,0.85)`,
            `inset 0 -1px 0 ${categoryConfig.color}0a`,
          ].join(", "),
          border: `1.5px solid ${categoryConfig.borderColor}70`,
        }}
      >
        {/* Top light strip — glass highlight */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 5%, ${categoryConfig.borderColor}80 30%, rgba(255,255,255,0.9) 50%, ${categoryConfig.borderColor}80 70%, transparent 95%)`,
          }}
        />

        {/* Soft inner glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 0%, rgba(255,255,255,0.5) 0%, transparent 60%)`,
          }}
        />

        <div className={cn("flex items-center gap-3 relative", isMobile ? "p-3.5" : "px-5 py-4")}>
          {/* Drag handle */}
          <GripVertical className="w-4 h-4 flex-shrink-0 opacity-30" style={{ color: categoryConfig.color }} />

          {/* Rank badge */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm"
            style={
              isTopThree
                ? {
                    background: "linear-gradient(145deg, #FFD700 0%, #FFC107 45%, #FFA000 100%)",
                    color: "#5D4037",
                    boxShadow: "0 3px 10px rgba(255,160,0,0.4), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  }
                : {
                    background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7))",
                    color: "#94a3b8",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.03)",
                  }
            }
          >
            {rank}
          </div>

          {/* Card info */}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base text-slate-800 leading-tight truncate">{label}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: categoryConfig.color }}
              />
              <span className="text-xs font-medium" style={{ color: categoryConfig.color }}>
                {categoryLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}
