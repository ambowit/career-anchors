import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[personalized-analysis] ${step}${detailsStr}`);
};

// Simplified → Traditional Chinese character mapping for post-processing AI output
const SC_TO_TC: Record<string, string> = {
  "质":"質","见":"見","现":"現","发":"發","达":"達","关":"關","观":"觀",
  "设":"設","计":"計","际":"際","经":"經","验":"驗","动":"動","标":"標",
  "导":"導","实":"實","确":"確","决":"決","势":"勢","进":"進","环":"環",
  "单":"單","领":"領","价":"價","认":"認","识":"識","构":"構","组":"組",
  "织":"織","异":"異","创":"創","专":"專","业":"業","产":"產","战":"戰",
  "稳":"穩","独":"獨","长":"長","阶":"階","调":"調","极":"極","为":"為",
  "从":"從","过":"過","来":"來","还":"還","这":"這","个":"個","点":"點",
  "并":"並","则":"則","虽":"雖","难":"難","问":"問","题":"題","办":"辦",
  "处":"處","变":"變","状":"狀","态":"態","强":"強","选":"選","择":"擇",
  "断":"斷","继":"繼","续":"續","体":"體","区":"區","范":"範","围":"圍",
  "压":"壓","传":"傳","网":"網","联":"聯","连":"連","运":"運","营":"營",
  "责":"責","讨":"討","论":"論","证":"證","评":"評","测":"測","试":"試",
  "绩":"績","效":"效","够":"夠","对":"對","当":"當","须":"須","与":"與",
  "开":"開","门":"門","间":"間","时":"時","机":"機","会":"會","能":"能",
  "节":"節","习":"習","学":"學","术":"術","让":"讓","说":"說","话":"話",
  "请":"請","读":"讀","写":"寫","画":"畫","听":"聽","声":"聲","乐":"樂",
  "电":"電","脑":"腦","车":"車","钱":"錢","银":"銀","铁":"鐵","钟":"鐘",
  "锚":"錨","锁":"鎖","错":"錯","镜":"鏡","陆":"陸","层":"層","岁":"歲",
  "风":"風","险":"險","愿":"願","虑":"慮","忧":"憂","惊":"驚","怀":"懷",
  "恼":"惱","惯":"慣","感":"感","总":"總","爱":"愛","欢":"歡","喜":"喜",
  "兴":"興","举":"舉","丰":"豐","义":"義","显":"顯","类":"類","系":"繫",
  "紧":"緊","维":"維","纪":"紀","约":"約","纯":"純","线":"線","细":"細",
  "结":"結","给":"給","绝":"絕","统":"統","丝":"絲","经":"經","纬":"緯",
  "继":"繼","综":"綜","练":"練","组":"組","终":"終","绘":"繪","络":"絡",
  "缺":"缺","罗":"羅","能":"能","灵":"靈","龄":"齡","协":"協","够":"夠",
  "离":"離","响":"響","属":"屬","复":"復","杂":"雜","夺":"奪","奋":"奮",
  "头":"頭","颖":"穎","频":"頻","顾":"顧","须":"須","顿":"頓","预":"預",
  "领":"領","额":"額","馈":"饋","饱":"飽","饥":"飢"
};

function convertToTraditional(text: string): string {
  let result = "";
  for (const char of text) {
    result += SC_TO_TC[char] || char;
  }
  return result;
}

const DIMENSION_NAMES: Record<string, Record<string, string>> = {
  "zh-CN": {
    TF: "技术/专业能力型",
    GM: "管理型",
    AU: "自主/独立型",
    SE: "安全/稳定型",
    EC: "创业/创造型",
    SV: "服务/奉献型",
    CH: "挑战型",
    LS: "生活方式整合型",
  },
  "zh-TW": {
    TF: "技術/專業能力型",
    GM: "管理型",
    AU: "自主/獨立型",
    SE: "安全/穩定型",
    EC: "創業/創造型",
    SV: "服務/奉獻型",
    CH: "挑戰型",
    LS: "生活方式整合型",
  },
  "en": {
    TF: "Technical/Functional",
    GM: "General Management",
    AU: "Autonomy/Independence",
    SE: "Security/Stability",
    EC: "Entrepreneurial Creativity",
    SV: "Service/Dedication",
    CH: "Pure Challenge",
    LS: "Lifestyle Integration",
  },
};

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
  "en": {
    TF: "achieving depth and excellence in a specialized field",
    GM: "leading teams, integrating resources, being responsible for overall results",
    AU: "deciding your own work methods, schedule, and pace",
    SE: "a stable, predictable, and secure career environment",
    EC: "creating something new and building your own venture",
    SV: "aligning work with values and creating social meaning",
    CH: "continuously tackling difficulties and conquering complex problems",
    LS: "integration and balance between work and personal life",
  },
};

const CONFLICT_EXPLANATIONS: Record<string, Record<string, string>> = {
  "zh-CN": {
    "SE-EC": "安全稳定与创业创造：一个追求确定性，一个拥抱不确定性",
    "GM-AU": "管理职责与自主独立：一个需要整合他人，一个希望独立运作",
    "CH-LS": "追求挑战与生活平衡：一个需要全力投入，一个需要留有余地",
    "TF-GM": "技术深耕与管理转型：一个专注专业，一个需要放弃专业深度",
  },
  "zh-TW": {
    "SE-EC": "安全穩定與創業創造：一個追求確定性，一個擁抱不確定性",
    "GM-AU": "管理職責與自主獨立：一個需要整合他人，一個希望獨立運作",
    "CH-LS": "追求挑戰與生活平衡：一個需要全力投入，一個需要留有餘地",
    "TF-GM": "技術深耕與管理轉型：一個專注專業，一個需要放棄專業深度",
  },
  "en": {
    "SE-EC": "Security vs Entrepreneurship: one seeks certainty, the other embraces uncertainty",
    "GM-AU": "Management vs Autonomy: one needs to integrate others, the other wants to operate independently",
    "CH-LS": "Challenge vs Lifestyle: one requires full commitment, the other needs space for life",
    "TF-GM": "Technical vs Management: one focuses on expertise, the other requires letting go of deep specialization",
  },
};

// =====================================================================
// SCPC 4-Stage Career Framework
// =====================================================================

interface StageDefinition {
  code: string;
  label: Record<string, string>;
  definition: Record<string, string>;
}

const CAREER_STAGES: Record<string, StageDefinition> = {
  early: {
    code: "A",
    label: {
      "zh-CN": "职业早期（0-5年）",
      "zh-TW": "職業早期（0-5年）",
      en: "Early Career (0-5 Years)",
    },
    definition: {
      "zh-CN": "职业身份尚未固定，处于探索与实验阶段。目标是观察能量来源与摩擦模式，而非锁定长期结构。",
      "zh-TW": "職業身份尚未固定，處於探索與實驗階段。目標是觀察能量來源與摩擦模式，而非鎖定長期結構。",
      en: "Identity Forming Stage — Career identity not yet fixed, in a phase of exploration and experimentation. The goal is to observe energy sources and friction patterns, not to lock in long-term structures.",
    },
  },
  mid: {
    code: "B",
    label: {
      "zh-CN": "职业中期（6-10年）",
      "zh-TW": "職業中期（6-10年）",
      en: "Mid-Career Stage (6-10 Years)",
    },
    definition: {
      "zh-CN": "能力已被验证，方向仍具弹性。张力多为成长型张力，而非结构性错配。",
      "zh-TW": "能力已被驗證，方向仍具彈性。張力多為成長型張力，而非結構性錯配。",
      en: "Identity Consolidation & Direction Testing — Competence has been validated, direction remains flexible. Tensions are mostly growth-oriented, not structural mismatches.",
    },
  },
  senior: {
    code: "C",
    label: {
      "zh-CN": "职业资深期（10-15年+）",
      "zh-TW": "職業資深期（10-15年+）",
      en: "Senior-Career Stage (10-15+ Years)",
    },
    definition: {
      "zh-CN": "身份趋于稳定。若出现错配，将表现为疲劳、冷却或隐性脱离，而非好奇或探索。",
      "zh-TW": "身份趨於穩定。若出現錯配，將表現為疲勞、冷卻或隱性脫離，而非好奇或探索。",
      en: "Identity Reckoning & Structural Commitment — Identity is stabilizing. If misalignment occurs, it manifests as fatigue, cooling, or covert disengagement — not curiosity or exploration.",
    },
  },
  executive: {
    code: "D",
    label: {
      "zh-CN": "高管/创业者阶段（C-level / 创业者）",
      "zh-TW": "高管/創業者階段（C-level / 創業者）",
      en: "Executive / Entrepreneur (C-level / Founder)",
    },
    definition: {
      "zh-CN": "职业锚不再描述偏好，而描述决策风格、权力观、风险观与组织塑造方式。此阶段锚点属于身份架构层。",
      "zh-TW": "職業錨不再描述偏好，而描述決策風格、權力觀、風險觀與組織塑造方式。此階段錨點屬於身份架構層。",
      en: "Identity Architecture Stage — Career anchors no longer describe preferences, but describe decision-making style, power orientation, risk orientation, and organizational shaping. Anchors at this stage belong to the identity architecture layer.",
    },
  },
};

function deriveStageKey(workYears: number | null, isExecutive: boolean, isEntrepreneur: boolean): string {
  if (isExecutive || isEntrepreneur) return "executive";
  if (workYears === null) return "mid";
  if (workYears <= 5) return "early";
  if (workYears <= 10) return "mid";
  return "senior";
}

interface AssessmentResult {
  scores: Record<string, number>;
  mainAnchor: string;
  coreAdvantageAnchors?: string[];
  conflictAnchors: string[][];
  stability: string;
  interpretation?: Record<string, { level: string; label: string; score: number }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      result,
      analysisType,
      language = "zh-CN",
      workExpDescription = "",
      workYears = null,
      isExecutive = false,
      isEntrepreneur = false,
      reportVersion = null,
      organizationId = null,
    } = await req.json() as {
      result: AssessmentResult;
      analysisType: "deep_dive" | "career_path" | "action_plan" | "dual_anchor" | "tri_anchor";
      language?: "zh-CN" | "zh-TW" | "en";
      workExpDescription?: string;
      workYears?: number | null;
      isExecutive?: boolean;
      isEntrepreneur?: boolean;
      reportVersion?: string | null;
      organizationId?: string | null;
    };

    // Detect enterprise version
    const isEnterprise = !!reportVersion && reportVersion !== "standard";

    logStep("Received request", { analysisType, mainAnchor: result.mainAnchor, coreAdvAnchors: result.coreAdvantageAnchors, language, workYears, isExecutive, isEntrepreneur, reportVersion, isEnterprise });

    const apiKey = Deno.env.get("SUPERUN_API_KEY");
    if (!apiKey) {
      throw new Error("SUPERUN_API_KEY not configured");
    }

    const dimNames = DIMENSION_NAMES[language] || DIMENSION_NAMES["zh-CN"];
    const anchorMeanings = ANCHOR_CORE_MEANINGS[language] || ANCHOR_CORE_MEANINGS["zh-CN"];
    const conflictExplanations = CONFLICT_EXPLANATIONS[language] || CONFLICT_EXPLANATIONS["zh-CN"];

    // Compute high-sensitivity anchors (score > 80)
    const highSensAnchors = result.coreAdvantageAnchors || Object.entries(result.scores)
      .filter(([, score]) => score >= 80)
      .sort(([, a], [, b]) => b - a)
      .map(([dim]) => dim);
    const displayAnchor = highSensAnchors[0] || result.mainAnchor;
    const mainAnchorName = dimNames[displayAnchor] || displayAnchor;
    const mainAnchorMeaning = anchorMeanings[displayAnchor] || "";

    const conflictInfo = result.conflictAnchors?.map(([anchorA, anchorB]) => {
      const key1 = `${anchorA}-${anchorB}`;
      const key2 = `${anchorB}-${anchorA}`;
      return {
        pair: `${dimNames[anchorA]} × ${dimNames[anchorB]}`,
        explanation: conflictExplanations[key1] || conflictExplanations[key2] || ""
      };
    }) || [];

    // Score level interpretation (standardized 0-100 scale)
    const getScoreInterpretation = (score: number, lang: string) => {
      if (lang === "en") {
        if (score >= 80) return "very hard to compromise long-term";
        if (score >= 65) return "high-sensitivity anchor, sustainable development";
        if (score >= 45) return "matters to you, but not a bottom line";
        return "not your main decision factor";
      } else if (lang === "zh-TW") {
        if (score >= 80) return "很難長期妥協";
        if (score >= 65) return "高敏感錨點，可持續發展";
        if (score >= 45) return "有意義，但不是底線";
        return "不是做選擇時最在意的點";
      }
      if (score >= 80) return "很难长期妥协";
      if (score >= 65) return "高敏感锚点，可持续发展";
      if (score >= 45) return "有意义，但不是底线";
      return "不是做选择时最在意的点";
    };

    const scoresWithInterpretation = Object.entries(result.scores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([key, value]) => ({
        name: dimNames[key],
        code: key,
        score: value,
        interpretation: getScoreInterpretation(value, language)
      }));

    // Derive career stage
    const stageKey = deriveStageKey(workYears, isExecutive, isEntrepreneur);
    const stageDef = CAREER_STAGES[stageKey];
    const stageLabel = stageDef.label[language] || stageDef.label["zh-CN"];
    const stageDefinition = stageDef.definition[language] || stageDef.definition["zh-CN"];

    // Risk amplification context
    const mainScore = result.scores[displayAnchor] || 0;
    const isHighSensitivity = mainScore > 80;

    let riskAmplificationNote = "";
    if (stageKey === "senior" && isHighSensitivity) {
      if (language === "en") {
        riskAmplificationNote = "IMPORTANT: This user is in the Senior-Career Stage with a core anchor (score >80). Misalignment at this stage is particularly critical and does not manifest as exploration, but as fatigue and identity friction. You MUST include Burnout Signal Pattern, Early Warning Signs, and Derailment Pattern in the risk section.";
      } else if (language === "zh-TW") {
        riskAmplificationNote = "重要：你處於職業資深期，核心錨強度高。在這一階段，錯配風險尤為嚴重，不會以探索表現，而會以疲勞與身份摩擦表現。你必須在風險部分加入：倦怠信號模式、早期預警信號、偏離模式。";
      } else {
        riskAmplificationNote = "重要：此用户处于职业资深期，核心锚强度高。在这一阶段，错配风险尤为严重，不会以探索表现，而会以疲劳与身份摩擦表现。你必须在风险部分加入：倦怠信号模式、早期预警信号、偏离模式。";
      }
    } else if (stageKey === "executive" && isHighSensitivity) {
      if (language === "en") {
        riskAmplificationNote = "IMPORTANT: This user is in the Executive/Entrepreneur Stage with a core anchor (score >80). This anchor has become part of their identity architecture. Long-term misalignment will affect judgment patterns and organizational culture direction. You MUST analyze: decision-making style, power usage patterns, risk preferences, control modes, and shadow side.";
      } else if (language === "zh-TW") {
        riskAmplificationNote = "重要：你處於高管/創業者階段，核心錨強度高。此錨點已成為身份架構的一部分，長期錯配將影響判斷方式與組織文化方向。你必須分析：決策風格、權力使用方式、風險偏好、控制模式、陰影面。";
      } else {
        riskAmplificationNote = "重要：此用户处于高管/创业者阶段，核心锚强度高。此锚点已成为身份架构的一部分，长期错配将影响判断方式与组织文化方向。你必须分析：决策风格、权力使用方式、风险偏好、控制模式、阴影面。";
      }
    }

    let systemPrompt = "";
    let userPrompt = "";

    const isEnglish = language === "en";
    const isTW = language === "zh-TW";

    // Stage-specific interpretation instructions per stage
    const getStageInstructions = (stage: string, lang: string): string => {
      if (lang === "en") {
        switch (stage) {
          case "early":
            return `STAGE-SPECIFIC INTERPRETATION RULES (Early Career):
- Interpret anchors as energy sources and experimental directions
- Provide explorable role/position directions
- Do NOT use risk, burnout, or fatigue language
- Frame tensions as natural exploration patterns
- Use curious, forward-looking tone`;
          case "mid":
            return `STAGE-SPECIFIC INTERPRETATION RULES (Mid-Career):
- Emphasize growth tension — describe as "exploratory tension"
- Provide structural testing suggestions
- Light early warnings are acceptable, but do NOT use severe risk language
- Frame challenges as direction-testing opportunities
- Use developmental, momentum-oriented tone`;
          case "senior":
            return `STAGE-SPECIFIC INTERPRETATION RULES (Senior-Career):
- Emphasize structural mismatch risk
- You MUST include: Burnout Signal Pattern, Early Warning Signs, Derailment Pattern
- Use developmental psychology language
- Flag long-term identity conflict risks
- At this stage, misalignment manifests as fatigue and identity friction, NOT curiosity or exploration
- Be direct about structural consequences`;
          case "executive":
            return `STAGE-SPECIFIC INTERPRETATION RULES (Executive/Entrepreneur):
- Interpret anchors as Identity Architecture
- Analyze: decision-making style, power usage patterns, risk preferences, control modes, shadow side
- Analyze impact on organizational culture
- Emphasize long-term structural shaping effects
- Frame through leadership identity lens, not personal preference lens`;
          default:
            return "";
        }
      } else if (lang === "zh-TW") {
        switch (stage) {
          case "early":
            return `階段化解釋規則（職業早期）：
- 將錨點解釋為能量來源與嘗試方向
- 提供可實驗的職位方向
- 不使用風險或倦怠語言
- 用好奇、前瞻的語調`;
          case "mid":
            return `階段化解釋規則（職業中期）：
- 強調成長張力，描述為「探索性張力」
- 給出結構性測試建議
- 可加入輕度預警，但不使用嚴重風險語言`;
          case "senior":
            return `階段化解釋規則（職業資深期）：
- 強調結構性錯配風險
- 必須加入：倦怠信號模式、早期預警信號、偏離模式
- 使用發展心理語言
- 提示長期身份衝突風險
- 在這一階段，錯配不會以探索表現，而會以疲勞與身份摩擦表現`;
          case "executive":
            return `階段化解釋規則（高管/創業者）：
- 解釋為身份架構
- 分析：決策風格、權力使用方式、風險偏好、控制模式、陰影面
- 分析其對組織文化的影響
- 強調長期結構塑造效應`;
          default:
            return "";
        }
      }
      // zh-CN default
      switch (stage) {
        case "early":
          return `阶段化解释规则（职业早期）：
- 将锚点解释为能量来源与尝试方向
- 提供可实验岗位方向
- 不使用风险或倦怠语言
- 用好奇、前瞻的语调`;
        case "mid":
          return `阶段化解释规则（职业中期）：
- 强调成长张力，描述为"探索性张力"
- 给出结构性测试建议
- 可加入轻度预警，但不使用严重风险语言`;
        case "senior":
          return `阶段化解释规则（职业资深期）：
- 强调结构性错配风险
- 必须加入：倦怠信号模式、早期预警信号、偏离模式
- 使用发展心理语言
- 提示长期身份冲突风险
- 在这一阶段，错配不会以探索表现，而会以疲劳与身份摩擦表现`;
        case "executive":
          return `阶段化解释规则（高管/创业者）：
- 解释为身份架构
- 分析：决策风格、权力使用方式、风险偏好、控制模式、阴影面
- 分析其对组织文化的影响
- 强调长期结构塑造效应`;
        default:
          return "";
      }
    };

    const stageInstructions = getStageInstructions(stageKey, language);

    // Enterprise version content rules — injected into system prompt when applicable
    const getEnterpriseRules = (lang: string): string => {
      if (!isEnterprise) return "";
      if (lang === "en") {
        return `\nENTERPRISE VERSION CONTENT RULES (MANDATORY):
- Do NOT use the terms "side business", "side hustle", "moonlighting", or "副業/副业" in any language
- Replace with: "cross-departmental projects", "internal innovation pilots", "cross-functional initiatives"
- Do NOT use standalone negative risk labels (e.g., "High Risk", "Danger Zone")
- Instead use development-oriented framing: "development considerations", "areas for attention", "growth focus points"
- Frame all challenges as organizational growth opportunities, not personal deficiencies
- Maintain a constructive, professional tone suitable for corporate talent development contexts`;
      } else if (lang === "zh-TW") {
        return `\n企業版內容規範（強制執行）：
- 嚴格禁止使用「副業」「兼職創業」「副業專案」等詞彙
- 替代用詞：「跨部門專案」「內部創新試點」「跨職能協作」
- 嚴格禁止使用獨立的負面風險標籤（如「高風險」「危險區域」）
- 替代框架：「發展注意事項」「關注領域」「成長重點」
- 所有挑戰應框架為組織成長機會，而非個人缺陷
- 用詞須符合台灣企業人才發展語境：使用「實習生」非「管培生」；使用「專案」非「项目」；使用「主管」非「领导」
- 保持建設性、專業的語調`;
      }
      return `\n企业版内容规范（强制执行）：
- 严格禁止使用「副业」「兼职创业」「副业项目」等词汇
- 替代用词：「跨部门专案」「内部创新试点」「跨职能协作」
- 严格禁止使用独立的负面风险标签（如「高风险」「危险区域」）
- 替代框架：「发展注意事项」「关注领域」「成长重点」
- 所有挑战应框架为组织成长机会，而非个人缺陷
- 保持建设性、专业的语调，适合企业人才发展语境`;
    };

    const enterpriseRules = getEnterpriseRules(language);

    if (analysisType === "deep_dive") {
      // SCPC Developmental Career Architecture Analysis — 6-section report
      const prohibitions = isEnglish
        ? `PROHIBITIONS:
- Do NOT use generic interpretations that ignore career stage
- Do NOT only provide job-matching suggestions
- Do NOT psychologize or diagnose
- Do NOT use absolute language
- Do NOT use motivational/inspirational platitudes
- Every interpretation MUST be stage-differentiated`
        : isTW
        ? `禁止事項：
- 禁止使用通用解釋覆蓋所有年資
- 禁止忽略階段差異
- 禁止只給職位匹配建議
- 禁止心理診斷化
- 禁止絕對化表達
- 禁止雞湯
- 每一條解釋都必須是階段化的`
        : `禁止事项：
- 禁止使用通用解释覆盖所有年资
- 禁止忽略阶段差异
- 禁止只给岗位匹配建议
- 禁止心理诊断化
- 禁止绝对化表达
- 禁止鸡汤
- 每一条解释都必须是阶段化的`;

      systemPrompt = isEnglish
        ? `You are producing a Developmental Career Architecture Analysis based on SCPC Career Anchor assessment results.

This is NOT a generic career test report. It is a stage-differentiated developmental architecture analysis.

OUTPUT STYLE:
- Write in a PROFESSIONAL, analytical report tone — like a structured career assessment report written by a senior career development expert
- Use clear, precise language that is authoritative yet accessible to non-psychologists
- Development-oriented, not labeling
- No motivational fluff, no clichés, no generic advice
- NEVER start with greetings like "Hi", "Hello", or casual openings — begin directly with the analytical content
- Maintain formal report structure throughout

VOICE — MANDATORY:
- ALWAYS write in SECOND PERSON: use "you", "your", "yours" throughout
- NEVER use third person: "the user", "this person", "they", "he/she"
- Example: Instead of "This person will experience fatigue", write "You will likely experience fatigue"

STAGE REFERENCES — MANDATORY:
- NEVER use stage codes like "Stage A", "Stage B", "Stage C", "Stage D" in the output
- Use the full descriptive career stage name instead (e.g., "Early Career stage", "Mid-Career stage", "Senior-Career stage", "Executive/Entrepreneur stage")
- Example: Instead of "At Stage D, anchors become...", write "At the Executive/Entrepreneur stage, anchors become..."

Score meaning:
- High score = constraint strength (very hard to compromise long-term)
- Low score = not a core driver (NOT a weakness)
- Scores represent CONSTRAINT STRENGTH, not ability or potential

${stageInstructions}

${riskAmplificationNote}

${prohibitions}${enterpriseRules}`
        : isTW
        ? `你正在產出一份 Developmental Career Architecture Analysis（發展性職業架構分析），基於 SCPC 職業錨評測結果。

這不是普通的職業測評報告，而是階段化的發展性職業架構分析。

【語言要求 — 最高優先級】
你必須全程使用繁體中文（台灣用語）輸出。嚴格禁止出現任何簡體中文字符。
常見易錯：本質（非本质）、顯示（非显示）、價值（非价值）、發展（非发展）、認識（非认识）、環境（非环境）、結構（非结构）、長期（非长期）、實現（非实现）、決策（非决策）、處理（非处理）、組織（非组织）、運營（非运营）、變化（非变化）、對於（非对于）、問題（非问题）、經驗（非经验）、關係（非关系）、設計（非设计）、進行（非进行）。

輸出風格：
- 用專業、分析性的語氣書寫——像一份由資深職涯發展專家撰寫的結構化職業評估報告
- 使用清晰、精確的語言，保持權威性但讓非專業讀者也能理解
- 發展導向，不標籤化
- 不雞湯，不空洞，不使用口語化表達
- 嚴格禁止以「嗨」「你好」「Hi」等問候語開頭——直接從分析內容開始
- 全程保持正式報告結構

人稱要求——最高優先級：
- 全程使用第二人稱：「你」、「你的」
- 嚴格禁止第三人稱：「你」、「此人」、「他/她」
- 範例：不要寫「你會感到疲勞」，要寫「你可能會感到疲勞」

階段代號要求——最高優先級：
- 嚴格禁止在輸出中使用「Stage A」「Stage B」「Stage C」「Stage D」等代號
- 使用完整的階段名稱，例如「職業早期」「職業中期」「職業資深期」「高管/創業者階段」
- 範例：不要寫「在 Stage D」，要寫「在高管/創業者階段」

分數含義：
- 分數高 = 約束強度（很難長期妥協）
- 分數低 = 不是核心驅動力（不是缺點）
- 分數代表約束強度，不是能力或潛力

${stageInstructions}

${riskAmplificationNote}

${prohibitions}${enterpriseRules}`
        : `你正在产出一份 Developmental Career Architecture Analysis（发展性职业架构分析），基于 SCPC 职业锚评测结果。

这不是普通的职业测评报告，而是阶段化的发展性职业架构分析。

输出风格：
- 用专业、分析性的语气书写——像一份由资深职涯发展专家撰写的结构化职业评估报告
- 使用清晰、精确的语言，保持权威性但让非专业读者也能理解
- 发展导向，不标签化
- 不鸡汤，不空洞，不使用口语化表达
- 严格禁止以「嗨」「你好」「Hi」等问候语开头——直接从分析内容开始
- 全程保持正式报告结构

人称要求——最高优先级：
- 全程使用第二人称：「你」、「你的」
- 严格禁止第三人称：「该用户」、「此人」、「他/她」
- 范例：不要写「此用户会感到疲劳」，要写「你可能会感到疲劳」

阶段代号要求——最高优先级：
- 严格禁止在输出中使用「Stage A」「Stage B」「Stage C」「Stage D」等代号
- 使用完整的阶段名称，例如「职业早期」「职业中期」「职业资深期」「高管/创业者阶段」
- 范例：不要写「在 Stage D」，要写「在高管/创业者阶段」

分数含义：
- 分数高 = 约束强度（很难长期妥协）
- 分数低 = 不是核心驱动力（不是缺点）
- 分数代表约束强度，不是能力或潜力

${stageInstructions}

${riskAmplificationNote}

${prohibitions}${enterpriseRules}`;

      const userProfileBlock = isEnglish
        ? `User Profile: ${workExpDescription || "Not specified"}
Career Stage: ${stageLabel}
Stage Definition: ${stageDefinition}

Assessment Results:
- Core Anchor: ${mainAnchorName} (${mainScore} points) — ${mainAnchorMeaning}
- Conflict Anchors: ${conflictInfo.length > 0 ? conflictInfo.map(conflictItem => `${conflictItem.pair} — ${conflictItem.explanation}`).join("; ") : "None"}
- Stability: ${result.stability === "mature" ? "Mature & Stable" : result.stability === "developing" ? "Developing" : "Still Unclear"}
- All dimension scores: ${scoresWithInterpretation.map(scoreItem => `${scoreItem.name}: ${scoreItem.score} (${scoreItem.interpretation})`).join(", ")}`
        : isTW
        ? `使用者背景：${workExpDescription || "未指定"}
職業階段：${stageLabel}
階段定義：${stageDefinition}

評測結果：
- 核心錨：${mainAnchorName}（${mainScore}分）— ${mainAnchorMeaning}
- 衝突錨：${conflictInfo.length > 0 ? conflictInfo.map(conflictItem => `${conflictItem.pair} — ${conflictItem.explanation}`).join("；") : "無"}
- 穩定度：${result.stability === "mature" ? "成熟穩定" : result.stability === "developing" ? "發展中" : "尚不清晰"}
- 各維度得分：${scoresWithInterpretation.map(scoreItem => `${scoreItem.name}: ${scoreItem.score}分（${scoreItem.interpretation}）`).join("，")}`
        : `用户背景：${workExpDescription || "未指定"}
职业阶段：${stageLabel}
阶段定义：${stageDefinition}

评测结果：
- 核心锚：${mainAnchorName}（${mainScore}分）— ${mainAnchorMeaning}
- 冲突锚：${conflictInfo.length > 0 ? conflictInfo.map(conflictItem => `${conflictItem.pair} — ${conflictItem.explanation}`).join("；") : "无"}
- 稳定度：${result.stability === "mature" ? "成熟稳定" : result.stability === "developing" ? "发展中" : "尚不清晰"}
- 各维度得分：${scoresWithInterpretation.map(scoreItem => `${scoreItem.name}: ${scoreItem.score}分（${scoreItem.interpretation}）`).join("，")}`;

      userPrompt = isEnglish
        ? `${userProfileBlock}

Generate a Developmental Career Architecture Analysis following the MANDATORY 6-SECTION STRUCTURE below.
Output in JSON format:

{
  "stageIdentification": {
    "stageCode": "${stageDef.code}",
    "stageLabel": "${stageLabel}",
    "stageDefinition": "${stageDefinition}",
    "stageImplication": "2-3 sentences: What this stage means for interpreting your career anchor results specifically. How should we read your scores differently because of this stage?"
  },
  "primaryAnchorInterpretation": {
    "coreMeaning": "Stage-specific interpretation of the core anchor. NOT a generic definition. How does '${mainAnchorMeaning}' manifest specifically at the ${stageLabel} stage? Write in second person (you/your).",
    "stageContext": "What this anchor means at YOUR current career stage — the behavioral implications, decision patterns, and identity expression that are unique to this stage. Address the reader directly.",
    "ifAligned": "If your current role/environment supports this anchor at this stage, you will experience... (stage-appropriate positive description)",
    "ifMisaligned": "If your current role/environment conflicts with this anchor at this stage, you will experience... (stage-appropriate negative description)"
  },
  "behavioralPatterns": [
    "Observable behavior pattern 1 that is stage-specific (not generic)",
    "Observable behavior pattern 2",
    "Observable behavior pattern 3",
    "Observable behavior pattern 4"
  ],
  "tensionOrRiskSignals": {
    "type": "${stageKey === 'early' ? 'exploration_patterns' : stageKey === 'mid' ? 'growth_tension' : stageKey === 'senior' ? 'structural_risk' : 'architecture_analysis'}",
    "signals": [
      {
        "signal": "Specific tension/risk signal relevant to this stage",
        "interpretation": "What this signal means at this career stage",
        "recommendation": "Stage-appropriate response"
      }
    ],
    ${stageKey === "senior" ? `"burnoutSignalPattern": "Describe the specific burnout signal pattern for this anchor at Stage C",
    "earlyWarnings": ["Early warning sign 1", "Early warning sign 2", "Early warning sign 3"],
    "derailmentPattern": "Describe how career derailment would manifest at this stage with this anchor"` : stageKey === "executive" ? `"decisionStyle": "How this anchor shapes decision-making at executive level",
    "powerOrientation": "How this anchor influences power usage and authority patterns",
    "riskPreference": "How this anchor shapes risk tolerance and risk-taking behavior",
    "controlMode": "How this anchor manifests in control patterns",
    "shadowSide": "The shadow side of this anchor at identity architecture level",
    "organizationalImpact": "How this anchor shapes organizational culture when the person is in a leadership position"` : `"conflictExplanation": ${conflictInfo.length > 0 ? `"Explain the structural tension between the conflicting anchors at this career stage"` : "null"}`}
  },
  "imbalancePatterns": {
    "overExpression": "What happens when this anchor is over-expressed at this stage (stage-specific consequences)",
    "underExpression": "What happens when this anchor is suppressed at this stage (stage-specific consequences)",
    "stageSpecificRisk": "The unique risk pattern that only manifests at the ${stageLabel} stage"
  },
  "developmentRecommendations": [
    {
      "direction": "Development direction title",
      "rationale": "Why this matters specifically at the ${stageLabel} stage",
      "action": "Concrete, actionable step (not generic advice)"
    }
  ],
  "closingNote": "A warm, non-motivational closing observation that ties back to the stage definition. Address the reader directly (you/your). 2-3 sentences max."
}

CRITICAL: Every section must be stage-differentiated. The same anchor at the Early Career stage should read fundamentally differently from the Senior-Career or Executive stage. Always write in second person (you/your). Never use Stage A/B/C/D codes.`
        : isTW
        ? `${userProfileBlock}

請產出一份 Developmental Career Architecture Analysis，遵循以下必須的六段式結構。
使用JSON格式輸出：

{
  "stageIdentification": {
    "stageCode": "${stageDef.code}",
    "stageLabel": "${stageLabel}",
    "stageDefinition": "${stageDefinition}",
    "stageImplication": "2-3句：這個階段對於解讀你的職業錨結果意味著什麼。因為你處於這個階段，應該如何不同地解讀你的分數？"
  },
  "primaryAnchorInterpretation": {
    "coreMeaning": "核心錨的階段化解釋。不是通用定義。'${mainAnchorMeaning}'在${stageLabel}具體如何呈現？用第二人稱（你）書寫。",
    "stageContext": "這個錨點在你目前的職業階段意味著什麼——行為影響、決策模式和身份表達。直接對讀者說話。",
    "ifAligned": "如果你目前的角色/環境支持這個錨點，在此階段，你會體驗到……",
    "ifMisaligned": "如果你目前的角色/環境與這個錨點衝突，在此階段，你會體驗到……"
  },
  "behavioralPatterns": [
    "階段化的可觀察行為模式1",
    "階段化的可觀察行為模式2",
    "階段化的可觀察行為模式3",
    "階段化的可觀察行為模式4"
  ],
  "tensionOrRiskSignals": {
    "type": "${stageKey === 'early' ? 'exploration_patterns' : stageKey === 'mid' ? 'growth_tension' : stageKey === 'senior' ? 'structural_risk' : 'architecture_analysis'}",
    "signals": [
      {
        "signal": "與階段相關的具體張力/風險信號",
        "interpretation": "這個信號在此職業階段意味著什麼",
        "recommendation": "階段化的回應建議"
      }
    ],
    ${stageKey === "senior" ? `"burnoutSignalPattern": "描述此錨點在職業資深期的具體倦怠信號模式",
    "earlyWarnings": ["早期預警信號1", "早期預警信號2", "早期預警信號3"],
    "derailmentPattern": "描述在此階段此錨點下，職業偏離會如何表現"` : stageKey === "executive" ? `"decisionStyle": "此錨點如何塑造高管層面的決策風格",
    "powerOrientation": "此錨點如何影響權力使用和授權模式",
    "riskPreference": "此錨點如何塑造風險容忍度",
    "controlMode": "此錨點在控制模式中的表現",
    "shadowSide": "此錨點在身份架構層面的陰影面",
    "organizationalImpact": "當此人處於領導位置時，此錨點如何塑造組織文化"` : `"conflictExplanation": ${conflictInfo.length > 0 ? `"解釋衝突錨在此職業階段的結構性張力"` : "null"}`}
  },
  "imbalancePatterns": {
    "overExpression": "此錨點在此階段過度表達時的後果",
    "underExpression": "此錨點在此階段被壓抑時的後果",
    "stageSpecificRisk": "只在${stageLabel}出現的特有風險模式"
  },
  "developmentRecommendations": [
    {
      "direction": "發展方向",
      "rationale": "為什麼這在${stageLabel}特別重要",
      "action": "具體、可操作的步驟"
    }
  ],
  "closingNote": "專業的、非勵志的結尾觀察，回扣到階段定義。2-3句。"
}

重要：每一個段落都必須是階段化的。全程使用第二人稱（你/你的）。嚴格禁止使用 Stage A/B/C/D 等代號，用完整的階段名稱代替。`
        : `${userProfileBlock}

请产出一份 Developmental Career Architecture Analysis，遵循以下必须的六段式结构。
使用JSON格式输出：

{
  "stageIdentification": {
    "stageCode": "${stageDef.code}",
    "stageLabel": "${stageLabel}",
    "stageDefinition": "${stageDefinition}",
    "stageImplication": "2-3句：这个阶段对于解读你的职业锚结果意味着什么。因为你处于这个阶段，应该如何不同地解读你的分数？"
  },
  "primaryAnchorInterpretation": {
    "coreMeaning": "核心锚的阶段化解释。不是通用定义。'${mainAnchorMeaning}'在${stageLabel}具体如何呈现？用第二人称（你）书写。",
    "stageContext": "这个锚点在你目前的职业阶段意味着什么——行为影响、决策模式和身份表达。直接对读者说话。",
    "ifAligned": "如果你目前的角色/环境支持这个锚点，在此阶段，你会体验到……",
    "ifMisaligned": "如果你目前的角色/环境与这个锚点冲突，在此阶段，你会体验到……"
  },
  "behavioralPatterns": [
    "阶段化的可观察行为模式1",
    "阶段化的可观察行为模式2",
    "阶段化的可观察行为模式3",
    "阶段化的可观察行为模式4"
  ],
  "tensionOrRiskSignals": {
    "type": "${stageKey === 'early' ? 'exploration_patterns' : stageKey === 'mid' ? 'growth_tension' : stageKey === 'senior' ? 'structural_risk' : 'architecture_analysis'}",
    "signals": [
      {
        "signal": "与阶段相关的具体张力/风险信号",
        "interpretation": "这个信号在此职业阶段意味着什么",
        "recommendation": "阶段化的回应建议"
      }
    ],
    ${stageKey === "senior" ? `"burnoutSignalPattern": "描述此锚点在职业资深期的具体倦怠信号模式",
    "earlyWarnings": ["早期预警信号1", "早期预警信号2", "早期预警信号3"],
    "derailmentPattern": "描述在此阶段此锚点下，职业偏离会如何表现"` : stageKey === "executive" ? `"decisionStyle": "此锚点如何塑造高管层面的决策风格",
    "powerOrientation": "此锚点如何影响权力使用和授权模式",
    "riskPreference": "此锚点如何塑造风险容忍度",
    "controlMode": "此锚点在控制模式中的表现",
    "shadowSide": "此锚点在身份架构层面的阴影面",
    "organizationalImpact": "当此人处于领导位置时，此锚点如何塑造组织文化"` : `"conflictExplanation": ${conflictInfo.length > 0 ? `"解释冲突锚在此职业阶段的结构性张力"` : "null"}`}
  },
  "imbalancePatterns": {
    "overExpression": "此锚点在此阶段过度表达时的后果",
    "underExpression": "此锚点在此阶段被压抑时的后果",
    "stageSpecificRisk": "只在${stageLabel}出现的特有风险模式"
  },
  "developmentRecommendations": [
    {
      "direction": "发展方向",
      "rationale": "为什么这在${stageLabel}特别重要",
      "action": "具体、可操作的步骤"
    }
  ],
  "closingNote": "专业的、非励志的结尾观察，回扣到阶段定义。2-3句。"
}

重要：每一个段落都必须是阶段化的。全程使用第二人称（你/你的）。严格禁止使用 Stage A/B/C/D 等代号，用完整的阶段名称代替。`;

    } else if (analysisType === "action_plan") {
      systemPrompt = isEnglish
        ? `You help users create stage-aware career action plans based on their career anchor constraints.

RULES:
- Focus on what to AVOID, not just what to pursue
- Be specific about trade-off scenarios
- No motivational fluff
- Ground everything in long-term constraint awareness
- All advice MUST be differentiated by career stage

${stageInstructions}
${riskAmplificationNote}${enterpriseRules}`
        : isTW
        ? `你幫助使用者基於職業錨約束創建階段化的職業行動計劃。

【語言要求 — 最高優先級】
你必須全程使用繁體中文（台灣用語）輸出。嚴格禁止出現任何簡體中文字符。
常見易錯：本質（非本质）、顯示（非显示）、價值（非价值）、發展（非发展）、認識（非认识）、環境（非环境）、結構（非结构）、長期（非长期）、實現（非实现）、決策（非决策）、處理（非处理）、組織（非组织）、經驗（非经验）。

規則：
- 重點是要避免什麼，不只是追求什麼
- 具體說明取捨場景
- 不要勵志空話
- 一切基於長期約束意識
- 所有建議必須按職業階段差異化

${stageInstructions}
${riskAmplificationNote}${enterpriseRules}`
        : `你帮助用户基于职业锚约束创建阶段化的职业行动计划。

规则：
- 重点是要避免什么，不只是追求什么
- 具体说明取舍场景
- 不要励志空话
- 一切基于长期约束意识
- 所有建议必须按职业阶段差异化

${stageInstructions}
${riskAmplificationNote}${enterpriseRules}`;

      const actionPlanProfile = isEnglish
        ? `User profile: ${workExpDescription || "Not specified"}
Career Stage: ${stageLabel}
Stage Definition: ${stageDefinition}

Assessment Results:
- Core Anchor: ${mainAnchorName} (${mainScore} points) — ${mainAnchorMeaning}
- Conflict Anchors: ${conflictInfo.length > 0 ? conflictInfo.map(conflictItem => conflictItem.pair).join(", ") : "None"}
- All scores: ${scoresWithInterpretation.map(scoreItem => `${scoreItem.name}: ${scoreItem.score}`).join(", ")}`
        : isTW
        ? `使用者背景：${workExpDescription || "未指定"}
職業階段：${stageLabel}
階段定義：${stageDefinition}

評測結果：
- 核心錨：${mainAnchorName}（${mainScore}分）— ${mainAnchorMeaning}
- 衝突錨：${conflictInfo.length > 0 ? conflictInfo.map(conflictItem => conflictItem.pair).join("、") : "無"}
- 各維度得分：${scoresWithInterpretation.map(scoreItem => `${scoreItem.name}: ${scoreItem.score}分`).join("，")}`
        : `用户背景：${workExpDescription || "未指定"}
职业阶段：${stageLabel}
阶段定义：${stageDefinition}

评测结果：
- 核心锚：${mainAnchorName}（${mainScore}分）— ${mainAnchorMeaning}
- 冲突锚：${conflictInfo.length > 0 ? conflictInfo.map(conflictItem => conflictItem.pair).join("、") : "无"}
- 各维度得分：${scoresWithInterpretation.map(scoreItem => `${scoreItem.name}: ${scoreItem.score}分`).join("，")}`;

      userPrompt = isEnglish
        ? `${actionPlanProfile}

Generate a stage-aware action plan in JSON format:

{
  "avoidanceList": [
    {
      "scenario": "Specific situation to watch out for at the ${stageLabel} stage",
      "why": "Why this would drain you at this career stage",
      "earlyWarning": "Signs that you're heading into this situation"
    }
  ],
  "tradeoffScenarios": [
    {
      "situation": "A career decision scenario typical for the ${stageLabel} stage",
      "optionA": "Choice A and its trade-off",
      "optionB": "Choice B and its trade-off",
      "guidingQuestion": "What question to ask yourself when facing this"
    }
  ],
  "validationSteps": [
    {
      "timeframe": "Next 3 months / 6 months / 1 year",
      "action": "Specific step to validate or test at this career stage",
      "purpose": "What you'll learn from this"
    }
  ],
  "redFlags": [
    "Stage-specific warning sign 1",
    "Stage-specific warning sign 2",
    "Stage-specific warning sign 3"
  ],
  "checkInQuestions": [
    "Periodic self-check question appropriate for the ${stageLabel} stage"
  ]
}`
        : isTW
        ? `${actionPlanProfile}

請生成階段化行動計劃，使用JSON格式：

{
  "avoidanceList": [
    {
      "scenario": "在${stageLabel}需要警惕的具體情境",
      "why": "為什麼這會在此階段讓你消耗",
      "earlyWarning": "即將進入這種情境的早期信號"
    }
  ],
  "tradeoffScenarios": [
    {
      "situation": "${stageLabel}典型的職業決策場景",
      "optionA": "選擇A及其代價",
      "optionB": "選擇B及其代價",
      "guidingQuestion": "面對這個選擇時要問自己的問題"
    }
  ],
  "validationSteps": [
    {
      "timeframe": "未來3個月 / 6個月 / 1年",
      "action": "在此階段具體的驗證步驟",
      "purpose": "你能從中學到什麼"
    }
  ],
  "redFlags": [
    "階段化的警示信號1",
    "階段化的警示信號2",
    "階段化的警示信號3"
  ],
  "checkInQuestions": [
    "適合${stageLabel}的定期自檢問題"
  ]
}`
        : `${actionPlanProfile}

请生成阶段化行动计划，使用JSON格式：

{
  "avoidanceList": [
    {
      "scenario": "在${stageLabel}需要警惕的具体情境",
      "why": "为什么这会在此阶段让你消耗",
      "earlyWarning": "即将进入这种情境的早期信号"
    }
  ],
  "tradeoffScenarios": [
    {
      "situation": "${stageLabel}典型的职业决策场景",
      "optionA": "选择A及其代价",
      "optionB": "选择B及其代价",
      "guidingQuestion": "面对这个选择时要问自己的问题"
    }
  ],
  "validationSteps": [
    {
      "timeframe": "未来3个月 / 6个月 / 1年",
      "action": "在此阶段具体的验证步骤",
      "purpose": "你能从中学到什么"
    }
  ],
  "redFlags": [
    "阶段化的警示信号1",
    "阶段化的警示信号2",
    "阶段化的警示信号3"
  ],
  "checkInQuestions": [
    "适合${stageLabel}的定期自检问题"
  ]
}`;

    } else if (analysisType === "dual_anchor") {
      // Dual-anchor structural interpretation
      const dualAnchors = (result as any).dualAnchors as { code1: string; score1: number; code2: string; score2: number } | undefined;
      if (!dualAnchors) throw new Error("dualAnchors field required for dual_anchor analysis");

      const anchor1Name = dimNames[dualAnchors.code1] || dualAnchors.code1;
      const anchor2Name = dimNames[dualAnchors.code2] || dualAnchors.code2;
      const anchor1Meaning = anchorMeanings[dualAnchors.code1] || "";
      const anchor2Meaning = anchorMeanings[dualAnchors.code2] || "";

      systemPrompt = isEnglish
        ? `You are a career anchor specialist producing a dual-anchor structural interpretation. Analyze how two dominant anchors interact, create synergy or tension, and shape career decision patterns.

OUTPUT STYLE:
- Professional, analytical report tone — like a structured career assessment written by a senior expert
- Development-oriented, not labeling
- No clichés or motivational fluff
- ALWAYS use second person (you/your)
- Write continuous prose paragraphs, NOT bullet points or numbered lists

${stageInstructions}${enterpriseRules}`
        : isTW
        ? `你是一位職業錨專家，正在產出雙錨結構解讀。分析兩個主導錨點如何互動、產生協同或張力，以及如何塑造職涯決策模式。

【語言要求 — 最高優先級】全程使用繁體中文（台灣用語）。嚴格禁止簡體中文。

輸出風格：
- 專業、分析性的報告語氣，像一份結構化的職業評估報告
- 發展導向，不標籤化
- 不雞湯，不空洞
- 全程使用第二人稱（你/你的）
- 用連續的段落敘述，不要用條列式或編號清單

${stageInstructions}${enterpriseRules}`
        : `你是一位职业锚专家，正在产出双锚结构解读。分析两个主导锚点如何互动、产生协同或张力，以及如何塑造职涯决策模式。

输出风格：
- 专业、分析性的报告语气，像一份结构化的职业评估报告
- 发展导向，不标签化
- 不鸡汤，不空洞
- 全程使用第二人称（你/你的）
- 用连续的段落叙述，不要用条列式或编号清单

${stageInstructions}${enterpriseRules}`;

      userPrompt = isEnglish
        ? `Career Stage: ${stageLabel}
Stage Definition: ${stageDefinition}

Dual-Anchor Combination:
- Anchor 1: ${anchor1Name} (${dualAnchors.score1} points) — core meaning: ${anchor1Meaning}
- Anchor 2: ${anchor2Name} (${dualAnchors.score2} points) — core meaning: ${anchor2Meaning}

All dimension scores: ${scoresWithInterpretation.map(s => `${s.name}: ${s.score}`).join(", ")}

Generate a dual-anchor structural interpretation in JSON:
{
  "dualAnchorInterpretation": "A comprehensive 3-4 paragraph interpretation covering: (1) How these two anchors interact and create a unique career decision pattern at the ${stageLabel} stage; (2) The synergy - what makes this combination powerful; (3) The tension points - where these two anchors may pull in different directions; (4) Practical implications for career choices at this stage. Write in continuous prose, not bullets."
}`
        : isTW
        ? `職業階段：${stageLabel}\n階段定義：${stageDefinition}\n\n雙錨組合：\n- 錨點1：${anchor1Name}（${dualAnchors.score1}分）— 核心含義：${anchor1Meaning}\n- 錨點2：${anchor2Name}（${dualAnchors.score2}分）— 核心含義：${anchor2Meaning}\n\n各維度得分：${scoresWithInterpretation.map(s => `${s.name}: ${s.score}分`).join("，")}\n\n請產出雙錨結構解讀，JSON格式：\n{\n  "dualAnchorInterpretation": "3-4段綜合解讀，涵蓋：(1) 這兩個錨點在${stageLabel}如何互動，形成獨特的職涯決策模式；(2) 協同效應——這個組合的獨特優勢；(3) 張力點——這兩個錨點可能產生的方向性拉扯；(4) 對此階段職涯選擇的實際意義。用連續段落書寫，不要條列。"\n}`
        : `职业阶段：${stageLabel}\n阶段定义：${stageDefinition}\n\n双锚组合：\n- 锚点1：${anchor1Name}（${dualAnchors.score1}分）— 核心含义：${anchor1Meaning}\n- 锚点2：${anchor2Name}（${dualAnchors.score2}分）— 核心含义：${anchor2Meaning}\n\n各维度得分：${scoresWithInterpretation.map(s => `${s.name}: ${s.score}分`).join("，")}\n\n请产出双锚结构解读，JSON格式：\n{\n  "dualAnchorInterpretation": "3-4段综合解读，涵盖：(1) 这两个锚点在${stageLabel}如何互动，形成独特的职涯决策模式；(2) 协同效应——这个组合的独特优势；(3) 张力点——这两个锚点可能产生的方向性拉扯；(4) 对此阶段职涯选择的实际意义。用连续段落书写，不要条列。"\n}`;

    } else if (analysisType === "tri_anchor") {
      // Triple-anchor archetype interpretation
      const triAnchors = (result as any).triAnchors as { code1: string; score1: number; code2: string; score2: number; code3: string; score3: number } | undefined;
      if (!triAnchors) throw new Error("triAnchors field required for tri_anchor analysis");

      const a1Name = dimNames[triAnchors.code1] || triAnchors.code1;
      const a2Name = dimNames[triAnchors.code2] || triAnchors.code2;
      const a3Name = dimNames[triAnchors.code3] || triAnchors.code3;
      const a1Meaning = anchorMeanings[triAnchors.code1] || "";
      const a2Meaning = anchorMeanings[triAnchors.code2] || "";
      const a3Meaning = anchorMeanings[triAnchors.code3] || "";

      systemPrompt = isEnglish
        ? `You are a career anchor specialist producing a triple-anchor archetype interpretation. Analyze how three top anchors form an archetype pattern that defines career identity and decision architecture.

OUTPUT STYLE:
- Professional, analytical report tone — like a structured career assessment written by a senior expert
- Development-oriented, not labeling
- No clichés or motivational fluff
- ALWAYS use second person (you/your)
- Write continuous prose paragraphs, NOT bullet points or numbered lists

${stageInstructions}${enterpriseRules}`
        : isTW
        ? `你是一位職業錨專家，正在產出三錨結構解讀。分析三個頂部錨點如何形成一個原型模式，定義職涯身份和決策架構。

【語言要求 — 最高優先級】全程使用繁體中文（台灣用語）。嚴格禁止簡體中文。

輸出風格：
- 專業、分析性的報告語氣，像一份結構化的職業評估報告
- 發展導向，不標籤化
- 不雞湯，不空洞
- 全程使用第二人稱（你/你的）
- 用連續的段落敘述，不要用條列式或編號清單

${stageInstructions}${enterpriseRules}`
        : `你是一位职业锚专家，正在产出三锚结构解读。分析三个顶部锚点如何形成一个原型模式，定义职涯身份和决策架构。

输出风格：
- 专业、分析性的报告语气，像一份结构化的职业评估报告
- 发展导向，不标签化
- 不鸡汤，不空洞
- 全程使用第二人称（你/你的）
- 用连续的段落叙述，不要用条列式或编号清单

${stageInstructions}${enterpriseRules}`;

      userPrompt = isEnglish
        ? `Career Stage: ${stageLabel}\nStage Definition: ${stageDefinition}\n\nTriple-Anchor Combination:\n- Anchor 1: ${a1Name} (${triAnchors.score1} points) — ${a1Meaning}\n- Anchor 2: ${a2Name} (${triAnchors.score2} points) — ${a2Meaning}\n- Anchor 3: ${a3Name} (${triAnchors.score3} points) — ${a3Meaning}\n\nAll dimension scores: ${scoresWithInterpretation.map(s => `${s.name}: ${s.score}`).join(", ")}\n\nGenerate a triple-anchor archetype interpretation in JSON:\n{\n  "archetypeName": "A 2-4 word name for this three-anchor combination archetype (creative, not generic)",\n  "triAnchorInterpretation": "A comprehensive 3-5 paragraph interpretation covering: (1) What archetype pattern these three anchors create together — the overarching career identity; (2) How they form a decision-making architecture at the ${stageLabel} stage; (3) The unique strengths of this triple combination; (4) Internal tensions and which anchor pairs within the trio may conflict; (5) What career environments and roles best serve this archetype. Write in continuous prose."\n}`
        : isTW
        ? `職業階段：${stageLabel}\n階段定義：${stageDefinition}\n\n三錨組合：\n- 錨點1：${a1Name}（${triAnchors.score1}分）— ${a1Meaning}\n- 錨點2：${a2Name}（${triAnchors.score2}分）— ${a2Meaning}\n- 錨點3：${a3Name}（${triAnchors.score3}分）— ${a3Meaning}\n\n各維度得分：${scoresWithInterpretation.map(s => `${s.name}: ${s.score}分`).join("，")}\n\n請產出三錨結構解讀，JSON格式：\n{\n  "archetypeName": "此三錨組合原型的2-4字命名（創意命名，非通用）",\n  "triAnchorInterpretation": "3-5段綜合解讀，涵蓋：(1) 這三個錨點共同構成的原型模式——整體職涯身份；(2) 在${stageLabel}如何形成決策架構；(3) 此三元組合的獨特優勢；(4) 內部張力——三者之間哪些對可能衝突；(5) 最適合此原型的職涯環境和角色。用連續段落書寫。"\n}`
        : `职业阶段：${stageLabel}\n阶段定义：${stageDefinition}\n\n三锚组合：\n- 锚点1：${a1Name}（${triAnchors.score1}分）— ${a1Meaning}\n- 锚点2：${a2Name}（${triAnchors.score2}分）— ${a2Meaning}\n- 锚点3：${a3Name}（${triAnchors.score3}分）— ${a3Meaning}\n\n各维度得分：${scoresWithInterpretation.map(s => `${s.name}: ${s.score}分`).join("，")}\n\n请产出三锚结构解读，JSON格式：\n{\n  "archetypeName": "此三锚组合原型的2-4字命名（创意命名，非通用）",\n  "triAnchorInterpretation": "3-5段综合解读，涵盖：(1) 这三个锚点共同构成的原型模式——整体职涯身份；(2) 在${stageLabel}如何形成决策架构；(3) 此三元组合的独特优势；(4) 内部张力——三者之间哪些对可能冲突；(5) 最适合此原型的职涯环境和角色。用连续段落书写。"\n}`;

    } else {
      // career_path — legacy support
      systemPrompt = isEnglish ? "You are a career consultant." : "你是一位职业咨询师。";
      userPrompt = `Generate career path suggestions for: ${mainAnchorName}`;
    }

    logStep("Calling AI for analysis", { stage: stageKey, stageCode: stageDef.code });

    const response = await fetch("https://gateway.superun.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("AI API error", { status: response.status, error: errorText });
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "";

    // Post-process: convert any remaining Simplified Chinese to Traditional for zh-TW
    if (isTW) {
      aiResponse = convertToTraditional(aiResponse);
      logStep("Applied SC→TC conversion for zh-TW output");
    }

    logStep("AI response received", { length: aiResponse.length });

    let analysisResult;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logStep("Failed to parse AI response, returning raw", { error: String(parseError) });
      analysisResult = { rawContent: aiResponse };
    }

    return new Response(JSON.stringify({ analysis: analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
