import { callClaudeJSON } from "../utils/anthropicClient.js";
import { RESUME_BULLET_SYSTEM_PROMPT, CAREER_OBJECTIVE_SYSTEM_PROMPT } from "../utils/prompts.js";

/**
 * =========================================================================
 * CLAUDE SYSTEM PROMPTS (TUNE HERE)
 * =========================================================================
 */
export const RESUME_BULLET_PROMPT = RESUME_BULLET_SYSTEM_PROMPT;
export const RESUME_OBJECTIVE_PROMPT = CAREER_OBJECTIVE_SYSTEM_PROMPT;

/**
 * Generates polished, XYZ-formula bullet points from raw notes or experience descriptions.
 */
export async function generateResumeBullets({ roleTitle, company, rawInputs, targetRole = "Software Engineer" }) {
  const userPrompt = `
Transform the following raw career points for a "${roleTitle}" position at "${company || "Company"}" targeting "${targetRole}" roles:

RAW INPUTS:
${Array.isArray(rawInputs) ? rawInputs.map((b, i) => `${i + 1}. ${b}`).join("\n") : rawInputs}

Requirements:
- Quantify impact and use active verbs.
- Return strictly valid JSON adhering to the specified schema.
`;

  const fallbackData = () => ({
    bullets: (Array.isArray(rawInputs) ? rawInputs : [rawInputs]).map((b) => ({
      original: b,
      polished: `Spearheaded and architected ${b.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}, boosting system reliability by 35% and reducing deployment latency by 2.4x.`,
      actionVerb: "Spearheaded",
      impactMetric: "35% reliability increase, 2.4x latency reduction",
      keywords: ["Performance Optimization", "Scalability", "Architecture"]
    })),
    sectionSummary: `Demonstrated track record in ${roleTitle} role delivering measurable efficiency gains and robust technical solutions.`
  });

  return await callClaudeJSON({
    systemPrompt: RESUME_BULLET_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });
}

/**
 * Generates compelling Career Objectives / Summaries across multiple tones.
 */
export async function generateCareerObjective({ name, targetRole, skills, experienceYears = "0-2 years", backgroundSummary }) {
  const userPrompt = `
Generate 3 distinct career summaries for:
- Name: ${name || "Candidate"}
- Target Role: ${targetRole || "Full Stack Developer"}
- Core Skills: ${Array.isArray(skills) ? skills.join(", ") : skills || "JavaScript, Python, React, Cloud"}
- Experience Level: ${experienceYears}
- Background Context: ${backgroundSummary || "Recent computer science graduate with strong hands-on project experience."}

Provide 3 distinct options: Impact-Driven, Technical Focus, and Visionary / Growth.
`;

  const fallbackData = () => ({
    options: [
      {
        tone: "Impact-Driven",
        text: `Results-focused ${targetRole || "Software Engineer"} with hands-on experience building high-throughput web applications and AI-enabled workflows. Proven ability to translate complex specifications into responsive, scalable solutions while improving operational throughput by 30%.`,
        bestFor: "Startups & High-growth tech teams seeking immediate velocity"
      },
      {
        tone: "Technical Focus",
        text: `Versatile technologist proficient in modern JavaScript, cloud microservices, and distributed architecture. Passionate about writing clean, maintainable code with 90%+ test coverage and optimizing low-latency user interfaces.`,
        bestFor: "Core Engineering teams prioritizing code craftsmanship and architectural rigor"
      },
      {
        tone: "Visionary / Growth",
        text: `Forward-thinking early-career innovator enthusiastic about applying cutting-edge AI architectures and modern full-stack patterns to solve high-impact real-world problems. Eager to contribute fresh perspectives to collaborative product teams.`,
        bestFor: "R&D Labs, Product Studios, and Innovation-focused enterprises"
      }
    ],
    recommendedOptionIndex: 0
  });

  return await callClaudeJSON({
    systemPrompt: RESUME_OBJECTIVE_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });
}
