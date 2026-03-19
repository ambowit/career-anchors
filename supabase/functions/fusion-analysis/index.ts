import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { callOOOKAI } from "../_shared/oook-ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[fusion-analysis] ${step}${detailsStr}`);
};

// SC→TC character mapping (comprehensive)
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
  "绩":"績","够":"夠","对":"對","当":"當","须":"須","与":"與",
  "开":"開","门":"門","间":"間","时":"時","机":"機","会":"會",
  "节":"節","习":"習","学":"學","术":"術","让":"讓","说":"說","话":"話",
  "请":"請","读":"讀","写":"寫","画":"畫","听":"聽","声":"聲","乐":"樂",
  "电":"電","脑":"腦","车":"車","钱":"錢","银":"銀","铁":"鐵","钟":"鐘",
  "锚":"錨","错":"錯","层":"層","岁":"歲",
  "风":"風","险":"險","愿":"願","虑":"慮","忧":"憂","怀":"懷",
  "惯":"慣","总":"總","爱":"愛","欢":"歡",
  "兴":"興","举":"舉","丰":"豐","义":"義","显":"顯","类":"類","系":"繫",
  "紧":"緊","维":"維","纪":"紀","约":"約","纯":"純","线":"線","细":"細",
  "结":"結","给":"給","绝":"絕","统":"統",
  "综":"綜","练":"練","终":"終","络":"絡",
  "罗":"羅","灵":"靈","龄":"齡","协":"協",
  "离":"離","响":"響","属":"屬","复":"復","杂":"雜","奋":"奮",
  "头":"頭","频":"頻","顾":"顧","预":"預",
  "额":"額","满":"滿","渐":"漸","潜":"潛","冲":"衝",
  "热":"熱","获":"獲","带":"帶",
  "积":"積","种":"種","称":"稱","竞":"競","争":"爭",
  "优":"優","华":"華","严":"嚴","亲":"親","执":"執",
  "护":"護","担":"擔","拥":"擁","择":"擇","损":"損",
  "换":"換","据":"據","斗":"鬥","无":"無",
  "暂":"暫","条":"條","档":"檔",
  "检":"檢","权":"權",
  "气":"氣","济":"濟",
  "深":"深","游":"遊",
  "滞":"滯","灭":"滅",
  "烦":"煩","焦":"焦",
  "犹":"猶","玛":"瑪",
  "疲":"疲","痛":"痛","盖":"蓋",
  "监":"監","盘":"盤",
  "碍":"礙","础":"礎",
  "穷":"窮",
  "简":"簡","管":"管",
  "策":"策","笔":"筆",
};

function convertSCtoTC(text: string): string {
  let result = "";
  for (const char of text) {
    result += SC_TO_TC[char] || char;
  }
  return result;
}

interface FusionNarrativeInput {
  computed_metrics: {
    alignment_score: number;
    alignment_level: string;
    tension_index: number;
    tension_level: string;
    concentration: number;
    balance: number;
    concentration_level: string;
    maturity_level: string;
    maturity_label: string;
    structure_type: string;
    structure_tags: string[];
    value_dim_weights: Record<string, number>;
    support_strengths: Record<string, number>;
    top3_values: string[];
    under_supported: string[];
    not_represented: string[];
    tension_penalties: string[];
  };
  raw_data: {
    top10_cards: Array<{
      rank: number;
      card_name: string;
      card_name_en: string;
      dimension: string;
      dimension_label: string;
    }>;
    anchor_scores: Record<string, number>;
    career_stage: string;
  };
  language: "zh-TW" | "zh-CN" | "en";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const input: FusionNarrativeInput = await req.json();
    logStep("Received fusion analysis request", {
      language: input.language,
      alignmentScore: input.computed_metrics.alignment_score,
      tensionIndex: input.computed_metrics.tension_index,
    });

    const { computed_metrics, raw_data, language } = input;

    const prompt = buildFusionPrompt(computed_metrics, raw_data, language);
    logStep("Prompt built", { promptLength: prompt.length });

    // Call OOOK AI Gateway
    const rawContent = await callOOOKAI(
      [
        { role: "system", content: getSystemPrompt(language) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.7, max_tokens: 12000, maxCost: 0.08 }
    );

    logStep("AI response received", { contentLength: rawContent.length });

    let analysisResult;
    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/) ||
                         rawContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawContent;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch {
      logStep("JSON parse failed, attempting recovery");
      const startIdx = rawContent.indexOf("{");
      const endIdx = rawContent.lastIndexOf("}");
      if (startIdx >= 0 && endIdx > startIdx) {
        analysisResult = JSON.parse(rawContent.slice(startIdx, endIdx + 1));
      } else {
        throw new Error("Failed to parse AI JSON response");
      }
    }

    if (language === "zh-TW") {
      analysisResult = convertObjectSCtoTC(analysisResult);
    }

    logStep("Analysis complete");

    return new Response(JSON.stringify({ narrative: analysisResult }), {
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

function convertObjectSCtoTC(obj: unknown): unknown {
  if (typeof obj === "string") return convertSCtoTC(obj);
  if (Array.isArray(obj)) return obj.map(convertObjectSCtoTC);
  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = convertObjectSCtoTC(val);
    }
    return result;
  }
  return obj;
}

function getSystemPrompt(language: string): string {
  if (language === "en") {
    return `You are a world-class psychometric report designer and organizational development consultant.

Your task is to generate a DEVELOPMENT-ORIENTED fusion analysis report in JSON format.

IRON RULES:
- NEVER use personality definition language ("you are a ... type")
- NEVER use psychological diagnosis language
- NEVER predict future behavior ("you will...")
- NEVER use causal reasoning ("because you... therefore...")
- NEVER use judgmental language
- ALWAYS use development-oriented expressions ("the current structure leans toward...")
- ALWAYS use stage-based expressions ("at this stage...")
- ALWAYS use choice-oriented expressions ("may bring more development path options...")
- Use warm, professional, restrained, non-emotional language
- International consulting firm style

Output language: English.`;
  }
  return `你是世界级心理测评报告设计专家、组织发展顾问级产品架构师。

你的任务是生成一份「发展导向」的融合分析报告（JSON 格式）。

铁律：
- 严禁人格定义（"说明你是……类型"）
- 严禁心理诊断
- 严禁未来预测（"意味着你未来会……"）
- 严禁评判语言
- 严禁因果推论（"因为你……所以……"）
- 必须使用发展导向表达（"当前结构更偏向……"）
- 必须使用阶段性表达（"在某些情境下可能更关注……"）
- 必须使用选择性表达（"可能带来更多发展路径选择……"）
- 语气：国际咨询公司风格，专业、克制、高级、非情绪化
- 温和、支持性、发展性

输出语言：${language === "zh-TW" ? "繁體中文。嚴禁在输出中夹杂任何英文单词或术语，包括但不限于 balanced-integration、moderate、career-development、high、gentle 等，必须全部翻译为繁體中文" : "简体中文。严禁在输出中夹杂任何英文单词或术语，必须全部翻译为中文"}。`;
}

function buildFusionPrompt(
  metrics: FusionNarrativeInput["computed_metrics"],
  rawData: FusionNarrativeInput["raw_data"],
  language: string
): string {
  const dimLabels = language === "en"
    ? { achievement: "Achievement", influence: "Influence", freedom: "Freedom", security: "Security", relationships: "Relationships", creation: "Creation", meaning: "Meaning", quality_of_life: "Quality of Life" }
    : { achievement: "成就", influence: "影响力", freedom: "自由", security: "安全", relationships: "关系", creation: "创造", meaning: "意义", quality_of_life: "生活质量" };

  const anchorLabels = language === "en"
    ? { TF: "Technical/Functional", GM: "General Management", AU: "Autonomy", SE: "Security/Stability", EC: "Entrepreneurial Creativity", SV: "Service/Dedication", CH: "Pure Challenge", LS: "Lifestyle Integration" }
    : { TF: "技术/专业能力", GM: "管理", AU: "自主/独立", SE: "安全/稳定", EC: "创业/创造", SV: "服务/奉献", CH: "挑战", LS: "生活方式整合" };

  const stageLabels: Record<string, Record<string, string>> = {
    early: { en: "Early Career", "zh-CN": "早期", "zh-TW": "早期" },
    mid: { en: "Mid Career", "zh-CN": "中前期", "zh-TW": "中前期" },
    senior: { en: "Senior Career", "zh-CN": "中后期", "zh-TW": "中後期" },
  };
  const stageName = stageLabels[rawData.career_stage]?.[language] || rawData.career_stage;

  const cardList = rawData.top10_cards
    .map(c => `  #${c.rank}: ${language === "en" ? c.card_name_en : c.card_name} → ${c.dimension_label}`)
    .join("\n");

  const anchorList = Object.entries(rawData.anchor_scores)
    .sort(([, scoreA], [, scoreB]) => (scoreB as number) - (scoreA as number))
    .map(([code, score]) => `  ${anchorLabels[code as keyof typeof anchorLabels] || code}: ${score}`)
    .join("\n");

  const weightList = Object.entries(metrics.value_dim_weights)
    .sort(([, weightA], [, weightB]) => (weightB as number) - (weightA as number))
    .map(([dim, weight]) => `  ${dimLabels[dim as keyof typeof dimLabels] || dim}: ${((weight as number) * 100).toFixed(1)}%`)
    .join("\n");

  const supportList = Object.entries(metrics.support_strengths)
    .map(([dim, support]) => `  ${dimLabels[dim as keyof typeof dimLabels] || dim}: ${(support as number).toFixed(1)}`)
    .join("\n");

  // Determine spectrum position
  const workDims = ["achievement", "influence", "creation"];
  const lifeDims = ["quality_of_life", "relationships", "security"];
  let workWeight = 0, lifeWeight = 0;
  for (const dim of workDims) workWeight += (metrics.value_dim_weights[dim] || 0);
  for (const dim of lifeDims) lifeWeight += (metrics.value_dim_weights[dim] || 0);

  const spectrumLabels: Record<string, Record<string, string>> = {
    career:   { en: "career-development",     "zh-TW": "\u8077\u6daf\u767c\u5c55\u5c0e\u5411",   "zh-CN": "\u804c\u6daf\u53d1\u5c55\u5bfc\u5411" },
    balanced: { en: "balanced-integration",    "zh-TW": "\u5e73\u8861\u6574\u5408",             "zh-CN": "\u5e73\u8861\u6574\u5408" },
    life:     { en: "life-quality orientation", "zh-TW": "\u751f\u6d3b\u5f62\u614b\u95dc\u6ce8",   "zh-CN": "\u751f\u6d3b\u5f62\u6001\u5173\u6ce8" },
  };
  const spectrumKey = workWeight > lifeWeight + 0.1 ? "career" : lifeWeight > workWeight + 0.1 ? "life" : "balanced";
  const spectrumPosition = spectrumLabels[spectrumKey]?.[language] || spectrumLabels[spectrumKey]?.en || spectrumKey;

  // Determine anchor drive strength
  const anchorValues = Object.values(rawData.anchor_scores) as number[];
  const maxAnchor = Math.max(...anchorValues);
  const driveLevels: Record<string, Record<string, string>> = {
    high:     { en: "high",     "zh-TW": "\u9ad8\u9a45\u52d5\u529b", "zh-CN": "\u9ad8\u9a71\u52a8\u529b" },
    moderate: { en: "moderate", "zh-TW": "\u4e2d\u7b49\u9a45\u52d5\u529b", "zh-CN": "\u4e2d\u7b49\u9a71\u52a8\u529b" },
    gentle:   { en: "gentle",   "zh-TW": "\u67d4\u6027\u9a45\u52d5", "zh-CN": "\u67d4\u6027\u9a71\u52a8" },
  };
  const driveKey = maxAnchor >= 80 ? "high" : maxAnchor >= 60 ? "moderate" : "gentle";
  const driveLevel = driveLevels[driveKey]?.[language] || driveLevels[driveKey]?.en || driveKey;

  return `
=== 职业锚 × 理想人生卡 融合发展分析 — 数据 ===

【Top10 理想人生卡及价值维度】
${cardList}

【职业锚得分 (0-100 标准化)】
${anchorList}

【职涯阶段】 ${stageName}

=== 计算指标 ===

一致度: ${metrics.alignment_score}/100 (${metrics.alignment_level})
张力指数: ${metrics.tension_index}/100 (${metrics.tension_level})
集中度: ${metrics.concentration}/100 (${metrics.concentration_level})
平衡度: ${metrics.balance}/100
成熟度: ${metrics.maturity_label}
结构类型: ${metrics.structure_type}
结构标签: ${metrics.structure_tags.join(", ")}

【价值维度权重】
${weightList}

【各维度支持强度】
${supportList}

【Top3 价值维度】 ${metrics.top3_values.map(d => dimLabels[d as keyof typeof dimLabels] || d).join(", ")}
【支持不足的价值 (Support<60)】 ${metrics.under_supported.length > 0 ? metrics.under_supported.map(d => dimLabels[d as keyof typeof dimLabels] || d).join(", ") : "无"}
【未被代表的强锚】 ${metrics.not_represented.length > 0 ? metrics.not_represented.map(a => anchorLabels[a as keyof typeof anchorLabels] || a).join(", ") : "无"}
【触发的张力惩罚项】 ${metrics.tension_penalties.length > 0 ? metrics.tension_penalties.join(", ") : "无"}

【光谱定位】 ${spectrumPosition} (工作维度权重: ${(workWeight * 100).toFixed(1)}%, 生活维度权重: ${(lifeWeight * 100).toFixed(1)}%)
【驱动力强度】 ${driveLevel} (最高锚分: ${maxAnchor})

=== 输出 JSON 结构 ===

请严格按照以下 JSON 结构输出（发展导向风格）：

{
  "report_understanding": "(2-3句话。说明本报告基于两项测评结果形成。结果更适合被理解为当前阶段在价值关注与职业驱动之间所呈现的一种发展结构。本报告不用于人格定义、心理诊断、未来行为预测，而是提供发展方向理解、选择参考、阶段调适视角。)",

  "structure_overview": {
    "position_description": "(2-3句话。描述用户在融合结构图中的当前定位。横轴是理想人生卡价值光谱：左侧职业发展导向、中间中性整合区、右侧生活形态关注。纵轴是职业锚驱动力强度：顶部高驱动力、底部相对柔性驱动。)",
    "structure_type_label": "(从以下5个标签中选择最匹配的一个：结构一致发展型 / 双重重心整合型 / 阶段探索型 / 发展张力型 / 均衡成长型)",
    "structure_type_description": "(1-2句话描述该结构类型的含义。使用发展导向表达。)"
  },

  "development_focus": {
    "focus_description": "(3-4句话。描述当前阶段更突出的关注焦点。必须基于理想人生卡Top10和职业锚核心锚。使用描述性、中性、发展导向的语言。示例：从本次结果来看，当前阶段更突出的关注方向，包括在职业发展推进与个人生活体验之间寻找适合的节奏。)",
    "value_highlights": ["(2-3个最突出的人生价值维度及其简要说明)"],
    "anchor_highlights": ["(2-3个最突出的职业锚及其简要说明)"]
  },

  "tension_integration": {
    "overlap_description": "(2-3句话。描述人生价值关注与职业驱动方向的交集区域——当前的整合空间。)",
    "explore_description": "(1-2句话。描述可进一步探索的发展面向，即圆外区域。)",
    "narrative": "(2-3句话。发展导向的总结。示例：本次结果呈现出一定的发展张力，这可能为未来带来更多路径选择与整合机会。严禁使用风险、冲突、问题等词汇。)"
  },

  "recommendations": {
    "career_context": "(2-3句话。职业情境建议。示例：在职业路径选择时，当前结构可能更适合关注具有成长空间与灵活发展的环境。)",
    "life_rhythm": "(2-3句话。生活节奏建议。示例：在生活安排上，维持一定的弹性空间，有助于支持整体发展节奏。)",
    "choice_perspective": "(2-3句话。选择视角建议。示例：在重要决策时，同时关注价值满足与职业推进，可能有助于形成更稳定的发展体验。)"
  },

  "stage_summary": "(3-4句话。温和收束式总结。示例：本报告呈现的是当前阶段的发展结构，并不代表固定特质。随着环境变化与经验累积，价值关注与职业驱动可能持续演进。理解这种动态变化，有助于在未来发展中保持更大的主动性与空间感。)"
}

重要提示：
- 严格按照上述 JSON 结构输出，不要添加额外字段。
- 所有文本使用${language === "en" ? "English" : language === "zh-TW" ? "繁體中文" : "简体中文"}。${language === "zh-TW" ? "严禁在繁体中文中夹杂任何英文单词或术语（如 balanced-integration、moderate、career-development 等），必须全部翻译为繁体中文。" : language === "zh-CN" ? "严禁在简体中文中夹杂任何英文单词或术语，必须全部翻译为中文。" : ""}
- 每条内容必须能回溯到上面提供的算法指标。
- 绝对不使用心理诊断语言、人格贴标签、风险预警语言。
- 绝对不出现“风险”、“冲突”、“问题”、“缺陷”等负面评判词汇。
- 整体语气：国际咨询公司风格、专业、克制、高级、非情绪化、发展导向。
`;
}
