import { callClaudeJSON } from "../utils/anthropicClient.js";
import { SKILL_GAP_SYSTEM_PROMPT } from "../utils/prompts.js";
import { saveSkillGapReport } from "../utils/dataService.js";

/**
 * =========================================================================
 * CLAUDE SYSTEM PROMPTS (TUNE HERE)
 * =========================================================================
 */
export const SKILL_GAP_PROMPT = SKILL_GAP_SYSTEM_PROMPT;

/**
 * Evaluates skill gaps between user's profile and a target job role.
 */
export async function analyzeSkillGaps({ uid, targetRole = "Full Stack Developer", currentSkills = [], experienceLevel = "Entry-Level" }) {
  const userPrompt = `
Perform a detailed skill gap audit for:
- Target Role: ${targetRole}
- Experience Benchmark: ${experienceLevel}
- Current Candidate Skills: ${Array.isArray(currentSkills) ? currentSkills.map((s) => (typeof s === "object" ? `${s.name} (${s.level || "Intermediate"})` : s)).join(", ") : currentSkills}

Identify matched proficiencies and highlight missing or under-developed skills across Critical, High, and Medium priorities.
`;

  const fallbackData = () => ({
    targetRole,
    overallReadinessScore: 76,
    summary: `You possess strong foundational capabilities for ${targetRole}, particularly in client-side development and API consumption. Bridging key gaps in automated testing, cloud database indexing, and CI/CD pipelines will make you highly competitive for top-tier opportunities.`,
    matchedSkills: [
      { skill: "JavaScript (ES6+)", currentLevel: "Advanced", strengthAssessment: "Solid mastery of modern asynchronous patterns, DOM manipulation, and modular architecture." },
      { skill: "HTML5 / Responsive CSS", currentLevel: "Advanced", strengthAssessment: "Proficient in flexbox, CSS grid, and modern aesthetic design systems." },
      { skill: "RESTful API Integration", currentLevel: "Intermediate", strengthAssessment: "Effective client-server communication and JSON payload processing." },
      { skill: "Git & GitHub", currentLevel: "Intermediate", strengthAssessment: "Comfortable with branching, commits, pull requests, and collaboration." }
    ],
    skillGaps: [
      {
        skill: "Automated Testing (Unit & Integration)",
        category: "Technical",
        currentLevel: "Beginner",
        requiredLevel: "Intermediate",
        priority: "Critical",
        gapDescription: "Modern engineering teams expect familiarity with test-driven workflows and automated test suites.",
        actionPlan: "Build unit tests for your core utility functions using Jest or Vitest and practice mock API assertions.",
        estimatedTimeToBridge: "2 weeks"
      },
      {
        skill: "Cloud Security & Authentication Rules",
        category: "Architecture",
        currentLevel: "Beginner",
        requiredLevel: "Intermediate",
        priority: "Critical",
        gapDescription: "Critical for ensuring production-ready Firestore and API security scopes.",
        actionPlan: "Deep-dive into role-based security rules and OAuth 2.0 token verification flows.",
        estimatedTimeToBridge: "1-2 weeks"
      },
      {
        skill: "System Design & Caching Patterns",
        category: "Architecture",
        currentLevel: "Missing",
        requiredLevel: "Intermediate",
        priority: "High",
        gapDescription: "Understanding cache invalidation, CDN edge routing, and database indexing strategies.",
        actionPlan: "Study common client-side caching strategies (Service Workers, IndexedDB, HTTP headers) and Firestore compound indexes.",
        estimatedTimeToBridge: "3 weeks"
      },
      {
        skill: "CI/CD & Deployment Automation",
        category: "Tools",
        currentLevel: "Beginner",
        requiredLevel: "Intermediate",
        priority: "Medium",
        gapDescription: "Automating deployment pipelines through GitHub Actions.",
        actionPlan: "Set up a GitHub Actions workflow to run linter checks and deploy to Firebase Hosting on push.",
        estimatedTimeToBridge: "1 week"
      }
    ],
    readinessBreakdown: {
      technical: 80,
      practicalProjects: 75,
      systemDesign: 60,
      toolsAndCloud: 65
    }
  });

  const result = await callClaudeJSON({
    systemPrompt: SKILL_GAP_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });

  if (uid) {
    try {
      await saveSkillGapReport(uid, result);
    } catch (saveErr) {
      console.warn(`[SkillGapAnalyzer] Could not save to Firestore: ${saveErr.message}`);
    }
  }

  return result;
}
