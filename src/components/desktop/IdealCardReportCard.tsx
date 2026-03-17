import { CATEGORY_CONFIG, getCategoryLabel, type CardCategory } from "@/data/idealCards";
import { cn } from "@/lib/utils";

/* ────────── Types ────────── */

interface QuadrantContent {
  external: string;
  internal: string;
  career: string;
  relationship: string;
}

interface IdealCardReportCardProps {
  rank: number;
  label: string;
  category: CardCategory;
  quadrant?: QuadrantContent;
  spectrumType?: "career" | "neutral" | "lifestyle";
  aiDescription?: string;
  isLoadingDescription?: boolean;
  language: string;
  isMobile?: boolean;
}

/* ────────── Constants ────────── */

const SPECTRUM_TAGS: Record<string, { color: string; bg: string; label: Record<string, string> }> = {
  career: {
    color: "#1C2857",
    bg: "#e8edf5",
    label: { "zh-CN": "职业导向", "zh-TW": "職業導向", en: "Career-Oriented" },
  },
  neutral: {
    color: "#6B7B8D",
    bg: "#f0f2f5",
    label: { "zh-CN": "中性价值", "zh-TW": "中性價值", en: "Neutral" },
  },
  lifestyle: {
    color: "#1B6B3A",
    bg: "#e6f5ec",
    label: { "zh-CN": "生活形态", "zh-TW": "生活形態", en: "Lifestyle" },
  },
};

const QUADRANT_GRID = [
  {
    key: "external" as const,
    icon: "\u{1F30D}",
    color: "#1C2857",
    bg: "#f0f4ff",
    label: { "zh-CN": "对外部环境的感知", "zh-TW": "對外部環境的感知", en: "External Environment Perception" },
  },
  {
    key: "career" as const,
    icon: "\u{1F4BC}",
    color: "#059669",
    bg: "#ecfdf5",
    label: { "zh-CN": "对职业生涯的态度", "zh-TW": "對職業生涯的態度", en: "Career Attitude" },
  },
  {
    key: "internal" as const,
    icon: "\u{1F9E0}",
    color: "#7c3aed",
    bg: "#faf5ff",
    label: { "zh-CN": "对自我内在的思维", "zh-TW": "對自我內在的思維", en: "Internal Self Thinking" },
  },
  {
    key: "relationship" as const,
    icon: "\u{1F91D}",
    color: "#e74c6f",
    bg: "#fdf2f8",
    label: { "zh-CN": "对家庭或朋友的行为", "zh-TW": "對家庭或朋友的行為", en: "Family & Friend Behavior" },
  },
];

const MEDAL_GRADIENTS = [
  "linear-gradient(145deg, #FFD700, #E6B800)",
  "linear-gradient(145deg, #FFD700, #E6B800)",
  "linear-gradient(145deg, #FFD700, #E6B800)",
];

const MEDAL_SHADOWS = [
  "0 3px 10px rgba(255,193,7,0.45)",
  "0 3px 10px rgba(255,193,7,0.45)",
  "0 3px 10px rgba(255,193,7,0.45)",
];

/* ────────── Component ────────── */

export function IdealCardReportCard({
  rank,
  label,
  category,
  quadrant,
  spectrumType,
  aiDescription,
  isLoadingDescription = false,
  language,
  isMobile = false,
}: IdealCardReportCardProps) {
  const catConfig = CATEGORY_CONFIG[category];
  const isTopThree = rank <= 3;
  const specTag = spectrumType ? SPECTRUM_TAGS[spectrumType] : null;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden h-full flex flex-col"
      style={{
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 12px 36px rgba(0,0,0,0.03)",
      }}
    >
      {/* ─── Card Header ─── */}
      <div className="px-6 py-5 flex items-center gap-4 border-b" style={{ borderColor: "#eef0f4" }}>
        {/* Rank badge */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-base flex-shrink-0"
          style={
            isTopThree
              ? {
                  background: MEDAL_GRADIENTS[rank - 1],
                  color: "white",
                  textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                  boxShadow: MEDAL_SHADOWS[rank - 1],
                }
              : {
                  backgroundColor: "#1C2857",
                  color: "white",
                }
          }
        >
          {rank}
        </div>

        {/* Name */}
        <h3 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b", flex: 1, lineHeight: 1.3 }}>
          {label}
        </h3>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
            style={{
              backgroundColor: catConfig.bgColor,
              color: catConfig.color,
              border: `1px solid ${catConfig.borderColor}`,
            }}
          >
            {getCategoryLabel(category, language)}
          </span>
          {specTag && (
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
              style={{ backgroundColor: specTag.bg, color: specTag.color }}
            >
              {specTag.label[language] || specTag.label["zh-CN"]}
            </span>
          )}
        </div>
      </div>

      {/* ─── Four Quadrants ─── */}
      {quadrant && (
        <div
          className={cn("grid gap-px flex-1", isMobile ? "grid-cols-1" : "grid-cols-2")}
          style={{ backgroundColor: "#e8eaed" }}
        >
          {QUADRANT_GRID.map((quadrantDef) => {
            const content = quadrant[quadrantDef.key];
            return (
              <div
                key={quadrantDef.key}
                className="p-5"
                style={{ backgroundColor: quadrantDef.bg, minHeight: isMobile ? 80 : 100 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg leading-none">{quadrantDef.icon}</span>
                  <span
                    className="text-xs font-bold tracking-wide"
                    style={{ color: quadrantDef.color }}
                  >
                    {quadrantDef.label[language] || quadrantDef.label["zh-CN"]}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#374151" }}>
                  {content || "\u2014"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── AI Description ─── */}
      {(aiDescription || isLoadingDescription) && (
        <div
          className="px-6 py-4"
          style={{
            backgroundColor: "#fafbfc",
            borderLeft: "4px solid #B5D260",
            borderTop: "1px solid #eef0f4",
          }}
        >
          <div className="text-xs font-bold mb-2" style={{ color: "#64748b", letterSpacing: "0.04em" }}>
            {language === "en"
              ? "Card Content Description"
              : language === "zh-TW"
                ? "卡片內容說明"
                : "卡片内容说明"}
          </div>
          {isLoadingDescription ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
              <span className="text-xs text-slate-400">
                {language === "en" ? "Generating..." : "生成中..."}
              </span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
              {aiDescription}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
