import { callClaudeJSON } from "../utils/anthropicClient.js";
import { RESUME_ANALYZER_SYSTEM_PROMPT } from "../utils/prompts.js";
import { saveResumeScan } from "../utils/dataService.js";

/**
 * =========================================================================
 * CLAUDE SYSTEM PROMPTS (TUNE HERE)
 * =========================================================================
 */
export const RESUME_ANALYZER_PROMPT = RESUME_ANALYZER_SYSTEM_PROMPT;

/**
 * Evaluates a full resume against modern ATS algorithms and hiring manager standards.
 */
export async function analyzeResumeContent({ uid, resumeId, resumeData, targetRole = "Software Engineer" }) {
  const userPrompt = `
Conduct an in-depth ATS and Hiring Manager audit for this resume targeting "${targetRole}":

RESUME CONTENT:
${typeof resumeData === "object" ? JSON.stringify(resumeData, null, 2) : resumeData}

Evaluate across:
1. ATS Score & Parsing Viability
2. Quantified Impact & Strong Action Verbs (XYZ formula)
3. Keyword Matching for ${targetRole}
4. Clarity, Formatting & Brevity
`;

  const fallbackData = () => ({
    overallScore: 84,
    tier: "Competitive",
    scores: {
      atsCompatibility: 90,
      impactAndMetrics: 78,
      keywordDensity: 82,
      clarityAndBrevity: 86
    },
    executiveSummary: `Solid resume foundation with clear structure and strong technical competencies. To reach the top 5% of applicants, convert general project descriptions into quantified impact metrics (e.g. percentages, latencies, user counts).`,
    strengths: [
      "Clean section hierarchy easily parseable by standard ATS parsers.",
      "Clear technical stack tags matching contemporary software requirements.",
      "Strong foundational project links demonstrating actual code outputs."
    ],
    criticalWeaknesses: [
      "Several bullet points lack quantified impact metrics (how much, how fast, how many users).",
      "Action verbs in older experience entries are passive ('worked on', 'helped with').",
      "Missing critical cloud architecture keywords (e.g. CI/CD, Containerization, Automated Testing)."
    ],
    missingKeywords: [
      "CI/CD Pipelines",
      "Unit Testing / Integration Testing",
      "Cloud Infrastructure (Firebase/GCP/AWS)",
      "Performance Optimization",
      "System Architecture"
    ],
    lineByLineImprovements: [
      {
        section: "Experience",
        currentSnippet: "Built web features and fixed bugs for the team application.",
        suggestedFix: "Architected and delivered 6 responsive user features, resolving 25+ critical bugs and reducing sprint backlog cycle time by 20%.",
        rationale: "Quantifies team output, demonstrates proactive resolution, and uses strong action verb 'Architected'."
      },
      {
        section: "Projects",
        currentSnippet: "Made a website using HTML, CSS and JavaScript with Firebase.",
        suggestedFix: "Engineered a production-ready web application using modular ES6+ JavaScript and Firebase serverless backend, achieving 99.9% uptime and sub-150ms query responses.",
        rationale: "Elevates technical vocabulary and emphasizes performance benchmarks."
      }
    ],
    quickWins: [
      "Replace 'Responsible for' with active verbs like 'Spearheaded', 'Engineered', or 'Orchestrated'.",
      "Add a dedicated 'Key Technologies' bar in each project entry.",
      "Incorporate at least 2 measurable business or technical metrics per experience entry."
    ]
  });

  const result = await callClaudeJSON({
    systemPrompt: RESUME_ANALYZER_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });

  if (uid) {
    try {
      await saveResumeScan(uid, { resumeId, ...result });
    } catch (saveErr) {
      console.warn(`[ResumeAnalyzer] Could not save to Firestore: ${saveErr.message}`);
    }
  }

  return result;
}
