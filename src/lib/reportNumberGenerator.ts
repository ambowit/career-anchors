/**
 * SCPC Report Number Generator & Cover Page — V4.2
 * Format: SCPC-YYYYMM-XXXX-XX
 * Example: SCPC-202603-A1B2-X7
 *
 * Cover style: Elegant light ivory/cream with deep navy accents
 * Includes Schein quote, dual-column info grid, and timestamp footer
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
    en: { main: "Combined Assessment Report", sub: "Career Anchor × Espresso Card" },
    "zh-TW": { main: "\u806F\u5408\u6E2C\u8A55\u5831\u544A", sub: "\u8077\u696D\u9328 \u00D7 \u7406\u60F3\u4EBA\u751F\u5361" },
    "zh-CN": { main: "\u8054\u5408\u6D4B\u8BC4\u62A5\u544A", sub: "\u804C\u4E1A\u951A \u00D7 \u7406\u60F3\u4EBA\u751F\u5361" },
  },
  career_anchor: {
    en: { main: "SCPC Career Anchor Assessment", sub: "Analysis Report" },
    "zh-TW": { main: "SCPC \u8077\u696D\u9328\u6E2C\u8A55", sub: "\u5206\u6790\u5831\u544A" },
    "zh-CN": { main: "SCPC \u804C\u4E1A\u951A\u6D4B\u8BC4", sub: "\u5206\u6790\u62A5\u544A" },
  },
  ideal_card: {
    en: { main: "SCPC Espresso Card Assessment", sub: "Analysis Report" },
    "zh-TW": { main: "SCPC \u7406\u60F3\u4EBA\u751F\u5361\u6E2C\u8A55", sub: "\u5206\u6790\u5831\u544A" },
    "zh-CN": { main: "SCPC \u7406\u60F3\u4EBA\u751F\u5361\u6D4B\u8BC4", sub: "\u5206\u6790\u62A5\u544A" },
  },
};

const SCHEIN_QUOTE: Record<string, string> = {
  en: "\u201CA career anchor is that one element in a person\u2019s self-concept\nthat they will not give up, even in the face of difficult choices.\u201D",
  "zh-TW": "\u300C\u8077\u696D\u9328\u662F\u6BCF\u500B\u4EBA\u5728\u505A\u8077\u696D\u9078\u64C7\u6642\uFF0C\n\u7121\u8AD6\u5982\u4F55\u90FD\u4E0D\u9858\u653E\u68C4\u7684\u81EA\u6211\u6982\u5FF5\u4E2D\u7684\u6838\u5FC3\u8981\u7D20\u3002\u300D",
  "zh-CN": "\u300C\u804C\u4E1A\u951A\u662F\u6BCF\u4E2A\u4EBA\u5728\u505A\u804C\u4E1A\u9009\u62E9\u65F6\uFF0C\n\u65E0\u8BBA\u5982\u4F55\u90FD\u4E0D\u613F\u653E\u5F03\u7684\u81EA\u6211\u6982\u5FF5\u4E2D\u7684\u6838\u5FC3\u8981\u7D20\u3002\u300D",
};

const FIELD_LABELS: Record<string, Record<string, string>> = {
  name: { en: "Name", "zh-TW": "\u59D3\u540D", "zh-CN": "\u59D3\u540D" },
  workYears: { en: "Work Experience", "zh-TW": "\u5DE5\u4F5C\u5E74\u8CC7", "zh-CN": "\u5DE5\u4F5C\u5E74\u8D44" },
  careerStage: { en: "Career Stage", "zh-TW": "\u8077\u6DAF\u968E\u6BB5", "zh-CN": "\u804C\u6DAF\u9636\u6BB5" },
  assessmentDate: { en: "Assessment Date", "zh-TW": "\u6E2C\u8A55\u65E5\u671F", "zh-CN": "\u6D4B\u8BC4\u65E5\u671F" },
  reportVersion: { en: "Report Version", "zh-TW": "\u6E2C\u8A55\u7248\u672C", "zh-CN": "\u6D4B\u8BC4\u7248\u672C" },
  reportNumber: { en: "Report Number", "zh-TW": "\u5831\u544A\u7DE8\u865F", "zh-CN": "\u62A5\u544A\u7F16\u53F7" },
  years: { en: "years", "zh-TW": "\u5E74", "zh-CN": "\u5E74" },
};

const CAREER_STAGE_LABELS: Record<string, Record<string, string>> = {
  entry: { en: "Early Career (0\u20135 yrs)", "zh-TW": "\u8077\u5834\u65B0\u4EBA\uFF08\u5E74\u8CC7 0\u20135 \u5E74\uFF09", "zh-CN": "\u804C\u573A\u65B0\u4EBA\uFF08\u5E74\u8D44 0\u20135 \u5E74\uFF09" },
  early: { en: "Early Career (0\u20135 yrs)", "zh-TW": "\u8077\u5834\u65B0\u4EBA\uFF08\u5E74\u8CC7 0\u20135 \u5E74\uFF09", "zh-CN": "\u804C\u573A\u65B0\u4EBA\uFF08\u5E74\u8D44 0\u20135 \u5E74\uFF09" },
  mid: { en: "Mid-Early Career (6\u201312 yrs)", "zh-TW": "\u8077\u6DAF\u4E2D\u524D\u671F\uFF086\u201312 \u5E74\uFF09", "zh-CN": "\u804C\u6DAF\u4E2D\u524D\u671F\uFF086\u201312 \u5E74\uFF09" },
  senior: { en: "Mid-Late Career (12+ yrs)", "zh-TW": "\u8077\u6DAF\u4E2D\u5F8C\u671F\uFF0812 \u5E74\u4EE5\u4E0A\uFF09", "zh-CN": "\u804C\u6DAF\u4E2D\u540E\u671F\uFF0812 \u5E74\u4EE5\u4E0A\uFF09" },
  hr: { en: "HR Professional", "zh-TW": "\u4EBA\u8CC7\u5C08\u696D", "zh-CN": "\u4EBA\u8D44\u4E13\u4E1A" },
  executive: { en: "Executive / Entrepreneur", "zh-TW": "\u9AD8\u7BA1\u8207\u5275\u696D\u8005", "zh-CN": "\u9AD8\u7BA1\u4E0E\u521B\u4E1A\u8005" },
  entrepreneur: { en: "Entrepreneur", "zh-TW": "\u5275\u696D\u8005", "zh-CN": "\u521B\u4E1A\u8005" },
};

const VERSION_LABELS: Record<string, Record<string, string>> = {
  free: { en: "Free", "zh-TW": "\u514D\u8CBB\u7248", "zh-CN": "\u514D\u8D39\u7248" },
  professional: { en: "Professional", "zh-TW": "\u5C08\u696D\u5B8C\u6574\u7248", "zh-CN": "\u4E13\u4E1A\u5B8C\u6574\u7248" },
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
    : "\u2014";

  const quote = SCHEIN_QUOTE[lang];

  return `
    <div style="
      page-break-after: always;
      width: 100%;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 80px 48px;
      box-sizing: border-box;
      background: #ffffff;
      font-family: 'Montserrat', 'Noto Sans TC', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      position: relative;
    ">

      <!-- Header: Logo + Organization -->
      <div style="display: flex; align-items: center; gap: 14px;">
        <img src="${LOGO_URL}" alt="SCPC" style="height: 40px; width: auto;" crossorigin="anonymous" />
        <div style="
          font-size: 10px; color: #7a8294; letter-spacing: 3px;
          text-transform: uppercase; font-weight: 500;
        ">
          Strategic Career Planning Consultant
        </div>
      </div>

      <!-- Main Title + Schein Quote -->
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 40px 0;">
        <div style="
          width: 48px; height: 2px;
          background: #1C2857;
          margin-bottom: 32px;
        "></div>
        <h1 style="
          font-size: 36px; font-weight: 700; color: #1C2857;
          line-height: 1.4; margin: 0 0 12px 0;
          letter-spacing: 1px; white-space: pre-line;
        ">${titles.main}</h1>
        <h2 style="
          font-size: 20px; font-weight: 400; color: #5a6478;
          line-height: 1.4; margin: 0 0 40px 0;
          letter-spacing: 0.5px;
        ">${titles.sub}</h2>

        ${data.reportType === "fusion" ? `
        <p style="
          font-size: 14px; color: #7a8294; line-height: 1.8;
          margin: 0 0 40px 0; max-width: 440px;
        ">${lang === "en" ? "Understanding the development focus and integration space at the current stage" : lang === "zh-TW" ? "\u7406\u89E3\u7576\u524D\u968E\u6BB5\u7684\u767C\u5C55\u91CD\u5FC3\u8207\u6574\u5408\u7A7A\u9593" : "\u7406\u89E3\u5F53\u524D\u9636\u6BB5\u7684\u53D1\u5C55\u91CD\u5FC3\u4E0E\u6574\u5408\u7A7A\u95F4"}</p>
        ` : ""}

        <!-- Schein Quote -->
        <div style="
          max-width: 500px;
          padding: 20px 24px;
          border-left: 3px solid rgba(28,40,87,0.15);
        ">
          <p style="
            font-size: 14px; color: #5a6478; line-height: 1.9;
            margin: 0; font-style: italic; white-space: pre-line;
          ">${quote}</p>
          <p style="
            font-size: 12px; color: #8b95a5; margin: 10px 0 0;
            font-weight: 500; letter-spacing: 0.5px;
          ">\u2014 Edgar H. Schein</p>
        </div>
      </div>

      <!-- User Info Grid (dual-column) -->
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px 48px;
        padding: 28px 0;
        border-top: 1px solid rgba(28,40,87,0.1);
      ">
        <div>
          <div style="font-size: 10px; color: #8b95a5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 500;">${fieldLabel("name")}</div>
          <div style="font-size: 16px; color: #1C2857; font-weight: 600;">${data.userName}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #8b95a5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 500;">${fieldLabel("careerStage")}</div>
          <div style="font-size: 16px; color: #1C2857; font-weight: 600;">${stageLabel}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #8b95a5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 500;">${fieldLabel("workYears")}</div>
          <div style="font-size: 16px; color: #1C2857; font-weight: 600;">${workYearsText}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #8b95a5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 500;">${fieldLabel("reportVersion")}</div>
          <div style="font-size: 16px; color: #1C2857; font-weight: 600;">${versionLabel}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #8b95a5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 500;">${fieldLabel("assessmentDate")}</div>
          <div style="font-size: 16px; color: #1C2857; font-weight: 600;">${data.assessmentDate}</div>
        </div>
        <div>
          <div style="font-size: 10px; color: #8b95a5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px; font-weight: 500;">${fieldLabel("reportNumber")}</div>
          <div style="font-size: 16px; color: #1C2857; font-weight: 600; font-family: 'Montserrat', 'SF Mono', monospace; letter-spacing: 1px;">${data.reportNumber}</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="
        display: flex; align-items: center; justify-content: center;
        padding: 14px 0 0;
        border-top: 1px solid rgba(28,40,87,0.06);
      ">
        <div style="text-align: center;">
          <div style="font-size: 9px; color: #8b95a5; letter-spacing: 1px;">
            &copy; ${new Date().getFullYear()} SCPC &mdash; Strategic Career Planning Consultant
          </div>
        </div>
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
        overflow: hidden;
        padding: 0 0 8px 0; margin-bottom: 24px;
        border-bottom: 1px solid #E9ECEF;
        font-size: 10px; color: #7a8294;
      ">
        <span style="float: right; font-family: 'Montserrat', 'SF Mono', monospace; letter-spacing: 0.5px;">${reportNumber}</span>
        <span>${pageTitle}</span>
      </div>
    `,
    footer: `
      <div style="
        overflow: hidden;
        padding: 12px 0 0 0; margin-top: 24px;
        border-top: 1px solid #E9ECEF;
        font-size: 9px; color: #7a8294;
      ">
        <span style="float: right;">&copy; ${new Date().getFullYear()}</span>
        <span>SCPC &mdash; Strategic Career Planning Consultant</span>
      </div>
    `,
  };
}
