/**
 * SCPC V3 Report SVG Chart Generators
 * Produces inline SVG strings for embedding in HTML reports (PDF-ready, vector quality)
 */

import { ANCHOR_TYPES } from "@/lib/reportConstants";

type LangKey = "en" | "zh-TW" | "zh-CN";

interface AnchorScore {
  code: string;
  score: number;
  label: string;
}

// ============================================================
// Color Constants
// ============================================================

const ZONE_COLORS = {
  coreAdvantage: { fill: "#1C2857", bg: "rgba(28, 40, 87, 0.08)", border: "#1C2857", text: "#1C2857", light: "#dce4f2" },
  highSensitivity: { fill: "#E67E22", bg: "rgba(230, 126, 34, 0.08)", border: "#E67E22", text: "#9A4B0A", light: "#fde8d4" },
  moderate: { fill: "#F6C343", bg: "rgba(246, 195, 67, 0.08)", border: "#F6C343", text: "#8b6914", light: "#fdf3d0" },
  nonCore: { fill: "#10B981", bg: "rgba(16, 185, 129, 0.08)", border: "#10B981", text: "#065F46", light: "#d1fae5" },
};

const BRAND_NAVY = "#1e406e";

function getScoreZone(score: number): keyof typeof ZONE_COLORS {
  if (score >= 80) return "coreAdvantage";
  if (score >= 65) return "highSensitivity";
  if (score >= 45) return "moderate";
  return "nonCore";
}

// ============================================================
// Radar Chart (八维雷达图 / 锚職涯核心驅動圖)
// ============================================================

function polarToCartesian(centerX: number, centerY: number, radius: number, angleDeg: number): { x: number; y: number } {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleRad),
    y: centerY + radius * Math.sin(angleRad),
  };
}

export function generateRadarChartSVG(
  scores: Record<string, number>,
  language: LangKey = "zh-CN",
  viewBoxSize: number = 600,
): string {
  const center = viewBoxSize / 2;
  const maxRadius = viewBoxSize * 0.32;
  const labelRadius = maxRadius + 50;
  const anchorCount = 8;
  const angleStep = 360 / anchorCount;

  const anchorScores: AnchorScore[] = ANCHOR_TYPES.map((anchorType) => ({
    code: anchorType.code,
    score: scores[`score_${anchorType.code.toLowerCase()}`] ?? scores[anchorType.code] ?? 0,
    label: anchorType.label[language] || anchorType.label.en,
  }));

  // Background grid rings
  const gridLevels = [25, 50, 75, 100];
  const gridRings = gridLevels.map((level) => {
    const radius = (level / 100) * maxRadius;
    const points = Array.from({ length: anchorCount }, (_, index) => {
      const angle = index * angleStep;
      const point = polarToCartesian(center, center, radius, angle);
      return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    }).join(" ");
    return `<polygon points="${points}" fill="none" stroke="#e2e8f0" stroke-width="${level === 100 ? 1.5 : 0.8}" stroke-dasharray="${level < 100 ? '4,4' : 'none'}" />`;
  });

  // Grid level labels
  const gridLabels = gridLevels.map((level) => {
    const radius = (level / 100) * maxRadius;
    return `<text x="${center + 4}" y="${center - radius - 2}" font-size="9" fill="#6b7280" font-family="'SF Mono', 'Fira Code', monospace">${level}</text>`;
  });

  // Axis lines
  const axisLines = Array.from({ length: anchorCount }, (_, index) => {
    const angle = index * angleStep;
    const endPoint = polarToCartesian(center, center, maxRadius, angle);
    return `<line x1="${center}" y1="${center}" x2="${endPoint.x.toFixed(2)}" y2="${endPoint.y.toFixed(2)}" stroke="#e2e8f0" stroke-width="0.8" />`;
  });

  // Zone background fills — transparent (no zone coloring)
  const zoneRings: string[] = []; // disabled — radar chart has no zone color fill
  const _zoneRingsDef = [
    { min: 0, max: 44 },
    { min: 45, max: 64 },
    { min: 65, max: 79 },
    { min: 80, max: 100 },
  ];

  // Score polygon (the data shape)
  const scorePoints = anchorScores.map((anchor, index) => {
    const angle = index * angleStep;
    const radius = (anchor.score / 100) * maxRadius;
    const point = polarToCartesian(center, center, radius, angle);
    return `${point.x.toFixed(2)},${point.y.toFixed(2)}`;
  }).join(" ");

  // Score dots — monochrome navy
  const scoreDots = anchorScores.map((anchor, index) => {
    const angle = index * angleStep;
    const radius = (anchor.score / 100) * maxRadius;
    const point = polarToCartesian(center, center, radius, angle);
    return `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="5" fill="${BRAND_NAVY}" stroke="white" stroke-width="2" />`;
  });

  // Labels with scores — monochrome navy
  const labels = anchorScores.map((anchor, index) => {
    const angle = index * angleStep;
    const labelPoint = polarToCartesian(center, center, labelRadius, angle);
    const scoreColor = BRAND_NAVY;

    // Adjust text-anchor based on position
    let textAnchor = "middle";
    let deltaX = 0;
    if (angle > 30 && angle < 150) { textAnchor = "start"; deltaX = 4; }
    else if (angle > 210 && angle < 330) { textAnchor = "end"; deltaX = -4; }

    return `
      <g>
        <text x="${(labelPoint.x + deltaX).toFixed(2)}" y="${(labelPoint.y - 6).toFixed(2)}" 
              font-size="12" font-weight="600" fill="${BRAND_NAVY}" text-anchor="${textAnchor}"
              font-family="'Noto Sans TC', 'Noto Sans SC', sans-serif">${anchor.label}</text>
        <text x="${(labelPoint.x + deltaX).toFixed(2)}" y="${(labelPoint.y + 10).toFixed(2)}" 
              font-size="13" font-weight="700" fill="${scoreColor}" text-anchor="${textAnchor}"
              font-family="'Montserrat', sans-serif" letter-spacing="1">${anchor.code}</text>
      </g>
    `;
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" 
     width="${viewBoxSize}" height="${viewBoxSize}"
     style="max-width: 100%; height: auto;">
  <defs>
    <linearGradient id="radarFillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BRAND_NAVY}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${BRAND_NAVY}" stop-opacity="0.08" />
    </linearGradient>
  </defs>
  
  <!-- Zone background (none) -->
  
  <!-- Grid rings -->
  ${gridRings.join("\n  ")}
  ${gridLabels.join("\n  ")}
  
  <!-- Axis lines -->
  ${axisLines.join("\n  ")}
  
  <!-- Score polygon -->
  <polygon points="${scorePoints}" 
           fill="url(#radarFillGradient)" 
           stroke="${BRAND_NAVY}" stroke-width="2.5" 
           stroke-linejoin="round" />
  
  <!-- Score dots -->
  ${scoreDots.join("\n  ")}
  
  <!-- Labels -->
  ${labels.join("\n  ")}
</svg>`.trim();
}

// ============================================================
// Four-Zone Positioning Chart (職涯定位圖)
// ============================================================

interface ZoneConfig {
  key: string;
  scoreMin: number;
  scoreMax: number;
  color: typeof ZONE_COLORS[keyof typeof ZONE_COLORS];
  labelMap: Record<LangKey, string>;
  rangeLabel: string;
}

const ZONE_CONFIGS: ZoneConfig[] = [
  {
    key: "coreAdvantage",
    scoreMin: 80, scoreMax: 100,
    color: ZONE_COLORS.coreAdvantage,
    labelMap: { en: "Core Advantage Anchor", "zh-TW": "核心優勢錨點", "zh-CN": "核心优势锚点" },
    rangeLabel: "80–100",
  },
  {
    key: "highSensitivity",
    scoreMin: 65, scoreMax: 79,
    color: ZONE_COLORS.highSensitivity,
    labelMap: { en: "High-Sensitivity Zone", "zh-TW": "高敏感區", "zh-CN": "高敏感区" },
    rangeLabel: "65–79",
  },
  {
    key: "moderate",
    scoreMin: 45, scoreMax: 64,
    color: ZONE_COLORS.moderate,
    labelMap: { en: "Moderate Influence", "zh-TW": "中度影響", "zh-CN": "中度影响" },
    rangeLabel: "45–64",
  },
  {
    key: "nonCore",
    scoreMin: 0, scoreMax: 44,
    color: ZONE_COLORS.nonCore,
    labelMap: { en: "Non-core Dimension", "zh-TW": "非核心維度", "zh-CN": "非核心维度" },
    rangeLabel: "<45",
  },
];

export function generateFourZoneChartSVG(
  scores: Record<string, number>,
  language: LangKey = "zh-CN",
): string {
  const width = 680;
  const zoneHeight = 72;
  const headerHeight = 32;
  const padding = 16;
  const totalHeight = headerHeight + ZONE_CONFIGS.length * zoneHeight + padding * 2;

  const anchorScores: AnchorScore[] = ANCHOR_TYPES.map((anchorType) => ({
    code: anchorType.code,
    score: scores[`score_${anchorType.code.toLowerCase()}`] ?? scores[anchorType.code] ?? 0,
    label: anchorType.label[language] || anchorType.label.en,
  }));

  // Group anchors by zone
  const zoneAnchors: Record<string, AnchorScore[]> = {};
  for (const config of ZONE_CONFIGS) {
    zoneAnchors[config.key] = anchorScores
      .filter((anchor) => {
        if (config.scoreMin === 0) return anchor.score < 45;
        return anchor.score >= config.scoreMin && anchor.score <= config.scoreMax;
      })
      .sort((anchorA, anchorB) => anchorB.score - anchorA.score);
  }

  const zones = ZONE_CONFIGS.map((config, zoneIndex) => {
    const yOffset = headerHeight + padding + zoneIndex * zoneHeight;
    const anchorsInZone = zoneAnchors[config.key] || [];
    const zoneLabel = config.labelMap[language];

    // Zone background
    const zoneBg = `<rect x="${padding}" y="${yOffset}" width="${width - padding * 2}" height="${zoneHeight - 4}" rx="8" ry="8" fill="${config.color.light}" stroke="${config.color.border}" stroke-width="1" stroke-opacity="0.3" />`;

    // Zone label (left side)
    const zoneLabelEl = `
      <g>
        <rect x="${padding + 8}" y="${yOffset + 8}" width="140" height="28" rx="4" fill="${config.color.border}" fill-opacity="0.1" />
        <text x="${padding + 78}" y="${yOffset + 27}" font-size="13" font-weight="600" fill="${config.color.text}" text-anchor="middle"
              font-family="'Noto Sans TC', 'Noto Sans SC', sans-serif">${zoneLabel}</text>
        <text x="${padding + 78}" y="${yOffset + 46}" font-size="10" fill="${config.color.text}" text-anchor="middle" opacity="0.7"
              font-family="'SF Mono', 'Fira Code', monospace">${config.rangeLabel}</text>
      </g>
    `;

    // Anchor items (right side)
    const anchorStartX = padding + 160;
    const anchorItemWidth = 80;
    const anchorItems = anchorsInZone.length > 0
      ? anchorsInZone.map((anchor, anchorIndex) => {
          const anchorX = anchorStartX + anchorIndex * (anchorItemWidth + 12);
          return `
            <g>
              <rect x="${anchorX}" y="${yOffset + 12}" width="${anchorItemWidth}" height="${zoneHeight - 28}" rx="6" 
                    fill="white" stroke="${config.color.border}" stroke-width="1.5" />
              <text x="${anchorX + anchorItemWidth / 2}" y="${yOffset + 36}" font-size="11" font-weight="600" fill="${BRAND_NAVY}" text-anchor="middle"
                    font-family="'Noto Sans TC', 'Noto Sans SC', sans-serif">${anchor.label}</text>
              <text x="${anchorX + anchorItemWidth / 2}" y="${yOffset + 56}" font-size="16" font-weight="700" fill="${config.color.fill}" text-anchor="middle"
                    font-family="'SF Mono', 'Fira Code', monospace">${Math.round(anchor.score)}</text>
              <!-- Score bar -->
              <rect x="${anchorX + 8}" y="${yOffset + 64}" width="${anchorItemWidth - 16}" height="3" rx="1.5" fill="${config.color.border}" fill-opacity="0.15" />
              <rect x="${anchorX + 8}" y="${yOffset + 64}" width="${(anchorItemWidth - 16) * (anchor.score / 100)}" height="3" rx="1.5" fill="${config.color.fill}" />
            </g>
          `;
        }).join("")
      : `<text x="${anchorStartX + 20}" y="${yOffset + zoneHeight / 2 + 4}" font-size="12" fill="#6b7280" font-style="italic"
              font-family="'Noto Sans TC', 'Noto Sans SC', sans-serif">—</text>`;

    return `${zoneBg}\n${zoneLabelEl}\n${anchorItems}`;
  });

  const titleText: Record<LangKey, string> = {
    en: "Career Positioning Chart",
    "zh-TW": "職涯定位圖",
    "zh-CN": "职涯定位图",
  };

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalHeight}" 
     width="${width}" height="${totalHeight}"
     style="max-width: 100%; height: auto;">
  <!-- Title -->
  <text x="${width / 2}" y="${headerHeight}" font-size="16" font-weight="700" fill="${BRAND_NAVY}" text-anchor="middle"
        font-family="'Noto Sans TC', 'Noto Sans SC', 'Helvetica Neue', sans-serif">${titleText[language]}</text>
  
  <!-- Zones -->
  ${zones.join("\n  ")}
</svg>`.trim();
}

// ============================================================
// Exports
// ============================================================

export { ZONE_COLORS, ZONE_CONFIGS, getScoreZone };
export type { AnchorScore, LangKey };
