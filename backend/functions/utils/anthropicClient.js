import Anthropic from "@anthropic-ai/sdk";

/**
 * Clean and extract JSON from raw Claude response strings
 */
export function extractJSON(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response received from LLM");
  }

  // Remove markdown code fences if present (```json ... ``` or ``` ...)
  let cleaned = rawText.trim();
  const jsonFenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonFenceMatch && jsonFenceMatch[1]) {
    cleaned = jsonFenceMatch[1].trim();
  }

  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = cleaned.search(/[\}\]][^\{\}\]]*$/);

  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

/**
 * Call Anthropic Claude API with automatic retry on malformed JSON
 * and graceful fallback simulation if API key is missing.
 */
export async function callClaudeJSON({
  systemPrompt,
  userPrompt,
  model = "claude-3-5-sonnet-20241022",
  maxTokens = 4000,
  temperature = 0.2,
  mockFallbackData = null
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("[AnthropicClient] No ANTHROPIC_API_KEY provided in environment. Using high-fidelity fallback response generator.");
    if (mockFallbackData) {
      return typeof mockFallbackData === "function" ? mockFallbackData() : mockFallbackData;
    }
    return {
      status: "mock_success",
      message: "Generated via developer sandbox fallback (Set ANTHROPIC_API_KEY for live Claude inference)"
    };
  }

  const anthropic = new Anthropic({ apiKey });

  // First Attempt
  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });

    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return extractJSON(textContent);
  } catch (firstError) {
    console.warn("[AnthropicClient] First attempt failed or produced malformed JSON. Retrying with explicit repair prompt...", firstError.message);

    // Attempt 2: Retry once with explicit schema correction prompt
    try {
      const retryResponse = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: 0.1,
        system: systemPrompt + "\n\nCRITICAL: Return ONLY raw, valid, parseable JSON without commentary.",
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: "I will provide the JSON output now." },
          { role: "user", content: "Please output the exact valid JSON object now." }
        ]
      });

      const retryText = retryResponse.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return extractJSON(retryText);
    } catch (retryError) {
      console.error("[AnthropicClient] Retry attempt also failed:", retryError);
      if (mockFallbackData) {
        console.warn("[AnthropicClient] Returning fallback data after API failure.");
        return typeof mockFallbackData === "function" ? mockFallbackData() : mockFallbackData;
      }
      throw new Error(`AI inference failed: ${retryError.message}`);
    }
  }
}
