import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ideal-card-analysis] ${step}${detailsStr}`);
};

// Simplified → Traditional Chinese character mapping (same as personalized-analysis)
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
  "结":"結","给":"給","绝":"絕","统":"統","丝":"絲","纬":"緯",
  "综":"綜","练":"練","终":"終","绘":"繪","络":"絡",
  "缺":"缺","罗":"羅","灵":"靈","龄":"齡","协":"協",
  "离":"離","响":"響","属":"屬","复":"復","杂":"雜","夺":"奪","奋":"奮",
  "头":"頭","颖":"穎","频":"頻","顾":"顧","顿":"頓","预":"預",
  "额":"額","馈":"饋","饱":"飽","饥":"飢",
  "满":"滿","渐":"漸","潜":"潛","冲":"衝","决":"決","设":"設",
  "热":"熱","烧":"燒","灯":"燈","营":"營","获":"獲","带":"帶",
  "积":"積","种":"種","称":"稱","移":"移","競":"競","争":"爭",
  "优":"優","华":"華","严":"嚴","亲":"親","执":"執","抢":"搶",
  "护":"護","担":"擔","拥":"擁","挡":"擋","择":"擇","损":"損",
  "换":"換","据":"據","搜":"搜","摆":"擺","斗":"鬥","无":"無",
  "旧":"舊","晓":"曉","暂":"暫","条":"條","杨":"楊","档":"檔",
  "栏":"欄","检":"檢","楼":"樓","权":"權","残":"殘","毕":"畢",
  "气":"氣","沟":"溝","沿":"沿","注":"注","济":"濟","浏":"瀏",
  "涨":"漲","深":"深","混":"混","渡":"渡","温":"溫","游":"遊",
  "港":"港","源":"源","滞":"滯","演":"演","灭":"滅","灾":"災",
  "灵":"靈","烦":"煩","焦":"焦","片":"片","牺":"犧","猜":"猜",
  "犹":"猶","独":"獨","玛":"瑪","环":"環","现":"現","理":"理",
  "甚":"甚","画":"畫","异":"異","疲":"疲","痛":"痛","盖":"蓋",
  "监":"監","盘":"盤","目":"目","直":"直","着":"著","矛":"矛",
  "碍":"礙","础":"礎","禁":"禁","离":"離","私":"私","程":"程",
  "稳":"穩","穷":"窮","窝":"窩","窥":"窺","章":"章","端":"端",
  "笔":"筆","符":"符","策":"策","简":"簡","算":"算","管":"管",
  "箱":"箱","粮":"糧","紧":"緊","纠":"糾","纵":"縱","纷":"紛",
  "绩":"績","缓":"緩","编":"編","缘":"緣","网":"網","置":"置",
  "署":"署","群":"群","翻":"翻","耗":"耗","职":"職","背":"背",
  "胜":"勝","能":"能","脱":"脫","脸":"臉","致":"致","舍":"捨",
  "艰":"艱","艺":"藝","节":"節","营":"營","虑":"慮","融":"融",
  "蜕":"蛻","补":"補","裂":"裂","视":"視","览":"覽","触":"觸",
  "詹":"詹","询":"詢","详":"詳","误":"誤","课":"課","谈":"談",
  "谢":"謝","谱":"譜","货":"貨","贡":"貢","财":"財","贫":"貧",
  "购":"購","赖":"賴","赛":"賽","趋":"趨","跨":"跨","跳":"跳",
  "踪":"蹤","踏":"踏","转":"轉","轨":"軌","载":"載","辅":"輔",
  "输":"輸","辨":"辨","辩":"辯","达":"達","迁":"遷","迟":"遲",
  "适":"適","逻":"邏","遗":"遺","释":"釋","量":"量","钻":"鑽",
  "铺":"鋪","链":"鏈","销":"銷","锐":"銳","锋":"鋒","镇":"鎮",
  "闭":"閉","闲":"閒","闻":"聞","阅":"閱","阵":"陣","阻":"阻",
  "陷":"陷","随":"隨","隐":"隱","障":"障","雇":"僱","难":"難",
  "雾":"霧","靠":"靠","面":"面","顶":"頂","顺":"順","颗":"顆",
  "馆":"館","驱":"驅","骤":"驟","髓":"髓","鲜":"鮮","龙":"龍"
};

function convertToTraditional(text: string): string {
  let result = "";
  for (const char of text) {
    result += SC_TO_TC[char] || char;
  }
  return result;
}

// Category definitions for AI context
const CATEGORY_DEFINITIONS: Record<string, Record<string, { label: string; description: string }>> = {
  "zh-CN": {
    intrinsic: { label: "内在价值", description: "追求内心的满足感、意义感和自我实现" },
    interpersonal: { label: "人际关系", description: "重视人际关系、社会连接和情感归属" },
    lifestyle: { label: "生活方式", description: "注重生活品质、身心健康和生活节奏" },
    material: { label: "物质条件", description: "关注物质保障、经济独立和外在成就" },
  },
  "zh-TW": {
    intrinsic: { label: "內在價值", description: "追求內心的滿足感、意義感和自我實現" },
    interpersonal: { label: "人際關係", description: "重視人際關係、社會連接和情感歸屬" },
    lifestyle: { label: "生活方式", description: "注重生活品質、身心健康和生活節奏" },
    material: { label: "物質條件", description: "關注物質保障、經濟獨立和外在成就" },
  },
  en: {
    intrinsic: { label: "Intrinsic Values", description: "Seeking inner fulfillment, meaning, and self-actualization" },
    interpersonal: { label: "Interpersonal Relationships", description: "Valuing relationships, social connection, and emotional belonging" },
    lifestyle: { label: "Lifestyle", description: "Focusing on quality of life, well-being, and life rhythm" },
    material: { label: "Material Conditions", description: "Focusing on material security, financial independence, and external achievement" },
  },
};

// Stage definitions
const STAGE_DEFINITIONS: Record<string, Record<string, { label: string; description: string; instruction: string }>> = {
  "zh-CN": {
    early: {
      label: "职业早期（0-5年）",
      description: "处于探索与实验阶段，价值观仍在形成中",
      instruction: "解读时强调探索性：当前排序反映的是初步偏好和能量来源方向，未必是最终定型。用好奇和鼓励探索的语调，不宜做过于确定的结构化判断。"
    },
    mid: {
      label: "职业中前期（6-10年）",
      description: "方向逐渐清晰，能力已被验证，正在巩固核心方向",
      instruction: "解读时强调方向巩固：排序结构已有稳定趋势，可以做较为明确的结构化解读。关注价值观与实际选择的一致性，提供方向性测试建议。"
    },
    senior: {
      label: "职业中后期（10年+）",
      description: "身份趋于稳定，关注意义整合和长期可持续性",
      instruction: "解读时强调结构性整合：排序反映了经过验证的深层价值结构。关注是否存在长期压抑或忽视的价值需求，提供整合和平衡建议。提示错配可能表现为疲劳而非好奇。"
    },
  },
  "zh-TW": {
    early: {
      label: "職業早期（0-5年）",
      description: "處於探索與實驗階段，價值觀仍在形成中",
      instruction: "解讀時強調探索性：當前排序反映的是初步偏好和能量來源方向，未必是最終定型。用好奇和鼓勵探索的語調，不宜做過於確定的結構化判斷。"
    },
    mid: {
      label: "職業中前期（6-10年）",
      description: "方向逐漸清晰，能力已被驗證，正在鞏固核心方向",
      instruction: "解讀時強調方向鞏固：排序結構已有穩定趨勢，可以做較為明確的結構化解讀。關注價值觀與實際選擇的一致性，提供方向性測試建議。"
    },
    senior: {
      label: "職業中後期（10年+）",
      description: "身份趨於穩定，關注意義整合和長期可持續性",
      instruction: "解讀時強調結構性整合：排序反映了經過驗證的深層價值結構。關注是否存在長期壓抑或忽視的價值需求，提供整合和平衡建議。提示錯配可能表現為疲勞而非好奇。"
    },
  },
  en: {
    early: {
      label: "Early Career (0-5 years)",
      description: "Exploration and experimentation phase, values still forming",
      instruction: "Emphasize exploration: current ranking reflects initial preferences and energy sources, not necessarily final structure. Use a curious, explorative tone. Avoid overly definitive structural judgments."
    },
    mid: {
      label: "Mid-Early Career (6-10 years)",
      description: "Direction becoming clearer, competence validated, consolidating core direction",
      instruction: "Emphasize direction consolidation: ranking structure shows stabilizing trends, more definitive structural interpretation is appropriate. Focus on consistency between values and actual choices, provide directional testing suggestions."
    },
    senior: {
      label: "Mid-Late Career (10+ years)",
      description: "Identity stabilizing, focused on meaning integration and long-term sustainability",
      instruction: "Emphasize structural integration: ranking reflects verified deep value structures. Watch for long-term suppressed or neglected value needs, provide integration and balance advice. Note that misalignment may manifest as fatigue rather than curiosity."
    },
  },
};

interface CardInput {
  rank: number;
  card_name: string;
  card_name_en: string;
  category: string;
}

interface QuadrantContent {
  external: string;
  internal: string;
  career: string;
  relationship: string;
}

interface CardDescriptionInput {
  rank: number;
  card_name: string;
  category: string;
  quadrant?: QuadrantContent;
}

/* ── Card Description Prompt Builders ── */

function buildCardDescriptionSystemPrompt(language: string): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";

  if (isEn) {
    return `You are a neutral content describer for the SCPC Ideal Life Card assessment system.

STRICT RULES — MANDATORY:
- Do NOT define personality types
- Do NOT make psychological diagnoses
- Do NOT predict or assert future behavior
- Do NOT treat results as stable personality traits
- Do NOT use evaluative language (good/bad/strong/weak)
- Do NOT infer motivations or intentions
- Do NOT make causal inferences
- Do NOT make personality judgments or personality inferences

YOU MAY ONLY: Describe what the card content presents.

Good examples:
- "This card presents content emphasizing seeking stability and security in external environments, with a career attitude favoring structured development paths."
- "These descriptions illustrate certain directions that individuals may attend to when facing choices in career and life contexts."
- "In career situations, this type of value may sometimes serve as a reference point for decision-making considerations."

Bad examples (STRICTLY FORBIDDEN):
- "This shows you are a person who seeks security"
- "Your personality traits are..."
- "You tend to be..."

For each card, write a brief neutral description (80-120 characters) based on its four quadrant contents.
Output ONLY a valid JSON array: [{"rank": 1, "description": "..."}, ...]`;
  }

  const twPrefix = isTW ? "你必須全程使用繁體中文（台灣用語）輸出。嚴格禁止出現任何簡體中文字符。\n\n" : "";

  return `${twPrefix}你是 SCPC 理想人生卡評估系統的中性卡片內容描述者。

【鐵律 — 必須嚴格遵守】
- 禁止定義人格類型
- 禁止進行心理診斷
- 禁止預測或斷言未來行為
- 禁止將測評結果視為穩定人格特質
- 禁止使用評價性語言（好/壞/強/弱）
- 禁止推論動機或意圖
- 禁止因果推論
- 禁止人格判斷與人格推論

【你只能做】描述卡片內容所呈現的方向。

正確示例：
- 「這張卡片呈現的內容強調在外部環境中尋求穩定與安全感，在職業態度上傾向有序的發展路徑。」
- 「這些描述展示了一些人在面對選擇時可能關注的方向。」
- 「在職業情境中，這類價值有時會成為思考決策的參考因素。」

錯誤示例（嚴禁）：
- 「說明你是一個追求安全感的人」
- 「你的性格特質是……」
- 「你傾向於……」

為每張卡片根據其四象限內容撰寫一段簡短的中性描述（80-120字）。
僅輸出有效 JSON 陣列：[{"rank": 1, "description": "..."}, ...]`;
}

function buildCardDescriptionUserPrompt(
  cards: CardDescriptionInput[],
  language: string,
): string {
  const isEn = language === "en";

  const cardTexts = cards.map((card) => {
    const quadrantLines = card.quadrant
      ? [
          card.quadrant.external ? `  ${isEn ? "External" : "外在環境"}: ${card.quadrant.external}` : "",
          card.quadrant.internal ? `  ${isEn ? "Internal" : "內在思維"}: ${card.quadrant.internal}` : "",
          card.quadrant.career ? `  ${isEn ? "Career" : "職業態度"}: ${card.quadrant.career}` : "",
          card.quadrant.relationship ? `  ${isEn ? "Relationship" : "關係行為"}: ${card.quadrant.relationship}` : "",
        ].filter(Boolean).join("\n")
      : isEn ? "  No quadrant content available" : "  無象限內容";

    return `${isEn ? "Card" : "卡片"} #${card.rank}: ${card.card_name} (${card.category})\n${quadrantLines}`;
  }).join("\n\n");

  return `${isEn ? "Cards" : "卡片"}:\n\n${cardTexts}\n\n${isEn ? "Generate one neutral description (80-120 chars) per card. Return JSON array only." : "為每張卡片生成一段中性描述（80-120字）。僅返回 JSON 陣列。"}`;
}

function buildSystemPrompt(language: string, userStage: string): string {
  const isEn = language === "en";
  const isTW = language === "zh-TW";
  const langKey = isTW ? "zh-TW" : isEn ? "en" : "zh-CN";
  const stageInfo = STAGE_DEFINITIONS[langKey]?.[userStage] || STAGE_DEFINITIONS["zh-CN"][userStage] || STAGE_DEFINITIONS["zh-CN"]["mid"];
  const catDefs = CATEGORY_DEFINITIONS[langKey] || CATEGORY_DEFINITIONS["zh-CN"];

  if (isEn) {
    return `You are an SCPC Ideal Life Card specialist analyst. Your task is to produce a 10-module deep value structure analysis report based on the user's ranking of their top 10 ideal life cards.

ANALYSIS BASIS — MANDATORY:
- Analyze ONLY based on the ranking structure (which cards are in top 3, middle positions, lower positions)
- The ranking position encodes priority weight: Rank 1 = highest priority anchor, Rank 10 = lowest priority among selected
- Analyze dimensional concentration, absence, and tension patterns
- DO NOT use MBTI, Big Five, or any external personality framework
- DO NOT invent theories or terminology
- DO NOT assume the user's specific life experiences

LANGUAGE RULES — MANDATORY:
- Professional, structured analytical language
- NO psychological diagnosis language
- NO exaggerated encouragement or flattery
- NO empty clichés (e.g., "believe in yourself", "the future is bright")
- NO personality labeling or typing
- NO absolute judgments (e.g., "you are definitely...", "you will certainly...")
- Growth-oriented rational tone throughout
- ALWAYS use second person (you/your)
- NEVER start with greetings — begin directly with analysis

FOUR VALUE DIMENSIONS:
${Object.entries(catDefs).map(([key, val]) => `- ${val.label}: ${val.description}`).join("\n")}

CAREER STAGE CONTEXT:
Stage: ${stageInfo.label}
Description: ${stageInfo.description}
Interpretation Instruction: ${stageInfo.instruction}

OUTPUT FORMAT — MANDATORY:
Return ONLY valid JSON with exactly this structure (no markdown, no code fences):
{
  "module1_core_overview": {
    "full_text": "300-500 words comprehensive overview of the user's core value structure, value personality type, structural characteristics, and inner priority pattern"
  },
  "module2_top3_deep": [
    {
      "rank": 1,
      "card_name": "exact card name",
      "essence": "the deep essence of why this value matters to the user",
      "why_ranked_here": "why this card is at this specific ranking position in the context of the full 10-card structure",
      "decision_impact": "how this value concretely influences the user's life and career decisions",
      "if_ignored": "what consequences arise if this value is chronically suppressed or unmet"
    }
  ],
  "module3_distribution": {
    "concentrated_dimensions": ["dimension names where cards cluster"],
    "absent_dimensions": ["dimension names with zero or minimal representation"],
    "concentration_level": "high/moderate/balanced",
    "analysis": "structural analysis of what the distribution pattern reveals about value orientation"
  },
  "module4_drive_pattern": {
    "drive_type": "growth/security/influence/creation/relationship — primary inner drive type",
    "description": "detailed description of the inner motivation pattern derived from the ranking structure"
  },
  "module5_tension": {
    "conflicts_exist": true/false,
    "conflict_pairs": ["value A vs value B — explanation"],
    "manifestation": "how these tensions concretely manifest in daily decisions",
    "integration_path": "mature approach to integrating rather than resolving these tensions"
  },
  "module6_stage_fit": {
    "stage": "current stage label",
    "fit_level": "high/moderate/low — how well top values fit the current career stage",
    "analysis": "detailed analysis of stage-value fit",
    "early_anxiety": false,
    "delayed_development": false
  },
  "module7_decade_forecast": {
    "career_trajectory": "likely career structure evolution based on value priorities over the next decade",
    "turning_points": ["key decision points or transition moments to anticipate"]
  },
  "module8_development": {
    "strengthen_core": "how to actively support and strengthen the top 3 values",
    "avoid_imbalance": "what imbalance risks to watch for and how to prevent them",
    "integrate_conflicts": "practical approaches to integrating conflicting value needs"
  },
  "module9_risk_warnings": [
    {
      "risk_type": "risk category name",
      "description": "specific risk description with observable warning signs"
    }
  ],
  "module10_actions": [
    {
      "action": "specific, immediately executable action step",
      "rationale": "why this action matters — linked to top 3 card values",
      "verification": "how to verify this action is working — observable outcome"
    }
  ]
}

CRITICAL: module2_top3_deep MUST have exactly 3 items (rank 1, 2, 3). Each item should be 250-400 words. module10_actions should have 3-5 items. Every piece of analysis must reference specific cards from the ranking.`;
  }

  // Chinese prompt (zh-CN base, zh-TW will use SC→TC conversion)
  const twPrefix = isTW ? `【語言要求 — 最高優先級】
你必須全程使用繁體中文（台灣用語）輸出。嚴格禁止出現任何簡體中文字符。

` : "";

  return `${twPrefix}你是 SCPC 理想人生卡專業解讀師。你的任務是基於用戶排出的 10 張理想人生卡的排序結構，產出一份 10 模組的深度價值結構分析報告。

【分析基礎 — 最高優先級】
- 僅基於排序結構進行分析（哪些卡在前三、中間位置、後段位置）
- 排序位置編碼了優先級權重：第1名 = 最高優先級錨點，第10名 = 所選中最低優先級
- 分析維度集中度、缺失維度、張力模式
- 嚴禁使用 MBTI、大五人格或任何外部人格模型
- 嚴禁發明理論或術語
- 嚴禁假設用戶的具體生活經歷

【語言規則 — 最高優先級】
- 使用專業、結構化的分析語言
- 禁止心理診斷用語
- 禁止誇張鼓勵或恭維
- 禁止空洞套話（如「相信自己」「未來可期」「你很棒」）
- 禁止人格標籤化或類型化
- 禁止絕對性判斷（如「你一定是…」「你肯定會…」）
- 使用成長導向的理性語調
- 全程使用第二人稱（你/你的）
- 嚴禁以問候語開頭——直接從分析內容開始

【四大價值維度定義】
${Object.entries(catDefs).map(([, val]) => `- ${val.label}：${val.description}`).join("\n")}

【職業階段背景】
階段：${stageInfo.label}
定義：${stageInfo.description}
解讀指導：${stageInfo.instruction}

【輸出格式 — 最高優先級】
僅返回有效 JSON（不要 markdown、不要代碼圍欄），結構如下：
{
  "module1_core_overview": {
    "full_text": "300-500字的核心價值結構總覽：包含用戶的價值人格特徵、結構類型（集中型/分散型/雙核型等）、內在優先級模式。要具體、有洞察力，避免泛泛而談。"
  },
  "module2_top3_deep": [
    {
      "rank": 1,
      "card_name": "卡片名稱",
      "essence": "這張卡片對用戶意味著什麼——深層本質",
      "why_ranked_here": "為什麼這張卡在這個排序位置——在整個10卡結構中的邏輯",
      "decision_impact": "這個價值如何具體影響用戶的人生和職涯決策",
      "if_ignored": "如果這個價值長期被壓抑或未被滿足，會產生什麼後果"
    }
  ],
  "module3_distribution": {
    "concentrated_dimensions": ["卡片集中的維度名稱"],
    "absent_dimensions": ["零或極少代表的維度名稱"],
    "concentration_level": "high/moderate/balanced",
    "analysis": "分佈模式的結構性分析——揭示了什麼樣的價值取向"
  },
  "module4_drive_pattern": {
    "drive_type": "成長型/安全型/影響型/創造型/關係型——主要內在驅動類型",
    "description": "從排序結構推導出的內在動力模式的詳細描述"
  },
  "module5_tension": {
    "conflicts_exist": true或false,
    "conflict_pairs": ["價值A vs 價值B — 衝突說明"],
    "manifestation": "這些張力如何在日常決策中具體表現",
    "integration_path": "成熟的整合路徑——不是解決衝突而是整合張力"
  },
  "module6_stage_fit": {
    "stage": "當前階段名稱",
    "fit_level": "high/moderate/low——前三價值與當前階段的適配度",
    "analysis": "詳細的階段-價值適配分析",
    "early_anxiety": false,
    "delayed_development": false
  },
  "module7_decade_forecast": {
    "career_trajectory": "基於價值優先級預測的未來十年職涯結構演變",
    "turning_points": ["預期的關鍵決策點或轉折時刻"]
  },
  "module8_development": {
    "strengthen_core": "如何主動支持和強化前三價值",
    "avoid_imbalance": "需要警惕的失衡風險及預防方法",
    "integrate_conflicts": "整合衝突性價值需求的實際方法"
  },
  "module9_risk_warnings": [
    {
      "risk_type": "風險類別名稱（如過度集中風險、理想主義疲勞、自我消耗、決策搖擺等）",
      "description": "具體的風險描述，包含可觀察的預警信號"
    }
  ],
  "module10_actions": [
    {
      "action": "具體的、可立即執行的行動步驟",
      "rationale": "為什麼這個行動重要——連結到前三張卡片的價值",
      "verification": "如何驗證這個行動是否有效——可觀察的結果"
    }
  ]
}

重要：module2_top3_deep 必須恰好有 3 項（排名 1、2、3）。每項 250-400 字。module10_actions 應有 3-5 項。每一段分析都必須引用排序中的具體卡片。`;
}

function buildUserPrompt(
  cards: CardInput[],
  userStage: string,
  age: string | number | null,
  optionalNotes: string | null,
  language: string,
  quadrantContents?: Record<string, QuadrantContent>,
): string {
  const isEn = language === "en";
  const langKey = language === "zh-TW" ? "zh-TW" : language === "en" ? "en" : "zh-CN";
  const catDefs = CATEGORY_DEFINITIONS[langKey] || CATEGORY_DEFINITIONS["zh-CN"];

  // Build card ranking text
  const cardListText = cards.map(card => {
    const catLabel = catDefs[card.category]?.label || card.category;
    const cardName = isEn ? card.card_name_en : card.card_name;
    return `  第${card.rank}名：${cardName}（${catLabel}）`;
  }).join("\n");

  // Category distribution summary
  const distribution: Record<string, number> = {};
  cards.forEach(card => {
    const catLabel = catDefs[card.category]?.label || card.category;
    distribution[catLabel] = (distribution[catLabel] || 0) + 1;
  });
  const distText = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => `${cat}: ${count}張`)
    .join("、");

  // Find absent categories
  const presentCategories = new Set(cards.map(c => c.category));
  const allCategories = ["intrinsic", "interpersonal", "lifestyle", "material"];
  const absentCategories = allCategories
    .filter(cat => !presentCategories.has(cat))
    .map(cat => catDefs[cat]?.label || cat);

  const stageInfo = STAGE_DEFINITIONS[langKey]?.[userStage] || STAGE_DEFINITIONS["zh-CN"][userStage] || STAGE_DEFINITIONS["zh-CN"]["mid"];

  if (isEn) {
    let enPrompt = `USER'S IDEAL LIFE CARD RANKING (Top 10):
${cards.map(card => `  #${card.rank}: ${card.card_name_en} (${catDefs[card.category]?.label || card.category})`).join("\n")}

CATEGORY DISTRIBUTION: ${Object.entries(distribution).map(([cat, count]) => `${cat}: ${count} cards`).join(", ")}
${absentCategories.length > 0 ? `ABSENT CATEGORIES: ${absentCategories.join(", ")}` : "ALL CATEGORIES REPRESENTED"}

USER PROFILE:
- Career Stage: ${stageInfo.label}
${age ? `- Age: ${age}` : "- Age: Not specified"}
${optionalNotes ? `- Additional Notes: ${optionalNotes}` : ""}

Please generate the complete 10-module Ideal Life Card deep interpretation report in the JSON format specified above. Every module must reference specific cards from the ranking.`;

    if (quadrantContents && Object.keys(quadrantContents).length > 0) {
      const qCtx = Object.entries(quadrantContents)
        .map(([cardName, c]) => {
          const parts = [];
          if (c.external) parts.push(`  External Worldview: ${c.external}`);
          if (c.internal) parts.push(`  Inner Beliefs: ${c.internal}`);
          if (c.career) parts.push(`  Career Orientation: ${c.career}`);
          if (c.relationship) parts.push(`  Relationship Pattern: ${c.relationship}`);
          return `[${cardName}]\n${parts.join("\n")}`;
        }).join("\n\n");
      enPrompt += `\n\n--- QUADRANT CONTENT (Professional editorial content — use as foundational reference) ---\n\n${qCtx}\n\nIMPORTANT: The above quadrant content is professionally curated. Your analysis MUST reference and build upon this content rather than inventing interpretations from scratch.`;
    }
    return enPrompt;
  }

  let zhPrompt = `用戶的理想人生卡排序（前10名）：
${cardListText}

維度分佈：${distText}
${absentCategories.length > 0 ? `缺失維度：${absentCategories.join("、")}` : "四個維度均有覆蓋"}

用戶背景：
- 職業階段：${stageInfo.label}
${age ? `- 年齡：${age}歲` : "- 年齡：未指定"}
${optionalNotes ? `- 補充說明：${optionalNotes}` : ""}

請生成完整的 10 模組理想人生卡深度解讀報告，嚴格按照上述 JSON 格式輸出。每個模組的分析都必須引用排序中的具體卡片。`;

  if (quadrantContents && Object.keys(quadrantContents).length > 0) {
    const qCtx = Object.entries(quadrantContents)
      .map(([cardName, c]) => {
        const parts = [];
        if (c.external) parts.push(`  外在世界觀: ${c.external}`);
        if (c.internal) parts.push(`  內在信念: ${c.internal}`);
        if (c.career) parts.push(`  職涯取向: ${c.career}`);
        if (c.relationship) parts.push(`  關係模式: ${c.relationship}`);
        return `【${cardName}】\n${parts.join("\n")}`;
      }).join("\n\n");
    zhPrompt += `\n\n--- 四象限內容（專業編輯審定內容，請以此為基礎進行深度解讀，不要自行發揮替代）---\n\n${qCtx}\n\n重要：以上四象限內容為專業策展人審定。你在 module2_top3_deep 及其他模組的分析必須引用並建立在此內容基礎上，而非憑空發掮。`;
  }
  return zhPrompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();

    // ═══ Card Descriptions Mode ═══
    if (requestBody.mode === "card_descriptions") {
      const { cards, language: descLang = "zh-TW" } = requestBody as {
        mode: string;
        cards: CardDescriptionInput[];
        language?: string;
      };

      logStep("Card descriptions mode", { cardCount: cards?.length, language: descLang });

      if (!cards || cards.length === 0) {
        return new Response(
          JSON.stringify({ error: "cards is required" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
        );
      }

      const apiKey = Deno.env.get("SUPERUN_API_KEY");
      if (!apiKey) throw new Error("SUPERUN_API_KEY not configured");

      const descSystemPrompt = buildCardDescriptionSystemPrompt(descLang);
      const descUserPrompt = buildCardDescriptionUserPrompt(cards, descLang);

      const descResponse = await fetch("https://gateway.superun.ai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: descSystemPrompt },
            { role: "user", content: descUserPrompt },
          ],
          temperature: 0.5,
          max_tokens: 4096,
        }),
      });

      if (!descResponse.ok) {
        const errorText = await descResponse.text();
        logStep("AI API error (descriptions)", { status: descResponse.status, error: errorText });
        throw new Error(`AI API error: ${descResponse.status}`);
      }

      const descData = await descResponse.json();
      let descAiText = descData.choices?.[0]?.message?.content || "";

      if (descLang === "zh-TW") {
        descAiText = convertToTraditional(descAiText);
      }

      logStep("Card descriptions AI response", { length: descAiText.length });

      const jsonArrayMatch = descAiText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonArrayMatch) {
        const descriptions = JSON.parse(jsonArrayMatch[0]);
        return new Response(
          JSON.stringify({ descriptions }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );
      }

      throw new Error("Failed to parse card descriptions JSON");
    }

    // ═══ Full Analysis Mode (default) ═══
    const {
      top10_cards,
      user_stage = "mid",
      age = null,
      optional_notes = null,
      language = "zh-TW",
      quadrant_contents,
    } = requestBody as {
      top10_cards: CardInput[];
      user_stage?: string;
      age?: string | number | null;
      optional_notes?: string | null;
      language?: string;
      quadrant_contents?: Record<string, QuadrantContent>;
    };

    logStep("Received request", {
      cardCount: top10_cards?.length,
      userStage: user_stage,
      age,
      language,
      hasNotes: !!optional_notes,
    });

    if (!top10_cards || top10_cards.length === 0) {
      return new Response(
        JSON.stringify({ error: "top10_cards is required and must not be empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const apiKey = Deno.env.get("SUPERUN_API_KEY");
    if (!apiKey) {
      throw new Error("SUPERUN_API_KEY not configured");
    }

    const systemPrompt = buildSystemPrompt(language, user_stage);
    const userPrompt = buildUserPrompt(top10_cards, user_stage, age, optional_notes, language, quadrant_contents);

    logStep("Calling AI for 10-module analysis", { stage: user_stage, language });

    const response = await fetch("https://gateway.superun.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 16384,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("AI API error", { status: response.status, error: errorText });
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let aiResponse = data.choices?.[0]?.message?.content || "";

    // Post-process: convert any remaining Simplified Chinese to Traditional for zh-TW
    if (language === "zh-TW") {
      aiResponse = convertToTraditional(aiResponse);
      logStep("Applied SC→TC conversion for zh-TW output");
    }

    logStep("AI response received", { length: aiResponse.length });

    let analysisResult;
    try {
      // Try to find JSON in the response (may be wrapped in markdown code fences)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logStep("Failed to parse AI response as JSON", { error: String(parseError) });
      // Return raw content as fallback
      analysisResult = { rawContent: aiResponse, parseError: true };
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
