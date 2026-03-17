/**
 * ReportWebCover — Professional cover page for web report views.
 *
 * Mirrors the PDF cover design from generateCoverHTML (reportNumberGenerator.ts).
 * Rendered as HTML/CSS in-page; tagged `data-screen-only` so it is automatically
 * stripped before html2canvas captures during PDF download.
 */

import type { ReactNode } from "react";

type ReportCoverType = "career_anchor" | "ideal_card" | "fusion";
type Language = "en" | "zh-TW" | "zh-CN";

interface ReportWebCoverProps {
  reportType: ReportCoverType;
  userName: string;
  workExperienceYears: number | null;
  careerStage: string;
  reportNumber: string;
  language: Language;
  reportVersion?: string;
}

const LOGO_URL = "https://b.ux-cdn.com/uxarts/20260210/bd2fe8a1fd4d4cd5bcca019a03911b22.png";

const COVER_TITLES: Record<ReportCoverType, Record<Language, { main: string; sub: string }>> = {
  fusion: {
    en: { main: "Combined Assessment Report", sub: "Career Anchor × Espresso Card" },
    "zh-TW": { main: "聯合測評報告", sub: "職業錨 × 理想人生卡" },
    "zh-CN": { main: "联合测评报告", sub: "职业锚 × 理想人生卡" },
  },
  career_anchor: {
    en: { main: "SCPC Career Anchor Assessment", sub: "Analysis Report" },
    "zh-TW": { main: "SCPC 職業錨測評", sub: "分析報告" },
    "zh-CN": { main: "SCPC 职业锚测评", sub: "分析报告" },
  },
  ideal_card: {
    en: { main: "SCPC Espresso Card Assessment", sub: "Analysis Report" },
    "zh-TW": { main: "SCPC 理想人生卡測評", sub: "分析報告" },
    "zh-CN": { main: "SCPC 理想人生卡测评", sub: "分析报告" },
  },
};

const SCHEIN_QUOTE: Record<Language, string> = {
  en: "\u201CA career anchor is that one element in a person\u2019s self-concept that they will not give up, even in the face of difficult choices.\u201D",
  "zh-TW": "「職業錨是每個人在做職業選擇時，\n無論如何都不願放棄的自我概念中的核心要素。」",
  "zh-CN": "「职业锚是每个人在做职业选择时，\n无论如何都不愿放弃的自我概念中的核心要素。」",
};

const FIELD_LABELS: Record<string, Record<Language, string>> = {
  name: { en: "Name", "zh-TW": "姓名", "zh-CN": "姓名" },
  workYears: { en: "Work Experience", "zh-TW": "工作年資", "zh-CN": "工作年资" },
  careerStage: { en: "Career Stage", "zh-TW": "職涯階段", "zh-CN": "职涯阶段" },
  assessmentDate: { en: "Assessment Date", "zh-TW": "測評日期", "zh-CN": "测评日期" },
  reportVersion: { en: "Report Version", "zh-TW": "測評版本", "zh-CN": "测评版本" },
  reportNumber: { en: "Report Number", "zh-TW": "報告編號", "zh-CN": "报告编号" },
  years: { en: "years", "zh-TW": "年", "zh-CN": "年" },
};

const CAREER_STAGE_LABELS: Record<string, Record<Language, string>> = {
  entry: { en: "Early Career (0–5 yrs)", "zh-TW": "職場新人（年資 0–5 年）", "zh-CN": "职场新人（年资 0–5 年）" },
  early: { en: "Early Career (0–5 yrs)", "zh-TW": "職場新人（年資 0–5 年）", "zh-CN": "职场新人（年资 0–5 年）" },
  mid: { en: "Mid-Early Career (6–12 yrs)", "zh-TW": "職涯中前期（6–12 年）", "zh-CN": "职涯中前期（6–12 年）" },
  senior: { en: "Mid-Late Career (12+ yrs)", "zh-TW": "職涯中後期（12 年以上）", "zh-CN": "职涯中后期（12 年以上）" },
  hr: { en: "HR Professional", "zh-TW": "人資專業", "zh-CN": "人资专业" },
  executive: { en: "Executive / Entrepreneur", "zh-TW": "高管與創業者", "zh-CN": "高管与创业者" },
  entrepreneur: { en: "Entrepreneur", "zh-TW": "創業者", "zh-CN": "创业者" },
};

const VERSION_LABELS: Record<string, Record<Language, string>> = {
  free: { en: "Free", "zh-TW": "免費版", "zh-CN": "免费版" },
  professional: { en: "Professional", "zh-TW": "專業完整版", "zh-CN": "专业完整版" },
};

function InfoField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] tracking-[1.5px] mb-1 font-medium uppercase"
        style={{ color: "#8b95a5" }}
      >
        {label}
      </div>
      <div
        className="text-base font-semibold"
        style={{ color: "#1C2857" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function ReportWebCover({
  reportType,
  userName,
  workExperienceYears,
  careerStage,
  reportNumber,
  language,
  reportVersion = "professional",
}: ReportWebCoverProps) {
  const titles = COVER_TITLES[reportType][language];
  const quote = SCHEIN_QUOTE[language];
  const stageLabel = CAREER_STAGE_LABELS[careerStage]?.[language] || careerStage;
  const versionLabel = VERSION_LABELS[reportVersion]?.[language] || reportVersion;
  const workYearsText = workExperienceYears !== null
    ? `${workExperienceYears} ${FIELD_LABELS.years[language]}`
    : "—";
  const assessmentDate = new Date().toLocaleDateString(
    language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN",
    { year: "numeric", month: "long", day: "numeric" },
  );

  const isFusion = reportType === "fusion";

  return (
    <div
      data-screen-only
      className="rounded-xl overflow-hidden shadow-sm"
      style={{
        background: "#ffffff",
        fontFamily: "'Montserrat', 'Noto Sans TC', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
      }}
    >
      <div
        className="flex flex-col justify-between"
        style={{ padding: "56px 56px 40px", minHeight: "540px" }}
      >
        {/* Header: Logo + Organization */}
        <div className="flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="SCPC"
            className="h-9 w-auto"
            referrerPolicy="no-referrer"
          />
          <div
            className="text-[10px] tracking-[3px] uppercase font-medium"
            style={{ color: "#7a8294" }}
          >
            Strategic Career Planning Consultant
          </div>
        </div>

        {/* Main Title + Quote */}
        <div className="flex-1 flex flex-col justify-center py-8">
          <div
            className="w-12 h-[2px] mb-7"
            style={{ background: "#1C2857" }}
          />
          <h1
            className="text-[32px] font-bold leading-snug mb-2 tracking-wide"
            style={{ color: "#1C2857" }}
          >
            {titles.main}
          </h1>
          <h2
            className="text-lg font-normal leading-snug mb-8"
            style={{ color: "#5a6478", letterSpacing: "0.5px" }}
          >
            {titles.sub}
          </h2>

          {isFusion && (
            <p
              className="text-sm mb-8"
              style={{ color: "#7a8294", lineHeight: 1.8, maxWidth: 440 }}
            >
              {language === "en"
                ? "Understanding the development focus and integration space at the current stage"
                : language === "zh-TW"
                  ? "理解當前階段的發展重心與整合空間"
                  : "理解当前阶段的发展重心与整合空间"}
            </p>
          )}

          {/* Schein Quote */}
          <div
            className="max-w-[460px]"
            style={{ padding: "18px 22px", borderLeft: "3px solid rgba(28,40,87,0.15)" }}
          >
            <p
              className="text-sm italic whitespace-pre-line"
              style={{ color: "#5a6478", lineHeight: 1.9, margin: 0 }}
            >
              {quote}
            </p>
            <p
              className="text-xs font-medium mt-2"
              style={{ color: "#8b95a5", letterSpacing: "0.5px" }}
            >
              — Edgar H. Schein
            </p>
          </div>
        </div>

        {/* User Info Grid */}
        <div
          className="grid grid-cols-2 gap-x-12 gap-y-4 py-6"
          style={{ borderTop: "1px solid rgba(28,40,87,0.1)" }}
        >
          <InfoField label={FIELD_LABELS.name[language]}>{userName}</InfoField>
          <InfoField label={FIELD_LABELS.careerStage[language]}>{stageLabel}</InfoField>
          <InfoField label={FIELD_LABELS.workYears[language]}>{workYearsText}</InfoField>
          <InfoField label={FIELD_LABELS.reportVersion[language]}>{versionLabel}</InfoField>
          <InfoField label={FIELD_LABELS.assessmentDate[language]}>{assessmentDate}</InfoField>
          <InfoField label={FIELD_LABELS.reportNumber[language]}>
            <span style={{ fontFamily: "'Montserrat', 'SF Mono', monospace", letterSpacing: "1px" }}>
              {reportNumber}
            </span>
          </InfoField>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center pt-3"
          style={{ borderTop: "1px solid rgba(28,40,87,0.06)" }}
        >
          <div className="text-center">
            <div className="text-[9px] tracking-wider" style={{ color: "#8b95a5" }}>
              &copy; {new Date().getFullYear()} SCPC &mdash; Strategic Career Planning Consultant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
