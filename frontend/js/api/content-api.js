/**
 * AI CONTENT ASSISTANT API WRAPPER
 */

import { callBackendApi } from "./client.js";

/**
 * Reusable text enhancer and rewrite engine
 */
export async function improveContentWithAI({ text, tone = "professional", mode = "rewrite", context = "general" }) {
  return await callBackendApi("ai/improve-content", {
    text,
    tone,
    mode,
    context
  });
}
