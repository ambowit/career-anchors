import { DIMENSIONS, getHighSensitivityAnchors } from "@/hooks/useAssessment";
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
import {
  IDEAL_CARDS,
  CATEGORY_CONFIG,
  getCardLabel,
  getCategoryLabel,
  type CardCategory,
} from "@/data/idealCards";

interface ReportData {
  mainAnchor: string;
  highSensitivityAnchors?: string[];
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
  const computedHighSens = data.highSensitivityAnchors?.length ? data.highSensitivityAnchors : getHighSensitivityAnchors(data.scores);
  const hasHighSens = computedHighSens.length > 0;
  const displayAnchor = computedHighSens[0] || data.mainAnchor;
  const mainAnchorLabel = hasHighSens
    ? (isEn ? "High-Sensitivity Anchor" : isTW ? "高敏感錨" : "高敏感锚")
    : (isEn ? "Top Anchor" : isTW ? "最高分錨點" : "最高分锚点");
  const scoresLabel = isEn ? "Dimension Scores" : isTW ? "維度得分" : "维度得分";
  const stabilityLabel = isEn ? "Stability" : isTW ? "穩定性" : "稳定性";
  const riskLabel = isEn ? "Risk Index" : isTW ? "風險指數" : "风险指数";
  const conflictLabel = isEn ? "Conflicting Anchors" : isTW ? "衝突錨" : "冲突锚";
  const generatedLabel = isEn ? "Generated" : isTW ? "生成時間" : "生成时间";
  const questionCountLabel = isEn ? "Questions Answered" : isTW ? "答題數量" : "答题数量";
  const timeLabel = isEn ? "Completion Time" : isTW ? "完成用時" : "完成用时";
  
  const sortedScores = Object.entries(data.scores)
    .sort(([, a], [, b]) => b - a);
  const topRawScore = sortedScores.length > 0 ? sortedScores[0][1] : 1;
  
  const scoreRows = sortedScores.map(([code, score]) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${getDimensionName(code, language)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
          <div style="width: 200px; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden;">
            <div style="width: ${topRawScore > 0 ? Math.min((score / topRawScore) * 100, 100) : 0}%; height: 100%; background: ${score >= 80 ? '#22c55e' : score >= 65 ? '#eab308' : '#94a3b8'}; border-radius: 4px;"></div>
          </div>
          <span style="min-width: 40px; font-weight: 600;">${Math.round(score)}</span>
        </div>
      </td>
    </tr>
  `).join("");

  const conflictSection = data.conflictAnchors && data.conflictAnchors.length > 0 
    ? `
      <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h3 style="margin: 0 0 8px 0; color: #92400e;">${conflictLabel}</h3>
        <p style="margin: 0; color: #78350f;">
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
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
      background: #fff;
      color: #1a1a1a;
    }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <header style="text-align: center; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #eee;">
    <h1 style="margin: 0; font-size: 28px; color: #1a365d;">${title}</h1>
    ${data.userName ? `<p style="margin: 8px 0 0 0; color: #64748b; font-size: 16px;">${data.userName}</p>` : ""}
    ${data.workExpDescription ? `<p style="margin: 8px 0 0 0; color: #475569; font-size: 15px; font-weight: 500;">${data.workExpDescription}</p>` : ""}
    <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 14px;">${metaInfo.join(" | ")}</p>
  </header>

  <section style="margin-bottom: 32px;">
    <div style="display: flex; gap: 24px; flex-wrap: wrap;">
      <div style="flex: 1; min-width: 200px; padding: 24px; background: linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); border-radius: 12px; color: white;">
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
    <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #334155;">${scoresLabel}</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tbody>
        ${scoreRows}
      </tbody>
    </table>
  </section>

  <footer style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; text-align: center; color: #94a3b8; font-size: 12px;">
    <p>Career Anchor Assessment System</p>
  </footer>
</body>
</html>
  `.trim();
}

export async function downloadHtmlAsPdf(htmlContent: string, filename: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.width = "800px";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.background = "#ffffff";
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 800,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    // Add left/right margins so content doesn't touch page edges
    const marginXMm = 12;
    const contentWidthMm = pdfWidth - marginXMm * 2;

    // Calculate the canvas height that fits one PDF page (in canvas pixels)
    const pageCanvasHeight = Math.floor((pdfHeight * canvas.width) / contentWidthMm);
    // Add generous bottom margin (in canvas pixels) to avoid text touching page edge
    const bottomMarginPx = Math.floor(pageCanvasHeight * 0.06);
    const topMarginPx = Math.floor(pageCanvasHeight * 0.03);
    const effectivePageHeight = pageCanvasHeight - bottomMarginPx - topMarginPx;

    let yOffset = 0;
    let pageIndex = 0;

    while (yOffset < canvas.height) {
      const sliceHeight = Math.min(effectivePageHeight, canvas.height - yOffset);

      // Create a canvas slice for this page
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0, yOffset, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        );
      }

      if (pageIndex > 0) pdf.addPage();
      const pageImgData = pageCanvas.toDataURL("image/png");
      const sliceHeightMm = (sliceHeight * contentWidthMm) / canvas.width;
      // Apply top margin for continuation pages to prevent text touching top edge
      const topOffsetMm = pageIndex > 0 ? (topMarginPx * contentWidthMm) / canvas.width : 0;
      pdf.addImage(pageImgData, "PNG", marginXMm, topOffsetMm, contentWidthMm, sliceHeightMm);

      yOffset += effectivePageHeight;
      pageIndex++;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Section-aware PDF renderer that breaks pages at logical section boundaries
 * instead of arbitrary positions. Uses data-page-break markers in the HTML.
 */
async function downloadHtmlAsPdfWithBreaks(htmlContent: string, filename: string): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const container = document.createElement("div");
  container.innerHTML = htmlContent;
  container.style.width = "800px";
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.background = "#ffffff";
  document.body.appendChild(container);

  try {
    // Collect break-point positions from markers before canvas render
    const containerRect = container.getBoundingClientRect();
    const markers = container.querySelectorAll("[data-page-break]");
    const breakPixels: number[] = [];
    markers.forEach(marker => {
      const rect = (marker as HTMLElement).getBoundingClientRect();
      breakPixels.push(rect.top - containerRect.top);
    });

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 800,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
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

    // Require at least 35% page fill before accepting a break point
    const minFillMm = pdfHeight * 0.35;

    let pageTopMm = 0;
    let pageIndex = 0;
    // Top margin for continuation pages so text doesn't touch the edge
    const continuationMarginMm = 6;

    while (pageTopMm < imgHeight - 1) {
      if (pageIndex > 0) pdf.addPage();

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

      // Slice the canvas for this page section
      const sliceTopPx = Math.floor((pageTopMm / imgHeight) * canvas.height);
      const sliceBottomPx = Math.min(Math.floor((nextPageTop / imgHeight) * canvas.height), canvas.height);
      const sliceHeightPx = sliceBottomPx - sliceTopPx;

      if (sliceHeightPx > 0) {
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

        const pageImgData = pageCanvas.toDataURL("image/png");
        const sliceHeightMm = (sliceHeightPx * imgWidth) / canvas.width;
        const yOffsetMm = pageIndex > 0 ? continuationMarginMm : 0;
        pdf.addImage(pageImgData, "PNG", marginXMm, yOffsetMm, imgWidth, sliceHeightMm);
      }

      pageTopMm = nextPageTop;
      pageIndex++;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadReportAsPdf(data: ReportData, language: Language, filename?: string): Promise<void> {
  const html = generateReportHTML(data, language);
  const pdfFilename = filename
    ? filename.replace(/\.html$/i, ".pdf")
    : `career-anchor-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  await downloadHtmlAsPdf(html, pdfFilename);
}

export function downloadReport(data: ReportData, language: Language, filename?: string): void {
  const html = generateReportHTML(data, language);
  const pdfFilename = filename
    ? filename.replace(/\.html$/i, ".pdf")
    : `career-anchor-report-${new Date().toISOString().slice(0, 10)}.pdf`;
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
  language: Language
): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  
  const headers = [
    "ID",
    isEn ? "User ID" : isTW ? "使用者ID" : "用户ID",
    isEn ? "High-Sensitivity Anchor" : isTW ? "高敏感錨" : "高敏感锚",
    isEn ? "TF Score" : isTW ? "技術/專業能力型" : "技术/专业能力型",
    isEn ? "GM Score" : isTW ? "管理型" : "管理型",
    isEn ? "AU Score" : isTW ? "自主/獨立型" : "自主/独立型",
    isEn ? "SE Score" : isTW ? "安全/穩定型" : "安全/稳定型",
    isEn ? "EC Score" : isTW ? "創業/創造型" : "创业/创造型",
    isEn ? "SV Score" : isTW ? "服務/奉獻型" : "服务/奉献型",
    isEn ? "CH Score" : isTW ? "挑戰型" : "挑战型",
    isEn ? "LS Score" : isTW ? "生活方式整合型" : "生活方式整合型",
    isEn ? "Risk Index" : isTW ? "風險指數" : "风险指数",
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
    a.id,
    a.user_id,
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

// =====================================================
// Comprehensive (Full) Report
// =====================================================

interface ComprehensiveReportData {
  mainAnchor: string;
  highSensitivityAnchors?: string[];
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
    if (score >= 80) return { label: "Non-negotiable", color: "#dc2626" };
    if (score >= 65) return { label: "Highly sensitive", color: "#d97706" };
    if (score >= 45) return { label: "Conditional", color: "#2563eb" };
    return { label: "Non-core", color: "#94a3b8" };
  }
  if (language === "zh-TW") {
    if (score >= 80) return { label: "不可妥協", color: "#dc2626" };
    if (score >= 65) return { label: "高敏感", color: "#d97706" };
    if (score >= 45) return { label: "條件性", color: "#2563eb" };
    return { label: "非核心", color: "#94a3b8" };
  }
  if (score >= 80) return { label: "不可妥协", color: "#dc2626" };
  if (score >= 65) return { label: "高敏感", color: "#d97706" };
  if (score >= 45) return { label: "条件性", color: "#2563eb" };
  return { label: "非核心", color: "#94a3b8" };
};

export function generateComprehensiveReportHTML(data: ComprehensiveReportData, language: Language): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const langKey = language as string;

  // ---------- Labels ----------
  const labels = {
    title: isEn ? "Career Anchor Assessment — Comprehensive Report" : isTW ? "職業錨測評 — 完整版報告" : "职业锚测评 — 完整版报告",
    partOne: isEn ? "Part 1: Score Overview" : isTW ? "第一部分：得分概覽" : "第一部分：得分概览",
    partTwo: isEn ? "Part 2: Anchor Interpretation" : isTW ? "第二部分：錨點詳解" : "第二部分：锚点详解",
    partThree: isEn ? "Part 3: Stage-Specific Development Guide" : isTW ? "第三部分：階段性發展指引" : "第三部分：阶段性发展指引",
    partFour: isEn ? "Part 4: Action Recommendations" : isTW ? "第四部分：執行建議" : "第四部分：执行建议",
    partFive: isEn ? "Part 5: Answer Details" : isTW ? "第五部分：答題明細" : "第五部分：答题明细",
    highSensAnchor: isEn ? "High-Sensitivity Anchor" : isTW ? "高敏感錨" : "高敏感锚",
    noHighSens: isEn ? "Top Anchor" : isTW ? "最高分錨點" : "最高分锚点",
    stability: isEn ? "Stability" : isTW ? "穩定性" : "稳定性",
    riskIndex: isEn ? "Risk Index" : isTW ? "風險指數" : "风险指数",
    coreNeed: isEn ? "Core Need" : isTW ? "核心需求" : "核心需求",
    ifPresent: isEn ? "If present long-term" : isTW ? "如果長期存在" : "如果长期存在",
    ifAbsent: isEn ? "If missing long-term" : isTW ? "如果長期缺失" : "如果长期缺失",
    conflictAnchors: isEn ? "Conflicting Anchors" : isTW ? "衝突錨" : "冲突锚",
    conflictNote: isEn ? "You care about two things that are structurally hard to satisfy simultaneously long-term." : isTW ? "你同時在意兩種長期很難同時滿足的東西。" : "你同时在意两种长期很难同时满足的东西。这不代表你不够好，而是任何人长期面对这种张力都会消耗。",
    constraintLevel: isEn ? "Constraint Level" : isTW ? "約束力" : "约束力",
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

  const compHighSens = data.highSensitivityAnchors?.length ? data.highSensitivityAnchors : getHighSensitivityAnchors(data.scores);
  const compHasHighSens = compHighSens.length > 0;
  const compDisplayAnchor = compHighSens[0] || data.mainAnchor;
  const mainAnchorName = getDimensionName(compDisplayAnchor, language);
  const compAnchorLabel = compHasHighSens ? labels.highSensAnchor : labels.noHighSens;
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
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; font-weight:500; vertical-align:middle;">${getDimensionName(code, language)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; width:200px; vertical-align:middle;">
          <div style="height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
            <div style="width:${topScore > 0 ? Math.min((score / topScore) * 100, 100) : 0}%; height:100%; background:${level.color}; border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:700; width:50px; vertical-align:middle;">${Math.round(score)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; width:90px; vertical-align:middle;">
          <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; color:${level.color}; background:${level.color}15;">${level.label}</span>
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
          ${data.conflictAnchors.map(code => `<span style="padding:3px 10px; background:#fef3c7; color:#92400e; border-radius:12px; font-size:12px; font-weight:600;">${getDimensionName(code, language)}</span>`).join("")}
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
          <h2 style="font-size:18px; color:#1a365d; border-bottom:2px solid #e2e8f0; padding-bottom:8px; margin-bottom:20px;">${labels.partThree}</h2>
          <div style="padding:20px; background:linear-gradient(135deg, #0f4c5c, #1a6b7a); border-radius:12px; color:white;">
            <div style="font-size:12px; opacity:0.6; margin-bottom:4px;">${compAnchorLabel} · ${stageName}</div>
            <div style="font-size:20px; font-weight:700; margin-bottom:16px;">${mainAnchorName}</div>
            <div style="padding:12px; background:rgba(255,255,255,0.1); border-radius:8px; margin-bottom:12px;">
              <div style="font-size:11px; opacity:0.6; margin-bottom:4px;">${labels.stageMeaning}</div>
              <div style="font-size:13px; line-height:1.7;">${stageInterp.meaning[langKey] || stageInterp.meaning["zh-CN"]}</div>
            </div>
            <div style="padding:12px; background:rgba(255,255,255,0.1); border-radius:8px; margin-bottom:12px;">
              <div style="font-size:11px; opacity:0.6; margin-bottom:6px;">${labels.stageChars}</div>
              <ul style="margin:0; padding-left:18px; font-size:13px; line-height:1.7;">${chars}</ul>
            </div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
              <div style="flex:1; min-width:200px; padding:12px; background:rgba(16,185,129,0.15); border-radius:8px;">
                <div style="font-size:11px; color:#6ee7b7; margin-bottom:4px;">${labels.stageDev}</div>
                <div style="font-size:13px; line-height:1.7;">${stageInterp.development[langKey] || stageInterp.development["zh-CN"]}</div>
              </div>
              <div style="flex:1; min-width:200px; padding:12px; background:rgba(239,68,68,0.15); border-radius:8px;">
                <div style="font-size:11px; color:#fca5a5; margin-bottom:4px;">${labels.stageRisk}</div>
                <div style="font-size:13px; line-height:1.7;">${stageInterp.risk[langKey] || stageInterp.risk["zh-CN"]}</div>
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
    <div style="padding:14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:10px;">
      <div style="display:flex; gap:10px; align-items:flex-start;">
        <span style="flex-shrink:0; width:22px; height:22px; border-radius:50%; background:#3b82f6; color:white; font-size:11px; font-weight:700; line-height:22px; text-align:center; display:inline-block;">${index + 1}</span>
        <div>
          <div style="font-weight:600; font-size:14px; margin-bottom:4px;">${item.title}</div>
          <div style="font-size:12px; color:#64748b; line-height:1.6;">${item.description}</div>
          ${item.resources ? `<div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">${item.resources.map(r => `<span style="padding:2px 8px; background:#eff6ff; color:#2563eb; font-size:11px; border-radius:4px;">${r}</span>`).join("")}</div>` : ""}
        </div>
      </div>
    </div>
  `).join("");

  const pathsHtml = actionPlan.paths.map(path => `
    <div style="padding:14px; background:${path.recommended ? '#faf5ff' : '#f8fafc'}; border-radius:8px; border:1px solid ${path.recommended ? '#e9d5ff' : '#e2e8f0'}; margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div style="font-weight:600; font-size:14px;">${path.title}</div>
        ${path.recommended ? `<span style="padding:2px 8px; background:#7c3aed; color:white; font-size:11px; font-weight:700; border-radius:4px;">${labels.recommended}</span>` : ""}
      </div>
      <div style="font-size:12px; color:#64748b; line-height:1.6; margin-bottom:8px;">${path.description}</div>
      <div style="display:flex; gap:16px; font-size:12px;">
        <span style="color:#94a3b8;">${labels.timeline}: <strong style="color:#334155;">${path.timeline}</strong></span>
        <span style="color:#94a3b8;">${labels.risk}: <strong style="color:${path.risk === '高' || path.risk === 'High' ? '#dc2626' : path.risk === '中' || path.risk === 'Medium' ? '#d97706' : '#059669'};">${path.risk}</strong></span>
      </div>
    </div>
  `).join("");

  const verificationHtml = actionPlan.verification.map((step, index) => `
    <div style="display:flex; gap:10px; padding:10px; background:#ecfdf5; border-radius:8px; border:1px solid #d1fae5; margin-bottom:8px;">
      <span style="flex-shrink:0; width:20px; height:20px; border-radius:50%; background:#d1fae5; color:#047857; font-size:11px; font-weight:700; line-height:20px; text-align:center; display:inline-block;">${index + 1}</span>
      <div>
        <div style="font-size:13px; font-weight:500; color:#1e293b;">${step.action}</div>
        <div style="font-size:12px; color:#64748b; margin-top:2px;">${step.purpose}</div>
      </div>
    </div>
  `).join("");

  const tradeoffsHtml = actionPlan.tradeoffs.length > 0 ? `
    <div style="margin-top:20px; padding:16px; background:#fffbeb; border-radius:8px; border-left:4px solid #f59e0b;">
      <h4 style="margin:0 0 8px; font-size:14px; color:#92400e;">${labels.tradeoffs}</h4>
      <ul style="margin:0 0 10px; padding-left:18px; font-size:13px; color:#78350f; line-height:1.8;">
        ${actionPlan.tradeoffs.map(t => `<li>${t}</li>`).join("")}
      </ul>
      <p style="margin:0; font-size:13px; font-weight:600; color:#78350f;">${labels.tradeoffNote}</p>
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
        <td style="padding:8px; border-bottom:1px solid #f1f5f9; font-size:12px; color:#94a3b8; text-align:center; width:40px;">${index + 1}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9; font-size:12px;">${answer.questionId}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9; font-size:12px;">${getDimensionName(answer.dimension, language)}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9; font-size:12px; text-align:center;">${likertLabels[answer.value] || answer.value}</td>
        <td style="padding:8px; border-bottom:1px solid #f1f5f9; font-size:12px; text-align:center;">${answer.weight}</td>
      </tr>
    `).join("");

    answersSection = `
      <div style="margin-top:32px; page-break-before:auto;">
        <h2 style="font-size:18px; color:#1a365d; border-bottom:2px solid #e2e8f0; padding-bottom:8px; margin-bottom:20px;">${labels.partFive}</h2>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px; text-align:center; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0; width:40px;">#</th>
              <th style="padding:8px; text-align:left; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0;">ID</th>
              <th style="padding:8px; text-align:left; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0;">${labels.dimension}</th>
              <th style="padding:8px; text-align:center; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0;">${labels.answer}</th>
              <th style="padding:8px; text-align:center; font-size:12px; color:#64748b; border-bottom:2px solid #e2e8f0;">W</th>
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
    return `<div><strong style="color:#1a365d;">${code}</strong> — ${fullName}</div>`;
  }).join("");

  // ---------- Assemble Full Report ----------
  return `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'zh'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${labels.title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif;
      max-width: 820px;
      margin: 0 auto;
      padding: 40px 24px;
      background: #fff;
      color: #1e293b;
      line-height: 1.6;
      font-size: 14px;
    }
    @media print {
      body { padding: 20px; font-size: 12px; }
      .no-print { display: none !important; }
    }
    h2 { page-break-after: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  </style>
</head>
<body>
  <!-- Header -->
  <header style="text-align:center; margin-bottom:36px; padding-bottom:20px; border-bottom:3px solid #1a365d;">
    <h1 style="margin:0 0 6px; font-size:26px; color:#1a365d;">${labels.title}</h1>
    ${data.userName ? `<p style="margin:4px 0; font-size:16px; color:#475569;">${data.userName}</p>` : ""}
    <p style="margin:4px 0 0; font-size:13px; color:#94a3b8;">${metaParts.join(" | ")}</p>
  </header>

  <!-- Summary Cards -->
  <section style="display:flex; gap:14px; flex-wrap:wrap; margin-bottom:28px;">
    <div style="flex:2; min-width:200px; padding:20px; background:linear-gradient(135deg, #1a365d, #2d4a7c); border-radius:12px; color:white;">
      <div style="font-size:12px; opacity:0.7;">${compAnchorLabel}</div>
      <div style="font-size:22px; font-weight:700; margin-top:4px;">${mainAnchorName}</div>
      ${compHasHighSens ? `<div style="font-size:28px; font-weight:800; margin-top:6px;">${Math.round(data.scores[compDisplayAnchor] || 0)}</div>` : `<div style="font-size:13px; opacity:0.7; margin-top:6px;">${isEn ? 'Structural combination state' : isTW ? '結構性組合狀態' : '结构性组合状态'}</div>`}
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
    <h2 style="font-size:18px; color:#1a365d; border-bottom:2px solid #e2e8f0; padding-bottom:8px; margin-bottom:16px;">${labels.partOne}</h2>
    <table style="width:100%; border-collapse:collapse;">
      <tbody>${scoreRows}</tbody>
    </table>
    <div style="margin-top:14px; padding:12px 14px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
      <div style="font-size:11px; color:#64748b; margin-bottom:6px; font-weight:600;">${labels.codeReference}</div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:3px 24px; font-size:12px; color:#475569;">
        ${dimensionLegend}
      </div>
    </div>
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- Part 2: Anchor Interpretation -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1a365d; border-bottom:2px solid #e2e8f0; padding-bottom:8px; margin-bottom:16px;">${labels.partTwo}</h2>
    <div style="padding:20px; background:linear-gradient(135deg, #1e3a5f, #2d5a8c); border-radius:12px; color:white;">
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
    <h2 style="font-size:18px; color:#1a365d; border-bottom:2px solid #e2e8f0; padding-bottom:8px; margin-bottom:16px;">${labels.partFour}</h2>
    
    <h3 style="font-size:15px; color:#334155; margin:0 0 12px;">${labels.learning}</h3>
    ${learningHtml}

    <h3 style="font-size:15px; color:#334155; margin:24px 0 12px;">${labels.careerPath}</h3>
    ${pathsHtml}

    <h3 style="font-size:15px; color:#334155; margin:24px 0 12px;">${labels.verification}</h3>
    ${verificationHtml}

    ${tradeoffsHtml}
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  ${answersSection}

  <!-- Footer -->
  <footer style="margin-top:48px; padding-top:20px; border-top:2px solid #e2e8f0; text-align:center; color:#94a3b8; font-size:11px;">
    <p style="margin:0;">Career Anchor Assessment System — ${isEn ? "Comprehensive Report" : isTW ? "完整版報告" : "完整版报告"}</p>
    <p style="margin:4px 0 0; font-size:10px;">Generated at ${new Date().toISOString()}</p>
  </footer>
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
  const pdfFilename = `comprehensive-report-${stored.id.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`;
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
}

/**
 * Renders a professional PDF with:
 * - Page 1: Full-page cover (gradient background, user info grid, report number)
 * - Pages 2+: Report body with page-break-aware sectioning
 * - Header/footer on every body page (report number, page title, copyright)
 */
export async function downloadReportWithCover(
  bodyHtml: string,
  options: ReportWithCoverOptions,
  filename: string
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  const reportNumber = generateReportNumber(options.userId);
  const assessmentDate = new Date().toLocaleDateString(
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
    ideal_card: { en: "Ideal Life Card Report", "zh-TW": "理想人生卡報告", "zh-CN": "理想人生卡报告" },
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
  coverContainer.style.background = "#ffffff";
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
    // Capture cover as a single image
    const coverCanvas = await html2canvas(coverContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      backgroundColor: "#ffffff",
    });

    // Collect break-point positions from body
    const bodyRect = bodyContainer.getBoundingClientRect();
    const markers = bodyContainer.querySelectorAll("[data-page-break]");
    const breakPixels: number[] = [];
    markers.forEach(marker => {
      const rect = (marker as HTMLElement).getBoundingClientRect();
      breakPixels.push(rect.top - bodyRect.top);
    });

    const bodyCanvas = await html2canvas(bodyContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 800,
      backgroundColor: "#ffffff",
    });

    // ---- Step 3: Assemble PDF ----
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // --- Cover page ---
    const coverImgData = coverCanvas.toDataURL("image/png");
    const coverImgHeight = (coverCanvas.height * pdfWidth) / coverCanvas.width;
    pdf.addImage(coverImgData, "PNG", 0, 0, pdfWidth, Math.min(coverImgHeight, pdfHeight));

    // --- Body pages ---
    const marginXMm = 12;
    const headerFooterReserveMm = 14; // space reserved for header + footer text
    const imgWidth = pdfWidth - marginXMm * 2;
    const imgHeight = (bodyCanvas.height * imgWidth) / bodyCanvas.width;

    const containerHeight = bodyRect.height || 1;
    const pxToMm = imgHeight / containerHeight;
    const breaksMm = breakPixels.map(px => px * pxToMm).sort((a, b) => a - b);
    const minFillMm = pdfHeight * 0.30;
    const bodyTopMarginMm = 8;
    const bodyBottomMarginMm = 6;

    let pageTopMm = 0;
    let bodyPageIndex = 0;

    while (pageTopMm < imgHeight - 1) {
      pdf.addPage();
      bodyPageIndex++;

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

      // Slice the canvas
      const sliceTopPx = Math.floor((pageTopMm / imgHeight) * bodyCanvas.height);
      const sliceBottomPx = Math.min(Math.floor((nextPageTop / imgHeight) * bodyCanvas.height), bodyCanvas.height);
      const sliceHeightPx = sliceBottomPx - sliceTopPx;

      if (sliceHeightPx > 0) {
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

        const pageImgData = pageCanvas.toDataURL("image/png");
        const sliceHeightMm = (sliceHeightPx * imgWidth) / bodyCanvas.width;
        // Place content below header area
        const contentTopMm = bodyTopMarginMm + 7;
        pdf.addImage(pageImgData, "PNG", marginXMm, contentTopMm, imgWidth, sliceHeightMm);
      }

      // --- Draw page header ---
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(pageTitle, marginXMm, bodyTopMarginMm + 3);
      pdf.text(reportNumber, pdfWidth - marginXMm, bodyTopMarginMm + 3, { align: "right" });
      // Header divider line
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

      pageTopMm = nextPageTop;
    }

    pdf.save(filename);
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
}

export function generateIdealCardReportHTML(data: IdealCardReportData, language: Language): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const labels = {
    title: isEn ? "Ideal Life Card Assessment Report" : isTW ? "理想人生卡測評報告" : "理想人生卡测评报告",
    subtitle: isEn ? "Solution-Focused Card Technique — Value Analysis" : isTW ? "焦點解決牌卡技術 — 價值觀分析" : "焦点解决牌卡技术 — 价值观分析",
    topThree: isEn ? "Your Three Most Important Life Values" : isTW ? "你最重要的三個人生價值" : "你最重要的三个人生价值",
    topThreeDesc: isEn ? "These three cards represent your deepest desires and pursuits — the compass for your most important life decisions." : isTW ? "這三張卡片代表了你內心最深處的渴望和追求，它們是你做人生重要決策時的指南針。" : "这三张卡片代表了你内心最深处的渴望和追求，它们是你做人生重要决策时的指南针。",
    distributionTitle: isEn ? "Category Distribution" : isTW ? "四大類別分佈" : "四大类别分布",
    orientationTitle: isEn ? "Work vs Life Orientation" : isTW ? "工作取向 vs 生活取向" : "工作取向 vs 生活取向",
    workLabel: isEn ? "Work Orientation" : isTW ? "工作取向" : "工作取向",
    lifeLabel: isEn ? "Life Orientation" : isTW ? "生活取向" : "生活取向",
    fullRanking: isEn ? "Complete Top 10 Ranking" : isTW ? "完整排序" : "完整排序",
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
      <div style="flex:1; min-width:180px; padding:20px; border-radius:12px; text-align:center; border:2px solid ${config.borderColor}; background:${config.bgColor};">
        <div style="width:36px; height:36px; border-radius:50%; background:#1a3a5c; color:white; font-weight:700; font-size:16px; line-height:36px; text-align:center; margin:0 auto 10px;">${index + 1}</div>
        <div style="font-weight:700; font-size:16px; color:#1e293b; margin-bottom:6px;">${cardLabel}</div>
        <div style="display:flex; align-items:center; justify-content:center; gap:5px;">
          <div style="width:8px; height:8px; border-radius:50%; background:${config.color};"></div>
          <span style="font-size:12px; font-weight:500; color:${config.color};">${categoryLabel}</span>
        </div>
      </div>
    `;
  }).join("");

  // Distribution bars
  const distBars = (Object.entries(distribution) as [CardCategory, number][]).map(([cat, count]) => {
    const config = CATEGORY_CONFIG[cat];
    const categoryLabel = getCategoryLabel(cat, language);
    const pct = Math.round((count / 10) * 100);
    return `
      <div style="margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-size:13px; font-weight:600; color:#334155;">${categoryLabel}</span>
          <span style="font-size:13px; font-weight:700; color:${config.color};">${count}/10</span>
        </div>
        <div style="height:10px; background:#f1f5f9; border-radius:5px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:${config.color}; border-radius:5px;"></div>
        </div>
      </div>
    `;
  }).join("");

  // Full ranking
  const rankRows = data.rankedCards.map(result => {
    const card = IDEAL_CARDS.find(c => c.id === result.cardId);
    if (!card) return "";
    const config = CATEGORY_CONFIG[result.category];
    const cardLabel = getCardLabel(card, language);
    const categoryLabel = getCategoryLabel(result.category, language);
    return `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:center; font-weight:700; color:#475569; width:40px;">${result.rank}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; font-weight:600; color:#1e293b;">${cardLabel}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9;">
          <span style="display:inline-flex; align-items:center; gap:5px; padding:2px 10px; border-radius:12px; font-size:11px; font-weight:600; color:${config.color}; background:${config.bgColor};">
            <span style="width:6px; height:6px; border-radius:50%; background:${config.color};"></span>
            ${categoryLabel}
          </span>
        </td>
      </tr>
    `;
  }).join("");

  const createdAtText = data.createdAt || new Date().toLocaleString(isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN");

  return `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'zh'}">
<head>
  <meta charset="UTF-8">
  <title>${labels.title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
      background: #fff;
      color: #1e293b;
      line-height: 1.6;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <header style="text-align:center; margin-bottom:36px; padding-bottom:20px; border-bottom:3px solid #e74c6f;">
    <h1 style="margin:0 0 6px; font-size:26px; color:#1e293b;">${labels.title}</h1>
    <p style="margin:4px 0; font-size:14px; color:#e74c6f; font-weight:500;">${labels.subtitle}</p>
    ${data.userName ? `<p style="margin:8px 0 0; font-size:16px; color:#475569;">${data.userName}</p>` : ""}
    <p style="margin:4px 0 0; font-size:12px; color:#94a3b8;">${labels.generated}: ${createdAtText}</p>
  </header>

  <!-- Top 3 Values -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:8px; margin-bottom:8px;">${labels.topThree}</h2>
    <p style="font-size:13px; color:#64748b; margin-bottom:16px;">${labels.topThreeDesc}</p>
    <div style="display:flex; gap:16px; flex-wrap:wrap;">
      ${topThreeHtml}
    </div>
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- Category Distribution -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:8px; margin-bottom:16px;">${labels.distributionTitle}</h2>
    ${distBars}
  </section>

  <!-- Orientation -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:8px; margin-bottom:16px;">${labels.orientationTitle}</h2>
    <div style="display:flex; height:40px; border-radius:12px; overflow:hidden;">
      <div style="width:${workPercent}%; background:#e74c6f; display:flex; align-items:center; justify-content:center;">
        <span style="color:white; font-size:12px; font-weight:700;">${labels.workLabel} ${workPercent}%</span>
      </div>
      <div style="width:${lifePercent}%; background:#7c3aed; display:flex; align-items:center; justify-content:center;">
        <span style="color:white; font-size:12px; font-weight:700;">${labels.lifeLabel} ${lifePercent}%</span>
      </div>
    </div>
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- Full Ranking -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:8px; margin-bottom:16px;">${labels.fullRanking}</h2>
    <table style="width:100%; border-collapse:collapse;">
      <tbody>${rankRows}</tbody>
    </table>
  </section>

  <footer style="margin-top:48px; padding-top:20px; border-top:2px solid #f1f5f9; text-align:center; color:#94a3b8; font-size:11px;">
    <p>SCPC &mdash; Strategic Career Planning Consultant</p>
  </footer>
</body>
</html>
  `.trim();
}

// =====================================================
// Fusion Analysis Report HTML Generator
// =====================================================

interface FusionReportData {
  mainAnchor: string;
  highSensitivityAnchors?: string[];
  scores: Record<string, number>;
  rankedCards: Array<{ rank: number; cardId: number; category: CardCategory }>;
  alignmentPercent: number;
  alignmentLevel: "high" | "moderate" | "low";
  userName?: string;
  createdAt?: string;
}

export function generateFusionAnalysisReportHTML(data: FusionReportData, language: Language): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const labels = {
    title: isEn ? "Comprehensive Analysis Report" : isTW ? "綜合分析報告" : "综合分析报告",
    subtitle: isEn ? "Career Anchor + Ideal Life Card — Cross Analysis" : isTW ? "職業錨 + 理想人生卡 — 交叉分析" : "职业锚 + 理想人生卡 — 交叉分析",
    partOne: isEn ? "Part 1: Career Anchor Scores" : isTW ? "第一部分：職業錨得分" : "第一部分：职业锚得分",
    partTwo: isEn ? "Part 2: Ideal Life Card Values" : isTW ? "第二部分：理想人生卡價值觀" : "第二部分：理想人生卡价值观",
    partThree: isEn ? "Part 3: Cross-Analysis" : isTW ? "第三部分：交叉分析" : "第三部分：交叉分析",
    alignmentTitle: isEn ? "Career-Life Value Alignment" : isTW ? "職涯與人生價值一致性" : "职涯与人生价值一致性",
    alignmentHigh: isEn ? "Highly Consistent" : isTW ? "高度一致" : "高度一致",
    alignmentModerate: isEn ? "Moderately Consistent" : isTW ? "中度一致" : "中度一致",
    alignmentLow: isEn ? "Needs Attention" : isTW ? "需要關注" : "需要关注",
    alignmentHighDesc: isEn ? "Your career drivers and life values are highly aligned — you're more likely to find lasting satisfaction in your career." : isTW ? "你的職業驅動力與人生價值觀高度契合，這意味著你更容易在職業中找到持久的滿足感。" : "你的职业驱动力与人生价值观高度契合，这意味着你更容易在职业中找到持久的满足感。",
    alignmentModDesc: isEn ? "Your career drivers and life values have some correlation but aren't fully aligned. You may need to consciously balance different needs." : isTW ? "你的職業驅動力與人生價值觀有一定關聯，但並非完全一致。你可能需要有意識地兼顧不同維度。" : "你的职业驱动力与人生价值观有一定关联，但并非完全一致。你可能需要有意识地兼顾不同维度。",
    alignmentLowDesc: isEn ? "There's tension between your career drivers and life values. You'll need a strategic approach to balancing career choices and life pursuits." : isTW ? "你的職業驅動力與人生價值觀之間存在張力。你需要更有策略地平衡職業選擇和生活追求。" : "你的职业驱动力与人生价值观之间存在张力。你需要更有策略地平衡职业选择和生活追求。",
    highSensAnchor: isEn ? "High-Sensitivity Anchor" : isTW ? "高敏感錨" : "高敏感锚",
    noHighSens: isEn ? "Top Anchor" : isTW ? "最高分錨點" : "最高分锚点",
    topValues: isEn ? "Top 3 Values" : isTW ? "前三名價值" : "前三名价值",
    distribution: isEn ? "Value Distribution" : isTW ? "價值分佈" : "价值分布",
    generated: isEn ? "Generated" : isTW ? "生成時間" : "生成时间",
    constraintLevel: isEn ? "Constraint Level" : isTW ? "約束力" : "约束力",
  };

  const fusionHighSens = data.highSensitivityAnchors?.length ? data.highSensitivityAnchors : getHighSensitivityAnchors(data.scores);
  const fusionHasHighSens = fusionHighSens.length > 0;
  const fusionDisplayAnchor = fusionHighSens[0] || data.mainAnchor;
  const mainAnchorName = getDimensionName(fusionDisplayAnchor, language);
  const fusionAnchorLabel = fusionHasHighSens ? labels.highSensAnchor : labels.noHighSens;
  const sortedScores = Object.entries(data.scores).sort(([, a], [, b]) => b - a);
  const topScoreValue = sortedScores.length > 0 ? sortedScores[0][1] : 1;

  // Score rows
  const scoreRows = sortedScores.map(([code, score]) => {
    const level = getScoreLevelLabel(score, language);
    return `
      <tr>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; font-weight:500;">${getDimensionName(code, language)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; width:200px;">
          <div style="height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
            <div style="width:${topScoreValue > 0 ? Math.min((score / topScoreValue) * 100, 100) : 0}%; height:100%; background:${level.color}; border-radius:4px;"></div>
          </div>
        </td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:700; width:50px;">${Math.round(score)}</td>
        <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; width:90px;">
          <span style="padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; color:${level.color}; background:${level.color}15;">${level.label}</span>
        </td>
      </tr>
    `;
  }).join("");

  // Top 3 ideal cards
  const topThree = data.rankedCards.slice(0, 3);
  const topCardsHtml = topThree.map((result, index) => {
    const card = IDEAL_CARDS.find(c => c.id === result.cardId);
    if (!card) return "";
    const config = CATEGORY_CONFIG[result.category];
    return `
      <div style="flex:1; min-width:160px; padding:16px; border-radius:12px; text-align:center; border:2px solid ${config.borderColor}; background:${config.bgColor};">
        <div style="width:30px; height:30px; border-radius:50%; background:#1a3a5c; color:white; font-weight:700; font-size:14px; line-height:30px; margin:0 auto 8px;">${index + 1}</div>
        <div style="font-weight:700; font-size:14px; color:#1e293b; margin-bottom:4px;">${getCardLabel(card, language)}</div>
        <span style="font-size:11px; color:${config.color};">${getCategoryLabel(result.category, language)}</span>
      </div>
    `;
  }).join("");

  // Value distribution
  const dist: Record<CardCategory, number> = { intrinsic: 0, lifestyle: 0, interpersonal: 0, material: 0 };
  data.rankedCards.forEach(r => { dist[r.category]++; });
  const distHtml = (Object.entries(dist) as [CardCategory, number][]).map(([cat, count]) => {
    const config = CATEGORY_CONFIG[cat];
    return `
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:12px; color:#475569; width:60px;">${getCategoryLabel(cat, language)}</span>
        <div style="flex:1; height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden;">
          <div style="width:${Math.round((count / 10) * 100)}%; height:100%; background:${config.color}; border-radius:4px;"></div>
        </div>
        <span style="font-size:12px; font-weight:700; color:${config.color}; width:30px; text-align:right;">${count}</span>
      </div>
    `;
  }).join("");

  // Alignment section
  const alignColor = data.alignmentLevel === "high" ? "#059669" : data.alignmentLevel === "moderate" ? "#2563eb" : "#ca8a04";
  const alignBg = data.alignmentLevel === "high" ? "#ecfdf5" : data.alignmentLevel === "moderate" ? "#eff6ff" : "#fefce8";
  const alignLabel = data.alignmentLevel === "high" ? labels.alignmentHigh : data.alignmentLevel === "moderate" ? labels.alignmentModerate : labels.alignmentLow;
  const alignDesc = data.alignmentLevel === "high" ? labels.alignmentHighDesc : data.alignmentLevel === "moderate" ? labels.alignmentModDesc : labels.alignmentLowDesc;

  const createdAtText = data.createdAt || new Date().toLocaleString(isEn ? "en-US" : isTW ? "zh-TW" : "zh-CN");

  return `
<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'zh'}">
<head>
  <meta charset="UTF-8">
  <title>${labels.title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
      background: #fff;
      color: #1e293b;
      line-height: 1.6;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <header style="text-align:center; margin-bottom:36px; padding-bottom:20px; border-bottom:3px solid #7c3aed;">
    <h1 style="margin:0 0 6px; font-size:26px; color:#1e293b;">${labels.title}</h1>
    <p style="margin:4px 0; font-size:14px; color:#7c3aed; font-weight:500;">${labels.subtitle}</p>
    ${data.userName ? `<p style="margin:8px 0 0; font-size:16px; color:#475569;">${data.userName}</p>` : ""}
    <p style="margin:4px 0 0; font-size:12px; color:#94a3b8;">${labels.generated}: ${createdAtText}</p>
  </header>

  <!-- Part 1: Career Anchor Scores -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:8px; margin-bottom:16px;">${labels.partOne}</h2>
    <div style="padding:20px; background:linear-gradient(135deg, #1a365d 0%, #2d4a7c 100%); border-radius:12px; color:white; margin-bottom:20px;">
      <div style="font-size:12px; opacity:0.7;">${fusionAnchorLabel}</div>
      <div style="font-size:22px; font-weight:700; margin-top:4px;">${mainAnchorName}</div>
      ${fusionHasHighSens ? `<div style="font-size:28px; font-weight:800; margin-top:4px;">${Math.round(data.scores[fusionDisplayAnchor] || 0)}</div>` : `<div style="font-size:13px; opacity:0.7; margin-top:4px;">${isEn ? 'Structural combination' : isTW ? '結構性組合' : '结构性组合'}</div>`}
    </div>
    <table style="width:100%; border-collapse:collapse;">
      <tbody>${scoreRows}</tbody>
    </table>
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- Part 2: Ideal Cards -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:8px; margin-bottom:16px;">${labels.partTwo}</h2>
    <h3 style="font-size:14px; color:#334155; margin-bottom:12px;">${labels.topValues}</h3>
    <div style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:24px;">
      ${topCardsHtml}
    </div>
    <h3 style="font-size:14px; color:#334155; margin-bottom:12px;">${labels.distribution}</h3>
    ${distHtml}
  </section>

  <div data-page-break style="height:0;overflow:hidden;"></div>

  <!-- Part 3: Cross-Analysis -->
  <section style="margin-bottom:32px;">
    <h2 style="font-size:18px; color:#1e293b; border-bottom:2px solid #f1f5f9; padding-bottom:8px; margin-bottom:16px;">${labels.partThree}</h2>
    <div style="padding:20px; border-radius:12px; border-left:4px solid ${alignColor}; background:${alignBg}; margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <h3 style="font-size:16px; font-weight:700; color:#1e293b; margin:0;">${labels.alignmentTitle}</h3>
        <span style="padding:4px 12px; border-radius:20px; font-size:12px; font-weight:700; color:white; background:${alignColor};">${alignLabel} (${data.alignmentPercent}%)</span>
      </div>
      <p style="font-size:14px; color:#475569; margin:0; line-height:1.8;">${alignDesc}</p>
    </div>
  </section>

  <footer style="margin-top:48px; padding-top:20px; border-top:2px solid #f1f5f9; text-align:center; color:#94a3b8; font-size:11px;">
    <p>SCPC &mdash; Strategic Career Planning Consultant</p>
  </footer>
</body>
</html>
  `.trim();
}

export async function downloadComprehensiveReportFromDisplay(params: {
  mainAnchor: string;
  highSensitivityAnchors?: string[];
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
    highSensitivityAnchors: params.highSensitivityAnchors,
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
