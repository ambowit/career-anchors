/**
 * SCPC V4.2 Report Generator — Enterprise Professional Complete Edition
 *
 * Structure (6 Parts + Career Stage + Structure Enhancement):
 *   Cover Page (独立封面 — elegant ivory/cream style)
 *   Career Stage Interpretation (职涯阶段解析)
 *   Part 1: 8-Anchor Core Drive Radar Chart (8锚核心驱动雷达图)
 *   Part 2: Four-Zone Positioning Chart (四区定位结构图)
 *   Part 3: Full 8-Anchor Detailed Interpretation (八锚完整排序详解)
 *     — Enhanced: strength bar, zone analysis, stage adaptation, structural role, tension
 *   Structure Enhancement Module (结构增强模块 — V4.2)
 *     — Anchor weight ratio, dual-anchor, tri-anchor, weight density
 *   Part 4: Development Imbalance Risk Analysis (发展失衡风险分析 — risk analysis)
 *   Part 5: Comprehensive Development Recommendations (综合发展建议 — 3 layers)
 *   Part 6: Focus Action Recommendations (焦点行动推荐)
 *
 * Data priority: Database → AI generation → Hardcoded fallback
 * AI iron rules: Standard text from DB first; AI supplement ≤250 chars; no diagnostic tone
 */

import { supabase } from "@/integrations/supabase/client";
import {
  fetchCareerStageDescription,
  fetchAllAnchorTextBlocks,
  fetchDualAnchorText,
  fetchTriAnchorText,
  fetchActiveReportVersion,
  sortScoresDescending,
  type LangKey,
  type AnchorTextBlocks,
  type DualAnchorResult,
  type TriAnchorResult,
} from "@/lib/reportDataFetcher";
import { generateRadarChartSVG } from "@/lib/reportSvgCharts";
import {
  generateCoverHTML,
  generateReportNumber,
  type ReportCoverType,
} from "@/lib/reportNumberGenerator";
import { getAnchorLabel } from "@/lib/reportConstants";
import { getActionPlan } from "@/data/actionPlans";
import { CPC_REPORT_CSS, getZoneInvertedPillClass, getZoneSemClass, getZoneSemSoftClass } from "@/lib/reportDesignSystem";

// ---------------------------------------------------------------------------
// Pill Inline Renderer — bypasses CSS class conflicts for html2canvas stability
// Uses display:inline-block + line-height:height for centering in html2canvas.
// html2canvas fails with: flex centering, inline-flex, AND inline-table+table-cell
// (table-cell silently clips auto-width content). line-height=height is the only
// universally reliable single-line vertical centering technique.
// ---------------------------------------------------------------------------

function getPillColors(score: number, variant: "solid" | "soft" = "solid"): { bg: string; fg: string } {
  if (variant === "soft") {
    if (score >= 80) return { bg: "#dce4f2", fg: "#1C2857" };
    if (score >= 65) return { bg: "#fde8d4", fg: "#9A4B0A" };
    if (score >= 45) return { bg: "#fdf3d0", fg: "#8b6914" };
    return { bg: "#d1fae5", fg: "#065F46" };
  }
  if (score >= 80) return { bg: "#1C2857", fg: "#fff" };
  if (score >= 65) return { bg: "#E67E22", fg: "#fff" };
  if (score >= 45) return { bg: "#F6C343", fg: "#1C2857" };
  return { bg: "#10B981", fg: "#fff" };
}

// PILL_SIZES: total height for each tier.
// CRITICAL: html2canvas fails with flex, inline-flex, AND inline-table+table-cell.
// The ONLY reliable technique is display:inline-block with line-height equal to height.
const PILL_SIZES = {
  sm: { height: 36, paddingX: 14, fontSize: 12 },
  md: { height: 44, paddingX: 18, fontSize: 13 },
  lg: { height: 52, paddingX: 24, fontSize: 15 },
} as const;

function renderPill(content: string, bg: string, fg: string, size: "sm" | "md" | "lg" = "lg"): string {
  const s = PILL_SIZES[size];
  // IRON RULE: line-height = height → reliable centering in html2canvas/PDF
  // flex/inline-flex/table-cell ALL fail in html2canvas; only line-height=height works.
  return `<span style="display:inline-block;height:${s.height}px;line-height:${s.height}px;padding:0 ${s.paddingX}px;border-radius:999px;background:${bg};color:${fg};font-weight:800;font-size:${s.fontSize}px;text-align:center;white-space:nowrap;vertical-align:middle;page-break-inside:avoid;break-inside:avoid;-webkit-font-smoothing:antialiased;">${content}</span>`;
}

function renderNumberCircle(num: number): string {
  // IRON RULE: line-height = height = 38px → reliable centering in html2canvas/PDF
  return `<span style="display:inline-block;width:38px;height:38px;line-height:38px;border-radius:50%;background:#1C2857;text-align:center;color:#fff;font-size:15px;font-weight:700;font-family:'Montserrat',sans-serif;vertical-align:middle;-webkit-font-smoothing:antialiased;">${num}</span>`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface V3ReportInput {
  scores: Record<string, number>;
  careerStage: string;
  userName: string;
  workExperienceYears: number | null;
  userId: string;
  organizationId?: string | null;
  assessmentDate?: string;
  reportVersion?: string;
  reportType?: ReportCoverType;
}

export interface V3ReportOutput {
  coverHtml: string;
  bodyHtml: string;
  reportNumber: string;
  aiGenerationNeeded: AiGenerationFlag[];
}

export interface AiGenerationFlag {
  chapter: number;
  chapterTitle: string;
  anchorType?: string;
  sectionType?: string;
  reason: string;
}

interface ComprehensiveAiContent {
  riskAnalysis: string;
  developmentPlan: string;
}

// ---------------------------------------------------------------------------
// V4.2 Anchor Labels (full-form names per spec)
// ---------------------------------------------------------------------------

const V42_ANCHOR_LABELS: Record<string, Record<LangKey, string>> = {
  TF: { en: "Technical / Functional Competence", "zh-TW": "\u6280\u8853\uFF0F\u5C08\u696D\u80FD\u529B\u578B", "zh-CN": "\u6280\u672F\uFF0F\u4E13\u4E1A\u80FD\u529B\u578B" },
  GM: { en: "General Management", "zh-TW": "\u7BA1\u7406\u578B", "zh-CN": "\u7BA1\u7406\u578B" },
  AU: { en: "Autonomy / Independence", "zh-TW": "\u81EA\u4E3B\uFF0F\u7368\u7ACB\u578B", "zh-CN": "\u81EA\u4E3B\uFF0F\u72EC\u7ACB\u578B" },
  SE: { en: "Security / Stability", "zh-TW": "\u5B89\u5168\uFF0F\u7A69\u5B9A\u578B", "zh-CN": "\u5B89\u5168\uFF0F\u7A33\u5B9A\u578B" },
  SV: { en: "Service / Dedication", "zh-TW": "\u670D\u52D9\uFF0F\u5949\u737B\u578B", "zh-CN": "\u670D\u52A1\uFF0F\u5949\u732E\u578B" },
  CH: { en: "Pure Challenge", "zh-TW": "\u6311\u6230\u578B", "zh-CN": "\u6311\u6218\u578B" },
  EC: { en: "Entrepreneurial Creativity", "zh-TW": "\u5275\u696D\uFF0F\u5275\u9020\u578B", "zh-CN": "\u521B\u4E1A\uFF0F\u521B\u9020\u578B" },
  LS: { en: "Lifestyle Integration", "zh-TW": "\u751F\u6D3B\u65B9\u5F0F\u6574\u5408\u578B", "zh-CN": "\u751F\u6D3B\u65B9\u5F0F\u6574\u5408\u578B" },
};

function getV42Label(code: string, lang: LangKey): string {
  return V42_ANCHOR_LABELS[code]?.[lang] || getAnchorLabel(code, lang);
}

// ---------------------------------------------------------------------------
// Labels (V4.2 — "Part" numbering instead of "Chapter")
// ---------------------------------------------------------------------------

function getLabels(language: LangKey) {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  return {
    // Section titles
    careerStageTitle: isEn ? "Your Career Stage" : isTW ? "\u4F60\u7684\u8077\u696D\u968E\u6BB5" : "\u4F60\u7684\u804C\u4E1A\u9636\u6BB5",
    part1Title: isEn ? "8-Anchor Career Core Drive Chart" : isTW ? "8 \u9328\u8077\u6DAF\u6838\u5FC3\u9A45\u52D5\u5716" : "8 \u951A\u804C\u6DAF\u6838\u5FC3\u9A71\u52A8\u56FE",
    part2Title: isEn ? "8-Anchor Career Positioning Chart" : isTW ? "8\u9328\u8077\u6DAF\u5B9A\u4F4D\u5716" : "8\u951A\u804C\u6DAF\u5B9A\u4F4D\u56FE",
    part3Title: isEn ? "Anchor Analysis" : isTW ? "\u9328\u9EDE\u8A73\u89E3" : "\u951A\u70B9\u8BE6\u89E3",
    structureTitle: isEn ? "Structure Enhancement Analysis" : isTW ? "\u7D50\u69CB\u589E\u5F37\u5206\u6790" : "\u7ED3\u6784\u589E\u5F3A\u5206\u6790",
    part4Title: isEn ? "Anchor Development Imbalance Risk Warning" : isTW ? "\u9328\u9EDE\u767C\u5C55\u5931\u8861\u98A8\u96AA\u63D0\u9192" : "\u951A\u70B9\u53D1\u5C55\u5931\u8861\u98CE\u9669\u63D0\u9192",
    part5Title: isEn ? "Execution & Learning Direction" : isTW ? "\u57F7\u884C\u8207\u5B78\u7FD2\u65B9\u5411" : "\u6267\u884C\u4E0E\u5B66\u4E60\u65B9\u5411",
    part6Title: isEn ? "Focus Action Recommendations" : isTW ? "\u7126\u9EDE\u884C\u52D5\u63A8\u85A6" : "\u7126\u70B9\u884C\u52A8\u63A8\u8350",

    // Part badge
    partLabel: isEn ? "Part" : isTW ? "\u7B2C" : "\u7B2C",
    partSuffix: isEn ? "" : isTW ? "\u90E8\u5206" : "\u90E8\u5206",

    // Zone labels
    coreAdvantage: isEn ? "Core Advantage" : isTW ? "\u6838\u5FC3\u512A\u52E2" : "\u6838\u5FC3\u4F18\u52BF",
    highSensitivity: isEn ? "High Sensitivity" : isTW ? "\u9AD8\u654F\u611F\u5340" : "\u9AD8\u654F\u611F\u533A",
    moderate: isEn ? "Moderate Influence" : isTW ? "\u4E2D\u5EA6\u5F71\u97FF" : "\u4E2D\u5EA6\u5F71\u54CD",
    nonCore: isEn ? "Non-core Dimension" : isTW ? "\u975E\u6838\u5FC3\u7DAD\u5EA6" : "\u975E\u6838\u5FC3\u7EF4\u5EA6",

    // Anchor card section labels
    coreInterpretation: isEn ? "Core Interpretation Framework" : isTW ? "\u6838\u5FC3\u8A6E\u91CB\u6846\u67B6" : "\u6838\u5FC3\u8BE0\u91CA\u6846\u67B6",
    anchorExplanation: isEn ? "Anchor Explanation" : isTW ? "\u9328\u9EDE\u89E3\u91CB" : "\u951A\u70B9\u89E3\u91CA",
    zoneAnalysis: isEn ? "Zone Structure Analysis" : isTW ? "\u5206\u5340\u7D50\u69CB\u89E3\u6790" : "\u5206\u533A\u7ED3\u6784\u89E3\u6790",
    stageAdaptation: isEn ? "Career Stage Adaptation" : isTW ? "\u8077\u6DAF\u968E\u6BB5\u9069\u914D" : "\u804C\u6DAF\u9636\u6BB5\u9002\u914D",
    structuralRole: isEn ? "Structural Role" : isTW ? "\u7D50\u69CB\u89D2\u8272\u610F\u7FA9" : "\u7ED3\u6784\u89D2\u8272\u610F\u4E49",
    devTension: isEn ? "Potential Development Tension" : isTW ? "\u6F5B\u5728\u767C\u5C55\u5F35\u529B" : "\u6F5C\u5728\u53D1\u5C55\u5F20\u529B",

    // Structure enhancement
    weightRatio: isEn ? "Anchor Strength Comparison" : isTW ? "\u9328\u9EDE\u6B0A\u91CD\u6BD4\u4F8B\u5716" : "\u951A\u70B9\u6743\u91CD\u6BD4\u4F8B\u56FE",
    dualAnchorHint: isEn ? "Dual-Anchor Interaction" : isTW ? "\u96D9\u9328\u4E92\u52D5\u63D0\u793A" : "\u53CC\u951A\u4E92\u52A8\u63D0\u793A",
    triAnchorHint: isEn ? "Triple-Anchor Synergy" : isTW ? "\u4E09\u9328\u7D50\u69CB\u63D0\u793A" : "\u4E09\u951A\u7ED3\u6784\u63D0\u793A",
    weightDensity: isEn ? "Structure Weight Density" : isTW ? "\u7D50\u69CB\u6B0A\u91CD\u5BC6\u5EA6" : "\u7ED3\u6784\u6743\u91CD\u5BC6\u5EA6",

    // Risk dimensions
    riskIdentity: isEn ? "Identity Over-Attachment Risk" : isTW ? "\u8EAB\u4EFD\u904E\u5EA6\u4F9D\u9644\u98A8\u96AA" : "\u8EAB\u4EFD\u8FC7\u5EA6\u4F9D\u9644\u98CE\u9669",
    riskDepletion: isEn ? "Energy Depletion Risk" : isTW ? "\u80FD\u91CF\u8017\u7AED\u98A8\u96AA" : "\u80FD\u91CF\u8017\u7AED\u98CE\u9669",
    riskStagnation: isEn ? "Growth Stagnation Risk" : isTW ? "\u6210\u9577\u505C\u6EEF\u98A8\u96AA" : "\u6210\u957F\u505C\u6EEF\u98CE\u9669",
    riskMisalignment: isEn ? "Structural Misalignment Risk" : isTW ? "\u7D50\u69CB\u932F\u4F4D\u98A8\u96AA" : "\u7ED3\u6784\u9519\u4F4D\u98CE\u9669",

    // Dev layers
    devDeepen: isEn ? "Capability Deepening" : isTW ? "\u80FD\u529B\u6DF1\u5316\u5EFA\u8B70" : "\u80FD\u529B\u6DF1\u5316\u5EFA\u8BAE",
    devUpgrade: isEn ? "Role Upgrade" : isTW ? "\u89D2\u8272\u5347\u7D1A\u5EFA\u8B70" : "\u89D2\u8272\u5347\u7EA7\u5EFA\u8BAE",
    devOptimize: isEn ? "Structure Optimization" : isTW ? "\u7D50\u69CB\u512A\u5316\u5EFA\u8B70" : "\u7ED3\u6784\u4F18\u5316\u5EFA\u8BAE",
    actionDirection: isEn ? "Direction" : isTW ? "\u884C\u52D5\u65B9\u5411" : "\u884C\u52A8\u65B9\u5411",
    verificationMethod: isEn ? "Verification" : isTW ? "\u9A57\u8B49\u65B9\u5F0F" : "\u9A8C\u8BC1\u65B9\u5F0F",
    potentialBenefit: isEn ? "Benefit" : isTW ? "\u6F5B\u5728\u6536\u76CA" : "\u6F5C\u5728\u6536\u76CA",
    riskLevel: isEn ? "Risk Level" : isTW ? "\u98A8\u96AA\u7B49\u7D1A" : "\u98CE\u9669\u7B49\u7EA7",

    // Focus action
    focusActionIntro: isEn
      ? "Based on your anchor structure, the following 3\u20135 focus actions are recommended. Each is actionable, verifiable, and measurable."
      : isTW
        ? "\u6839\u64DA\u4F60\u7684\u9328\u9EDE\u7D50\u69CB\uFF0C\u4EE5\u4E0B\u662F3\u20135\u689D\u7126\u9EDE\u884C\u52D5\u63A8\u85A6\u3002\u6BCF\u689D\u5747\u53EF\u57F7\u884C\u3001\u53EF\u9A57\u8B49\u3001\u53EF\u8861\u91CF\u3002"
        : "\u6839\u636E\u4F60\u7684\u951A\u70B9\u7ED3\u6784\uFF0C\u4EE5\u4E0B\u662F3\u20135\u6761\u7126\u70B9\u884C\u52A8\u63A8\u8350\u3002\u6BCF\u6761\u5747\u53EF\u6267\u884C\u3001\u53EF\u9A8C\u8BC1\u3001\u53EF\u8861\u91CF\u3002",

    // Misc
    score: isEn ? "Score" : isTW ? "\u5F97\u5206" : "\u5F97\u5206",
    noTemplateText: isEn ? "Content pending \u2014 awaiting expert review or AI generation." : isTW ? "\u5167\u5BB9\u5F85\u88DC\u5145 \u2014 \u7B49\u5F85\u5C08\u5BB6\u5BE9\u6838\u6216AI\u751F\u6210\u3002" : "\u5185\u5BB9\u5F85\u8865\u5145 \u2014 \u7B49\u5F85\u4E13\u5BB6\u5BA1\u6838\u6216AI\u751F\u6210\u3002",
    dualAnchorIntro: isEn
      ? "Your top two anchors form a structural combination that influences your career decisions."
      : isTW
        ? "\u4F60\u7684\u524D\u5169\u500B\u9328\u9EDE\u69CB\u6210\u4E86\u4E00\u500B\u5F71\u97FF\u8077\u696D\u6C7A\u7B56\u7684\u7D50\u69CB\u6027\u7D44\u5408\u3002"
        : "\u4F60\u7684\u524D\u4E24\u4E2A\u951A\u70B9\u6784\u6210\u4E86\u4E00\u4E2A\u5F71\u54CD\u804C\u4E1A\u51B3\u7B56\u7684\u7ED3\u6784\u6027\u7EC4\u5408\u3002",
    triAnchorIntro: isEn
      ? "Your top three anchors match a recognized archetype pattern."
      : isTW
        ? "\u4F60\u7684\u524D\u4E09\u500B\u9328\u9EDE\u5339\u914D\u4E00\u500B\u5DF2\u77E5\u7684\u539F\u578B\u6A21\u5F0F\u3002"
        : "\u4F60\u7684\u524D\u4E09\u4E2A\u951A\u70B9\u5339\u914D\u4E00\u4E2A\u5DF2\u77E5\u7684\u539F\u578B\u6A21\u5F0F\u3002",
    frameworkOverviewTitle: isEn ? "Anchor Distribution Overview" : isTW ? "\u9328\u9EDE\u5206\u4F48\u7E3D\u89BD" : "\u951A\u70B9\u5206\u5E03\u603B\u89C8",
    frameworkOverviewDesc: isEn
      ? "Based on your assessment scores, your 8 career anchors are distributed across the following zones:"
      : isTW
        ? "\u6839\u64DA\u4F60\u7684\u6E2C\u8A55\u5F97\u5206\uFF0C\u4F60\u76848\u500B\u8077\u696D\u9328\u9EDE\u5206\u4F48\u5728\u4EE5\u4E0B\u5340\u9593\uFF1A"
        : "\u6839\u636E\u4F60\u7684\u6D4B\u8BC4\u5F97\u5206\uFF0C\u4F60\u76848\u4E2A\u804C\u4E1A\u951A\u70B9\u5206\u5E03\u5728\u4EE5\u4E0B\u533A\u95F4\uFF1A",
    actionLearning: isEn ? "Key Learning Directions" : isTW ? "\u91CD\u9EDE\u5B78\u7FD2\u65B9\u5411" : "\u91CD\u70B9\u5B66\u4E60\u65B9\u5411",
    actionPaths: isEn ? "Suggested Career Paths" : isTW ? "\u5EFA\u8B70\u8077\u6DAF\u8DEF\u5F91" : "\u5EFA\u8BAE\u804C\u6DAF\u8DEF\u5F84",
    actionVerification: isEn ? "Focus Action Recommendations" : isTW ? "\u7126\u9EDE\u884C\u52D5\u63A8\u85A6" : "\u7126\u70B9\u884C\u52A8\u63A8\u8350",
    actionTradeoffs: isEn ? "Things You May Need to Trade Off" : isTW ? "\u4F60\u53EF\u80FD\u9700\u8981\u6B0A\u8861\u7684" : "\u4F60\u53EF\u80FD\u9700\u8981\u6743\u8861\u7684",
    actionTimeline: isEn ? "Timeline" : isTW ? "\u6642\u9593\u7DDA" : "\u65F6\u95F4\u7EBF",
    actionRisk: isEn ? "Risk" : isTW ? "\u98A8\u96AA" : "\u98CE\u9669",
    actionRecommended: isEn ? "Recommended" : isTW ? "\u63A8\u85A6" : "\u63A8\u8350",

    // Anchor card DB content sections
    riskWarningLabel: isEn ? "Risk Warning" : isTW ? "\u98A8\u96AA\u63D0\u9192" : "\u98CE\u9669\u63D0\u9192",
    developmentPathLabel: isEn ? "Development Path" : isTW ? "\u9069\u5408\u767C\u5C55\u8DEF\u5F91" : "\u9002\u5408\u53D1\u5C55\u8DEF\u5F84",
  };
}

// ---------------------------------------------------------------------------
// Part number badge
// ---------------------------------------------------------------------------

const CHINESE_NUMBERS = ["", "\u4e00", "\u4e8c", "\u4e09", "\u56db", "\u4e94", "\u516d", "\u4e03", "\u516b"];

function partPrefix(num: number, labels: ReturnType<typeof getLabels>): string {
  if (labels.partLabel === "Part") {
    return `Part ${num} `;
  }
  const chineseNum = CHINESE_NUMBERS[num] || String(num);
  return `${labels.partLabel}${chineseNum}${labels.partSuffix} `;
}

// ---------------------------------------------------------------------------
// V4.2 Shared Styles
// ---------------------------------------------------------------------------

const BODY_STYLES = `
  <style>
    ${CPC_REPORT_CSS}
    /* --- V3 Report Local Classes (not in design system) --- */
    .block-card {
      padding: 24px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #E9ECEF;
      margin-bottom: 20px;
    }
    .block-card-dark {
      padding: 24px;
      background: linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%);
      border-radius: 12px;
      color: #fff;
      margin-bottom: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
`;

// ---------------------------------------------------------------------------
// V4.2 Zone color helpers
// ---------------------------------------------------------------------------

/** Zone border color with alpha — for anchor card borders */
function getZoneBorderAlpha(score: number): string {
  if (score >= 80) return "rgba(28,40,87,0.2)";
  if (score >= 65) return "rgba(230,126,34,0.2)";
  if (score >= 45) return "rgba(246,195,67,0.25)";
  return "rgba(16,185,129,0.2)";
}

function stripSectionLabel(text: string, label: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith(label)) return trimmed.slice(label.length).trim();
  // Also try with colon variants
  const labelWithColon = label + "：";
  const labelWithEnColon = label + ":";
  if (trimmed.startsWith(labelWithColon)) return trimmed.slice(labelWithColon.length).trim();
  if (trimmed.startsWith(labelWithEnColon)) return trimmed.slice(labelWithEnColon.length).trim();
  return trimmed;
}

function getZoneBannerGradient(score: number): string {
  if (score >= 80) return "linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%)";
  if (score >= 65) return "linear-gradient(135deg, #C0600A 0%, #E67E22 100%)";
  if (score >= 45) return "linear-gradient(135deg, #9A7B0A 0%, #D4A72C 100%)";
  return "linear-gradient(135deg, #0D9668 0%, #10B981 100%)";
}

function getZoneLabel(score: number, labels: ReturnType<typeof getLabels>): string {
  if (score >= 80) return labels.coreAdvantage;
  if (score >= 65) return labels.highSensitivity;
  if (score >= 45) return labels.moderate;
  return labels.nonCore;
}

// ---------------------------------------------------------------------------
// V4.2 Zone Structure Analysis Text (④)
// ---------------------------------------------------------------------------

function getZoneAnalysisText(score: number, language: LangKey): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  if (score >= 80) {
    return isEn
      ? "This anchor falls within the Core Advantage zone (80\u2013100), representing your strongest career drive and most valued professional direction. You have a powerful intrinsic motivation for this dimension, and it has become a defining part of your professional identity. Consistently leveraging this core advantage will bring you deep career fulfillment and sustained achievement."
      : isTW
        ? "\u6B64\u9328\u9EDE\u4F4D\u65BC\u6838\u5FC3\u512A\u52E2\u5340\u9593\uFF0880\u2013100\u5206\uFF09\uFF0C\u4EE3\u8868\u4F60\u5728\u8077\u6DAF\u767C\u5C55\u4E2D\u6700\u91CD\u8996\u7684\u6838\u5FC3\u512A\u52E2\u65B9\u5411\u3002\u4F60\u5C0D\u6B64\u7DAD\u5EA6\u6709\u5F37\u70C8\u7684\u5167\u5728\u9A45\u52D5\uFF0C\u5B83\u5DF2\u878D\u5165\u4F60\u7684\u8077\u696D\u8EAB\u4EFD\u8A8D\u540C\u3002\u6301\u7E8C\u767C\u63EE\u6B64\u9328\u9EDE\u7684\u512A\u52E2\uFF0C\u5C07\u70BA\u4F60\u5E36\u4F86\u6DF1\u5C64\u7684\u8077\u696D\u6EFF\u8DB3\u611F\u8207\u6210\u5C31\u611F\u3002"
        : "\u6B64\u951A\u70B9\u4F4D\u4E8E\u6838\u5FC3\u4F18\u52BF\u533A\u95F4\uFF0880\u2013100\u5206\uFF09\uFF0C\u4EE3\u8868\u4F60\u5728\u804C\u6DAF\u53D1\u5C55\u4E2D\u6700\u91CD\u89C6\u7684\u6838\u5FC3\u4F18\u52BF\u65B9\u5411\u3002\u4F60\u5BF9\u6B64\u7EF4\u5EA6\u6709\u5F3A\u70C8\u7684\u5185\u5728\u9A71\u52A8\uFF0C\u5B83\u5DF2\u878D\u5165\u4F60\u7684\u804C\u4E1A\u8EAB\u4EFD\u8BA4\u540C\u3002\u6301\u7EED\u53D1\u6325\u6B64\u951A\u70B9\u7684\u4F18\u52BF\uFF0C\u5C06\u4E3A\u4F60\u5E26\u6765\u6DF1\u5C42\u7684\u804C\u4E1A\u6EE1\u8DB3\u611F\u4E0E\u6210\u5C31\u611F\u3002";
  }
  if (score >= 65) {
    return isEn
      ? "This anchor falls within the High Sensitivity zone (65\u201379), indicating that while short-term compromise is possible, this need cannot be ignored long-term. When persistently suppressed, accumulated dissatisfaction may become a trigger for career turning points."
      : isTW
        ? "\u6B64\u9328\u9EDE\u4F4D\u65BC\u9AD8\u654F\u611F\u5340\u9593\uFF0865\u201379\u5206\uFF09\uFF0C\u8868\u660E\u4F60\u96D6\u53EF\u77ED\u671F\u59A5\u5354\uFF0C\u4F46\u7121\u6CD5\u9577\u671F\u5FFD\u8996\u6B64\u9700\u6C42\u3002\u7576\u6B64\u7DAD\u5EA6\u88AB\u6301\u7E8C\u58D3\u6291\u6642\uFF0C\u7D2F\u7A4D\u7684\u4E0D\u6EFF\u53EF\u80FD\u6210\u70BA\u89F8\u767C\u8077\u696D\u8F49\u6298\u7684\u95DC\u9375\u56E0\u7D20\u3002"
        : "\u6B64\u951A\u70B9\u4F4D\u4E8E\u9AD8\u654F\u611F\u533A\u95F4\uFF0865\u201379\u5206\uFF09\uFF0C\u8868\u660E\u4F60\u867D\u53EF\u77ED\u671F\u59A5\u534F\uFF0C\u4F46\u65E0\u6CD5\u957F\u671F\u5FFD\u89C6\u6B64\u9700\u6C42\u3002\u5F53\u6B64\u7EF4\u5EA6\u88AB\u6301\u7EED\u538B\u6291\u65F6\uFF0C\u7D2F\u79EF\u7684\u4E0D\u6EE1\u53EF\u80FD\u6210\u4E3A\u89E6\u53D1\u804C\u4E1A\u8F6C\u6298\u7684\u5173\u952E\u56E0\u7D20\u3002";
  }
  if (score >= 45) {
    return isEn
      ? "This anchor falls within the Moderate Influence zone (45\u201364), participating in your career decisions as a supporting factor. This dimension has flexibility and can be adjusted under appropriate conditions, though excessively passive compromise may build hidden pressure."
      : isTW
        ? "\u6B64\u9328\u9EDE\u4F4D\u65BC\u4E2D\u5EA6\u5F71\u97FF\u5340\u9593\uFF0845\u201364\u5206\uFF09\uFF0C\u4F5C\u70BA\u8F14\u52A9\u56E0\u7D20\u53C3\u8207\u4F60\u7684\u8077\u696D\u6C7A\u7B56\u3002\u6B64\u7DAD\u5EA6\u5177\u6709\u8F03\u5927\u7684\u5F48\u6027\u7A7A\u9593\uFF0C\u5728\u9069\u7576\u689D\u4EF6\u4E0B\u53EF\u9748\u6D3B\u8ABF\u6574\uFF0C\u4F46\u904E\u5EA6\u88AB\u52D5\u7684\u59A5\u5354\u53EF\u80FD\u7D2F\u7A4D\u96B1\u6027\u58D3\u529B\u3002"
        : "\u6B64\u951A\u70B9\u4F4D\u4E8E\u4E2D\u5EA6\u5F71\u54CD\u533A\u95F4\uFF0845\u201364\u5206\uFF09\uFF0C\u4F5C\u4E3A\u8F85\u52A9\u56E0\u7D20\u53C2\u4E0E\u4F60\u7684\u804C\u4E1A\u51B3\u7B56\u3002\u6B64\u7EF4\u5EA6\u5177\u6709\u8F83\u5927\u7684\u5F39\u6027\u7A7A\u95F4\uFF0C\u5728\u9002\u5F53\u6761\u4EF6\u4E0B\u53EF\u7075\u6D3B\u8C03\u6574\uFF0C\u4F46\u8FC7\u5EA6\u88AB\u52A8\u7684\u59A5\u534F\u53EF\u80FD\u7D2F\u79EF\u9690\u6027\u538B\u529B\u3002";
  }
  return isEn
    ? "This anchor falls within the Non-core zone (<45), having limited influence on your primary career motivations. This provides flexibility but also means less psychological buffering during unexpected career upheavals."
    : isTW
      ? "\u6B64\u9328\u9EDE\u4F4D\u65BC\u975E\u6838\u5FC3\u5340\u9593\uFF08<45\u5206\uFF09\uFF0C\u5C0D\u4F60\u7684\u4E3B\u8981\u8077\u696D\u52D5\u6A5F\u5F71\u97FF\u6709\u9650\u3002\u9019\u63D0\u4F9B\u4E86\u9748\u6D3B\u6027\uFF0C\u4F46\u4E5F\u610F\u5473\u8457\u5728\u8077\u6DAF\u7A81\u8B8A\u6642\u8F03\u5C11\u7684\u5FC3\u7406\u7DE9\u885D\u3002"
      : "\u6B64\u951A\u70B9\u4F4D\u4E8E\u975E\u6838\u5FC3\u533A\u95F4\uFF08<45\u5206\uFF09\uFF0C\u5BF9\u4F60\u7684\u4E3B\u8981\u804C\u4E1A\u52A8\u673A\u5F71\u54CD\u6709\u9650\u3002\u8FD9\u63D0\u4F9B\u4E86\u7075\u6D3B\u6027\uFF0C\u4F46\u4E5F\u610F\u5473\u7740\u5728\u804C\u6DAF\u7A81\u53D8\u65F6\u8F83\u5C11\u7684\u5FC3\u7406\u7F13\u51B2\u3002";
}

// ---------------------------------------------------------------------------
// V4.2 Structural Role Meaning (⑥)
// ---------------------------------------------------------------------------

function getStructuralRoleInfo(score: number, language: LangKey): { name: string; description: string } {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  if (score >= 80) {
    return {
      name: isEn ? "Identity Driver" : isTW ? "\u8EAB\u4EFD\u9A45\u52D5\u529B" : "\u8EAB\u4EFD\u9A71\u52A8\u529B",
      description: isEn
        ? "This anchor forms the core of your professional identity."
        : isTW
          ? "\u6B64\u9328\u9EDE\u69CB\u6210\u4F60\u8077\u696D\u8EAB\u4EFD\u7684\u6838\u5FC3\u3002"
          : "\u6B64\u951A\u70B9\u6784\u6210\u4F60\u804C\u4E1A\u8EAB\u4EFD\u7684\u6838\u5FC3\u3002",
    };
  }
  if (score >= 65) {
    return {
      name: isEn ? "Energy Source" : isTW ? "\u80FD\u91CF\u4F86\u6E90" : "\u80FD\u91CF\u6765\u6E90",
      description: isEn
        ? "This anchor is a significant source of your sustained work motivation."
        : isTW
          ? "\u6B64\u9328\u9EDE\u662F\u4F60\u6301\u7E8C\u5DE5\u4F5C\u52D5\u529B\u7684\u91CD\u8981\u6E90\u6CC9\u3002"
          : "\u6B64\u951A\u70B9\u662F\u4F60\u6301\u7EED\u5DE5\u4F5C\u52A8\u529B\u7684\u91CD\u8981\u6E90\u6CC9\u3002",
    };
  }
  if (score >= 45) {
    return {
      name: isEn ? "Supporting Tendency" : isTW ? "\u8F14\u52A9\u50BE\u5411" : "\u8F85\u52A9\u503E\u5411",
      description: isEn
        ? "This anchor influences your preferences as a background factor but is not decisive. It can be flexibly adjusted as long as primary anchors are satisfied."
        : isTW
          ? "\u6B64\u9328\u9EDE\u4F5C\u70BA\u80CC\u666F\u56E0\u7D20\u5F71\u97FF\u4F60\u7684\u504F\u597D\uFF0C\u4F46\u975E\u6C7A\u5B9A\u6027\u529B\u91CF\u3002\u5728\u4E3B\u8981\u9328\u9EDE\u5F97\u5230\u6EFF\u8DB3\u7684\u524D\u63D0\u4E0B\u53EF\u9748\u6D3B\u8ABF\u6574\u3002"
          : "\u6B64\u951A\u70B9\u4F5C\u4E3A\u80CC\u666F\u56E0\u7D20\u5F71\u54CD\u4F60\u7684\u504F\u597D\uFF0C\u4F46\u975E\u51B3\u5B9A\u6027\u529B\u91CF\u3002\u5728\u4E3B\u8981\u951A\u70B9\u5F97\u5230\u6EE1\u8DB3\u7684\u524D\u63D0\u4E0B\u53EF\u7075\u6D3B\u8C03\u6574\u3002",
    };
  }
  return {
    name: isEn ? "Adjustable Dimension" : isTW ? "\u53EF\u8ABF\u7BC0\u7DAD\u5EA6" : "\u53EF\u8C03\u8282\u7EF4\u5EA6",
    description: isEn
      ? "This anchor has limited influence on career decisions. This provides flexibility but also means less psychological buffering."
      : isTW
        ? "\u6B64\u9328\u9EDE\u5C0D\u8077\u696D\u6C7A\u7B56\u5F71\u97FF\u8F03\u5C0F\u3002\u63D0\u4F9B\u9748\u6D3B\u6027\uFF0C\u4F46\u4E5F\u610F\u5473\u8457\u8F03\u5C11\u7684\u5FC3\u7406\u7DE9\u885D\u3002"
        : "\u6B64\u951A\u70B9\u5BF9\u804C\u4E1A\u51B3\u7B56\u5F71\u54CD\u8F83\u5C0F\u3002\u63D0\u4F9B\u7075\u6D3B\u6027\uFF0C\u4F46\u4E5F\u610F\u5473\u7740\u8F83\u5C11\u7684\u5FC3\u7406\u7F13\u51B2\u3002",
  };
}

// ---------------------------------------------------------------------------
// V4.2 Development Tension (⑦) — ≤150 chars
// ---------------------------------------------------------------------------

function getDevTensionText(score: number, language: LangKey): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  if (score >= 80) {
    return isEn
      ? "Over-reliance on this anchor may limit career vision. Maintain openness to diverse paths while upholding core values."
      : isTW
        ? "\u904E\u5EA6\u4F9D\u8CF4\u6B64\u9328\u9EDE\u53EF\u80FD\u9650\u5236\u8077\u696D\u8996\u91CE\u3002\u5728\u5805\u6301\u6838\u5FC3\u50F9\u503C\u7684\u540C\u6642\uFF0C\u4FDD\u6301\u5C0D\u591A\u5143\u767C\u5C55\u8DEF\u5F91\u7684\u958B\u653E\u6027\u3002"
        : "\u8FC7\u5EA6\u4F9D\u8D56\u6B64\u951A\u70B9\u53EF\u80FD\u9650\u5236\u804C\u4E1A\u89C6\u91CE\u3002\u5728\u575A\u6301\u6838\u5FC3\u4EF7\u503C\u7684\u540C\u65F6\uFF0C\u4FDD\u6301\u5BF9\u591A\u5143\u53D1\u5C55\u8DEF\u5F84\u7684\u5F00\u653E\u6027\u3002";
  }
  if (score >= 65) {
    return isEn
      ? "Long-term neglect of this need may trigger a crisis at a critical point. Regularly assess satisfaction to prevent turning-point eruptions."
      : isTW
        ? "\u6B64\u9700\u6C42\u82E5\u9577\u671F\u88AB\u5FFD\u8996\uFF0C\u53EF\u80FD\u5728\u81E8\u754C\u9EDE\u7206\u767C\u3002\u5B9A\u671F\u8A55\u4F30\u6EFF\u8DB3\u7A0B\u5EA6\uFF0C\u9810\u9632\u8F49\u6298\u6027\u5371\u6A5F\u3002"
        : "\u6B64\u9700\u6C42\u82E5\u957F\u671F\u88AB\u5FFD\u89C6\uFF0C\u53EF\u80FD\u5728\u4E34\u754C\u70B9\u7206\u53D1\u3002\u5B9A\u671F\u8BC4\u4F30\u6EE1\u8DB3\u7A0B\u5EA6\uFF0C\u9884\u9632\u8F6C\u6298\u6027\u5371\u673A\u3002";
  }
  if (score >= 45) {
    return isEn
      ? "Flexibility here is two-sided: it provides adaptation space but may lead to habitual passive compromise. Clarify your baseline."
      : isTW
        ? "\u6B64\u7DAD\u5EA6\u7684\u9748\u6D3B\u6027\u662F\u96D9\u9762\u7684\u2014\u2014\u63D0\u4F9B\u9069\u61C9\u7A7A\u9593\uFF0C\u4F46\u4E5F\u53EF\u80FD\u5C0E\u81F4\u88AB\u52D5\u59A5\u5354\u7684\u6163\u6027\u3002\u660E\u78BA\u4F60\u7684\u5E95\u7DDA\u3002"
        : "\u6B64\u7EF4\u5EA6\u7684\u7075\u6D3B\u6027\u662F\u53CC\u9762\u7684\u2014\u2014\u63D0\u4F9B\u9002\u5E94\u7A7A\u95F4\uFF0C\u4F46\u4E5F\u53EF\u80FD\u5BFC\u81F4\u88AB\u52A8\u59A5\u534F\u7684\u60EF\u6027\u3002\u660E\u786E\u4F60\u7684\u5E95\u7EBF\u3002";
  }
  return isEn
    ? "Not a primary driver, but may become a vulnerability during upheavals due to lack of coping experience. Basic awareness suffices."
    : isTW
      ? "\u96D6\u975E\u4E3B\u8981\u9A45\u52D5\u529B\uFF0C\u4F46\u5728\u8077\u6DAF\u7A81\u8B8A\u6642\u53EF\u80FD\u56E0\u7F3A\u5C11\u61C9\u5C0D\u7D93\u9A57\u800C\u6210\u70BA\u8106\u5F31\u74B0\u7BC0\u3002\u4FDD\u6301\u57FA\u672C\u89BA\u5BDF\u5373\u53EF\u3002"
      : "\u867D\u975E\u4E3B\u8981\u9A71\u52A8\u529B\uFF0C\u4F46\u5728\u804C\u6DAF\u7A81\u53D8\u65F6\u53EF\u80FD\u56E0\u7F3A\u5C11\u5E94\u5BF9\u7ECF\u9A8C\u800C\u6210\u4E3A\u8106\u5F31\u73AF\u8282\u3002\u4FDD\u6301\u57FA\u672C\u89C9\u5BDF\u5373\u53EF\u3002";
}

// ---------------------------------------------------------------------------
// V4.2 Weight Ratio Chart HTML (structure enhancement module)
// ---------------------------------------------------------------------------

function getBarFillColor(code: string): string {
  if (code === "CH" || code === "EC") return "#1F2D5A";
  if (code === "AU" || code === "SV") return "#E47E22";
  if (code === "GM" || code === "LS") return "#E6B63D";
  if (code === "SE" || code === "TF") return "#20A87B";
  return "#1F2D5A";
}

function generateWeightRatioChart(sortedScores: [string, number][], language: LangKey): string {
  let html = "";
  for (const [code, score] of sortedScores) {
    const label = getV42Label(code, language);
    const fillColor = getBarFillColor(code);
    html += `
      <div class="cpc-anchorRow">
        <div class="cpc-anchorLabel">${code} ${label}</div>
        <div class="cpc-anchorBarTrack">
          <div class="cpc-anchorBarFill" style="width:${Math.round(score)}%;background:${fillColor};"></div>
        </div>
        <div class="cpc-anchorScore">${Math.round(score)}</div>
      </div>
    `;
  }
  return html;
}

// ---------------------------------------------------------------------------
// Anchor Framework Overview (for Part 3 — before individual anchor cards)
// ---------------------------------------------------------------------------

function generateAnchorFrameworkOverview(
  sortedScores: [string, number][],
  language: LangKey,
  labels: ReturnType<typeof getLabels>,
  showTitle: boolean = true,
  showWeights: boolean = false,
): string {
  const zones = [
    { min: 80, max: 100, label: labels.coreAdvantage },
    { min: 65, max: 79, label: labels.highSensitivity },
    { min: 45, max: 64, label: labels.moderate },
    { min: 0, max: 44, label: labels.nonCore },
  ];

  let zonesHtml = "";
  for (const zoneDef of zones) {
    const anchorsInZone = sortedScores.filter(([, score]) => score >= zoneDef.min && score <= zoneDef.max);

    const anchorChips = anchorsInZone
      .map(([code, score]) => {
        const anchorLabel = getV42Label(code, language);
        const pillColors = getPillColors(score, "solid");
        const scoreSpan = `<span style="margin-left:10px;opacity:0.85;font-family:'Montserrat',sans-serif;font-weight:900;">${Math.round(score)}</span>`;
        return `<span style="display:inline-block;page-break-inside:avoid;break-inside:avoid;vertical-align:middle;">${renderPill(`${code} ${anchorLabel}${scoreSpan}`, pillColors.bg, pillColors.fg, "lg")}</span>`;
      })
      .join("");

    const rangeText = zoneDef.min === 0 ? `<${zoneDef.max + 1}` : `${zoneDef.min}\u2013${zoneDef.max}`;

    zonesHtml += `
      <div class="cpc-framework-zone">
        <div class="cpc-level-tag cpc-sem ${zoneDef.min >= 80 ? 'cpc-sem-core-soft' : zoneDef.min >= 65 ? 'cpc-sem-high-soft' : zoneDef.min >= 45 ? 'cpc-sem-mid-soft' : 'cpc-sem-low-soft'}" style="flex-shrink:0;min-width:168px;font-size:13px;">
          <div class="t1">${zoneDef.label}</div>
          <div class="t2">(${rangeText})</div>
        </div>
        <div class="cpc-zone-anchors">${anchorChips}</div>
      </div>
    `;
  }

  return `
    <div class="cpc-framework-overview" data-keep-together style="page-break-inside:avoid;break-inside:avoid;">
      ${showTitle ? `<div style="font-size:15px;font-weight:700;color:#1C2857;margin-bottom:8px;">${labels.frameworkOverviewTitle}</div>
      <div style="font-size:13px;color:#374151;margin-bottom:16px;">${labels.frameworkOverviewDesc}</div>` : ''}
      ${zonesHtml}
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Fallback: Individual anchor explanation + career advice (for Part 3)
// ---------------------------------------------------------------------------

function generateAnchorFallbackContent(anchorCode: string, score: number, language: LangKey): AnchorTextBlocks {
  const anchorLabel = getV42Label(anchorCode, language);
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const zoneLabel = isEn
    ? (score >= 80 ? "core advantage" : score >= 65 ? "high sensitivity" : score >= 45 ? "moderate influence" : "non-core")
    : isTW
      ? (score >= 80 ? "\u6838\u5FC3\u512A\u52E2" : score >= 65 ? "\u9AD8\u654F\u611F" : score >= 45 ? "\u4E2D\u5EA6\u5F71\u97FF" : "\u975E\u6838\u5FC3")
      : (score >= 80 ? "\u6838\u5FC3\u4F18\u52BF" : score >= 65 ? "\u9AD8\u654F\u611F" : score >= 45 ? "\u4E2D\u5EA6\u5F71\u54CD" : "\u975E\u6838\u5FC3");

  const anchorExplanation = isEn
    ? `${anchorLabel} reflects your orientation toward this career dimension. At a score of ${Math.round(score)}, this falls within the ${zoneLabel} zone, indicating ${score >= 65 ? "a significant influence on your career decisions and satisfaction" : "a moderate to limited role in your primary career motivations"}.`
    : isTW
      ? `${anchorLabel}\u53CD\u6620\u4E86\u4F60\u5728\u6B64\u8077\u696D\u7DAD\u5EA6\u4E0A\u7684\u50BE\u5411\u3002\u5F97\u5206${Math.round(score)}\u5206\uFF0C\u843D\u5728${zoneLabel}\u5340\u9593\uFF0C\u8868\u660E${score >= 65 ? "\u5C0D\u4F60\u7684\u8077\u696D\u6C7A\u7B56\u548C\u6EFF\u610F\u5EA6\u6709\u986F\u8457\u5F71\u97FF" : "\u5728\u4F60\u7684\u4E3B\u8981\u8077\u696D\u52D5\u6A5F\u4E2D\u626E\u6F14\u4E2D\u7B49\u5230\u6709\u9650\u7684\u89D2\u8272"}\u3002`
      : `${anchorLabel}\u53CD\u6620\u4E86\u4F60\u5728\u6B64\u804C\u4E1A\u7EF4\u5EA6\u4E0A\u7684\u503E\u5411\u3002\u5F97\u5206${Math.round(score)}\u5206\uFF0C\u843D\u5728${zoneLabel}\u533A\u95F4\uFF0C\u8868\u660E${score >= 65 ? "\u5BF9\u4F60\u7684\u804C\u4E1A\u51B3\u7B56\u548C\u6EE1\u610F\u5EA6\u6709\u663E\u8457\u5F71\u54CD" : "\u5728\u4F60\u7684\u4E3B\u8981\u804C\u4E1A\u52A8\u673A\u4E2D\u626E\u6F14\u4E2D\u7B49\u5230\u6709\u9650\u7684\u89D2\u8272"}\u3002`;

  const careerAdvice = isEn
    ? `Understanding your ${anchorLabel} score helps calibrate career expectations. ${score >= 65 ? "This is a dimension you should actively protect and nurture in your career choices." : "While not a primary driver, this dimension provides context for understanding your complete career motivation profile."}`
    : isTW
      ? `\u7406\u89E3\u4F60\u7684${anchorLabel}\u5F97\u5206\u6709\u52A9\u65BC\u6821\u6E96\u8077\u696D\u671F\u671B\u3002${score >= 65 ? "\u9019\u662F\u4F60\u5728\u8077\u696D\u9078\u64C7\u4E2D\u61C9\u7A4D\u6975\u4FDD\u8B77\u548C\u57F9\u990A\u7684\u7DAD\u5EA6\u3002" : "\u96D6\u975E\u4E3B\u8981\u9A45\u52D5\u529B\uFF0C\u4F46\u6B64\u7DAD\u5EA6\u70BA\u7406\u89E3\u4F60\u5B8C\u6574\u7684\u8077\u696D\u52D5\u6A5F\u63D0\u4F9B\u4E86\u80CC\u666F\u3002"}`
      : `\u7406\u89E3\u4F60\u7684${anchorLabel}\u5F97\u5206\u6709\u52A9\u4E8E\u6821\u51C6\u804C\u4E1A\u671F\u671B\u3002${score >= 65 ? "\u8FD9\u662F\u4F60\u5728\u804C\u4E1A\u9009\u62E9\u4E2D\u5E94\u79EF\u6781\u4FDD\u62A4\u548C\u57F9\u517B\u7684\u7EF4\u5EA6\u3002" : "\u867D\u975E\u4E3B\u8981\u9A71\u52A8\u529B\uFF0C\u4F46\u6B64\u7EF4\u5EA6\u4E3A\u7406\u89E3\u4F60\u5B8C\u6574\u7684\u804C\u4E1A\u52A8\u673A\u63D0\u4F9B\u4E86\u80CC\u666F\u3002"}`;

  return { anchor_explanation: anchorExplanation, career_advice: careerAdvice };
}

// ---------------------------------------------------------------------------
// Comprehensive Risk Fallback — V4.2 structure
// ---------------------------------------------------------------------------

function generateComprehensiveRiskFallback(sortedScores: [string, number][], language: LangKey): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const coreAnchors = sortedScores.filter(([, score]) => score >= 80);
  const highSensAnchors = sortedScores.filter(([, score]) => score >= 65 && score < 80);
  const sections: string[] = [];

  // 1. Identity over-attachment
  if (coreAnchors.length > 0) {
    const coreNames = coreAnchors.map(([code, score]) => `${getV42Label(code, language)}(${Math.round(score)})`).join(isEn ? ", " : "\u3001");
    sections.push(isEn
      ? `Identity Over-Attachment Risk\n\nYour core anchors \u2014 ${coreNames} \u2014 represent your strongest career drivers. ${coreAnchors.length > 1 ? "Multiple core anchors can create directional tension." : "Excessive attachment to a single dimension may narrow career vision."} When organizational environments shift, rigid attachment may create friction with evolving role requirements. Consider maintaining flexibility in how you express these core needs.`
      : isTW
        ? `\u8EAB\u4EFD\u904E\u5EA6\u4F9D\u9644\u98A8\u96AA\n\n\u4F60\u7684\u6838\u5FC3\u9328\u9EDE\u2014\u2014${coreNames}\u2014\u2014\u662F\u4F60\u6700\u5F37\u70C8\u7684\u8077\u6DAF\u9A45\u52D5\u529B\u3002${coreAnchors.length > 1 ? "\u64C1\u6709\u591A\u500B\u6838\u5FC3\u9328\u9EDE\u6642\uFF0C\u53EF\u80FD\u7522\u751F\u65B9\u5411\u6027\u62C9\u626F\u3002" : "\u904E\u5EA6\u56FA\u5B88\u55AE\u4E00\u7DAD\u5EA6\u53EF\u80FD\u9650\u5236\u8077\u6DAF\u8996\u91CE\u3002"}\u7576\u7D44\u7E54\u74B0\u5883\u8B8A\u5316\u6642\uFF0C\u5C0D\u6838\u5FC3\u9328\u9EDE\u7684\u525B\u6027\u4F9D\u9644\u53EF\u80FD\u8207\u89D2\u8272\u9700\u6C42\u7522\u751F\u6469\u64E6\u3002\u5EFA\u8B70\u4FDD\u6301\u8868\u9054\u6838\u5FC3\u9700\u6C42\u7684\u9748\u6D3B\u6027\u3002`
        : `\u8EAB\u4EFD\u8FC7\u5EA6\u4F9D\u9644\u98CE\u9669\n\n\u4F60\u7684\u6838\u5FC3\u951A\u70B9\u2014\u2014${coreNames}\u2014\u2014\u662F\u4F60\u6700\u5F3A\u70C8\u7684\u804C\u6DAF\u9A71\u52A8\u529B\u3002${coreAnchors.length > 1 ? "\u62E5\u6709\u591A\u4E2A\u6838\u5FC3\u951A\u70B9\u65F6\uFF0C\u53EF\u80FD\u4EA7\u751F\u65B9\u5411\u6027\u62C9\u626F\u3002" : "\u8FC7\u5EA6\u56FA\u5B88\u5355\u4E00\u7EF4\u5EA6\u53EF\u80FD\u9650\u5236\u804C\u6DAF\u89C6\u91CE\u3002"}\u5F53\u7EC4\u7EC7\u73AF\u5883\u53D8\u5316\u65F6\uFF0C\u5BF9\u6838\u5FC3\u951A\u70B9\u7684\u521A\u6027\u4F9D\u9644\u53EF\u80FD\u4E0E\u89D2\u8272\u9700\u6C42\u4EA7\u751F\u6469\u64E6\u3002\u5EFA\u8BAE\u4FDD\u6301\u8868\u8FBE\u6838\u5FC3\u9700\u6C42\u7684\u7075\u6D3B\u6027\u3002`);
  }

  // 2. Energy depletion
  if (highSensAnchors.length > 0) {
    const hsNames = highSensAnchors.map(([code, score]) => `${getV42Label(code, language)}(${Math.round(score)})`).join(isEn ? ", " : "\u3001");
    sections.push(isEn
      ? `Energy Depletion Risk\n\nYour high-sensitivity anchors \u2014 ${hsNames} \u2014 are dimensions that exert steady pressure on satisfaction. ${highSensAnchors.length >= 3 ? "With three or more in this zone, accumulated unmet needs create significant dissatisfaction risk." : "These dimensions, while not dominant, need regular outlets."} If your current role consistently fails to address these needs, they may trigger turning-point decisions. Watch for warning signs: persistent frustration, declining motivation, a growing sense of \u201Csomething is missing.\u201D`
      : isTW
        ? `\u80FD\u91CF\u8017\u7AED\u98A8\u96AA\n\n\u4F60\u7684\u9AD8\u654F\u611F\u9328\u9EDE\u2014\u2014${hsNames}\u2014\u2014\u5C0D\u6EFF\u610F\u5EA6\u65BD\u52A0\u6301\u7E8C\u58D3\u529B\u3002${highSensAnchors.length >= 3 ? "\u7576\u4E09\u500B\u6216\u66F4\u591A\u9328\u9EDE\u8655\u65BC\u6B64\u5340\u9593\u6642\uFF0C\u7D2F\u7A4D\u7684\u672A\u6EFF\u8DB3\u9700\u6C42\u53EF\u80FD\u7522\u751F\u986F\u8457\u7684\u4E0D\u6EFF\u98A8\u96AA\u3002" : "\u9019\u4E9B\u7DAD\u5EA6\u96D6\u975E\u4E3B\u5C0E\uFF0C\u4F46\u9700\u8981\u5B9A\u671F\u7684\u51FA\u53E3\u3002"}\u5982\u679C\u7576\u524D\u89D2\u8272\u6301\u7E8C\u7121\u6CD5\u56DE\u61C9\u9019\u4E9B\u9700\u6C42\uFF0C\u53EF\u80FD\u89F8\u767C\u8F49\u6298\u6027\u6C7A\u5B9A\u3002\u7559\u610F\u9810\u8B66\u4FE1\u865F\uFF1A\u6301\u7E8C\u632B\u6298\u611F\u3001\u52D5\u529B\u4E0B\u964D\u3001\u300C\u7F3A\u5C11\u4EC0\u9EBC\u300D\u7684\u611F\u89BA\u3002`
        : `\u80FD\u91CF\u8017\u7AED\u98CE\u9669\n\n\u4F60\u7684\u9AD8\u654F\u611F\u951A\u70B9\u2014\u2014${hsNames}\u2014\u2014\u5BF9\u6EE1\u610F\u5EA6\u65BD\u52A0\u6301\u7EED\u538B\u529B\u3002${highSensAnchors.length >= 3 ? "\u5F53\u4E09\u4E2A\u6216\u66F4\u591A\u951A\u70B9\u5904\u4E8E\u6B64\u533A\u95F4\u65F6\uFF0C\u7D2F\u79EF\u7684\u672A\u6EE1\u8DB3\u9700\u6C42\u53EF\u80FD\u4EA7\u751F\u663E\u8457\u7684\u4E0D\u6EE1\u98CE\u9669\u3002" : "\u8FD9\u4E9B\u7EF4\u5EA6\u867D\u975E\u4E3B\u5BFC\uFF0C\u4F46\u9700\u8981\u5B9A\u671F\u7684\u51FA\u53E3\u3002"}\u5982\u679C\u5F53\u524D\u89D2\u8272\u6301\u7EED\u65E0\u6CD5\u56DE\u5E94\u8FD9\u4E9B\u9700\u6C42\uFF0C\u53EF\u80FD\u89E6\u53D1\u8F6C\u6298\u6027\u51B3\u5B9A\u3002\u7559\u610F\u9884\u8B66\u4FE1\u53F7\uFF1A\u6301\u7EED\u632B\u6298\u611F\u3001\u52A8\u529B\u4E0B\u964D\u3001\u300C\u7F3A\u5C11\u4EC0\u4E48\u300D\u7684\u611F\u89C9\u3002`);
  }

  // 3. Growth stagnation
  const topTwoSpread = sortedScores.length >= 2 ? Math.round(sortedScores[0][1] - sortedScores[sortedScores.length - 1][1]) : 0;
  if (topTwoSpread > 40 && coreAnchors.length > 0) {
    sections.push(isEn
      ? `Growth Stagnation Risk\n\nYour score spread is ${topTwoSpread} points. While strong differentiation provides clarity, it may also create career rigidity. Exclusive focus on peak dimensions while neglecting growth in other areas can lead to a narrowing skill set over time. Consider periodic \u201Cstretch assignments\u201D that gently push beyond your comfort zone without abandoning core strengths.`
      : isTW
        ? `\u6210\u9577\u505C\u6EEF\u98A8\u96AA\n\n\u4F60\u7684\u5F97\u5206\u8DE8\u5EA6\u9054${topTwoSpread}\u5206\u3002\u96D6\u7136\u5F37\u70C8\u7684\u5DEE\u7570\u5316\u63D0\u4F9B\u4E86\u6E05\u6670\u5EA6\uFF0C\u4F46\u4E5F\u53EF\u80FD\u9020\u6210\u8077\u6DAF\u525B\u6027\u3002\u5C08\u6CE8\u65BC\u5CF0\u503C\u7DAD\u5EA6\u800C\u5FFD\u7565\u5176\u4ED6\u9818\u57DF\u7684\u6210\u9577\uFF0C\u53EF\u80FD\u5C0E\u81F4\u6280\u80FD\u96C6\u9010\u6F38\u7E2E\u7A84\u3002\u5EFA\u8B70\u5B9A\u671F\u5617\u8A66\u300C\u62C9\u4F38\u4EFB\u52D9\u300D\uFF0C\u5728\u4E0D\u653E\u68C4\u6838\u5FC3\u512A\u52E2\u7684\u524D\u63D0\u4E0B\u6EAB\u548C\u7A81\u7834\u8212\u9069\u5340\u3002`
        : `\u6210\u957F\u505C\u6EEF\u98CE\u9669\n\n\u4F60\u7684\u5F97\u5206\u8DE8\u5EA6\u8FBE${topTwoSpread}\u5206\u3002\u867D\u7136\u5F3A\u70C8\u7684\u5DEE\u5F02\u5316\u63D0\u4F9B\u4E86\u6E05\u6670\u5EA6\uFF0C\u4F46\u4E5F\u53EF\u80FD\u9020\u6210\u804C\u6DAF\u521A\u6027\u3002\u4E13\u6CE8\u4E8E\u5CF0\u503C\u7EF4\u5EA6\u800C\u5FFD\u7565\u5176\u4ED6\u9886\u57DF\u7684\u6210\u957F\uFF0C\u53EF\u80FD\u5BFC\u81F4\u6280\u80FD\u96C6\u9010\u6E10\u7F29\u7A84\u3002\u5EFA\u8BAE\u5B9A\u671F\u5C1D\u8BD5\u300C\u62C9\u4F38\u4EFB\u52A1\u300D\uFF0C\u5728\u4E0D\u653E\u5F03\u6838\u5FC3\u4F18\u52BF\u7684\u524D\u63D0\u4E0B\u6E29\u548C\u7A81\u7834\u8212\u9002\u533A\u3002`);
  }

  // 4. Structural misalignment
  if (coreAnchors.length === 0) {
    sections.push(isEn
      ? `Structural Misalignment Risk\n\nNo anchor scores above 80, suggesting a balanced or undifferentiated profile. While this provides flexibility, it may indicate that your career identity is still forming. The primary risk is decision paralysis \u2014 without a clear \u201Cnon-negotiable,\u201D definitive career choices become difficult. Consider experimenting with roles that emphasize different dimensions to discover your true resonance.`
      : isTW
        ? `\u7D50\u69CB\u932F\u4F4D\u98A8\u96AA\n\n\u76EE\u524D\u7121\u9328\u9EDE\u8D85\u904E80\u5206\uFF0C\u8868\u660E\u4F60\u7684\u8077\u696D\u9328\u7D50\u69CB\u8F03\u70BA\u5747\u8861\u6216\u5C1A\u672A\u5206\u5316\u3002\u96D6\u7136\u63D0\u4F9B\u4E86\u9748\u6D3B\u6027\uFF0C\u4F46\u53EF\u80FD\u610F\u5473\u8457\u8077\u696D\u8A8D\u540C\u4ECD\u5728\u5F62\u6210\u4E2D\u3002\u4E3B\u8981\u98A8\u96AA\u662F\u6C7A\u7B56\u9072\u7591\u2014\u2014\u6C92\u6709\u660E\u78BA\u7684\u300C\u4E0D\u53EF\u59A5\u5354\u9805\u300D\uFF0C\u95DC\u9375\u8077\u696D\u9078\u64C7\u96E3\u4EE5\u679C\u65B7\u3002\u5EFA\u8B70\u5617\u8A66\u5074\u91CD\u4E0D\u540C\u7DAD\u5EA6\u7684\u89D2\u8272\u3002`
        : `\u7ED3\u6784\u9519\u4F4D\u98CE\u9669\n\n\u76EE\u524D\u65E0\u951A\u70B9\u8D85\u8FC780\u5206\uFF0C\u8868\u660E\u4F60\u7684\u804C\u4E1A\u951A\u7ED3\u6784\u8F83\u4E3A\u5747\u8861\u6216\u5C1A\u672A\u5206\u5316\u3002\u867D\u7136\u63D0\u4F9B\u4E86\u7075\u6D3B\u6027\uFF0C\u4F46\u53EF\u80FD\u610F\u5473\u7740\u804C\u4E1A\u8BA4\u540C\u4ECD\u5728\u5F62\u6210\u4E2D\u3002\u4E3B\u8981\u98CE\u9669\u662F\u51B3\u7B56\u8FDF\u7591\u2014\u2014\u6CA1\u6709\u660E\u786E\u7684\u300C\u4E0D\u53EF\u59A5\u534F\u9879\u300D\uFF0C\u5173\u952E\u804C\u4E1A\u9009\u62E9\u96BE\u4EE5\u679C\u65AD\u3002\u5EFA\u8BAE\u5C1D\u8BD5\u4FA7\u91CD\u4E0D\u540C\u7EF4\u5EA6\u7684\u89D2\u8272\u3002`);
  } else if (coreAnchors.length >= 2 && highSensAnchors.length >= 2) {
    sections.push(isEn
      ? `Structural Misalignment Risk\n\nWith ${coreAnchors.length} core and ${highSensAnchors.length} high-sensitivity anchors, your career needs are multi-dimensional. Finding roles that simultaneously satisfy all these dimensions is challenging. The risk of structural misalignment grows when forced to choose between equally important needs. Consider sequencing rather than simultaneous fulfillment \u2014 some needs can be addressed through primary roles while others through side projects or role modifications.`
      : isTW
        ? `\u7D50\u69CB\u932F\u4F4D\u98A8\u96AA\n\n\u64C1\u6709${coreAnchors.length}\u500B\u6838\u5FC3\u548C${highSensAnchors.length}\u500B\u9AD8\u654F\u611F\u9328\u9EDE\uFF0C\u4F60\u7684\u8077\u6DAF\u9700\u6C42\u662F\u591A\u7DAD\u5EA6\u7684\u3002\u627E\u5230\u540C\u6642\u6EFF\u8DB3\u6240\u6709\u9019\u4E9B\u7DAD\u5EA6\u7684\u89D2\u8272\u5177\u6709\u6311\u6230\u6027\u3002\u7576\u88AB\u8FEB\u5728\u540C\u7B49\u91CD\u8981\u7684\u9700\u6C42\u4E4B\u9593\u9078\u64C7\u6642\uFF0C\u7D50\u69CB\u932F\u4F4D\u98A8\u96AA\u589E\u52A0\u3002\u5EFA\u8B70\u300C\u5E8F\u5217\u5316\u300D\u800C\u975E\u300C\u540C\u6642\u5316\u300D\u6EFF\u8DB3\u2014\u2014\u90E8\u5206\u9700\u6C42\u901A\u904E\u4E3B\u8981\u89D2\u8272\u89E3\u6C7A\uFF0C\u5176\u4ED6\u901A\u904E\u526F\u9805\u76EE\u6216\u89D2\u8272\u8ABF\u6574\u3002`
        : `\u7ED3\u6784\u9519\u4F4D\u98CE\u9669\n\n\u62E5\u6709${coreAnchors.length}\u4E2A\u6838\u5FC3\u548C${highSensAnchors.length}\u4E2A\u9AD8\u654F\u611F\u951A\u70B9\uFF0C\u4F60\u7684\u804C\u6DAF\u9700\u6C42\u662F\u591A\u7EF4\u5EA6\u7684\u3002\u627E\u5230\u540C\u65F6\u6EE1\u8DB3\u6240\u6709\u8FD9\u4E9B\u7EF4\u5EA6\u7684\u89D2\u8272\u5177\u6709\u6311\u6218\u6027\u3002\u5F53\u88AB\u8FEB\u5728\u540C\u7B49\u91CD\u8981\u7684\u9700\u6C42\u4E4B\u95F4\u9009\u62E9\u65F6\uFF0C\u7ED3\u6784\u9519\u4F4D\u98CE\u9669\u589E\u52A0\u3002\u5EFA\u8BAE\u300C\u5E8F\u5217\u5316\u300D\u800C\u975E\u300C\u540C\u65F6\u5316\u300D\u6EE1\u8DB3\u2014\u2014\u90E8\u5206\u9700\u6C42\u901A\u8FC7\u4E3B\u8981\u89D2\u8272\u89E3\u51B3\uFF0C\u5176\u4ED6\u901A\u8FC7\u526F\u9879\u76EE\u6216\u89D2\u8272\u8C03\u6574\u3002`);
  }

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Comprehensive Development Fallback — V4.2 three-layer structure
// ---------------------------------------------------------------------------

function generateComprehensiveDevFallback(sortedScores: [string, number][], language: LangKey): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const coreAnchors = sortedScores.filter(([, score]) => score >= 80);
  const highSensAnchors = sortedScores.filter(([, score]) => score >= 65 && score < 80);
  const sections: string[] = [];

  // Layer 1: Capability deepening
  if (coreAnchors.length > 0) {
    const coreNames = coreAnchors.map(([code]) => getV42Label(code, language)).join(" + ");
    sections.push(isEn
      ? `Capability Deepening\n\nBuild your professional brand around ${coreNames}. Seek roles and projects that naturally align with these dimensions. Consider mentoring others to deepen expertise while expanding influence. When evaluating opportunities, use core anchors as the primary filter \u2014 any role that consistently conflicts is unlikely to sustain your engagement.`
      : isTW
        ? `\u80FD\u529B\u6DF1\u5316\u5EFA\u8B70\n\n\u570D\u7E5E${coreNames}\u5EFA\u7ACB\u4F60\u7684\u5C08\u696D\u54C1\u724C\u3002\u5C0B\u627E\u8207\u9019\u4E9B\u7DAD\u5EA6\u5951\u5408\u7684\u89D2\u8272\u548C\u9805\u76EE\u3002\u8003\u616E\u5728\u9019\u4E9B\u9818\u57DF\u6307\u5C0E\u4ED6\u4EBA\uFF0C\u65E2\u80FD\u6DF1\u5316\u5C08\u696D\u53C8\u80FD\u64F4\u5927\u5F71\u97FF\u529B\u3002\u8A55\u4F30\u6A5F\u6703\u6642\uFF0C\u4EE5\u6838\u5FC3\u9328\u9EDE\u4F5C\u70BA\u9996\u8981\u7BE9\u9078\u6A19\u6E96\u3002`
        : `\u80FD\u529B\u6DF1\u5316\u5EFA\u8BAE\n\n\u56F4\u7ED5${coreNames}\u5EFA\u7ACB\u4F60\u7684\u4E13\u4E1A\u54C1\u724C\u3002\u5BFB\u627E\u4E0E\u8FD9\u4E9B\u7EF4\u5EA6\u5951\u5408\u7684\u89D2\u8272\u548C\u9879\u76EE\u3002\u8003\u8651\u5728\u8FD9\u4E9B\u9886\u57DF\u6307\u5BFC\u4ED6\u4EBA\uFF0C\u65E2\u80FD\u6DF1\u5316\u4E13\u4E1A\u53C8\u80FD\u6269\u5927\u5F71\u54CD\u529B\u3002\u8BC4\u4F30\u673A\u4F1A\u65F6\uFF0C\u4EE5\u6838\u5FC3\u951A\u70B9\u4F5C\u4E3A\u9996\u8981\u7B5B\u9009\u6807\u51C6\u3002`);
  }

  // Layer 2: Role upgrade
  if (highSensAnchors.length > 0) {
    const hsNames = highSensAnchors.map(([code]) => getV42Label(code, language)).join(isEn ? ", " : "\u3001");
    sections.push(isEn
      ? `Role Upgrade\n\nYour high-sensitivity anchors (${hsNames}) need regular outlets. If your primary role doesn\u2019t address these, consider side projects, cross-functional assignments, or role modifications. When choosing between similar opportunities, use these dimensions as a tiebreaker \u2014 the option that better serves high-sensitivity anchors will feel more sustaining.`
      : isTW
        ? `\u89D2\u8272\u5347\u7D1A\u5EFA\u8B70\n\n\u4F60\u7684\u9AD8\u654F\u611F\u9328\u9EDE\uFF08${hsNames}\uFF09\u9700\u8981\u5B9A\u671F\u7684\u51FA\u53E3\u3002\u5982\u679C\u4E3B\u8981\u5DE5\u4F5C\u7121\u6CD5\u6EFF\u8DB3\u9019\u4E9B\u9700\u6C42\uFF0C\u8003\u616E\u901A\u904E\u526F\u9805\u76EE\u3001\u8DE8\u90E8\u9580\u4EFB\u52D9\u6216\u89D2\u8272\u8ABF\u6574\u4F86\u63D0\u4F9B\u90E8\u5206\u6EFF\u8DB3\u3002\u9078\u64C7\u76F8\u4F3C\u6A5F\u6703\u6642\uFF0C\u4EE5\u9019\u4E9B\u7DAD\u5EA6\u4F5C\u70BA\u6C7A\u52DD\u6A19\u6E96\u3002`
        : `\u89D2\u8272\u5347\u7EA7\u5EFA\u8BAE\n\n\u4F60\u7684\u9AD8\u654F\u611F\u951A\u70B9\uFF08${hsNames}\uFF09\u9700\u8981\u5B9A\u671F\u7684\u51FA\u53E3\u3002\u5982\u679C\u4E3B\u8981\u5DE5\u4F5C\u65E0\u6CD5\u6EE1\u8DB3\u8FD9\u4E9B\u9700\u6C42\uFF0C\u8003\u8651\u901A\u8FC7\u526F\u9879\u76EE\u3001\u8DE8\u90E8\u95E8\u4EFB\u52A1\u6216\u89D2\u8272\u8C03\u6574\u6765\u63D0\u4F9B\u90E8\u5206\u6EE1\u8DB3\u3002\u9009\u62E9\u76F8\u4F3C\u673A\u4F1A\u65F6\uFF0C\u4EE5\u8FD9\u4E9B\u7EF4\u5EA6\u4F5C\u4E3A\u51B3\u80DC\u6807\u51C6\u3002`);
  }

  // Layer 3: Structure optimization
  sections.push(isEn
    ? `Structure Optimization\n\nBefore major career decisions, apply this filter:\n1. Does this opportunity protect my core anchors?\n2. Does it provide some outlet for high-sensitivity needs?\n3. Am I making this decision FROM my anchor structure, or AGAINST it?\n\nWhen you feel persistent fatigue or resistance, look back to see if a core or high-sensitivity need has been systematically neglected.`
    : isTW
      ? `\u7D50\u69CB\u512A\u5316\u5EFA\u8B70\n\n\u5728\u91CD\u8981\u8077\u696D\u6C7A\u7B56\u524D\uFF0C\u904B\u7528\u9019\u500B\u7BE9\u9078\u6CD5\uFF1A\n1. \u9019\u500B\u6A5F\u6703\u662F\u5426\u4FDD\u8B77\u4E86\u6211\u7684\u6838\u5FC3\u9328\u9EDE\uFF1F\n2. \u5B83\u662F\u5426\u70BA\u9AD8\u654F\u611F\u9700\u6C42\u63D0\u4F9B\u4E86\u51FA\u53E3\uFF1F\n3. \u6211\u662F\u5728\u9806\u61C9\u81EA\u5DF1\u7684\u9328\u9EDE\u7D50\u69CB\u505A\u6C7A\u7B56\uFF0C\u9084\u662F\u5728\u5C0D\u6297\u5B83\uFF1F\n\n\u7576\u4F60\u611F\u5230\u6301\u7E8C\u7684\u75B2\u618A\u6216\u6297\u62D2\u6642\uFF0C\u56DE\u982D\u770B\u770B\u662F\u5426\u67D0\u500B\u6838\u5FC3\u6216\u9AD8\u654F\u611F\u9700\u6C42\u88AB\u7CFB\u7D71\u6027\u5730\u5FFD\u8996\u4E86\u3002`
      : `\u7ED3\u6784\u4F18\u5316\u5EFA\u8BAE\n\n\u5728\u91CD\u8981\u804C\u4E1A\u51B3\u7B56\u524D\uFF0C\u8FD0\u7528\u8FD9\u4E2A\u7B5B\u9009\u6CD5\uFF1A\n1. \u8FD9\u4E2A\u673A\u4F1A\u662F\u5426\u4FDD\u62A4\u4E86\u6211\u7684\u6838\u5FC3\u951A\u70B9\uFF1F\n2. \u5B83\u662F\u5426\u4E3A\u9AD8\u654F\u611F\u9700\u6C42\u63D0\u4F9B\u4E86\u51FA\u53E3\uFF1F\n3. \u6211\u662F\u5728\u987A\u5E94\u81EA\u5DF1\u7684\u951A\u70B9\u7ED3\u6784\u505A\u51B3\u7B56\uFF0C\u8FD8\u662F\u5728\u5BF9\u6297\u5B83\uFF1F\n\n\u5F53\u4F60\u611F\u5230\u6301\u7EED\u7684\u75B2\u60EB\u6216\u6297\u62D2\u65F6\uFF0C\u56DE\u5934\u770B\u770B\u662F\u5426\u67D0\u4E2A\u6838\u5FC3\u6216\u9AD8\u654F\u611F\u9700\u6C42\u88AB\u7CFB\u7EDF\u6027\u5730\u5FFD\u89C6\u4E86\u3002`);

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Split large text blocks into themed sub-cards for better PDF pagination
// ---------------------------------------------------------------------------

function renderTextAsSplitSections(text: string, themeClass: "cpc-risk-theme" | "cpc-dev-theme"): string {
  const paragraphs = text.split(/\n\n+/).filter(paragraph => paragraph.trim());
  if (paragraphs.length <= 1) {
    return `<div class="${themeClass}" data-keep-together style="page-break-inside:avoid;break-inside:avoid;"><div class="cpc-text-block">${text}</div></div>`;
  }
  let resultHtml = "";
  let paragraphIndex = 0;
  while (paragraphIndex < paragraphs.length) {
    const currentParagraph = paragraphs[paragraphIndex].trim();
    const looksLikeTitle = currentParagraph.length < 80 && !currentParagraph.endsWith(".") && !currentParagraph.endsWith("\u3002") && !currentParagraph.endsWith("\uFF1A") && !currentParagraph.includes("\n");
    if (looksLikeTitle && paragraphIndex + 1 < paragraphs.length) {
      const bodyParagraph = paragraphs[paragraphIndex + 1].trim();
      resultHtml += `<div class="${themeClass}" data-keep-together style="page-break-inside:avoid;break-inside:avoid;"><div style="font-size:15px;font-weight:700;color:#1C2857;margin-bottom:10px;">${currentParagraph}</div><div class="cpc-text-block">${bodyParagraph}</div></div>`;
      paragraphIndex += 2;
    } else {
      resultHtml += `<div class="${themeClass}" data-keep-together style="page-break-inside:avoid;break-inside:avoid;"><div class="cpc-text-block">${currentParagraph}</div></div>`;
      paragraphIndex += 1;
    }
  }
  return resultHtml;
}

// ---------------------------------------------------------------------------
// AI Content Generation — comprehensive risk & development content
// ---------------------------------------------------------------------------

// Raw AI response type — separated from text block merging for parallel execution
interface AiDeepDiveRawResult {
  primaryAnchorInterpretation?: { coreMeaning?: string; stageContext?: string };
  riskAnalysis: string;
  developmentPlan: string;
}

/**
 * Phase 2 parallel task: fire AI deep_dive call.
 * Does NOT read or mutate allTextBlocks — purely an API call.
 */
async function fireAiDeepDive(
  sortedScores: [string, number][],
  coreAnchors: [string, number][],
  input: V3ReportInput,
  language: LangKey,
): Promise<AiDeepDiveRawResult | null> {
  const mainAnchorCode = sortedScores[0]?.[0];
  if (!mainAnchorCode) return null;
  const coreAdvantageAnchorCodes = coreAnchors.map(([code]) => code);
  const highSensitivityAnchors = sortedScores.filter(([, score]) => score >= 65 && score < 80).map(([code]) => code);
  try {
    const { data: aiData } = await supabase.functions.invoke("personalized-analysis", {
      body: {
        result: { scores: input.scores, mainAnchor: mainAnchorCode, coreAdvantageAnchors: coreAdvantageAnchorCodes, conflictAnchors: highSensitivityAnchors, stability: "developing" },
        analysisType: "deep_dive", language, workYears: input.workExperienceYears, isExecutive: input.careerStage === "executive", isEntrepreneur: input.careerStage === "entrepreneur",
        reportVersion: input.reportVersion || null, organizationId: input.organizationId || null,
      },
    });
    if (!aiData?.analysis) return null;
    const { imbalancePatterns, developmentRecommendations, primaryAnchorInterpretation, tensionOrRiskSignals } = aiData.analysis;
    let riskAnalysis = "";
    if (imbalancePatterns) {
      const riskParts = [imbalancePatterns.overExpression, imbalancePatterns.underExpression, imbalancePatterns.stageSpecificRisk].filter(Boolean);
      riskAnalysis = riskParts.join("\n\n");
    }
    if (tensionOrRiskSignals?.signals?.length) {
      const signalTexts = tensionOrRiskSignals.signals.map((signal: { signal: string; interpretation: string; recommendation: string }) => `${signal.signal}\n${signal.interpretation}`).filter(Boolean);
      if (signalTexts.length > 0) riskAnalysis += (riskAnalysis ? "\n\n" : "") + signalTexts.join("\n\n");
    }
    let developmentPlan = "";
    if (developmentRecommendations?.length) {
      developmentPlan = developmentRecommendations.map((rec: { direction: string; rationale: string; action: string }) => `${rec.direction}\n${rec.action}\n${rec.rationale}`).join("\n\n");
    }
    if (!riskAnalysis && !developmentPlan && !primaryAnchorInterpretation) return null;
    return { primaryAnchorInterpretation, riskAnalysis: riskAnalysis || "", developmentPlan: developmentPlan || "" };
  } catch (aiError) {
    console.warn("[V4.2 Generator] AI content generation failed, using fallback:", aiError);
    return null;
  }
}

/**
 * Phase 3 merge: apply AI results into allTextBlocks after both DB and AI complete.
 */
function mergeAiDeepDiveResult(
  aiRawResult: AiDeepDiveRawResult | null,
  allTextBlocks: Record<string, AnchorTextBlocks | null>,
  mainAnchorCode: string,
): ComprehensiveAiContent | null {
  if (!aiRawResult) return null;
  const { primaryAnchorInterpretation, riskAnalysis, developmentPlan } = aiRawResult;
  if (primaryAnchorInterpretation && mainAnchorCode) {
    if (!allTextBlocks[mainAnchorCode]) allTextBlocks[mainAnchorCode] = {};
    if (!allTextBlocks[mainAnchorCode]!.anchor_explanation && primaryAnchorInterpretation.coreMeaning) allTextBlocks[mainAnchorCode]!.anchor_explanation = primaryAnchorInterpretation.coreMeaning;
    if (!allTextBlocks[mainAnchorCode]!.career_advice && primaryAnchorInterpretation.stageContext) allTextBlocks[mainAnchorCode]!.career_advice = primaryAnchorInterpretation.stageContext;
  }
  if (!riskAnalysis && !developmentPlan) return null;
  return { riskAnalysis, developmentPlan };
}

// ---------------------------------------------------------------------------
// AI Content Generation — dual-anchor structural interpretation
// ---------------------------------------------------------------------------

async function tryAiDualAnchorGeneration(anchor1Code: string, anchor1Score: number, anchor2Code: string, anchor2Score: number, input: V3ReportInput, language: LangKey): Promise<string | null> {
  try {
    const highSensitivityAnchors = Object.entries(input.scores).filter(([, score]) => score >= 65 && score < 80).map(([code]) => code);
    const { data: aiData } = await supabase.functions.invoke("personalized-analysis", {
      body: {
        result: { scores: input.scores, mainAnchor: anchor1Code, coreAdvantageAnchors: [anchor1Code, anchor2Code], conflictAnchors: highSensitivityAnchors, stability: "developing", dualAnchors: { code1: anchor1Code, score1: anchor1Score, code2: anchor2Code, score2: anchor2Score } },
        analysisType: "dual_anchor", language, workYears: input.workExperienceYears, isExecutive: input.careerStage === "executive", isEntrepreneur: input.careerStage === "entrepreneur",
        reportVersion: input.reportVersion || null, organizationId: input.organizationId || null,
      },
    });
    if (!aiData?.analysis?.dualAnchorInterpretation) return null;
    return aiData.analysis.dualAnchorInterpretation;
  } catch (error) {
    console.warn("[V4.2 Generator] AI dual-anchor generation failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// AI Content Generation — triple-anchor archetype interpretation
// ---------------------------------------------------------------------------

async function tryAiTriAnchorGeneration(anchor1Code: string, anchor1Score: number, anchor2Code: string, anchor2Score: number, anchor3Code: string, anchor3Score: number, input: V3ReportInput, language: LangKey): Promise<{ text: string; archetypeName?: string } | null> {
  try {
    const highSensitivityAnchors = Object.entries(input.scores).filter(([, score]) => score >= 65 && score < 80).map(([code]) => code);
    const { data: aiData } = await supabase.functions.invoke("personalized-analysis", {
      body: {
        result: { scores: input.scores, mainAnchor: anchor1Code, coreAdvantageAnchors: [anchor1Code, anchor2Code, anchor3Code], conflictAnchors: highSensitivityAnchors, stability: "developing", triAnchors: { code1: anchor1Code, score1: anchor1Score, code2: anchor2Code, score2: anchor2Score, code3: anchor3Code, score3: anchor3Score } },
        analysisType: "tri_anchor", language, workYears: input.workExperienceYears, isExecutive: input.careerStage === "executive", isEntrepreneur: input.careerStage === "entrepreneur",
        reportVersion: input.reportVersion || null, organizationId: input.organizationId || null,
      },
    });
    if (!aiData?.analysis?.triAnchorInterpretation) return null;
    return { text: aiData.analysis.triAnchorInterpretation, archetypeName: aiData.analysis.archetypeName || undefined };
  } catch (error) {
    console.warn("[V4.2 Generator] AI tri-anchor generation failed:", error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Fill missing anchor explanation/career_advice with fallback
// ---------------------------------------------------------------------------

function fillMissingAnchorContent(sortedScores: [string, number][], allTextBlocks: Record<string, AnchorTextBlocks | null>, language: LangKey): void {
  for (const [anchorCode, anchorScore] of sortedScores) {
    if (!allTextBlocks[anchorCode]) {
      allTextBlocks[anchorCode] = generateAnchorFallbackContent(anchorCode, anchorScore, language);
    } else {
      const blocks = allTextBlocks[anchorCode]!;
      if (!blocks.anchor_explanation) blocks.anchor_explanation = generateAnchorFallbackContent(anchorCode, anchorScore, language).anchor_explanation;
      if (!blocks.career_advice) blocks.career_advice = generateAnchorFallbackContent(anchorCode, anchorScore, language).career_advice;
    }
  }
}

// ---------------------------------------------------------------------------
// Main Generator — V4.2 Enterprise Professional Complete Edition
// ---------------------------------------------------------------------------

export interface V3ReportOptions {
  showWeights?: boolean;
}

export async function generateV3Report(
  input: V3ReportInput,
  language: LangKey,
  onProgress?: (step: "version" | "data" | "ai" | "render") => void,
  options?: V3ReportOptions,
): Promise<V3ReportOutput> {
  const showWeights = options?.showWeights ?? false;
  const labels = getLabels(language);
  const aiFlags: AiGenerationFlag[] = [];
  const sortedScores = sortScoresDescending(input.scores).map(([code, score]) => [code, Math.round(score)] as [string, number]);
  const coreAnchors = sortedScores.filter(([, score]) => score >= 80);

  // Phase 1: Get report version binding (needed for DB queries)
  onProgress?.("version");
  const boundVersionId = await fetchActiveReportVersion(
    "CAREER_ANCHOR",
    input.userId,
    input.organizationId,
  );

  // Phase 2: Fire DB queries AND AI call in parallel
  // AI deep_dive does NOT depend on DB text blocks — it only uses input.scores
  onProgress?.("data");

  // Pre-determine dual/tri anchor needs from scores
  const needsDual = coreAnchors.length === 2;
  const needsTri = coreAnchors.length > 2;
  const [d1Code, d1Score] = needsDual ? coreAnchors[0] : ["", 0];
  const [d2Code, d2Score] = needsDual ? coreAnchors[1] : ["", 0];
  const [t1Code, t1Score] = needsTri ? coreAnchors[0] : ["", 0];
  const [t2Code, t2Score] = needsTri ? coreAnchors[1] : ["", 0];
  const [t3Code, t3Score] = needsTri ? coreAnchors[2] : ["", 0];

  const [allTextBlocks, careerStageDesc, aiRawResult, dualDbResult, triDbResult] = await Promise.all([
    fetchAllAnchorTextBlocks(input.scores, input.careerStage, language, boundVersionId),
    fetchCareerStageDescription(input.careerStage, language),
    fireAiDeepDive(sortedScores, coreAnchors, input, language),
    needsDual ? fetchDualAnchorText(d1Code, d2Code, input.careerStage, language, boundVersionId) : Promise.resolve(null as DualAnchorResult | null),
    needsTri ? fetchTriAnchorText(t1Code, t2Code, t3Code, input.careerStage, language, boundVersionId) : Promise.resolve(null as TriAnchorResult | null),
  ]);

  // Merge AI results into text blocks (post-processing after both complete)
  onProgress?.("ai");
  const aiContent = mergeAiDeepDiveResult(aiRawResult, allTextBlocks, sortedScores[0]?.[0] || "");

  // Fill anchor-level gaps
  fillMissingAnchorContent(sortedScores, allTextBlocks, language);

  onProgress?.("render");

  // Comprehensive development (AI \u2192 fallback) — risk analysis removed
  const comprehensiveDev = aiContent?.developmentPlan || generateComprehensiveDevFallback(sortedScores, language);

  // ========= Cover Page =========
  const reportNumber = generateReportNumber(input.userId);
  const assessmentDate = input.assessmentDate || new Date().toLocaleDateString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN");
  const coverHtml = generateCoverHTML({
    reportType: input.reportType || "career_anchor",
    userName: input.userName,
    workExperienceYears: input.workExperienceYears,
    careerStage: input.careerStage,
    assessmentDate,
    reportVersion: input.reportVersion || "professional",
    reportNumber,
    language,
  });

  // ========= Career Stage Interpretation (no Part number) =========
  let careerStageHtml = "";
  if (careerStageDesc) {
    careerStageHtml = `
      <div class="cpc-section-header">
        <div class="cpc-section-header-title">${labels.careerStageTitle}</div>
      </div>
      <div class="block-card-dark" data-keep-together>
        <h3 style="font-size:22px;font-weight:700;margin-bottom:16px;">${careerStageDesc.title}</h3>
        <div class="cpc-text-block-light">${careerStageDesc.description}</div>
      </div>
    `;
  } else {
    careerStageHtml = `
      <div class="cpc-section-header">
        <div class="cpc-section-header-title">${labels.careerStageTitle}</div>
      </div>
      <div class="cpc-missing-content">${labels.noTemplateText}</div>
    `;
    aiFlags.push({ chapter: 0, chapterTitle: labels.careerStageTitle, reason: "Career stage description not found" });
  }

  // ========= Part 1: Radar Chart =========
  const radarSvg = generateRadarChartSVG(input.scores, language);
  const part1Html = `
    <div data-page-break style="height:0;overflow:hidden;"></div>
    <div class="cpc-part-header">
      <span class="cpc-part-title">${partPrefix(1, labels)}${labels.part1Title}</span>
    </div>
    <div class="cpc-svg-container" data-keep-together><div style="max-width:440px;margin:0 auto;">${radarSvg}</div></div>
  `;

  // ========= Part 2: Positioning Chart (HTML zone layout) =========
  const part2ZoneHtml = generateAnchorFrameworkOverview(sortedScores, language, labels, false, showWeights);
  const part2Html = `
    <div class="cpc-part-header" style="margin-top:20px;">
      <span class="cpc-part-title">${partPrefix(2, labels)}${labels.part2Title}</span>
    </div>
    ${part2ZoneHtml}
  `;

  // ========= Part 3: Full 8-Anchor Detailed Interpretation (V4.2 Enhanced) =========
  let part3Html = `
    <div class="cpc-part-header">
      <span class="cpc-part-title">${partPrefix(3, labels)}${labels.part3Title}</span>
    </div>
  `;

  // (Framework overview moved to Part 2)

  // Render all anchors grouped by zone
  const anchorZoneGroups = [
    { min: 80, max: 100, zoneLabel: labels.coreAdvantage, pageBreakEach: true },
    { min: 65, max: 79, zoneLabel: labels.highSensitivity, pageBreakEach: false },
    { min: 45, max: 64, zoneLabel: labels.moderate, pageBreakEach: false },
    { min: 0, max: 44, zoneLabel: labels.nonCore, pageBreakEach: false },
  ];

  for (const zoneDef of anchorZoneGroups) {
    const anchorsInZone = sortedScores.filter(([, score]) => score >= zoneDef.min && score <= zoneDef.max);
    if (anchorsInZone.length === 0) continue;

    // Individual anchor cards — page-break markers between cards for clean PDF pagination
    for (const [anchorCode, anchorScore] of anchorsInZone) {
      const textBlocks = allTextBlocks[anchorCode];
      const anchorLabel = getV42Label(anchorCode, language);
      const zoneBorderColor = getZoneBorderAlpha(anchorScore);
      const zoneLabelText = getZoneLabel(anchorScore, labels);
      const zoneAnalysis = getZoneAnalysisText(anchorScore, language);
      const roleInfo = getStructuralRoleInfo(anchorScore, language);
      const tensionText = getDevTensionText(anchorScore, language);

      const bannerGradient = getZoneBannerGradient(anchorScore);
      const cleanedCareerAdvice = textBlocks?.career_advice ? stripSectionLabel(textBlocks.career_advice, labels.coreInterpretation) : "";

      // No forced page break before each anchor card — rely on
      // data-keep-together + pixel scanner for natural pagination.

      part3Html += `
        <div style="margin-bottom:24px;">
          <!-- Banner + Strength Bar — compact keep-together unit -->
          <div data-keep-together style="page-break-inside:avoid;break-inside:avoid;">
            <div style="background:${bannerGradient};border-radius:12px 12px 0 0;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:1px;margin-bottom:4px;text-transform:uppercase;">${zoneLabelText}</div>
                <div style="font-size:18px;font-weight:700;color:#fff;">${anchorCode} \u00b7 ${anchorLabel}</div>
              </div>
              <div style="font-size:40px;font-weight:800;color:#fff;font-family:'Montserrat',sans-serif;line-height:1;">${Math.round(anchorScore)}</div>
            </div>
            <div style="background:#f8f9fa;border:1px solid ${zoneBorderColor};border-top:none;padding:20px 20px 0;">
              <div class="cpc-strength-bar-track">
                <div class="cpc-strength-bar-fill ${getZoneSemClass(anchorScore)}" style="width:${Math.round(anchorScore)}%;"></div>
              </div>
            </div>
          </div>
          <!-- Content sections — text line snap handles line-level cuts within these blocks -->
          <div style="background:#f8f9fa;border:1px solid ${zoneBorderColor};border-top:none;border-radius:0 0 12px 12px;padding:0 20px 20px;">

            <!-- Zone Structure Analysis -->
            <div style="margin-bottom:14px;">
              <div class="cpc-section-label">${labels.zoneAnalysis}</div>
              <div class="cpc-text-block">${zoneAnalysis}</div>
            </div>

            <!-- Core Interpretation Framework -->
            ${cleanedCareerAdvice ? `
              <div style="margin-bottom:14px;">
                <div class="cpc-section-label">${labels.coreInterpretation}</div>
                <div class="cpc-text-block">${cleanedCareerAdvice}</div>
              </div>
            ` : ""}

            <!-- Anchor Explanation -->
            ${textBlocks?.anchor_explanation ? `
              <div style="margin-bottom:14px;">
                <div class="cpc-section-label">${labels.anchorExplanation}</div>
                <div class="cpc-text-block">${textBlocks.anchor_explanation}</div>
              </div>
            ` : ""}

            <!-- Risk Warning (from DB) -->
            ${textBlocks?.risk_warning ? `
              <div style="margin-bottom:14px;">
                <div class="cpc-section-label">${labels.riskWarningLabel}</div>
                <div class="cpc-text-block">${textBlocks.risk_warning}</div>
              </div>
            ` : ""}

            <!-- Development Path (from DB) -->
            ${textBlocks?.development_path ? `
              <div style="margin-bottom:14px;">
                <div class="cpc-section-label">${labels.developmentPathLabel}</div>
                <div class="cpc-text-block">${textBlocks.development_path}</div>
              </div>
            ` : ""}

            <!-- Structural Role Meaning -->
            <div data-keep-together style="margin-bottom:14px;page-break-inside:avoid;break-inside:avoid;">
              <div class="cpc-section-label">${labels.structuralRole}</div>
              <div style="display:block;">
                <span style="display:inline-block;vertical-align:middle;">${renderPill(roleInfo.name, getPillColors(anchorScore, "soft").bg, getPillColors(anchorScore, "soft").fg, "md")}</span>
                <div class="cpc-text-block" style="font-size:13px;margin-top:4px;">${roleInfo.description}</div>
              </div>
            </div>

            <!-- Development Tension -->
            <div data-keep-together style="padding:14px 18px;background:#fafafa;border-radius:8px;border:1px dashed #E9ECEF;min-height:64px;page-break-inside:avoid;break-inside:avoid;">
              <div class="cpc-section-label">${labels.devTension}</div>
              <div style="font-size:13px;color:#475569;line-height:1.7;">${tensionText}</div>
            </div>
          </div>
        </div>
      `;

    }
  }

  // ========= Structure Enhancement Module (V4.2 — no Part number) =========
  let structureHtml = `
    <div class="cpc-section-header">
      <div class="cpc-section-header-title">${labels.structureTitle}</div>
    </div>
  `;

  // \u2460 Anchor weight ratio chart (super admin only)
  if (showWeights) {
    structureHtml += `
      <div class="cpc-card-muted" data-keep-together style="page-break-inside:avoid;break-inside:avoid;">
        <div style="font-size:15px;font-weight:700;color:#1C2857;margin-bottom:14px;">${labels.weightRatio}</div>
        ${generateWeightRatioChart(sortedScores, language)}
      </div>
    `;
  }


  // Weight density indicator — removed per product decision
  // (section entirely removed from report for all users)



  // \u2461 Dual-anchor interaction (if \u22652 core or high-sensitivity)


  // Use pre-fetched dualDbResult from Phase 2 parallel batch
  if (needsDual) {
    let dualText: string | null = dualDbResult?.text || null;
    if (!dualText) {
      const aiDualText = await tryAiDualAnchorGeneration(d1Code, d1Score as number, d2Code, d2Score as number, input, language);
      if (aiDualText) dualText = aiDualText;
    }
    // Fallback: generate structural note even when both DB and AI fail
    if (!dualText) {
      const anchor1Label = getV42Label(d1Code, language);
      const anchor2Label = getV42Label(d2Code, language);
      dualText = language === "en"
        ? `Both <strong>${d1Code} (${anchor1Label})</strong> and <strong>${d2Code} (${anchor2Label})</strong> score above 80, forming a dual-core anchor structure. These two drives co-exist and may reinforce or create tension with each other depending on your career context. Consider how to leverage both anchors in complementary ways.`
        : language === "zh-TW"
        ? `<strong>${d1Code}（${anchor1Label}）</strong>與<strong>${d2Code}（${anchor2Label}）</strong>均達80分以上，形成雙核心錨點結構。這兩股職涯驅動力並存於你的自我概念中，可能相互強化，也可能在特定情境下形成內在張力。建議有意識地整合這兩種驅動，使其在工作安排與職涯選擇上相輔相成。`
        : `<strong>${d1Code}（${anchor1Label}）</strong>与<strong>${d2Code}（${anchor2Label}）</strong>均达80分以上，形成双核心锚点结构。这两股职涯驱动力共存于你的自我概念中，可能相互强化，也可能在特定情境下形成内在张力。建议有意识地整合这两种驱动，使其在工作安排与职涯选择中相辅相成。`;
    }
    if (dualText) {
      structureHtml += `
        <div class="block-card-dark" data-keep-together style="margin-top:16px;">
          <div style="font-size:15px;font-weight:700;margin-bottom:14px;">${labels.dualAnchorHint}</div>
          <div class="cpc-dual-hint-row" style="margin-bottom:22px;">
            ${renderPill(d1Code, getPillColors(d1Score as number, "soft").bg, getPillColors(d1Score as number, "soft").fg, "sm")}
            <span style="font-size:16px;color:rgba(255,255,255,0.5);">\u00d7</span>
            ${renderPill(d2Code, getPillColors(d2Score as number, "soft").bg, getPillColors(d2Score as number, "soft").fg, "sm")}
            <span style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1;">${getV42Label(d1Code, language)} × ${getV42Label(d2Code, language)}</span>
          </div>
          <p style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:18px;line-height:1.8;">${labels.dualAnchorIntro}</p>
          <div class="cpc-text-block-light">${dualText}</div>
        </div>
      `;
    }
  }

  // \u2462 Triple-anchor synergy (if \u22653 high-strength)
  if (needsTri) {
    let triText: string | null = triDbResult?.text || null;
    let triArchetypeName: string | null = triDbResult?.archetypeName || null;
    if (!triText) {
      const aiTriResult = await tryAiTriAnchorGeneration(t1Code, t1Score as number, t2Code, t2Score as number, t3Code, t3Score as number, input, language);
      if (aiTriResult) { triText = aiTriResult.text; triArchetypeName = aiTriResult.archetypeName || null; }
    }
    if (triText) {
      structureHtml += `
        <div class="cpc-card-muted" data-keep-together style="border-left:4px solid #7c3aed;margin-top:16px;">
          <div style="font-size:15px;font-weight:700;color:#5b21b6;margin-bottom:10px;">${labels.triAnchorHint}</div>
          <div class="cpc-dual-hint-row" style="margin-bottom:14px;">
            ${renderPill(t1Code, "#7c3aed", "#fff", "sm")}
            <span style="color:#6b7280;">\u00d7</span>
            ${renderPill(t2Code, "#7c3aed", "#fff", "sm")}
            <span style="color:#6b7280;">\u00d7</span>
            ${renderPill(t3Code, "#7c3aed", "#fff", "sm")}
          </div>
          ${triArchetypeName ? `<div style="font-size:16px;font-weight:700;color:#5b21b6;margin-bottom:8px;">${triArchetypeName}</div>` : ""}
          <p style="font-size:13px;color:#374151;margin-bottom:12px;">${labels.triAnchorIntro}</p>
          <div class="cpc-text-block">${triText}</div>
        </div>
      `;
    }
  }

  // Part 4 (Risk Analysis) — entirely removed per product decision
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const riskIntroText = language === "en"
    ? "Based on your anchor score distribution, the following risk analysis has been generated for your core advantage and high-sensitivity anchors:"
    : language === "zh-TW"
      ? "\u6839\u64DA\u4F60\u7684\u9328\u9EDE\u5F97\u5206\u5206\u4F48\uFF0C\u4EE5\u4E0B\u662F\u91DD\u5C0D\u6838\u5FC3\u512A\u52E2\u548C\u9AD8\u654F\u611F\u9328\u9EDE\u7684\u98A8\u96AA\u5206\u6790\uFF1A"
      : "\u6839\u636E\u4F60\u7684\u951A\u70B9\u5F97\u5206\u5206\u5E03\uFF0C\u4EE5\u4E0B\u662F\u9488\u5BF9\u6838\u5FC3\u4F18\u52BF\u548C\u9AD8\u654F\u611F\u951A\u70B9\u7684\u98CE\u9669\u5206\u6790\uFF1A";

  // Part 4 (Risk Analysis) — removed per product decision

  // ========= Part 4: Comprehensive Development Recommendations (renumbered from Part 5) =========
  const devIntroText = language === "en"
    ? "Based on your anchor structure, the following three-layer development strategy is recommended:"
    : language === "zh-TW"
      ? "\u6839\u64DA\u4F60\u7684\u9328\u9EDE\u7D50\u69CB\uFF0C\u4EE5\u4E0B\u662F\u4E09\u5C64\u7D50\u69CB\u7684\u7D9C\u5408\u767C\u5C55\u5EFA\u8B70\uFF1A"
      : "\u6839\u636E\u4F60\u7684\u951A\u70B9\u7ED3\u6784\uFF0C\u4EE5\u4E0B\u662F\u4E09\u5C42\u7ED3\u6784\u7684\u7EFC\u5408\u53D1\u5C55\u5EFA\u8BAE\uFF1A";

  const devSectionsHtml = renderTextAsSplitSections(comprehensiveDev, "cpc-dev-theme");
  const part4Html = `
    <div class="cpc-part-header">
      <span class="cpc-part-title">${partPrefix(4, labels)}${labels.part5Title}</span>
    </div>
    <div style="font-size:13px;color:#374151;margin-bottom:16px;">${devIntroText}</div>
    ${devSectionsHtml}
  `;

  // ========= Part 5: Focus Action Recommendations (renumbered from Part 6) =========
  const primaryAnchor = sortedScores[0]?.[0] || "TF";
  const actionPlan = getActionPlan(primaryAnchor, language);
  const primaryAnchorLabel = getV42Label(primaryAnchor, language);

  let part5Html = `
    <div class="cpc-part-header">
      <span class="cpc-part-title">${partPrefix(5, labels)}${labels.part6Title}</span>
    </div>
    <div style="font-size:13px;color:#374151;margin-bottom:20px;">
      ${language === "en"
        ? `Based on your core advantage anchor <strong>${primaryAnchorLabel}</strong>, the following focus actions are recommended. Each is actionable, verifiable, and measurable.`
        : language === "zh-TW"
          ? `\u57FA\u65BC\u4F60\u7684\u6838\u5FC3\u512A\u52E2\u9328\u9EDE <strong>${primaryAnchorLabel}</strong>\uFF0C\u4EE5\u4E0B\u662F\u7126\u9EDE\u884C\u52D5\u63A8\u85A6\u3002\u6BCF\u689D\u5747\u53EF\u57F7\u884C\u3001\u53EF\u9A57\u8B49\u3001\u53EF\u8861\u91CF\u3002`
          : `\u57FA\u4E8E\u4F60\u7684\u6838\u5FC3\u4F18\u52BF\u951A\u70B9 <strong>${primaryAnchorLabel}</strong>\uFF0C\u4EE5\u4E0B\u662F\u7126\u70B9\u884C\u52A8\u63A8\u8350\u3002\u6BCF\u6761\u5747\u53EF\u6267\u884C\u3001\u53EF\u9A8C\u8BC1\u3001\u53EF\u8861\u91CF\u3002`}
    </div>
  `;

  // Learning directions
  part5Html += `<div style="margin-bottom:24px;"><div style="font-size:15px;font-weight:700;color:#1C2857;margin-bottom:14px;">${labels.actionLearning}</div>`;
  actionPlan.learning.forEach((item) => {
    part5Html += `<div class="cpc-dev-theme" data-keep-together style="margin-bottom:12px;page-break-inside:avoid;break-inside:avoid;"><div style="font-size:14px;font-weight:600;color:#1C2857;margin-bottom:6px;">${item.title}</div><div class="cpc-text-block">${item.description}</div>${item.resources?.length ? `<div style="margin-top:8px;font-size:12px;color:#374151;">${item.resources.join(" \u00b7 ")}</div>` : ""}</div>`;
  });
  part5Html += `</div>`;

  // Career paths removed per user request

  // Verification steps
  part5Html += `<div style="margin-bottom:24px;"><div style="font-size:15px;font-weight:700;color:#1C2857;margin-bottom:14px;">${labels.actionVerification}</div>`;
  actionPlan.verification.forEach((item, verificationIndex) => {
    part5Html += `<div class="cpc-risk-theme" data-keep-together style="margin-bottom:12px;page-break-inside:avoid;break-inside:avoid;"><div style="display:flex;gap:10px;align-items:center;">${renderNumberCircle(verificationIndex + 1)}<div><div style="font-size:13px;font-weight:600;color:#1C2857;margin-bottom:4px;">${item.action}</div><div style="font-size:12px;color:#374151;">${item.purpose}</div></div></div></div>`;
  });
  part5Html += `</div>`;

  // Tradeoffs section removed per user request

  // ========= Closing Reminder Block =========
  const isEn = language === "en";
  const isTWFinal = language === "zh-TW";
  const closingTitle = isEn ? "Important Reminder: Trade-offs Are Inevitable" : isTWFinal ? "\u91CD\u8981\u63D0\u9192\uFF1A\u53D6\u6368\u662F\u5FC5\u7136\u7684" : "\u91CD\u8981\u63D0\u9192\uFF1A\u53D6\u820D\u662F\u5FC5\u7136\u7684";
  const closingOutro = isEn
    ? "This is not a loss, but a focus. Knowing clearly what you are giving up is more powerful than vaguely wanting everything."
    : isTWFinal
      ? "\u9019\u4E0D\u662F\u640D\u5931\uFF0C\u800C\u662F\u805A\u7126\u3002\u660E\u78BA\u77E5\u9053\u81EA\u5DF1\u653E\u68C4\u4EC0\u9EBC\uFF0C\u6BD4\u6A21\u7CCA\u5730\u4EC0\u9EBC\u90FD\u60F3\u8981\u66F4\u6709\u529B\u91CF\u3002"
      : "\u8FD9\u4E0D\u662F\u635F\u5931\uFF0C\u800C\u662F\u805A\u7126\u3002\u660E\u786E\u77E5\u9053\u81EA\u5DF1\u653E\u5F03\u4EC0\u4E48\uFF0C\u6BD4\u6A21\u7CCA\u5730\u4EC0\u4E48\u90FD\u60F3\u8981\u66F4\u6709\u529B\u91CF\u3002";
  const closingReminderHtml = `
    <div data-keep-together style="border-left:4px solid #F4A261;background:#faf8f5;border-radius:0 12px 12px 0;padding:28px 32px;margin:36px 0 24px;page-break-inside:avoid;min-height:100px;">
      <div style="font-size:16px;font-weight:700;color:#1C2857;margin-bottom:16px;">${closingTitle}</div>
      <div style="font-size:14px;font-weight:600;color:#b45309;line-height:1.8;">${closingOutro}</div>
    </div>
  `;

  // ========= Assemble Body HTML =========
  // Use inline <style>+<div> format (same as fusion reports) so that
  // downloadReportWithCover can safely set bodyContainer.innerHTML without
  // the browser stripping <html>/<head>/<body> tags and losing CSS/fonts.
  const bodyHtml = `
${BODY_STYLES}
<div class="cpc-report-root">
  ${careerStageHtml}
  ${part1Html}
  ${part2Html}
  ${part3Html}
  ${part4Html}
  ${part5Html}
  ${closingReminderHtml}

  <footer data-screen-only style="margin-top:32px;padding-top:16px;padding-bottom:24px;border-top:2px solid #E9ECEF;text-align:center;color:#5a6577;font-size:12px;">
    <p style="margin:0;">SCPC &mdash; Strategic Career Planning Consultant</p>
  </footer>
</div>
  `.trim();

  return { coverHtml, bodyHtml, reportNumber, aiGenerationNeeded: aiFlags };
}
