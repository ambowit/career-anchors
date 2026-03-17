/**
 * Fusion Chart Generator — Dual-Chart Visual Understanding System
 *
 * Replaces the old 6-label structure tag system with two visual charts
 * that let users intuitively understand their development structure:
 *
 *   Chart 1: Career Anchor × Ideal Life Card Mapping Structure
 *   Chart 2: Ideal Life Card Development Distribution
 *
 * Plus a 3-type development understanding model:
 *   兼容协同 / 动态适配 / 关注需求
 *
 * All output is inline HTML/SVG for both web view and PDF consistency.
 */

import { CARD_ANCHOR_MAP } from "@/data/cardAnchorMapping";
import { IDEAL_CARDS, CATEGORY_CONFIG, getCardLabel, getCategoryLabel, type CardCategory } from "@/data/idealCards";
import { ANCHOR_LABELS, type AnchorCode, ANCHOR_CODES } from "@/lib/fusionEngineV3";
import type { Language } from "@/hooks/useLanguage";
import type { FusionNarrativeData } from "@/lib/exportReport";

// ── Design Tokens ────────────────────────────────────────────────────

const DEEP_BLUE = "#1C2857";
const GOLD = "#D4A017";
const GOLD_LIGHT = "#FBF5E6";
const STEEL = "#4A5A7A";
const STEEL_LIGHT = "#EEF1F6";
const MUTED_BG = "#F6F7F9";
const SUBTLE_BORDER = "#E9ECEF";

/** Score zone configuration — 4 tiers */
const ZONES = [
  { key: "core",     min: 80, max: 100, gradient: `linear-gradient(135deg, ${GOLD}12 0%, ${GOLD}06 100%)`, border: `${GOLD}35`, labelColor: GOLD,  icon: "\u25C6" },
  { key: "high",     min: 65, max: 79,  gradient: `linear-gradient(135deg, ${DEEP_BLUE}0C 0%, ${DEEP_BLUE}04 100%)`, border: `${DEEP_BLUE}25`, labelColor: DEEP_BLUE, icon: "\u25C6" },
  { key: "moderate", min: 45, max: 64,  gradient: `linear-gradient(135deg, ${STEEL}08 0%, ${STEEL}03 100%)`, border: `${STEEL}18`, labelColor: STEEL, icon: "\u25C6" },
  { key: "noncore",  min: 0,  max: 44,  gradient: `linear-gradient(135deg, #f5f5f5 0%, #fafafa 100%)`, border: "#e5e5e5", labelColor: "#94a3b8", icon: "\u25C6" },
] as const;

// ── Types ────────────────────────────────────────────────────────────

interface RankedCard {
  rank: number;
  cardId: number;
  category: CardCategory;
  label?: string;
  labelEn?: string;
}

interface CardAnchorNode {
  rank: number;
  cardId: number;
  category: CardCategory;
  cardName: string;
  anchorCode: AnchorCode;
  anchorScore: number;
}

export type DevelopmentUnderstandingType = "compatible" | "adaptive" | "attentive";

interface DevelopmentUnderstanding {
  type: DevelopmentUnderstandingType;
  primaryIndicators: string[];
}

// ── i18n Helpers ─────────────────────────────────────────────────────

function t(language: Language, en: string, tw: string, cn: string): string {
  return language === "en" ? en : language === "zh-TW" ? tw : cn;
}

const ZONE_LABELS: Record<string, Record<Language, string>> = {
  core:     { en: "Core Advantage Zone (80\u2013100)", "zh-TW": "\u6838\u5fc3\u512a\u52e2\u5340 (80\u2013100)", "zh-CN": "\u6838\u5fc3\u4f18\u52bf\u533a (80\u2013100)" },
  high:     { en: "High Sensitivity Zone (65\u201379)", "zh-TW": "\u9ad8\u654f\u611f\u5340 (65\u201379)", "zh-CN": "\u9ad8\u654f\u611f\u533a (65\u201379)" },
  moderate: { en: "Moderate Influence Zone (45\u201364)", "zh-TW": "\u4e2d\u5ea6\u5f71\u97ff\u5340 (45\u201364)", "zh-CN": "\u4e2d\u5ea6\u5f71\u54cd\u533a (45\u201364)" },
  noncore:  { en: "Emerging Dimension Zone (<45)", "zh-TW": "\u958b\u767c\u4e2d\u7dad\u5ea6\u5340 (<45)", "zh-CN": "\u5f00\u53d1\u4e2d\u7ef4\u5ea6\u533a (<45)" },
};

const UNDERSTANDING_LABELS: Record<DevelopmentUnderstandingType, Record<Language, { title: string; subtitle: string; description: string }>> = {
  compatible: {
    en: {
      title: "Compatible Synergy",
      subtitle: "Values and career drivers are moving in harmony",
      description: "Most of your highly prioritized life values are supported by strong career anchors. This suggests your current development path naturally integrates what matters most to you with where your professional energy flows strongest.",
    },
    "zh-TW": {
      title: "\u517c\u5bb9\u5354\u540c",
      subtitle: "\u50f9\u503c\u95dc\u6ce8\u8207\u8077\u696d\u9a45\u52d5\u529b\u6b63\u5728\u5354\u540c\u63a8\u9032",
      description: "\u60a8\u6700\u91cd\u8996\u7684\u4eba\u751f\u50f9\u503c\u5927\u591a\u4f4d\u65bc\u8077\u696d\u80fd\u91cf\u8f03\u5f37\u7684\u5340\u57df\u3002\u9019\u610f\u5473\u8457\u7576\u524d\u7684\u767c\u5c55\u8def\u5f91\u80fd\u5920\u81ea\u7136\u5730\u5c07\u60a8\u6700\u770b\u91cd\u7684\u4e8b\u7269\u8207\u8077\u696d\u52d5\u80fd\u6700\u5f37\u7684\u65b9\u5411\u6574\u5408\u5728\u4e00\u8d77\u3002",
    },
    "zh-CN": {
      title: "\u517c\u5bb9\u534f\u540c",
      subtitle: "\u4ef7\u503c\u5173\u6ce8\u4e0e\u804c\u4e1a\u9a71\u52a8\u529b\u6b63\u5728\u534f\u540c\u63a8\u8fdb",
      description: "\u60a8\u6700\u91cd\u89c6\u7684\u4eba\u751f\u4ef7\u503c\u5927\u591a\u4f4d\u4e8e\u804c\u4e1a\u80fd\u91cf\u8f83\u5f3a\u7684\u533a\u57df\u3002\u8fd9\u610f\u5473\u7740\u5f53\u524d\u7684\u53d1\u5c55\u8def\u5f84\u80fd\u591f\u81ea\u7136\u5730\u5c06\u60a8\u6700\u770b\u91cd\u7684\u4e8b\u7269\u4e0e\u804c\u4e1a\u52a8\u80fd\u6700\u5f3a\u7684\u65b9\u5411\u6574\u5408\u5728\u4e00\u8d77\u3002",
    },
  },
  adaptive: {
    en: {
      title: "Dynamic Adaptation",
      subtitle: "Actively integrating across multiple development paths",
      description: "Your life values span across different career energy zones, with varied value categories simultaneously active. This reflects a multi-path integration pattern where you're dynamically balancing and adjusting your development rhythm.",
    },
    "zh-TW": {
      title: "\u52d5\u614b\u9069\u914d",
      subtitle: "\u6b63\u5728\u8de8\u591a\u689d\u767c\u5c55\u8def\u5f91\u9032\u884c\u6574\u5408",
      description: "\u60a8\u7684\u4eba\u751f\u50f9\u503c\u5206\u4f48\u5728\u4e0d\u540c\u7684\u8077\u696d\u80fd\u91cf\u5340\u57df\uff0c\u4e0d\u540c\u50f9\u503c\u985e\u5225\u540c\u6642\u6d3b\u8e8d\u3002\u9019\u53cd\u6620\u51fa\u4e00\u7a2e\u591a\u8def\u5f91\u6574\u5408\u7684\u7279\u5fb5\uff0c\u60a8\u6b63\u5728\u52d5\u614b\u5730\u5e73\u8861\u8207\u8abf\u9069\u767c\u5c55\u7bc0\u594f\u3002",
    },
    "zh-CN": {
      title: "\u52a8\u6001\u9002\u914d",
      subtitle: "\u6b63\u5728\u8de8\u591a\u6761\u53d1\u5c55\u8def\u5f84\u8fdb\u884c\u6574\u5408",
      description: "\u60a8\u7684\u4eba\u751f\u4ef7\u503c\u5206\u5e03\u5728\u4e0d\u540c\u7684\u804c\u4e1a\u80fd\u91cf\u533a\u57df\uff0c\u4e0d\u540c\u4ef7\u503c\u7c7b\u522b\u540c\u65f6\u6d3b\u8dc3\u3002\u8fd9\u53cd\u6620\u51fa\u4e00\u79cd\u591a\u8def\u5f84\u6574\u5408\u7684\u7279\u5f81\uff0c\u60a8\u6b63\u5728\u52a8\u6001\u5730\u5e73\u8861\u4e0e\u8c03\u9002\u53d1\u5c55\u8282\u594f\u3002",
    },
  },
  attentive: {
    en: {
      title: "Attention & Nurturing",
      subtitle: "Important values are being gradually incorporated into the development structure",
      description: "Some of your most valued life priorities currently sit in career zones with developing energy. This represents a growth opportunity \u2014 these values are in the process of being woven into your evolving career structure.",
    },
    "zh-TW": {
      title: "\u95dc\u6ce8\u9700\u6c42",
      subtitle: "\u91cd\u8981\u50f9\u503c\u9ad4\u9a57\u6b63\u5728\u9010\u6b65\u88ab\u7d0d\u5165\u767c\u5c55\u7d50\u69cb\u4e2d",
      description: "\u60a8\u6700\u770b\u91cd\u7684\u90e8\u5206\u4eba\u751f\u512a\u5148\u9805\u76ee\u524d\u4f4d\u65bc\u8077\u696d\u80fd\u91cf\u5c1a\u5728\u767c\u5c55\u7684\u5340\u57df\u3002\u9019\u4ee3\u8868\u4e00\u500b\u6210\u9577\u6a5f\u6703\u2014\u2014\u9019\u4e9b\u50f9\u503c\u6b63\u5728\u88ab\u9010\u6b65\u7de8\u7e54\u5230\u60a8\u4e0d\u65b7\u6f14\u5316\u7684\u8077\u696d\u7d50\u69cb\u4e2d\u3002",
    },
    "zh-CN": {
      title: "\u5173\u6ce8\u9700\u6c42",
      subtitle: "\u91cd\u8981\u4ef7\u503c\u4f53\u9a8c\u6b63\u5728\u9010\u6b65\u88ab\u7eb3\u5165\u53d1\u5c55\u7ed3\u6784\u4e2d",
      description: "\u60a8\u6700\u770b\u91cd\u7684\u90e8\u5206\u4eba\u751f\u4f18\u5148\u9879\u76ee\u524d\u4f4d\u4e8e\u804c\u4e1a\u80fd\u91cf\u5c1a\u5728\u53d1\u5c55\u7684\u533a\u57df\u3002\u8fd9\u4ee3\u8868\u4e00\u4e2a\u6210\u957f\u673a\u4f1a\u2014\u2014\u8fd9\u4e9b\u4ef7\u503c\u6b63\u5728\u88ab\u9010\u6b65\u7f16\u7ec7\u5230\u60a8\u4e0d\u65ad\u6f14\u5316\u7684\u804c\u4e1a\u7ed3\u6784\u4e2d\u3002",
    },
  },
};

const UNDERSTANDING_COLORS: Record<DevelopmentUnderstandingType, { accent: string; bg: string; border: string; icon: string }> = {
  compatible: { accent: "#059669", bg: "#ecfdf5", border: "#a7f3d0", icon: "\u2705" },
  adaptive:   { accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", icon: "\u{1F504}" },
  attentive:  { accent: "#d97706", bg: "#fffbeb", border: "#fde68a", icon: "\u{1F331}" },
};

// ── Core Data Computation ────────────────────────────────────────────

function buildCardAnchorNodes(
  rankedCards: RankedCard[],
  anchorScores: Record<string, number>,
  language: Language,
): CardAnchorNode[] {
  return rankedCards.map((card) => {
    const anchorCode = CARD_ANCHOR_MAP[card.cardId] || "LS";
    const anchorScore = anchorScores[anchorCode] || 0;
    const cardDef = IDEAL_CARDS.find((c) => c.id === card.cardId);
    const cardName = cardDef ? getCardLabel(cardDef, language) : (card.label || `#${card.cardId}`);
    return {
      rank: card.rank,
      cardId: card.cardId,
      category: card.category,
      cardName,
      anchorCode,
      anchorScore: Math.round(anchorScore),
    };
  });
}

/**
 * Determine which of the 3 development understanding types applies.
 *
 * Logic:
 *   - Compatible Synergy: avg anchor score of top-5 cards >= 65
 *   - Attentive:  >= 2 of top-5 cards have anchor score < 50
 *   - Adaptive:   default — cards span multiple zones
 */
export function computeDevelopmentUnderstanding(
  nodes: CardAnchorNode[],
): DevelopmentUnderstanding {
  const top5 = nodes.filter((node) => node.rank <= 5);
  const top5Scores = top5.map((node) => node.anchorScore);
  const avgTop5 = top5Scores.length > 0
    ? top5Scores.reduce((sum, score) => sum + score, 0) / top5Scores.length
    : 50;

  const lowScoreCount = top5.filter((node) => node.anchorScore < 50).length;

  // Compute score range across all nodes
  const allScores = nodes.map((node) => node.anchorScore);
  const scoreRange = allScores.length > 0 ? Math.max(...allScores) - Math.min(...allScores) : 0;

  // Count unique categories in top 10
  const uniqueCategories = new Set(nodes.map((node) => node.category)).size;

  const indicators: string[] = [];

  // Priority 1: Compatible Synergy
  if (avgTop5 >= 65 && lowScoreCount <= 1) {
    indicators.push(`top5-avg=${Math.round(avgTop5)}`);
    return { type: "compatible", primaryIndicators: indicators };
  }

  // Priority 2: Attentive
  if (lowScoreCount >= 2) {
    indicators.push(`low-score-count=${lowScoreCount}`);
    return { type: "attentive", primaryIndicators: indicators };
  }

  // Priority 3: Adaptive (default)
  indicators.push(`range=${scoreRange}`, `categories=${uniqueCategories}`);
  return { type: "adaptive", primaryIndicators: indicators };
}

// ══════════════════════════════════════════════════════════════════════
//  CHART 1: Career Anchor × Life Card Mapping Structure
// ══════════════════════════════════════════════════════════════════════

function generateChart1HTML(
  nodes: CardAnchorNode[],
  anchorScores: Record<string, number>,
  language: Language,
): string {
  const sectionTitle = t(language,
    "Career Anchor \u00d7 Espresso Card Structure Map",
    "\u8077\u696d\u9328 \u00d7 \u7406\u60f3\u4eba\u751f\u5361\u7d50\u69cb\u5730\u5716",
    "\u804c\u4e1a\u951a \u00d7 \u7406\u60f3\u4eba\u751f\u5361\u7ed3\u6784\u5730\u56fe",
  );

  const sectionDesc = t(language,
    "Shows how your Top 10 life values distribute across career anchor development zones",
    "\u5c55\u793a\u60a8\u7684 Top 10 \u4eba\u751f\u50f9\u503c\u5982\u4f55\u5206\u4f48\u5728\u8077\u696d\u9328\u767c\u5c55\u5340\u57df\u4e2d",
    "\u5c55\u793a\u60a8\u7684 Top 10 \u4eba\u751f\u4ef7\u503c\u5982\u4f55\u5206\u5e03\u5728\u804c\u4e1a\u951a\u53d1\u5c55\u533a\u57df\u4e2d",
  );

  // Group anchors by zones based on scores
  const anchorsByZone = ZONES.map((zone) => {
    const anchorsInZone = ANCHOR_CODES
      .filter((code) => {
        const score = Math.round(anchorScores[code] || 0);
        return score >= zone.min && score <= zone.max;
      })
      .sort((codeA, codeB) => (anchorScores[codeB] || 0) - (anchorScores[codeA] || 0));

    return { zone, anchors: anchorsInZone };
  }).filter((group) => group.anchors.length > 0);

  // Build zone HTML
  const zonesHtml = anchorsByZone.map((group) => {
    const zoneLabel = ZONE_LABELS[group.zone.key][language];

    const anchorNodesHtml = group.anchors.map((anchorCode) => {
      const score = Math.round(anchorScores[anchorCode] || 0);
      const anchorLabel = ANCHOR_LABELS[anchorCode][language];
      const cardsForAnchor = nodes.filter((node) => node.anchorCode === anchorCode);

      // Card chips
      const chipsHtml = cardsForAnchor.length > 0
        ? cardsForAnchor.map((node) => {
            const config = CATEGORY_CONFIG[node.category];
            return `<div style="display:inline-block;padding:5px 14px 7px 14px;background:${config.bgColor};border:1px solid ${config.borderColor};border-radius:8px;font-size:13px;line-height:1.3;max-width:100%;box-sizing:border-box;vertical-align:middle;" title="${node.cardName}">
              <span style="display:inline-block;vertical-align:middle;font-weight:700;color:${config.color};font-family:'Montserrat',sans-serif;font-size:12px;line-height:1;margin-right:6px;">${node.rank}</span>
              <span style="display:inline-block;vertical-align:middle;color:#374151;line-height:1.3;word-break:break-word;">${node.cardName}</span>
            </div>`;
          }).join("")
        : `<span style="font-size:11px;color:#cbd5e1;font-style:italic;">${t(language, "No mapped cards", "\u7121\u5c0d\u61c9\u5361\u7247", "\u65e0\u5bf9\u5e94\u5361\u7247")}</span>`;

      return `
        <div style="flex:1;min-width:180px;max-width:280px;background:rgba(255,255,255,0.85);border-radius:12px;padding:16px;border:1px solid ${SUBTLE_BORDER};box-shadow:0 2px 8px rgba(0,0,0,0.04);overflow:hidden;">
          <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:10px;">
            <span style="font-size:18px;font-weight:800;color:${DEEP_BLUE};font-family:'Montserrat',sans-serif;letter-spacing:0.5px;">${anchorCode}</span>
            <span style="font-size:12px;color:#64748b;font-weight:500;">${anchorLabel}</span>
            <span style="margin-left:auto;font-size:14px;font-weight:700;color:${group.zone.labelColor};font-family:'Montserrat',sans-serif;">${score}</span>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${chipsHtml}
          </div>
        </div>`;
    }).join("");

    return `
      <div data-keep-together style="margin-bottom:16px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
          <span style="font-size:14px;">${group.zone.icon}</span>
          <span style="font-size:12px;font-weight:700;color:${group.zone.labelColor};letter-spacing:0.5px;text-transform:uppercase;">${zoneLabel}</span>
        </div>
        <div style="background:${group.zone.gradient};border:1px solid ${group.zone.border};border-radius:14px;padding:16px 14px;">
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            ${anchorNodesHtml}
          </div>
        </div>
      </div>`;
  }).join("");

  // Category legend
  const legendHtml = (["intrinsic", "interpersonal", "lifestyle", "material"] as CardCategory[]).map((cat) => {
    const config = CATEGORY_CONFIG[cat];
    return `<div style="display:flex;align-items:center;gap:5px;">
      <span style="width:10px;height:10px;border-radius:3px;background:${config.color};display:inline-block;"></span>
      <span style="font-size:11px;color:#64748b;">${getCategoryLabel(cat, language)}</span>
    </div>`;
  }).join("");

  return `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${sectionTitle}</span>
    </div>
    <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 20px 0;">${sectionDesc}</p>

    <div data-keep-together style="page-break-inside:avoid;break-inside:avoid;">
    <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid ${SUBTLE_BORDER};box-shadow:0 2px 12px rgba(0,0,0,0.04);margin-bottom:28px;">
      ${zonesHtml}

      <!-- Legend -->
      <div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:14px;border-top:1px solid ${SUBTLE_BORDER};">
        ${legendHtml}
      </div>
    </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════
//  CHART 2: Life Card Development Distribution (SVG)
// ══════════════════════════════════════════════════════════════════════

function generateChart2HTML(
  nodes: CardAnchorNode[],
  language: Language,
): string {
  const sectionTitle = t(language,
    "Espresso Card Development Distribution",
    "\u7406\u60f3\u4eba\u751f\u5361\u767c\u5c55\u5206\u4f48\u5716",
    "\u7406\u60f3\u4eba\u751f\u5361\u53d1\u5c55\u5206\u5e03\u56fe",
  );

  const sectionDesc = t(language,
    "Relationship between value priority ranking and corresponding career anchor energy",
    "\u50f9\u503c\u512a\u5148\u6392\u5e8f\u8207\u5c0d\u61c9\u8077\u696d\u9328\u80fd\u91cf\u4e4b\u9593\u7684\u95dc\u4fc2",
    "\u4ef7\u503c\u4f18\u5148\u6392\u5e8f\u4e0e\u5bf9\u5e94\u804c\u4e1a\u951a\u80fd\u91cf\u4e4b\u95f4\u7684\u5173\u7cfb",
  );

  // SVG dimensions
  const svgWidth = 840;
  const svgHeight = 340;
  const padLeft = 52;
  const padRight = 130;
  const padTop = 25;
  const padBottom = 48;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Sort by rank for X axis
  const sortedNodes = [...nodes].sort((nodeA, nodeB) => nodeA.rank - nodeB.rank);

  // Scale functions — X starts from 0 (rank 1 maps to position 0/10 * chartWidth)
  const xScale = (rank: number) => padLeft + (rank / 11) * chartWidth;
  const yScale = (score: number) => padTop + chartHeight - (score / 100) * chartHeight;

  // Zone backgrounds (horizontal bands) — using anchor score zones as Y divisions
  const zoneBands = [
    { min: 80, max: 100, fill: `${GOLD}08`, stroke: `${GOLD}20`,       label: t(language, "Core (80\u2013100)", "\u6838\u5fc3 (80\u2013100)", "\u6838\u5fc3 (80\u2013100)"), labelColor: GOLD },
    { min: 65, max: 79,  fill: `${DEEP_BLUE}06`, stroke: `${DEEP_BLUE}12`, label: t(language, "High (65\u201379)", "\u9ad8\u654f (65\u201379)", "\u9ad8\u654f (65\u201379)"), labelColor: DEEP_BLUE },
    { min: 45, max: 64,  fill: `${STEEL}04`, stroke: `${STEEL}08`,     label: t(language, "Moderate (45\u201364)", "\u4e2d\u5ea6 (45\u201364)", "\u4e2d\u5ea6 (45\u201364)"), labelColor: STEEL },
    { min: 0,  max: 44,  fill: "#f9f9f9", stroke: "#f0f0f0",          label: t(language, "Emerging (<45)", "\u958b\u767c\u4e2d (<45)", "\u5f00\u53d1\u4e2d (<45)"), labelColor: "#94a3b8" },
  ];

  const zoneBandsHtml = zoneBands.map((band) => {
    const y1 = yScale(band.max);
    const y2 = yScale(band.min);
    const midY = (y1 + y2) / 2;
    return `<rect x="${padLeft}" y="${y1}" width="${chartWidth}" height="${y2 - y1}" fill="${band.fill}" stroke="${band.stroke}" stroke-width="0.5" rx="3"/>
      <text x="${padLeft + chartWidth + 10}" y="${midY + 4}" font-size="10" fill="${band.labelColor}" font-weight="600" font-family="Noto Sans TC,sans-serif" opacity="0.85">${band.label}</text>`;
  }).join("\n");

  // Y-axis grid lines at zone boundaries
  const yTicks = [0, 45, 65, 80, 100];
  const yGridHtml = yTicks.map((tick) => {
    const y = yScale(tick);
    return `
      <line x1="${padLeft}" y1="${y}" x2="${padLeft + chartWidth}" y2="${y}" stroke="#e0e0e0" stroke-width="${tick === 0 || tick === 100 ? '1' : '0.5'}" stroke-dasharray="${tick === 0 || tick === 100 ? 'none' : '4,3'}"/>
      <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10" fill="#94a3b8" font-family="Montserrat,sans-serif">${tick}</text>`;
  }).join("\n");

  // X-axis labels (rank numbers)
  const xLabelsHtml = sortedNodes.map((node) => {
    const x = xScale(node.rank);
    return `<text x="${x}" y="${padTop + chartHeight + 18}" text-anchor="middle" font-size="11" fill="#94a3b8" font-weight="600" font-family="Montserrat,sans-serif">${node.rank}</text>`;
  }).join("\n");

  // Also show 0 on X axis
  const xZeroLabel = `<text x="${padLeft}" y="${padTop + chartHeight + 18}" text-anchor="middle" font-size="11" fill="#c0c0c0" font-weight="500" font-family="Montserrat,sans-serif">0</text>`;

  // X-axis title
  const xAxisTitle = t(language, "Value Priority Rank", "\u50f9\u503c\u512a\u5148\u6392\u5e8f", "\u4ef7\u503c\u4f18\u5148\u6392\u5e8f");
  const yAxisTitle = t(language, "Anchor Score", "\u9328\u9ede\u5f97\u5206", "\u951a\u70b9\u5f97\u5206");

  // Data nodes — colored dots with rank number, tooltip shows full card name
  const chipRadius = 16;
  const dataNodesHtml = sortedNodes.map((node) => {
    const x = xScale(node.rank);
    const y = yScale(node.anchorScore);
    const config = CATEGORY_CONFIG[node.category];
    const tooltipText = `${node.rank}. ${node.cardName} (${node.anchorCode}: ${node.anchorScore})`;
    // Tooltip label position: above the dot, clamped within chart area
    const labelY = y - chipRadius - 8;
    const clampedLabelY = Math.max(padTop + 14, labelY);

    return `
      <g class="cpc-chart2-dot">
        <title>${tooltipText}</title>
        <!-- White mask to fully cover grid lines behind the dot -->
        <circle cx="${x}" cy="${y}" r="${chipRadius + 3}" fill="white"/>
        <!-- Shadow -->
        <circle cx="${x}" cy="${y + 1}" r="${chipRadius}" fill="rgba(0,0,0,0.08)"/>
        <!-- Card dot -->
        <circle cx="${x}" cy="${y}" r="${chipRadius}" fill="${config.bgColor}" stroke="${config.borderColor}" stroke-width="1.5" style="cursor:pointer;"/>
        <!-- Anchor code -->
        <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" fill="${config.color}" font-weight="800" font-family="Montserrat,sans-serif" style="pointer-events:none;">${node.anchorCode}</text>
        <!-- Hover label -->
        <text class="cpc-chart2-label" x="${x}" y="${clampedLabelY}" text-anchor="middle" font-size="10" fill="${DEEP_BLUE}" font-weight="600" font-family="Noto Sans TC,sans-serif" style="pointer-events:none;opacity:0;transition:opacity 0.15s;">${node.cardName}</text>
      </g>`;
  }).join("\n");

  // Category legend for dots
  const legendItems = (["intrinsic", "interpersonal", "lifestyle", "material"] as const).map((cat) => {
    const config = CATEGORY_CONFIG[cat];
    return `<div style="display:flex;align-items:center;gap:5px;">
      <span style="width:10px;height:10px;border-radius:50%;background:${config.color};display:inline-block;"></span>
      <span style="font-size:11px;color:#64748b;">${getCategoryLabel(cat, language)}</span>
    </div>`;
  }).join("");

  return `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${sectionTitle}</span>
    </div>
    <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 20px 0;">${sectionDesc}</p>

    <div data-keep-together style="page-break-inside:avoid;break-inside:avoid;">
    <div style="background:#fff;border-radius:16px;padding:24px;border:1px solid ${SUBTLE_BORDER};box-shadow:0 2px 12px rgba(0,0,0,0.04);margin-bottom:28px;overflow-x:auto;">
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" style="max-width:${svgWidth}px;margin:0 auto;display:block;">
        <!-- Zone bands -->
        ${zoneBandsHtml}

        <!-- Grid lines -->
        ${yGridHtml}

        <!-- X axis labels -->
        ${xZeroLabel}
        ${xLabelsHtml}

        <!-- Axis titles -->
        <text x="${padLeft + chartWidth / 2}" y="${svgHeight - 8}" text-anchor="middle" font-size="11" fill="#94a3b8" font-weight="500" font-family="Noto Sans TC,sans-serif">${xAxisTitle}</text>
        <text x="14" y="${padTop + chartHeight / 2}" text-anchor="middle" font-size="11" fill="#94a3b8" font-weight="500" font-family="Noto Sans TC,sans-serif" transform="rotate(-90, 14, ${padTop + chartHeight / 2})">${yAxisTitle}</text>

        <!-- Data nodes (no connecting line) -->
        ${dataNodesHtml}
      </svg>

      <!-- Legend -->
      <div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:14px;margin-top:8px;border-top:1px solid ${SUBTLE_BORDER};align-items:center;">
        ${legendItems}
        <div data-screen-only style="margin-left:auto;font-size:11px;color:#94a3b8;font-style:italic;">${t(language, "Hover on dots to see details", "\u6ed1\u9f20\u79fb\u5230\u5713\u9ede\u8655\uff0c\u5373\u53ef\u67e5\u770b\u8a73\u60c5", "\u6ed1\u9f20\u79fb\u5230\u5706\u70b9\u5904\uff0c\u5373\u53ef\u67e5\u770b\u8be6\u60c5")}</div>
      </div>
    </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION: Development Understanding Model (3 types)
// ══════════════════════════════════════════════════════════════════════

function generateUnderstandingHTML(
  understanding: DevelopmentUnderstanding,
  nodes: CardAnchorNode[],
  language: Language,
): string {
  const sectionTitle = t(language,
    "Development Structure Understanding",
    "\u767c\u5c55\u7d50\u69cb\u7406\u89e3",
    "\u53d1\u5c55\u7ed3\u6784\u7406\u89e3",
  );

  const allTypes: DevelopmentUnderstandingType[] = ["compatible", "adaptive", "attentive"];
  const activeType = understanding.type;

  const cardsHtml = allTypes.map((typeKey) => {
    const labels = UNDERSTANDING_LABELS[typeKey][language];
    const colors = UNDERSTANDING_COLORS[typeKey];
    const isActive = typeKey === activeType;

    return `
      <div data-keep-together style="flex:1;min-width:200px;background:${isActive ? colors.bg : '#fafafa'};border-radius:14px;padding:22px 18px;border:${isActive ? `2px solid ${colors.border}` : `1px solid #e5e5e5`};position:relative;page-break-inside:avoid;${isActive ? `box-shadow:0 4px 16px ${colors.accent}15;` : 'opacity:0.6;'}">
        ${isActive ? `<div style="position:absolute;top:-1px;left:16px;right:16px;height:3px;background:${colors.accent};border-radius:0 0 3px 3px;"></div>` : ''}
        <div style="font-size:20px;margin-bottom:8px;">${colors.icon}</div>
        <div style="font-size:15px;font-weight:700;color:${isActive ? colors.accent : '#94a3b8'};margin-bottom:4px;">${labels.title}</div>
        <div style="font-size:11px;color:${isActive ? '#64748b' : '#94a3b8'};margin-bottom:12px;line-height:1.5;">${labels.subtitle}</div>
        <p style="font-size:13px;color:${isActive ? '#374151' : '#94a3b8'};line-height:1.8;margin:0;">${isActive ? labels.description : ''}</p>
      </div>`;
  }).join("");

  return `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${sectionTitle}</span>
    </div>

    <div data-keep-together style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px;page-break-inside:avoid;">
      ${cardsHtml}
    </div>

  `;
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION: Contextual Development Suggestions
// ══════════════════════════════════════════════════════════════════════

function generateSuggestionsHTML(
  understanding: DevelopmentUnderstanding,
  narrative: FusionNarrativeData | undefined,
  language: Language,
): string {
  const sectionTitle = t(language,
    "Contextual Development Suggestions",
    "\u60c5\u5883\u767c\u5c55\u5efa\u8b70",
    "\u60c5\u5883\u53d1\u5c55\u5efa\u8bae",
  );

  // If we have AI narrative recommendations, use those
  if (narrative?.recommendations) {
    const cards = [
      {
        icon: "\u{1F4BC}",
        label: t(language, "Career Context", "\u8077\u696d\u60c5\u5883", "\u804c\u4e1a\u60c5\u5883"),
        content: narrative.recommendations.career_context,
        topColor: DEEP_BLUE,
        bg: `${DEEP_BLUE}06`,
        border: `${DEEP_BLUE}18`,
      },
      {
        icon: "\u{1F331}",
        label: t(language, "Life Rhythm", "\u751f\u6d3b\u7bc0\u594f", "\u751f\u6d3b\u8282\u594f"),
        content: narrative.recommendations.life_rhythm,
        topColor: "#059669",
        bg: "#ecfdf5",
        border: "#a7f3d0",
      },
      {
        icon: "\u{1F9ED}",
        label: t(language, "Choice Perspective", "\u9078\u64c7\u8996\u89d2", "\u9009\u62e9\u89c6\u89d2"),
        content: narrative.recommendations.choice_perspective,
        topColor: "#7c3aed",
        bg: "#faf5ff",
        border: "#e9d5ff",
      },
    ];

    return `
      <div class="cpc-section-header-compact">
        <span class="cpc-section-header-compact-title">${sectionTitle}</span>
      </div>

      <div data-keep-together style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px;">
        ${cards.map((card) => `
        <div style="flex:1;min-width:200px;background:${card.bg};border-radius:12px;padding:24px 20px;border:1px solid ${card.border};border-top:4px solid ${card.topColor};page-break-inside:avoid;">
          <div style="font-size:22px;margin-bottom:8px;">${card.icon}</div>
          <div style="font-size:13px;font-weight:700;color:${card.topColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">${card.label}</div>
          <p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">${card.content}</p>
        </div>`).join("")}
      </div>
    `;
  }

  // Fallback: stage summary from narrative
  if (narrative?.stage_summary) {
    return `
      <div class="cpc-section-header-compact">
        <span class="cpc-section-header-compact-title">${sectionTitle}</span>
      </div>

      <div data-keep-together style="padding:28px 32px;background:linear-gradient(135deg, ${DEEP_BLUE} 0%, #2a3d6e 100%);border-radius:12px;color:#fff;margin-bottom:24px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <span style="font-size:20px;line-height:1;">\u2728</span>
          <span style="font-size:15px;font-weight:700;letter-spacing:0.5px;">
            ${t(language, "Your Current Stage", "\u60a8\u7684\u7576\u524d\u968e\u6bb5", "\u60a8\u7684\u5f53\u524d\u9636\u6bb5")}
          </span>
        </div>
        <p style="font-size:15px;line-height:2;margin:0;color:rgba(255,255,255,0.92);">${narrative.stage_summary}</p>
      </div>
    `;
  }

  // Fallback: computed generic suggestions based on understanding type
  const activeColors = UNDERSTANDING_COLORS[understanding.type];
  const genericAdvice: Record<DevelopmentUnderstandingType, Record<Language, string>> = {
    compatible: {
      en: "Your current development structure shows strong natural synergy. Consider deepening the integration by seeking roles and experiences that simultaneously nurture both your professional strengths and personal values.",
      "zh-TW": "\u60a8\u7576\u524d\u7684\u767c\u5c55\u7d50\u69cb\u5c55\u73fe\u51fa\u5f37\u70c8\u7684\u81ea\u7136\u5354\u540c\u3002\u53ef\u4ee5\u8003\u616e\u5c0b\u627e\u80fd\u5920\u540c\u6642\u57f9\u990a\u5c08\u696d\u512a\u52e2\u8207\u500b\u4eba\u50f9\u503c\u7684\u89d2\u8272\u548c\u7d93\u9a57\uff0c\u4ee5\u6df1\u5316\u9019\u7a2e\u6574\u5408\u3002",
      "zh-CN": "\u60a8\u5f53\u524d\u7684\u53d1\u5c55\u7ed3\u6784\u5c55\u73b0\u51fa\u5f3a\u70c8\u7684\u81ea\u7136\u534f\u540c\u3002\u53ef\u4ee5\u8003\u8651\u5bfb\u627e\u80fd\u591f\u540c\u65f6\u57f9\u517b\u4e13\u4e1a\u4f18\u52bf\u4e0e\u4e2a\u4eba\u4ef7\u503c\u7684\u89d2\u8272\u548c\u7ecf\u9a8c\uff0c\u4ee5\u6df1\u5316\u8fd9\u79cd\u6574\u5408\u3002",
    },
    adaptive: {
      en: "Your multi-path development pattern offers rich exploration potential. Consider identifying which value-career connections feel most energizing, and gradually build bridges between these different life dimensions.",
      "zh-TW": "\u60a8\u7684\u591a\u8def\u5f91\u767c\u5c55\u6a21\u5f0f\u63d0\u4f9b\u4e86\u8c50\u5bcc\u7684\u63a2\u7d22\u6f5b\u529b\u3002\u53ef\u4ee5\u8003\u616e\u8b58\u5225\u54ea\u4e9b\u50f9\u503c\u8207\u8077\u696d\u7684\u9023\u7d50\u6700\u5177\u6d3b\u529b\uff0c\u4e26\u5728\u9019\u4e9b\u4e0d\u540c\u7684\u751f\u6d3b\u7dad\u5ea6\u4e4b\u9593\u9010\u6b65\u5efa\u7acb\u6a4b\u6a11\u3002",
      "zh-CN": "\u60a8\u7684\u591a\u8def\u5f84\u53d1\u5c55\u6a21\u5f0f\u63d0\u4f9b\u4e86\u4e30\u5bcc\u7684\u63a2\u7d22\u6f5c\u529b\u3002\u53ef\u4ee5\u8003\u8651\u8bc6\u522b\u54ea\u4e9b\u4ef7\u503c\u4e0e\u804c\u4e1a\u7684\u8fde\u63a5\u6700\u5177\u6d3b\u529b\uff0c\u5e76\u5728\u8fd9\u4e9b\u4e0d\u540c\u7684\u751f\u6d3b\u7ef4\u5ea6\u4e4b\u95f4\u9010\u6b65\u5efa\u7acb\u6865\u6881\u3002",
    },
    attentive: {
      en: "Some of your most important values are in areas where career energy is still developing. This is a natural growth signal. Consider small, experimental steps that gradually bring these values into your professional practice.",
      "zh-TW": "\u60a8\u6700\u91cd\u8996\u7684\u90e8\u5206\u50f9\u503c\u6b63\u8655\u65bc\u8077\u696d\u80fd\u91cf\u4ecd\u5728\u767c\u5c55\u7684\u9818\u57df\u3002\u9019\u662f\u4e00\u500b\u81ea\u7136\u7684\u6210\u9577\u4fe1\u865f\u3002\u53ef\u4ee5\u8003\u616e\u63a1\u53d6\u5c0f\u6b65\u8a66\u9a57\uff0c\u9010\u6b65\u5c07\u9019\u4e9b\u50f9\u503c\u5e36\u5165\u60a8\u7684\u5c08\u696d\u5be6\u8e10\u4e2d\u3002",
      "zh-CN": "\u60a8\u6700\u91cd\u89c6\u7684\u90e8\u5206\u4ef7\u503c\u6b63\u5904\u4e8e\u804c\u4e1a\u80fd\u91cf\u4ecd\u5728\u53d1\u5c55\u7684\u9886\u57df\u3002\u8fd9\u662f\u4e00\u4e2a\u81ea\u7136\u7684\u6210\u957f\u4fe1\u53f7\u3002\u53ef\u4ee5\u8003\u8651\u91c7\u53d6\u5c0f\u6b65\u8bd5\u9a8c\uff0c\u9010\u6b65\u5c06\u8fd9\u4e9b\u4ef7\u503c\u5e26\u5165\u60a8\u7684\u4e13\u4e1a\u5b9e\u8df5\u4e2d\u3002",
    },
  };

  return `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${sectionTitle}</span>
    </div>

    <div data-keep-together style="padding:24px;background:${activeColors.bg};border-radius:12px;border:1px solid ${activeColors.border};margin-bottom:28px;page-break-inside:avoid;">
      <p style="font-size:14px;color:#374151;line-height:1.9;margin:0;">${genericAdvice[understanding.type][language]}</p>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════
//  SECTION: Overview Description
// ══════════════════════════════════════════════════════════════════════

function generateOverviewHTML(
  understanding: DevelopmentUnderstanding,
  narrative: FusionNarrativeData | undefined,
  language: Language,
): string {
  const sectionTitle = t(language,
    "Integrated Development Overview",
    "\u6574\u5408\u767c\u5c55\u7d50\u69cb\u7e3d\u89bd",
    "\u6574\u5408\u53d1\u5c55\u7ed3\u6784\u603b\u89c8",
  );

  // Use AI narrative report_understanding if available
  const overviewText = narrative?.report_understanding
    || t(language,
      "The following charts map the relationship between your Espresso Card value priorities and Career Anchor development energy. Rather than assigning a fixed label, this visual approach helps you intuitively sense your current development rhythm and identify natural integration pathways.",
      "\u4ee5\u4e0b\u5716\u8868\u5c55\u793a\u60a8\u7684\u7406\u60f3\u4eba\u751f\u5361\u50f9\u503c\u512a\u5148\u5e8f\u8207\u8077\u696d\u9328\u767c\u5c55\u80fd\u91cf\u4e4b\u9593\u7684\u95dc\u4fc2\u3002\u900f\u904e\u8996\u89ba\u5316\u7684\u65b9\u5f0f\uff0c\u8b93\u60a8\u76f4\u89c0\u611f\u53d7\u7576\u524d\u7684\u767c\u5c55\u7bc0\u594f\uff0c\u4e26\u8b58\u5225\u81ea\u7136\u7684\u6574\u5408\u8def\u5f91\u3002",
      "\u4ee5\u4e0b\u56fe\u8868\u5c55\u793a\u60a8\u7684\u7406\u60f3\u4eba\u751f\u5361\u4ef7\u503c\u4f18\u5148\u5e8f\u4e0e\u804c\u4e1a\u951a\u53d1\u5c55\u80fd\u91cf\u4e4b\u95f4\u7684\u5173\u7cfb\u3002\u901a\u8fc7\u53ef\u89c6\u5316\u7684\u65b9\u5f0f\uff0c\u8ba9\u60a8\u76f4\u89c2\u611f\u53d7\u5f53\u524d\u7684\u53d1\u5c55\u8282\u594f\uff0c\u5e76\u8bc6\u522b\u81ea\u7136\u7684\u6574\u5408\u8def\u5f84\u3002",
    );

  const understandingLabel = UNDERSTANDING_LABELS[understanding.type][language];
  const understandingColors = UNDERSTANDING_COLORS[understanding.type];

  return `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${sectionTitle}</span>
    </div>

    <div data-keep-together style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;page-break-inside:avoid;">
      <!-- Overview text -->
      <div style="flex:2;min-width:300px;padding:24px 28px;background:linear-gradient(135deg, ${DEEP_BLUE}08 0%, ${DEEP_BLUE}03 100%);border-radius:14px;border:1px solid ${DEEP_BLUE}15;border-left:4px solid ${DEEP_BLUE};">
        <div style="margin-bottom:12px;">
          <span style="font-size:13px;font-weight:700;color:${DEEP_BLUE};letter-spacing:0.5px;">
            ${t(language, "Development-Oriented Visual Framework", "\u767c\u5c55\u5c0e\u5411\u8996\u89ba\u6846\u67b6", "\u53d1\u5c55\u5bfc\u5411\u89c6\u89c9\u6846\u67b6")}
          </span>
        </div>
        <p style="font-size:14px;color:#374151;line-height:1.9;margin:0;">${overviewText}</p>
      </div>

      <!-- Understanding type badge -->
      <div style="flex:1;min-width:180px;background:${understandingColors.bg};border-radius:14px;padding:24px 20px;border:2px solid ${understandingColors.border};text-align:center;">
        <div style="font-size:32px;margin-bottom:10px;">${understandingColors.icon}</div>
        <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
          ${t(language, "Development Pattern", "\u767c\u5c55\u6a21\u5f0f", "\u53d1\u5c55\u6a21\u5f0f")}
        </div>
        <div style="font-size:18px;font-weight:800;color:${understandingColors.accent};margin-bottom:6px;">${understandingLabel.title}</div>
        <div style="font-size:12px;color:#64748b;line-height:1.5;">${understandingLabel.subtitle}</div>
      </div>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN EXPORT: Generate complete fusion charts HTML
// ══════════════════════════════════════════════════════════════════════

/**
 * Generate the complete Part 3 (Fusion Analysis) HTML content
 * using the dual-chart visual understanding system.
 *
 * Replaces the old quantitative dashboard + structure label + AI narrative system.
 *
 * @returns HTML string for embedding in the combined report
 */
export function generateFusionChartsHTML(
  anchorScores: Record<string, number>,
  rankedCards: RankedCard[],
  language: Language,
  narrative?: FusionNarrativeData,
): string {
  // Build the card → anchor → score node data
  const nodes = buildCardAnchorNodes(rankedCards, anchorScores, language);

  // Compute understanding type
  const understanding = computeDevelopmentUnderstanding(nodes);

  // Assemble sections
  let html = "";

  // Section 1: Overview
  html += generateOverviewHTML(understanding, narrative, language);

  // Section 2: Chart 1 — Anchor × Card Mapping
  html += generateChart1HTML(nodes, anchorScores, language);

  // Section 3: Chart 2 — Card Development Distribution
  html += generateChart2HTML(nodes, language);

  // Section 4+5: Development Understanding + Suggestions (keep as one visual unit)
  html += `<div data-keep-together style="page-break-inside:avoid;">`;
  html += generateUnderstandingHTML(understanding, nodes, language);
  html += generateSuggestionsHTML(understanding, narrative, language);
  html += `</div>`;

  return html;
}
