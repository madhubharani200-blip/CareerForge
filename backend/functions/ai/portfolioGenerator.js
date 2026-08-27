import { callClaudeJSON } from "../utils/anthropicClient.js";
import { PORTFOLIO_PROJECT_SYSTEM_PROMPT, PORTFOLIO_ABOUT_ME_SYSTEM_PROMPT } from "../utils/prompts.js";

/**
 * =========================================================================
 * CLAUDE SYSTEM PROMPTS (TUNE HERE)
 * =========================================================================
 */
export const PORTFOLIO_PROJECT_PROMPT = PORTFOLIO_PROJECT_SYSTEM_PROMPT;
export const PORTFOLIO_ABOUT_ME_PROMPT = PORTFOLIO_ABOUT_ME_SYSTEM_PROMPT;

/**
 * Generates an executive case-study project narrative for a portfolio item
 */
export async function generateProjectStory({ title, rawDescription, techStack, roleOrContribution, metrics }) {
  const userPrompt = `
Generate a compelling portfolio project case study for:
- Project Title: ${title}
- Tech Stack: ${Array.isArray(techStack) ? techStack.join(", ") : techStack || "Modern Full-Stack"}
- Raw Description: ${rawDescription}
- User's Role/Contribution: ${roleOrContribution || "Lead Developer"}
- Key Outcomes / Metrics: ${metrics || "High user engagement and performant response times"}

Structure as: Problem -> Solution Architecture -> Key Highlights.
`;

  const fallbackData = () => ({
    headline: `Engineered ${title} to solve modern workflow bottlenecks with high scalability`,
    overview: rawDescription || `${title} is a performant, modern platform designed to streamline complex digital workflows through intuitive interface design and resilient cloud services.`,
    problemStatement: `Modern users frequently struggle with fragmented tools and slow turnaround cycles. This project addressed the lack of unified, responsive workflow automation.`,
    solutionArchitecture: `Architected a decoupled modular system leveraging ${Array.isArray(techStack) ? techStack.join(", ") : techStack || "modern JavaScript & Cloud APIs"}, implementing asynchronous state sync and sub-100ms response latencies.`,
    keyHighlights: [
      `Implemented end-to-end type-safe API communication and secure authentication.`,
      `Optimized client-side rendering pipeline to achieve 98+ Lighthouse performance score.`,
      `Designed automated test workflows ensuring 95%+ core pathway reliability.`
    ],
    recommendedTags: Array.isArray(techStack) ? techStack : ["Full Stack", "Cloud Services", "API Design", "UI/UX"],
    callToAction: "Explore the live demo or view the source repository on GitHub."
  });

  return await callClaudeJSON({
    systemPrompt: PORTFOLIO_PROJECT_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });
}

/**
 * Generates a polished, authentic personal "About Me" story
 */
export async function generatePortfolioAboutMe({ name, targetRole, education, skills, interests, philosophy }) {
  const userPrompt = `
Create an engaging, authentic "About Me" portfolio summary for:
- Name: ${name || "Emerging Professional"}
- Target Specialty: ${targetRole || "Software Engineer & Product Builder"}
- Academic / Background: ${education || "Computer Science Graduate"}
- Skills & Passions: ${Array.isArray(skills) ? skills.join(", ") : skills}
- Interests: ${interests || "AI workflows, open source, developer tooling"}
- Personal Philosophy: ${philosophy || "Building technology that empowers people to learn and achieve more."}
`;

  const fallbackData = () => ({
    heroTagline: `Building intuitive, scalable digital experiences that bridge human creativity and intelligent systems.`,
    shortBio: `I am an ambitious ${targetRole || "Full Stack Developer"} driven by curiosity and clean design. With a foundation in ${education || "modern computing"}, I specialize in turning ambiguous technical challenges into elegant, production-grade applications.`,
    detailedStory: `My journey into tech began with a deep curiosity about how systems connect. Over the past several years, I have immersed myself in full-stack architecture, AI integrations, and responsive UI engineering. Whether crafting frictionless user journeys or optimizing backend cloud functions, I believe great software is where precision engineering meets empathetic user experience.`,
    corePillars: [
      {
        title: "Craftsmanship & Clean Code",
        description: "Writing maintainable, well-documented, and resilient code that scales effortlessly.",
        icon: "code"
      },
      {
        title: "User-Centric Empathy",
        description: "Designing interfaces that feel seamless, accessible, and delightfully intuitive.",
        icon: "heart"
      },
      {
        title: "Continuous Curiosity",
        description: "Constantly experimenting with emerging tools, AI architectures, and modern cloud paradigms.",
        icon: "sparkles"
      }
    ],
    philosophyQuote: `"Great software is invisible—it simply empowers people to do their best work without friction."`
  });

  return await callClaudeJSON({
    systemPrompt: PORTFOLIO_ABOUT_ME_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });
}
