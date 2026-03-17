import { Language } from "@/hooks/useLanguage";

// 8 Career Anchor dimensions
export const DIMENSION_CODES = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"] as const;

export const DIMENSION_NAMES: Record<string, Record<Language, string>> = {
  TF: {
    "zh-CN": "技术/专业能力型",
    "zh-TW": "技術/專業能力型",
    en: "Technical/Functional",
  },
  GM: {
    "zh-CN": "管理型",
    "zh-TW": "管理型",
    en: "General Management",
  },
  AU: {
    "zh-CN": "自主/独立型",
    "zh-TW": "自主/獨立型",
    en: "Autonomy/Independence",
  },
  SE: {
    "zh-CN": "安全/稳定型",
    "zh-TW": "安全/穩定型",
    en: "Security/Stability",
  },
  EC: {
    "zh-CN": "创业/创造型",
    "zh-TW": "創業/創造型",
    en: "Entrepreneurial Creativity",
  },
  SV: {
    "zh-CN": "服务/奉献型",
    "zh-TW": "服務/奉獻型",
    en: "Service/Dedication",
  },
  CH: {
    "zh-CN": "挑战型",
    "zh-TW": "挑戰型",
    en: "Pure Challenge",
  },
  LS: {
    "zh-CN": "生活方式整合型",
    "zh-TW": "生活方式整合型",
    en: "Lifestyle Integration",
  },
};

// 4-point Likert scale (SCPC official format)
export const LIKERT_OPTIONS: Record<Language, string[]> = {
  "zh-CN": ["完全不符合", "有点符合", "比较符合", "非常符合"],
  "zh-TW": ["完全不符合", "有點符合", "比較符合", "非常符合"],
  en: ["Not true for me", "Slightly true for me", "Mostly true for me", "Very true for me"],
};

// Likert response values (0-3 scale)
export const LIKERT_VALUES = [0, 1, 2, 3];

// Diagnostic role for adaptive questioning
export type DiagnosticRole = "core" | "clarifier" | "validator";

export interface QuestionData {
  id: string;
  itemNumber: number;
  text: Record<Language, string>;
  type: "likert";
  dimension: string;
  weight: number;
  diagnosticRole: DiagnosticRole; // For adaptive question scheduling
  status: "active" | "draft";
  responses: number;
  avgTime: string;
}

// Conflict anchor pairs (structurally incompatible)
export const CONFLICT_ANCHOR_PAIRS: [string, string][] = [
  ["SE", "EC"], // Security vs Entrepreneurship
  ["GM", "AU"], // Management vs Autonomy
  ["CH", "LS"], // Challenge vs Lifestyle
  ["TF", "GM"], // Technical vs Management
];

// 40 Official SCPC Career Anchor Questions
// Each dimension has 5 questions with specific weights
export const QUESTIONS_DATA: QuestionData[] = [
  // ========================================
  // TF - Technical/Functional (Q1-Q5)
  // ========================================
  {
    id: "Q001",
    itemNumber: 1,
    text: {
      "zh-CN": "对我来说，在特定领域中被公认为具备高度专业能力，是一件非常重要的事。",
      "zh-TW": "對我來說，在特定領域中被公認為具備高度專業能力，是一件非常重要的事。",
      en: "Being recognized as highly skilled in a specific field is central to how I see myself professionally.",
    },
    type: "likert",
    dimension: "TF",
    weight: 1.6,
    diagnosticRole: "core",
    status: "active",
    responses: 2341,
    avgTime: "10s",
  },
  {
    id: "Q002",
    itemNumber: 2,
    text: {
      "zh-CN": "如果一份工作长期让我无法发挥或精进自己的专业能力，我可能会选择离开。",
      "zh-TW": "如果一份工作長期讓我無法發揮或精進自己的專業能力，我可能會選擇離開。",
      en: "I would consider declining or leaving roles that consistently prevent me from using and developing my specialized expertise.",
    },
    type: "likert",
    dimension: "TF",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 2156,
    avgTime: "12s",
  },
  {
    id: "Q003",
    itemNumber: 3,
    text: {
      "zh-CN": "我心目中的职业成功，就是不断让自己的专业或技术变得更强。",
      "zh-TW": "我心目中的職涯成功，就是不斷讓自己的專業或技術變得更強。",
      en: "Career success, for me, means continually increasing my professional or technical competence.",
    },
    type: "likert",
    dimension: "TF",
    weight: 1.6,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 1987,
    avgTime: "9s",
  },
  {
    id: "Q004",
    itemNumber: 4,
    text: {
      "zh-CN": "如果要我选，我比较想继续深耕自己的专业，而不是转去做综合管理工作。",
      "zh-TW": "如果要我選，我比較想繼續深耕自己的專業，而不是轉去做綜合管理工作。",
      en: "Given a choice, I would remain in my area of expertise rather than move into a broad management role.",
    },
    type: "likert",
    dimension: "TF",
    weight: 1.4,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2089,
    avgTime: "10s",
  },
  {
    id: "Q005",
    itemNumber: 5,
    text: {
      "zh-CN": "我对自己的专业认同，很大一部分来自于「我特别擅长什么」。",
      "zh-TW": "我對自己的專業認同，很大一部分來自於「我特別擅長什麼」。",
      en: "My professional identity is grounded in what I am particularly good at doing.",
    },
    type: "likert",
    dimension: "TF",
    weight: 1.6,
    diagnosticRole: "validator",
    status: "active",
    responses: 1876,
    avgTime: "8s",
  },

  // ========================================
  // GM - General Management (Q6-Q10)
  // ========================================
  {
    id: "Q006",
    itemNumber: 6,
    text: {
      "zh-CN": "如果一份工作无法让我带人、做决策、对整体成果负责，我可能会重新思考是否要留下。",
      "zh-TW": "如果一份工作無法讓我帶人、做決策、對整體成果負責，我可能會重新思考是否要留下。",
      en: "I would consider declining or leaving roles that keep me from leading people and being accountable for overall results.",
    },
    type: "likert",
    dimension: "GM",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 2234,
    avgTime: "11s",
  },
  {
    id: "Q007",
    itemNumber: 7,
    text: {
      "zh-CN": "对我而言，成功的职涯是能够为组织或重要部门的整体绩效负责。",
      "zh-TW": "對我而言，成功的職涯是能夠為組織或重要部門的整體績效負責。",
      en: "I define career success as being accountable for the overall performance of an organization or major unit.",
    },
    type: "likert",
    dimension: "GM",
    weight: 1.6,
    diagnosticRole: "core",
    status: "active",
    responses: 2156,
    avgTime: "10s",
  },
  {
    id: "Q008",
    itemNumber: 8,
    text: {
      "zh-CN": "比起当技术专家，我更向往跨部门整合、做高层决策的工作。",
      "zh-TW": "比起當技術專家，我更嚮往跨部門整合、做高層決策的工作。",
      en: "Leading across functions and making high-level decisions appeals to me more than remaining a specialist.",
    },
    type: "likert",
    dimension: "GM",
    weight: 1.2,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 1987,
    avgTime: "10s",
  },
  {
    id: "Q009",
    itemNumber: 9,
    text: {
      "zh-CN": "我希望担任最终需对整体成果负责的角色。",
      "zh-TW": "我希望擔任最終需對整體成果負責的角色。",
      en: "I want roles in which responsibility for total results ultimately rests with me.",
    },
    type: "likert",
    dimension: "GM",
    weight: 1.2,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2089,
    avgTime: "9s",
  },
  {
    id: "Q010",
    itemNumber: 10,
    text: {
      "zh-CN": "整合策略、人、资源与营运的工作，会让我觉得有成就感。",
      "zh-TW": "整合策略、人、資源與營運的工作，會讓我覺得有成就感。",
      en: "Integrating strategy, people, and operations is a primary source of motivation for me.",
    },
    type: "likert",
    dimension: "GM",
    weight: 1.6,
    diagnosticRole: "validator",
    status: "active",
    responses: 1876,
    avgTime: "10s",
  },

  // ========================================
  // AU - Autonomy/Independence (Q11-Q15)
  // ========================================
  {
    id: "Q011",
    itemNumber: 11,
    text: {
      "zh-CN": "能够自己决定怎么做事、什么时候做、在哪里做，对我来说非常重要。",
      "zh-TW": "能夠自己決定怎麼做事、什麼時候做、在哪裡做，對我來說非常重要。",
      en: "Having control over how, when, and where I work is important to me.",
    },
    type: "likert",
    dimension: "AU",
    weight: 1.4,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2341,
    avgTime: "9s",
  },
  {
    id: "Q012",
    itemNumber: 12,
    text: {
      "zh-CN": "若一个职位要求严格遵守规章与程序，我会觉得难以长期留任。",
      "zh-TW": "若一個職位要求嚴格遵守規章與程序，我會覺得難以長期留任。",
      en: "I would find it difficult to stay in a role that requires strict compliance with rigid rules and procedures.",
    },
    type: "likert",
    dimension: "AU",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 2156,
    avgTime: "10s",
  },
  {
    id: "Q013",
    itemNumber: 13,
    text: {
      "zh-CN": "如果升迁意味着必须放弃对工作方式或时间安排的弹性，我会拒绝这样的机会。",
      "zh-TW": "如果升遷意味著必須放棄對工作方式或時間安排的彈性，我會拒絕這樣的機會。",
      en: "I would decline advancement opportunities if they required giving up control over my work methods or schedule.",
    },
    type: "likert",
    dimension: "AU",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 1987,
    avgTime: "11s",
  },
  {
    id: "Q014",
    itemNumber: 14,
    text: {
      "zh-CN": "能够自行安排工作任务与优先级，是我对成功职业重要的感受。",
      "zh-TW": "能夠自行安排工作任務與優先級，是我對成功職業重要的感受。",
      en: "Being able to define my own tasks and priorities is essential to my sense of career success.",
    },
    type: "likert",
    dimension: "AU",
    weight: 1.6,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2089,
    avgTime: "10s",
  },
  {
    id: "Q015",
    itemNumber: 15,
    text: {
      "zh-CN": "对我来说，工作的独立性比头衔或权力更重要。",
      "zh-TW": "對我來說，工作的獨立性比頭銜或權力更重要。",
      en: "Independence matters more to me than status, title, or formal authority.",
    },
    type: "likert",
    dimension: "AU",
    weight: 1.4,
    diagnosticRole: "validator",
    status: "active",
    responses: 1876,
    avgTime: "9s",
  },

  // ========================================
  // SE - Security/Stability (Q16-Q20)
  // ========================================
  {
    id: "Q016",
    itemNumber: 16,
    text: {
      "zh-CN": "在选择工作时，我会将长期稳定性与财务安全视为高度优先的考虑。",
      "zh-TW": "在選擇工作時，我會將長期穩定性與財務安全視為高度優先的考慮。",
      en: "Long-term job or financial security is a high priority for me.",
    },
    type: "likert",
    dimension: "SE",
    weight: 1.4,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2341,
    avgTime: "9s",
  },
  {
    id: "Q017",
    itemNumber: 17,
    text: {
      "zh-CN": "我偏好稳定、可预测的工作环境。",
      "zh-TW": "我偏好穩定、可預測的工作環境。",
      en: "I prefer work environments that are predictable and stable.",
    },
    type: "likert",
    dimension: "SE",
    weight: 1.0,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2156,
    avgTime: "8s",
  },
  {
    id: "Q018",
    itemNumber: 18,
    text: {
      "zh-CN": "当我的工作或收入长期处于不稳定的状态时，我会感到焦虑。",
      "zh-TW": "當我的工作或收入長期處於不穩定的狀態時，我會感到焦慮。",
      en: "I would avoid or leave roles that place my employment or financial stability at ongoing risk.",
    },
    type: "likert",
    dimension: "SE",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 1987,
    avgTime: "11s",
  },
  {
    id: "Q019",
    itemNumber: 19,
    text: {
      "zh-CN": "对我而言，工作的稳定性比快速升迁更重要。",
      "zh-TW": "對我而言，工作的穩定性比快速升遷更重要。",
      en: "Feeling secure and settled matters more to me than rapid advancement.",
    },
    type: "likert",
    dimension: "SE",
    weight: 1.4,
    diagnosticRole: "validator",
    status: "active",
    responses: 2089,
    avgTime: "9s",
  },
  {
    id: "Q020",
    itemNumber: 20,
    text: {
      "zh-CN": "我觉得职业生涯的成功，就是有一天不必再为工作或生活是否稳定而烦恼。",
      "zh-TW": "我覺得職業生涯的成功，就是有一天不必再為工作或生活是否穩定而煩惱。",
      en: "I define career success as reaching a point where concerns about stability no longer guide my decisions.",
    },
    type: "likert",
    dimension: "SE",
    weight: 1.6,
    diagnosticRole: "core",
    status: "active",
    responses: 1876,
    avgTime: "12s",
  },

  // ========================================
  // EC - Entrepreneurial Creativity (Q21-Q25)
  // ========================================
  {
    id: "Q021",
    itemNumber: 21,
    text: {
      "zh-CN": "从无到有打造一件全新的事物，会让我感到特别兴奋与投入。",
      "zh-TW": "從無到有打造一件全新的事物，會讓我感到特別興奮與投入。",
      en: "I am drawn to creating something new from the ground up.",
    },
    type: "likert",
    dimension: "EC",
    weight: 1.2,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2341,
    avgTime: "8s",
  },
  {
    id: "Q022",
    itemNumber: 22,
    text: {
      "zh-CN": "以自己的想法打造一份事业或开创新的项目，是我对成功的具体想象。",
      "zh-TW": "以自己的想法打造一份事業或開創新的專案，是我對成功的具體想象。",
      en: "Building an enterprise based on my own ideas defines career success for me.",
    },
    type: "likert",
    dimension: "EC",
    weight: 1.6,
    diagnosticRole: "core",
    status: "active",
    responses: 2156,
    avgTime: "10s",
  },
  {
    id: "Q023",
    itemNumber: 23,
    text: {
      "zh-CN": "如果一份工作无法让我创新或尝试新事物，我可能会考虑离开。",
      "zh-TW": "如果一份工作無法讓我創新或嘗試新事物，我可能會考慮離開。",
      en: "I would consider declining or leaving roles that consistently prevent me from creating, experimenting, or building something new.",
    },
    type: "likert",
    dimension: "EC",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 1987,
    avgTime: "12s",
  },
  {
    id: "Q024",
    itemNumber: 24,
    text: {
      "zh-CN": "如果有选择，我更倾向于开创自己的事业，而不是管理既有的体系。",
      "zh-TW": "如果有選擇，我更傾向於開創自己的事業，而不是管理既有的體系。",
      en: "Given a choice, I would rather create and build something of my own than manage an established operation.",
    },
    type: "likert",
    dimension: "EC",
    weight: 1.4,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2089,
    avgTime: "11s",
  },
  {
    id: "Q025",
    itemNumber: 25,
    text: {
      "zh-CN": "对我而言，成功的衡量在于那些由我亲手创立并持续成长的成果。",
      "zh-TW": "對我而言，成功的衡量在於那些由我親手創立並持續成長的成果。",
      en: "I measure success by what I personally originate and grow.",
    },
    type: "likert",
    dimension: "EC",
    weight: 1.6,
    diagnosticRole: "validator",
    status: "active",
    responses: 1876,
    avgTime: "9s",
  },

  // ========================================
  // SV - Service/Dedication (Q26-Q30)
  // ========================================
  {
    id: "Q026",
    itemNumber: 26,
    text: {
      "zh-CN": "在做职涯决定时，我会优先考虑这件事是否对社会或他人具有意义。",
      "zh-TW": "在做職涯決定時，我會優先考慮這件事是否對社會或他人具有意義。",
      en: "My career decisions are guided by a desire to contribute to the greater good.",
    },
    type: "likert",
    dimension: "SV",
    weight: 1.2,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2341,
    avgTime: "10s",
  },
  {
    id: "Q027",
    itemNumber: 27,
    text: {
      "zh-CN": "如果一份工作无法让我服务他人或实现有价值的使命，我会考虑离开。",
      "zh-TW": "如果一份工作無法讓我服務他人或實現有價值的使命，我會考慮離開。",
      en: "I would consider leaving a position that consistently prevents me from serving others or a meaningful cause.",
    },
    type: "likert",
    dimension: "SV",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 2156,
    avgTime: "11s",
  },
  {
    id: "Q028",
    itemNumber: 28,
    text: {
      "zh-CN": "与职位高低或收入多寡相比，我更重视自己的工作是否能产生正向影响。",
      "zh-TW": "與職位高低或收入多寡相比，我更重視自己的工作是否能產生正向影響。",
      en: "Making a positive difference through my work matters more to me than rank or compensation.",
    },
    type: "likert",
    dimension: "SV",
    weight: 1.4,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 1987,
    avgTime: "10s",
  },
  {
    id: "Q029",
    itemNumber: 29,
    text: {
      "zh-CN": "对我而言，成功取决于我是否为社会带来了具体且有意义的贡献。",
      "zh-TW": "對我而言，成功取決於我是否為社會帶來了具體且有意義的貢獻。",
      en: "I define career success by the social or human value created through my work.",
    },
    type: "likert",
    dimension: "SV",
    weight: 1.6,
    diagnosticRole: "core",
    status: "active",
    responses: 2089,
    avgTime: "10s",
  },
  {
    id: "Q030",
    itemNumber: 30,
    text: {
      "zh-CN": "驱动我前进的力量，是更高层次的使命感，而不是个人升迁。",
      "zh-TW": "驅動我前進的力量，是更高層次的使命感，而不是個人升遷。",
      en: "I am motivated by a calling that extends beyond my own personal advancement.",
    },
    type: "likert",
    dimension: "SV",
    weight: 1.6,
    diagnosticRole: "validator",
    status: "active",
    responses: 1876,
    avgTime: "9s",
  },

  // ========================================
  // CH - Pure Challenge (Q31-Q35)
  // ========================================
  {
    id: "Q031",
    itemNumber: 31,
    text: {
      "zh-CN": "越是被认为困难的问题，越能激发我的投入与热情。",
      "zh-TW": "越是被認為困難的問題，越能激發我的投入與熱情。",
      en: "I am energized by tackling problems that others consider extremely difficult.",
    },
    type: "likert",
    dimension: "CH",
    weight: 1.2,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2341,
    avgTime: "9s",
  },
  {
    id: "Q032",
    itemNumber: 32,
    text: {
      "zh-CN": "对我而言，突破与挑战困难的过程本身就是一种强烈的驱动力。",
      "zh-TW": "對我而言，突破與挑戰困難的過程本身就是一種強烈的驅動力。",
      en: "Overcoming challenging obstacles strongly motivates me.",
    },
    type: "likert",
    dimension: "CH",
    weight: 1.2,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2156,
    avgTime: "8s",
  },
  {
    id: "Q033",
    itemNumber: 33,
    text: {
      "zh-CN": "如果工作变得太例行、没有挑战，我会很快失去热情。",
      "zh-TW": "如果工作變得太例行、沒有挑戰，我會很快失去熱情。",
      en: "I would struggle to stay engaged in work that becomes routine or insufficiently challenging.",
    },
    type: "likert",
    dimension: "CH",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 1987,
    avgTime: "10s",
  },
  {
    id: "Q034",
    itemNumber: 34,
    text: {
      "zh-CN": "我会主动寻找能测试自己极限和解决问题能力的项目。",
      "zh-TW": "我會主動尋找能測試自己極限和解決問題能力的專案。",
      en: "I seek situations that push my limits and test my problem-solving ability.",
    },
    type: "likert",
    dimension: "CH",
    weight: 1.2,
    diagnosticRole: "validator",
    status: "active",
    responses: 2089,
    avgTime: "10s",
  },
  {
    id: "Q035",
    itemNumber: 35,
    text: {
      "zh-CN": "我将成功界定为突破看似不可逾越的挑战，并将其转化为实际成果。",
      "zh-TW": "我將成功界定為突破看似不可逾越的挑戰，並將其轉化為實際成果。",
      en: "For me, success means mastering challenges that initially seem impossible.",
    },
    type: "likert",
    dimension: "CH",
    weight: 1.6,
    diagnosticRole: "core",
    status: "active",
    responses: 1876,
    avgTime: "9s",
  },

  // ========================================
  // LS - Lifestyle Integration (Q36-Q40)
  // ========================================
  {
    id: "Q036",
    itemNumber: 36,
    text: {
      "zh-CN": "我希望我的职涯能长期与个人及家庭生活保持良好的平衡。",
      "zh-TW": "我希望我的職涯能長期與個人及家庭生活保持良好的平衡。",
      en: "I want my career to fit sustainably with my personal and family life.",
    },
    type: "likert",
    dimension: "LS",
    weight: 1.4,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2341,
    avgTime: "9s",
  },
  {
    id: "Q037",
    itemNumber: 37,
    text: {
      "zh-CN": "对我而言，成功意味着能在职涯、人际关系与个人需要之间维持稳定的平衡。",
      "zh-TW": "對我而言，成功意味著能在職涯、人際關係與個人需要之間維持穩定的平衡。",
      en: "Balancing work, relationships, and personal needs defines career success for me.",
    },
    type: "likert",
    dimension: "LS",
    weight: 1.6,
    diagnosticRole: "core",
    status: "active",
    responses: 2156,
    avgTime: "10s",
  },
  {
    id: "Q038",
    itemNumber: 38,
    text: {
      "zh-CN": "如果升迁长期影响我的生活质量，我可能会选择放弃这个机会。",
      "zh-TW": "如果升遷長期影響我的生活質量，我可能會選擇放棄這個機會。",
      en: "I would consider giving up advancement opportunities if they consistently disrupted my overall life balance.",
    },
    type: "likert",
    dimension: "LS",
    weight: 2.0,
    diagnosticRole: "core",
    status: "active",
    responses: 1987,
    avgTime: "11s",
  },
  {
    id: "Q039",
    itemNumber: 39,
    text: {
      "zh-CN": "对我而言，弹性是基本条件，而非可有可无的附加价值。",
      "zh-TW": "對我而言，彈性是基本條件，而非可有可無的附加價值。",
      en: "Flexibility is necessary for integrating my career with other life priorities.",
    },
    type: "likert",
    dimension: "LS",
    weight: 1.0,
    diagnosticRole: "clarifier",
    status: "active",
    responses: 2089,
    avgTime: "9s",
  },
  {
    id: "Q040",
    itemNumber: 40,
    text: {
      "zh-CN": "在我评估职涯选择时，不仅考虑工作本身，更需要评估它是否支持我的整体人生规划。",
      "zh-TW": "在我評估職涯選擇時，不僅考慮工作本身，更需要評估它是否支持我的整體人生規劃。",
      en: "I evaluate career choices based on how they support my whole life, not just my work role.",
    },
    type: "likert",
    dimension: "LS",
    weight: 1.6,
    diagnosticRole: "validator",
    status: "active",
    responses: 1876,
    avgTime: "10s",
  },
];

// Calculate weighted score for a dimension
export function calculateDimensionScore(
  answers: Record<string, number>,
  dimension: string
): { rawScore: number; weightedScore: number; maxPossible: number } {
  const dimensionQuestions = QUESTIONS_DATA.filter(q => q.dimension === dimension);
  
  let rawScore = 0;
  let weightedScore = 0;
  let totalWeight = 0;
  
  for (const question of dimensionQuestions) {
    const answer = answers[question.id];
    if (answer !== undefined) {
      rawScore += answer;
      weightedScore += answer * question.weight;
      totalWeight += question.weight;
    }
  }
  
  // Max possible score: 3 (max answer) × sum of weights
  const maxPossible = 3 * totalWeight;
  
  return { rawScore, weightedScore, maxPossible };
}

// Calculate normalized score (0-100) for a dimension
export function calculateNormalizedScore(
  answers: Record<string, number>,
  dimension: string
): number {
  const { weightedScore, maxPossible } = calculateDimensionScore(answers, dimension);
  if (maxPossible === 0) return 0;
  return Math.round((weightedScore / maxPossible) * 100);
}

// ========================================
// Adaptive Question Scheduling Helpers
// ========================================

// Get questions by diagnostic role
export function getQuestionsByRole(role: DiagnosticRole): QuestionData[] {
  return QUESTIONS_DATA.filter(q => q.diagnosticRole === role && q.status === "active");
}

// Get core questions (16 questions, 2 per anchor)
export function getCoreQuestions(): QuestionData[] {
  return getQuestionsByRole("core");
}

// Get clarifier questions for specific dimensions
export function getClarifierQuestions(dimensions?: string[]): QuestionData[] {
  const clarifiers = getQuestionsByRole("clarifier");
  if (!dimensions) return clarifiers;
  return clarifiers.filter(q => dimensions.includes(q.dimension));
}

// Get validator questions for conflict verification
export function getValidatorQuestions(dimensions?: string[]): QuestionData[] {
  const validators = getQuestionsByRole("validator");
  if (!dimensions) return validators;
  return validators.filter(q => dimensions.includes(q.dimension));
}

// Check if two anchors are in conflict
export function areAnchorsInConflict(anchor1: string, anchor2: string): boolean {
  return CONFLICT_ANCHOR_PAIRS.some(
    ([a, b]) => (a === anchor1 && b === anchor2) || (a === anchor2 && b === anchor1)
  );
}

// Adaptive thresholds (SCPC v2 algorithm)
export const ADAPTIVE_THRESHOLDS = {
  softCap: 24,
  hardCap: 40,
  highWeightThreshold: 1.6,
  phase1Count: 8,   // 1 question per anchor
  phase2Count: 12,  // +4 (top2 + bottom2)
  focusBatchSize: 2,
  maxConsecutiveSameAnchor: 2,
};

// Deterministic tie-break order (fixed priority)
export const TIE_BREAK_ORDER = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"] as const;

// =============================================
// Standardized scoring: display_score = (raw_score / max_raw_score) × 100
// Max raw score per anchor = 3 (max answer) × Σ(weights for that anchor)
// =============================================
export const MAX_RAW_SCORES: Record<string, number> = (() => {
  const maxScores: Record<string, number> = {};
  for (const dim of DIMENSION_CODES) {
    const dimQuestions = QUESTIONS_DATA.filter(q => q.dimension === dim && q.status === "active");
    const totalWeight = dimQuestions.reduce((sum, q) => sum + q.weight, 0);
    maxScores[dim] = Math.round(3 * totalWeight * 10) / 10; // 3 × Σ(weights), rounded to 1 decimal
  }
  return maxScores;
})();

/**
 * Convert raw scores to standardized 0-100 scores.
 * Formula: standardized = (raw_score / max_raw_score_for_anchor) × 100
 * Rounded to nearest integer for clean display.
 */
export function standardizeScores(rawScores: Record<string, number>): Record<string, number> {
  const standardized: Record<string, number> = {};
  for (const [dim, rawScore] of Object.entries(rawScores)) {
    const maxRaw = MAX_RAW_SCORES[dim];
    if (maxRaw && maxRaw > 0) {
      standardized[dim] = Math.round((rawScore / maxRaw) * 100);
    } else {
      standardized[dim] = 0;
    }
  }
  return standardized;
}

// Score interpretation thresholds (standardized 0-100 scale)
export const SCORE_INTERPRETATION = {
  coreAdvantage: { min: 80, max: 100, labelZh: "核心优势锚点", labelZhTW: "核心優勢錨點", labelEn: "Core Advantage Anchor" },
  highSensitive: { min: 65, max: 79, labelZh: "高敏感区", labelZhTW: "高敏感區", labelEn: "High-Sensitivity Zone" },
  moderate: { min: 45, max: 64, labelZh: "中度影响", labelZhTW: "中度影響", labelEn: "Moderate Influence" },
  nonCore: { min: 0, max: 44, labelZh: "非核心维度", labelZhTW: "非核心維度", labelEn: "Non-core Dimension" },
};

// Legacy compatibility - keep construct types for existing code
export type Construct = 
  | "refusal_threshold"
  | "success_definition"
  | "identity"
  | "value_prioritization"
  | "aspiration"
  | "motivation"
  | "fulfillment"
  | "structural_preference";

export const CONSTRUCT_WEIGHTS: Record<Construct, number> = {
  refusal_threshold: 2.0,
  success_definition: 1.6,
  identity: 1.6,
  value_prioritization: 1.4,
  aspiration: 1.2,
  motivation: 1.2,
  fulfillment: 1.0,
  structural_preference: 1.0,
};

export const CONSTRUCT_NAMES: Record<Construct, Record<Language, string>> = {
  refusal_threshold: {
    "zh-CN": "拒绝阈值",
    "zh-TW": "拒絕閾值",
    en: "Refusal Threshold",
  },
  success_definition: {
    "zh-CN": "成功定义",
    "zh-TW": "成功定義",
    en: "Success Definition",
  },
  identity: {
    "zh-CN": "身份认同",
    "zh-TW": "身份認同",
    en: "Identity",
  },
  value_prioritization: {
    "zh-CN": "价值优先级",
    "zh-TW": "價值優先級",
    en: "Value Prioritization",
  },
  aspiration: {
    "zh-CN": "志向",
    "zh-TW": "志向",
    en: "Aspiration",
  },
  motivation: {
    "zh-CN": "动机",
    "zh-TW": "動機",
    en: "Motivation",
  },
  fulfillment: {
    "zh-CN": "满足感",
    "zh-TW": "滿足感",
    en: "Fulfillment",
  },
  structural_preference: {
    "zh-CN": "结构偏好",
    "zh-TW": "結構偏好",
    en: "Structural Preference",
  },
};

// Salience bonus multiplier (legacy)
export const SALIENCE_MULTIPLIER = 1.5;
