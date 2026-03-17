/**
 * Tension Quadrant Chart — X: Alignment, Y: Tension
 * 4 quadrants: Stable Integration / High Drive High Cost / Structural Conflict / Exploration
 */

import type { Language } from "@/hooks/useLanguage";

interface TensionQuadrantChartProps {
  alignmentScore: number;
  tensionIndex: number;
  language: Language;
  size?: number;
}

const QUADRANT_COLORS = {
  q1: "#dcfce7", // stable — green tint
  q2: "#fef9c3", // high drive — yellow tint
  q3: "#fee2e2", // conflict — red tint
  q4: "#dbeafe", // exploration — blue tint
};

export default function TensionQuadrantChart({
  alignmentScore,
  tensionIndex,
  language,
  size = 400,
}: TensionQuadrantChartProps) {
  const padding = 50;
  const chartSize = size - padding * 2;
  const halfChart = chartSize / 2;

  // Map scores to pixel positions
  const pointX = padding + (alignmentScore / 100) * chartSize;
  const pointY = padding + ((100 - tensionIndex) / 100) * chartSize; // Y inverted
  const midX = padding + halfChart;
  const midY = padding + halfChart;

  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const quadrantLabels = {
    q1: isEn ? "Stable\nIntegration" : isTW ? "穩定\n整合區" : "稳定\n整合区",
    q2: isEn ? "High Drive\nHigh Cost" : isTW ? "高驅動\n高消耗區" : "高驱动\n高消耗区",
    q3: isEn ? "Structural\nConflict" : isTW ? "結構\n衝突區" : "结构\n冲突区",
    q4: isEn ? "Exploration\nTrial" : isTW ? "探索\n試錯區" : "探索\n试错区",
  };

  // Determine which quadrant the user is in
  const userQuadrant = alignmentScore >= 50
    ? (tensionIndex <= 50 ? "q1" : "q2")
    : (tensionIndex > 50 ? "q3" : "q4");

  const quadrantInterpretations: Record<string, string> = {
    q1: isEn
      ? "Your values and career structure are well-aligned with low tension — a stable and sustainable state."
      : isTW
        ? "你的價值觀與職業結構高度一致、張力低——處於穩定可持續的狀態。"
        : "你的价值观与职业结构高度一致、张力低——处于稳定可持续的状态。",
    q2: isEn
      ? "High alignment but also high tension — you're driven but at risk of burnout from structural contradictions."
      : isTW
        ? "高一致但也高張力——你有強驅動力，但結構性矛盾可能導致消耗過大。"
        : "高一致但也高张力——你有强驱动力，但结构性矛盾可能导致消耗过大。",
    q3: isEn
      ? "Low alignment with high tension — significant structural conflict exists between values and career anchors."
      : isTW
        ? "低一致且高張力——價值觀與職業錨之間存在顯著結構衝突。"
        : "低一致且高张力——价值观与职业锚之间存在显著结构冲突。",
    q4: isEn
      ? "Low alignment but low tension — still exploring, with room to experiment before structural pressure builds."
      : isTW
        ? "低一致但低張力——仍在探索階段，在結構壓力形成前有試錯空間。"
        : "低一致但低张力——仍在探索阶段，在结构压力形成前有试错空间。",
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background quadrants */}
        <rect x={midX} y={padding} width={halfChart} height={halfChart}
          fill={QUADRANT_COLORS.q2} rx={0} />
        <rect x={padding} y={padding} width={halfChart} height={halfChart}
          fill={QUADRANT_COLORS.q3} rx={0} />
        <rect x={padding} y={midY} width={halfChart} height={halfChart}
          fill={QUADRANT_COLORS.q4} rx={0} />
        <rect x={midX} y={midY} width={halfChart} height={halfChart}
          fill={QUADRANT_COLORS.q1} rx={0} />

        {/* Grid lines */}
        <line x1={midX} y1={padding} x2={midX} y2={padding + chartSize}
          stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,4" />
        <line x1={padding} y1={midY} x2={padding + chartSize} y2={midY}
          stroke="#94a3b8" strokeWidth={1} strokeDasharray="4,4" />

        {/* Axes */}
        <line x1={padding} y1={padding + chartSize} x2={padding + chartSize} y2={padding + chartSize}
          stroke="#475569" strokeWidth={1.5} />
        <line x1={padding} y1={padding} x2={padding} y2={padding + chartSize}
          stroke="#475569" strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={padding + chartSize / 2} y={size - 8} textAnchor="middle" fontSize={12} fill="#475569" fontWeight={600}>
          {isEn ? "Alignment →" : isTW ? "一致度 →" : "一致度 →"}
        </text>
        <text x={12} y={padding + chartSize / 2} textAnchor="middle" fontSize={12} fill="#475569" fontWeight={600}
          transform={`rotate(-90, 12, ${padding + chartSize / 2})`}>
          {isEn ? "Tension →" : isTW ? "張力 →" : "张力 →"}
        </text>

        {/* Scale markers */}
        <text x={padding} y={padding + chartSize + 16} textAnchor="middle" fontSize={10} fill="#94a3b8">0</text>
        <text x={midX} y={padding + chartSize + 16} textAnchor="middle" fontSize={10} fill="#94a3b8">50</text>
        <text x={padding + chartSize} y={padding + chartSize + 16} textAnchor="middle" fontSize={10} fill="#94a3b8">100</text>
        <text x={padding - 8} y={padding + chartSize} textAnchor="end" fontSize={10} fill="#94a3b8">0</text>
        <text x={padding - 8} y={midY + 4} textAnchor="end" fontSize={10} fill="#94a3b8">50</text>
        <text x={padding - 8} y={padding + 4} textAnchor="end" fontSize={10} fill="#94a3b8">100</text>

        {/* Quadrant labels */}
        {quadrantLabels.q1.split("\n").map((line, lineIndex) => (
          <text key={`q1-${lineIndex}`} x={midX + halfChart / 2} y={midY + halfChart / 2 - 8 + lineIndex * 16}
            textAnchor="middle" fontSize={11} fill="#16a34a" fontWeight={500} opacity={0.7}>{line}</text>
        ))}
        {quadrantLabels.q2.split("\n").map((line, lineIndex) => (
          <text key={`q2-${lineIndex}`} x={midX + halfChart / 2} y={padding + halfChart / 2 - 8 + lineIndex * 16}
            textAnchor="middle" fontSize={11} fill="#ca8a04" fontWeight={500} opacity={0.7}>{line}</text>
        ))}
        {quadrantLabels.q3.split("\n").map((line, lineIndex) => (
          <text key={`q3-${lineIndex}`} x={padding + halfChart / 2} y={padding + halfChart / 2 - 8 + lineIndex * 16}
            textAnchor="middle" fontSize={11} fill="#dc2626" fontWeight={500} opacity={0.7}>{line}</text>
        ))}
        {quadrantLabels.q4.split("\n").map((line, lineIndex) => (
          <text key={`q4-${lineIndex}`} x={padding + halfChart / 2} y={midY + halfChart / 2 - 8 + lineIndex * 16}
            textAnchor="middle" fontSize={11} fill="#2563eb" fontWeight={500} opacity={0.7}>{line}</text>
        ))}

        {/* User point — pulsing dot */}
        <circle cx={pointX} cy={pointY} r={12} fill="#ef444440" />
        <circle cx={pointX} cy={pointY} r={7} fill="#ef4444" stroke="#fff" strokeWidth={2} />

        {/* Score annotation */}
        <text x={pointX + 14} y={pointY - 6} fontSize={11} fill="#1e293b" fontWeight={700}>
          ({Math.round(alignmentScore)}, {Math.round(tensionIndex)})
        </text>
      </svg>

      {/* Quadrant interpretation */}
      <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm leading-relaxed">
        {quadrantInterpretations[userQuadrant]}
      </p>
    </div>
  );
}
