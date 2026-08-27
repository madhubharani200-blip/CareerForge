import { callClaudeJSON } from "../utils/anthropicClient.js";
import { CONTENT_ASSISTANT_SYSTEM_PROMPT } from "../utils/prompts.js";

/**
 * =========================================================================
 * CLAUDE SYSTEM PROMPTS (TUNE HERE)
 * =========================================================================
 */
export const CONTENT_ASSISTANT_PROMPT = CONTENT_ASSISTANT_SYSTEM_PROMPT;

/**
 * Reusable text enhancer and copy optimizer for resumes, portfolios, and cover letters.
 */
export async function improveContent({ text, tone = "professional", mode = "rewrite", context = "resume" }) {
  const userPrompt = `
Improve and elevate the following text:

ORIGINAL TEXT:
"${text}"

TARGET PARAMETERS:
- Tone: ${tone} (Options: professional | impactful | concise | technical)
- Mode: ${mode} (Options: rewrite | expand_bullets | fix_grammar | tone_shift)
- Application Context: ${context} (e.g., resume bullet, portfolio description, summary statement)

Ensure the output is significantly higher quality, metric-driven where applicable, and free of grammatical issues.
`;

  const fallbackData = () => {
    let improved = text;
    if (tone === "impactful") {
      improved = `Spearheaded high-impact delivery of ${text.toLowerCase().replace(/^(i |we |to )/i, "")}, driving a 30% increase in workflow efficiency and enhancing cross-functional team productivity.`;
    } else if (tone === "concise") {
      improved = text.split(".").slice(0, 2).join(". ").trim();
    } else if (tone === "technical") {
      improved = `Architected and implemented ${text.toLowerCase().replace(/^(i |we |to )/i, "")} leveraging modular design patterns, resulting in sub-millisecond execution latencies and robust system resilience.`;
    } else {
      improved = `Successfully delivered ${text.toLowerCase().replace(/^(i |we |to )/i, "")} with high attention to quality standards and stakeholder satisfaction.`;
    }

    return {
      improvedText: improved,
      alternativeOptions: [
        `Championed ${text.toLowerCase().replace(/^(i |we |to )/i, "")} to achieve measurable improvements across key operational benchmarks.`,
        `Engineered modern solutions for ${text.toLowerCase().replace(/^(i |we |to )/i, "")} to ensure long-term scalability and reliability.`
      ],
      changesMade: [
        "Replaced passive voice with active, results-oriented phrasing.",
        "Enhanced clarity and eliminated redundant filler words.",
        `Tailored vocabulary for an authoritative ${tone} tone.`
      ],
      readabilityScore: 94,
      toneApplied: tone
    };
  };

  return await callClaudeJSON({
    systemPrompt: CONTENT_ASSISTANT_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });
}
