import type { Language } from "@/hooks/useLanguage";

export type CardCategory = "intrinsic" | "interpersonal" | "lifestyle" | "material";

export interface IdealCard {
  id: number;
  category: CardCategory;
  en: string;
  "zh-CN": string;
  "zh-TW": string;
}

export const CATEGORY_CONFIG: Record<CardCategory, {
  en: string;
  "zh-CN": string;
  "zh-TW": string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  intrinsic: {
    en: "Intrinsic Values",
    "zh-CN": "内在价值",
    "zh-TW": "內在價值",
    color: "#2E7D32",
    bgColor: "#E8F5E9",
    borderColor: "#66BB6A",
  },
  interpersonal: {
    en: "Interpersonal Relationships",
    "zh-CN": "人际关系",
    "zh-TW": "人際關係",
    color: "#C62828",
    bgColor: "#FFEBEE",
    borderColor: "#EF5350",
  },
  lifestyle: {
    en: "Lifestyle",
    "zh-CN": "生活方式",
    "zh-TW": "生活方式",
    color: "#E65100",
    bgColor: "#FFF3E0",
    borderColor: "#FFA726",
  },
  material: {
    en: "Material Conditions",
    "zh-CN": "物质条件",
    "zh-TW": "物質條件",
    color: "#1565C0",
    bgColor: "#E3F2FD",
    borderColor: "#42A5F5",
  },
};

export const IDEAL_CARDS: IdealCard[] = [
  // === Intrinsic Values (27 cards) ===
  { id: 1, category: "intrinsic", en: "Doing Good", "zh-CN": "做善事", "zh-TW": "做善事" },
  { id: 2, category: "intrinsic", en: "Continuous Self-Exploration", "zh-CN": "不断的自我探索", "zh-TW": "不斷的自我探索" },
  { id: 3, category: "intrinsic", en: "Authenticity", "zh-CN": "做自己", "zh-TW": "做自己" },
  { id: 4, category: "intrinsic", en: "Fairness", "zh-CN": "公平", "zh-TW": "公平" },
  { id: 5, category: "intrinsic", en: "Childlike Wonder", "zh-CN": "有赤子之心", "zh-TW": "有赤子之心" },
  { id: 6, category: "intrinsic", en: "Inner Peace", "zh-CN": "内心的平静", "zh-TW": "內心的平靜" },
  { id: 7, category: "intrinsic", en: "Faith", "zh-CN": "相信信仰的力量", "zh-TW": "相信信仰的力量" },
  { id: 8, category: "intrinsic", en: "A Meaningful Life", "zh-CN": "有内涵的生命", "zh-TW": "有內涵的生命" },
  { id: 9, category: "intrinsic", en: "Security", "zh-CN": "安全感", "zh-TW": "安全感" },
  { id: 10, category: "intrinsic", en: "Freedom", "zh-CN": "享受自由", "zh-TW": "享受自由" },
  { id: 11, category: "intrinsic", en: "Autonomy", "zh-CN": "自主权", "zh-TW": "自主權" },
  { id: 12, category: "intrinsic", en: "Courage to Take Risks", "zh-CN": "勇于挑战/冒险", "zh-TW": "勇於挑戰/冒險" },
  { id: 13, category: "intrinsic", en: "Self-Confidence", "zh-CN": "自信", "zh-TW": "自信" },
  { id: 14, category: "intrinsic", en: "Practicality", "zh-CN": "务实踏实", "zh-TW": "務實踏實" },
  { id: 15, category: "intrinsic", en: "Kindness", "zh-CN": "做善良的人", "zh-TW": "做善良的人" },
  { id: 16, category: "intrinsic", en: "Appreciation of Beauty", "zh-CN": "欣赏美的事物", "zh-TW": "欣賞美的事物" },
  { id: 17, category: "intrinsic", en: "Pursuing Dreams", "zh-CN": "为梦想奋斗", "zh-TW": "為夢想奮鬥" },
  { id: 18, category: "intrinsic", en: "Meaningful Work", "zh-CN": "工作有意义", "zh-TW": "工作有意義" },
  { id: 19, category: "intrinsic", en: "Professional Recognition", "zh-CN": "专业能力被认可", "zh-TW": "專業能力被認可" },
  { id: 20, category: "intrinsic", en: "Sense of Justice", "zh-CN": "富正义感", "zh-TW": "富正義感" },
  { id: 21, category: "intrinsic", en: "Diligence", "zh-CN": "做事勤奋", "zh-TW": "做事勤奮" },
  { id: 22, category: "intrinsic", en: "Creativity", "zh-CN": "发挥创造力", "zh-TW": "發揮創造力" },
  { id: 23, category: "intrinsic", en: "Openness to Change", "zh-CN": "拥抱改变", "zh-TW": "擁抱改變" },
  { id: 24, category: "intrinsic", en: "Being Respected", "zh-CN": "受人尊重", "zh-TW": "受人尊重" },
  { id: 25, category: "intrinsic", en: "Applying Professional Expertise", "zh-CN": "发挥专业的技巧", "zh-TW": "發揮專業的技巧" },
  { id: 26, category: "intrinsic", en: "Integrity", "zh-CN": "有诚信", "zh-TW": "有誠信" },
  { id: 27, category: "intrinsic", en: "Sense of Achievement", "zh-CN": "成就感", "zh-TW": "成就感" },

  // === Interpersonal Relationships (16 cards) ===
  { id: 28, category: "interpersonal", en: "Loyalty", "zh-CN": "讲义气", "zh-TW": "講義氣" },
  { id: 29, category: "interpersonal", en: "Social Recognition", "zh-CN": "有社会地位", "zh-TW": "有社會地位" },
  { id: 30, category: "interpersonal", en: "Building Friendships", "zh-CN": "喜欢交朋友", "zh-TW": "喜歡交朋友" },
  { id: 31, category: "interpersonal", en: "Influence", "zh-CN": "影响他人", "zh-TW": "影響他人" },
  { id: 32, category: "interpersonal", en: "Inspiring Others", "zh-CN": "激励他人", "zh-TW": "激勵他人" },
  { id: 33, category: "interpersonal", en: "Helping Others", "zh-CN": "喜欢帮助他人", "zh-TW": "喜歡幫助他人" },
  { id: 34, category: "interpersonal", en: "A Friend I Can Open Up To", "zh-CN": "能谈心的朋友", "zh-TW": "能談心的朋友" },
  { id: 35, category: "interpersonal", en: "Fulfilling Marriage", "zh-CN": "向往美满的婚姻", "zh-TW": "嚮往美滿的婚姻" },
  { id: 36, category: "interpersonal", en: "Passionate Relationship", "zh-CN": "有火花的爱情关系", "zh-TW": "有火花的愛情關係" },
  { id: 37, category: "interpersonal", en: "Close Family Relationships", "zh-CN": "亲密的家人关系", "zh-TW": "親密的家人關係" },
  { id: 38, category: "interpersonal", en: "Filial Responsibility", "zh-CN": "孝顺", "zh-TW": "孝順" },
  { id: 39, category: "interpersonal", en: "Being Present in Children's Growth", "zh-CN": "陪孩子成长", "zh-TW": "陪孩子成長" },
  { id: 40, category: "interpersonal", en: "Collaborative Partnership", "zh-CN": "与伙伴一起奋斗", "zh-TW": "與夥伴一起奮鬥" },
  { id: 41, category: "interpersonal", en: "Individuality", "zh-CN": "与众不同", "zh-TW": "與眾不同" },
  { id: 42, category: "interpersonal", en: "Volunteering", "zh-CN": "喜欢参与志愿者活动", "zh-TW": "喜歡參與志願者活動" },

  // === Lifestyle (19 cards) ===
  { id: 43, category: "lifestyle", en: "Spiritual Fulfillment", "zh-CN": "追求精神生活", "zh-TW": "追求精神生活" },
  { id: 44, category: "lifestyle", en: "Longevity", "zh-CN": "活得久", "zh-TW": "活得久" },
  { id: 45, category: "lifestyle", en: "Enjoying Good Food", "zh-CN": "享受美味", "zh-TW": "享受美味" },
  { id: 46, category: "lifestyle", en: "Physical Health", "zh-CN": "拥有健康的身体", "zh-TW": "擁有健康的身體" },
  { id: 47, category: "lifestyle", en: "Regular Physical Activity", "zh-CN": "长期/固定运动", "zh-TW": "長期/固定運動" },
  { id: 48, category: "lifestyle", en: "Simple and Structured Living", "zh-CN": "生活规律/单纯", "zh-TW": "生活規律/單純" },
  { id: 49, category: "lifestyle", en: "Personal Hobbies", "zh-CN": "有兴趣爱好", "zh-TW": "有興趣愛好" },
  { id: 50, category: "lifestyle", en: "Enjoying Going Out", "zh-CN": "喜欢外出", "zh-TW": "喜歡外出" },
  { id: 51, category: "lifestyle", en: "Quiet Reflection", "zh-CN": "喜欢发呆", "zh-TW": "喜歡發呆" },
  { id: 52, category: "lifestyle", en: "Enjoying Solitude", "zh-CN": "爱好独处", "zh-TW": "愛好獨處" },
  { id: 53, category: "lifestyle", en: "Traveling", "zh-CN": "四处旅行", "zh-TW": "四處旅行" },
  { id: 54, category: "lifestyle", en: "Doing What I Enjoy", "zh-CN": "做喜欢的事", "zh-TW": "做喜歡的事" },
  { id: 55, category: "lifestyle", en: "Enjoying Nature", "zh-CN": "喜欢户外和大自然", "zh-TW": "喜歡戶外和大自然" },
  { id: 56, category: "lifestyle", en: "Organic Lifestyle", "zh-CN": "有机生活", "zh-TW": "有機生活" },
  { id: 57, category: "lifestyle", en: "Passion for Life", "zh-CN": "对生活保持热忱", "zh-TW": "對生活保持熱誠" },
  { id: 58, category: "lifestyle", en: "Preference for Stability", "zh-CN": "喜欢稳定", "zh-TW": "喜歡穩定" },
  { id: 59, category: "lifestyle", en: "Continuous Learning", "zh-CN": "保持学习", "zh-TW": "保持學習" },
  { id: 60, category: "lifestyle", en: "A Vibrant Life", "zh-CN": "多彩多姿的生活", "zh-TW": "多彩多姿的生活" },
  { id: 61, category: "lifestyle", en: "Simple Living", "zh-CN": "生活单纯", "zh-TW": "生活單純" },

  // === Material Conditions (9 cards) ===
  { id: 62, category: "material", en: "Financial Independence", "zh-CN": "实现财务自由", "zh-TW": "實現財務自由" },
  { id: 63, category: "material", en: "Income-Generating Ability", "zh-CN": "有赚钱的能力", "zh-TW": "有賺錢的能力" },
  { id: 64, category: "material", en: "Financial Sufficiency", "zh-CN": "赚得钱够用", "zh-TW": "賺得錢夠用" },
  { id: 65, category: "material", en: "Property and Asset (House/Car)", "zh-CN": "有房有车", "zh-TW": "有房有車" },
  { id: 66, category: "material", en: "Collecting Valuables", "zh-CN": "有收藏的喜好", "zh-TW": "有收藏的喜好" },
  { id: 67, category: "material", en: "Personal Style and Fashion", "zh-CN": "潮流的打扮", "zh-TW": "潮流的打扮" },
  { id: 68, category: "material", en: "Wealth", "zh-CN": "有财富", "zh-TW": "有財富" },
  { id: 69, category: "material", en: "Power and Influence", "zh-CN": "有权有势", "zh-TW": "有權有勢" },
  { id: 70, category: "material", en: "Career Advancement and High Income", "zh-CN": "追求升迁/高薪", "zh-TW": "追求升遷/高薪" },
];

export function getCardLabel(card: IdealCard, language: Language): string {
  return card[language] || card["zh-CN"];
}

export function getCategoryLabel(category: CardCategory, language: Language): string {
  const config = CATEGORY_CONFIG[category];
  return config[language] || config["zh-CN"];
}

export function shuffleCards(cards: IdealCard[]): IdealCard[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}
