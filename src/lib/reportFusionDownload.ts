/**
 * Unified Fusion Report Download Utility — COMBINED EDITION
 *
 * Generates a combined report with three complete parts:
 *   Part 1: Complete Career Anchor Assessment Report (full V3)
 *   Part 2: Complete Ideal Life Card Assessment Report (full)
 *   Part 3: Integrated Development Analysis (fusion metrics + AI narrative)
 *
 * Both web view and PDF download share the same HTML generator
 * for guaranteed consistency.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  downloadReportWithCover,
  generateIdealCardReportHTML,
  type FusionNarrativeData,
} from "@/lib/exportReport";
import {
  reportProgressStart,
  reportProgressUpdate,
  reportProgressEnd,
  getStepLabel,
} from "@/lib/reportProgressStore";
import { generateFusionChartsHTML } from "@/lib/fusionChartGenerator";
import {
  generateV3Report,
  type V3ReportInput,
} from "@/lib/reportV3Generator";
import {
  computeFusionMetrics,
  getStructureTypeLabel,
  type FusionInputData,
  type CareerStageInput,
  type AnchorCode,
  type FusionComputedMetrics,
  type SpectrumDistribution,
} from "@/lib/fusionEngineV3";
import { IDEAL_CARDS, getCardLabel, type CardCategory } from "@/data/idealCards";
import { standardizeScores } from "@/data/questions";
import { CPC_REPORT_CSS } from "@/lib/reportDesignSystem";
import type { Language } from "@/hooks/useLanguage";
import type { LangKey } from "@/lib/reportDataFetcher";
import { getLocalDateString } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StoredRankedCard {
  rank: number;
  cardId: number;
  category: CardCategory;
  label?: string;
  labelEn?: string;
}

interface QuadrantContent {
  external: string;
  internal: string;
  career: string;
  relationship: string;
}

export interface CombinedFusionData {
  anchorScores: Record<string, number>;
  careerStage: string;
  rankedCards: StoredRankedCard[];
  quadrantContents?: Record<number, QuadrantContent>;
  spectrumTypes?: Record<number, "career" | "neutral" | "lifestyle">;
  aiDescriptions?: Record<number, string>;
  userId: string;
  userName: string;
  workExperienceYears: number | null;
  language: Language;
  assessmentDate?: string;
}

export interface CombinedFusionResult {
  /** Full HTML document string (with <html>, <head>, <body>) */
  fullHtml: string;
  /** Report number from V3 generator */
  reportNumber: string;
}

// ---------------------------------------------------------------------------
// V3-specific CSS classes (normally embedded in reportV3Generator's BODY_STYLES)
// These are needed for the combined document.
// ---------------------------------------------------------------------------

const V3_LOCAL_CSS = `
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
  .cpc-chart2-dot:hover .cpc-chart2-label {
    opacity: 1 !important;
  }
`;

/** Combined CSS for the full fusion report (CPC design system + V3 local) */
export const COMBINED_FUSION_CSS = `${CPC_REPORT_CSS}\n${V3_LOCAL_CSS}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts the inner report content from a full HTML document.
 * Strips <!DOCTYPE>, <html>, <head>, <body>, <div class="cpc-report-root">,
 * and <footer> — returning only the content between the root wrapper and footer.
 */
function extractReportContent(html: string): string {
  const rootTag = '<div class="cpc-report-root">';
  const rootIdx = html.indexOf(rootTag);
  if (rootIdx === -1) return "";

  const contentStart = rootIdx + rootTag.length;

  // Exclude the footer and closing tags
  const footerIdx = html.lastIndexOf("<footer");
  const endIdx = footerIdx !== -1 ? footerIdx : html.lastIndexOf("</div>");

  return html.substring(contentStart, endIdx).trim();
}

/**
 * Generates a prominent chapter divider banner for the combined report.
 * Uses "第X章 / Chapter X" to clearly separate three major report sections.
 */
function chapterBanner(chapterNumber: number, title: string, subtitle: string, language: Language, skipPageBreak = false): string {
  const isEn = language === "en";
  const cnOrdinals = ["\u4e00", "\u4e8c", "\u4e09"];
  const chapterLabel = isEn
    ? `CHAPTER ${chapterNumber}`
    : `\u7b2c${cnOrdinals[chapterNumber - 1] || chapterNumber}\u7ae0`;

  const pageBreak = skipPageBreak ? "" : '<div data-page-break style="height:0;overflow:hidden;"></div>';

  return `
    ${pageBreak}
    <div style="margin:${skipPageBreak ? '0' : '48px'} 0 32px;padding:44px 36px 40px;background:linear-gradient(145deg, #111d45 0%, #1C2857 30%, #243470 60%, #1a2d5e 100%);border-radius:16px;text-align:center;page-break-inside:avoid;break-inside:avoid;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(28,40,87,0.35),0 2px 8px rgba(0,0,0,0.18),inset 0 1px 0 rgba(255,255,255,0.08);">
      <!-- Gold spectrum bar -->
      <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,transparent 0%,#c4960f 15%,#D4A017 30%,#E8B731 50%,#D4A017 70%,#c4960f 85%,transparent 100%);"></div>
      <!-- Subtle light reflection -->
      <div style="position:absolute;top:4px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 10%,rgba(255,255,255,0.12) 40%,rgba(255,255,255,0.18) 50%,rgba(255,255,255,0.12) 60%,transparent 90%);"></div>
      <!-- Bottom edge glow -->
      <div style="position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 20%,rgba(212,160,23,0.2) 50%,transparent 80%);"></div>
      <!-- Left accent line -->
      <div style="position:absolute;top:20px;bottom:20px;left:0;width:3px;background:linear-gradient(180deg,transparent 0%,rgba(212,160,23,0.4) 30%,rgba(212,160,23,0.6) 50%,rgba(212,160,23,0.4) 70%,transparent 100%);border-radius:0 2px 2px 0;"></div>
      <div style="font-size:13px;letter-spacing:8px;color:rgba(255,255,255,0.45);text-transform:uppercase;margin-bottom:14px;font-weight:600;">${chapterLabel}</div>
      <div style="font-size:26px;font-weight:800;color:#fff;line-height:1.4;margin-bottom:10px;text-shadow:0 2px 4px rgba(0,0,0,0.2);">${title}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;letter-spacing:0.5px;">${subtitle}</div>
    </div>
  `;
}

function mapCareerStage(stage: string): CareerStageInput {
  const stageMap: Record<string, CareerStageInput> = {
    entry: "early", early: "early", mid: "mid", senior: "senior", executive: "senior",
  };
  return stageMap[stage] || "mid";
}

/**
 * Compute spectrum distribution (career / neutral / lifestyle ratios)
 * from the ranked cards and the per-card spectrum classification from DB.
 */
function computeSpectrumFromCards(
  rankedCards: Array<{ cardId: number }>,
  spectrumTypes?: Record<number, "career" | "neutral" | "lifestyle">,
): SpectrumDistribution | undefined {
  if (!spectrumTypes || Object.keys(spectrumTypes).length === 0) return undefined;

  let careerCount = 0;
  let neutralCount = 0;
  let lifestyleCount = 0;
  let matchedCount = 0;

  for (const card of rankedCards) {
    const specType = spectrumTypes[card.cardId];
    if (!specType) continue;
    matchedCount++;
    if (specType === "career") careerCount++;
    else if (specType === "lifestyle") lifestyleCount++;
    else neutralCount++;
  }

  if (matchedCount === 0) return undefined;

  return {
    career_ratio: careerCount / matchedCount,
    neutral_ratio: neutralCount / matchedCount,
    lifestyle_ratio: lifestyleCount / matchedCount,
  };
}

// ---------------------------------------------------------------------------
// Try AI narrative generation (best-effort)
// ---------------------------------------------------------------------------

async function tryGenerateNarrative(
  metrics: FusionComputedMetrics,
  anchorScores: Record<string, number>,
  careerStage: CareerStageInput,
  language: Language,
): Promise<FusionNarrativeData | undefined> {
  try {
    const payload = {
      computed_metrics: {
        alignment_score: metrics.alignmentScore,
        alignment_level: metrics.alignmentLevel,
        tension_index: metrics.tensionIndex,
        tension_level: metrics.tensionLevel,
        concentration: metrics.concentration,
        balance: metrics.balance,
        concentration_level: metrics.concentrationLevel,
        maturity_level: metrics.maturityLevel,
        maturity_label: metrics.maturityLabel,
        structure_type: metrics.structureType,
        structure_tags: metrics.structureTags,
        structure_summary: metrics.structureSummary,
        cross_tension: metrics.crossTension,
        anchor_direction_vector: metrics.anchorDirectionVector,
        position_x: metrics.positionX,
        position_y: metrics.positionY,
        value_dim_weights: metrics.valueDimWeights,
        support_strengths: metrics.supportStrengths,
        top3_values: metrics.top3Values,
        under_supported: metrics.underSupported,
        not_represented: metrics.notRepresented,
        tension_penalties: metrics.tensionPenalties,
      },
      raw_data: {
        top10_cards: metrics.cardDimensionMap.map((card) => ({
          rank: card.rank,
          card_name: card.cardName,
          card_name_en: card.cardNameEn,
          dimension: card.dimension,
          dimension_label: card.dimensionLabel,
        })),
        anchor_scores: anchorScores,
        career_stage: careerStage,
      },
      language,
    };

    const { data, error } = await supabase.functions.invoke("fusion-analysis", { body: payload });
    if (error || !data?.narrative) return undefined;
    return data.narrative as FusionNarrativeData;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Generate quantitative overview HTML for Part 3
// ---------------------------------------------------------------------------

function generateQuantitativeOverviewHTML(
  metrics: FusionV3Metrics,
  language: Language,
): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;

  const DEEP_BLUE = "#1C2857";
  const GREEN_ACCENT = "#B5D260";
  const GREEN_DARK = "#6B8A1A";

  // ── Level description for structure tag ──
  const structLabel = getStructureTypeLabel(metrics.structureType, language);
  const structDescMap: Record<string, Record<Language, string>> = {
    "结构一致": { "zh-CN": "职业驱动与生活价值呈现高度一致的整合状态。", "zh-TW": "職業驅動與生活價值呈現高度一致的整合狀態。", en: "Career drivers and life values show a highly integrated alignment." },
    "双重中心": { "zh-CN": "同时拥有两个重要的发展关注中心，形成独特的双线发展结构。", "zh-TW": "同時擁有兩個重要的發展關注中心，形成獨特的雙線發展結構。", en: "Two important development centers form a unique dual-track structure." },
    "阶段探索": { "zh-CN": "当前阶段正在探索不同发展方向的可能性空间。", "zh-TW": "當前階段正在探索不同發展方向的可能性空間。", en: "Currently exploring possible directions across different development paths." },
    "发展张力": { "zh-CN": "当前阶段在不同发展关注之间呈现一定整合动力。", "zh-TW": "當前階段在不同發展關注之間呈現一定整合動力。", en: "Different development focuses are generating integrative momentum at this stage." },
    "均衡成长": { "zh-CN": "多个发展维度呈现均衡发展的成长状态。", "zh-TW": "多個發展維度呈現均衡發展的成長狀態。", en: "Multiple dimensions are developing in a balanced growth pattern." },
    "重点定位": { "zh-CN": "有明确的核心发展重心，形成清晰的主轴方向。", "zh-TW": "有明確的核心發展重心，形成清晰的主軸方向。", en: "A clear core development center has formed, creating a distinct primary axis." },
  };
  const structDesc = structDescMap[metrics.structureType]?.[language] || "";

  // ── Positioning values for 2D chart ──
  const posX = metrics.positionX ?? 50;
  const posY = metrics.positionY ?? 50;
  const dotLeft = `${Math.round(posX * 0.82 + 9)}%`;
  const dotBottom = `${Math.round(posY * 0.82 + 9)}%`;

  return `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${t("Integration Structure Overview", "整合結構總覽", "整合结构总览")}</span>
    </div>

    <!-- ====== Quantitative Dashboard ====== -->
    <div data-keep-together style="display:flex;flex-wrap:wrap;gap:14px;margin:16px 0 28px;page-break-inside:avoid;">
      <!-- Alignment -->
      <div style="flex:1;min-width:140px;background:#fff;border-radius:14px;padding:20px 18px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f0f0ed;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">${t("Alignment", "一致度", "一致度")}</div>
        <div style="font-size:32px;font-weight:800;background:linear-gradient(135deg,#D4A017,#E8B731);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-family:'Montserrat',sans-serif;line-height:1;">${metrics.alignmentScore}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">/ 100</div>
      </div>
      <!-- Tension -->
      <div style="flex:1;min-width:140px;background:#fff;border-radius:14px;padding:20px 18px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f0f0ed;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">${t("Tension", "張力", "张力")}</div>
        <div style="font-size:32px;font-weight:800;color:#D97706;font-family:'Montserrat',sans-serif;line-height:1;">${metrics.tensionIndex}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">/ 100</div>
      </div>
      <!-- Balance -->
      <div style="flex:1;min-width:140px;background:#fff;border-radius:14px;padding:20px 18px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f0f0ed;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">${t("Balance", "平衡度", "平衡度")}</div>
        <div style="font-size:32px;font-weight:800;color:#2563eb;font-family:'Montserrat',sans-serif;line-height:1;">${metrics.balance}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">/ 100</div>
      </div>
      <!-- Structure Tag -->
      <div style="flex:1;min-width:140px;background:#fff;border-radius:14px;padding:20px 18px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f0f0ed;">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">${t("Structure", "結構標籤", "结构标签")}</div>
        <div style="display:inline-block;text-align:center;padding:6px 16px;background:${GREEN_DARK}12;border-radius:100px;margin-top:2px;">
          <span style="font-size:15px;font-weight:700;color:${GREEN_DARK};letter-spacing:0.5px;">${structLabel}</span>
        </div>
      </div>
    </div>

    <!-- ====== 2D Development Structure Chart + Tag Card ====== -->
    <div data-keep-together style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:32px;page-break-inside:avoid;">
      <!-- Left: 2D Positioning Chart -->
      <div style="flex:2;min-width:300px;background:#fff;border-radius:14px;padding:28px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f0f0ed;">
        <div style="position:relative;width:100%;max-width:380px;margin:0 auto;">
          <div style="position:relative;width:100%;padding-bottom:100%;background:linear-gradient(180deg,${DEEP_BLUE}06 0%,${GREEN_ACCENT}06 100%);border-radius:12px;">
            <!-- Grid lines -->
            <div style="position:absolute;left:50%;top:8%;bottom:8%;width:1px;background:linear-gradient(180deg,${DEEP_BLUE}25,${DEEP_BLUE}08);transform:translateX(-50%);"></div>
            <div style="position:absolute;top:50%;left:8%;right:8%;height:1px;background:linear-gradient(90deg,${DEEP_BLUE}08,${DEEP_BLUE}25,${GREEN_DARK}08);transform:translateY(-50%);"></div>
            <!-- Axis labels -->
            <div style="position:absolute;top:3%;left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;color:${DEEP_BLUE};letter-spacing:0.5px;white-space:nowrap;">
              ${t("Strong Drive", "推進動力較強", "推进动力较强")}
            </div>
            <div style="position:absolute;bottom:3%;left:50%;transform:translateX(-50%);font-size:10px;font-weight:500;color:#94a3b8;letter-spacing:0.5px;white-space:nowrap;">
              ${t("Gentle Rhythm", "節奏較柔性", "节奏较柔性")}
            </div>
            <div style="position:absolute;left:3%;top:50%;transform:translateY(-50%) rotate(-90deg);font-size:10px;font-weight:600;color:${DEEP_BLUE};letter-spacing:0.5px;white-space:nowrap;">
              ${t("Career Focus", "職業發展關注", "职业发展关注")}
            </div>
            <div style="position:absolute;right:3%;top:50%;transform:translateY(-50%) rotate(90deg);font-size:10px;font-weight:500;color:${GREEN_DARK};letter-spacing:0.5px;white-space:nowrap;">
              ${t("Life Focus", "生活體驗關注", "生活体验关注")}
            </div>
            <!-- Center region -->
            <div style="position:absolute;top:35%;left:35%;width:30%;height:30%;border-radius:50%;background:radial-gradient(circle,${DEEP_BLUE}08,transparent);border:1px dashed ${DEEP_BLUE}15;"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:${DEEP_BLUE}50;font-weight:500;">
              ${t("Integration", "整合區", "整合区")}
            </div>
            <!-- User position orb -->
            <div style="position:absolute;left:${dotLeft};bottom:${dotBottom};transform:translate(-50%,50%);z-index:5;">
              <div style="width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${GREEN_ACCENT},${DEEP_BLUE});box-shadow:0 0 0 6px ${DEEP_BLUE}15,0 0 20px ${GREEN_ACCENT}40;border:2px solid #fff;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Structure Tag Card -->
      <div style="flex:1;min-width:200px;display:flex;flex-direction:column;justify-content:center;">
        <div style="background:#fff;border-radius:14px;padding:28px 24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);border:1px solid #f0f0ed;">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:14px;">
            ${t("Development Structure", "發展結構定位", "发展结构定位")}
          </div>
          <div style="display:inline-block;text-align:center;padding:8px 20px;background:${GREEN_DARK}10;border-radius:100px;margin-bottom:16px;">
            <span style="font-size:16px;font-weight:700;color:${GREEN_DARK};letter-spacing:0.5px;">${structLabel}</span>
          </div>
          <p style="font-size:13px;color:#64748b;line-height:1.8;margin:0;">${structDesc}</p>
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Core: Generate combined fusion report HTML
// ---------------------------------------------------------------------------

export async function generateCombinedFusionHTML(
  data: CombinedFusionData,
): Promise<CombinedFusionResult | null> {
  const { language, userId, userName, careerStage, workExperienceYears, anchorScores, rankedCards } = data;
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;
  const mappedStage = mapCareerStage(careerStage);

  if (Object.keys(anchorScores).length === 0 || rankedCards.length === 0) {
    console.error("[CombinedFusion] Missing career anchor or ideal card data");
    return null;
  }

  // ── Step 1: Generate V3 Career Anchor Report HTML ──────────────────────
  const v3Input: V3ReportInput = {
    scores: anchorScores,
    careerStage,
    userName,
    workExperienceYears,
    userId,
    reportVersion: "professional",
    reportType: "career_anchor",
  };

  const v3Output = await generateV3Report(v3Input, language as LangKey);
  const careerAnchorContent = extractReportContent(v3Output.bodyHtml);

  // ── Step 2: Generate Ideal Card Report HTML ────────────────────────────
  const idealCardHtml = generateIdealCardReportHTML(
    {
      rankedCards: rankedCards.map((card) => ({
        rank: card.rank,
        cardId: card.cardId,
        category: card.category,
      })),
      userName: userName || undefined,
      createdAt: data.assessmentDate || new Date().toLocaleString(
        isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN",
      ),
      quadrantContents: data.quadrantContents,
      spectrumTypes: data.spectrumTypes,
      aiDescriptions: data.aiDescriptions,
    },
    language,
  );
  let idealCardContent = extractReportContent(idealCardHtml);
  // Strip the standalone ideal card report header (title + name + date)
  // since the combined report has its own chapter banners
  idealCardContent = idealCardContent.replace(/<header[^>]*>[\s\S]*?<\/header>/, "").trim();

  // ── Step 3: Compute Fusion Metrics ─────────────────────────────────────
  const enrichedCards = rankedCards.map((card) => {
    const cardDef = IDEAL_CARDS.find((c) => c.id === card.cardId);
    return {
      rank: card.rank,
      cardId: card.cardId,
      cardName: card.label || cardDef?.label || "",
      cardNameEn: card.labelEn || cardDef?.labelEn || "",
      category: card.category,
    };
  });

  // ── Compute spectrum distribution from spectrumTypes map ──────────
  const spectrumDistribution = computeSpectrumFromCards(enrichedCards, data.spectrumTypes);

  const fusionInput: FusionInputData = {
    lifeCardsTop10: enrichedCards,
    anchorScores: anchorScores as Record<AnchorCode, number>,
    careerStage: mappedStage,
    spectrumDistribution,
  };

  const computed = computeFusionMetrics(fusionInput, language);

  // ── Step 4: AI Narrative (best-effort) ─────────────────────────────────
  const narrative = await tryGenerateNarrative(computed, anchorScores, mappedStage, language);

  // ── Step 5: Generate Fusion Charts HTML (dual-chart visual understanding) ──
  const fusionChartsHtml = generateFusionChartsHTML(anchorScores, rankedCards, language, narrative ?? undefined);

  // ── Step 6: Assemble Combined Document ─────────────────────────────────
  const chapter1Banner = chapterBanner(
    1,
    t("Career Anchor Assessment Report", "\u8077\u696d\u9328\u6e2c\u8a55\u5831\u544a", "\u804c\u4e1a\u951a\u6d4b\u8bc4\u62a5\u544a"),
    t("Identify your core career drivers and motivational patterns", "\u8b58\u5225\u60a8\u7684\u6838\u5fc3\u8077\u696d\u9a45\u52d5\u529b\u8207\u52d5\u6a5f\u6a21\u5f0f", "\u8bc6\u522b\u60a8\u7684\u6838\u5fc3\u804c\u4e1a\u9a71\u52a8\u529b\u4e0e\u52a8\u673a\u6a21\u5f0f"),
    language,
    true,
  );

  const chapter2Banner = chapterBanner(
    2,
    t("Espresso Card Assessment Report", "\u7406\u60f3\u4eba\u751f\u5361\u6e2c\u8a55\u5831\u544a", "\u7406\u60f3\u4eba\u751f\u5361\u6d4b\u8bc4\u62a5\u544a"),
    t("Explore your life values and ideal lifestyle priorities", "\u63a2\u7d22\u60a8\u7684\u4eba\u751f\u50f9\u503c\u89c0\u8207\u7406\u60f3\u751f\u6d3b\u512a\u5148\u9806\u5e8f", "\u63a2\u7d22\u60a8\u7684\u4eba\u751f\u4ef7\u503c\u89c2\u4e0e\u7406\u60f3\u751f\u6d3b\u4f18\u5148\u987a\u5e8f"),
    language,
  );

  const chapter3Banner = chapterBanner(
    3,
    t("Integrated Analysis Report", "\u6574\u5408\u5206\u6790\u5831\u544a", "\u6574\u5408\u5206\u6790\u62a5\u544a"),
    t("Integrated analysis of career anchors and life values alignment", "\u8077\u696d\u9328\u8207\u4eba\u751f\u50f9\u503c\u7684\u6574\u5408\u767c\u5c55\u5206\u6790", "\u804c\u4e1a\u951a\u4e0e\u4eba\u751f\u4ef7\u503c\u7684\u6574\u5408\u53d1\u5c55\u5206\u6790"),
    language,
  );

  // Use inline <style>+<div> format (same as V3 reports) so that
  // downloadReportWithCover can safely set bodyContainer.innerHTML without
  // the browser stripping <html>/<head>/<body> tags and losing CSS/fonts.
  const fullHtml = `
<style>
  ${COMBINED_FUSION_CSS}
</style>
<div class="cpc-report-root">

  ${chapter1Banner}
  ${careerAnchorContent}

  ${chapter2Banner}
  ${idealCardContent}

  ${chapter3Banner}
  ${fusionChartsHtml}

  <footer data-screen-only style="margin-top:48px;padding-top:20px;padding-bottom:20px;border-top:2px solid #E9ECEF;text-align:center;color:#94a3b8;font-size:11px;">
    <p>SCPC &mdash; Strategic Career Planning Consultant</p>
  </footer>
</div>
  `.trim();

  return { fullHtml, reportNumber: v3Output.reportNumber };
}

// ---------------------------------------------------------------------------
// Fetch ideal card generator data from DB (spectrum + quadrant contents)
// ---------------------------------------------------------------------------

export async function fetchIdealCardGeneratorData(
  rankedCards: StoredRankedCard[],
  language: Language,
): Promise<{
  quadrantMap: Record<number, QuadrantContent>;
  spectrumMap: Record<number, "career" | "neutral" | "lifestyle">;
}> {
  const cardIds = rankedCards.map((card) => card.cardId);
  const quadrantMap: Record<number, QuadrantContent> = {};
  const spectrumMap: Record<number, "career" | "neutral" | "lifestyle"> = {};

  const { data: lifeCards } = await supabase
    .from("life_cards")
    .select("id, sort_order, spectrum_type")
    .in("sort_order", cardIds);

  if (!lifeCards || lifeCards.length === 0) return { quadrantMap, spectrumMap };

  const sortOrderToUuid: Record<number, string> = {};
  for (const lifeCard of lifeCards) {
    const sortOrder = lifeCard.sort_order as number;
    sortOrderToUuid[sortOrder] = lifeCard.id as string;
    if (lifeCard.spectrum_type) {
      spectrumMap[sortOrder] = lifeCard.spectrum_type as "career" | "neutral" | "lifestyle";
    }
  }

  const uuids = Object.values(sortOrderToUuid);
  if (uuids.length === 0) return { quadrantMap, spectrumMap };

  const { data: quadrants } = await supabase
    .from("life_card_quadrant_contents")
    .select("card_id, quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship, is_locked")
    .in("card_id", uuids)
    .eq("language", language);

  if (quadrants && quadrants.length > 0) {
    const uuidToSort: Record<string, number> = {};
    for (const [sortStr, uuid] of Object.entries(sortOrderToUuid)) {
      uuidToSort[uuid] = Number(sortStr);
    }
    for (const quadrant of quadrants) {
      const sortOrder = uuidToSort[quadrant.card_id as string];
      if (sortOrder === undefined) continue;
      const hasContent = quadrant.quadrant_external || quadrant.quadrant_internal || quadrant.quadrant_career || quadrant.quadrant_relationship;
      if (!hasContent) continue;
      quadrantMap[sortOrder] = {
        external: (quadrant.quadrant_external as string) || "",
        internal: (quadrant.quadrant_internal as string) || "",
        career: (quadrant.quadrant_career as string) || "",
        relationship: (quadrant.quadrant_relationship as string) || "",
      };
    }
  }

  return { quadrantMap, spectrumMap };
}

// ---------------------------------------------------------------------------
// Generate AI card descriptions (best-effort, non-blocking)
// ---------------------------------------------------------------------------

export async function fetchAiCardDescriptions(
  rankedCards: StoredRankedCard[],
  quadrantMap: Record<number, QuadrantContent>,
  language: Language,
): Promise<Record<number, string>> {
  if (Object.keys(quadrantMap).length === 0) return {};

  const cardsForAI = rankedCards.map((card) => ({
    rank: card.rank,
    card_name: card.label,
    category: card.category,
    quadrant: quadrantMap[card.cardId],
  }));

  const { data, error } = await supabase.functions.invoke("ideal-card-analysis", {
    body: { mode: "card_descriptions", cards: cardsForAI, language },
  });

  if (error || !data?.descriptions) return {};

  const descriptions: Record<number, string> = {};
  for (const desc of data.descriptions as { rank: number; description: string }[]) {
    const matched = rankedCards.find((card) => card.rank === desc.rank);
    if (matched) descriptions[matched.cardId] = desc.description;
  }
  return descriptions;
}

// ---------------------------------------------------------------------------
// Primary download function — fetches latest data → generates combined PDF
// ---------------------------------------------------------------------------

export async function downloadLatestFusionReport(
  userId: string,
  userName: string,
  careerStage: string,
  workExperienceYears: number | null,
  language: Language,
): Promise<boolean> {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  reportProgressStart(getStepLabel("generating", language));

  // Step 1: Fetch latest career anchor scores from DB
  const { data: latestAnchor } = await supabase
    .from("assessment_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Step 2: Fetch latest ideal card results from DB
  const { data: latestCards } = await supabase
    .from("ideal_card_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Step 3: Resolve data (DB first, sessionStorage fallback)
  let anchorScores: Record<string, number> = {};
  let rankedCards: StoredRankedCard[] = [];

  if (latestAnchor) {
    anchorScores = standardizeScores({
      TF: Number(latestAnchor.score_tf) || 0,
      GM: Number(latestAnchor.score_gm) || 0,
      AU: Number(latestAnchor.score_au) || 0,
      SE: Number(latestAnchor.score_se) || 0,
      EC: Number(latestAnchor.score_ec) || 0,
      SV: Number(latestAnchor.score_sv) || 0,
      CH: Number(latestAnchor.score_ch) || 0,
      LS: Number(latestAnchor.score_ls) || 0,
    });
  } else {
    const storedCa = sessionStorage.getItem("assessmentResults");
    if (storedCa) anchorScores = JSON.parse(storedCa).scores || {};
  }

  if (latestCards?.ranked_cards) {
    rankedCards = latestCards.ranked_cards as StoredRankedCard[];
  } else {
    const storedIc = sessionStorage.getItem("idealCardResults");
    if (storedIc) rankedCards = JSON.parse(storedIc) as StoredRankedCard[];
  }

  if (Object.keys(anchorScores).length === 0 || rankedCards.length === 0) {
    console.error("[FusionDownload] Missing career anchor or ideal card data");
    reportProgressEnd();
    return false;
  }
  reportProgressUpdate(10, getStepLabel("generating", language));

  // Step 4: Fetch ideal card generator data (quadrant + spectrum)
  const { quadrantMap, spectrumMap } = await fetchIdealCardGeneratorData(rankedCards, language);

  // Step 5: AI card descriptions (best-effort)
  const aiDescriptions = await fetchAiCardDescriptions(rankedCards, quadrantMap, language);

  reportProgressUpdate(20, getStepLabel("generating", language));
  // Step 6: Generate combined HTML
  const assessmentDate = latestAnchor?.created_at
    ? new Date(latestAnchor.created_at).toLocaleDateString(isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN")
    : undefined;

  const result = await generateCombinedFusionHTML({
    anchorScores,
    careerStage,
    rankedCards,
    quadrantContents: quadrantMap,
    spectrumTypes: spectrumMap,
    aiDescriptions,
    userId,
    userName,
    workExperienceYears,
    language,
    assessmentDate,
  });

  if (!result) {
    reportProgressEnd();
    return false;
  }

  // Step 7: Download with professional cover page
  // Progress note: downloadReportWithCover takes over from 30%
  await downloadReportWithCover(
    result.fullHtml,
    {
      reportType: "fusion",
      userName: userName || (isEn ? "User" : "\u7528\u6236"),
      workExperienceYears,
      careerStage: careerStage || "mid",
      reportVersion: "professional",
      language,
      userId,
      reportNumber: result.reportNumber,
      assessmentDate,
    },
    `SCPC-Fusion-Report-${result.reportNumber}-${getLocalDateString(language)}.pdf`,
    false,
    30,
  );

  return true;
}
