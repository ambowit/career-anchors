/**
 * SCPC Fusion Engine V3 — Structure Classification Algorithm
 *
 * Determines the user's current-stage fusion structure label by computing
 * three core metrics from Life Card spectrum distribution + Career Anchor scores:
 *
 *   1. alignment_index  — cosine similarity between anchor direction vector
 *                         and life-card spectrum vector
 *   2. tension_index    — weighted combination of life-card internal tension,
 *                         anchor internal tension, and cross-system divergence
 *   3. balance_index    — weighted combination of life-card spectrum balance
 *                         and anchor distribution balance (std-dev based)
 *
 * Output: one of 6 development-oriented structure labels
 *   结构一致 / 双重中心 / 阶段探索 / 发展张力 / 均衡成长 / 重点定位
 *
 * No external dependencies — only types.
 */

import type { Language } from "@/hooks/useLanguage";

// ── Types ──────────────────────────────────────────────────────────────

export type ValueDimension =
  | "achievement"
  | "influence"
  | "freedom"
  | "security"
  | "relationships"
  | "creation"
  | "meaning"
  | "quality_of_life";

export type AnchorCode = "TF" | "GM" | "AU" | "SE" | "EC" | "SV" | "CH" | "LS";

export type MaturityLevel = "L1" | "L2" | "L3" | "L4";
export type CareerStageInput = "early" | "mid" | "senior";

/** Spectrum distribution from Ideal Life Card assessment */
export interface SpectrumDistribution {
  career_ratio: number;   // 0-1, fraction of cards in career zone
  neutral_ratio: number;  // 0-1, fraction of cards in neutral zone
  lifestyle_ratio: number; // 0-1, fraction of cards in lifestyle zone
}

export interface FusionInputData {
  lifeCardsTop10: Array<{
    rank: number;
    cardId: number;
    cardName: string;
    cardNameEn: string;
    category: string;
  }>;
  anchorScores: Record<AnchorCode, number>; // 0-100 standardized
  careerStage: CareerStageInput;
  /** Spectrum distribution — when provided, activates V2 algorithm */
  spectrumDistribution?: SpectrumDistribution;
  /** Optional previous metrics for boundary buffer */
  previousMetrics?: {
    alignmentIndex: number;
    tensionIndex: number;
    balanceIndex: number;
    structureLabel: string;
  };
  optionalNotes?: string;
}

export interface FusionComputedMetrics {
  // V2 Core metrics (0-100 integers)
  alignmentScore: number;
  alignmentLevel: string;
  tensionIndex: number;
  tensionLevel: string;
  concentration: number;
  balance: number;
  concentrationLevel: string;
  maturityLevel: MaturityLevel;
  maturityLabel: string;
  structureType: string;
  structureTags: string[];
  /** Localized development-oriented summary for the structure label */
  structureSummary: string;

  // Detailed breakdown (legacy, still computed for heatmap & report sections)
  valueDimWeights: Record<ValueDimension, number>;
  supportStrengths: Record<ValueDimension, number>;
  top3Values: ValueDimension[];
  underSupported: ValueDimension[];
  notRepresented: AnchorCode[];
  tensionPenalties: string[];

  // Heatmap data
  heatmapData: Record<ValueDimension, Record<AnchorCode, number>>;

  // Card dimension assignments for display
  cardDimensionMap: Array<{
    rank: number;
    cardId: number;
    cardName: string;
    cardNameEn: string;
    dimension: ValueDimension;
    dimensionLabel: string;
  }>;

  // V2 intermediate values (exposed for report rendering)
  crossTension: number;
  /** Anchor direction vector components */
  anchorDirectionVector: {
    career: number;
    neutral: number;
    lifestyle: number;
  };
  /** 0-100: 0=career-focused, 50=neutral, 100=life-focused */
  positionX: number;
  /** 0-100: 0=gentle drive, 100=strong drive */
  positionY: number;
}

// ── Constants ──────────────────────────────────────────────────────────

export const VALUE_DIMENSIONS: ValueDimension[] = [
  "achievement", "influence", "freedom", "security",
  "relationships", "creation", "meaning", "quality_of_life",
];

export const ANCHOR_CODES: AnchorCode[] = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"];

/** Rank weight vector — sums to 1.0 */
const RANK_WEIGHTS = [0.20, 0.16, 0.12, 0.10, 0.09, 0.08, 0.08, 0.07, 0.06, 0.04];

/** Value Dimension → Anchor mapping weight matrix W (legacy, still used for heatmap) */
const VALUE_ANCHOR_WEIGHT_MATRIX: Record<ValueDimension, Partial<Record<AnchorCode, number>>> = {
  achievement:     { TF: 0.6, CH: 0.4 },
  influence:       { GM: 0.6, EC: 0.4 },
  freedom:         { AU: 1.0 },
  security:        { SE: 1.0 },
  relationships:   { SV: 0.6, LS: 0.4 },
  creation:        { EC: 0.6, TF: 0.4 },
  meaning:         { SV: 0.7, CH: 0.3 },
  quality_of_life: { LS: 0.7, AU: 0.3 },
};

/**
 * Card ID → Value Dimension mapping (70 cards → 8 dimensions)
 */
const CARD_DIMENSION_MAP: Record<number, ValueDimension> = {
  // 成就 Achievement
  13: "achievement", 14: "achievement", 19: "achievement", 21: "achievement",
  25: "achievement", 27: "achievement", 63: "achievement", 70: "achievement",
  // 影响力 Influence
  24: "influence", 29: "influence", 31: "influence", 32: "influence",
  40: "influence", 69: "influence",
  // 自由 Freedom
  3: "freedom", 10: "freedom", 11: "freedom", 41: "freedom",
  53: "freedom", 54: "freedom",
  // 安全 Security
  9: "security", 44: "security", 46: "security", 48: "security",
  58: "security", 62: "security", 64: "security", 65: "security", 68: "security",
  // 关系 Relationships
  28: "relationships", 30: "relationships", 33: "relationships", 34: "relationships",
  35: "relationships", 36: "relationships", 37: "relationships", 38: "relationships",
  39: "relationships",
  // 创造 Creation
  12: "creation", 17: "creation", 22: "creation", 23: "creation",
  60: "creation", 66: "creation", 67: "creation",
  // 意义 Meaning
  1: "meaning", 4: "meaning", 7: "meaning", 8: "meaning",
  15: "meaning", 18: "meaning", 20: "meaning", 26: "meaning", 42: "meaning",
  // 生活质量 Quality of Life
  2: "quality_of_life", 5: "quality_of_life", 6: "quality_of_life",
  16: "quality_of_life", 43: "quality_of_life", 45: "quality_of_life",
  47: "quality_of_life", 49: "quality_of_life", 50: "quality_of_life",
  51: "quality_of_life", 52: "quality_of_life", 55: "quality_of_life",
  56: "quality_of_life", 57: "quality_of_life", 59: "quality_of_life",
  61: "quality_of_life",
};

// ── i18n Labels ────────────────────────────────────────────────────────

export const DIMENSION_LABELS: Record<ValueDimension, Record<Language, string>> = {
  achievement:     { "zh-CN": "成就", "zh-TW": "成就", en: "Achievement" },
  influence:       { "zh-CN": "影响力", "zh-TW": "影響力", en: "Influence" },
  freedom:         { "zh-CN": "自由", "zh-TW": "自由", en: "Freedom" },
  security:        { "zh-CN": "安全", "zh-TW": "安全", en: "Security" },
  relationships:   { "zh-CN": "关系", "zh-TW": "關係", en: "Relationships" },
  creation:        { "zh-CN": "创造", "zh-TW": "創造", en: "Creation" },
  meaning:         { "zh-CN": "意义", "zh-TW": "意義", en: "Meaning" },
  quality_of_life: { "zh-CN": "生活质量", "zh-TW": "生活品質", en: "Quality of Life" },
};

export const ANCHOR_LABELS: Record<AnchorCode, Record<Language, string>> = {
  TF: { "zh-CN": "技术/专业", "zh-TW": "技術/專業", en: "TF" },
  GM: { "zh-CN": "管理", "zh-TW": "管理", en: "GM" },
  AU: { "zh-CN": "自主/独立", "zh-TW": "自主/獨立", en: "AU" },
  SE: { "zh-CN": "安全/稳定", "zh-TW": "安全/穩定", en: "SE" },
  EC: { "zh-CN": "创业/创造", "zh-TW": "創業/創造", en: "EC" },
  SV: { "zh-CN": "服务/奉献", "zh-TW": "服務/奉獻", en: "SV" },
  CH: { "zh-CN": "挑战", "zh-TW": "挑戰", en: "CH" },
  LS: { "zh-CN": "生活方式", "zh-TW": "生活方式", en: "LS" },
};

export function getDimensionLabel(dimension: ValueDimension, language: Language): string {
  return DIMENSION_LABELS[dimension]?.[language] || dimension;
}

export function getAnchorLabel(anchor: AnchorCode, language: Language): string {
  return ANCHOR_LABELS[anchor]?.[language] || anchor;
}

// ── Utility Helpers ───────────────────────────────────────────────────

/** Standard deviation of a numeric array */
function stdDev(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Clamp a value between 0 and 100, then round to integer */
function clampRound(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}

// ══════════════════════════════════════════════════════════════════════
//  V2 CORE ALGORITHM — Spectrum × Anchor Structure Classification
// ══════════════════════════════════════════════════════════════════════

// ── Anchor Direction Grouping ─────────────────────────────────────────

/**
 * Group 8 anchors into 3 direction scores (career / neutral / lifestyle).
 *
 * Mapping (per spec §5, updated):
 *   career   ← mean(TF, GM, CH, EC)
 *   neutral  ← mean(AU, SV, TF)
 *   lifestyle← mean(LS, SE)
 *
 * Anchors may appear in multiple groups (structural mapping, not category).
 */
function computeAnchorDirectionVector(
  scores: Record<AnchorCode, number>,
): { career: number; neutral: number; lifestyle: number } {
  const career = (scores.TF + scores.GM + scores.CH + scores.EC) / 4;
  const neutral = (scores.AU + scores.SV + scores.TF) / 3;
  const lifestyle = (scores.LS + scores.SE) / 2;
  return { career, neutral, lifestyle };
}

// ── 1. Alignment Index (§6) ───────────────────────────────────────────

/**
 * Alignment = cosine similarity between anchor direction vector
 * and life-card spectrum distribution vector, scaled to 0-100.
 */
function computeAlignmentIndex(
  anchorDirection: { career: number; neutral: number; lifestyle: number },
  spectrum: SpectrumDistribution,
): number {
  const anchorVector = [anchorDirection.career, anchorDirection.neutral, anchorDirection.lifestyle];
  const lifeVector = [
    spectrum.career_ratio * 100,
    spectrum.neutral_ratio * 100,
    spectrum.lifestyle_ratio * 100,
  ];

  const dotProduct =
    anchorVector[0] * lifeVector[0] +
    anchorVector[1] * lifeVector[1] +
    anchorVector[2] * lifeVector[2];

  const magnitudeAnchor = Math.sqrt(
    anchorVector[0] ** 2 + anchorVector[1] ** 2 + anchorVector[2] ** 2,
  );
  const magnitudeLife = Math.sqrt(
    lifeVector[0] ** 2 + lifeVector[1] ** 2 + lifeVector[2] ** 2,
  );

  if (magnitudeAnchor === 0 || magnitudeLife === 0) return 50;

  const cosineSimilarity = dotProduct / (magnitudeAnchor * magnitudeLife);
  return clampRound(cosineSimilarity * 100);
}

// ── 2. Tension Index (§7) ─────────────────────────────────────────────

/**
 * Tension = weighted combination of 3 sub-tensions:
 *   A. Life-card internal tension  (35%)
 *   B. Anchor top-3 gap           (25%)
 *   C. Cross-system divergence    (40%)
 */
function computeTensionIndex(
  anchorScores: Record<AnchorCode, number>,
  anchorDirection: { career: number; neutral: number; lifestyle: number },
  spectrum: SpectrumDistribution,
): { tensionIndex: number; crossTension: number; lifeTension: number; anchorTopGap: number } {
  // A. Life-card internal tension
  const ratios = [spectrum.career_ratio, spectrum.neutral_ratio, spectrum.lifestyle_ratio];
  const lifeTension = (Math.max(...ratios) - Math.min(...ratios)) * 100;

  // B. Anchor internal tension — gap between top-3 and bottom of top-3
  const sortedAnchorScores = Object.values(anchorScores).sort((a, b) => b - a);
  const anchorTopGap = sortedAnchorScores[0] - sortedAnchorScores[2];

  // C. Cross-system direction difference
  const crossTension = (
    Math.abs(anchorDirection.career - spectrum.career_ratio * 100) +
    Math.abs(anchorDirection.neutral - spectrum.neutral_ratio * 100) +
    Math.abs(anchorDirection.lifestyle - spectrum.lifestyle_ratio * 100)
  ) / 3;

  // D. Final weighted tension
  const rawTension = lifeTension * 0.35 + anchorTopGap * 0.25 + crossTension * 0.40;

  return {
    tensionIndex: clampRound(rawTension),
    crossTension: Math.round(crossTension),
    lifeTension: Math.round(lifeTension),
    anchorTopGap: Math.round(anchorTopGap),
  };
}

// ── 3. Balance Index (§8) ─────────────────────────────────────────────

/**
 * Balance = weighted combination of:
 *   A. Life-card spectrum balance  (40%)  — 100 minus std-dev of 3 ratios×100
 *   B. Anchor distribution balance (60%)  — 100 minus std-dev of all 8 scores
 */
function computeBalanceIndex(
  anchorScores: Record<AnchorCode, number>,
  spectrum: SpectrumDistribution,
): number {
  // A. Life-card balance
  const lifeValues = [
    spectrum.career_ratio * 100,
    spectrum.neutral_ratio * 100,
    spectrum.lifestyle_ratio * 100,
  ];
  const lifeBalance = 100 - stdDev(lifeValues);

  // B. Anchor balance
  const anchorValues = ANCHOR_CODES.map((code) => anchorScores[code]);
  const anchorBalance = 100 - stdDev(anchorValues);

  // C. Weighted combination
  return clampRound(lifeBalance * 0.4 + anchorBalance * 0.6);
}

// ── 4. Structure Label Determination (§9) ─────────────────────────────

const STRUCTURE_SUMMARIES: Record<string, Record<Language, string>> = {
  "结构一致": {
    "zh-CN": "当前阶段的人生价值关注与职业驱动方向呈现较高协同。",
    "zh-TW": "當前階段的人生價值關注與職業驅動方向呈現較高協同。",
    en: "At this stage, life value focus and career drive direction show a high degree of alignment.",
  },
  "双重中心": {
    "zh-CN": "当前阶段同时存在两个较突出的发展重心，呈现整合中的结构特征。",
    "zh-TW": "當前階段同時存在兩個較突出的發展重心，呈現整合中的結構特徵。",
    en: "At this stage, two prominent development focuses co-exist, showing an integrative structural pattern.",
  },
  "阶段探索": {
    "zh-CN": "当前阶段呈现较开放的路径探索与发展尝试特征。",
    "zh-TW": "當前階段呈現較開放的路徑探索與發展嘗試特徵。",
    en: "At this stage, an open pattern of path exploration and development experimentation is observed.",
  },
  "发展张力": {
    "zh-CN": "当前阶段不同发展关注之间呈现较明显的整合动力。",
    "zh-TW": "當前階段不同發展關注之間呈現較明顯的整合動力。",
    en: "At this stage, a notable integrative dynamic exists between different development focuses.",
  },
  "均衡成长": {
    "zh-CN": "当前阶段多维关注分布较均衡，整体发展节奏较稳定。",
    "zh-TW": "當前階段多維關注分佈較均衡，整體發展節奏較穩定。",
    en: "At this stage, multi-dimensional attention is relatively balanced with a stable overall development rhythm.",
  },
  "重点定位": {
    "zh-CN": "当前阶段的发展能量更集中于某一重点方向。",
    "zh-TW": "當前階段的發展能量更集中於某一重點方向。",
    en: "At this stage, development energy is more concentrated toward a specific focal direction.",
  },
};

/**
 * Determine structure label using the 3 core metrics + priority rules (§9-§10).
 *
 * Priority: 重点定位 > 结构一致 > 均衡成长 > 双重中心 > 发展张力 > 阶段探索
 */
function determineStructureLabel(
  alignmentIndex: number,
  tensionIndex: number,
  balanceIndex: number,
  crossTension: number,
  anchorScores: Record<AnchorCode, number>,
  spectrum: SpectrumDistribution,
  anchorDirection: { career: number; neutral: number; lifestyle: number },
): string {
  // Helper: check if both systems are highly concentrated on the same direction
  const isBothConcentratedSameDirection = (): boolean => {
    const ratios = [spectrum.career_ratio, spectrum.neutral_ratio, spectrum.lifestyle_ratio];
    const maxRatio = Math.max(...ratios);
    if (maxRatio < 0.45) return false;

    const dominantSpectrumZone =
      spectrum.career_ratio === maxRatio ? "career" :
      spectrum.lifestyle_ratio === maxRatio ? "lifestyle" : "neutral";

    const directionScores = [anchorDirection.career, anchorDirection.neutral, anchorDirection.lifestyle];
    const maxDirection = Math.max(...directionScores);
    const dominantAnchorZone =
      anchorDirection.career === maxDirection ? "career" :
      anchorDirection.lifestyle === maxDirection ? "lifestyle" : "neutral";

    return dominantSpectrumZone === dominantAnchorZone;
  };

  // Helper: check for dual peaks in spectrum and anchor directions
  const hasDualPeakStructure = (): boolean => {
    // Spectrum: two zones each have >= 30% of cards
    const sortedRatios = [spectrum.career_ratio, spectrum.neutral_ratio, spectrum.lifestyle_ratio]
      .sort((a, b) => b - a);
    const spectrumDualPeak = sortedRatios[0] >= 0.30 && sortedRatios[1] >= 0.25;

    // Anchor: top 2 scores from different direction groups
    const sortedAnchors = ANCHOR_CODES
      .map((code) => ({ code, score: anchorScores[code] }))
      .sort((a, b) => b.score - a.score);

    const careerAnchors = new Set<AnchorCode>(["TF", "GM", "CH", "EC"]);
    const lifestyleAnchors = new Set<AnchorCode>(["LS", "AU", "SE"]);

    const topAnchor = sortedAnchors[0].code;
    const secondAnchor = sortedAnchors[1].code;
    const topIsCareer = careerAnchors.has(topAnchor);
    const secondIsCareer = careerAnchors.has(secondAnchor);
    const topIsLifestyle = lifestyleAnchors.has(topAnchor);
    const secondIsLifestyle = lifestyleAnchors.has(secondAnchor);

    const anchorDualDirection =
      (topIsCareer && secondIsLifestyle) || (topIsLifestyle && secondIsCareer);

    return spectrumDualPeak || anchorDualDirection;
  };

  // Helper: check if spectrum and anchor directions are clearly separated
  const isDirectionClearlySeparated = (): boolean => {
    return crossTension >= 25;
  };

  // ── Priority 1: 重点定位 ──
  if (
    (alignmentIndex >= 75 && tensionIndex <= 35 && balanceIndex <= 60) ||
    isBothConcentratedSameDirection()
  ) {
    return "重点定位";
  }

  // ── Priority 2: 结构一致 ──
  if (alignmentIndex >= 70 && tensionIndex <= 40 && balanceIndex >= 60) {
    return "结构一致";
  }

  // ── Priority 3: 均衡成长 ──
  if (alignmentIndex >= 60 && alignmentIndex <= 78 && tensionIndex <= 50 && balanceIndex >= 75) {
    return "均衡成长";
  }

  // ── Priority 4: 双重中心 ──
  if (
    (alignmentIndex >= 55 && alignmentIndex <= 75 && tensionIndex >= 40 && tensionIndex <= 65 && hasDualPeakStructure())
  ) {
    return "双重中心";
  }

  // ── Priority 5: 发展张力 ──
  if (
    (alignmentIndex <= 50 && tensionIndex >= 65) ||
    (alignmentIndex <= 55 && crossTension >= 30 && isDirectionClearlySeparated())
  ) {
    return "发展张力";
  }

  // ── Priority 6: 阶段探索 (default) ──
  return "阶段探索";
}

/**
 * Apply boundary buffer rule (§11): if all 3 metrics changed ≤ ±3
 * from previous version, keep the previous label.
 */
function applyBoundaryBuffer(
  currentLabel: string,
  currentAlignment: number,
  currentTension: number,
  currentBalance: number,
  previous?: FusionInputData["previousMetrics"],
): string {
  if (!previous) return currentLabel;

  const alignmentDelta = Math.abs(currentAlignment - previous.alignmentIndex);
  const tensionDelta = Math.abs(currentTension - previous.tensionIndex);
  const balanceDelta = Math.abs(currentBalance - previous.balanceIndex);

  if (alignmentDelta <= 3 && tensionDelta <= 3 && balanceDelta <= 3) {
    return previous.structureLabel;
  }

  return currentLabel;
}

// ══════════════════════════════════════════════════════════════════════
//  2D POSITIONING
// ══════════════════════════════════════════════════════════════════════

/**
 * Compute X/Y coordinates for the 2D development structure chart.
 *   X axis: 0=career-focused ← → 100=life-focused
 *   Y axis: 0=gentle/flexible → 100=strong drive
 */
function compute2DPosition(
  spectrum: SpectrumDistribution,
  anchorScores: Record<AnchorCode, number>,
): { positionX: number; positionY: number } {
  // X: derived from spectrum career vs lifestyle weight
  const positionX = clampRound(
    50 + (spectrum.lifestyle_ratio - spectrum.career_ratio) * 100,
  );

  // Y: derived from anchor concentration (max-min range, capped at 100)
  const scores = Object.values(anchorScores);
  const concentration = Math.max(...scores) - Math.min(...scores);
  const positionY = clampRound(concentration * 1.2);

  return { positionX, positionY };
}

// ══════════════════════════════════════════════════════════════════════
//  LEGACY COMPUTATIONS (kept for heatmap, card-dimension map, etc.)
// ══════════════════════════════════════════════════════════════════════

export function getCardDimension(cardId: number): ValueDimension {
  return CARD_DIMENSION_MAP[cardId] || "quality_of_life";
}

function computeValueDimWeights(
  cards: FusionInputData["lifeCardsTop10"],
): Record<ValueDimension, number> {
  const weights: Record<ValueDimension, number> = {
    achievement: 0, influence: 0, freedom: 0, security: 0,
    relationships: 0, creation: 0, meaning: 0, quality_of_life: 0,
  };
  cards.forEach((card, index) => {
    if (index >= 10) return;
    const dimension = getCardDimension(card.cardId);
    const rankWeight = RANK_WEIGHTS[index] || 0;
    weights[dimension] += rankWeight;
  });
  return weights;
}

function computeSupportStrengths(
  anchorScores: Record<AnchorCode, number>,
): Record<ValueDimension, number> {
  const support: Record<ValueDimension, number> = {
    achievement: 0, influence: 0, freedom: 0, security: 0,
    relationships: 0, creation: 0, meaning: 0, quality_of_life: 0,
  };
  for (const dim of VALUE_DIMENSIONS) {
    const mappedAnchors = VALUE_ANCHOR_WEIGHT_MATRIX[dim];
    let totalSupport = 0;
    for (const [anchor, weight] of Object.entries(mappedAnchors)) {
      const anchorScore = anchorScores[anchor as AnchorCode] || 0;
      totalSupport += anchorScore * (weight as number);
    }
    support[dim] = Math.round(totalSupport * 100) / 100;
  }
  return support;
}

function computeHeatmapData(
  valueDimWeights: Record<ValueDimension, number>,
  anchorScores: Record<AnchorCode, number>,
): Record<ValueDimension, Record<AnchorCode, number>> {
  const heatmap = {} as Record<ValueDimension, Record<AnchorCode, number>>;
  for (const dim of VALUE_DIMENSIONS) {
    heatmap[dim] = {} as Record<AnchorCode, number>;
    for (const anchor of ANCHOR_CODES) {
      const mappingWeight = VALUE_ANCHOR_WEIGHT_MATRIX[dim][anchor] || 0;
      heatmap[dim][anchor] = valueDimWeights[dim] * mappingWeight * anchorScores[anchor];
    }
  }
  return heatmap;
}

function computeLegacyTension(
  valueDimWeights: Record<ValueDimension, number>,
  supportStrengths: Record<ValueDimension, number>,
  anchorScores: Record<AnchorCode, number>,
): { underSupported: ValueDimension[]; notRepresented: AnchorCode[]; penalties: string[] } {
  const sortedDims = [...VALUE_DIMENSIONS].sort(
    (dimA, dimB) => valueDimWeights[dimB] - valueDimWeights[dimA],
  );
  const top3Dims = sortedDims.slice(0, 3);
  const underSupported = top3Dims.filter((dim) => supportStrengths[dim] < 60);

  const strongAnchors = ANCHOR_CODES.filter((anchor) => anchorScores[anchor] >= 65);
  const notRepresented: AnchorCode[] = [];
  for (const anchor of strongAnchors) {
    let cumulatedWeight = 0;
    for (const dim of VALUE_DIMENSIONS) {
      const anchorWeight = VALUE_ANCHOR_WEIGHT_MATRIX[dim][anchor];
      if (anchorWeight) {
        cumulatedWeight += valueDimWeights[dim] * anchorWeight;
      }
    }
    if (cumulatedWeight < 0.10) notRepresented.push(anchor);
  }

  const penalties: string[] = [];
  if (valueDimWeights.freedom > 0.18 && valueDimWeights.security > 0.18) {
    penalties.push("freedom_vs_security");
  }
  if (valueDimWeights.achievement > 0.18 && valueDimWeights.quality_of_life > 0.18) {
    penalties.push("achievement_vs_quality_of_life");
  }
  if (valueDimWeights.influence > 0.18 && valueDimWeights.relationships > 0.18 && anchorScores.GM >= 80) {
    penalties.push("influence_vs_relationships_gm");
  }

  return { underSupported, notRepresented, penalties };
}

// ── Interpretation Labels ──────────────────────────────────────────────

function getAlignmentLevel(score: number, language: Language): string {
  const levels: Record<string, Record<Language, string>> = {
    high:    { "zh-CN": "高度协同", "zh-TW": "高度協同", en: "Highly Aligned" },
    good:    { "zh-CN": "良好协同", "zh-TW": "良好協同", en: "Well Aligned" },
    partial: { "zh-CN": "部分差异", "zh-TW": "部分差異", en: "Partial Divergence" },
    low:     { "zh-CN": "方向差异", "zh-TW": "方向差異", en: "Direction Divergence" },
  };
  if (score >= 80) return levels.high[language];
  if (score >= 60) return levels.good[language];
  if (score >= 40) return levels.partial[language];
  return levels.low[language];
}

function getTensionLevel(index: number, language: Language): string {
  const levels: Record<string, Record<Language, string>> = {
    low:  { "zh-CN": "低张力", "zh-TW": "低張力", en: "Low Tension" },
    mid:  { "zh-CN": "中张力", "zh-TW": "中張力", en: "Moderate Tension" },
    high: { "zh-CN": "高张力", "zh-TW": "高張力", en: "High Tension" },
    intense: { "zh-CN": "强整合动力", "zh-TW": "強整合動力", en: "Strong Integrative Dynamic" },
  };
  if (index <= 25) return levels.low[language];
  if (index <= 50) return levels.mid[language];
  if (index <= 75) return levels.high[language];
  return levels.intense[language];
}

function getConcentrationLevel(concentration: number, language: Language): string {
  const levels: Record<string, Record<Language, string>> = {
    single:   { "zh-CN": "单核/强驱动", "zh-TW": "單核/強驅動", en: "Single-Core / Strong Drive" },
    dual:     { "zh-CN": "双核/强轴", "zh-TW": "雙核/強軸", en: "Dual-Core / Strong Axis" },
    multi:    { "zh-CN": "多元平衡", "zh-TW": "多元平衡", en: "Multi-Balanced" },
    diffused: { "zh-CN": "分散型", "zh-TW": "分散型", en: "Diffused" },
  };
  if (concentration > 60) return levels.single[language];
  if (concentration >= 40) return levels.dual[language];
  if (concentration >= 20) return levels.multi[language];
  return levels.diffused[language];
}

function getMaturityLabel(level: MaturityLevel, language: Language): string {
  const labels: Record<MaturityLevel, Record<Language, string>> = {
    L4: { "zh-CN": "L4 稳定成熟", "zh-TW": "L4 穩定成熟", en: "L4 Stable Maturity" },
    L3: { "zh-CN": "L3 可整合成长", "zh-TW": "L3 可整合成長", en: "L3 Integrative Growth" },
    L2: { "zh-CN": "L2 发展张力期", "zh-TW": "L2 發展張力期", en: "L2 Development Tension" },
    L1: { "zh-CN": "L1 阶段探索期", "zh-TW": "L1 階段探索期", en: "L1 Stage Exploration" },
  };
  return labels[level][language];
}

function computeMaturityLevel(
  alignmentScore: number,
  tensionIndex: number,
  balance: number,
  careerStage: CareerStageInput,
): MaturityLevel {
  let adjustedTension = tensionIndex;
  if (careerStage === "early") adjustedTension = tensionIndex - 5;

  let level: MaturityLevel;
  if (alignmentScore >= 80 && adjustedTension <= 20 && balance >= 40 && balance <= 80) {
    level = "L4";
  } else if (alignmentScore >= 60 && adjustedTension <= 50) {
    level = "L3";
  } else if (
    (alignmentScore >= 40 && alignmentScore < 60) ||
    (adjustedTension > 50 && adjustedTension <= 80)
  ) {
    level = "L2";
  } else {
    level = "L1";
  }

  if (careerStage === "senior" && alignmentScore < 60) {
    if (level === "L3" || level === "L4") level = "L2";
  }

  return level;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN COMPUTE FUNCTION
// ══════════════════════════════════════════════════════════════════════

export function computeFusionMetrics(
  input: FusionInputData,
  language: Language = "zh-TW",
): FusionComputedMetrics {
  const anchorScores = input.anchorScores;

  // ── Legacy computations (always run — needed for heatmap, etc.) ──
  const valueDimWeights = computeValueDimWeights(input.lifeCardsTop10);
  const supportStrengths = computeSupportStrengths(anchorScores);
  const { underSupported, notRepresented, penalties } =
    computeLegacyTension(valueDimWeights, supportStrengths, anchorScores);

  const heatmapData = computeHeatmapData(valueDimWeights, anchorScores);
  const sortedDims = [...VALUE_DIMENSIONS].sort(
    (dimA, dimB) => valueDimWeights[dimB] - valueDimWeights[dimA],
  );
  const top3Values = sortedDims.slice(0, 3);

  const cardDimensionMap = input.lifeCardsTop10.map((card) => {
    const dimension = getCardDimension(card.cardId);
    return {
      rank: card.rank,
      cardId: card.cardId,
      cardName: card.cardName,
      cardNameEn: card.cardNameEn,
      dimension,
      dimensionLabel: getDimensionLabel(dimension, language),
    };
  });

  // ── V2 core metrics (spectrum-based) ──
  // If spectrum distribution is available, use the V2 algorithm.
  // Otherwise fall back to a synthetic spectrum from card dimension weights.
  const spectrum: SpectrumDistribution = input.spectrumDistribution || synthesizeSpectrum(valueDimWeights);
  const anchorDirection = computeAnchorDirectionVector(anchorScores);

  // 1. Alignment
  const alignmentScore = computeAlignmentIndex(anchorDirection, spectrum);

  // 2. Tension
  const { tensionIndex, crossTension } = computeTensionIndex(anchorScores, anchorDirection, spectrum);

  // 3. Balance
  const balanceIndex = computeBalanceIndex(anchorScores, spectrum);

  // 4. Structure label
  let structureLabel = determineStructureLabel(
    alignmentScore, tensionIndex, balanceIndex, crossTension,
    anchorScores, spectrum, anchorDirection,
  );

  // Apply boundary buffer
  structureLabel = applyBoundaryBuffer(
    structureLabel, alignmentScore, tensionIndex, balanceIndex,
    input.previousMetrics,
  );

  // 5. Concentration (legacy compatibility)
  const anchorValues = Object.values(anchorScores);
  const concentration = Math.max(...anchorValues) - Math.min(...anchorValues);

  // 6. Maturity level
  const maturityLevel = computeMaturityLevel(alignmentScore, tensionIndex, balanceIndex, input.careerStage);

  // 7. 2D position
  const { positionX, positionY } = compute2DPosition(spectrum, anchorScores);

  // Structure summary
  const structureSummary = STRUCTURE_SUMMARIES[structureLabel]?.[language]
    || STRUCTURE_SUMMARIES["阶段探索"][language];

  return {
    alignmentScore,
    alignmentLevel: getAlignmentLevel(alignmentScore, language),
    tensionIndex,
    tensionLevel: getTensionLevel(tensionIndex, language),
    concentration: Math.round(concentration),
    balance: balanceIndex,
    concentrationLevel: getConcentrationLevel(concentration, language),
    maturityLevel,
    maturityLabel: getMaturityLabel(maturityLevel, language),
    structureType: structureLabel,
    structureTags: [structureLabel],
    structureSummary,

    valueDimWeights,
    supportStrengths,
    top3Values,
    underSupported,
    notRepresented,
    tensionPenalties: penalties,
    heatmapData,
    cardDimensionMap,

    crossTension,
    anchorDirectionVector: anchorDirection,
    positionX,
    positionY,
  };
}

/**
 * When spectrum distribution is not provided from DB, synthesize it
 * from the card-to-dimension mapping as a fallback.
 *
 * Mapping:
 *   career   ← achievement + influence + creation
 *   lifestyle← relationships + quality_of_life + meaning
 *   neutral  ← freedom + security
 */
function synthesizeSpectrum(
  valueDimWeights: Record<ValueDimension, number>,
): SpectrumDistribution {
  const careerWeight =
    (valueDimWeights.achievement || 0) +
    (valueDimWeights.influence || 0) +
    (valueDimWeights.creation || 0);
  const lifestyleWeight =
    (valueDimWeights.relationships || 0) +
    (valueDimWeights.quality_of_life || 0) +
    (valueDimWeights.meaning || 0);
  const neutralWeight =
    (valueDimWeights.freedom || 0) +
    (valueDimWeights.security || 0);

  const total = careerWeight + lifestyleWeight + neutralWeight;
  if (total === 0) return { career_ratio: 0.33, neutral_ratio: 0.34, lifestyle_ratio: 0.33 };

  return {
    career_ratio: careerWeight / total,
    neutral_ratio: neutralWeight / total,
    lifestyle_ratio: lifestyleWeight / total,
  };
}

// ── Structure Type i18n ──────────────────────────────────────────────

const STRUCTURE_TYPE_TC: Record<string, string> = {
  "结构一致": "結構一致",
  "双重中心": "雙重中心",
  "阶段探索": "階段探索",
  "发展张力": "發展張力",
  "均衡成长": "均衡成長",
  "重点定位": "重點定位",
};

export function getStructureTypeLabel(type: string, language: Language): string {
  if (language === "zh-TW") return STRUCTURE_TYPE_TC[type] || type;
  if (language === "en") {
    const enMap: Record<string, string> = {
      "结构一致": "Structural Alignment",
      "双重中心": "Dual Center",
      "阶段探索": "Stage Exploration",
      "发展张力": "Development Tension",
      "均衡成长": "Balanced Growth",
      "重点定位": "Focused Positioning",
    };
    return enMap[type] || type;
  }
  return type;
}

// ── Tension Penalty Labels (legacy, still used by heatmap report) ─────

export function getTensionPenaltyLabel(penalty: string, language: Language): string {
  const labels: Record<string, Record<Language, string>> = {
    freedom_vs_security: {
      "zh-CN": "自由 vs 安全 结构差异（+12）",
      "zh-TW": "自由 vs 安全 結構差異（+12）",
      en: "Freedom vs Security structural divergence (+12)",
    },
    achievement_vs_quality_of_life: {
      "zh-CN": "成就 vs 生活质量 结构差异（+12）",
      "zh-TW": "成就 vs 生活品質 結構差異（+12）",
      en: "Achievement vs Quality of Life structural divergence (+12)",
    },
    influence_vs_relationships_gm: {
      "zh-CN": "影响力 vs 关系（GM≥80）结构差异（+10）",
      "zh-TW": "影響力 vs 關係（GM≥80）結構差異（+10）",
      en: "Influence vs Relationships (GM≥80) structural divergence (+10)",
    },
  };
  return labels[penalty]?.[language] || penalty;
}
