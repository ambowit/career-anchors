import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callOOOKAI } from "../_shared/oook-ai-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[anonymous-batch-analysis] ${step}${detailsStr}`);
};

// SC→TC subset for output
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
  "电":"電","脑":"腦","车":"車","钱":"錢","银":"銀","锚":"錨","错":"錯",
  "层":"層","岁":"歲","风":"風","险":"險","愿":"願","虑":"慮","忧":"憂",
  "怀":"懷","惯":"慣","总":"總","爱":"愛","欢":"歡","兴":"興","举":"舉",
  "义":"義","显":"顯","类":"類","系":"繫","紧":"緊","维":"維","纪":"紀",
  "约":"約","纯":"純","线":"線","结":"結","给":"給","统":"統","综":"綜",
  "终":"終","络":"絡","灵":"靈","龄":"齡","协":"協","离":"離","响":"響",
  "属":"屬","复":"復","杂":"雜","奋":"奮","头":"頭","顾":"顧","预":"預",
  "额":"額","满":"滿","潜":"潛","冲":"衝","热":"熱","获":"獲","带":"帶",
  "积":"積","种":"種","称":"稱","竞":"競","争":"爭","优":"優","严":"嚴",
  "亲":"親","执":"執","护":"護","担":"擔","拥":"擁","损":"損","换":"換",
  "据":"據","无":"無","暂":"暫","条":"條","档":"檔","检":"檢","权":"權",
  "气":"氣","济":"濟","游":"遊","监":"監","盘":"盤","碍":"礙","础":"礎",
  "简":"簡","笔":"筆",
};

function convertSCtoTC(text: string): string {
  let result = "";
  for (const char of text) {
    result += SC_TO_TC[char] || char;
  }
  return result;
}

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { batchId, language = "zh-TW" } = await req.json();
    logStep("Request received", { batchId, language });

    if (!batchId) {
      throw new Error("batchId is required");
    }

    // Connect to Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch batch info
    const { data: batch, error: batchError } = await supabase
      .from("anonymous_assessment_batches")
      .select("*")
      .eq("id", batchId)
      .single();

    if (batchError || !batch) {
      throw new Error(`Batch not found: ${batchError?.message}`);
    }
    logStep("Batch loaded", { batchName: batch.batch_name, type: batch.assessment_type });

    // Fetch completed responses with scores
    const { data: responses, error: respError } = await supabase
      .from("anonymous_assessment_responses")
      .select("calculated_scores, submitted_at")
      .eq("batch_id", batchId);

    if (respError) {
      throw new Error(`Failed to load responses: ${respError.message}`);
    }

    const completedResponses = responses || [];
    logStep("Responses loaded", { count: completedResponses.length });

    // Fetch link stats
    const { count: totalLinks } = await supabase
      .from("anonymous_assessment_links")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batchId);

    const { count: completedLinks } = await supabase
      .from("anonymous_assessment_links")
      .select("id", { count: "exact", head: true })
      .eq("batch_id", batchId)
      .eq("status", "completed");

    const completionRate = totalLinks && totalLinks > 0
      ? Math.round(((completedLinks || 0) / totalLinks) * 100)
      : 0;

    // Aggregate scores based on assessment type
    const aggregatedData = aggregateScores(completedResponses, batch.assessment_type);
    logStep("Scores aggregated", aggregatedData);

    // Build AI prompt
    const prompt = buildAnalysisPrompt(batch, aggregatedData, completedResponses.length, completionRate, language);
    logStep("Prompt built", { length: prompt.length });

    // Call OOOK AI Gateway
    const rawContent = await callOOOKAI(
      [
        { role: "system", content: getSystemPrompt(language) },
        { role: "user", content: prompt },
      ],
      { temperature: 0.7, max_tokens: 8000, maxCost: 0.06 }
    );

    logStep("AI response received", { length: rawContent.length });

    // Parse JSON
    let analysisResult;
    try {
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)```/) || rawContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawContent;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch {
      const startIdx = rawContent.indexOf("{");
      const endIdx = rawContent.lastIndexOf("}");
      if (startIdx >= 0 && endIdx > startIdx) {
        analysisResult = JSON.parse(rawContent.slice(startIdx, endIdx + 1));
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // SC→TC for zh-TW
    if (language === "zh-TW") {
      analysisResult = convertObjectSCtoTC(analysisResult);
    }

    // Save report to DB
    const reportPayload = {
      batch_id: batchId,
      report_type: "full",
      total_participants: completedResponses.length,
      completion_rate: completionRate,
      summary: aggregatedData,
      charts: aggregatedData,
      ai_insights: analysisResult.insights || [],
      recommendations: analysisResult.recommendations || [],
      risk_signals: analysisResult.risk_signals || [],
    };

    const { data: savedReport, error: saveError } = await supabase
      .from("anonymous_batch_reports")
      .insert(reportPayload)
      .select()
      .single();

    if (saveError) {
      logStep("Save report error", { error: saveError.message });
    } else {
      logStep("Report saved", { reportId: savedReport.id });
    }

    // Update batch status
    await supabase
      .from("anonymous_assessment_batches")
      .update({ status: "report_generated" })
      .eq("id", batchId);

    return new Response(JSON.stringify({
      report: savedReport || reportPayload,
      analysis: analysisResult,
      aggregated: aggregatedData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Aggregate scores from all responses
function aggregateScores(responses: Array<{ calculated_scores: unknown }>, assessmentType: string) {
  if (responses.length === 0) {
    return { type: assessmentType, participantCount: 0, distribution: {} };
  }

  if (assessmentType === "career_anchor") {
    const anchors = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"];
    const totals: Record<string, number> = {};
    const primaryCounts: Record<string, number> = {};
    anchors.forEach((anchorCode) => { totals[anchorCode] = 0; primaryCounts[anchorCode] = 0; });

    for (const response of responses) {
      const scores = response.calculated_scores as Record<string, number> | null;
      if (!scores) continue;

      let maxAnchor = "";
      let maxScore = -1;
      for (const anchorCode of anchors) {
        const score = scores[anchorCode] || 0;
        totals[anchorCode] += score;
        if (score > maxScore) { maxScore = score; maxAnchor = anchorCode; }
      }
      if (maxAnchor) primaryCounts[maxAnchor] = (primaryCounts[maxAnchor] || 0) + 1;
    }

    const averages: Record<string, number> = {};
    anchors.forEach((anchorCode) => { averages[anchorCode] = Math.round(totals[anchorCode] / responses.length); });

    return { type: "career_anchor", participantCount: responses.length, averages, primaryCounts };
  }

  if (assessmentType === "life_card") {
    const valueClusters: Record<string, number> = {};
    for (const response of responses) {
      const scores = response.calculated_scores as Record<string, unknown> | null;
      if (!scores) continue;
      const topValues = (scores.top_values || []) as string[];
      for (const value of topValues) {
        valueClusters[value] = (valueClusters[value] || 0) + 1;
      }
    }
    return { type: "life_card", participantCount: responses.length, valueClusters };
  }

  if (assessmentType === "fusion") {
    const alignmentScores: number[] = [];
    const tensionScores: number[] = [];
    for (const response of responses) {
      const scores = response.calculated_scores as Record<string, number> | null;
      if (!scores) continue;
      if (scores.alignment_score) alignmentScores.push(scores.alignment_score);
      if (scores.tension_index) tensionScores.push(scores.tension_index);
    }
    return { type: "fusion", participantCount: responses.length, alignmentScores, tensionScores };
  }

  return { type: assessmentType, participantCount: responses.length };
}

function getSystemPrompt(language: string): string {
  if (language === "en") {
    return `You are a senior organizational development consultant specializing in SCPC career anchor analysis and team composition diagnostics.
Generate a structured JSON analysis report for an anonymous assessment batch.
Rules:
- Base all analysis ONLY on the provided aggregated data.
- Use enterprise-grade, professional, actionable language.
- Every insight must be traceable to the data provided.
- Recommendations must be specific, executable, and verifiable.
Output language: English.`;
  }
  return `你是一位資深組織發展顧問，專精於 SCPC 職業錨分析與團隊組成診斷。
請為匿名測評批次生成結構化的 JSON 分析報告。
規則：
- 僅基於提供的聚合數據進行分析。
- 使用企業級、專業、可執行的語言。
- 每個洞察必須可回溯到提供的數據。
- 建議必須具體、可執行、可驗證。
輸出語言：${language === "zh-TW" ? "繁體中文" : "简体中文"}。`;
}

function buildAnalysisPrompt(
  batch: Record<string, unknown>,
  aggregated: Record<string, unknown>,
  totalParticipants: number,
  completionRate: number,
  language: string
): string {
  return `
=== ANONYMOUS BATCH ANALYSIS REQUEST ===

Batch Name: ${batch.batch_name}
Assessment Type: ${batch.assessment_type}
Total Participants: ${totalParticipants}
Completion Rate: ${completionRate}%

=== AGGREGATED DATA ===
${JSON.stringify(aggregated, null, 2)}

=== REQUIRED JSON OUTPUT ===

Generate a JSON object with these keys:

{
  "insights": [
    "(4-6 key insight strings, each 2-3 sentences, based on the aggregated data)"
  ],
  "risk_signals": [
    {
      "signal": "(risk description)",
      "severity": "(high/medium/low)",
      "detail": "(1-2 sentence explanation)"
    }
  ],
  "recommendations": [
    {
      "category": "(recommendation category name)",
      "category_en": "(English category name)",
      "items": ["(2-3 specific actionable items per category)"]
    }
  ],
  "group_summary": {
    "dominant_pattern": "(1-2 sentences describing the dominant group pattern)",
    "structural_strength": "(1 sentence about structural strength)",
    "structural_gap": "(1 sentence about structural gap or weakness)",
    "organizational_implication": "(2-3 sentences about what this means for the organization)"
  }
}

IMPORTANT:
- insights should have 4-6 items.
- risk_signals should have 3-5 items.
- recommendations should have 3-4 categories with 2-3 items each.
- All text in ${language === "en" ? "English" : language === "zh-TW" ? "繁體中文" : "简体中文"}.
- Generate ONLY the JSON, no markdown wrapping.
`;
}
