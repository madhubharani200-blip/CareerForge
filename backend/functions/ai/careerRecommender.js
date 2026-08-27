import { callClaudeJSON } from "../utils/anthropicClient.js";
import { CAREER_RECOMMENDATION_SYSTEM_PROMPT } from "../utils/prompts.js";
import { saveCareerRecommendations } from "../utils/dataService.js";

/**
 * =========================================================================
 * CLAUDE SYSTEM PROMPTS (TUNE HERE)
 * =========================================================================
 */
export const CAREER_RECOMMENDATION_PROMPT = CAREER_RECOMMENDATION_SYSTEM_PROMPT;

/**
 * Analyzes profile, resume, and interests to generate personalized, ranked career paths.
 */
export async function recommendCareerPaths({ uid, profile, resume, interests }) {
  const userPrompt = `
Analyze the candidate's background and recommend the top 4-5 career trajectories:

CANDIDATE DOSSIER:
- Name: ${profile?.displayName || "Candidate"}
- Target Role: ${profile?.targetRole || "Software Engineering / Tech"}
- Skills: ${Array.isArray(profile?.skills) ? profile.skills.map((s) => (typeof s === "object" ? s.name : s)).join(", ") : "JavaScript, HTML/CSS, Git, Python"}
- Education: ${JSON.stringify(profile?.education || "Undergraduate in Computer Science / IT")}
- Interests & Passions: ${profile?.interests || interests || "Web Development, Cloud Computing, AI Automation"}
- Recent Projects: ${JSON.stringify(resume?.projects || profile?.projects || "Modern responsive web applications")}

Provide a ranked list of career paths with quantitative fit scores, market outlooks, salary ranges, and detailed rationales.
`;

  const fallbackData = () => ({
    topRecommendedRole: "Full Stack Software Engineer",
    executiveSummary: "Your combination of modern JavaScript proficiency, problem-solving aptitude, and project-driven background positions you strongly for high-growth full-stack and cloud-native software roles.",
    careerPaths: [
      {
        id: "full-stack-engineer",
        roleTitle: "Full Stack Software Engineer",
        fitScore: 94,
        marketDemand: "Very High",
        salaryRange: "$85,000 - $130,000",
        matchRationale: "Direct alignment with your hands-on JavaScript, API development, and responsive UI building capabilities.",
        keyStrengths: ["Frontend reactivity", "RESTful API integration", "Modern toolchain fluency"],
        growthOutlook: "Projected 25% growth over the next decade with high demand across both startups and enterprise tech.",
        coreSkillRequirements: ["TypeScript/JavaScript", "React/Next.js or Vanilla Web Standards", "Node.js Cloud Functions", "SQL & NoSQL Databases"],
        dayInTheLife: "Building end-to-end user features, collaborating with product managers, writing automated tests, and optimizing cloud deployment pipelines."
      },
      {
        id: "ai-solutions-engineer",
        roleTitle: "AI Solutions & Applications Engineer",
        fitScore: 88,
        marketDemand: "Explosive",
        salaryRange: "$95,000 - $145,000",
        matchRationale: "Your interest in agentic workflows and LLM orchestration positions you well for the surging wave of generative AI application development.",
        keyStrengths: ["Prompt engineering", "API-first architecture", "System integration"],
        growthOutlook: "Explosive market expansion as companies embed AI agents and RAG pipelines into core product offerings.",
        coreSkillRequirements: ["Python / Node.js", "Anthropic / OpenAI API Integration", "Vector Databases", "Prompt Engineering & Evaluation"],
        dayInTheLife: "Orchestrating multi-step LLM pipelines, fine-tuning retrieval accuracy, and creating intuitive user experiences for AI agents."
      },
      {
        id: "frontend-engineer",
        roleTitle: "Frontend / UI-UX Engineer",
        fitScore: 85,
        marketDemand: "High",
        salaryRange: "$80,000 - $120,000",
        matchRationale: "Strong command of UI aesthetics, design systems, and client-side performance.",
        keyStrengths: ["Modern CSS/Animation", "Responsive Layouts", "Accessibility (a11y)"],
        growthOutlook: "Continuous demand for engineers who bridge design fidelity and engineering rigor.",
        coreSkillRequirements: ["Semantic HTML5", "Advanced CSS3 & Tokens", "State Management", "Performance Profiling"],
        dayInTheLife: "Implementing pixel-perfect design systems, creating micro-interactions, and optimizing web vitals."
      },
      {
        id: "cloud-devops-engineer",
        roleTitle: "Cloud Platform & DevOps Associate",
        fitScore: 78,
        marketDemand: "Very High",
        salaryRange: "$90,000 - $135,000",
        matchRationale: "Solid grasp of serverless backends and cloud infrastructure like Firebase and Google Cloud.",
        keyStrengths: ["Serverless functions", "Database modeling", "CI/CD awareness"],
        growthOutlook: "Critical role as organizations migrate to automated serverless environments.",
        coreSkillRequirements: ["GCP / AWS / Firebase", "Docker & CI/CD Pipelines", "Infrastructure as Code", "Observability & Monitoring"],
        dayInTheLife: "Automating build and release pipelines, monitoring cloud function latencies, and enforcing security policies."
      }
    ]
  });

  const result = await callClaudeJSON({
    systemPrompt: CAREER_RECOMMENDATION_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });

  if (uid) {
    try {
      await saveCareerRecommendations(uid, result);
    } catch (saveErr) {
      console.warn(`[CareerRecommender] Could not save to Firestore: ${saveErr.message}`);
    }
  }

  return result;
}
