type LangKey = "en" | "zh-TW" | "zh-CN";
type LangMap = Record<LangKey, string>;

export const ANCHOR_TYPES: { code: string; label: LangMap }[] = [
  { code: "TF", label: { en: "Technical/Functional", "zh-TW": "技術/功能型", "zh-CN": "技术/功能型" } },
  { code: "GM", label: { en: "General Management", "zh-TW": "管理型", "zh-CN": "管理型" } },
  { code: "AU", label: { en: "Autonomy/Independence", "zh-TW": "自主/獨立型", "zh-CN": "自主/独立型" } },
  { code: "SE", label: { en: "Security/Stability", "zh-TW": "安全/穩定型", "zh-CN": "安全/稳定型" } },
  { code: "EC", label: { en: "Entrepreneurial Creativity", "zh-TW": "創業型", "zh-CN": "创业型" } },
  { code: "SV", label: { en: "Service/Dedication", "zh-TW": "服務/奉獻型", "zh-CN": "服务/奉献型" } },
  { code: "CH", label: { en: "Pure Challenge", "zh-TW": "挑戰型", "zh-CN": "挑战型" } },
  { code: "LS", label: { en: "Lifestyle", "zh-TW": "生活型", "zh-CN": "生活型" } },
];

export const SECTION_TYPES: { code: string; label: LangMap }[] = [
  { code: "anchor_explanation", label: { en: "Anchor Explanation", "zh-TW": "錨點解釋", "zh-CN": "锚点解释" } },
  { code: "career_advice", label: { en: "Core Interpretation Framework", "zh-TW": "核心詮釋框架", "zh-CN": "核心诠释框架" } },
  { code: "risk_warning", label: { en: "Anchor Development Imbalance Risk", "zh-TW": "錨點發展失衡風險", "zh-CN": "锚点发展失衡风隩" } },
  { code: "development_path", label: { en: "Development Path", "zh-TW": "適合發展路徑", "zh-CN": "适合发展路径" } },
];

export const ARCHETYPE_NAMES = [
  "Stability-Driven Expansion",
  "Creator-Stabilizer Tension",
  "Mission-Driven Challenger",
  "Technocratic Integrator",
  "Stewardship-Oriented Leader",
] as const;

export const CONTENT_LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "zh-CN", label: "简体中文" },
];

export const TIERS: { code: string; label: LangMap }[] = [
  { code: "tier_1", label: { en: "Tier 1", "zh-TW": "第一級", "zh-CN": "第一级" } },
  { code: "tier_2", label: { en: "Tier 2", "zh-TW": "第二級", "zh-CN": "第二级" } },
  { code: "tier_3", label: { en: "Tier 3", "zh-TW": "第三級", "zh-CN": "第三级" } },
];

export const DEFAULT_SCORE_RANGES = [
  {
    score_min: 80, score_max: 100, sort_order: 1,
    range_label_en: "Core Strength Anchor",
    range_label_zh_tw: "核心優勢錨點",
    range_label_zh_cn: "核心优势锚点",
    range_description_en: "Core Strength Anchor",
    range_description_zh_tw: "核心優勢錨點",
    range_description_zh_cn: "核心优势锚点",
  },
  {
    score_min: 65, score_max: 79, sort_order: 2,
    range_label_en: "High sensitivity; sustainable development",
    range_label_zh_tw: "高敏感度；可以持續發展",
    range_label_zh_cn: "高敏感度；可以持续发展",
    range_description_en: "High sensitivity; sustainable development",
    range_description_zh_tw: "高敏感度；可以持續發展",
    range_description_zh_cn: "高敏感度；可以持续发展",
  },
  {
    score_min: 45, score_max: 64, sort_order: 3,
    range_label_en: "Moderate influence; flexible with proper conditions",
    range_label_zh_tw: "中度影響；有適當條件可調整",
    range_label_zh_cn: "中度影响；有适当条件可调整",
    range_description_en: "Moderate influence; flexible with proper conditions",
    range_description_zh_tw: "中度影響；有適當條件可調整",
    range_description_zh_cn: "中度影响；有适当条件可调整",
  },
  {
    score_min: 0, score_max: 44, sort_order: 4,
    range_label_en: "Non-core dimension",
    range_label_zh_tw: "非核心維度",
    range_label_zh_cn: "非核心维度",
    range_description_en: "Non-core dimension",
    range_description_zh_tw: "非核心維度",
    range_description_zh_cn: "非核心维度",
  },
];

export function getAnchorLabel(code: string, lang: string): string {
  const entry = ANCHOR_TYPES.find(anchor => anchor.code === code);
  if (!entry) return code;
  return entry.label[lang as LangKey] || entry.label.en;
}

export function getSectionLabel(code: string, lang: string): string {
  const entry = SECTION_TYPES.find(section => section.code === code);
  if (!entry) return code;
  return entry.label[lang as LangKey] || entry.label.en;
}

export function getTierLabel(code: string, lang: string): string {
  const entry = TIERS.find(tier => tier.code === code);
  if (!entry) return code;
  return entry.label[lang as LangKey] || entry.label.en;
}

export const CAREER_STAGES: { code: string; label: LangMap }[] = [
  { code: "entry", label: { en: "Early Career", "zh-TW": "職場新人", "zh-CN": "职场新人" } },
  { code: "mid", label: { en: "Mid-Early Career", "zh-TW": "職涯中前期", "zh-CN": "职涯中前期" } },
  { code: "senior", label: { en: "Mid-Late Career", "zh-TW": "職涯中後期", "zh-CN": "职涯中后期" } },
  { code: "executive", label: { en: "Senior Executive", "zh-TW": "高階管理者", "zh-CN": "高阶管理者" } },
  { code: "entrepreneur", label: { en: "Entrepreneur", "zh-TW": "創業者", "zh-CN": "创业者" } },
];

export const ASSESSMENT_CATEGORIES: { code: string; label: LangMap; color: string }[] = [
  { code: "CAREER_ANCHOR", label: { en: "Career Anchor", "zh-TW": "職業錨", "zh-CN": "职业锚" }, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { code: "LIFE_CARD", label: { en: "Espresso Card", "zh-TW": "理想人生卡", "zh-CN": "理想人生卡" }, color: "bg-rose-50 text-rose-700 border-rose-200" },
  { code: "COMBINED", label: { en: "Combined", "zh-TW": "綜合", "zh-CN": "综合" }, color: "bg-violet-50 text-violet-700 border-violet-200" },
];

export function getCareerStageLabel(code: string, lang: string): string {
  const entry = CAREER_STAGES.find(stage => stage.code === code);
  if (!entry) return code;
  return entry.label[lang as LangKey] || entry.label.en;
}

export function getCategoryLabel(code: string, lang: string): string {
  const entry = ASSESSMENT_CATEGORIES.find(cat => cat.code === code);
  if (!entry) return code;
  return entry.label[lang as LangKey] || entry.label.en;
}

export function getCategoryColor(code: string): string {
  const entry = ASSESSMENT_CATEGORIES.find(cat => cat.code === code);
  return entry?.color || "bg-slate-50 text-slate-700 border-slate-200";
}

export function getRangeDisplay(scoreMin: number, scoreMax: number): string {
  if (scoreMin === 0) return `<${scoreMax + 1}`;
  return `${scoreMin}–${scoreMax}`;
}
