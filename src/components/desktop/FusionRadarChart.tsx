/**
 * Fusion Radar Chart — 8-axis radar comparing
 * value dimension weights vs anchor support strengths
 */

import { useMemo } from "react";
import type { ValueDimension } from "@/lib/fusionEngineV3";
import { getDimensionLabel, VALUE_DIMENSIONS } from "@/lib/fusionEngineV3";
import type { Language } from "@/hooks/useLanguage";

interface FusionRadarChartProps {
  valueDimWeights: Record<ValueDimension, number>;
  supportStrengths: Record<ValueDimension, number>;
  language: Language;
  size?: number;
}

const COLORS = {
  valueWeight: "#3b82f6",
  support: "#f59e0b",
  grid: "#e2e8f0",
  gridDark: "#94a3b8",
  text: "#334155",
};

export default function FusionRadarChart({
  valueDimWeights,
  supportStrengths,
  language,
  size = 420,
}: FusionRadarChartProps) {
  const center = size / 2;
  const radius = size * 0.35;
  const axisCount = VALUE_DIMENSIONS.length;
  const angleStep = (2 * Math.PI) / axisCount;

  // Normalize value weights to 0-100 (max weight → 100)
  const maxWeight = Math.max(...Object.values(valueDimWeights), 0.01);

  const getPoint = (index: number, value: number): [number, number] => {
    const angle = angleStep * index - Math.PI / 2;
    const normalizedRadius = (value / 100) * radius;
    return [
      center + normalizedRadius * Math.cos(angle),
      center + normalizedRadius * Math.sin(angle),
    ];
  };

  const { valuePolygon, supportPolygon, labels, gridLines } = useMemo(() => {
    const valuePoints: [number, number][] = [];
    const supportPoints: [number, number][] = [];
    const labelPositions: Array<{ x: number; y: number; text: string; anchor: string }> = [];
    const gridCircles: number[] = [20, 40, 60, 80, 100];

    VALUE_DIMENSIONS.forEach((dim, index) => {
      const weightNorm = (valueDimWeights[dim] / maxWeight) * 100;
      const supportVal = Math.min(supportStrengths[dim], 100);

      valuePoints.push(getPoint(index, weightNorm));
      supportPoints.push(getPoint(index, supportVal));

      // Label position — slightly outside the chart
      const labelRadius = radius + 30;
      const angle = angleStep * index - Math.PI / 2;
      const labelX = center + labelRadius * Math.cos(angle);
      const labelY = center + labelRadius * Math.sin(angle);
      const textAnchor = Math.abs(labelX - center) < 5 ? "middle" :
        labelX > center ? "start" : "end";

      labelPositions.push({
        x: labelX,
        y: labelY,
        text: getDimensionLabel(dim, language),
        anchor: textAnchor,
      });
    });

    const toPolygon = (points: [number, number][]) =>
      points.map(([pointX, pointY]) => `${pointX},${pointY}`).join(" ");

    return {
      valuePolygon: toPolygon(valuePoints),
      supportPolygon: toPolygon(supportPoints),
      labels: labelPositions,
      gridLines: gridCircles,
    };
  }, [valueDimWeights, supportStrengths, language, maxWeight, center, radius, angleStep]);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid circles */}
        {gridLines.map(level => {
          const gridRadius = (level / 100) * radius;
          return (
            <circle
              key={level}
              cx={center}
              cy={center}
              r={gridRadius}
              fill="none"
              stroke={COLORS.grid}
              strokeWidth={level === 100 ? 1.5 : 0.8}
              strokeDasharray={level < 100 ? "3,3" : "none"}
            />
          );
        })}

        {/* Axis lines */}
        {VALUE_DIMENSIONS.map((_, index) => {
          const [endX, endY] = getPoint(index, 100);
          return (
            <line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke={COLORS.grid}
              strokeWidth={0.8}
            />
          );
        })}

        {/* Support polygon (back layer) */}
        <polygon
          points={supportPolygon}
          fill={`${COLORS.support}20`}
          stroke={COLORS.support}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Value weight polygon (front layer) */}
        <polygon
          points={valuePolygon}
          fill={`${COLORS.valueWeight}20`}
          stroke={COLORS.valueWeight}
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {VALUE_DIMENSIONS.map((dim, index) => {
          const weightNorm = (valueDimWeights[dim] / maxWeight) * 100;
          const supportVal = Math.min(supportStrengths[dim], 100);
          const [valueX, valueY] = getPoint(index, weightNorm);
          const [supportX, supportY] = getPoint(index, supportVal);
          return (
            <g key={`dots-${dim}`}>
              <circle cx={supportX} cy={supportY} r={3.5} fill={COLORS.support} />
              <circle cx={valueX} cy={valueY} r={3.5} fill={COLORS.valueWeight} />
            </g>
          );
        })}

        {/* Labels */}
        {labels.map((label, index) => (
          <text
            key={`label-${index}`}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor}
            dominantBaseline="middle"
            fill={COLORS.text}
            fontSize={12}
            fontWeight={500}
          >
            {label.text}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-[3px] rounded" style={{ background: COLORS.valueWeight }} />
          <span className="text-xs text-muted-foreground">
            {language === "en" ? "Value Weight" : language === "zh-TW" ? "價值權重" : "价值权重"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[3px] rounded" style={{ background: COLORS.support }} />
          <span className="text-xs text-muted-foreground">
            {language === "en" ? "Anchor Support" : language === "zh-TW" ? "錨點支持強度" : "锚点支持强度"}
          </span>
        </div>
      </div>
    </div>
  );
}
