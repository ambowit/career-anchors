/**
 * SCPC Report Number Generator
 * Format: SCPC + YYYYMM + last4UserID + random2
 * Example: SCPC-202603-A1B2-X7
 */

export function generateReportNumber(userId: string): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const userIdSuffix = userId.replace(/-/g, "").slice(-4).toUpperCase();
  const randomChars = generateRandomAlphanumeric(2);
  return `SCPC-${yearMonth}-${userIdSuffix}-${randomChars}`;
}

function generateRandomAlphanumeric(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export type ReportCoverType = "career_anchor" | "ideal_card" | "fusion";

interface CoverData {
  reportType: ReportCoverType;
  userName: string;
  workExperienceYears: number | null;
  careerStage: string;
  assessmentDate: string;
  reportVersion: string;
  reportNumber: string;
  language: "en" | "zh-TW" | "zh-CN";
}

const COVER_TITLES: Record<ReportCoverType, Record<string, { main: string; sub: string }>> = {
  fusion: {
    en: { main: "SCPC Career Anchor & Ideal Life Card Assessment", sub: "Comprehensive Analysis Report" },
    "zh-TW": { main: "SCPC 職業錨與理想人生卡測評", sub: "綜合分析報告" },
    "zh-CN": { main: "SCPC 职业锚与理想人生卡测评", sub: "综合分析报告" },
  },
  career_anchor: {
    en: { main: "SCPC Career Anchor Assessment", sub: "Analysis Report" },
    "zh-TW": { main: "SCPC 職業錨測評", sub: "分析報告" },
    "zh-CN": { main: "SCPC 职业锚测评", sub: "分析报告" },
  },
  ideal_card: {
    en: { main: "SCPC Ideal Life Card Assessment", sub: "Analysis Report" },
    "zh-TW": { main: "SCPC 理想人生卡測評", sub: "分析報告" },
    "zh-CN": { main: "SCPC 理想人生卡测评", sub: "分析报告" },
  },
};

const FIELD_LABELS: Record<string, Record<string, string>> = {
  name: { en: "Name", "zh-TW": "姓名", "zh-CN": "姓名" },
  workYears: { en: "Work Experience", "zh-TW": "工作年資", "zh-CN": "工作年资" },
  careerStage: { en: "Type", "zh-TW": "類型", "zh-CN": "类型" },
  assessmentDate: { en: "Assessment Date", "zh-TW": "測評日期", "zh-CN": "测评日期" },
  reportVersion: { en: "Report Version", "zh-TW": "測評版本", "zh-CN": "测评版本" },
  reportNumber: { en: "Report Number", "zh-TW": "報告編號", "zh-CN": "报告编号" },
  years: { en: "years", "zh-TW": "年", "zh-CN": "年" },
};

const CAREER_STAGE_LABELS: Record<string, Record<string, string>> = {
  entry: { en: "Early Career", "zh-TW": "職涯初期", "zh-CN": "职涯初期" },
  mid: { en: "Mid Career", "zh-TW": "職涯中期", "zh-CN": "职涯中期" },
  senior: { en: "Senior Career", "zh-TW": "職涯資深", "zh-CN": "职涯资深" },
  hr: { en: "HR Professional", "zh-TW": "人資專業", "zh-CN": "人资专业" },
  executive: { en: "Executive", "zh-TW": "高管", "zh-CN": "高管" },
  entrepreneur: { en: "Entrepreneur", "zh-TW": "創業者", "zh-CN": "创业者" },
};

const VERSION_LABELS: Record<string, Record<string, string>> = {
  free: { en: "Free", "zh-TW": "免費版", "zh-CN": "免费版" },
  professional: { en: "Professional", "zh-TW": "專業版", "zh-CN": "专业版" },
};

const LOGO_URL = "https://b.ux-cdn.com/uxarts/20260210/bd2fe8a1fd4d4cd5bcca019a03911b22.png";

export function generateCoverHTML(data: CoverData): string {
  const lang = data.language;
  const titles = COVER_TITLES[data.reportType][lang];
  const fieldLabel = (key: string) => FIELD_LABELS[key]?.[lang] || key;
  const stageLabel = CAREER_STAGE_LABELS[data.careerStage]?.[lang] || data.careerStage;
  const versionLabel = VERSION_LABELS[data.reportVersion]?.[lang] || data.reportVersion;
  const workYearsText = data.workExperienceYears !== null
    ? `${data.workExperienceYears} ${FIELD_LABELS.years[lang]}`
    : "—";

  return `
    <div style="
      page-break-after: always;
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 60px 80px;
      box-sizing: border-box;
      background: linear-gradient(175deg, #fafbfc 0%, #f0f2f5 40%, #e8ecf1 100%);
      font-family: 'Noto Sans TC', 'Noto Sans SC', 'Helvetica Neue', sans-serif;
      position: relative;
      overflow: hidden;
    ">
      <!-- Decorative elements -->
      <div style="
        position: absolute; top: -120px; right: -120px;
        width: 400px; height: 400px;
        background: radial-gradient(circle, rgba(30,64,110,0.06) 0%, transparent 70%);
        border-radius: 50%;
      "></div>
      <div style="
        position: absolute; bottom: -80px; left: -80px;
        width: 300px; height: 300px;
        background: radial-gradient(circle, rgba(30,64,110,0.04) 0%, transparent 70%);
        border-radius: 50%;
      "></div>

      <!-- Header: Logo + Org Name -->
      <div style="display: flex; align-items: center; gap: 16px; z-index: 1;">
        <img src="${LOGO_URL}" alt="SCPC" style="height: 48px; width: auto;" crossorigin="anonymous" />
        <div style="font-size: 11px; color: #64748b; letter-spacing: 2px; text-transform: uppercase; font-weight: 500;">
          STRATEGIC CAREER PLANNING CONSULTANT
        </div>
      </div>

      <!-- Main Title Area -->
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; z-index: 1; padding: 40px 0;">
        <div style="
          width: 80px; height: 4px; background: #1e406e;
          margin-bottom: 32px; border-radius: 2px;
        "></div>
        <h1 style="
          font-size: 36px; font-weight: 700; color: #1e293b;
          line-height: 1.3; margin: 0 0 12px 0;
          letter-spacing: 1px;
        ">${titles.main}</h1>
        <h2 style="
          font-size: 24px; font-weight: 400; color: #475569;
          line-height: 1.4; margin: 0;
          letter-spacing: 0.5px;
        ">${titles.sub}</h2>
      </div>

      <!-- User Info Grid -->
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px 48px;
        padding: 32px 0;
        border-top: 1px solid #cbd5e1;
        z-index: 1;
      ">
        <div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${fieldLabel("name")}</div>
          <div style="font-size: 16px; color: #1e293b; font-weight: 600;">${data.userName}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${fieldLabel("workYears")}</div>
          <div style="font-size: 16px; color: #1e293b; font-weight: 600;">${workYearsText}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${fieldLabel("careerStage")}</div>
          <div style="font-size: 16px; color: #1e293b; font-weight: 600;">${stageLabel}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${fieldLabel("assessmentDate")}</div>
          <div style="font-size: 16px; color: #1e293b; font-weight: 600;">${data.assessmentDate}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${fieldLabel("reportVersion")}</div>
          <div style="font-size: 16px; color: #1e293b; font-weight: 600;">${versionLabel}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${fieldLabel("reportNumber")}</div>
          <div style="font-size: 16px; color: #1e293b; font-weight: 600; font-family: 'SF Mono', 'Fira Code', monospace;">${data.reportNumber}</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        padding-top: 16px;
        border-top: 1px solid #e2e8f0;
        z-index: 1;
      ">
        &copy; ${new Date().getFullYear()} SCPC &mdash; Strategic Career Planning Consultant. All rights reserved.
      </div>
    </div>
  `;
}

/**
 * Generates page header/footer HTML for report body pages
 */
export function generatePageHeaderFooter(reportNumber: string, pageTitle: string): { header: string; footer: string } {
  return {
    header: `
      <div style="
        display: flex; justify-content: space-between; align-items: center;
        padding: 0 0 8px 0; margin-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
        font-size: 10px; color: #94a3b8;
      ">
        <span>${pageTitle}</span>
        <span style="font-family: 'SF Mono', 'Fira Code', monospace;">${reportNumber}</span>
      </div>
    `,
    footer: `
      <div style="
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px 0 0 0; margin-top: 24px;
        border-top: 1px solid #e2e8f0;
        font-size: 9px; color: #94a3b8;
      ">
        <span>SCPC &mdash; Strategic Career Planning Consultant</span>
        <span>&copy; ${new Date().getFullYear()}</span>
      </div>
    `,
  };
}
