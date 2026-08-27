import { callClaudeJSON } from "../utils/anthropicClient.js";
import { LEARNING_ROADMAP_SYSTEM_PROMPT } from "../utils/prompts.js";
import { saveLearningRoadmap } from "../utils/dataService.js";

/**
 * =========================================================================
 * CLAUDE SYSTEM PROMPTS (TUNE HERE)
 * =========================================================================
 */
export const LEARNING_ROADMAP_PROMPT = LEARNING_ROADMAP_SYSTEM_PROMPT;

/**
 * Generates a sequenced, time-boxed learning roadmap and course resource guide.
 */
export async function generateLearningRoadmap({ uid, targetRole = "Full Stack Engineer", skillGaps = [], preferredPace = "Standard (8-10 hrs/wk)" }) {
  const userPrompt = `
Build a personalized, high-yield learning roadmap for an emerging professional targeting "${targetRole}".

IDENTIFIED SKILL GAPS TO REMEDIATE:
${Array.isArray(skillGaps) ? skillGaps.map((g) => `- ${typeof g === "object" ? `${g.skill} (${g.priority || "High"})` : g}`).join("\n") : "Testing, System Design, Cloud Security, CI/CD"}

LEARNING PREFERENCES:
- Target Role: ${targetRole}
- Weekly Commitment: ${preferredPace}

Requirements:
- Sequence into 3 structured phases (Foundations -> Hands-on Implementation -> Capstone Mastery).
- For each phase, provide concrete learning resource recommendations (Topics, Platforms, Difficulty, and Types).
- [INTEGRATION NOTE: Resource objects follow standard OpenCourse/LMS schema for easy plug-in to Coursera/Udemy APIs later].
`;

  const fallbackData = () => ({
    targetRole,
    totalEstimatedDuration: "10-12 Weeks",
    weeklyCommitment: preferredPace,
    phases: [
      {
        phaseNumber: 1,
        timeframe: "Weeks 1-3",
        title: "Core Foundations & Security Hardening",
        focusArea: "Automated Testing & Production Cloud Security",
        keyObjectives: [
          "Master unit testing fundamentals with test runners and assertion libraries",
          "Understand OAuth 2.0 flows, JWT validation, and Firestore security rules"
        ],
        suggestedProjects: [
          "Write a full test suite for a RESTful CRUD API with 85%+ code coverage",
          "Audit and lock down a cloud database with granular security rules"
        ],
        recommendedCourses: [
          {
            title: "JavaScript Testing Mastery: Unit & Integration Patterns",
            platform: "FreeCodeCamp & MDN Guides",
            type: "Interactive Course",
            difficulty: "Beginner",
            estimatedHours: 12,
            description: "Step-by-step guide to writing reliable assertions, mocking network calls, and test automation.",
            urlPlaceholder: "https://www.freecodecamp.org/learn/quality-assurance/"
          },
          {
            title: "Firebase Security Rules & Cloud Auth Architecture",
            platform: "Firebase Official Documentation & Codelabs",
            type: "Guided Project",
            difficulty: "Intermediate",
            estimatedHours: 8,
            description: "Learn how to write role-based security rules and secure serverless backend functions.",
            urlPlaceholder: "https://firebase.google.com/docs/rules"
          }
        ],
        milestoneChecklist: [
          "Complete first automated test suite with passing assertions",
          "Deploy security rules to test environment and verify unauthorized access rejection"
        ]
      },
      {
        phaseNumber: 2,
        timeframe: "Weeks 4-7",
        title: "System Architecture & Scalable Data Pipelines",
        focusArea: "Cloud System Design, Caching, and Query Optimization",
        keyObjectives: [
          "Implement client-side and server-side caching strategies",
          "Design scalable data models and optimize database queries"
        ],
        suggestedProjects: [
          "Build a real-time collaborative workspace with offline-first sync and indexing"
        ],
        recommendedCourses: [
          {
            title: "System Design Primer for Emerging Developers",
            platform: "GitHub Open Source Community",
            type: "Documentation",
            difficulty: "Intermediate",
            estimatedHours: 15,
            description: "Learn fundamental principles of load balancing, caching, asynchronous workers, and database sharding.",
            urlPlaceholder: "https://github.com/donnemartin/system-design-primer"
          },
          {
            title: "Modern Cloud Architecture with Serverless & Edge Workers",
            platform: "Cloudflare & Google Cloud Skills Boost",
            type: "Video Series",
            difficulty: "Intermediate",
            estimatedHours: 10,
            description: "Practical patterns for serverless functions, cold-start reduction, and edge caching.",
            urlPlaceholder: "https://cloud.google.com/training"
          }
        ],
        milestoneChecklist: [
          "Design an architectural diagram for a multi-tenant cloud application",
          "Demonstrate 50% query latency improvement through compound indexing and caching"
        ]
      },
      {
        phaseNumber: 3,
        timeframe: "Weeks 8-12",
        title: "CI/CD Automation & Full-Stack Capstone",
        focusArea: "Production Pipelines and Portfolio Capstone Delivery",
        keyObjectives: [
          "Set up continuous integration and automated deployment pipelines",
          "Build and deploy a flagship full-stack portfolio capstone project"
        ],
        suggestedProjects: [
          "Deploy an end-to-end AI-powered web platform with automated CI/CD checks on every commit"
        ],
        recommendedCourses: [
          {
            title: "GitHub Actions & DevOps for Modern Web Apps",
            platform: "GitHub Skills",
            type: "Interactive Course",
            difficulty: "Intermediate",
            estimatedHours: 8,
            description: "Build robust automation workflows for linting, testing, and continuous deployment.",
            urlPlaceholder: "https://skills.github.com/"
          }
        ],
        milestoneChecklist: [
          "Configure GitHub Actions workflow that triggers tests and auto-deploys to hosting",
          "Publish live capstone showcase with complete documentation and video walkthrough"
        ]
      }
    ],
    capstoneProjectIdea: {
      title: "Real-Time AI Collaborative Studio",
      description: "A full-stack collaborative web app featuring real-time data sync, secure authentication, multi-step AI agent workflows, and automated CI/CD deployment.",
      technologies: ["JavaScript ES Modules", "Firebase Functions", "Cloud Firestore", "Claude AI API", "GitHub Actions"],
      portfolioImpact: "Demonstrates full-stack proficiency, agentic AI orchestration, security rigor, and deployment best practices to recruiters."
    }
  });

  const result = await callClaudeJSON({
    systemPrompt: LEARNING_ROADMAP_PROMPT,
    userPrompt,
    mockFallbackData: fallbackData
  });

  if (uid) {
    try {
      await saveLearningRoadmap(uid, result);
    } catch (saveErr) {
      console.warn(`[CourseRecommender] Could not save to Firestore: ${saveErr.message}`);
    }
  }

  return result;
}
