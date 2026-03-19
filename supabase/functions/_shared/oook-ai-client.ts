// OOOK AI Gateway Client for Supabase Edge Functions
// 统一 AI 调用入口，遵循 OOOK 双网关架构

interface OOOKAIRequest {
  capability: string;           // ai.* 命名空间，如 ai.general_user_defined
  input: {
    messages: Array<{ role: string; content: string }>;
    temperature?: number;
    max_tokens?: number;
  };
  constraints?: {
    maxCost?: number;
    latency?: 'fast' | 'normal' | 'slow';
    qualityTier?: 'economy' | 'balanced' | 'premium';
  };
}

interface OOOKAIResponse {
  success: boolean;
  result?: {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
    [key: string]: unknown;
  };
  error?: string;
}

/**
 * 调用 OOOK AI Gateway
 * @param messages - 对话消息数组
 * @param options - 可选参数
 * @returns AI 响应内容
 */
export async function callOOOKAI(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    max_tokens?: number;
    maxCost?: number;
    qualityTier?: 'economy' | 'balanced' | 'premium';
  } = {}
): Promise<string> {
  const gatewayUrl = Deno.env.get("OOOK_AI_GATEWAY_URL") || "https://gateway.oook.com/";
  const token = Deno.env.get("OOOK_AI_GATEWAY_TOKEN");

  if (!token) {
    throw new Error("OOOK_AI_GATEWAY_TOKEN is not configured");
  }

  const request: OOOKAIRequest = {
    capability: "ai.general_user_defined",
    input: {
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens,
    },
    constraints: {
      maxCost: options.maxCost ?? 0.05,
      qualityTier: options.qualityTier ?? 'balanced',
    },
  };

  const response = await fetch(`${gatewayUrl}api/ai/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OOOK AI Gateway error: ${response.status} - ${errorText}`);
  }

  const data: OOOKAIResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error || "OOOK AI Gateway returned unsuccessful response");
  }

  const content = data.result?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OOOK AI Gateway response");
  }

  return content;
}

/**
 * 带重试的 AI 调用
 */
export async function callOOOKAIWithRetry(
  messages: Array<{ role: string; content: string }>,
  options: {
    temperature?: number;
    max_tokens?: number;
    maxCost?: number;
    qualityTier?: 'economy' | 'balanced' | 'premium';
    maxRetries?: number;
  } = {}
): Promise<string> {
  const maxRetries = options.maxRetries ?? 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callOOOKAI(messages, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("OOOK AI call failed after retries");
}
