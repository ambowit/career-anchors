/* ============================================================
 * REPORT HTML BADGE/CAPSULE IRON RULES (胶囊样式铁律) v4.0
 * ------------------------------------------------------------
 * 1. 文字与背景必须是一体的，禁止使用内部 wrapper 元素分割
 *    背景色。不得在内部 span 上添加任何 background/border。
 * 2. html2canvas 居中技术测试结果：
 *    ✗ display:flex + align-items:center  → 无效
 *    ✗ display:inline-flex               → 无效
 *    ✗ display:inline-table + table-cell  → 自动宽度计算失败，内容被裁切
 *    ✗ padding + line-height:1            → 基线偏移
 *    ✓ line-height = height               → 可靠居中
 * 3. 所有单行垂直居中必须使用 line-height = height 方案：
 *    圆圈: display:inline-block;width:Npx;height:Npx;line-height:Npx;text-align:center
 *    胶囊: display:inline-block;height:Npx;line-height:Npx;padding:0 Xpx;text-align:center
 *    进度条段: width:N%;line-height:Npx;text-align:center
 * 4. 禁止在 inline style 中使用 display:table / table-cell / inline-table。
 * ============================================================ */

/* ============================================================
 * 智能分页铁律 (PDF PAGINATION IRON RULES)
 * ============================================================
 *
 * 一、data-keep-together 不可分割区域
 *   任何被 <div data-keep-together> 包裹的 DOM 区域，分页切
 *   点不得落在其内部。算法在选定候选切点后，必须检查该点
 *   是否位于某个 keep-together 区域内；如果是：
 *     a) 优先将切点上移至该区域顶部之前；
 *     b) 若上移后页面填充率 < 35%，则下移至区域底部之后；
 *     c) 若上下都不满足（区域比一页还高），才允许内部切割。
 *
 *   必须标记 data-keep-together 的组件：
 *     - 雷达图 SVG 容器
 *     - 四区定位图（框架概览表）
 *     - 每张维度卡片的 Banner + 进度条组合
 *     - 权重比图表
 *     - 双锚 / 三锚互动卡片
 *     - 结尾提醒块
 *     - 深色职涯阶段解读块
 *     - 光谱条 + 图例组合
 *     - 取向条 + 图例组合
 *     - 每个 section-label + text-block 内容区域
 *     - renderTextAsSplitSections 输出的每个块
 *
 * 二、自然排版，无强制分页
 *   V3 报告正文不使用 data-page-break 强制切点。内容自然
 *   排列，由像素扫描 + keep-together 保护自动决定分页位置。
 *   避免章节间产生大面积空白页。
 *
 * 三、像素扫描作为最终校准
 *   findSafeCutRow 只做"微调"——在候选切点 ±12% 页高范围
 *   内寻找真正的行间空白。搜索范围不宜过大，避免从安全位
 *   置漂移到视觉组件内部。
 *
 * 四、最小间隙标准
 *   MIN_GAP ≥ 8 行（canvas 2× 缩放下约 16-24px 物理像素），
 *   确保仅匹配真正的行间/节间空白，不匹配字符内笔画间隙。
 *
 * ============================================================ */
import { DIMENSIONS, getCoreAdvantageAnchors } from "@/hooks/useAssessment";
import type { StoredAssessmentResult, StoredAnswer } from "@/hooks/useAssessmentResults";
import type { Language } from "@/hooks/useLanguage";
import { standardizeScores, DIMENSION_NAMES } from "@/data/questions";
import { getActionPlan } from "@/data/actionPlans";
import { getStageInterpretation, type CareerStage } from "@/data/stageInterpretations";
import {
  generateCoverHTML,
  generatePageHeaderFooter,
  generateReportNumber,
  type ReportCoverType,
} from "@/lib/reportNumberGenerator";
import { getStructureTypeLabel } from "@/lib/fusionEngineV3";
import { generateFusionChartsHTML } from "@/lib/fusionChartGenerator";
import {
  IDEAL_CARDS,
  CATEGORY_CONFIG,
  getCardLabel,
  getCategoryLabel,
  type CardCategory,
} from "@/data/idealCards";
import { CPC_REPORT_CSS, getZoneSemClass, getZoneSemSoftClass } from "@/lib/reportDesignSystem";
import { getLocalDateString } from "@/lib/utils";
import { MISSING_DIMENSION_TEXTS, REFLECTION_HEADER } from "@/data/missingDimensionTexts";
import {
  reportProgressStart,
  reportProgressUpdate,
  reportProgressEnd,
  getStepLabel,
} from "@/lib/reportProgressStore";
import { useLanguage } from "@/hooks/useLanguage";

/**
 * Smart line-gap finder for PDF pagination.
 *
 * Scans canvas rows upward from `targetRow` to find a REAL gap between text
 * lines — defined as multiple consecutive "quiet" rows (rows with very few
 * brightness transitions). A single quiet row could be a coincidence (e.g.
 * inside a character stroke), but 4+ consecutive quiet rows reliably indicate
 * the whitespace between printed lines.
 *
 * Returns the middle of the gap so the cut has equal whitespace margins above
 * and below.
 */
function findSafeCutRow(
  rowData: PrecomputedRowData,
  targetRow: number,
  maxSearchUp: number,
  maxRow?: number
): number {
  if (maxSearchUp <= 0) return targetRow;

  // ── Search window: 12% page height UP  +  8% page height DOWN ──
  // Keep tight to avoid drifting from a safe inter-section gap into a
  // visual block interior.  Iron Rule #3: pixel scan is micro-adjustment.
  const extendedSearchUp = Math.floor(maxSearchUp * 1.0); // ~12% of page
  const searchDown = Math.floor(maxSearchUp * 0.65);      // ~8% of page
  const searchStart = Math.max(0, targetRow - extendedSearchUp);
  const searchEnd   = Math.min(rowData.canvasHeight - 1, targetRow + searchDown, maxRow ?? Infinity);
  const searchHeight = searchEnd - searchStart + 1;
  if (searchHeight < 8) return targetRow;

  // Classify each row using precomputed transitions & brightness data.
  // A "quiet" row must have few sharp brightness transitions AND high
  // average brightness (near-white).  This prevents dark card interiors
  // (e.g. navy gradient backgrounds) from being treated as valid cut points.
  const rowIsQuiet = new Uint8Array(searchHeight);
  for (let rowOffset = 0; rowOffset < searchHeight; rowOffset++) {
    const absRow = searchStart + rowOffset;
    // Transition threshold 10 tolerates card left/right borders at 2× scale.
    // Semi-transparent 1px CSS borders (e.g. rgba(28,40,87,0.2) on #f8f9fa)
    // produce 4-8 transitions depending on anti-aliasing alignment with the
    // 2-pixel sample grid. Old threshold ≤4 was too tight — at the boundary,
    // some renderers produce 5-6 transitions, making ALL gap rows inside
    // bordered cards non-quiet and causing findSafeCutRow to fail entirely.
    // Brightness 218 still rejects dark card interiors.
    rowIsQuiet[rowOffset] = (rowData.transitions[absRow] <= 10 && rowData.avgBrightness[absRow] > 218) ? 1 : 0;
  }

  // ── Helper: find a gap of MIN_GAP quiet rows nearest to targetRow ──
  // Scans bidirectionally outward from targetRow for the closest valid gap.
  const MIN_GAP = 8; // Iron Rule #4: ≥8 rows at 2× prevents false matches.
  const targetOffset = targetRow - searchStart;

  // Strategy: expand outward from targetRow — check row (target-1), (target+1),
  // (target-2), (target+2), … — so we always pick the gap closest to the ideal
  // cut position, minimising wasted page space.
  let bestGapCenter = -1;
  let bestDistance = Infinity;

  let consecutive = 0;
  let gapStart = -1;

  // Forward scan (full range) to identify ALL gaps, then pick closest to target
  for (let rowOffset = 0; rowOffset < searchHeight; rowOffset++) {
    if (rowIsQuiet[rowOffset]) {
      if (consecutive === 0) gapStart = rowOffset;
      consecutive++;
    } else {
      if (consecutive >= MIN_GAP) {
        const center = gapStart + Math.floor(consecutive / 2);
        const distance = Math.abs(center - targetOffset);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestGapCenter = center;
        }
      }
      consecutive = 0;
    }
  }
  // Check trailing gap
  if (consecutive >= MIN_GAP) {
    const center = gapStart + Math.floor(consecutive / 2);
    const distance = Math.abs(center - targetOffset);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestGapCenter = center;
    }
  }

  if (bestGapCenter >= 0) {
    return searchStart + bestGapCenter;
  }

  // ── Relaxed pass: accept 4 consecutive quiet rows ──
  consecutive = 0;
  gapStart = -1;
  bestGapCenter = -1;
  bestDistance = Infinity;

  for (let rowOffset = 0; rowOffset < searchHeight; rowOffset++) {
    if (rowIsQuiet[rowOffset]) {
      if (consecutive === 0) gapStart = rowOffset;
      consecutive++;
    } else {
      if (consecutive >= 4) {
        const center = gapStart + Math.floor(consecutive / 2);
        const distance = Math.abs(center - targetOffset);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestGapCenter = center;
        }
      }
      consecutive = 0;
    }
  }
  if (consecutive >= 4) {
    const center = gapStart + Math.floor(consecutive / 2);
    const distance = Math.abs(center - targetOffset);
    if (distance < bestDistance) {
      bestGapCenter = center;
    }
  }

  if (bestGapCenter >= 0) {
    return searchStart + bestGapCenter;
  }

  // ── Ultra-relaxed pass: accept just 2 consecutive quiet rows ──
  // This catches very tight inter-line gaps that the 4-row pass missed
  // (e.g. low render scale or tight line-height in callout blocks).
  consecutive = 0;
  gapStart = -1;
  bestGapCenter = -1;
  bestDistance = Infinity;

  for (let rowOffset = 0; rowOffset < searchHeight; rowOffset++) {
    if (rowIsQuiet[rowOffset]) {
      if (consecutive === 0) gapStart = rowOffset;
      consecutive++;
    } else {
      if (consecutive >= 2) {
        const center = gapStart + Math.floor(consecutive / 2);
        const distance = Math.abs(center - targetOffset);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestGapCenter = center;
        }
      }
      consecutive = 0;
    }
  }
  if (consecutive >= 2) {
    const center = gapStart + Math.floor(consecutive / 2);
    const distance = Math.abs(center - targetOffset);
    if (distance < bestDistance) {
      bestGapCenter = center;
    }
  }

  if (bestGapCenter >= 0) {
    return searchStart + bestGapCenter;
  }

  // ── Last resort: find the single brightest, quietest row nearest target ──
  // When no multi-row gap is found (e.g. inside densely packed coloured
  // blocks), pick the row with the highest brightness and fewest transitions
  // to minimise visible text cutting.
  let bestFallbackRow = -1;
  let bestFallbackScore = -1;
  const fallbackRadius = Math.min(Math.floor(searchHeight * 0.3), Math.floor(maxSearchUp * 0.5));
  const fbStart = Math.max(0, targetOffset - fallbackRadius);
  const fbEnd = Math.min(searchHeight - 1, targetOffset + fallbackRadius);
  for (let rowOffset = fbStart; rowOffset <= fbEnd; rowOffset++) {
    if (rowIsQuiet[rowOffset]) {
      const dist = Math.abs(rowOffset - targetOffset);
      const score = 1000 - dist; // prefer closer to target
      if (score > bestFallbackScore) {
        bestFallbackScore = score;
        bestFallbackRow = rowOffset;
      }
    }
  }
  if (bestFallbackRow >= 0) {
    return searchStart + bestFallbackRow;
  }

  return targetRow;
}

/**
 * Quick check: is the given canvas row "busy" (i.e. contains text/content)?
 *
 * Returns the number of brightness transitions in the row.
 * A background/gap row typically has 0-10 transitions
 * (bordered card backgrounds add 4-8 from left/right borders).
 * A text row typically has 15-50 transitions.
 * Threshold ≈ 12 is a safe divider.
 */
function getRowBusyness(
  precomputed: PrecomputedRowData,
  row: number
): number {
  if (row < 0 || row >= precomputed.canvasHeight) return 999;
  return precomputed.transitions[row];
}

/**
 * Verify the cut row is at a REAL inter-line gap.
 * Checks that the cut row AND its immediate neighbours (±checkRadius)
 * are all quiet (low transitions). If the cut row itself is busy,
 * this returns false immediately.
 */
function isCutAtRealGap(
  precomputed: PrecomputedRowData,
  row: number,
  checkRadius = 2,
  minGapWidth = 0
): boolean {
  if (row < 0 || row >= precomputed.canvasHeight) return false;
  // The cut row must have few transitions (≤12 accounts for bordered
  // card backgrounds where left/right borders add 4-8 transitions).
  if (precomputed.transitions[row] > 12) return false;
  // The cut row must be bright enough — reject cuts inside dark text body
  if (precomputed.avgBrightness[row] <= 200) return false;
  // At least `checkRadius` rows above and below must also be quiet
  for (let offset = 1; offset <= checkRadius; offset++) {
    const above = row - offset;
    const below = row + offset;
    if (above >= 0 && precomputed.transitions[above] > 12) return false;
    if (below < precomputed.canvasHeight && precomputed.transitions[below] > 12) return false;
  }
  // Optional: require the surrounding gap to be at least minGapWidth rows
  // wide. This rejects narrow inter-line gaps where anti-aliased text edges
  // could cause visible clipping artifacts even though transitions are low.
  if (minGapWidth > 0) {
    let gapWidth = 1;
    for (let r = row - 1; r >= Math.max(0, row - 60); r--) {
      if (precomputed.transitions[r] > 12) break;
      gapWidth++;
    }
    for (let r = row + 1; r < Math.min(precomputed.canvasHeight, row + 60); r++) {
      if (precomputed.transitions[r] > 12) break;
      gapWidth++;
    }
    if (gapWidth < minGapWidth) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Precomputed row data: one-pass scan replaces all per-page getImageData calls
// ---------------------------------------------------------------------------
interface PrecomputedRowData {
  transitions: Uint16Array;    // brightness transition count per row
  avgBrightness: Float32Array; // average brightness per row (preserves decimal precision)
  canvasHeight: number;
}

/**
 * Scan the entire canvas once, computing per-row transitions and brightness.
 * Processing is chunked (2000 rows per batch) to limit peak memory.
 * After this call, findSafeCutRow / getRowBusyness / isCutAtRealGap use O(1)
 * array lookups instead of individual getImageData calls.
 */
function precomputeCanvasRowData(canvas: HTMLCanvasElement): PrecomputedRowData {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get canvas 2d context for precomputation");

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const sampleStart = Math.floor(canvasWidth * 0.08);
  const sampleWidth = Math.floor(canvasWidth * 0.84);

  const transitions = new Uint16Array(canvasHeight);
  const avgBrightness = new Float32Array(canvasHeight);

  const CHUNK_SIZE = 2000;
  for (let chunkStart = 0; chunkStart < canvasHeight; chunkStart += CHUNK_SIZE) {
    const chunkHeight = Math.min(CHUNK_SIZE, canvasHeight - chunkStart);
    const imageData = ctx.getImageData(sampleStart, chunkStart, sampleWidth, chunkHeight);
    const pixelData = imageData.data;
    const bytesPerRow = sampleWidth * 4;

    for (let rowOffset = 0; rowOffset < chunkHeight; rowOffset++) {
      const base = rowOffset * bytesPerRow;
      let transCount = 0;
      let brightnessSum = 0;
      let sampleCount = 0;
      let prevBrightness = (pixelData[base] + pixelData[base + 1] + pixelData[base + 2]) / 3;
      brightnessSum += prevBrightness;
      sampleCount++;
      for (let pixelIndex = base + 8; pixelIndex < base + bytesPerRow; pixelIndex += 8) {
        const brightness = (pixelData[pixelIndex] + pixelData[pixelIndex + 1] + pixelData[pixelIndex + 2]) / 3;
        if (Math.abs(brightness - prevBrightness) > 25) transCount++;
        prevBrightness = brightness;
        brightnessSum += brightness;
        sampleCount++;
      }
      transitions[chunkStart + rowOffset] = transCount;
      avgBrightness[chunkStart + rowOffset] = sampleCount > 0 ? brightnessSum / sampleCount : 0;
    }
  }

  return { transitions, avgBrightness, canvasHeight };
}

/**
 * Encode a canvas as JPEG using async toBlob (encoding runs off main thread).
 * Falls back to synchronous toDataURL if toBlob is unavailable.
 * Returns either Uint8Array (raw JPEG bytes) or string (data URL).
 */
async function encodeCanvasImage(
  canvas: HTMLCanvasElement,
  jpegQuality: number
): Promise<{ imageData: string | Uint8Array; format: "JPEG" | "PNG" }> {
  if (typeof canvas.toBlob === "function") {
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", jpegQuality)
      );
      if (blob && blob.size > 100) {
        return { imageData: new Uint8Array(await blob.arrayBuffer()), format: "JPEG" };
      }
    } catch { /* toBlob failed, fall through */ }
  }
  try {
    return { imageData: canvas.toDataURL("image/jpeg", jpegQuality), format: "JPEG" };
  } catch {
    return { imageData: canvas.toDataURL("image/png"), format: "PNG" };
  }
}

interface ReportData {
  mainAnchor: string;
  coreAdvantageAnchors?: string[];
  scores: Record<string, number>;
  stability: string;
  riskIndex: number;
  conflictAnchors?: string[];
  createdAt?: string;
  questionCount?: number;
  completionTime?: number;
  userName?: string;
  workExpDescription?: string;
}

const getStabilityText = (stability: string, language: Language): string => {
  const map: Record<string, Record<Language, string>> = {
    mature: { "zh-CN": "成熟", "zh-TW": "成熟", en: "Mature" },
    developing: { "zh-CN": "发展中", "zh-TW": "發展中", en: "Developing" },
    unclear: { "zh-CN": "不明确", "zh-TW": "不明確", en: "Unclear" },
  };
  return map[stability]?.[language] || stability;
};

const getDimensionName = (code: string, language: Language): string => {
  return DIMENSIONS[code as keyof typeof DIMENSIONS]?.[language] || code;
};

export function generateReportHTML(data: ReportData, language: Language): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  
  const title = isEn ? "Career Anchor Assessment Report" : isTW ? "職業錨測評報告" : "职业锚测评报告";
  const computedCoreAnchors = data.coreAdvantageAnchors?.length ? data.coreAdvantageAnchors : getCoreAdvantageAnchors(data.scores);
  const hasCoreAdvantage = computedCoreAnchors.length > 0;
  const displayAnchor = computedCoreAnchors[0] || data.mainAnchor;
  const mainAnchorLabel = hasCoreAdvantage
    ? (isEn ? "Core Advantage Anchor" : isTW ? "核心優勢錨點" : "核心优势锚点")
    : (isEn ? "Top Anchor" : isTW ? "最高分錨點" : "最高分锚点");
  const scoresLabel = isEn ? "Dimension Scores" : isTW ? "維度得分" : "维度得分";
  const stabilityLabel = isEn ? "Stability" : isTW ? "穩定性" : "稳定性";
  const riskLabel = isEn ? "Clarity Index" : isTW ? "錨定清晰度" : "锚定清晰度";
  const conflictLabel = isEn ? "Conflicting Anchors" : isTW ? "衝突錨" : "冲突锚";
  const generatedLabel = isEn ? "Generated" : isTW ? "生成時間" : "生成时间";
  const questionCountLabel = isEn ? "Questions Answered" : isTW ? "答題數量" : "答题数量";
  const timeLabel = isEn ? "Completion Time" : isTW ? "完成用時" : "完成用时";
  
  const sortedScores = Object.entries(data.scores)
    .sort(([, a], [, b]) => b - a);
  const topRawScore = sortedScores.length > 0 ? sortedScores[0][1] : 1;
  
  const scoreRows = sortedScores.map(([code, score]) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #E9ECEF; color: #1a1a2e; font-size: 14px;">${getDimensionName(code, language)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #E9ECEF; text-align: right;">
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
          <div style="width: 200px; height: 8px; background: #E9ECEF; border-radius: 4px; overflow: hidden;">
            <div style="width: ${topRawScore > 0 ? Math.min((score / topRawScore) * 100, 100) : 0}%; height: 100%; background: ${score >= 80 ? '#22c55e' : score >= 65 ? '#eab308' : '#94a3b8'}; border-radius: 4px;"></div>
          </div>
          <span style="min-width: 40px; font-weight: 600; font-family: 'Montserrat', sans-serif; color: #1a1a2e;">${Math.round(score)}</span>
        </div>
      </td>
    </tr>
  `).join("");

  const conflictSection = data.conflictAnchors && data.conflictAnchors.length > 0 
    ? `
      <div style="margin-top: 24px; padding: 20px; background: #fffbeb; border-radius: 12px; border: 1px solid #fde68a;">
        <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 15px; font-weight: 700;">${conflictLabel}</h3>
        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.8;">
          ${data.conflictAnchors.map(code => getDimensionName(code, language)).join(", ")}
        </p>
      </div>
    `
    : "";

  const metaInfo = [];
  if (data.questionCount) {
    metaInfo.push(`${questionCountLabel}: ${data.questionCount}`);
  }
  if (data.completionTime) {
    const minutes = Math.floor(data.completionTime / 60);
    const seconds = data.completionTime % 60;
    metaInfo.push(`${timeLabel}: ${minutes}${isEn ? "m" : "分"}${seconds}${isEn ? "s" : "秒"}`);
  }
  metaInfo.push(`${generatedLabel}: ${data.createdAt || new Date().toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN")}`);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${CPC_REPORT_CSS}</style>
</head>
<body>
<div class="cpc-report-root">
  <header style="text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #E9ECEF;">
    <h1 style="margin: 0; font-size: 24px; color: #1C2857;">${title}</h1>
    ${data.userName ? `<p style="margin: 8px 0 0 0; color: #1a1a2e; font-size: 15px; font-weight: 600;">${data.userName}</p>` : ""}
    ${data.workExpDescription ? `<p style="margin: 8px 0 0 0; color: #4a5568; font-size: 14px; font-weight: 500;">${data.workExpDescription}</p>` : ""}
    <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 13px; font-family: 'Montserrat', sans-serif;">${metaInfo.join(" | ")}</p>
  </header>

  <section style="margin-bottom: 32px;">
    <div style="display: flex; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px; padding: 24px; background: linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%); border-radius: 12px; color: #fff;">
        <p style="margin: 0 0 8px 0; font-size: 14px; opacity: 0.8;">${mainAnchorLabel}</p>
        <p style="margin: 0; font-size: 24px; font-weight: 700;">${getDimensionName(displayAnchor, language)}</p>
      </div>
    </div>
  </section>

  <section style="margin-bottom: 32px; display: flex; gap: 16px; flex-wrap: wrap;">
    <div style="flex: 1; min-width: 150px; padding: 16px; background: #f0fdf4; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: #166534;">${stabilityLabel}</p>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: #15803d;">${getStabilityText(data.stability, language)}</p>
    </div>
    <div style="flex: 1; min-width: 150px; padding: 16px; background: ${data.riskIndex > 50 ? '#fef2f2' : data.riskIndex > 25 ? '#fffbeb' : '#f0fdf4'}; border-radius: 8px; text-align: center;">
      <p style="margin: 0 0 4px 0; font-size: 12px; color: ${data.riskIndex > 50 ? '#991b1b' : data.riskIndex > 25 ? '#92400e' : '#166534'};">${riskLabel}</p>
      <p style="margin: 0; font-size: 20px; font-weight: 600; color: ${data.riskIndex > 50 ? '#dc2626' : data.riskIndex > 25 ? '#d97706' : '#15803d'};">${data.riskIndex.toFixed(0)}</p>
    </div>
  </section>

  ${conflictSection}

  <section style="margin-top: 32px;">
    <div class="cpc-section-header-compact"><span class="cpc-section-header-compact-title">${scoresLabel}</span></div>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${scoreRows}
      </tbody>
    </table>
  </section>

  <footer style="margin-top: 48px; padding-top: 24px; padding-bottom: 20px; border-top: 1px solid #E9ECEF; text-align: center; color: #94a3b8; font-size: 12px;">
    <p>SCPC — Strategic Career Planning Consultant</p>
  </footer>
</div>
</body>
</html>
  `.trim();
}

export async function downloadHtmlAsPdf(htmlContent: string, filename: string): Promise<void> {
  // Delegate to the section-aware renderer so ALL PDF exports benefit from
  // smart break-point detection (data-page-break markers + findSafeCutRow).
  // If the HTML has no markers the function gracefully falls back to
  // pixel-analysis-only mode.
  return downloadHtmlAsPdfWithBreaks(htmlContent, filename);
}

// ---------------------------------------------------------------------------
// Keep-Together Zone: represents a DOM region that must not be split.
// ---------------------------------------------------------------------------
interface KeepTogetherZone {
  topMm: number;
  bottomMm: number;
}

// ---------------------------------------------------------------------------
// Text Line Cut Info: DOM-level line boundary positioning.
// Used to snap page cuts to inter-line gaps within text blocks, bypassing
// pixel scanning entirely.  This is immune to rendering differences
// (anti-aliasing, border artifacts, DPI, browser engine variations).
// ---------------------------------------------------------------------------
interface TextLineCutInfo {
  /** Top of the text block element in content-mm coordinates */
  blockTopMm: number;
  /** Bottom of the text block element in content-mm coordinates */
  blockBottomMm: number;
  /** Computed line-height in mm (CSS px × pxToMm) */
  lineHeightMm: number;
}

/**
 * Layer 4 — Text glyph collision guard.
 * Checks whether the cut position falls inside the glyph rendering zone
 * (15%–85% of any text line box) and nudges it to the nearest inter-line gap.
 *
 * Uses a relaxed minFill (20% of normal) because preventing text cuts is more
 * important than maintaining minimum page fill — a short page is always better
 * than a page with sliced characters.
 *
 * Returns the corrected position (or the original if no collision detected).
 */
function applyGlyphGuard(
  nextPageTop: number,
  textLineInfos: TextLineCutInfo[],
  pageTopMm: number,
  minFillMm: number,
  hardMaxMm: number,
  label: string
): number {
  // Relaxed fill: allow pages as short as 20% of normal minFill (~21mm)
  // to avoid leaving cuts inside character glyphs.
  const guardMinFill = minFillMm * 0.2;
  for (const info of textLineInfos) {
    if (nextPageTop < info.blockTopMm - 0.5 || nextPageTop > info.blockBottomMm + 0.5) continue;
    const relPos = nextPageTop - info.blockTopMm;
    const lineIdx = Math.floor(relPos / info.lineHeightMm);
    const posInLine = relPos - lineIdx * info.lineHeightMm;
    const glyphZoneStart = info.lineHeightMm * 0.15;
    const glyphZoneEnd = info.lineHeightMm * 0.85;
    if (posInLine > glyphZoneStart && posInLine < glyphZoneEnd) {
      const gapAbove = info.blockTopMm + lineIdx * info.lineHeightMm;
      const gapBelow = info.blockTopMm + (lineIdx + 1) * info.lineHeightMm;
      // Prefer gap above (shorter page is safer than clipping text)
      if (gapAbove - pageTopMm >= guardMinFill && gapAbove <= hardMaxMm) {
        console.warn(
          `[Report PDF] ${label}: ${nextPageTop.toFixed(1)}mm → ${gapAbove.toFixed(1)}mm` +
          ` (was ${posInLine.toFixed(1)}/${info.lineHeightMm.toFixed(1)}mm into line ${lineIdx})`
        );
        return gapAbove;
      } else if (gapBelow <= info.blockBottomMm + info.lineHeightMm * 0.3
                 && gapBelow - pageTopMm >= guardMinFill && gapBelow <= hardMaxMm) {
        console.warn(
          `[Report PDF] ${label} (below): ${nextPageTop.toFixed(1)}mm → ${gapBelow.toFixed(1)}mm`
        );
        return gapBelow;
      }
    }
    break; // Only process the first matching block
  }
  return nextPageTop;
}

/**
 * Collect text block positions and line heights from the live DOM.
 * Must be called while the container is still in layout (before removal).
 */
function collectTextLineCutInfo(
  container: HTMLElement,
  containerRect: DOMRect,
  pxToMm: number
): TextLineCutInfo[] {
  // Detect all multi-line text containers. Primary: .cpc-text-block classes.
  // Secondary: any <p> or <div> with explicit line-height >= 1.5 that isn't a
  // single-line label/pill.  This catches report text blocks without the class.
  const primaryElements = container.querySelectorAll(".cpc-text-block, .cpc-text-block-light");
  const infos: TextLineCutInfo[] = [];
  const seenElements = new Set<Element>();

  const processElement = (element: Element, heightThreshold: number) => {
    if (seenElements.has(element)) return;
    seenElements.add(element);
    const htmlElement = element as HTMLElement;
    const rect = htmlElement.getBoundingClientRect();
    const computed = getComputedStyle(htmlElement);
    const lineHeightValue = computed.lineHeight;
    let lineHeightPx: number;
    if (lineHeightValue === "normal" || !lineHeightValue) {
      lineHeightPx = parseFloat(computed.fontSize) * 1.5;
    } else {
      lineHeightPx = parseFloat(lineHeightValue);
    }
    // Height threshold filters out trivially small elements:
    // - Primary pass (.cpc-text-block): 0.8× — these are SEMANTICALLY KNOWN
    //   text blocks, safe to include even if only 1 line. The snap/glyph guard
    //   will correctly push the cut to the block boundary.
    // - Secondary pass (generic p/div): 1.8× — stricter to avoid collecting
    //   labels, pills, headers that would pollute snap with wrong line heights.
    // Note: task#23 reverted a global 0.5× threshold because HEADERS had been
    // added to primary pass. Headers are now excluded (kept in keep-together
    // zones only), so 0.8× for primary pass is safe.
    if (lineHeightPx > 0 && rect.height >= lineHeightPx * heightThreshold) {
      infos.push({
        blockTopMm: (rect.top - containerRect.top) * pxToMm,
        blockBottomMm: (rect.bottom - containerRect.top) * pxToMm,
        lineHeightMm: lineHeightPx * pxToMm,
      });
    }
  };

  // Primary pass: only cpc-text-block prose elements (threshold 0.8×).
  // These are semantically marked text — safe to include even if short (1 line).
  // Headers are protected by keep-together zones (collectKeepTogetherZones)
  // and must NOT be in textLineInfos — their single-line height/lineHeight
  // ratio confuses the snap algorithm, causing it to project line boundaries
  // past the header into adjacent text blocks.
  primaryElements.forEach(el => processElement(el, 0.8));

  // Secondary pass: <p> and <div> with typical body text styling.
  // Restricted to font-size 12-16px and line-height ratio >= 1.5 to avoid
  // collecting container divs, headers, labels, or other non-prose elements
  // that would pollute the snap algorithm with incorrect line heights.
  const secondaryElements = container.querySelectorAll("p, div");
  secondaryElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    if (seenElements.has(element)) return;
    // Skip if already inside a keep-together zone (those are protected separately)
    if (htmlElement.closest("[data-keep-together]")) return;
    // Skip containers that have children with their own text blocks
    if (htmlElement.querySelector(".cpc-text-block, .cpc-text-block-light")) return;
    const computed = getComputedStyle(htmlElement);
    const fontSize = parseFloat(computed.fontSize);
    if (fontSize < 12 || fontSize > 16) return;
    const lineHeightValue = computed.lineHeight;
    if (!lineHeightValue || lineHeightValue === "normal") return;
    const lineHeightPx = parseFloat(lineHeightValue);
    const ratio = lineHeightPx / fontSize;
    if (ratio < 1.5) return;
    processElement(element, 1.8);
  });

  return infos;
}

/**
 * If the proposed cut is inside or near a multi-line text block, snap it to
 * the nearest inter-line boundary.
 *
 * Detection range extends 1.5× lineHeight above and below each block to
 * catch cuts in section margins/padding that are close enough to clip
 * character anti-aliased edges.  After snapping, the caller should
 * fine-tune with pixel scanning within ±1 lineHeight to find the exact
 * gap center in the canvas (DOM positions are approximate).
 */
function snapCutToTextLineBoundary(
  cutMm: number,
  textLineInfos: TextLineCutInfo[],
  pageTopMm: number,
  minFillMm: number,
  hardMaxMm: number,
): { snapped: boolean; position: number; lineHeightMm: number } {
  // Helper: try to snap within a single block's line grid
  const trySnapToBlock = (info: TextLineCutInfo): { snapped: boolean; position: number; lineHeightMm: number } | null => {
    const relativePosition = cutMm - info.blockTopMm;
    const nearestLineIndex = Math.round(relativePosition / info.lineHeightMm);
    const candidates = [
      nearestLineIndex,
      nearestLineIndex - 1,
      nearestLineIndex + 1,
    ];
    for (const lineIdx of candidates) {
      if (lineIdx < 0) continue;
      const candidateMm = info.blockTopMm + lineIdx * info.lineHeightMm;
      if (candidateMm > info.blockBottomMm + info.lineHeightMm * 0.3) continue;
      if (candidateMm - pageTopMm >= minFillMm && candidateMm <= hardMaxMm) {
        console.log(
          `[Report PDF] Text line snap: ${cutMm.toFixed(1)}mm → ${candidateMm.toFixed(1)}mm` +
          ` (line ${lineIdx}, LH ${info.lineHeightMm.toFixed(2)}mm, block ${info.blockTopMm.toFixed(1)}-${info.blockBottomMm.toFixed(1)}mm)`
        );
        return { snapped: true, position: candidateMm, lineHeightMm: info.lineHeightMm };
      }
    }
    return null;
  };

  // ── Pass 1: DIRECT match — cut is actually inside the block ──
  // Prefer the LONGEST (tallest) directly-containing block so that short
  // single-line blocks adjacent to long multi-line blocks don't hijack
  // the snap calculation with a misaligned reference grid.
  let bestDirectBlock: TextLineCutInfo | null = null;
  for (const info of textLineInfos) {
    if (cutMm >= info.blockTopMm && cutMm <= info.blockBottomMm) {
      if (!bestDirectBlock || (info.blockBottomMm - info.blockTopMm) > (bestDirectBlock.blockBottomMm - bestDirectBlock.blockTopMm)) {
        bestDirectBlock = info;
      }
    }
  }
  if (bestDirectBlock) {
    const result = trySnapToBlock(bestDirectBlock);
    if (result) return result;
  }

  // ── Pass 2: EXTENDED margin match (1.5×LH above/below) ──
  // Only if no direct match succeeded.  Prefer the nearest block center
  // to the cut position to avoid distant short blocks from dominating.
  let bestExtendedBlock: TextLineCutInfo | null = null;
  let bestExtendedDistance = Infinity;
  for (const info of textLineInfos) {
    const margin = info.lineHeightMm * 1.5;
    if (cutMm >= info.blockTopMm - margin && cutMm <= info.blockBottomMm + margin) {
      const blockCenter = (info.blockTopMm + info.blockBottomMm) / 2;
      const distance = Math.abs(cutMm - blockCenter);
      if (distance < bestExtendedDistance) {
        bestExtendedDistance = distance;
        bestExtendedBlock = info;
      }
    }
  }
  if (bestExtendedBlock) {
    const result = trySnapToBlock(bestExtendedBlock);
    if (result) return result;
  }

  return { snapped: false, position: cutMm, lineHeightMm: 0 };
}

/**
 * Adjusts a proposed cut position to respect keep-together zones.
 * If the cut falls inside a zone, it is moved above (preferred) or below
 * the zone.  Iterates up to 5 times to handle adjacent zones.
 */
function adjustCutForKeepTogether(
  proposedCut: number,
  pageTopMm: number,
  minFillMm: number,
  absoluteMaxMm: number,
  keepTogetherZones: KeepTogetherZone[]
): number {
  let cut = proposedCut;
  for (let iteration = 0; iteration < 5; iteration++) {
    let adjusted = false;
    for (const zone of keepTogetherZones) {
      // Is the cut inside this zone?  (0.5mm tolerance avoids edge rounding)
      if (cut > zone.topMm + 0.5 && cut < zone.bottomMm - 0.5) {
        // Option A: cut BEFORE the zone (preferred — keeps the block on next page)
        if (zone.topMm - pageTopMm >= minFillMm) {
          cut = zone.topMm;
          adjusted = true;
          break;
        }
        // Option B: push the block onto this page (cut AFTER the zone)
        if (zone.bottomMm <= absoluteMaxMm) {
          cut = zone.bottomMm;
          adjusted = true;
          break;
        }
        // Option C (relaxed): cut BEFORE even if page is under-filled —
        // better to have a short page than to slice through content.
        // Only accept if page has at least 15% content.
        const relaxedMinFill = minFillMm * 0.4;
        if (zone.topMm - pageTopMm >= relaxedMinFill) {
          cut = zone.topMm;
          adjusted = true;
          break;
        }
        // Last resort — the block is taller than a page; allow the cut.
        break;
      }
    }
    if (!adjusted) break;
  }
  return cut;
}

/**
 * Collect keep-together zones from DOM elements and map to mm coordinates.
 */
function collectKeepTogetherZones(
  container: HTMLElement,
  containerRect: DOMRect,
  pxToMm: number
): KeepTogetherZone[] {
  // Include explicit data-keep-together AND all header-class elements.
  // Headers are single-line indivisible blocks that must never be split.
  const elements = container.querySelectorAll(
    "[data-keep-together], .cpc-part-header, .cpc-section-header, .cpc-section-header-compact"
  );
  const zones: KeepTogetherZone[] = [];
  const seen = new Set<Element>();
  elements.forEach(el => {
    if (seen.has(el)) return;
    seen.add(el);
    const rect = (el as HTMLElement).getBoundingClientRect();
    zones.push({
      topMm: (rect.top - containerRect.top) * pxToMm,
      bottomMm: (rect.bottom - containerRect.top) * pxToMm,
    });
  });
  return zones;
}

/**
 * Section-aware PDF renderer that breaks pages at logical section boundaries
 * instead of arbitrary positions. Uses data-page-break markers in the HTML
 * and respects data-keep-together zones (Iron Rules).
 */
async function downloadHtmlAsPdfWithBreaks(htmlContent: string, filename: string): Promise<void> {
  const lang = useLanguage.getState().language;
  reportProgressStart(getStepLabel("loading", lang));

  const tPipelineStart = performance.now();
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");
  reportProgressUpdate(5, getStepLabel("loading", lang));

  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.width = "800px";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.background = "#ffffff";
  document.body.appendChild(container);

  try {
    // Remove web-only elements (e.g., hover hints) before PDF capture
    container.querySelectorAll("[data-screen-only]").forEach(el => el.remove());

    // Collect break-point positions from markers before canvas render
    const containerRect = container.getBoundingClientRect();
    const markers = container.querySelectorAll("[data-page-break]");
    const breakPixels: number[] = [];
    markers.forEach(marker => {
      const rect = (marker as HTMLElement).getBoundingClientRect();
      breakPixels.push(rect.top - containerRect.top);
    });

    reportProgressUpdate(10, getStepLabel("rendering", lang));
    const tRender = performance.now();
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 800,
      backgroundColor: "#ffffff",
    });
    console.log(`[Report PDF] Render: ${(performance.now() - tRender).toFixed(0)}ms`);

    // Precompute row data for O(1) per-row lookups during pagination
    reportProgressUpdate(48, getStepLabel("analyzing", lang));
    const tPrecompute = performance.now();
    const rowData = precomputeCanvasRowData(canvas);
    console.log(`[Report PDF] Row precompute: ${(performance.now() - tPrecompute).toFixed(0)}ms, rows: ${canvas.height}`);
    reportProgressUpdate(52, getStepLabel("paginating", lang));

    // Note: no full-canvas toDataURL here — we slice per page below
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    // Add left/right margins for the comprehensive report
    const marginXMm = 12;
    const imgWidth = pdfWidth - marginXMm * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Map pixel offsets to mm coordinates in the rendered image
    const containerHeight = containerRect.height || 1;
    const pxToMm = imgHeight / containerHeight;
    const breaksMm = breakPixels.map(px => px * pxToMm).sort((a, b) => a - b);

    // Collect keep-together zones (Iron Rule #1)
    const keepTogetherZones = collectKeepTogetherZones(container, containerRect, pxToMm);

    // Collect text block line info for DOM-level line-boundary snapping
    const textLineInfos = collectTextLineCutInfo(container, containerRect, pxToMm);

    // Require at least 35% page fill before accepting a break point
    const minFillMm = pdfHeight * 0.35;

    let pageTopMm = 0;
    let pageIndex = 0;
    // Top margin for continuation pages so text doesn't touch the edge
    const continuationMarginMm = 6;
    const tPagination = performance.now();

    while (pageTopMm < imgHeight - 1) {
      const availableHeight = pageIndex > 0 ? pdfHeight - continuationMarginMm : pdfHeight;
      const maxBottom = pageTopMm + availableHeight;

      // Find last suitable break point on this page
      let nextPageTop = maxBottom;
      for (const bp of breaksMm) {
        if (bp <= pageTopMm) continue;
        if (bp > maxBottom) break;
        if (bp - pageTopMm >= minFillMm) {
          nextPageTop = bp;
        }
      }

      // Hard cap: content placed at yOffset cannot exceed the PDF page bottom.
      // Page 0 has yOffset=0, continuation pages have yOffset=continuationMarginMm.
      const yOffsetForPage = pageIndex > 0 ? continuationMarginMm : 0;
      const hardMaxSlice = pdfHeight - yOffsetForPage;
      const hardMaxMm = pageTopMm + hardMaxSlice;
      const hardMaxPx = Math.floor((hardMaxMm / imgHeight) * canvas.height);

      // Always verify the cut position with pixel analysis.
      // Even when a break marker is found, small coordinate-conversion offsets
      // can place the cut on a text row. The pixel scanner adjusts to the
      // nearest real line gap (consecutive quiet rows).
      if (nextPageTop < imgHeight - 1) {
        const cutPx = Math.floor((nextPageTop / imgHeight) * canvas.height);
        const searchPx = Math.floor((availableHeight * 0.12 / imgHeight) * canvas.height);
        const safePx = findSafeCutRow(rowData, cutPx, searchPx, hardMaxPx);
        const safeMm = (safePx / canvas.height) * imgHeight;
        if (safeMm - pageTopMm >= minFillMm && safeMm <= hardMaxMm) {
          nextPageTop = safeMm;
        } else if (safeMm > hardMaxMm) {
          const wideUpPx = Math.floor((availableHeight * 0.25 / imgHeight) * canvas.height);
          const reSafePx = findSafeCutRow(rowData, hardMaxPx, wideUpPx, hardMaxPx);
          const reSafeMm = (reSafePx / canvas.height) * imgHeight;
          if (reSafeMm - pageTopMm >= minFillMm && reSafeMm <= hardMaxMm) {
            nextPageTop = reSafeMm;
          }
        }
      }

      // ── Iron Rule #1: Respect keep-together zones ──
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = adjustCutForKeepTogether(
          nextPageTop, pageTopMm, minFillMm, hardMaxMm, keepTogetherZones
        );
      }

      // ── Text line snap: DOM-level line boundary alignment ──
      let textLineSnappedBreaks = false;
      if (nextPageTop < imgHeight - 1) {
        const textSnap = snapCutToTextLineBoundary(nextPageTop, textLineInfos, pageTopMm, minFillMm, hardMaxMm);
        if (textSnap.snapped) {
          nextPageTop = textSnap.position;

          // Pixel fine-tuning within ±1 line height (asymmetric: limit downward)
          const snapPx = Math.floor((nextPageTop / imgHeight) * canvas.height);
          const lineHeightCanvasPx = Math.ceil((textSnap.lineHeightMm / imgHeight) * canvas.height);
          const refinedPx = findSafeCutRow(rowData, snapPx, lineHeightCanvasPx, hardMaxPx);
          const refinedMm = (refinedPx / canvas.height) * imgHeight;
          const drift = refinedMm - nextPageTop;
          const maxDownDrift = textSnap.lineHeightMm * 0.1;
          const maxUpDrift = textSnap.lineHeightMm;
          if (drift <= maxDownDrift && drift >= -maxUpDrift
              && refinedMm - pageTopMm >= minFillMm && refinedMm <= hardMaxMm) {
            nextPageTop = refinedMm;
          }

          textLineSnappedBreaks = true;
        }
      }

      // ── Layer 4: Text glyph collision guard ──
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = applyGlyphGuard(nextPageTop, textLineInfos, pageTopMm, minFillMm, hardMaxMm, "Layer 4 glyph guard (breaks)");
      }

      // ── Pixel-level micro-scan + verification (only when NOT inside a text block) ──
      if (!textLineSnappedBreaks && nextPageTop < imgHeight - 1) {
        const finalPx = Math.floor((nextPageTop / imgHeight) * canvas.height);
        const microSearchPx = Math.floor((availableHeight * 0.08 / imgHeight) * canvas.height);
        const finalSafePx = findSafeCutRow(rowData, finalPx, microSearchPx, hardMaxPx);
        const finalSafeMm = (finalSafePx / canvas.height) * imgHeight;
        if (finalSafeMm - pageTopMm >= minFillMm && finalSafeMm <= hardMaxMm) {
          nextPageTop = finalSafeMm;
        }

        const verifyPx = Math.floor((nextPageTop / imgHeight) * canvas.height);
        if (!isCutAtRealGap(rowData, verifyPx, 4, 14)) {
          const vTrans = verifyPx >= 0 && verifyPx < rowData.canvasHeight ? rowData.transitions[verifyPx] : -1;
          const vBright = verifyPx >= 0 && verifyPx < rowData.canvasHeight ? rowData.avgBrightness[verifyPx].toFixed(1) : "-";
          console.warn("[Report PDF] Cut verification failed (breaks)",
            { page: pageIndex, row: verifyPx, transitions: vTrans, brightness: vBright });
          const rescueSearchPx = Math.floor((availableHeight * 0.30 / imgHeight) * canvas.height);
          const rescuePx = findSafeCutRow(rowData, verifyPx, rescueSearchPx, hardMaxPx);
          const rescueMm = (rescuePx / canvas.height) * imgHeight;
          if (rescueMm - pageTopMm >= minFillMm && rescueMm <= hardMaxMm
              && isCutAtRealGap(rowData, rescuePx, 2)) {
            nextPageTop = rescueMm;
          } else {
            const lastResortSearchPx = Math.floor((availableHeight * 0.50 / imgHeight) * canvas.height);
            const lastResortPx = findSafeCutRow(rowData, hardMaxPx, lastResortSearchPx, hardMaxPx);
            const lastResortMm = (lastResortPx / canvas.height) * imgHeight;
            if (lastResortMm - pageTopMm >= minFillMm && lastResortMm <= hardMaxMm
                && isCutAtRealGap(rowData, lastResortPx, 1)) {
              nextPageTop = lastResortMm;
            } else {
              console.error("[Report PDF] ALL rescue scans failed (breaks) \u2014 emergency fallback",
                { page: pageIndex, verifyRow: verifyPx, rescueRow: rescuePx, lastResortRow: lastResortPx });
              if (rescueMm - pageTopMm >= minFillMm * 0.5 && rescueMm <= hardMaxMm) {
                nextPageTop = rescueMm;
              } else if (lastResortMm - pageTopMm >= minFillMm * 0.5 && lastResortMm <= hardMaxMm) {
                nextPageTop = lastResortMm;
              }
            }
          }
        }
      }

      // ── Layer 4 re-check after pixel scan ──
      // Layer 3 can move the cut into a text block. Re-run glyph guard
      // to catch any collision introduced by the pixel scan + rescue.
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = applyGlyphGuard(nextPageTop, textLineInfos, pageTopMm, minFillMm, hardMaxMm, "Layer 4 post-scan guard (breaks)");
      }

      // ── Final Iron Rule #1 re-check ──
      // After all layers (text snap, glyph guard, pixel scan) have run,
      // re-verify that no layer has moved the cut back into a keep-together
      // zone.  This is the absolute last safety net for indivisible blocks.
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = adjustCutForKeepTogether(
          nextPageTop, pageTopMm, minFillMm, hardMaxMm, keepTogetherZones
        );
      }

      // ── ABSOLUTE FINAL SAFETY: pixel-based verification (breaks path) ──
      if (nextPageTop < imgHeight - 1) {
        const absFinalPx = Math.floor((nextPageTop / imgHeight) * canvas.height);
        if (!isCutAtRealGap(rowData, absFinalPx, 3, 6)) {
          const rescueRng = Math.floor((usableHeight * 0.15 / imgHeight) * canvas.height);
          const rescuedPx = findSafeCutRow(rowData, absFinalPx, rescueRng, hardMaxPx);
          const rescuedMm = (rescuedPx / canvas.height) * imgHeight;
          if (rescuedMm - pageTopMm >= minFillMm * 0.3 && rescuedMm <= hardMaxMm
              && isCutAtRealGap(rowData, rescuedPx, 2)) {
            console.warn(
              `[Report PDF] FINAL pixel safety (breaks): ${nextPageTop.toFixed(1)}mm → ${rescuedMm.toFixed(1)}mm (page ${pageIndex})`
            );
            nextPageTop = rescuedMm;
          }
        }
      }

      // Slice the canvas for this page section
      const sliceTopPx = Math.floor((pageTopMm / imgHeight) * canvas.height);
      const sliceBottomPx = Math.min(Math.floor((nextPageTop / imgHeight) * canvas.height), canvas.height);
      const sliceHeightPx = sliceBottomPx - sliceTopPx;

      // Skip near-empty trailing slices to prevent blank last pages.
      // At 2× scale, 30px ≈ 15 physical px — too small to contain meaningful text.
      const MIN_MEANINGFUL_SLICE_PX = 30;
      if (sliceHeightPx >= MIN_MEANINGFUL_SLICE_PX) {
        if (pageIndex > 0) pdf.addPage();
        // Progress: 52-90% allocated to pagination
        const paginationPct = 52 + (nextPageTop / imgHeight) * 38;
        reportProgressUpdate(Math.min(90, paginationPct), getStepLabel("paginating", lang));
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0, sliceTopPx, canvas.width, sliceHeightPx,
            0, 0, canvas.width, sliceHeightPx
          );
        }

        const encoded = await encodeCanvasImage(pageCanvas, 0.85);
        const sliceHeightMm = (sliceHeightPx * imgWidth) / canvas.width;
        const yOffsetMm = pageIndex > 0 ? continuationMarginMm : 0;
        pdf.addImage(encoded.imageData, encoded.format, marginXMm, yOffsetMm, imgWidth, sliceHeightMm);
        pageIndex++;
      }

      pageTopMm = nextPageTop;
    }

    console.log(`[Report PDF] Pagination+encode: ${(performance.now() - tPagination).toFixed(0)}ms, pages: ${pageIndex}`);
    reportProgressUpdate(92, getStepLabel("saving", lang));
    const tSave = performance.now();
    pdf.save(filename);
    reportProgressEnd();
    console.log(`[Report PDF] Pipeline total: ${(performance.now() - tPipelineStart).toFixed(0)}ms, save: ${(performance.now() - tSave).toFixed(0)}ms`);
  } catch (error) {
    reportProgressEnd();
    throw error;
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadReportAsPdf(data: ReportData, language: Language, filename?: string): Promise<void> {
  const html = generateReportHTML(data, language);
  const pdfFilename = filename
    ? filename.replace(/\.html$/i, ".pdf")
    : `career-anchor-report-${getLocalDateString(language)}.pdf`;
  await downloadHtmlAsPdf(html, pdfFilename);
}

export function downloadReport(data: ReportData, language: Language, filename?: string): void {
  const html = generateReportHTML(data, language);
  const pdfFilename = filename
    ? filename.replace(/\.html$/i, ".pdf")
    : `career-anchor-report-${getLocalDateString(language)}.pdf`;
  downloadHtmlAsPdf(html, pdfFilename);
}

export function storedResultToReportData(stored: StoredAssessmentResult, userName?: string): ReportData {
  const flatConflicts = stored.conflict_anchors || [];

  // DB stores raw scores; convert to standardized 0-100 for display
  const displayScores = standardizeScores({
    TF: stored.score_tf,
    GM: stored.score_gm,
    AU: stored.score_au,
    SE: stored.score_se,
    EC: stored.score_ec,
    SV: stored.score_sv,
    CH: stored.score_ch,
    LS: stored.score_ls,
  });

  return {
    mainAnchor: stored.main_anchor,
    scores: displayScores,
    stability: stored.stability,
    riskIndex: stored.risk_index,
    conflictAnchors: flatConflicts,
    createdAt: new Date(stored.created_at).toLocaleString(),
    questionCount: stored.question_count,
    completionTime: stored.completion_time_seconds || undefined,
    userName,
  };
}

// Export analytics report as CSV
export function generateAnalyticsCSV(
  assessments: StoredAssessmentResult[],
  language: Language,
  userMap?: Record<string, { full_name: string; email: string }>
): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  
  const headers = [
    isEn ? "Name" : isTW ? "姓名" : "姓名",
    isEn ? "Email" : isTW ? "信箱" : "邮箱",
    isEn ? "Core Advantage Anchor" : isTW ? "核心優勢錨點" : "核心优势锚点",
    isEn ? "TF Score" : isTW ? "技術/專業能力型" : "技术/专业能力型",
    isEn ? "GM Score" : isTW ? "管理型" : "管理型",
    isEn ? "AU Score" : isTW ? "自主/獨立型" : "自主/独立型",
    isEn ? "SE Score" : isTW ? "安全/穩定型" : "安全/稳定型",
    isEn ? "EC Score" : isTW ? "創業/創造型" : "创业/创造型",
    isEn ? "SV Score" : isTW ? "服務/奉獻型" : "服务/奉献型",
    isEn ? "CH Score" : isTW ? "挑戰型" : "挑战型",
    isEn ? "LS Score" : isTW ? "生活方式整合型" : "生活方式整合型",
    isEn ? "Clarity Index" : isTW ? "錨定清晰度" : "锚定清晰度",
    isEn ? "Stability" : isTW ? "穩定性" : "稳定性",
    isEn ? "Questions" : isTW ? "題目數" : "题目数",
    isEn ? "Completion Time (s)" : isTW ? "完成時間(秒)" : "完成时间(秒)",
    isEn ? "Created At" : isTW ? "建立時間" : "创建时间",
  ];
  
  const rows = assessments.map(a => {
    // DB stores raw scores; convert to standardized 0-100 for CSV export
    const standardized = standardizeScores({
      TF: a.score_tf, GM: a.score_gm, AU: a.score_au, SE: a.score_se,
      EC: a.score_ec, SV: a.score_sv, CH: a.score_ch, LS: a.score_ls,
    });
    return [
    userMap?.[a.user_id]?.full_name || a.user_id,
    userMap?.[a.user_id]?.email || "",
    getDimensionName(a.main_anchor, language),
    standardized.TF,
    standardized.GM,
    standardized.AU,
    standardized.SE,
    standardized.EC,
    standardized.SV,
    standardized.CH,
    standardized.LS,
    a.risk_index,
    getStabilityText(a.stability, language),
    a.question_count,
    a.completion_time_seconds || "",
    new Date(a.created_at).toLocaleString(),
  ];
  });
  
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => {
      const str = String(cell);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(","))
  ].join("\n");
  
  return csvContent;
}

export function downloadCSV(content: string, filename: string): void {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateAnalyticsXLS(
  assessments: StoredAssessmentResult[],
  language: Language,
  userMap?: Record<string, { full_name: string; email: string }>
): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const thStyle = `background:#1C2857;color:#ffffff;text-align:center;white-space:nowrap;padding:8px 12px;font-size:12px;font-weight:bold;border:1px solid #aaa;`;
  const tdStyle = `text-align:left;white-space:nowrap;padding:6px 12px;font-size:12px;border:1px solid #ddd;`;
  const headers = [
    { text: isEn ? "Name" : isTW ? "姓名" : "姓名", width: 130 },
    { text: isEn ? "Email" : isTW ? "信箱" : "邮箱", width: 220 },
    { text: isEn ? "Core Advantage Anchor" : isTW ? "核心優勢錨點" : "核心优势锚点", width: 160 },
    { text: "TF", width: 70 }, { text: "GM", width: 70 }, { text: "AU", width: 70 },
    { text: "SE", width: 70 }, { text: "EC", width: 70 }, { text: "SV", width: 70 },
    { text: "CH", width: 70 }, { text: "LS", width: 70 },
    { text: isEn ? "Clarity" : isTW ? "清晰度" : "清晰度", width: 90 },
    { text: isEn ? "Stability" : isTW ? "穩定性" : "稳定性", width: 90 },
    { text: isEn ? "Questions" : isTW ? "題數" : "题数", width: 80 },
    { text: isEn ? "Completion Time" : isTW ? "完成時間" : "完成时间", width: 110 },
    { text: isEn ? "Created At" : isTW ? "建立時間" : "创建时间", width: 170 },
  ];
  const headerRow = `<tr>${headers.map(h => `<th style="${thStyle}min-width:${h.width}px;">${h.text}</th>`).join('')}</tr>`;
  const bodyRows = assessments.map(a => {
    const standardized = standardizeScores({ TF: a.score_tf, GM: a.score_gm, AU: a.score_au, SE: a.score_se, EC: a.score_ec, SV: a.score_sv, CH: a.score_ch, LS: a.score_ls });
    const d = new Date(a.created_at);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    const cells = [
      userMap?.[a.user_id]?.full_name || a.user_id,
      userMap?.[a.user_id]?.email || "",
      getDimensionName(a.main_anchor, language),
      standardized.TF, standardized.GM, standardized.AU, standardized.SE,
      standardized.EC, standardized.SV, standardized.CH, standardized.LS,
      a.risk_index, getStabilityText(a.stability, language),
      a.question_count, a.completion_time_seconds || "", dateStr,
    ];
    return `<tr>${cells.map(c => `<td style="${tdStyle}">${c}</td>`).join('')}</tr>`;
  }).join('');
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset="utf-8"><meta name="ProgId" content="Excel.Sheet"><style>table{border-collapse:collapse;}</style></head><body><table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table></body></html>`;
}

export function downloadXLS(content: string, filename: string): void {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click();
  document.body.removeChild(link); URL.revokeObjectURL(url);
}

// =====================================================
// Comprehensive (Full) Report
// =====================================================

interface ComprehensiveReportData {
  mainAnchor: string;
  coreAdvantageAnchors?: string[];
  scores: Record<string, number>;
  stability: string;
  riskIndex: number;
  conflictAnchors?: string[];
  createdAt?: string;
  questionCount?: number;
  completionTime?: number;
  userName?: string;
  careerStage?: string | null;
  answers?: StoredAnswer[] | null;
}

const ANCHOR_CORE_MEANINGS: Record<string, Record<string, string>> = {
  "zh-CN": {
    TF: "在某个专业领域做到精深和卓越",
    GM: "带领团队、整合资源、对整体结果负责",
    AU: "自己决定工作方式、时间和节奏",
    SE: "稳定、可预测、有保障的职业环境",
    EC: "创造新事物、建立属于自己的事业",
    SV: "让工作与价值观一致，产生社会意义",
    CH: "持续挑战困难、征服复杂问题",
    LS: "工作与个人生活的整合与平衡",
  },
  "zh-TW": {
    TF: "在某個專業領域做到精深和卓越",
    GM: "帶領團隊、整合資源、對整體結果負責",
    AU: "自己決定工作方式、時間和節奏",
    SE: "穩定、可預測、有保障的職業環境",
    EC: "創造新事物、建立屬於自己的事業",
    SV: "讓工作與價值觀一致，產生社會意義",
    CH: "持續挑戰困難、征服複雜問題",
    LS: "工作與個人生活的整合與平衡",
  },
  en: {
    TF: "Achieving depth and excellence in a specialized field",
    GM: "Leading teams, integrating resources, being responsible for results",
    AU: "Deciding your own work methods, schedule, and pace",
    SE: "A stable, predictable, and secure career environment",
    EC: "Creating something new and building your own venture",
    SV: "Aligning work with values and creating social meaning",
    CH: "Continuously tackling difficulties and conquering complex problems",
    LS: "Integration and balance between work and personal life",
  },
};

const ANCHOR_IF_PRESENT: Record<string, Record<string, string>> = {
  "zh-CN": {
    TF: "你会更稳定、更有力量，感觉自己在做有价值的事",
    GM: "你会感到被需要、有掌控感，工作充满意义",
    AU: "你会更自在、更有创造力，工作不再是负担",
    SE: "你会安心、踏实，能专注于工作本身",
    EC: "你会充满热情、主动投入，每天都有动力",
    SV: "你会感到工作与内心一致，有持续的满足感",
    CH: "你会保持活力、不断成长，享受征服的成就感",
    LS: "你会更从容、更持久，不会被工作掏空",
  },
  "zh-TW": {
    TF: "你會更穩定、更有力量，感覺自己在做有價值的事",
    GM: "你會感到被需要、有掌控感，工作充滿意義",
    AU: "你會更自在、更有創造力，工作不再是負擔",
    SE: "你會安心、踏實，能專注於工作本身",
    EC: "你會充滿熱情、主動投入，每天都有動力",
    SV: "你會感到工作與內心一致，有持續的滿足感",
    CH: "你會保持活力、不斷成長，享受征服的成就感",
    LS: "你會更從容、更持久，不會被工作掏空",
  },
  en: {
    TF: "You'll feel more stable and empowered, knowing your work is valuable",
    GM: "You'll feel needed, in control, and find deep meaning in your work",
    AU: "You'll feel more at ease and creative—work won't feel like a burden",
    SE: "You'll feel secure and grounded, able to focus on the work itself",
    EC: "You'll feel passionate and proactive, energized every day",
    SV: "You'll feel aligned with your values, with lasting satisfaction",
    CH: "You'll stay energized, keep growing, and enjoy the thrill of achievement",
    LS: "You'll feel more at ease and sustainable—not drained by work",
  },
};

const ANCHOR_IF_ABSENT: Record<string, Record<string, string>> = {
  "zh-CN": {
    TF: "逐渐感到自己在「贬值」，失去专业尊严和成就感",
    GM: "感到无力、被边缘化，工作变得毫无意义",
    AU: "产生强烈的压抑和抗拒，想要逃离",
    SE: "持续焦虑不安，很难专注和发挥",
    EC: "感到窒息和无聊，失去工作热情",
    SV: "感到空虚和迷失，不知道为什么要工作",
    CH: "感到无聊、停滞，失去前进的动力",
    LS: "逐渐被掏空，工作和生活都难以为继",
  },
  "zh-TW": {
    TF: "逐漸感到自己在「貶值」，失去專業尊嚴和成就感",
    GM: "感到無力、被邊緣化，工作變得毫無意義",
    AU: "產生強烈的壓抑和抗拒，想要逃離",
    SE: "持續焦慮不安，很難專注和發揮",
    EC: "感到窒息和無聊，失去工作熱情",
    SV: "感到空虛和迷失，不知道為什麼要工作",
    CH: "感到無聊、停滯，失去前進的動力",
    LS: "逐漸被掏空，工作和生活都難以為繼",
  },
  en: {
    TF: "Gradually feel 'devalued,' losing professional dignity and achievement",
    GM: "Feel powerless and marginalized—work becomes meaningless",
    AU: "Feel strongly suppressed and resistant, wanting to escape",
    SE: "Constant anxiety, difficulty focusing and performing",
    EC: "Feel suffocated and bored, losing passion for work",
    SV: "Feel empty and lost, not knowing why you're working",
    CH: "Feel bored and stagnant, losing motivation to move forward",
    LS: "Gradually drained—both work and life become unsustainable",
  },
};

const getScoreLevelLabel = (score: number, language: Language): { label: string; color: string } => {
  if (language === "en") {
    if (score >= 80) return { label: "Core Advantage", color: "#dc2626" };
    if (score >= 65) return { label: "High-Sensitivity", color: "#d97706" };
    if (score >= 45) return { label: "Moderate", color: "#2563eb" };
    return { label: "Non-core", color: "#94a3b8" };
  }
  if (language === "zh-TW") {
    if (score >= 80) return { label: "核心優勢", color: "#dc2626" };
    if (score >= 65) return { label: "高敏感區", color: "#d97706" };
    if (score >= 45) return { label: "中度影響", color: "#2563eb" };
    return { label: "非核心", color: "#94a3b8" };
  }
  if (score >= 80) return { label: "核心优势", color: "#dc2626" };
  if (score >= 65) return { label: "高敏感区", color: "#d97706" };
  if (score >= 45) return { label: "中度影响", color: "#2563eb" };
  return { label: "非核心", color: "#94a3b8" };
};

export function generateComprehensiveReportHTML(data: ComprehensiveReportData, language: Language): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const langKey = language as string;

  // ---------- Labels ----------
  const labels = {
    title: isEn ? "Career Anchor Assessment — Comprehensive Report" : isTW ? "職業錨測評 — 完整版報告" : "职业锚测评 — 完整版报告",
    partOne: isEn ? "Score Overview" : isTW ? "得分概覽" : "得分概览",
    partTwo: isEn ? "Anchor Interpretation" : isTW ? "錨點詳解" : "锚点详解",
    partThree: isEn ? "Stage-Specific Development Guide" : isTW ? "階段性發展指引" : "阶段性发展指引",
    partFour: isEn ? "Action Recommendations" : isTW ? "執行建議" : "执行建议",
    partFive: isEn ? "Answer Details" : isTW ? "答題明細" : "答题明细",
    coreAdvantageAnchor: isEn ? "Core Advantage Anchor" : isTW ? "核心優勢錨點" : "核心优势锚点",
    noHighSens: isEn ? "Top Anchor" : isTW ? "最高分錨點" : "最高分锚点",
    stability: isEn ? "Stability" : isTW ? "穩定性" : "稳定性",
    riskIndex: isEn ? "Clarity Index" : isTW ? "錨定清晰度" : "锚定清晰度",
    coreNeed: isEn ? "Core Need" : isTW ? "核心需求" : "核心需求",
    ifPresent: isEn ? "If present long-term" : isTW ? "如果長期存在" : "如果长期存在",
    ifAbsent: isEn ? "If missing long-term" : isTW ? "如果長期缺失" : "如果长期缺失",
    conflictAnchors: isEn ? "Conflicting Anchors" : isTW ? "衝突錨" : "冲突锚",
    conflictNote: isEn ? "You care about two things that are structurally hard to satisfy simultaneously long-term." : isTW ? "你同時在意兩種長期很難同時滿足的東西。" : "你同时在意两种长期很难同时满足的东西。这不代表你不够好，而是任何人长期面对这种张力都会消耗。",
    scoreLevelLabel: isEn ? "Score Level" : isTW ? "分數區間" : "分数区间",
    codeReference: isEn ? "Dimension Code Reference" : isTW ? "維度代碼說明" : "维度代码说明",
    generated: isEn ? "Generated" : isTW ? "生成時間" : "生成时间",
    questions: isEn ? "Questions" : isTW ? "題數" : "题数",
    duration: isEn ? "Duration" : isTW ? "用時" : "用时",
    stageLabel: isEn ? "Career Stage" : isTW ? "職業階段" : "职业阶段",
    stageMeaning: isEn ? "What this means at your current stage" : isTW ? "在你當前階段的含義" : "在你当前阶段的含义",
    stageChars: isEn ? "Typical characteristics" : isTW ? "典型表現" : "典型表现",
    stageDev: isEn ? "Development advice" : isTW ? "發展建議" : "发展建议",
    stageRisk: isEn ? "Watch out for" : isTW ? "需要警惕" : "需要警惕",
    learning: isEn ? "Learning Direction" : isTW ? "學習方向" : "学习方向",
    careerPath: isEn ? "Career Paths" : isTW ? "職業路徑" : "职业路径",
    verification: isEn ? "Verification Steps" : isTW ? "驗證方式" : "验证方式",
    tradeoffs: isEn ? "Trade-offs" : isTW ? "取捨" : "取舍",
    tradeoffNote: isEn ? "This is not loss, but focus. Knowing what you're giving up is more powerful than vaguely wanting everything." : isTW ? "這不是損失，而是聚焦。明確知道自己放棄什麼，比模糊地什麼都想要更有力量。" : "这不是损失，而是聚焦。明确知道自己放弃什么，比模糊地什么都想要更有力量。",
    timeline: isEn ? "Timeline" : isTW ? "時間跨度" : "时间跨度",
    risk: isEn ? "Risk Level" : isTW ? "風險等級" : "风险等级",
    recommended: isEn ? "Recommended" : isTW ? "推薦" : "推荐",
    question: isEn ? "Question" : isTW ? "題目" : "题目",
    answer: isEn ? "Answer" : isTW ? "回答" : "回答",
    dimension: isEn ? "Dimension" : isTW ? "維度" : "维度",
    score: isEn ? "Score" : isTW ? "得分" : "得分",
    stageEntry: isEn ? "Early Career (0-5 years)" : isTW ? "職業初期（0-5年）" : "职业初期（0-5年）",
    stageMid: isEn ? "Mid-Career (6-10 years)" : isTW ? "職業中期（6-10年）" : "职业中期（6-10年）",
    stageSenior: isEn ? "Senior (10+ years)" : isTW ? "資深/高管" : "资深/高管",
    stageExec: isEn ? "Executive / Entrepreneur" : isTW ? "高管/創業者" : "高管/创业者",
  };

  const compCoreAnchors = data.coreAdvantageAnchors?.length ? data.coreAdvantageAnchors : getCoreAdvantageAnchors(data.scores);
  const compHasCoreAdvantage = compCoreAnchors.length > 0;
  const compDisplayAnchor = compCoreAnchors[0] || data.mainAnchor;
  const mainAnchorName = getDimensionName(compDisplayAnchor, language);
  const compAnchorLabel = compHasCoreAdvantage ? labels.coreAdvantageAnchor : labels.noHighSens;
  const sortedScores = Object.entries(data.scores).sort(([, a], [, b]) => b - a);
  const topScore = sortedScores.length > 0 ? sortedScores[0][1] : 1;

  // Meta info
  const metaParts: string[] = [];
  if (data.questionCount) metaParts.push(`${labels.questions}: ${data.questionCount}`);
  if (data.completionTime) {
    const mins = Math.floor(data.completionTime / 60);
    const secs = data.completionTime % 60;
    metaParts.push(`${labels.duration}: ${mins}${isEn ? "m" : "分"}${secs}${isEn ? "s" : "秒"}`);
  }
  metaParts.push(`${labels.generated}: ${data.createdAt || new Date().toLocaleString(isEn ? "en-US" : "zh-CN")}`);

  // ---------- Part 1: Score Bars with Constraint Level ----------
  const scoreRows = sortedScores.map(([code, score]) => {
    const level = getScoreLevelLabel(score, language);
    return `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #E9ECEF; font-weight:600; font-size:13px; color:#1a1a2e; vertical-align:middle;">${getDimensionName(code, language)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #E9ECEF; width:200px; vertical-align:middle;">
          <div style="height:8px; background:#E9ECEF; border-radius:4px; overflow:hidden;">
            <div class="${getZoneSemClass(score)}" style="width:${topScore > 0 ? Math.min((score / topScore) * 100, 100) : 0}%; height:100%; background:var(--cpc-bg); border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:10px 12px; border-bottom:1px solid #E9ECEF; text-align:right; font-weight:700; width:50px; vertical-align:middle; font-family:'Montserrat',sans-serif;">${Math.round(score)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #E9ECEF; width:90px; vertical-align:middle;">
          <span class="cpc-pill cpc-pill-sm cpc-sem ${getZoneSemSoftClass(score)}"><span class="cpc-pill-text">${level.label}</span></span>
        </td>
      </tr>
    `;
  }).join("");

  // ---------- Part 2: Anchor Interpretation ----------
  const coreNeed = ANCHOR_CORE_MEANINGS[langKey]?.[compDisplayAnchor] || ANCHOR_CORE_MEANINGS["zh-CN"][compDisplayAnchor] || "";
  const ifPresent = ANCHOR_IF_PRESENT[langKey]?.[compDisplayAnchor] || ANCHOR_IF_PRESENT["zh-CN"][compDisplayAnchor] || "";
  const ifAbsent = ANCHOR_IF_ABSENT[langKey]?.[compDisplayAnchor] || ANCHOR_IF_ABSENT["zh-CN"][compDisplayAnchor] || "";

  const conflictSection = data.conflictAnchors && data.conflictAnchors.length > 0
    ? `
      <div style="margin-top:20px; padding:16px; background:#fffbeb; border-radius:8px; border-left:4px solid #f59e0b;">
        <h4 style="margin:0 0 8px; font-size:14px; color:#92400e;">${labels.conflictAnchors}</h4>
        <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;">
          ${data.conflictAnchors.map(code => `<span class="cpc-pill cpc-pill-sm cpc-sem cpc-sem-warn"><span class="cpc-pill-text">${getDimensionName(code, language)}</span></span>`).join("")}
        </div>
        <p style="margin:0; font-size:13px; color:#78350f; line-height:1.6;">${labels.conflictNote}</p>
      </div>
    `
    : "";

  // ---------- Part 3: Stage Interpretation ----------
  let stageSection = "";
  if (data.careerStage && data.careerStage !== "hr") {
    const validStage = data.careerStage as CareerStage;
    const mainScore = data.scores[compDisplayAnchor] || 0;
    const stageInterp = getStageInterpretation(compDisplayAnchor, validStage, mainScore);

    const stageNameMap: Record<string, string> = {
      entry: labels.stageEntry,
      mid: labels.stageMid,
      senior: labels.stageSenior,
      executive: labels.stageExec,
    };
    const stageName = stageNameMap[validStage] || validStage;

    if (stageInterp) {
      const chars = (stageInterp.characteristics[langKey] || stageInterp.characteristics["zh-CN"] || []).map(
        (item: string) => `<li style="margin-bottom:4px;">${item}</li>`
      ).join("");

      stageSection = `
        <div style="margin-top:32px; page-break-before:auto;">
          <div class="cpc-part-header">
            <span class="cpc-part-number">${partLabel(3, language)}</span>
            <span class="cpc-part-title">${labels.partThree}</span>
          </div>
          <div style="padding:24px; background:linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%); border-radius:12px; color:#fff;">
            <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.5); font-weight:600; margin-bottom:4px;">${compAnchorLabel} · ${stageName}</div>
            <div style="font-size:22px; font-weight:700; margin-bottom:16px;">${mainAnchorName}</div>
            <div style="padding:12px; background:rgba(255,255,255,0.1); border-radius:8px; margin-bottom:12px;">
              <div style="font-size:11px; opacity:0.6; margin-bottom:4px;">${labels.stageMeaning}</div>
              <div style="font-size:14px; line-height:1.8;">${stageInterp.meaning[langKey] || stageInterp.meaning["zh-CN"]}</div>
            </div>
            <div style="padding:12px; background:rgba(255,255,255,0.1); border-radius:8px; margin-bottom:12px;">
              <div style="font-size:11px; opacity:0.6; margin-bottom:6px;">${labels.stageChars}</div>
              <ul style="margin:0; padding-left:18px; font-size:14px; line-height:1.8;">${chars}</ul>
            </div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <div style="flex:1; min-width:200px; padding:12px; background:rgba(16,185,129,0.15); border-radius:8px;">
                <div style="font-size:11px; color:#6ee7b7; margin-bottom:4px;">${labels.stageDev}</div>
                <div style="font-size:14px; line-height:1.8;">${stageInterp.development[langKey] || stageInterp.development["zh-CN"]}</div>
              </div>
              <div style="flex:1; min-width:200px; padding:12px; background:rgba(239,68,68,0.15); border-radius:8px;">
                <div style="font-size:11px; color:#fca5a5; margin-bottom:4px;">${labels.stageRisk}</div>
                <div style="font-size:14px; line-height:1.8;">${stageInterp.risk[langKey] || stageInterp.risk["zh-CN"]}</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  // ---------- Part 4: Action Recommendations ----------
  const actionPlan = getActionPlan(compDisplayAnchor || "TF", language);

  const learningHtml = actionPlan.learning.map((item, index) => `
    <div style="padding:20px; background:#f8f9fa; border-radius:12px; border:1px solid #E9ECEF; margin-bottom:10px;">
      <div style="display:flex; gap:10px; align-items:flex-start;">
        <span style="flex-shrink:0; width:24px; height:24px; border-radius:50%; background:#1C2857; color:#fff; font-size:11px; font-weight:700; display:inline-block; text-align:center; vertical-align:middle; line-height:1; box-sizing:border-box; padding:6px 0 7px; font-family:'Montserrat',sans-serif;">${index + 1}</span>
        <div>
          <div style="font-weight:600; font-size:14px; color:#1a1a2e; margin-bottom:4px;">${item.title}</div>
          <div style="font-size:14px; color:#4a5568; line-height:1.8;">${item.description}</div>
          ${item.resources ? `<div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">${item.resources.map(r => `<span class="cpc-pill cpc-pill-sm cpc-sem cpc-sem-core-soft"><span class="cpc-pill-text">${r}</span></span>`).join("")}</div>` : ""}
        </div>
      </div>
    </div>
  `).join("");

  const pathsHtml = actionPlan.paths.map(path => `
    <div style="padding:20px; background:${path.recommended ? '#faf5ff' : '#f8f9fa'}; border-radius:12px; border:1px solid ${path.recommended ? '#e9d5ff' : '#E9ECEF'}; margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-weight:600; font-size:14px; color:#1a1a2e;">${path.title}</div>
        ${path.recommended ? `<span class="cpc-pill cpc-pill-sm cpc-sem cpc-sem-featured"><span class="cpc-pill-text">${labels.recommended}</span></span>` : ""}
      </div>
      <div style="font-size:14px; color:#4a5568; line-height:1.8; margin-bottom:8px;">${path.description}</div>
      <div style="display:flex; gap:16px; font-size:12px;">
        <span style="color:#94a3b8;">${labels.timeline}: <strong style="color:#334155;">${path.timeline}</strong></span>
        <span style="color:#94a3b8;">${labels.risk}: <strong style="color:${path.risk === '高' || path.risk === 'High' ? '#dc2626' : path.risk === '中' || path.risk === 'Medium' ? '#d97706' : '#059669'};">${path.risk}</strong></span>
      </div>
    </div>
  `).join("");

  const verificationHtml = actionPlan.verification.map((step, index) => `
    <div style="display:flex; gap:10px; padding:14px; background:#ecfdf5; border-radius:12px; border:1px solid #d1fae5; margin-bottom:8px;">
      <span style="flex-shrink:0; width:22px; height:22px; border-radius:50%; background:#d1fae5; color:#047857; font-size:11px; font-weight:700; display:inline-block; text-align:center; vertical-align:middle; line-height:1; box-sizing:border-box; padding:5px 0 6px; font-family:'Montserrat',sans-serif;">${index + 1}</span>
      <div>
        <div style="font-size:14px; font-weight:500; color:#1a1a2e;">${step.action}</div>
        <div style="font-size:14px; color:#4a5568; margin-top:2px; line-height:1.8;">${step.purpose}</div>
      </div>
    </div>
  `).join("");

  const tradeoffsHtml = actionPlan.tradeoffs.length > 0 ? `
    <div style="margin-top:20px; padding:20px; background:#fffbeb; border-radius:12px; border:1px solid #fde68a;">
      <h4 style="margin:0 0 8px; font-size:15px; font-weight:700; color:#92400e;">${labels.tradeoffs}</h4>
      <ul style="margin:0 0 10px; padding-left:18px; font-size:14px; color:#78350f; line-height:1.8;">
        ${actionPlan.tradeoffs.map(t => `<li>${t}</li>`).join("")}
      </ul>
      <p style="margin:0; font-size:14px; font-weight:600; color:#78350f;">${labels.tradeoffNote}</p>
    </div>
  ` : "";

  // ---------- Part 5: Answer Details ----------
  let answersSection = "";
  if (data.answers && data.answers.length > 0) {
    const likertLabels = isEn
      ? ["Not true", "Slightly true", "Mostly true", "Very true"]
      : isTW
        ? ["完全不符合", "有點符合", "比較符合", "非常符合"]
        : ["完全不符合", "有点符合", "比较符合", "非常符合"];

    const answerRows = data.answers.map((answer, index) => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #E9ECEF; font-size:12px; color:#94a3b8; text-align:center; width:40px; font-family:'Montserrat',sans-serif;">${index + 1}</td>
        <td style="padding:8px; border-bottom:1px solid #E9ECEF; font-size:12px; color:#1a1a2e;">${answer.questionId}</td>
        <td style="padding:8px; border-bottom:1px solid #E9ECEF; font-size:12px; color:#1a1a2e;">${getDimensionName(answer.dimension, language)}</td>
        <td style="padding:8px; border-bottom:1px solid #E9ECEF; font-size:12px; color:#1a1a2e; text-align:center;">${likertLabels[answer.value] || answer.value}</td>
        <td style="padding:8px; border-bottom:1px solid #E9ECEF; font-size:12px; color:#1a1a2e; text-align:center;">${answer.weight}</td>
      </tr>
    `).join("");

    answersSection = `
      <div style="margin-top:32px; page-break-before:auto;">
        <div class="cpc-part-header">
          <span class="cpc-part-number">${partLabel(5, language)}</span>
          <span class="cpc-part-title">${labels.partFive}</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8f9fa;">
              <th style="padding:8px; text-align:center; font-size:12px; color:#4a5568; border-bottom:2px solid #E9ECEF; width:40px;">#</th>
              <th style="padding:8px; text-align:left; font-size:12px; color:#4a5568; border-bottom:2px solid #E9ECEF;">ID</th>
              <th style="padding:8px; text-align:left; font-size:12px; color:#4a5568; border-bottom:2px solid #E9ECEF;">${labels.dimension}</th>
              <th style="padding:8px; text-align:center; font-size:12px; color:#4a5568; border-bottom:2px solid #E9ECEF;">${labels.answer}</th>
              <th style="padding:8px; text-align:center; font-size:12px; color:#4a5568; border-bottom:2px solid #E9ECEF;">W</th>
            </tr>
          </thead>
          <tbody>${answerRows}</tbody>
        </table>
      </div>
    `;
  }

  // Dimension code legend for reader reference
  const dimensionLegend = sortedScores.map(([code]) => {
    const fullName = getDimensionName(code, language);
    return `<div><strong style="color:#1C2857;font-family:'Montserrat',sans-serif;">${code}</strong> — ${fullName}</div>`;
  }).join("");

  // ---------- Assemble Full Report ----------
  return `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'zh'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.title}</title>
  <style>${CPC_REPORT_CSS}</style>
</head>
<body>
<div class="cpc-report-root">
  <!-- Header -->
  <header style="text-align:center; margin-bottom:36px; padding-bottom:20px; border-bottom:2px solid #1C2857;">
    <h1 style="margin:0 0 6px; font-size:24px; font-weight:700; color:#1C2857;">${labels.title}</h1>
    ${data.userName ? `<p style="margin:8px 0 0; font-size:15px; color:#1a1a2e; font-weight:600;">${data.userName}</p>` : ""}
    <p style="margin:4px 0 0; font-size:11px; color:#94a3b8;">${metaParts.join(" | ")}</p>
  </header>

  <!-- Summary Cards -->
  <section data-keep-together style="display:flex; gap:14px; flex-wrap:wrap; margin-bottom:28px;">
    <div style="flex:2; min-width:200px; padding:20px; background:linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%); border-radius:12px; color:#fff;">
      <div style="font-size:12px; opacity:0.7;">${compAnchorLabel}</div>
      <div style="font-size:22px; font-weight:700; margin-top:4px;">${mainAnchorName}</div>
      ${compHasCoreAdvantage ? `<div style="font-size:28px; font-weight:800; margin-top:6px;">${Math.round(data.scores[compDisplayAnchor] || 0)}</div>` : `<div style="font-size:13px; opacity:0.7; margin-top:6px;">${isEn ? 'Structural combination state' : isTW ? '結構性組合狀態' : '结构性组合状态'}</div>`}
    </div>
    <div style="flex:1; min-width:120px; padding:16px; background:#f0fdf4; border-radius:12px; text-align:center;">
      <div style="font-size:12px; color:#166534;">${labels.stability}</div>
      <div style="font-size:20px; font-weight:700; color:#15803d; margin-top:6px;">${getStabilityText(data.stability, language)}</div>
    </div>
    <div style="flex:1; min-width:120px; padding:16px; background:${data.riskIndex > 50 ? '#fef2f2' : data.riskIndex > 25 ? '#fffbeb' : '#f0fdf4'}; border-radius:12px; text-align:center;">
      <div style="font-size:12px; color:${data.riskIndex > 50 ? '#991b1b' : data.riskIndex > 25 ? '#92400e' : '#166534'};">${labels.riskIndex}</div>
      <div style="font-size:20px; font-weight:700; color:${data.riskIndex > 50 ? '#dc2626' : data.riskIndex > 25 ? '#d97706' : '#15803d'}; margin-top:6px;">${data.riskIndex.toFixed(0)}</div>
    </div>
  </section>

  <!-- Part 1: Score Overview -->
  <section style="margin-bottom:32px;">
    <div class="cpc-part-header">
      <span class="cpc-part-number">${partLabel(1, language)}</span>
      <span class="cpc-part-title">${labels.partOne}</span>
    </div>
    <table style="width:100%; border-collapse:collapse;">
      <tbody>${scoreRows}</tbody>
    </table>
    <div style="margin-top:14px; padding:16px; background:#f8f9fa; border-radius:12px; border:1px solid #E9ECEF;">
      <div style="font-size:11px; color:#64748b; margin-bottom:6px; font-weight:600;">${labels.codeReference}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px 24px; font-size:12px; color:#1a1a2e;">
        ${dimensionLegend}
      </div>
    </div>
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- Part 2: Anchor Interpretation -->
  <section style="margin-bottom:32px;">
    <div class="cpc-part-header">
      <span class="cpc-part-number">${partLabel(2, language)}</span>
      <span class="cpc-part-title">${labels.partTwo}</span>
    </div>
    <div data-keep-together style="padding:20px; background:linear-gradient(135deg, #1e3a5f, #2d5a8c); border-radius:12px; color:white;">
      <div style="font-size:20px; font-weight:700; margin-bottom:16px;">${mainAnchorName}</div>
      <div style="padding:12px; background:rgba(255,255,255,0.1); border-radius:8px; margin-bottom:12px;">
        <div style="font-size:11px; opacity:0.6; margin-bottom:4px;">${labels.coreNeed}</div>
        <div style="font-size:14px; line-height:1.7;">${coreNeed}</div>
      </div>
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px; padding:12px; background:rgba(16,185,129,0.15); border-radius:8px;">
          <div style="font-size:11px; color:#6ee7b7; margin-bottom:4px;">${labels.ifPresent}</div>
          <div style="font-size:13px; line-height:1.7;">${ifPresent}</div>
        </div>
        <div style="flex:1; min-width:200px; padding:12px; background:rgba(239,68,68,0.15); border-radius:8px;">
          <div style="font-size:11px; color:#fca5a5; margin-bottom:4px;">${labels.ifAbsent}</div>
          <div style="font-size:13px; line-height:1.7;">${ifAbsent}</div>
        </div>
      </div>
    </div>
    ${conflictSection}
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  ${stageSection}

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- Part 4: Action Recommendations -->
  <section style="margin-top:32px;">
    <div class="cpc-part-header">
      <span class="cpc-part-number">${partLabel(4, language)}</span>
      <span class="cpc-part-title">${labels.partFour}</span>
    </div>
    
    <div class="cpc-section-header-compact"><span class="cpc-section-header-compact-title">${labels.learning}</span></div>
    ${learningHtml}

    <div class="cpc-section-header-compact"><span class="cpc-section-header-compact-title">${labels.careerPath}</span></div>
    ${pathsHtml}

    <div class="cpc-section-header-compact"><span class="cpc-section-header-compact-title">${labels.verification}</span></div>
    ${verificationHtml}

    ${tradeoffsHtml}
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  ${answersSection}

  <!-- Footer -->
  <footer style="margin-top:48px; padding-top:20px; padding-bottom:20px; border-top:2px solid #E9ECEF; text-align:center; color:#94a3b8; font-size:11px;">
    <p style="margin:0;">SCPC &mdash; Strategic Career Planning Consultant</p>
  </footer>
</div>
</body>
</html>
  `.trim();
}

export async function downloadComprehensiveReport(
  stored: StoredAssessmentResult,
  language: Language,
  userName?: string,
  careerStage?: string | null
): void {
  const displayScores = standardizeScores({
    TF: stored.score_tf, GM: stored.score_gm, AU: stored.score_au, SE: stored.score_se,
    EC: stored.score_ec, SV: stored.score_sv, CH: stored.score_ch, LS: stored.score_ls,
  });

  const reportData: ComprehensiveReportData = {
    mainAnchor: stored.main_anchor,
    scores: displayScores,
    stability: stored.stability,
    riskIndex: stored.risk_index,
    conflictAnchors: stored.conflict_anchors || [],
    createdAt: new Date(stored.created_at).toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN"),
    questionCount: stored.question_count,
    completionTime: stored.completion_time_seconds || undefined,
    userName,
    careerStage,
    answers: stored.answers as StoredAnswer[] | null,
  };

  const html = generateComprehensiveReportHTML(reportData, language);
  const pdfFilename = `comprehensive-report-${stored.id.slice(0, 8)}-${getLocalDateString(language)}.pdf`;
  await downloadHtmlAsPdfWithBreaks(html, pdfFilename);
}

/**
 * Generate a comprehensive PDF report from display-ready assessment data.
 * Use when a StoredAssessmentResult is not available (e.g. from sessionStorage).
 */
// =====================================================
// Professional PDF Export with Cover Page & Page Headers/Footers
// =====================================================

export interface ReportWithCoverOptions {
  reportType: ReportCoverType;
  userName: string;
  workExperienceYears: number | null;
  careerStage: string;
  reportVersion: string;
  language: Language;
  userId: string;
  assessmentDate?: string;
  reportNumber?: string;
}

/**
 * Renders a professional PDF with:
 * - Page 1: Full-page cover (gradient background, user info grid, report number)
 * - Pages 2+: Report body with page-break-aware sectioning
 * - Header/footer on every body page (report number, page title, copyright)
 */
// Retry wrapper for dynamic imports — network hiccups can cause intermittent failures
async function importWithRetry<T>(loader: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await loader();
    } catch (loadError) {
      if (attempt === retries) throw loadError;
      console.warn(`[Report PDF] Dynamic import failed (attempt ${attempt + 1}/${retries + 1}), retrying...`, loadError);
      await new Promise(resolve => setTimeout(resolve, 800 * (attempt + 1)));
    }
  }
  throw new Error("Dynamic import exhausted all retries");
}

// Detect max canvas area supported by current browser (conservative estimates)
function getMaxCanvasArea(): number {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isIOS) return 4096 * 4096;             // ~16MP — iOS WebKit hard limit
  if (isSafari) return 16384 * 16384 * 0.25;  // Safari macOS — generous but capped
  return 16384 * 16384;                        // Chrome/Firefox — effectively unlimited
}

// Trigger blob download with maximum browser compatibility
export function downloadBlob(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);

  // Guard: Safari on iOS sometimes fails with anchor.click()
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // iOS Safari: open in new tab, user can long-press to save
    const newWindow = window.open(blobUrl, "_blank");
    if (!newWindow) {
      // Popup blocked — try anchor approach anyway
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
  } else {
    // Desktop / Android: anchor click is most reliable
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
}

export async function downloadReportWithCover(
  bodyHtml: string,
  options: ReportWithCoverOptions,
  filename: string,
  returnBlobOnly?: boolean,
  progressOffset = 0,
): Promise<Blob | void> {
  const lang = useLanguage.getState().language;
  const emitProgress = !returnBlobOnly;
  // progressOffset: when called from downloadV3ReportAsPdf, generation phase already
  // used 0-30%, so we map our 0-100% range into (offset..100%).
  const p = (localPct: number) => progressOffset + ((100 - progressOffset) * localPct) / 100;
  if (emitProgress && progressOffset === 0) reportProgressStart(getStepLabel("loading", lang));

  const html2canvas = (await importWithRetry(() => import("html2canvas"))).default;
  const { jsPDF } = await importWithRetry(() => import("jspdf"));
  if (emitProgress) reportProgressUpdate(p(5), getStepLabel("loading", lang));

  const tPipelineStart = performance.now();
  const reportNumber = options.reportNumber || generateReportNumber(options.userId);
  const assessmentDate = options.assessmentDate || new Date().toLocaleDateString(
    options.language === "en" ? "en-US" : options.language === "zh-TW" ? "zh-TW" : "zh-CN"
  );

  const coverHtml = generateCoverHTML({
    reportType: options.reportType,
    userName: options.userName,
    workExperienceYears: options.workExperienceYears,
    careerStage: options.careerStage,
    assessmentDate,
    reportVersion: options.reportVersion,
    reportNumber,
    language: options.language as "en" | "zh-TW" | "zh-CN",
  });

  const reportTitleMap: Record<ReportCoverType, Record<Language, string>> = {
    career_anchor: { en: "Career Anchor Report", "zh-TW": "職業錨報告", "zh-CN": "职业锚报告" },
    ideal_card: { en: "Espresso Card Report", "zh-TW": "理想人生卡報告", "zh-CN": "理想人生卡报告" },
    fusion: { en: "Comprehensive Analysis Report", "zh-TW": "綜合分析報告", "zh-CN": "综合分析报告" },
  };
  const pageTitle = reportTitleMap[options.reportType][options.language];
  const { header: headerHtml, footer: footerHtml } = generatePageHeaderFooter(reportNumber, pageTitle);

  // ---- Step 1: Render cover page ----
  const coverContainer = document.createElement("div");
  coverContainer.innerHTML = coverHtml;
  coverContainer.style.width = "794px"; // A4 at 96dpi
  coverContainer.style.position = "absolute";
  coverContainer.style.left = "-9999px";
  coverContainer.style.top = "0";
  coverContainer.style.background = "#faf8f5"; // Match V4.2 ivory/cream cover
  document.body.appendChild(coverContainer);

  // ---- Step 2: Render body with header/footer wrappers ----
  const bodyContainer = document.createElement("div");
  bodyContainer.innerHTML = bodyHtml;
  bodyContainer.style.width = "800px";
  bodyContainer.style.position = "absolute";
  bodyContainer.style.left = "-9999px";
  bodyContainer.style.top = "0";
  bodyContainer.style.background = "#ffffff";
  document.body.appendChild(bodyContainer);

  try {
    // Remove web-only elements (e.g., hover hints) before PDF capture
    bodyContainer.querySelectorAll("[data-screen-only]").forEach(el => el.remove());

    // Capture cover as a single image
    // Fusion/combined reports are ~20+ pages → 70M+ pixels at scale 2.
    // Lower scale prevents browser GPU timeout while keeping acceptable quality.
    let renderScale = options.reportType === "fusion" ? 1.5 : 2;

    // ── Canvas size guard: auto-reduce scale if estimated area exceeds browser limit ──
    const estimatedBodyHeight = bodyContainer.scrollHeight || bodyContainer.offsetHeight || 5000;
    const bodyWidthPx = 800;
    const maxArea = getMaxCanvasArea();
    const estimatedArea = (bodyWidthPx * renderScale) * (estimatedBodyHeight * renderScale);
    if (estimatedArea > maxArea * 0.85) { // 85% threshold for safety margin
      const safeScale = Math.sqrt((maxArea * 0.8) / (bodyWidthPx * estimatedBodyHeight));
      const clampedScale = Math.max(1, Math.min(safeScale, renderScale));
      if (clampedScale < renderScale) {
        console.warn(`[Report PDF] Reducing render scale from ${renderScale} to ${clampedScale.toFixed(2)} (canvas would exceed browser limit: ${Math.round(estimatedArea / 1e6)}MP > ${Math.round(maxArea / 1e6)}MP)`);
        renderScale = clampedScale;
      }
    }

    if (emitProgress) reportProgressUpdate(p(8), getStepLabel("fonts", lang));
    // ── Ensure Montserrat web font is fully loaded before html2canvas ──
    // The @import inside <style> injected via innerHTML may not trigger font
    // discovery fast enough. Adding a <link> to document.head and waiting for
    // its load event guarantees the @font-face rules exist before we call
    // document.fonts.ready.
    const fontUrl = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap";
    const existingFontLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (!existingFontLink) {
      const fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = fontUrl;
      document.head.appendChild(fontLink);
      await new Promise<void>((resolve) => {
        fontLink.onload = () => resolve();
        fontLink.onerror = () => resolve();
        setTimeout(() => resolve(), 2000);
      });
    }
    // Force the browser to realize it needs Montserrat in these containers
    // by adding invisible text nodes that reference the font.
    const fontProbe = document.createElement("span");
    fontProbe.style.fontFamily = "'Montserrat', sans-serif";
    fontProbe.style.position = "absolute";
    fontProbe.style.visibility = "hidden";
    fontProbe.textContent = "ABCabc123";
    bodyContainer.appendChild(fontProbe);
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    fontProbe.remove();

    // Collect break-point positions from body BEFORE rendering (DOM queries
    // must happen while the container is still in its original layout state)
    const bodyRect = bodyContainer.getBoundingClientRect();
    const markers = bodyContainer.querySelectorAll("[data-page-break]");
    const breakPixels: number[] = [];
    markers.forEach(marker => {
      const rect = (marker as HTMLElement).getBoundingClientRect();
      breakPixels.push(rect.top - bodyRect.top);
    });

    // Render cover and body in parallel — saves ~30-50% of the render phase
    if (emitProgress) reportProgressUpdate(p(12), getStepLabel("rendering", lang));
    const tRender = performance.now();
    const [coverCanvas, bodyCanvas] = await Promise.all([
      html2canvas(coverContainer, {
        scale: renderScale,
        useCORS: true,
        logging: false,
        width: 794,
        backgroundColor: "#faf8f5",
      }),
      html2canvas(bodyContainer, {
        scale: renderScale,
        useCORS: true,
        logging: false,
        width: 800,
        backgroundColor: "#ffffff",
      }),
    ]);
    console.log(`[Report PDF] Render phase: ${(performance.now() - tRender).toFixed(0)}ms`);

    // Validate canvases are not empty
    if (coverCanvas.width === 0 || coverCanvas.height === 0) {
      throw new Error("Cover canvas rendered with zero dimensions");
    }
    if (bodyCanvas.width === 0 || bodyCanvas.height === 0) {
      throw new Error("Body canvas rendered with zero dimensions");
    }
    console.log("[Report PDF] Canvas captured", {
      cover: `${coverCanvas.width}x${coverCanvas.height}`,
      body: `${bodyCanvas.width}x${bodyCanvas.height}`,
      bodyPixels: `${Math.round(bodyCanvas.width * bodyCanvas.height / 1e6)}MP`,
      scale: renderScale,
    });

    // Precompute row data for O(1) per-row lookups during pagination
    if (emitProgress) reportProgressUpdate(p(50), getStepLabel("analyzing", lang));
    const tPrecompute = performance.now();
    const bodyRowData = precomputeCanvasRowData(bodyCanvas);
    console.log(`[Report PDF] Row precompute: ${(performance.now() - tPrecompute).toFixed(0)}ms, rows: ${bodyCanvas.height}`);
    if (emitProgress) reportProgressUpdate(p(55), getStepLabel("paginating", lang));

    // ---- Step 3: Assemble PDF (with deflate compression) ----
    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // --- Cover page ---
    const coverEncoded = await encodeCanvasImage(coverCanvas, 0.95);
    const coverImgHeight = (coverCanvas.height * pdfWidth) / coverCanvas.width;
    pdf.addImage(coverEncoded.imageData, coverEncoded.format, 0, 0, pdfWidth, Math.min(coverImgHeight, pdfHeight));

    // --- Body pages ---
    const marginXMm = 12;
    const headerFooterReserveMm = 14; // space reserved for header + footer text
    const imgWidth = pdfWidth - marginXMm * 2;
    const imgHeight = (bodyCanvas.height * imgWidth) / bodyCanvas.width;

    const containerHeight = bodyRect.height || 1;
    const pxToMm = imgHeight / containerHeight;
    const breaksMm = breakPixels.map(px => px * pxToMm).sort((a, b) => a - b);
    const minFillMm = pdfHeight * 0.35;
    const bodyTopMarginMm = 8;
    const bodyBottomMarginMm = 6;

    // Hard ceiling: content image placed at (bodyTopMarginMm + 7)mm on PDF;
    // footer divider drawn at (pdfHeight - bodyBottomMarginMm - 4)mm.
    // Content must never extend past the footer divider.
    const contentTopMm = bodyTopMarginMm + 7;
    const footerLineMm = pdfHeight - bodyBottomMarginMm - 4;
    const hardMaxSliceMm = footerLineMm - contentTopMm; // ~272mm

    // Collect keep-together zones (Iron Rule #1)
    const keepTogetherZones = collectKeepTogetherZones(bodyContainer, bodyRect, pxToMm);

    // Collect text block line info for DOM-level line-boundary snapping.
    // When a page cut falls inside a multi-line text block, the snap function
    // aligns it to an inter-line gap using CSS line-height — no pixel scanning.
    const textLineInfos = collectTextLineCutInfo(bodyContainer, bodyRect, pxToMm);

    let pageTopMm = 0;
    let bodyPageIndex = 0;
    const tPagination = performance.now();

    while (pageTopMm < imgHeight - 1) {
      const usableHeight = pdfHeight - bodyTopMarginMm - bodyBottomMarginMm - headerFooterReserveMm;
      const maxBottom = pageTopMm + usableHeight;

      // Find last suitable break point on this page
      let nextPageTop = maxBottom;
      for (const breakPoint of breaksMm) {
        if (breakPoint <= pageTopMm) continue;
        if (breakPoint > maxBottom) break;
        if (breakPoint - pageTopMm >= minFillMm) {
          nextPageTop = breakPoint;
        }
      }

      // Hard cap for this page — content must not overflow into footer area.
      const hardMaxMm = pageTopMm + hardMaxSliceMm;
      const hardMaxPx = Math.floor((hardMaxMm / imgHeight) * bodyCanvas.height);

      // Always verify the cut position with pixel analysis.
      // Even when a break marker is found, coordinate rounding or render
      // differences can place the cut on a text row.  The pixel scanner
      // finds the nearest real line gap (consecutive quiet rows).
      if (nextPageTop < imgHeight - 1) {
        const cutPx = Math.floor((nextPageTop / imgHeight) * bodyCanvas.height);
        const searchPx = Math.floor((usableHeight * 0.12 / imgHeight) * bodyCanvas.height);
        // Pass hardMaxPx to prevent scanner from finding gaps beyond footer
        const safePx = findSafeCutRow(bodyRowData, cutPx, searchPx, hardMaxPx);
        const safeMm = (safePx / bodyCanvas.height) * imgHeight;
        if (safeMm - pageTopMm >= minFillMm && safeMm <= hardMaxMm) {
          nextPageTop = safeMm;
        } else if (safeMm > hardMaxMm) {
          // Gap found is past the hard max — re-scan from hard max, searching
          // only upward with a wider range to guarantee a safe line gap.
          const wideUpPx = Math.floor((usableHeight * 0.25 / imgHeight) * bodyCanvas.height);
          const reSafePx = findSafeCutRow(bodyRowData, hardMaxPx, wideUpPx, hardMaxPx);
          const reSafeMm = (reSafePx / bodyCanvas.height) * imgHeight;
          if (reSafeMm - pageTopMm >= minFillMm && reSafeMm <= hardMaxMm) {
            nextPageTop = reSafeMm;
          }
        }
      }

      // ── Iron Rule #1: Respect keep-together zones ──
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = adjustCutForKeepTogether(
          nextPageTop, pageTopMm, minFillMm, hardMaxMm, keepTogetherZones
        );
      }

      // ── Text line snap: DOM-level line boundary alignment ──
      // Snap to the nearest inter-line gap using CSS line-height, then
      // fine-tune with pixel data. DOM gives the approximate position;
      // pixel scanner finds the exact gap center within ±1 line height.
      let textLineSnapped = false;
      if (nextPageTop < imgHeight - 1) {
        const textSnap = snapCutToTextLineBoundary(nextPageTop, textLineInfos, pageTopMm, minFillMm, hardMaxMm);
        if (textSnap.snapped) {
          nextPageTop = textSnap.position;

          // Pixel fine-tuning: DOM line boundaries can differ from canvas
          // rendering by a few pixels (anti-aliasing, font metrics, rounding).
          // Search within ±1 line height for the actual quiet gap center.
          // ASYMMETRIC CONSTRAINT: allow ±1 LH upward search but limit
          // downward acceptance to 0.3×LH — moving DOWN adds content and
          // risks clipping the next line's character ascenders.
          const snapPx = Math.floor((nextPageTop / imgHeight) * bodyCanvas.height);
          const lineHeightCanvasPx = Math.ceil((textSnap.lineHeightMm / imgHeight) * bodyCanvas.height);
          const refinedPx = findSafeCutRow(bodyRowData, snapPx, lineHeightCanvasPx, hardMaxPx);
          const refinedMm = (refinedPx / bodyCanvas.height) * imgHeight;
          const drift = refinedMm - nextPageTop;
          const maxDownDrift = textSnap.lineHeightMm * 0.1;
          const maxUpDrift = textSnap.lineHeightMm;
          if (drift <= maxDownDrift && drift >= -maxUpDrift
              && refinedMm - pageTopMm >= minFillMm && refinedMm <= hardMaxMm) {
            console.log(
              `[Report PDF] Text snap fine-tuned: ${nextPageTop.toFixed(1)}mm → ${refinedMm.toFixed(1)}mm (Δ${drift.toFixed(2)}mm)`
            );
            nextPageTop = refinedMm;
          } else if (drift > maxDownDrift) {
            console.log(
              `[Report PDF] Text snap fine-tune REJECTED (downward drift ${drift.toFixed(2)}mm > max ${maxDownDrift.toFixed(2)}mm)`
            );
          }

          textLineSnapped = true;
        }
      }

      // ── Layer 4: Text glyph collision guard ──
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = applyGlyphGuard(nextPageTop, textLineInfos, pageTopMm, minFillMm, hardMaxMm, "Layer 4 glyph guard");
      }

      // ── Pixel-level micro-scan + verification (only when NOT inside a text block) ──
      if (!textLineSnapped && nextPageTop < imgHeight - 1) {
        // Final pixel-safety micro-scan
        const finalPx = Math.floor((nextPageTop / imgHeight) * bodyCanvas.height);
        const microSearchPx = Math.floor((usableHeight * 0.08 / imgHeight) * bodyCanvas.height);
        const finalSafePx = findSafeCutRow(bodyRowData, finalPx, microSearchPx, hardMaxPx);
        const finalSafeMm = (finalSafePx / bodyCanvas.height) * imgHeight;
        if (finalSafeMm - pageTopMm >= minFillMm && finalSafeMm <= hardMaxMm) {
          nextPageTop = finalSafeMm;
        }

        // Rescue scan: verify the final cut is at a REAL gap, not on text
        const verifyPx = Math.floor((nextPageTop / imgHeight) * bodyCanvas.height);
        if (!isCutAtRealGap(bodyRowData, verifyPx, 4, 14)) {
          const verifyTrans = verifyPx >= 0 && verifyPx < bodyRowData.canvasHeight ? bodyRowData.transitions[verifyPx] : -1;
          const verifyBright = verifyPx >= 0 && verifyPx < bodyRowData.canvasHeight ? bodyRowData.avgBrightness[verifyPx].toFixed(1) : "-";
          console.warn("[Report PDF] Cut verification failed — launching rescue scan",
            { page: bodyPageIndex, row: verifyPx, transitions: verifyTrans, brightness: verifyBright });
          const rescueSearchPx = Math.floor((usableHeight * 0.30 / imgHeight) * bodyCanvas.height);
          const rescuePx = findSafeCutRow(bodyRowData, verifyPx, rescueSearchPx, hardMaxPx);
          const rescueMm = (rescuePx / bodyCanvas.height) * imgHeight;
          if (rescueMm - pageTopMm >= minFillMm && rescueMm <= hardMaxMm
              && isCutAtRealGap(bodyRowData, rescuePx, 2)) {
            console.log("[Report PDF] Rescue scan succeeded", { page: bodyPageIndex, rescueRow: rescuePx });
            nextPageTop = rescueMm;
          } else {
            const lastResortSearchPx = Math.floor((usableHeight * 0.50 / imgHeight) * bodyCanvas.height);
            const lastResortPx = findSafeCutRow(bodyRowData, hardMaxPx, lastResortSearchPx, hardMaxPx);
            const lastResortMm = (lastResortPx / bodyCanvas.height) * imgHeight;
            if (lastResortMm - pageTopMm >= minFillMm && lastResortMm <= hardMaxMm
                && isCutAtRealGap(bodyRowData, lastResortPx, 1)) {
              console.log("[Report PDF] Last-resort scan succeeded", { page: bodyPageIndex, row: lastResortPx });
              nextPageTop = lastResortMm;
            } else {
              console.error("[Report PDF] ALL rescue scans failed — emergency fallback",
                { page: bodyPageIndex, verifyRow: verifyPx, rescueRow: rescuePx, lastResortRow: lastResortPx });
              if (rescueMm - pageTopMm >= minFillMm * 0.5 && rescueMm <= hardMaxMm) {
                nextPageTop = rescueMm;
              } else if (lastResortMm - pageTopMm >= minFillMm * 0.5 && lastResortMm <= hardMaxMm) {
                nextPageTop = lastResortMm;
              }
            }
          }
        }
      }

      // ── Layer 4 re-check after pixel scan ──
      // Layer 3 can move the cut into a text block. Re-run glyph guard
      // to catch any collision introduced by the pixel scan + rescue.
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = applyGlyphGuard(nextPageTop, textLineInfos, pageTopMm, minFillMm, hardMaxMm, "Layer 4 post-scan guard");
      }

      // ── Final Iron Rule #1 re-check ──
      // After all layers (text snap, glyph guard, pixel scan) have run,
      // re-verify that no layer has moved the cut back into a keep-together
      // zone.  This is the absolute last safety net for indivisible blocks.
      if (nextPageTop < imgHeight - 1) {
        nextPageTop = adjustCutForKeepTogether(
          nextPageTop, pageTopMm, minFillMm, hardMaxMm, keepTogetherZones
        );
      }

      // ── ABSOLUTE FINAL SAFETY: pixel-based verification (cover+body path) ──
      if (nextPageTop < imgHeight - 1) {
        const absFinalPx = Math.floor((nextPageTop / imgHeight) * bodyCanvas.height);
        if (!isCutAtRealGap(bodyRowData, absFinalPx, 3, 6)) {
          const rescueRng = Math.floor((usableHeight * 0.15 / imgHeight) * bodyCanvas.height);
          const rescuedPx = findSafeCutRow(bodyRowData, absFinalPx, rescueRng, hardMaxPx);
          const rescuedMm = (rescuedPx / bodyCanvas.height) * imgHeight;
          if (rescuedMm - pageTopMm >= minFillMm * 0.3 && rescuedMm <= hardMaxMm
              && isCutAtRealGap(bodyRowData, rescuedPx, 2)) {
            console.warn(
              `[Report PDF] FINAL pixel safety (body): ${nextPageTop.toFixed(1)}mm → ${rescuedMm.toFixed(1)}mm (page ${bodyPageIndex})`
            );
            nextPageTop = rescuedMm;
          }
        }
      }

      // Slice the canvas
      const sliceTopPx = Math.floor((pageTopMm / imgHeight) * bodyCanvas.height);
      const sliceBottomPx = Math.min(Math.floor((nextPageTop / imgHeight) * bodyCanvas.height), bodyCanvas.height);
      const sliceHeightPx = sliceBottomPx - sliceTopPx;

      // Skip near-empty trailing slices to prevent blank last pages.
      // At 2× scale, 30px ≈ 15 physical px — too small to contain meaningful text.
      const MIN_MEANINGFUL_SLICE_PX = 30;
      if (sliceHeightPx >= MIN_MEANINGFUL_SLICE_PX) {
        pdf.addPage();
        bodyPageIndex++;
        // Progress: 55-90% allocated to pagination
        if (emitProgress) {
          const paginationProgress = 55 + (nextPageTop / imgHeight) * 35;
          reportProgressUpdate(p(Math.min(90, paginationProgress)), getStepLabel("paginating", lang));
        }

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = bodyCanvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            bodyCanvas,
            0, sliceTopPx, bodyCanvas.width, sliceHeightPx,
            0, 0, bodyCanvas.width, sliceHeightPx
          );
        }

        const pageEncoded = await encodeCanvasImage(pageCanvas, 0.85);
        const sliceHeightMm = (sliceHeightPx * imgWidth) / bodyCanvas.width;
        // Place content below header area
        const contentTopMm = bodyTopMarginMm + 7;
        pdf.addImage(pageEncoded.imageData, pageEncoded.format, marginXMm, contentTopMm, imgWidth, sliceHeightMm);

        // Release page slice canvas memory immediately
        pageCanvas.width = 0;
        pageCanvas.height = 0;

        // --- Draw page header ---
        pdf.setFontSize(8);
        pdf.setTextColor(148, 163, 184); // slate-400
        pdf.text(reportNumber, pdfWidth - marginXMm, bodyTopMarginMm + 3, { align: "right" });
        pdf.setDrawColor(226, 232, 240); // slate-200
        pdf.setLineWidth(0.3);
        pdf.line(marginXMm, bodyTopMarginMm + 5, pdfWidth - marginXMm, bodyTopMarginMm + 5);

        // --- Draw page footer ---
        const footerY = pdfHeight - bodyBottomMarginMm;
        pdf.setDrawColor(226, 232, 240);
        pdf.setLineWidth(0.3);
        pdf.line(marginXMm, footerY - 4, pdfWidth - marginXMm, footerY - 4);
        pdf.setFontSize(7);
        pdf.setTextColor(148, 163, 184);
        pdf.text("SCPC \u2014 Strategic Career Planning Consultant", marginXMm, footerY);
        pdf.text(`\u00A9 ${new Date().getFullYear()}`, pdfWidth - marginXMm, footerY, { align: "right" });
      }

      pageTopMm = nextPageTop;
    }

    console.log(`[Report PDF] Pagination+encode: ${(performance.now() - tPagination).toFixed(0)}ms, bodyPages: ${bodyPageIndex}`);

    // Release large canvas memory now that all pages are sliced
    coverCanvas.width = 0;
    coverCanvas.height = 0;
    bodyCanvas.width = 0;
    bodyCanvas.height = 0;

    if (emitProgress) reportProgressUpdate(p(94), getStepLabel("saving", lang));
    // Use explicit blob-based download for maximum browser compatibility
    const pdfBlob = pdf.output("blob");
    console.log("[Report PDF] Generated", {
      filename,
      pages: pdf.getNumberOfPages(),
      sizeKB: Math.round(pdfBlob.size / 1024),
      totalMs: (performance.now() - tPipelineStart).toFixed(0),
    });

    if (returnBlobOnly) {
      return pdfBlob;
    }

    // Guard: verify blob is not empty
    if (pdfBlob.size < 500) {
      console.error("[Report PDF] Generated blob is suspiciously small", pdfBlob.size);
      throw new Error("PDF generation failed: output is empty");
    }

    downloadBlob(pdfBlob, filename);
    if (emitProgress) reportProgressEnd();
  } catch (error) {
    if (emitProgress) reportProgressEnd();
    throw error;
  } finally {
    document.body.removeChild(coverContainer);
    document.body.removeChild(bodyContainer);
  }
}

// =====================================================
// Ideal Card Report HTML Generator
// =====================================================

interface IdealCardReportData {
  rankedCards: Array<{ rank: number; cardId: number; category: CardCategory }>;
  userName?: string;
  createdAt?: string;
  quadrantContents?: Record<number, {
    external: string;
    internal: string;
    career: string;
    relationship: string;
  }>;
  spectrumTypes?: Record<number, "career" | "neutral" | "lifestyle">;
  aiDescriptions?: Record<number, string>;
}

/** Convert part number to ordinal label: 1 → "第一部分", "Part 1" */
function partLabel(num: number, language: Language): string {
  if (language === "en") return `Part ${num}`;
  const ordinals = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  return `第${ordinals[num - 1] || num}部分`;
}

// ---------------------------------------------------------------------------
// Missing Dimensions Section (fixed reflective text)
// ---------------------------------------------------------------------------

function generateMissingDimensionsSection(data: IdealCardReportData, language: Language, sectionNum = 4): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const lang = language as "zh-TW" | "zh-CN" | "en";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;

  // Calculate distribution
  const distribution: Record<CardCategory, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
  data.rankedCards.forEach(r => { distribution[r.category]++; });

  const missingCategories = (Object.entries(distribution) as [CardCategory, number][])
    .filter(([, count]) => count === 0)
    .map(([cat]) => cat);

  if (missingCategories.length === 0) return "";

  const sectionTitle = t(
    "Unselected Dimensions — Reflective Exploration",
    "未被選入的維度 — 反思探索",
    "未被选入的维度 — 反思探索"
  );

  const cardsHtml = missingCategories.map(category => {
    const fixedText = MISSING_DIMENSION_TEXTS[category];
    const config = CATEGORY_CONFIG[category];
    const questionsHtml = fixedText.questions[lang]
      .map(q => `<li style="margin-bottom:6px;line-height:1.7;color:#334155;">• ${q}</li>`)
      .join("");

    return `
      <div style="border-radius:12px;overflow:hidden;border:1px solid ${config.borderColor};margin-bottom:16px;page-break-inside:avoid;">
        <div style="padding:10px 16px;background:${config.bgColor};border-bottom:1px solid ${config.borderColor};">
          <span style="font-weight:700;font-size:14px;color:${config.color};">${fixedText.title[lang]}</span>
        </div>
        <div style="padding:16px;">
          <div style="font-size:12px;font-weight:600;color:#64748b;margin-bottom:8px;letter-spacing:0.5px;">${REFLECTION_HEADER[lang]}</div>
          <ul style="list-style:none;padding:0;margin:0 0 12px;font-size:13px;">
            ${questionsHtml}
          </ul>
          <p style="font-size:13px;color:#475569;line-height:1.8;margin:0;">${fixedText.closing[lang]}</p>
        </div>
      </div>
    `;
  }).join("");

  return `
  <section style="margin-bottom:32px;">
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${sectionTitle}</span>
    </div>
    ${cardsHtml}
  </section>
  `;
}

// ---------------------------------------------------------------------------
// Spectrum Distribution Section (career / neutral / lifestyle)
// ---------------------------------------------------------------------------

const SPECTRUM_REPORT_CONFIG = {
  career: { color: "#1C2857", bgLight: "#e8edf5", labelEn: "Career-Oriented", labelTW: "職涯取向", labelCN: "职涯取向" },
  neutral: { color: "#8B6914", bgLight: "#faf5e4", labelEn: "Neutral", labelTW: "中性平衡", labelCN: "中性平衡" },
  lifestyle: { color: "#1B6B3A", bgLight: "#e6f5ec", labelEn: "Lifestyle-Oriented", labelTW: "生活取向", labelCN: "生活取向" },
};

function generateSpectrumSection(data: IdealCardReportData, language: Language, sectionNum = 3): string {
  if (!data.spectrumTypes || Object.keys(data.spectrumTypes).length === 0) return "";

  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;

  // Count spectrum distribution among ranked cards
  const distribution: Record<string, number> = { career: 0, neutral: 0, lifestyle: 0 };
  const spectrumCardNames: Record<string, string[]> = { career: [], neutral: [], lifestyle: [] };

  for (const rankedCard of data.rankedCards) {
    const spectrumType = data.spectrumTypes[rankedCard.cardId];
    if (spectrumType) {
      distribution[spectrumType]++;
      const card = IDEAL_CARDS.find(c => c.id === rankedCard.cardId);
      if (card) {
        spectrumCardNames[spectrumType].push(getCardLabel(card, language));
      }
    }
  }

  const totalCards = data.rankedCards.length;
  const spectrumEntries = (["career", "neutral", "lifestyle"] as const).map((key) => ({
    key,
    config: SPECTRUM_REPORT_CONFIG[key],
    count: distribution[key],
    percent: totalCards > 0 ? Math.round((distribution[key] / totalCards) * 100) : 0,
    cards: spectrumCardNames[key],
  }));

  // Stacked horizontal bar (matching web page layout)
  const stackedBarHtml = spectrumEntries
    .filter((entry) => entry.count > 0)
    .map((entry) => `
      <div style="width:${entry.percent}%;height:100%;line-height:40px;text-align:center;background:${entry.config.color};color:#fff;font-size:11px;font-weight:700;white-space:nowrap;padding:0 6px;box-sizing:border-box;">${isEn ? entry.config.labelEn : isTW ? entry.config.labelTW : entry.config.labelCN} (${entry.count})</div>
    `).join("");

  // 3-column grid listing card names per spectrum type (matching web page)
  const gridColumnsHtml = spectrumEntries
    .filter((entry) => entry.cards.length > 0)
    .map((entry) => `
      <div style="flex:1;min-width:140px;border-radius:10px;padding:14px;background:${entry.config.bgLight};border-left:4px solid ${entry.config.color};">
        <div style="font-size:11px;font-weight:700;color:${entry.config.color};margin-bottom:8px;">${isEn ? entry.config.labelEn : isTW ? entry.config.labelTW : entry.config.labelCN}</div>
        ${entry.cards.map((name) => `<div style="font-size:12px;color:#334155;margin-bottom:4px;line-height:1.5;">${name}</div>`).join("")}
      </div>
    `).join("");

  return `
  <div data-page-break style="height:0;overflow:hidden;"></div>
  <section style="margin-bottom:32px;">
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${t("Spectrum Distribution", "光譜分佈", "光谱分布")}</span>
    </div>
    <p style="font-size:14px;color:#4a5568;margin-bottom:16px;line-height:1.8;">
      ${t(
        "How your 10 cards are distributed across the Career-Oriented \u2014 Neutral \u2014 Lifestyle-Oriented spectrum.",
        "你選擇的10張卡片在「職涯取向—中性平衡—生活取向」三段光譜上的分佈。",
        "你选择的10张卡片在「职涯取向—中性平衡—生活取向」三段光谱上的分布。"
      )}
    </p>
    <div data-keep-together style="page-break-inside:avoid;">
      <div style="height:40px;border-radius:10px;overflow:hidden;display:flex;margin-bottom:20px;">
        ${stackedBarHtml}
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${gridColumnsHtml}
      </div>
    </div>
  </section>
  `;
}

// ---------------------------------------------------------------------------
// Quadrant Content Section (per-card editorial content from generator)
// ---------------------------------------------------------------------------

function generateQuadrantContentSection(data: IdealCardReportData, language: Language, sectionNum = 5): string {
  const hasAnyQuadrant = data.quadrantContents && Object.keys(data.quadrantContents).length > 0;
  const hasAnyAiDesc = data.aiDescriptions && Object.keys(data.aiDescriptions).length > 0;
  if (!hasAnyQuadrant && !hasAnyAiDesc) return "";

  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;

  // Quadrant labels matching web component (IdealCardReportCard)
  const quadrantGrid = [
    { key: "external" as const, icon: "\u{1F30D}", accent: "#1C2857", bg: "#f0f4ff", label: t("External Environment Perception", "對外部環境的感知", "对外部环境的感知") },
    { key: "career" as const, icon: "\u{1F4BC}", accent: "#059669", bg: "#ecfdf5", label: t("Career Attitude", "對職業生涯的態度", "对职业生涯的态度") },
    { key: "internal" as const, icon: "\u{1F9E0}", accent: "#7c3aed", bg: "#faf5ff", label: t("Internal Self Thinking", "對自我內在的思維", "对自我内在的思维") },
    { key: "relationship" as const, icon: "\u{1F91D}", accent: "#e74c6f", bg: "#fdf2f8", label: t("Family & Friend Behavior", "對家庭或朋友的行為", "对家庭或朋友的行为") },
  ];

  // Spectrum tag config matching web component
  const spectrumTagConfig: Record<string, { color: string; bg: string; label: string }> = {
    career: { color: "#1C2857", bg: "#e8edf5", label: t("Career-Oriented", "職業導向", "职业导向") },
    neutral: { color: "#6B7B8D", bg: "#f0f2f5", label: t("Neutral", "中性價值", "中性价值") },
    lifestyle: { color: "#1B6B3A", bg: "#e6f5ec", label: t("Lifestyle", "生活形態", "生活形态") },
  };

  const cardsHtml = data.rankedCards.map((result) => {
    const quadrant = data.quadrantContents?.[result.cardId];
    const aiDesc = data.aiDescriptions?.[result.cardId];
    const hasQuadrant = quadrant && (quadrant.external || quadrant.internal || quadrant.career || quadrant.relationship);
    if (!hasQuadrant && !aiDesc) return "";

    const card = IDEAL_CARDS.find(c => c.id === result.cardId);
    if (!card) return "";
    const config = CATEGORY_CONFIG[result.category];
    const cardLabel = getCardLabel(card, language);
    const categoryLabel = getCategoryLabel(result.category, language);
    const spectrumType = data.spectrumTypes?.[result.cardId];
    const specTag = spectrumType ? spectrumTagConfig[spectrumType] : null;
    const isTopThree = result.rank <= 3;
    const rankBadgeBg = isTopThree
      ? "background:linear-gradient(145deg,#FFD700,#E6B800);box-shadow:0 3px 10px rgba(255,193,7,0.45);"
      : "background:#1C2857;";

    const quadrantGridHtml = hasQuadrant
      ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#e8eaed;">
          ${quadrantGrid.map((qd) => {
            const content = quadrant![qd.key];
            return `
              <div style="padding:14px;background:${qd.bg};min-height:80px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                  <span style="font-size:14px;line-height:1;">${qd.icon}</span>
                  <span style="font-size:11px;font-weight:700;color:${qd.accent};letter-spacing:0.3px;">${qd.label}</span>
                </div>
                <div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${content || "\u2014"}</div>
              </div>`;
          }).join("")}
        </div>`
      : "";

    const aiDescHtml = aiDesc
      ? `<div style="padding:14px 16px;background:#fafbfc;border-left:4px solid #B5D260;border-top:1px solid #eef0f4;">
          <div style="font-size:11px;font-weight:600;color:#64748b;letter-spacing:0.04em;margin-bottom:6px;">${t("Card Content Description", "\u5361\u7247\u5167\u5bb9\u8aaa\u660e", "\u5361\u7247\u5185\u5bb9\u8bf4\u660e")}</div>
          <div style="font-size:13px;color:#475569;line-height:1.8;">${aiDesc}</div>
        </div>`
      : "";

    return `
      <div data-keep-together style="margin-bottom:20px;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.06);page-break-inside:avoid;">
        <div style="padding:16px 20px;border-bottom:1px solid #eef0f4;background:#fff;overflow:hidden;">
          <div style="float:right;padding-top:6px;"><span style="font-size:13px;font-weight:600;color:${config.color};background:${config.bgColor};height:28px;line-height:26px;padding:0 12px;border-radius:20px;border:1px solid ${config.borderColor};white-space:nowrap;display:inline-block;text-align:center;vertical-align:middle;">${categoryLabel}</span>${specTag ? ` <span style="font-size:13px;font-weight:600;color:${specTag.color};background:${specTag.bg};height:28px;line-height:28px;padding:0 12px;border-radius:20px;white-space:nowrap;display:inline-block;text-align:center;vertical-align:middle;">${specTag.label}</span>` : ""}</div>
          <div style="float:left;margin-right:12px;width:40px;height:40px;line-height:40px;border-radius:10px;${rankBadgeBg}color:#fff;font-weight:800;font-size:15px;text-align:center;font-family:'Montserrat',sans-serif;box-sizing:border-box;">${result.rank}</div>
          <div style="overflow:hidden;font-size:16px;font-weight:700;color:#1e293b;line-height:40px;white-space:nowrap;text-overflow:ellipsis;">${cardLabel}</div>
        </div>
        ${quadrantGridHtml}
        ${aiDescHtml}
      </div>
    `;
  }).filter(Boolean).join("");

  if (!cardsHtml) return "";

  return `
  <div data-page-break style="height:0;overflow:hidden;"></div>
  <section style="margin-bottom:32px;">
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${t("Top 10 Card Deep Interpretation", "Top 10 卡片深度解讀", "Top 10 卡片深度解读")}</span>
    </div>
    <p style="font-size:14px;color:#4a5568;margin-bottom:16px;line-height:1.8;">
      ${t(
        "Professional quadrant-based interpretation for each card with AI neutral descriptions, helping you fully understand your core values.",
        "每張卡片從四個象限角度的專業深度解讀，結合 AI 中性描述，幫助你全方位理解自己的核心價值。",
        "每张卡片从四个象限角度的专业深度解读，结合 AI 中性描述，帮助你全方位理解自己的核心价值。"
      )}
    </p>
    ${cardsHtml}
  </section>
  `;
}

/* AI deep interpretation sections (generateAIAnalysisSections) removed.
   PDF now matches web page exactly. */

/* (dead code removed for brevity)
    module8: isEn ? "Development Recommendations" : isTW ? "發展建議" : "发展建议",
    module9: isEn ? "Risk Warnings" : isTW ? "風險提示" : "风险提示",
    module10: isEn ? "Actionable Steps" : isTW ? "具體行動方案" : "具体行动方案",
    essence: isEn ? "Essence" : isTW ? "本質" : "本质",
    whyRanked: isEn ? "Why this rank" : isTW ? "為何排在此位" : "为何排在此位",
    decisionImpact: isEn ? "Decision Impact" : isTW ? "決策影響" : "决策影响",
    ifIgnored: isEn ? "If Ignored" : isTW ? "若被忽略" : "若被忽略",
    concentrated: isEn ? "Concentrated Dimensions" : isTW ? "集中維度" : "集中维度",
    absent: isEn ? "Absent Dimensions" : isTW ? "缺失維度" : "缺失维度",
    concentrationLevel: isEn ? "Concentration Level" : isTW ? "集中程度" : "集中程度",
    driveType: isEn ? "Drive Type" : isTW ? "驅動類型" : "驱动类型",
    noConflict: isEn ? "No significant internal tensions detected." : isTW ? "未檢測到顯著的內在張力。" : "未检测到显著的内在张力。",
    conflictPairs: isEn ? "Conflict Pairs" : isTW ? "衝突配對" : "冲突配对",
    manifestation: isEn ? "How it manifests" : isTW ? "具體表現" : "具体表现",
    integrationPath: isEn ? "Integration Path" : isTW ? "整合路徑" : "整合路径",
    stage: isEn ? "Stage" : isTW ? "階段" : "阶段",
    fitLevel: isEn ? "Fit Level" : isTW ? "適配度" : "适配度",
    careerTrajectory: isEn ? "Career Trajectory" : isTW ? "職業軌跡" : "职业轨迹",
    turningPoints: isEn ? "Turning Points" : isTW ? "關鍵轉折點" : "关键转折点",
    strengthenCore: isEn ? "Strengthen Core" : isTW ? "鞏固核心" : "巩固核心",
    avoidImbalance: isEn ? "Avoid Imbalance" : isTW ? "避免失衡" : "避免失衡",
    integrateConflicts: isEn ? "Integrate Conflicts" : isTW ? "整合矛盾" : "整合矛盾",
    action: isEn ? "Action" : isTW ? "行動" : "行动",
    rationale: isEn ? "Rationale" : isTW ? "依據" : "依据",
    verification: isEn ? "Verification" : isTW ? "驗證方式" : "验证方式",
  };

  const sectionHeader = (title: string) => `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${title}</span>
    </div>
  `;

  // Module 1: Core Overview
  const module1Html = `
    ${sectionHeader(aiLabels.module1)}
    <div style="padding:24px; background:#f8f9fa; border-radius:12px; border:1px solid #E9ECEF;">
      <p style="font-size:14px; color:#1a1a2e; line-height:1.8; margin:0; white-space:pre-wrap;">${analysis.module1_core_overview.full_text}</p>
    </div>
  `;

  // Module 2: Top 3 Deep
  const module2Cards = (analysis.module2_top3_deep || []).map(card => {
    const fields = [
      { label: aiLabels.essence, value: card.essence, color: "#1C2857" },
      { label: aiLabels.whyRanked, value: card.why_ranked_here, color: "#2563eb" },
      { label: aiLabels.decisionImpact, value: card.decision_impact, color: "#059669" },
      { label: aiLabels.ifIgnored, value: card.if_ignored, color: "#dc2626" },
    ];
    return `
      <div style="padding:24px; background:#f8f9fa; border-radius:12px; border:1px solid #E9ECEF; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <div style="width:28px; height:28px; border-radius:50%; background:#1C2857; color:#fff; font-size:12px; font-weight:700; display:block; text-align:center; line-height:1; padding:7px 0 9px; font-family:'Montserrat',sans-serif; box-sizing:border-box;">${card.rank}</div>
          <span style="font-weight:700; font-size:15px; color:#1a1a2e;">${card.card_name}</span>
        </div>
        ${fields.map(f => `
          <div style="margin-bottom:8px;">
            <div style="font-size:11px; font-weight:600; color:${f.color}; text-transform:uppercase; letter-spacing:1px; margin-bottom:2px;">${f.label}</div>
            <p style="font-size:14px; color:#1a1a2e; line-height:1.8; margin:0;">${f.value}</p>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
  const module2Html = `${sectionHeader(aiLabels.module2)}${module2Cards}`;

  // Module 3: Distribution
  const concentratedChips = (analysis.module3_distribution.concentrated_dimensions || []).map(
    d => `<span class="cpc-pill cpc-pill-sm cpc-sem cpc-sem-info" style="margin:2px;"><span class="cpc-pill-text">${d}</span></span>`
  ).join("");
  const absentChips = (analysis.module3_distribution.absent_dimensions || []).map(
    d => `<span class="cpc-pill cpc-pill-sm cpc-sem cpc-sem-danger" style="margin:2px;"><span class="cpc-pill-text">${d}</span></span>`
  ).join("");
  const module3Html = `
    ${sectionHeader(aiLabels.module3)}
    <div style="padding:24px; background:#f8f9fa; border-radius:12px; border:1px solid #E9ECEF;">
      <div style="margin-bottom:10px;">
        <div style="font-size:11px; font-weight:600; color:#1e40af; letter-spacing:1px; margin-bottom:4px;">${aiLabels.concentrated}</div>
        <div>${concentratedChips || "—"}</div>
      </div>
      <div style="margin-bottom:10px;">
        <div style="font-size:11px; font-weight:600; color:#991b1b; letter-spacing:1px; margin-bottom:4px;">${aiLabels.absent}</div>
        <div>${absentChips || "—"}</div>
      </div>
      <div style="margin-bottom:10px;">
        <span style="font-size:11px; font-weight:600; color:#4a5568;">${aiLabels.concentrationLevel}: </span>
        <span class="cpc-pill cpc-pill-sm cpc-sem cpc-sem-info-soft"><span class="cpc-pill-text">${analysis.module3_distribution.concentration_level}</span></span>
      </div>
      <p style="font-size:14px; color:#1a1a2e; line-height:1.8; margin:0;">${analysis.module3_distribution.analysis}</p>
    </div>
  `;

  // Module 4: Drive Pattern
  const module4Html = `
    ${sectionHeader(aiLabels.module4)}
    <div style="padding:24px; background:linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%); border-radius:12px; color:#fff;">
      <div style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.5); margin-bottom:4px; font-weight:600;">${aiLabels.driveType}</div>
      <div style="font-size:20px; font-weight:700; margin-bottom:12px;">${analysis.module4_drive_pattern.drive_type}</div>
      <p style="font-size:14px; line-height:1.8; margin:0; color:rgba(255,255,255,0.9);">${analysis.module4_drive_pattern.description}</p>
    </div>
  `;

  // Module 5: Tension
  let module5Body = "";
  if (!analysis.module5_tension.conflicts_exist) {
    module5Body = `<p style="font-size:13px; color:#059669; margin:0; padding:12px; background:#ecfdf5; border-radius:8px;">${aiLabels.noConflict}</p>`;
  } else {
    const pairs = (analysis.module5_tension.conflict_pairs || []).map(
      p => `<li style="margin-bottom:4px; font-size:13px; color:#78350f;">${p}</li>`
    ).join("");
    module5Body = `
      <div style="padding:24px; background:#fffbeb; border-radius:12px; border:1px solid #fde68a;">
        <div style="font-size:11px; font-weight:600; color:#92400e; letter-spacing:1px; margin-bottom:6px;">${aiLabels.conflictPairs}</div>
        <ul style="margin:0 0 12px; padding-left:18px;">${pairs}</ul>
        <div style="font-size:11px; font-weight:600; color:#92400e; letter-spacing:1px; margin-bottom:4px;">${aiLabels.manifestation}</div>
        <p style="font-size:14px; color:#78350f; line-height:1.8; margin:0 0 12px;">${analysis.module5_tension.manifestation}</p>
        <div style="font-size:11px; font-weight:600; color:#065f46; letter-spacing:1px; margin-bottom:4px;">${aiLabels.integrationPath}</div>
        <p style="font-size:14px; color:#065f46; line-height:1.8; margin:0;">${analysis.module5_tension.integration_path}</p>
      </div>
    `;
  }
  const module5Html = `${sectionHeader(aiLabels.module5)}${module5Body}`;

  // Module 6: Stage Fit
  const fitColor = analysis.module6_stage_fit.fit_level === "high" ? "#059669" : analysis.module6_stage_fit.fit_level === "moderate" ? "#2563eb" : "#dc2626";
  const fitBg = analysis.module6_stage_fit.fit_level === "high" ? "#ecfdf5" : analysis.module6_stage_fit.fit_level === "moderate" ? "#eff6ff" : "#fef2f2";
  const module6Html = `
    ${sectionHeader(aiLabels.module6)}
    <div style="padding:24px; background:${fitBg}; border-radius:12px; border:1px solid ${fitColor === '#059669' ? '#a7f3d0' : fitColor === '#2563eb' ? '#bfdbfe' : '#fecaca'};">
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:10px;">
        <span style="font-size:12px; color:#4a5568;">${aiLabels.stage}: <strong style="color:#1a1a2e;">${analysis.module6_stage_fit.stage}</strong></span>
        <span class="cpc-pill cpc-pill-sm" style="--cpc-bg:${fitColor};--cpc-fg:#fff;--cpc-bd:${fitColor};"><span class="cpc-pill-text">${aiLabels.fitLevel}: ${analysis.module6_stage_fit.fit_level}</span></span>
      </div>
      <p style="font-size:14px; color:#1a1a2e; line-height:1.8; margin:0;">${analysis.module6_stage_fit.analysis}</p>
    </div>
  `;

  // Module 7: Decade Forecast
  const turningPts = (analysis.module7_decade_forecast.turning_points || []).map(
    tp => `<li style="margin-bottom:4px; font-size:13px; color:#475569;">${tp}</li>`
  ).join("");
  const module7Html = `
    ${sectionHeader(aiLabels.module7)}
    <div style="padding:24px; background:#f8f9fa; border-radius:12px; border:1px solid #E9ECEF;">
      <div style="font-size:11px; font-weight:600; color:#1C2857; letter-spacing:1px; margin-bottom:6px;">${aiLabels.careerTrajectory}</div>
      <p style="font-size:14px; color:#1a1a2e; line-height:1.8; margin:0 0 14px;">${analysis.module7_decade_forecast.career_trajectory}</p>
      ${turningPts ? `
        <div style="font-size:11px; font-weight:600; color:#1C2857; letter-spacing:1px; margin-bottom:6px;">${aiLabels.turningPoints}</div>
        <ul style="margin:0; padding-left:18px;">${turningPts}</ul>
      ` : ""}
    </div>
  `;

  // Module 8: Development
  const module8Html = `
    ${sectionHeader(aiLabels.module8)}
    <div style="display:flex; gap:12px; flex-wrap:wrap;">
      <div style="flex:1; min-width:180px; padding:20px; background:#ecfdf5; border-radius:12px; border:1px solid #d1fae5;">
        <div style="font-size:11px; font-weight:600; color:#065f46; letter-spacing:1px; margin-bottom:6px;">${aiLabels.strengthenCore}</div>
        <p style="font-size:14px; color:#047857; line-height:1.8; margin:0;">${analysis.module8_development.strengthen_core}</p>
      </div>
      <div style="flex:1; min-width:180px; padding:20px; background:#fffbeb; border-radius:12px; border:1px solid #fef3c7;">
        <div style="font-size:11px; font-weight:600; color:#92400e; letter-spacing:1px; margin-bottom:6px;">${aiLabels.avoidImbalance}</div>
        <p style="font-size:14px; color:#b45309; line-height:1.8; margin:0;">${analysis.module8_development.avoid_imbalance}</p>
      </div>
      <div style="flex:1; min-width:180px; padding:20px; background:#eff6ff; border-radius:12px; border:1px solid #dbeafe;">
        <div style="font-size:11px; font-weight:600; color:#1e40af; letter-spacing:1px; margin-bottom:6px;">${aiLabels.integrateConflicts}</div>
        <p style="font-size:14px; color:#1d4ed8; line-height:1.8; margin:0;">${analysis.module8_development.integrate_conflicts}</p>
      </div>
    </div>
  `;

  // Module 9: Risk Warnings
  const riskItems = (analysis.module9_risk_warnings || []).map(risk => `
    <div style="display:flex; gap:10px; padding:16px; background:#fef2f2; border-radius:12px; border:1px solid #fecaca; margin-bottom:10px;">
      <span class="cpc-pill cpc-pill-sm cpc-sem cpc-sem-danger-solid" style="font-size:10px;border-radius:6px;"><span class="cpc-pill-text">${risk.risk_type}</span></span>
      <p style="font-size:14px; color:#991b1b; line-height:1.8; margin:0;">${risk.description}</p>
    </div>
  `).join("");
  const module9Html = `${sectionHeader(aiLabels.module9)}${riskItems}`;

  // Module 10: Actions
  const actionItems = (analysis.module10_actions || []).map((item, index) => `
    <div style="padding:20px; background:#f8f9fa; border-radius:12px; border:1px solid #E9ECEF; margin-bottom:10px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <div style="display:inline-block;width:26px;height:26px;line-height:26px;text-align:center;border-radius:50%;background:#1C2857;color:#fff;font-size:11px;font-weight:700;font-family:'Montserrat',sans-serif;">${index + 1}</div>
        <span style="font-weight:600; font-size:14px; color:#1a1a2e;">${item.action}</span>
      </div>
      <div style="margin-bottom:6px;">
        <span style="font-size:11px; font-weight:600; color:#4a5568; letter-spacing:1px;">${aiLabels.rationale}: </span>
        <span style="font-size:14px; color:#1a1a2e; line-height:1.8;">${item.rationale}</span>
      </div>
      <div>
        <span style="font-size:11px; font-weight:600; color:#4a5568; letter-spacing:1px;">${aiLabels.verification}: </span>
        <span style="font-size:14px; color:#1a1a2e; line-height:1.8;">${item.verification}</span>
      </div>
    </div>
  `).join("");
  const module10Html = `${sectionHeader(aiLabels.module10)}${actionItems}`;

  // Assemble all modules with page breaks
  return `
    <div data-page-break style="height:0;overflow:hidden;"></div>
    <section style="margin-top:32px;">
      <div style="text-align:center; margin-bottom:24px; padding:20px; background:linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%); border-radius:12px;">
        <h2 style="font-size:20px; color:#fff; margin:0; font-weight:700;">${aiLabels.aiTitle}</h2>
      </div>
      ${module1Html}
      <div data-page-break style="height:0;overflow:hidden;"></div>
      ${module2Html}
      <div data-page-break style="height:0;overflow:hidden;"></div>
      ${module3Html}
      ${module4Html}
      <div data-page-break style="height:0;overflow:hidden;"></div>
      ${module5Html}
      ${module6Html}
      <div data-page-break style="height:0;overflow:hidden;"></div>
      ${module7Html}
      ${module8Html}
      <div data-page-break style="height:0;overflow:hidden;"></div>
*/

export function generateIdealCardReportHTML(data: IdealCardReportData, language: Language): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const labels = {
    title: isEn ? "Espresso Card Assessment Report" : isTW ? "理想人生卡測評報告" : "理想人生卡测评报告",
    topThree: isEn ? "Top 3 Career Value Cards" : isTW ? "排名前三的職涯價值卡" : "排名前三的职涯价值卡",
    topThreeDesc: isEn ? "These three cards represent your deepest desires and pursuits — the compass for your most important life decisions." : isTW ? "這三張卡片代表了你內心最深處的渴望和追求，它們是你做人生重要決策時的指南針。" : "这三张卡片代表了你内心最深处的渴望和追求，它们是你做人生重要决策时的指南针。",
    distributionTitle: isEn ? "Category Distribution" : isTW ? "四大類別分佈" : "四大类别分布",
    distributionDesc: isEn ? "How your 10 selected cards are distributed across four value dimensions." : isTW ? "你選出的10張卡片在四個價值維度上的分佈情況，反映了你的整體價值傾向。" : "你选出的10张卡片在四个价值维度上的分布情况，反映了你的整体价值倾向。",
    orientationTitle: isEn ? "Career vs Life Orientation" : isTW ? "職涯取向 vs 生活取向" : "职涯取向 vs 生活取向",
    orientationDesc: isEn ? "Analyzing your card categories to determine whether you lean toward \"career orientation\" or \"life orientation\"." : isTW ? "透過分析你選擇的卡片類別，判斷你更傾向於「職涯取向」還是「生活取向」。" : "透过分析你选择的卡片类别，判断你更倾向于「职涯取向」还是「生活取向」。",
    workLabel: isEn ? "Career Orientation" : isTW ? "職涯取向" : "职涯取向",
    lifeLabel: isEn ? "Life Orientation" : isTW ? "生活取向" : "生活取向",
    generated: isEn ? "Generated" : isTW ? "生成時間" : "生成时间",
  };

  // Category distribution
  const distribution: Record<CardCategory, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
  data.rankedCards.forEach(r => { distribution[r.category]++; });

  // Work vs Life orientation
  const workCategories: CardCategory[] = ["intrinsic", "material"];
  const lifeCategories: CardCategory[] = ["lifestyle", "interpersonal"];
  const workCount = data.rankedCards.filter(r => workCategories.includes(r.category)).length;
  const lifeCount = data.rankedCards.filter(r => lifeCategories.includes(r.category)).length;
  const total = workCount + lifeCount;
  const workPercent = total > 0 ? Math.round((workCount / total) * 100) : 50;
  const lifePercent = 100 - workPercent;

  // Top 3 cards
  const topThree = data.rankedCards.slice(0, 3);
  const topThreeHtml = topThree.map((result, index) => {
    const card = IDEAL_CARDS.find(c => c.id === result.cardId);
    if (!card) return "";
    const config = CATEGORY_CONFIG[result.category];
    const cardLabel = getCardLabel(card, language);
    const categoryLabel = getCategoryLabel(result.category, language);
    return `
      <div style="flex:1; min-width:180px; padding:20px 16px; border-radius:12px; text-align:center; border:2px solid ${config.borderColor}; background:${config.bgColor}; page-break-inside:avoid;">
        <div style="width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:linear-gradient(145deg,#FFD700,#E6B800);color:#fff;font-weight:700;font-size:14px;font-family:'Montserrat',sans-serif;margin:0 auto 10px;">${index + 1}</div>
        <div style="font-weight:700; font-size:15px; color:#1a1a2e; margin-bottom:6px; line-height:1.4;">${cardLabel}</div>
        <span style="font-size:11px; font-weight:600; color:${config.color};">${categoryLabel}</span>
      </div>
    `;
  }).join("");

  // Category descriptions (matching web)
  const categoryDescriptions: Record<CardCategory, string> = {
    intrinsic: isEn ? "Seeking inner fulfillment, meaning, and self-actualization" : isTW ? "追求內心的滿足感、意義感和自我實現" : "追求内心的满足感、意义感和自我实现",
    lifestyle: isEn ? "Focusing on quality of life, well-being, and life rhythm" : isTW ? "注重生活品質、身心健康和生活節奏" : "注重生活品质、身心健康和生活节奏",
    interpersonal: isEn ? "Valuing relationships, social connection, and emotional belonging" : isTW ? "重視人際關係、社會連接和情感歸屬" : "重视人际关系、社会连接和情感归属",
    material: isEn ? "Focusing on material security, financial independence, and external achievement" : isTW ? "關注物質保障、經濟獨立和外在成就" : "关注物质保障、经济独立和外在成就",
  };

  // Distribution bars (with descriptions matching web page)
  const distBars = (Object.entries(distribution) as [CardCategory, number][]).map(([cat, count]) => {
    const config = CATEGORY_CONFIG[cat];
    const categoryLabel = getCategoryLabel(cat, language);
    const pct = Math.round((count / 10) * 100);
    const description = categoryDescriptions[cat];
    return `
      <div style="margin-bottom:12px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
          <span style="font-size:12px;color:#4a5568;width:80px;font-weight:600;">${categoryLabel}</span>
          <div style="flex:1;height:10px;background:#E9ECEF;border-radius:5px;overflow:hidden;">
            <div style="--cpc-bg:${config.color};width:${pct}%;height:100%;background:var(--cpc-bg);border-radius:5px;"></div>
          </div>
          <span style="font-size:12px;font-weight:700;color:${config.color};width:40px;text-align:right;font-family:'Montserrat',sans-serif;">${count}/10</span>
        </div>
        <div style="padding-left:90px;font-size:11px;color:#94a3b8;line-height:1.4;">${description}</div>
      </div>
    `;
  }).join("");

  const createdAtText = data.createdAt || new Date().toLocaleString(isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN");

  return `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'zh'}">
<head>
  <meta charset="UTF-8">
  <title>${labels.title}</title>
  <style>${CPC_REPORT_CSS}</style>
</head>
<body>
<div class="cpc-report-root">
  <header style="text-align:center; margin-bottom:36px; padding-bottom:20px; border-bottom:2px solid #1C2857;">
    <h1 style="margin:0 0 6px; font-size:24px; font-weight:700; color:#1C2857;">${labels.title}</h1>
    ${data.userName ? `<p style="margin:10px 0 0; font-size:15px; color:#1a1a2e; font-weight:600;">${data.userName}</p>` : ""}
    <p style="margin:4px 0 0; font-size:11px; color:#94a3b8;">${labels.generated}: ${createdAtText}</p>
  </header>

  <!-- Top 3 Values -->
  <section style="margin-bottom:32px;">
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${labels.topThree}</span>
    </div>
    <p style="font-size:14px; color:#4a5568; margin-bottom:16px; line-height:1.8;">${labels.topThreeDesc}</p>
    <div data-keep-together style="display:flex; gap:16px; flex-wrap:wrap;">
      ${topThreeHtml}
    </div>
  </section>

  <!-- Category Distribution -->
  <section style="margin-bottom:32px;">
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${labels.distributionTitle}</span>
    </div>
    <p style="font-size:14px;color:#4a5568;margin-bottom:16px;line-height:1.8;">${labels.distributionDesc}</p>
    <div style="background:#f8f9fa;border-radius:12px;border:1px solid #E9ECEF;padding:20px;margin-bottom:16px;">
    ${distBars}
    </div>
  </section>

  <!-- Orientation -->
  <section style="margin-bottom:32px;">
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${labels.orientationTitle}</span>
    </div>
    <p style="font-size:14px;color:#4a5568;margin-bottom:16px;line-height:1.8;">${labels.orientationDesc}</p>
    <div data-keep-together style="page-break-inside:avoid;">
      <div style="display:flex; height:36px; border-radius:8px; overflow:hidden; margin-bottom:8px;">
        <div style="width:${workPercent}%;line-height:36px;text-align:center;background:#e74c6f;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;">${labels.workLabel} ${workPercent}%</div>
        <div style="width:${lifePercent}%;line-height:36px;text-align:center;background:#7c3aed;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;">${labels.lifeLabel} ${lifePercent}%</div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
        <div style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:#e74c6f;display:inline-block;"></span>${isEn ? 'Intrinsic + Material' : isTW ? '內在價值 + 物質條件' : '内在价值 + 物质条件'}</div>
        <div style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:#7c3aed;display:inline-block;"></span>${isEn ? 'Lifestyle + Interpersonal' : isTW ? '生活方式 + 人際關係' : '生活方式 + 人际关系'}</div>
      </div>
    </div>
  </section>

  ${(() => {
    let nextPart = 2;
    const spectrumHtml = generateSpectrumSection(data, language, nextPart);
    if (spectrumHtml) nextPart++;
    const missingHtml = generateMissingDimensionsSection(data, language, nextPart);
    if (missingHtml) nextPart++;
    const quadrantHtml = generateQuadrantContentSection(data, language, nextPart);
    return spectrumHtml + missingHtml + quadrantHtml;
  })()}

  <footer style="margin-top:48px; padding-top:20px; padding-bottom:20px; border-top:2px solid #E9ECEF; text-align:center; color:#94a3b8; font-size:11px;">
    <p>SCPC &mdash; Strategic Career Planning Consultant</p>
  </footer>
</div>
</body>
</html>
  `.trim();
}

// =====================================================
// Fusion Analysis Report HTML Generator
// =====================================================

interface FusionV3Metrics {
  alignmentScore: number;
  alignmentLevel: string;
  tensionIndex: number;
  tensionLevel: string;
  balance: number;
  concentration: number;
  maturityLevel: string;
  maturityLabel: string;
  structureType: string;
  structureTags: string[];
  /** Localized development-oriented summary for the structure label */
  structureSummary?: string;
  /** 0-100: 0=career-focused, 50=neutral, 100=life-focused */
  positionX?: number;
  /** 0-100: 0=gentle drive, 100=strong drive */
  positionY?: number;
}

interface FusionNarrativeData {
  // New development-oriented structure
  report_understanding?: string;
  structure_overview?: {
    position_description: string;
    structure_type_label: string;
    structure_type_description: string;
  };
  development_focus?: {
    focus_description: string;
    value_highlights: string[];
    anchor_highlights: string[];
  };
  tension_integration?: {
    overlap_description: string;
    explore_description: string;
    narrative: string;
  };
  recommendations?: {
    career_context: string;
    life_rhythm: string;
    choice_perspective: string;
  };
  stage_summary?: string;

  // Legacy fields (kept for backward compat)
  section3_alignment_breakdown?: {
    overview: string;
    top3_value_analysis: Array<{ dimension: string; weight_percent: number; support_score: number; supporting_anchors: string; gap_description: string }>;
    supported_values_top3: string[];
    unsatisfied_values_top3: string[];
  };
  section4_tension_sources?: {
    overview: string;
    under_supported_details: Array<{ dimension: string; reason: string }>;
    not_represented_details: Array<{ anchor: string; score: number; reason: string }>;
    opposition_penalties: Array<{ pair: string; penalty_points: number; manifestation: string }>;
  };
  section5_stage_forecast?: {
    current_stage_issues: string;
    three_year_window: { verification_actions: string; key_indicators: string };
    five_year_window: { path_choices: string; structural_shift: string };
    ten_year_window: { stable_form: string; integration_outcome: string };
  };
  section6_risk_warnings?: Array<{ risk_type: string; severity: string; description: string; mitigation: string }>;
  section7_recommendations?: Array<{ action: string; indicator: string; expected_benefit: string; risk_and_alternative: string }>;
}

interface FusionReportData {
  mainAnchor: string;
  coreAdvantageAnchors?: string[];
  scores: Record<string, number>;
  rankedCards: Array<{ rank: number; cardId: number; category: CardCategory }>;
  alignmentPercent: number;
  alignmentLevel: "high" | "moderate" | "low";
  userName?: string;
  createdAt?: string;
  fusionMetrics?: FusionV3Metrics;
  narrative?: FusionNarrativeData;
}

export type { FusionV3Metrics, FusionNarrativeData, FusionReportData };

export function generateFusionAnalysisReportHTML(data: FusionReportData, language: Language): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;

  const fusionCoreAnchors = data.coreAdvantageAnchors?.length ? data.coreAdvantageAnchors : getCoreAdvantageAnchors(data.scores);
  const fusionHasCoreAdvantage = fusionCoreAnchors.length > 0;
  const fusionDisplayAnchor = fusionCoreAnchors[0] || data.mainAnchor;
  const mainAnchorName = getDimensionName(fusionDisplayAnchor, language);
  const fusionAnchorLabel = fusionHasCoreAdvantage
    ? t("Core Advantage Anchor", "\u6838\u5fc3\u512a\u52e2\u9328\u9ede", "\u6838\u5fc3\u4f18\u52bf\u951a\u70b9")
    : t("Top Anchor", "\u6700\u9ad8\u5206\u9328\u9ede", "\u6700\u9ad8\u5206\u951a\u70b9");
  const sortedScores = Object.entries(data.scores).sort(([, a], [, b]) => b - a);
  const topScoreValue = sortedScores.length > 0 ? sortedScores[0][1] : 1;
  const createdAtText = data.createdAt || new Date().toLocaleString(isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN");

  // --- Score rows ---
  const scoreRowsHtml = sortedScores.map(([code, score]) => {
    const level = getScoreLevelLabel(score, language);
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid #E9ECEF;page-break-inside:avoid;">
        <span style="width:170px;font-size:13px;font-weight:600;color:#1a1a2e;flex-shrink:0;">${getDimensionName(code, language)}</span>
        <div style="flex:1;height:8px;background:#E9ECEF;border-radius:4px;overflow:hidden;">
          <div class="${getZoneSemClass(score)}" style="width:${topScoreValue > 0 ? Math.min((score / topScoreValue) * 100, 100) : 0}%;height:100%;background:var(--cpc-bg);border-radius:4px;"></div>
        </div>
        <span style="width:36px;text-align:right;font-size:13px;font-weight:700;color:#1C2857;font-family:'Montserrat',sans-serif;">${Math.round(score)}</span>
        <span class="cpc-pill cpc-pill-sm cpc-sem ${getZoneSemClass(score)}"><span class="cpc-pill-text">${level.label}</span></span>
      </div>`;
  }).join("");

  // --- Top 3 ideal cards ---
  const topThree = data.rankedCards.slice(0, 3);
  const topCardsHtml = topThree.map((result, index) => {
    const card = IDEAL_CARDS.find(c => c.id === result.cardId);
    if (!card) return "";
    const config = CATEGORY_CONFIG[result.category];
    return `
      <div style="flex:1;min-width:180px;padding:20px 16px;border-radius:12px;text-align:center;border:2px solid ${config.borderColor};background:${config.bgColor};page-break-inside:avoid;">
        <div style="width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:#1C2857;color:#fff;font-weight:700;font-size:14px;font-family:'Montserrat',sans-serif;margin:0 auto 10px;">${index + 1}</div>
        <div style="font-weight:700;font-size:15px;color:#1a1a2e;margin-bottom:6px;line-height:1.4;">${getCardLabel(card, language)}</div>
        <span style="font-size:11px;font-weight:600;color:${config.color};">${getCategoryLabel(result.category, language)}</span>
      </div>`;
  }).join("");

  // --- Full 10 cards list ---
  const fullCardsHtml = data.rankedCards.map((result) => {
    const card = IDEAL_CARDS.find(c => c.id === result.cardId);
    if (!card) return "";
    const config = CATEGORY_CONFIG[result.category];
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;background:${config.bgColor};page-break-inside:avoid;">
        <span style="font-weight:700;font-size:12px;color:#94a3b8;width:20px;font-family:'Montserrat',sans-serif;">${result.rank}</span>
        <span style="font-size:13px;font-weight:500;color:#1a1a2e;flex:1;">${getCardLabel(card, language)}</span>
        <span style="font-size:11px;font-weight:600;color:${config.color};">${getCategoryLabel(result.category, language)}</span>
      </div>`;
  }).join("");

  // --- Value distribution ---
  const dist: Record<CardCategory, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
  data.rankedCards.forEach(r => { dist[r.category]++; });
  const distHtml = (Object.entries(dist) as [CardCategory, number][]).map(([cat, count]) => {
    const config = CATEGORY_CONFIG[cat];
    return `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;page-break-inside:avoid;">
        <span style="font-size:12px;color:#4a5568;width:80px;font-weight:500;">${getCategoryLabel(cat, language)}</span>
        <div style="flex:1;height:8px;background:#E9ECEF;border-radius:4px;overflow:hidden;">
          <div style="width:${Math.round((count / 10) * 100)}%;height:100%;background:${config.color};border-radius:4px;"></div>
        </div>
        <span style="font-size:12px;font-weight:700;color:${config.color};width:35px;text-align:right;font-family:'Montserrat',sans-serif;">${count}/10</span>
      </div>`;
  }).join("");

  // --- Work vs Life orientation ---
  const workCategories: CardCategory[] = ["intrinsic", "material"];
  const lifeCategories: CardCategory[] = ["lifestyle", "interpersonal"];
  const workCount = data.rankedCards.filter(r => workCategories.includes(r.category)).length;
  const lifeCount = data.rankedCards.filter(r => lifeCategories.includes(r.category)).length;
  const totalOrientation = workCount + lifeCount;
  const workPct = totalOrientation > 0 ? Math.round((workCount / totalOrientation) * 100) : 50;
  const lifePct = totalOrientation > 0 ? Math.round((lifeCount / totalOrientation) * 100) : 50;


  const _alignLabel = data.alignmentLevel === "high"
    ? t("Highly Consistent", "\u9ad8\u5ea6\u4e00\u81f4", "\u9ad8\u5ea6\u4e00\u81f4")
    : data.alignmentLevel === "moderate"
      ? t("Moderately Consistent", "\u4e2d\u5ea6\u4e00\u81f4", "\u4e2d\u5ea6\u4e00\u81f4")
      : t("Needs Attention", "\u9700\u8981\u95dc\u6ce8", "\u9700\u8981\u5173\u6ce8");
  const _alignDesc = data.alignmentLevel === "high"
    ? t("Your career drivers and life values are highly aligned \u2014 you're more likely to find lasting satisfaction in your career.", "\u4f60\u7684\u8077\u696d\u9a45\u52d5\u529b\u8207\u4eba\u751f\u50f9\u503c\u89c0\u9ad8\u5ea6\u5951\u5408\uff0c\u9019\u610f\u5473\u8457\u4f60\u66f4\u5bb9\u6613\u5728\u8077\u696d\u4e2d\u627e\u5230\u6301\u4e45\u7684\u6eff\u8db3\u611f\u548c\u610f\u7fa9\u611f\u3002", "\u4f60\u7684\u804c\u4e1a\u9a71\u52a8\u529b\u4e0e\u4eba\u751f\u4ef7\u503c\u89c2\u9ad8\u5ea6\u5951\u5408\uff0c\u8fd9\u610f\u5473\u7740\u4f60\u66f4\u5bb9\u6613\u5728\u804c\u4e1a\u4e2d\u627e\u5230\u6301\u4e45\u7684\u6ee1\u8db3\u611f\u548c\u610f\u4e49\u611f\u3002")
    : data.alignmentLevel === "moderate"
      ? t("Your career drivers and life values have some correlation but aren't fully aligned. You may need to consciously balance different dimensional needs.", "\u4f60\u7684\u8077\u696d\u9a45\u52d5\u529b\u8207\u4eba\u751f\u50f9\u503c\u89c0\u6709\u4e00\u5b9a\u7684\u95dc\u806f\uff0c\u4f46\u4e26\u975e\u5b8c\u5168\u4e00\u81f4\u3002\u4f60\u53ef\u80fd\u9700\u8981\u6709\u610f\u8b58\u5730\u5728\u5de5\u4f5c\u4e2d\u517c\u9867\u4e0d\u540c\u7dad\u5ea6\u7684\u9700\u6c42\u3002", "\u4f60\u7684\u804c\u4e1a\u9a71\u52a8\u529b\u4e0e\u4eba\u751f\u4ef7\u503c\u89c2\u6709\u4e00\u5b9a\u7684\u5173\u8054\uff0c\u4f46\u5e76\u975e\u5b8c\u5168\u4e00\u81f4\u3002\u4f60\u53ef\u80fd\u9700\u8981\u6709\u610f\u8bc6\u5730\u5728\u5de5\u4f5c\u4e2d\u517c\u987e\u4e0d\u540c\u7ef4\u5ea6\u7684\u9700\u6c42\u3002")
      : t("There's tension between your career drivers and life values. This isn't bad, but means you'll need a more strategic approach to balancing career choices and life pursuits.", "\u4f60\u7684\u8077\u696d\u9a45\u52d5\u529b\u8207\u4eba\u751f\u50f9\u503c\u89c0\u4e4b\u9593\u5b58\u5728\u4e00\u5b9a\u7684\u5f35\u529b\u3002\u9019\u4e0d\u662f\u58de\u4e8b\uff0c\u4f46\u610f\u5473\u8457\u4f60\u9700\u8981\u66f4\u6709\u7b56\u7565\u5730\u5e73\u8861\u8077\u696d\u9078\u64c7\u548c\u751f\u6d3b\u8ffd\u6c42\u3002", "\u4f60\u7684\u804c\u4e1a\u9a71\u52a8\u529b\u4e0e\u4eba\u751f\u4ef7\u503c\u89c2\u4e4b\u95f4\u5b58\u5728\u4e00\u5b9a\u7684\u5f20\u529b\u3002\u8fd9\u4e0d\u662f\u574f\u4e8b\uff0c\u4f46\u610f\u5473\u7740\u4f60\u9700\u8981\u66f4\u6709\u7b56\u7565\u5730\u5e73\u8861\u804c\u4e1a\u9009\u62e9\u548c\u751f\u6d3b\u8ffd\u6c42\u3002");

  // --- Chapter header helper (第X章 / Chapter X) ---
  const chapterOrdinals = ["\u4e00", "\u4e8c", "\u4e09"];
  const fusionChapterHeader = (num: number, title: string) => `
    <div class="cpc-part-header">
      <span class="cpc-part-number">${isEn ? `Chapter ${num}` : `\u7b2c${chapterOrdinals[num - 1] || num}\u7ae0`}</span>
      <span class="cpc-part-title">${title}</span>
    </div>`;

  // --- Section header helper ---
  const sectionHeader = (title: string) => `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${title}</span>
    </div>`;

  return `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'zh'}">
<head>
  <meta charset="UTF-8">
  <title>${t("Comprehensive Analysis Report", "\u7d9c\u5408\u5206\u6790\u5831\u544a", "\u7efc\u5408\u5206\u6790\u62a5\u544a")}</title>
  <style>${CPC_REPORT_CSS}</style>
</head>
<body>
<div class="cpc-report-root">

  <!-- ====== Chapter 1: Career Anchor Assessment Report ====== -->
  ${fusionChapterHeader(1, t("Career Anchor Assessment Report", "\u8077\u696d\u9328\u6e2c\u8a55\u5831\u544a", "\u804c\u4e1a\u951a\u6d4b\u8bc4\u62a5\u544a"))}

  <div data-keep-together style="padding:24px;background:linear-gradient(135deg, #1C2857 0%, #2a3d6e 100%);border-radius:12px;color:#fff;margin-bottom:24px;page-break-inside:avoid;">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.5);margin-bottom:4px;font-weight:600;">${fusionAnchorLabel}</div>
    <div style="font-size:22px;font-weight:700;margin-bottom:4px;">${mainAnchorName}</div>
    ${fusionHasCoreAdvantage
      ? `<div style="font-size:36px;font-weight:800;font-family:'Montserrat',sans-serif;line-height:1;">${Math.round(data.scores[fusionDisplayAnchor] || 0)}</div>`
      : `<div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">${t('Structural drive combination', '\u7d50\u69cb\u6027\u9a45\u52d5\u7d44\u5408', '\u7ed3\u6784\u6027\u9a71\u52a8\u7ec4\u5408')}</div>`}
  </div>

  <div style="background:#f8f9fa;border-radius:12px;border:1px solid #E9ECEF;overflow:hidden;margin-bottom:24px;">
    ${scoreRowsHtml}
  </div>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- ====== Chapter 2: Espresso Card Assessment Report ====== -->
  ${fusionChapterHeader(2, t("Espresso Card Assessment Report", "\u7406\u60f3\u4eba\u751f\u5361\u6e2c\u8a55\u5831\u544a", "\u7406\u60f3\u4eba\u751f\u5361\u6d4b\u8bc4\u62a5\u544a"))}

  ${sectionHeader(t("Three Most Important Values", "\u6700\u91cd\u8981\u7684\u4e09\u500b\u50f9\u503c", "\u6700\u91cd\u8981\u7684\u4e09\u4e2a\u4ef7\u503c"))}
  <div data-keep-together style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px;page-break-inside:avoid;">
    ${topCardsHtml}
  </div>

  ${sectionHeader(t("Value Category Distribution", "\u50f9\u503c\u985e\u5225\u5206\u4f48", "\u4ef7\u503c\u7c7b\u522b\u5206\u5e03"))}
  <div style="background:#f8f9fa;border-radius:12px;border:1px solid #E9ECEF;padding:20px;margin-bottom:24px;page-break-inside:avoid;">
    ${distHtml}
  </div>

  ${sectionHeader(t("Work vs Life Orientation", "\u5de5\u4f5c\u53d6\u5411 vs \u751f\u6d3b\u53d6\u5411", "\u5de5\u4f5c\u53d6\u5411 vs \u751f\u6d3b\u53d6\u5411"))}
  <div data-keep-together style="page-break-inside:avoid;margin-bottom:24px;">
    <div style="display:flex;height:36px;border-radius:8px;overflow:hidden;margin-bottom:8px;">
      <div style="width:${workPct}%;line-height:36px;text-align:center;background:#e74c6f;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;">${t("Work", "\u5de5\u4f5c", "\u5de5\u4f5c")} ${workPct}%</div>
      <div style="width:${lifePct}%;line-height:36px;text-align:center;background:#7c3aed;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;">${t("Life", "\u751f\u6d3b", "\u751f\u6d3b")} ${lifePct}%</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
      <div style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:#e74c6f;display:inline-block;"></span>${t("Intrinsic + Material", "\u5167\u5728\u50f9\u503c + \u7269\u8cea\u689d\u4ef6", "\u5185\u5728\u4ef7\u503c + \u7269\u8d28\u6761\u4ef6")}</div>
      <div style="display:flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:2px;background:#7c3aed;display:inline-block;"></span>${t("Lifestyle + Interpersonal", "\u751f\u6d3b\u65b9\u5f0f + \u4eba\u969b\u95dc\u4fc2", "\u751f\u6d3b\u65b9\u5f0f + \u4eba\u9645\u5173\u7cfb")}</div>
    </div>
  </div>

  ${sectionHeader(t("Complete Rankings", "\u5b8c\u6574\u6392\u5e8f", "\u5b8c\u6574\u6392\u5e8f"))}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:24px;">
    ${fullCardsHtml}
  </div>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- ====== Chapter 3: Fusion Analysis Report ====== -->
  ${fusionChapterHeader(3, t("Integrated Analysis Report", "\u6574\u5408\u5206\u6790\u5831\u544a", "\u6574\u5408\u5206\u6790\u62a5\u544a"))}

  ${generateFusionChartsHTML(data.scores, data.rankedCards, language, data.narrative)}

  <footer style="margin-top:48px;padding-top:20px;padding-bottom:20px;border-top:2px solid #E9ECEF;text-align:center;color:#94a3b8;font-size:11px;">
    <p>SCPC &mdash; Strategic Career Planning Consultant</p>
  </footer>
</div>
</body>
</html>
  `.trim();
}

// ---------------------------------------------------------------------------
// Fusion V3 Development-Oriented Narrative Sections (Part 3 body)
// ---------------------------------------------------------------------------

export function generateFusionV3SectionsHTML(
  metrics: FusionV3Metrics,
  narrative: FusionNarrativeData | undefined,
  language: Language,
): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;

  const DEEP_BLUE = "#1C2857";
  const GREEN_ACCENT = "#B5D260";
  const GREEN_DARK = "#6B8A1A";

  const sectionHeader = (title: string) => `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${title}</span>
    </div>`;

  // ── Graceful fallback if no narrative available ──
  if (!narrative || (!narrative.report_understanding && !narrative.section3_alignment_breakdown)) {
    return `
    <div data-keep-together style="padding:32px;background:#f8f9fa;border-radius:12px;border:1px solid #E9ECEF;text-align:center;margin-bottom:24px;page-break-inside:avoid;">
      <div style="font-size:28px;margin-bottom:12px;">\u2728</div>
      <p style="font-size:15px;color:#64748b;line-height:1.8;margin:0;">
        ${t(
          "The AI-driven integrated development analysis is being generated. Please download the report again shortly.",
          "AI \u6574\u5408\u767c\u5c55\u5206\u6790\u6b63\u5728\u751f\u6210\u4e2d\uff0c\u8acb\u7a0d\u5f8c\u518d\u6b21\u4e0b\u8f09\u5831\u544a\u3002",
          "AI \u6574\u5408\u53d1\u5c55\u5206\u6790\u6b63\u5728\u751f\u6210\u4e2d\uff0c\u8bf7\u7a0d\u540e\u518d\u6b21\u4e0b\u8f7d\u62a5\u544a\u3002"
        )}
      </p>
    </div>`;
  }

  // ── Detect new vs legacy narrative format ──
  const isNewFormat = !!narrative.report_understanding;

  // ── If legacy format, render a simplified backward-compatible view ──
  if (!isNewFormat) {
    return generateLegacyFusionSectionsHTML(metrics, narrative, language);
  }

  // ============================================================
  //  NEW DEVELOPMENT-ORIENTED NARRATIVE RENDERING
  // ============================================================

  let html = "";

  // ── S2: Report Understanding ─────────────────────────────────
  html += `
  ${sectionHeader(t("Report Understanding", "\u5831\u544a\u7406\u89e3\u8aaa\u660e", "\u62a5\u544a\u7406\u89e3\u8bf4\u660e"))}
  <div data-keep-together style="padding:24px 28px;background:linear-gradient(135deg, ${DEEP_BLUE}08 0%, ${DEEP_BLUE}04 100%);border-radius:12px;border:1px solid ${DEEP_BLUE}18;border-left:4px solid ${DEEP_BLUE};margin-bottom:28px;page-break-inside:avoid;">
    <div style="display:flex;align-items:flex-start;gap:14px;">
      <div style="display:inline-block;width:36px;height:36px;line-height:36px;text-align:center;border-radius:50%;background:${DEEP_BLUE};color:#fff;font-size:16px;flex-shrink:0;margin-top:2px;">\u2139</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:${DEEP_BLUE};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;">
          ${t("Development-Oriented Framework", "\u767c\u5c55\u5c0e\u5411\u7406\u89e3\u6846\u67b6", "\u53d1\u5c55\u5bfc\u5411\u7406\u89e3\u6846\u67b6")}
        </div>
        <p style="font-size:14px;color:#374151;line-height:1.9;margin:0;">${narrative.report_understanding}</p>
      </div>
    </div>
  </div>`;

  // ── S3: Fusion Structure Overview ────────────────────────────
  if (narrative.structure_overview) {
    const structureTypeLabel = narrative.structure_overview.structure_type_label || getStructureTypeLabel(metrics.structureType, language);

    // 2D positioning
    const posX = metrics.positionX ?? 50;
    const posY = metrics.positionY ?? 50;
    const s3DotLeft = `${Math.round(posX * 0.82 + 9)}%`;
    const s3DotBottom = `${Math.round(posY * 0.82 + 9)}%`;

    html += `
  ${sectionHeader(t("Integrated Structure Overview", "\u6574\u5408\u7d50\u69cb\u7e3d\u89bd", "\u6574\u5408\u7ed3\u6784\u603b\u89c8"))}

  <!-- Structure Tag + Description -->
  <div data-keep-together style="display:flex;align-items:center;gap:14px;margin-bottom:22px;page-break-inside:avoid;">
    <span style="display:inline-block;text-align:center;padding:8px 26px 10px 26px;background:${GREEN_DARK}10;border-radius:100px;font-size:16px;font-weight:700;color:${GREEN_DARK};letter-spacing:0.5px;line-height:1;vertical-align:middle;">${structureTypeLabel}</span>
    <span style="font-size:13px;color:#64748b;line-height:1.6;flex:1;">${narrative.structure_overview.structure_type_description}</span>
  </div>

  <!-- 2D Development Structure Chart -->
  <div data-keep-together style="background:#fff;border:1px solid #f0f0ed;border-radius:14px;padding:28px;margin-bottom:24px;box-shadow:0 1px 4px rgba(0,0,0,0.04);page-break-inside:avoid;">
    <div style="position:relative;width:100%;max-width:380px;margin:0 auto;">
      <div style="position:relative;width:100%;padding-bottom:100%;background:linear-gradient(180deg,${DEEP_BLUE}06 0%,${GREEN_ACCENT}06 100%);border-radius:12px;">
        <!-- Grid lines -->
        <div style="position:absolute;left:50%;top:8%;bottom:8%;width:1px;background:linear-gradient(180deg,${DEEP_BLUE}25,${DEEP_BLUE}08);transform:translateX(-50%);"></div>
        <div style="position:absolute;top:50%;left:8%;right:8%;height:1px;background:linear-gradient(90deg,${DEEP_BLUE}08,${DEEP_BLUE}25,${GREEN_DARK}08);transform:translateY(-50%);"></div>
        <!-- Axis labels -->
        <div style="position:absolute;top:3%;left:50%;transform:translateX(-50%);font-size:10px;font-weight:600;color:${DEEP_BLUE};letter-spacing:0.5px;white-space:nowrap;">
          ${t("Strong Drive", "\u63a8\u9032\u52d5\u529b\u8f03\u5f37", "\u63a8\u8fdb\u52a8\u529b\u8f83\u5f3a")}
        </div>
        <div style="position:absolute;bottom:3%;left:50%;transform:translateX(-50%);font-size:10px;font-weight:500;color:#94a3b8;letter-spacing:0.5px;white-space:nowrap;">
          ${t("Gentle Rhythm", "\u7bc0\u594f\u8f03\u67d4\u6027", "\u8282\u594f\u8f83\u67d4\u6027")}
        </div>
        <div style="position:absolute;left:3%;top:50%;transform:translateY(-50%) rotate(-90deg);font-size:10px;font-weight:600;color:${DEEP_BLUE};letter-spacing:0.5px;white-space:nowrap;">
          ${t("Career Focus", "\u8077\u696d\u767c\u5c55\u95dc\u6ce8", "\u804c\u4e1a\u53d1\u5c55\u5173\u6ce8")}
        </div>
        <div style="position:absolute;right:3%;top:50%;transform:translateY(-50%) rotate(90deg);font-size:10px;font-weight:500;color:${GREEN_DARK};letter-spacing:0.5px;white-space:nowrap;">
          ${t("Life Focus", "\u751f\u6d3b\u9ad4\u9a57\u95dc\u6ce8", "\u751f\u6d3b\u4f53\u9a8c\u5173\u6ce8")}
        </div>
        <!-- Center integration zone -->
        <div style="position:absolute;top:35%;left:35%;width:30%;height:30%;border-radius:50%;background:radial-gradient(circle,${DEEP_BLUE}08,transparent);border:1px dashed ${DEEP_BLUE}15;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:9px;color:${DEEP_BLUE}50;font-weight:500;">
          ${t("Integration", "整合區", "整合区")}
        </div>
        <!-- User position orb -->
        <div style="position:absolute;left:${s3DotLeft};bottom:${s3DotBottom};transform:translate(-50%,50%);z-index:5;">
          <div style="width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${GREEN_ACCENT},${DEEP_BLUE});box-shadow:0 0 0 6px ${DEEP_BLUE}15,0 0 20px ${GREEN_ACCENT}40;border:2px solid #fff;"></div>
        </div>
      </div>
    </div>
    <p style="font-size:14px;color:#374151;line-height:1.9;margin:20px 0 0 0;text-align:center;">${narrative.structure_overview.position_description}</p>
  </div>`;
  }

  // ── S4: Core Development Focus ──────────────────────────────
  if (narrative.development_focus) {
    html += `
  ${sectionHeader(t("Core Development Focus", "\u6838\u5fc3\u767c\u5c55\u91cd\u5fc3", "\u6838\u5fc3\u53d1\u5c55\u91cd\u5fc3"))}

  <div data-keep-together style="padding:24px;background:#fff;border-radius:12px;border:1px solid #E9ECEF;margin-bottom:20px;page-break-inside:avoid;">
    <p style="font-size:14px;color:#1a1a2e;line-height:1.9;margin:0 0 20px 0;">${narrative.development_focus.focus_description}</p>

    <!-- Value Highlights -->
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">
        ${t("Value Spectrum Highlights", "\u50f9\u503c\u5149\u8b5c\u4eae\u9ede", "\u4ef7\u503c\u5149\u8c31\u4eae\u70b9")}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${(narrative.development_focus.value_highlights || []).map(item => `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:${GREEN_ACCENT}20;border:1px solid ${GREEN_ACCENT}60;border-radius:8px;page-break-inside:avoid;">
            <span style="width:8px;height:8px;border-radius:50%;background:${GREEN_ACCENT};flex-shrink:0;"></span>
            <span style="font-size:13px;color:#374151;line-height:1.5;">${item}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <!-- Anchor Highlights -->
    <div>
      <div style="font-size:11px;font-weight:700;color:${DEEP_BLUE};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">
        ${t("Career Anchor Highlights", "\u8077\u696d\u9328\u4eae\u9ede", "\u804c\u4e1a\u951a\u4eae\u70b9")}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${(narrative.development_focus.anchor_highlights || []).map(item => `
          <div style="display:flex;align-items:center;gap:8px;padding:8px 16px;background:${DEEP_BLUE}0A;border:1px solid ${DEEP_BLUE}25;border-radius:8px;page-break-inside:avoid;">
            <span style="width:8px;height:8px;border-radius:50%;background:${DEEP_BLUE};flex-shrink:0;"></span>
            <span style="font-size:13px;color:#374151;line-height:1.5;">${item}</span>
          </div>
        `).join("")}
      </div>
    </div>
  </div>`;
  }

  // ── S5: Tension & Integration Space ─────────────────────────
  if (narrative.tension_integration) {
    html += `
  ${sectionHeader(t("Development Tension & Integration Space", "\u767c\u5c55\u5f35\u529b\u8207\u6574\u5408\u7a7a\u9593", "\u53d1\u5c55\u5f20\u529b\u4e0e\u6574\u5408\u7a7a\u95f4"))}

  <!-- Venn / Dual-Circle Diagram -->
  <div data-keep-together style="background:#fff;border:1px solid #E9ECEF;border-radius:12px;padding:28px;margin-bottom:20px;page-break-inside:avoid;">
    <div style="position:relative;width:100%;max-width:400px;height:220px;margin:0 auto 20px;">
      <!-- Left circle: Career Anchor -->
      <div style="position:absolute;left:10%;top:10px;width:200px;height:200px;border-radius:50%;background:${DEEP_BLUE}12;border:2px solid ${DEEP_BLUE}40;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:12px;font-weight:700;color:${DEEP_BLUE};position:absolute;left:24px;top:50%;transform:translateY(-50%);">
          ${t("Career\nAnchors", "\u8077\u696d\u9328", "\u804c\u4e1a\u951a")}
        </span>
      </div>
      <!-- Right circle: Life Values -->
      <div style="position:absolute;right:10%;top:10px;width:200px;height:200px;border-radius:50%;background:${GREEN_ACCENT}18;border:2px solid ${GREEN_ACCENT}80;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:12px;font-weight:700;color:${GREEN_DARK};position:absolute;right:24px;top:50%;transform:translateY(-50%);">
          ${t("Life\nValues", "\u4eba\u751f\u50f9\u503c", "\u4eba\u751f\u4ef7\u503c")}
        </span>
      </div>
      <!-- Overlap zone -->
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:80px;text-align:center;">
        <div style="font-size:11px;font-weight:700;color:${DEEP_BLUE};">
          ${t("Integration\nZone", "\u6574\u5408\u5340", "\u6574\u5408\u533a")}
        </div>
      </div>
    </div>

    <!-- Overlap Description -->
    <div style="padding:16px 20px;background:${DEEP_BLUE}06;border-radius:8px;border:1px solid ${DEEP_BLUE}12;margin-bottom:12px;">
      <div style="font-size:11px;font-weight:700;color:${DEEP_BLUE};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">
        ${t("Overlap Zone", "\u91cd\u758a\u5340\u57df", "\u91cd\u53e0\u533a\u57df")}
      </div>
      <p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">${narrative.tension_integration.overlap_description}</p>
    </div>

    <!-- Explore Description -->
    <div style="padding:16px 20px;background:${GREEN_ACCENT}0C;border-radius:8px;border:1px solid ${GREEN_ACCENT}30;margin-bottom:12px;">
      <div style="font-size:11px;font-weight:700;color:${GREEN_DARK};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">
        ${t("Exploration Space", "\u63a2\u7d22\u7a7a\u9593", "\u63a2\u7d22\u7a7a\u95f4")}
      </div>
      <p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">${narrative.tension_integration.explore_description}</p>
    </div>

    <!-- Narrative -->
    <p style="font-size:14px;color:#1a1a2e;line-height:1.9;margin:16px 0 0 0;font-style:italic;">${narrative.tension_integration.narrative}</p>
  </div>`;
  }

  // ── S6: Situational Recommendations ─────────────────────────
  if (narrative.recommendations) {
    const recCards = [
      {
        icon: "\u{1F4BC}",
        label: t("Career Context", "\u8077\u696d\u60c5\u5883", "\u804c\u4e1a\u60c5\u5883"),
        content: narrative.recommendations.career_context,
        topColor: DEEP_BLUE,
        bg: `${DEEP_BLUE}06`,
        border: `${DEEP_BLUE}18`,
      },
      {
        icon: "\u{1F331}",
        label: t("Life Rhythm", "\u751f\u6d3b\u7bc0\u594f", "\u751f\u6d3b\u8282\u5965"),
        content: narrative.recommendations.life_rhythm,
        topColor: GREEN_ACCENT,
        bg: `${GREEN_ACCENT}0C`,
        border: `${GREEN_ACCENT}30`,
      },
      {
        icon: "\u{1F9ED}",
        label: t("Choice Perspective", "\u9078\u64c7\u8996\u89d2", "\u9009\u62e9\u89c6\u89d2"),
        content: narrative.recommendations.choice_perspective,
        topColor: "#7c3aed",
        bg: "#faf5ff",
        border: "#e9d5ff",
      },
    ];

    html += `
  ${sectionHeader(t("Situational Development Recommendations", "\u60c5\u5883\u767c\u5c55\u5efa\u8b70", "\u60c5\u5883\u53d1\u5c55\u5efa\u8bae"))}

  <div data-keep-together style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:28px;">
    ${recCards.map(card => `
    <div style="flex:1;min-width:200px;background:${card.bg};border-radius:12px;padding:24px 20px;border:1px solid ${card.border};border-top:4px solid ${card.topColor};page-break-inside:avoid;">
      <div style="font-size:22px;margin-bottom:8px;">${card.icon}</div>
      <div style="font-size:13px;font-weight:700;color:${card.topColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">${card.label}</div>
      <p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">${card.content}</p>
    </div>
    `).join("")}
  </div>`;
  }

  // ── S7: Stage Summary ───────────────────────────────────────
  if (narrative.stage_summary) {
    html += `
  ${sectionHeader(t("Stage Summary", "\u968e\u6bb5\u7e3d\u7d50", "\u9636\u6bb5\u603b\u7ed3"))}

  <div data-keep-together style="padding:28px 32px;background:linear-gradient(135deg, ${DEEP_BLUE} 0%, #2a3d6e 100%);border-radius:12px;color:#fff;margin-bottom:24px;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
      <span style="font-size:20px;line-height:1;">\u2728</span>
      <span style="font-size:15px;font-weight:700;letter-spacing:0.5px;">
        ${t("Your Current Stage", "\u60a8\u7684\u7576\u524d\u968e\u6bb5", "\u60a8\u7684\u5f53\u524d\u9636\u6bb5")}
      </span>
    </div>
    <p style="font-size:15px;line-height:2;margin:0;color:rgba(255,255,255,0.92);">${narrative.stage_summary}</p>
  </div>`;
  }

  return html;
}

// ---------------------------------------------------------------------------
// Legacy Fusion Sections (backward compatibility for old narrative format)
// ---------------------------------------------------------------------------

function generateLegacyFusionSectionsHTML(
  metrics: FusionV3Metrics,
  narrative: FusionNarrativeData,
  language: Language,
): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const t = (en: string, tw: string, cn: string) => isEn ? en : isTW ? tw : cn;

  const sectionHeader = (title: string) => `
    <div class="cpc-section-header-compact">
      <span class="cpc-section-header-compact-title">${title}</span>
    </div>`;

  const metricColor = (score: number, higherIsBetter: boolean) => {
    const normalised = higherIsBetter ? score : 100 - score;
    if (normalised >= 70) return { accent: "#059669", bg: "#ecfdf5", border: "#a7f3d0" };
    if (normalised >= 40) return { accent: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" };
    return { accent: "#d97706", bg: "#fffbeb", border: "#fde68a" };
  };

  let html = "";

  // Quantitative overview
  const alignmentMC = metricColor(metrics.alignmentScore, true);
  const tensionMC = metricColor(metrics.tensionIndex, false);

  html += `
  ${sectionHeader(t("Quantitative Overview", "\u91cf\u5316\u6982\u89bd", "\u91cf\u5316\u6982\u89c8"))}
  <div data-keep-together style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:24px;">
    <div style="background:${alignmentMC.bg};border:1px solid ${alignmentMC.border};border-radius:12px;padding:20px 16px;text-align:center;page-break-inside:avoid;">
      <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${t("Alignment", "\u4e00\u81f4\u5ea6", "\u4e00\u81f4\u5ea6")}</div>
      <div style="font-size:32px;font-weight:800;color:${alignmentMC.accent};font-family:'Montserrat',sans-serif;line-height:1;">${metrics.alignmentScore}<span style="font-size:14px;font-weight:500;color:#94a3b8;">/100</span></div>
    </div>
    <div style="background:${tensionMC.bg};border:1px solid ${tensionMC.border};border-radius:12px;padding:20px 16px;text-align:center;page-break-inside:avoid;">
      <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${t("Tension", "\u5f35\u529b", "\u5f20\u529b")}</div>
      <div style="font-size:32px;font-weight:800;color:${tensionMC.accent};font-family:'Montserrat',sans-serif;line-height:1;">${metrics.tensionIndex}<span style="font-size:14px;font-weight:500;color:#94a3b8;">/100</span></div>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px 16px;text-align:center;page-break-inside:avoid;">
      <div style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${t("Balance", "\u5e73\u8861\u5ea6", "\u5e73\u8861\u5ea6")}</div>
      <div style="font-size:32px;font-weight:800;color:#2563eb;font-family:'Montserrat',sans-serif;line-height:1;">${metrics.balance}<span style="font-size:14px;font-weight:500;color:#94a3b8;">/100</span></div>
    </div>
  </div>`;

  // Legacy alignment breakdown
  if (narrative.section3_alignment_breakdown) {
    html += `
  ${sectionHeader(t("Alignment Analysis", "\u4e00\u81f4\u5ea6\u5206\u6790", "\u4e00\u81f4\u5ea6\u5206\u6790"))}
  <div style="padding:20px;background:#f8f9fa;border-radius:12px;border:1px solid #E9ECEF;margin-bottom:24px;page-break-inside:avoid;">
    <p style="font-size:14px;color:#1a1a2e;line-height:1.8;margin:0;">${narrative.section3_alignment_breakdown.overview}</p>
  </div>`;
  }

  // Legacy recommendations
  if (narrative.section7_recommendations && narrative.section7_recommendations.length > 0) {
    html += `
  ${sectionHeader(t("Recommendations", "\u5efa\u8b70", "\u5efa\u8bae"))}
  ${narrative.section7_recommendations.map((rec, idx) => `
    <div style="display:flex;gap:16px;margin:14px 0;padding:20px;background:#fff;border-radius:12px;border:1px solid #E9ECEF;page-break-inside:avoid;">
      <div style="display:inline-block;width:32px;height:32px;line-height:32px;text-align:center;border-radius:50%;background:#1C2857;color:#fff;font-size:14px;font-weight:700;font-family:'Montserrat',sans-serif;flex-shrink:0;">${idx + 1}</div>
      <div style="flex:1;">
        <div style="font-size:15px;font-weight:700;color:#1C2857;margin-bottom:4px;">${rec.action}</div>
        <p style="font-size:13px;color:#374151;line-height:1.7;margin:0;">${rec.expected_benefit}</p>
      </div>
    </div>
  `).join("")}`;
  }

  return html;
}

export async function downloadComprehensiveReportFromDisplay(params: {
  mainAnchor: string;
  coreAdvantageAnchors?: string[];
  scores: Record<string, number>;
  stability: string;
  riskIndex: number;
  conflictAnchors?: string[];
  questionCount?: number;
  completionTime?: number;
  userName?: string;
  careerStage?: string | null;
  answers?: StoredAnswer[] | null;
  createdAt?: string;
}, language: Language): Promise<void> {
  const reportData: ComprehensiveReportData = {
    mainAnchor: params.mainAnchor,
    coreAdvantageAnchors: params.coreAdvantageAnchors,
    scores: params.scores,
    stability: params.stability,
    riskIndex: params.riskIndex,
    conflictAnchors: params.conflictAnchors || [],
    createdAt: params.createdAt || new Date().toLocaleString(language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN"),
    questionCount: params.questionCount,
    completionTime: params.completionTime,
    userName: params.userName,
    careerStage: params.careerStage,
    answers: params.answers || null,
  };

  const html = generateComprehensiveReportHTML(reportData, language);
  const pdfFilename = `comprehensive-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  await downloadHtmlAsPdfWithBreaks(html, pdfFilename);
}
