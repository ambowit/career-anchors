import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { DIMENSIONS } from "@/hooks/useAssessment";
import { useTranslation } from "@/hooks/useLanguage";

interface RadarChartProps {
  scores: Record<string, number>;
  mainAnchor?: string; // Kept for backward compat
  coreAdvantageAnchors?: string[]; // Anchors with score >= 80
  animate?: boolean;
}

const ANIMATION_DURATION = 1200; // ms
const ANIMATION_EASING = "easeOut";

export default function RadarChart({
  scores,
  mainAnchor,
  coreAdvantageAnchors = [],
  animate = true,
}: RadarChartProps) {
  const { language } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>(() => {
    // If reduced motion or no animation, start with final scores
    if (prefersReducedMotion || !animate) {
      return scores;
    }
    // Otherwise start with zeros
    return Object.keys(scores).reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  });
  const [isAnimating, setIsAnimating] = useState(animate && !prefersReducedMotion);

  // Animate scores from 0 to target values
  useEffect(() => {
    if (prefersReducedMotion || !animate) {
      setAnimatedScores(scores);
      setIsAnimating(false);
      return;
    }

    const startTime = performance.now();
    let animationFrameId: number;

    const animateScores = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      
      // Easing function (easeOutQuart for smooth deceleration)
      const easedProgress = 1 - Math.pow(1 - progress, 4);

      const newScores = Object.entries(scores).reduce((acc, [key, targetValue]) => ({
        ...acc,
        [key]: Math.round(targetValue * easedProgress),
      }), {});

      setAnimatedScores(newScores);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateScores);
      } else {
        setIsAnimating(false);
        setAnimatedScores(scores); // Ensure final values are exact
      }
    };

    animationFrameId = requestAnimationFrame(animateScores);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [scores, animate, prefersReducedMotion]);

  // Score unit text
  const scoreUnit = language === "en" ? "pts" : "分";

  // Standardized scores are 0-100; use 100 as fixed domain
  const chartDomain = 100;

  // Transform scores to chart data
  const data = Object.entries(DIMENSIONS).map(([key, names]) => ({
    dimension: names[language],
    dimensionKey: key,
    shortName: names[language].replace(/[\/\s]/g, "\n").substring(0, 4),
    score: animatedScores[key] || 0,
    targetScore: scores[key] || 0,
    fullMark: chartDomain,
    isCoreAdvantage: coreAdvantageAnchors.includes(key) || (coreAdvantageAnchors.length === 0 && key === mainAnchor),
  }));

  // Container animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.9,
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const reduceMotionVariants = {
    hidden: { opacity: 1, scale: 1 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <motion.div 
      className="w-full aspect-square max-w-md mx-auto relative"
      variants={prefersReducedMotion ? reduceMotionVariants : containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated pulse ring behind the chart during animation */}
      {isAnimating && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [0.5, 1.1, 1], 
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
          }}
        />
      )}

      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid
            stroke="hsl(var(--border))"
            strokeWidth={1}
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="dimension"
            tick={({ payload, x, y, cx, cy }) => {
              const item = data.find((d) => d.dimension === payload.value);
              const isMain = item?.isCoreAdvantage;
              const targetScore = item?.targetScore || 0;

              // Calculate position for label
              const radius = 1.15;
              const labelX = cx + (x - cx) * radius;
              const labelY = cy + (y - cy) * radius;

              return (
                <g>
                  {/* Dimension name */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`text-xs transition-all duration-300 ${
                      isMain
                        ? "fill-primary font-semibold"
                        : "fill-muted-foreground"
                    }`}
                    style={{ fontSize: "11px" }}
                  >
                    {payload.value.length > 6
                      ? payload.value.substring(0, 5) + "..."
                      : payload.value}
                  </text>
                  {/* Score badge for main anchor */}
                  {isMain && (
                    <text
                      x={labelX}
                      y={labelY + 14}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-mono transition-all duration-300 fill-primary"
                      style={{ fontSize: "10px" }}
                    >
                      {targetScore}{scoreUnit}
                    </text>
                  )}
                </g>
              );
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, chartDomain]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name={language === "en" ? "Career Anchor Score" : language === "zh-TW" ? "職業錨得分" : "职业锚得分"}
            dataKey="score"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={isAnimating ? 0.1 : 0.2}
            strokeWidth={2}
            animationDuration={0} // Disable recharts internal animation, we handle it
            dot={(props) => {
              const { cx, cy, payload } = props;
              const isCoreAdv = payload.isCoreAdvantage;

              // During animation, all dots are same size; after, high-sensitivity is larger
              const baseRadius = isAnimating ? 4 : (isCoreAdv ? 6 : 4);

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={baseRadius}
                  fill="hsl(var(--primary))"
                  stroke="white"
                  strokeWidth={2}
                  className="transition-all duration-300"
                />
              );
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* Animation complete indicator */}
      {!isAnimating && !prefersReducedMotion && animate && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {/* Optional: completion indicator text */}
        </motion.div>
      )}
    </motion.div>
  );
}
