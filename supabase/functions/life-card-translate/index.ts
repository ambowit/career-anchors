import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[life-card-translate] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { quadrant_external, quadrant_internal, quadrant_career, quadrant_relationship } = await req.json();

    if (!quadrant_external && !quadrant_internal && !quadrant_career && !quadrant_relationship) {
      return new Response(
        JSON.stringify({ error: "At least one quadrant content is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    logStep("Translating quadrant content from Traditional Chinese to Simplified Chinese and English");

    const apiKey = Deno.env.get("SUPERUN_API_KEY");
    if (!apiKey) {
      throw new Error("SUPERUN_API_KEY not configured");
    }

    const systemPrompt = `You are a professional psychometric assessment translator. Your task is to translate Traditional Chinese (繁體中文) content into:
1. Simplified Chinese (簡體中文)
2. English

Strict rules:
- Maintain the exact original meaning — do NOT add, remove, or reinterpret any concepts
- Use formal, professional, stable psychometric assessment language
- Keep the four-quadrant structure exactly as provided
- Do NOT add explanations or commentary
- Output ONLY the structured JSON result

The four quadrants are:
1. quadrant_external: Perception of external environment (對外部環境的感知)
2. quadrant_internal: Internal self-thinking (對自我內在的思維)
3. quadrant_career: Attitude toward career (對職業生涯的態度)
4. quadrant_relationship: Behaviors toward family/friends (對家庭或朋友的具體行為)`;

    const userContent = `Please translate the following Traditional Chinese quadrant content into Simplified Chinese and English.

Return ONLY a JSON object with this exact structure:
{
  "simplified": {
    "quadrant_external": "...",
    "quadrant_internal": "...",
    "quadrant_career": "...",
    "quadrant_relationship": "..."
  },
  "english": {
    "quadrant_external": "...",
    "quadrant_internal": "...",
    "quadrant_career": "...",
    "quadrant_relationship": "..."
  }
}

Traditional Chinese content to translate:

quadrant_external (對外部環境的感知):
${quadrant_external || "(empty)"}

quadrant_internal (對自我內在的思維):
${quadrant_internal || "(empty)"}

quadrant_career (對職業生涯的態度):
${quadrant_career || "(empty)"}

quadrant_relationship (對家庭或朋友的具體行為):
${quadrant_relationship || "(empty)"}`;

    const aiResponse = await fetch("https://gateway.superun.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, body: errorText });
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    logStep("Raw AI response length", { length: rawContent.length });

    // Extract JSON from response (handle markdown code blocks)
    let jsonString = rawContent;
    const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonString);

    const result = {
      simplified: {
        quadrant_external: parsed.simplified?.quadrant_external || "",
        quadrant_internal: parsed.simplified?.quadrant_internal || "",
        quadrant_career: parsed.simplified?.quadrant_career || "",
        quadrant_relationship: parsed.simplified?.quadrant_relationship || "",
      },
      english: {
        quadrant_external: parsed.english?.quadrant_external || "",
        quadrant_internal: parsed.english?.quadrant_internal || "",
        quadrant_career: parsed.english?.quadrant_career || "",
        quadrant_relationship: parsed.english?.quadrant_relationship || "",
      },
    };

    logStep("Translation complete", {
      simplifiedFields: Object.values(result.simplified).filter(Boolean).length,
      englishFields: Object.values(result.english).filter(Boolean).length,
    });

    return new Response(JSON.stringify(result), {
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
