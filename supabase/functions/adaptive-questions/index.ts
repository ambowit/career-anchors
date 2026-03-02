import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[adaptive-questions] ${step}${detailsStr}`);
};

// Types
interface Answer {
  questionId: string;
  value: number;
  dimension: string;
  weight: number;
}

interface AnchorStatus {
  dimension: string;
  score: number;
  clarity: "clear" | "uncertain" | "conflict";
  questionsAnswered: number;
  consistency: number;
}

interface AdaptiveRequest {
  answers: Answer[];
  currentScores: Record<string, number>;
  anchorStatuses: AnchorStatus[];
  phase: "core" | "clarifier" | "validator";
  uncertainAnchors: string[];
  conflictPairs: [string, string][];
}

interface AdaptiveResponse {
  recommendation: "continue" | "add_clarifiers" | "add_validators" | "complete";
  targetDimensions: string[];
  maxQuestionsToAdd: number;
  reasoning: string;
  confidenceLevel: "high" | "medium" | "low";
}

// Conflict anchor pairs
const CONFLICT_PAIRS: [string, string][] = [
  ["SE", "EC"], // Security vs Entrepreneurship
  ["GM", "AU"], // Management vs Autonomy
  ["CH", "LS"], // Challenge vs Lifestyle
  ["TF", "GM"], // Technical vs Management
];

// Adaptive thresholds
const THRESHOLDS = {
  uncertainScoreMin: 45,
  uncertainScoreMax: 70,
  clearLeadMargin: 15,
  conflictThreshold: 65,
  minQuestions: 16,
  targetQuestions: 28,
  maxQuestions: 40,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: AdaptiveRequest = await req.json();
    
    logStep("Received adaptive request", { 
      answersCount: request.answers.length,
      phase: request.phase,
      uncertainAnchors: request.uncertainAnchors,
      conflictPairs: request.conflictPairs,
    });

    const apiKey = Deno.env.get("SUPERUN_API_KEY");
    if (!apiKey) {
      // Fallback to rule-based decision if no AI
      const fallbackResponse = makeRuleBasedDecision(request);
      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Build AI prompt for intelligent decision
    const prompt = buildAdaptivePrompt(request);
    
    logStep("Calling AI for adaptive decision");

    const response = await fetch("https://gateway.superun.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      })
    });

    if (!response.ok) {
      logStep("AI API error, using fallback", { status: response.status });
      const fallbackResponse = makeRuleBasedDecision(request);
      return new Response(JSON.stringify(fallbackResponse), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";
    
    logStep("AI response received", { response: aiResponse.substring(0, 300) });

    // Parse AI response
    let adaptiveResponse: AdaptiveResponse;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        adaptiveResponse = {
          recommendation: parsed.recommendation || "continue",
          targetDimensions: parsed.targetDimensions || [],
          maxQuestionsToAdd: parsed.maxQuestionsToAdd || 2,
          reasoning: parsed.reasoning || "AI decision",
          confidenceLevel: parsed.confidenceLevel || "medium",
        };
      } else {
        throw new Error("No JSON found");
      }
    } catch {
      logStep("Failed to parse AI response, using fallback");
      adaptiveResponse = makeRuleBasedDecision(request);
    }

    // Validate response
    adaptiveResponse = validateResponse(adaptiveResponse, request);

    logStep("Returning adaptive decision", adaptiveResponse);

    return new Response(JSON.stringify(adaptiveResponse), {
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

function buildAdaptivePrompt(request: AdaptiveRequest): string {
  const { answers, currentScores, anchorStatuses, phase, uncertainAnchors, conflictPairs } = request;
  
  return `You are an adaptive assessment engine for the SCPC Career Anchor questionnaire.

CURRENT STATE:
- Questions answered: ${answers.length}
- Current phase: ${phase}
- Current scores: ${JSON.stringify(currentScores)}
- Uncertain anchors: ${JSON.stringify(uncertainAnchors)}
- Conflict pairs detected: ${JSON.stringify(conflictPairs)}

ANCHOR STATUS DETAILS:
${anchorStatuses.map(s => 
  `- ${s.dimension}: score=${s.score}, clarity=${s.clarity}, questions=${s.questionsAnswered}, consistency=${s.consistency.toFixed(2)}`
).join('\n')}

THRESHOLDS:
- Min questions: ${THRESHOLDS.minQuestions}
- Target questions: ${THRESHOLDS.targetQuestions}
- Max questions: ${THRESHOLDS.maxQuestions}
- Conflict threshold: ${THRESHOLDS.conflictThreshold}
- Clear lead margin: ${THRESHOLDS.clearLeadMargin}

CONFLICT PAIRS (structurally incompatible):
${CONFLICT_PAIRS.map(([a, b]) => `- ${a} vs ${b}`).join('\n')}

DECISION RULES:
1. Goal: Minimize unnecessary questions while ensuring reliable results
2. Stop if: main anchor is stable (leading by ${THRESHOLDS.clearLeadMargin}+ points) OR all anchors are clear
3. Add clarifiers: when anchors are in uncertain range (${THRESHOLDS.uncertainScoreMin}-${THRESHOLDS.uncertainScoreMax})
4. Add validators: when two conflict anchors both score >= ${THRESHOLDS.conflictThreshold}
5. Max ${THRESHOLDS.maxQuestions} questions total

TASK: Decide what to do next.

Return a JSON object with:
{
  "recommendation": "continue" | "add_clarifiers" | "add_validators" | "complete",
  "targetDimensions": ["XX", "YY"], // which dimensions to focus on
  "maxQuestionsToAdd": 2, // 1-4
  "reasoning": "brief explanation",
  "confidenceLevel": "high" | "medium" | "low"
}

Return ONLY the JSON object, nothing else.`;
}

function makeRuleBasedDecision(request: AdaptiveRequest): AdaptiveResponse {
  const { answers, currentScores, phase, uncertainAnchors, conflictPairs } = request;
  const answersCount = answers.length;

  // Check if we're at max
  if (answersCount >= THRESHOLDS.maxQuestions) {
    return {
      recommendation: "complete",
      targetDimensions: [],
      maxQuestionsToAdd: 0,
      reasoning: "Maximum questions reached",
      confidenceLevel: "high",
    };
  }

  // Check if main anchor is stable
  const sortedScores = Object.entries(currentScores).sort(([, a], [, b]) => b - a);
  if (sortedScores.length >= 2) {
    const [topDim, topScore] = sortedScores[0];
    const [, secondScore] = sortedScores[1];
    
    if (topScore >= 65 && (topScore - secondScore) >= THRESHOLDS.clearLeadMargin && answersCount >= THRESHOLDS.targetQuestions) {
      return {
        recommendation: "complete",
        targetDimensions: [],
        maxQuestionsToAdd: 0,
        reasoning: `Main anchor ${topDim} is stable with ${topScore} points`,
        confidenceLevel: "high",
      };
    }
  }

  // Check for conflicts that need validation
  if (conflictPairs.length > 0 && phase !== "validator") {
    const dimsToValidate = [...new Set(conflictPairs.flat())];
    return {
      recommendation: "add_validators",
      targetDimensions: dimsToValidate.slice(0, 4),
      maxQuestionsToAdd: Math.min(4, dimsToValidate.length),
      reasoning: `Detected ${conflictPairs.length} conflict pair(s) needing validation`,
      confidenceLevel: "medium",
    };
  }

  // Check for uncertain anchors that need clarification
  if (uncertainAnchors.length > 0 && phase === "core") {
    return {
      recommendation: "add_clarifiers",
      targetDimensions: uncertainAnchors.slice(0, 2),
      maxQuestionsToAdd: Math.min(4, uncertainAnchors.length * 2),
      reasoning: `${uncertainAnchors.length} anchor(s) need clarification`,
      confidenceLevel: "medium",
    };
  }

  // All clear or minimum reached
  if (answersCount >= THRESHOLDS.minQuestions && uncertainAnchors.length === 0) {
    return {
      recommendation: "complete",
      targetDimensions: [],
      maxQuestionsToAdd: 0,
      reasoning: "All anchors are clear",
      confidenceLevel: "high",
    };
  }

  // Continue with current phase
  return {
    recommendation: "continue",
    targetDimensions: [],
    maxQuestionsToAdd: 0,
    reasoning: "Continue current phase",
    confidenceLevel: "medium",
  };
}

function validateResponse(response: AdaptiveResponse, request: AdaptiveRequest): AdaptiveResponse {
  // Ensure recommendation is valid
  const validRecommendations = ["continue", "add_clarifiers", "add_validators", "complete"];
  if (!validRecommendations.includes(response.recommendation)) {
    response.recommendation = "continue";
  }

  // Ensure targetDimensions are valid
  const validDimensions = ["TF", "GM", "AU", "SE", "EC", "SV", "CH", "LS"];
  response.targetDimensions = response.targetDimensions.filter(d => validDimensions.includes(d));

  // Ensure maxQuestionsToAdd is reasonable
  response.maxQuestionsToAdd = Math.max(0, Math.min(6, response.maxQuestionsToAdd));

  // Don't add questions if already at max
  if (request.answers.length >= THRESHOLDS.maxQuestions) {
    response.recommendation = "complete";
    response.maxQuestionsToAdd = 0;
  }

  return response;
}
