import { onRequest, onCall, HttpsError } from "firebase-functions/v2/https";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// AI Modules
import { generateResumeBullets, generateCareerObjective } from "./ai/resumeGenerator.js";
import { generateProjectStory, generatePortfolioAboutMe } from "./ai/portfolioGenerator.js";
import { improveContent } from "./ai/contentAssistant.js";
import { recommendCareerPaths } from "./ai/careerRecommender.js";
import { analyzeSkillGaps } from "./ai/skillGapAnalyzer.js";
import { generateLearningRoadmap } from "./ai/courseRecommender.js";
import { analyzeResumeContent } from "./ai/resumeAnalyzer.js";

// Agent Orchestration
import { runCareerAgent as runCareerAgentPipeline } from "./agents/careerAgent.js";

// Data Privacy & Auth
import { authenticateRequest } from "./utils/authMiddleware.js";
import { deleteUserAccountData } from "./utils/userDataCleaner.js";

const corsHandler = cors({ origin: true });

/**
 * Helper to handle errors gracefully across all endpoints
 */
function handleApiError(res, error) {
  console.error("[API Error]", error);
  return res.status(500).json({
    success: false,
    error: error.message || "Internal server error",
    timestamp: new Date().toISOString()
  });
}

/**
 * =========================================================================
 * 1. UNIFIED HTTP API ROUTER (REST-style /api endpoint)
 * =========================================================================
 */
export const api = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  return corsHandler(req, res, async () => {
    try {
      const path = req.path.replace(/^\/+/, "");
      let user = null;

      // Allow preflight OPTIONS
      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      // Check auth for protected routes
      try {
        user = await authenticateRequest(req);
      } catch (authErr) {
        // Fallback for public requests if permitted or return 401
        console.warn(`[API Auth Warning] ${authErr.message}`);
      }

      const uid = user?.uid || req.body?.uid || req.query?.uid;

      // Route Dispatcher
      switch (path) {
        // Module 3: Resume Bullets & Objective
        case "ai/resume-bullets": {
          const result = await generateResumeBullets(req.body);
          return res.json({ success: true, data: result });
        }
        case "ai/career-objective": {
          const result = await generateCareerObjective(req.body);
          return res.json({ success: true, data: result });
        }

        // Module 4: Portfolio Story & About Me
        case "ai/project-story": {
          const result = await generateProjectStory(req.body);
          return res.json({ success: true, data: result });
        }
        case "ai/portfolio-about-me": {
          const result = await generatePortfolioAboutMe(req.body);
          return res.json({ success: true, data: result });
        }

        // Module 5: Content Assistant
        case "ai/improve-content": {
          const result = await improveContent(req.body);
          return res.json({ success: true, data: result });
        }

        // Module 6: Career Recommendation
        case "ai/career-recommendations": {
          const result = await recommendCareerPaths({ uid, ...req.body });
          return res.json({ success: true, data: result });
        }

        // Module 7: Skill Gap Analysis
        case "ai/skill-gap": {
          const result = await analyzeSkillGaps({ uid, ...req.body });
          return res.json({ success: true, data: result });
        }

        // Module 8: Learning Roadmap
        case "ai/learning-roadmap": {
          const result = await generateLearningRoadmap({ uid, ...req.body });
          return res.json({ success: true, data: result });
        }

        // Module 9: Resume Analysis
        case "ai/analyze-resume": {
          const result = await analyzeResumeContent({ uid, ...req.body });
          return res.json({ success: true, data: result });
        }

        // Agentic Layer: 8-Step Career Agent Pipeline
        case "agent/run": {
          if (!uid) {
            return res.status(401).json({ success: false, error: "Authentication required to run Career Agent." });
          }
          const result = await runCareerAgentPipeline({ uid, triggerSource: req.body?.triggerSource || "http" });
          return res.json({ success: true, data: result });
        }

        // Privacy & GDPR: Delete My Data
        case "user/delete-my-data": {
          if (!uid) {
            return res.status(401).json({ success: false, error: "Authentication required to delete data." });
          }
          const result = await deleteUserAccountData(uid);
          return res.json({ success: true, data: result });
        }

        default:
          return res.status(404).json({
            success: false,
            error: `API Route not found: ${path}`,
            availableRoutes: [
              "ai/resume-bullets",
              "ai/career-objective",
              "ai/project-story",
              "ai/portfolio-about-me",
              "ai/improve-content",
              "ai/career-recommendations",
              "ai/skill-gap",
              "ai/learning-roadmap",
              "ai/analyze-resume",
              "agent/run",
              "user/delete-my-data"
            ]
          });
      }
    } catch (error) {
      return handleApiError(res, error);
    }
  });
});

/**
 * =========================================================================
 * 2. CALLABLE FUNCTIONS (for direct Firebase Client SDK onCall invocation)
 * =========================================================================
 */
export const runCareerAgent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to run the Career Agent.");
  }
  try {
    return await runCareerAgentPipeline({
      uid: request.auth.uid,
      triggerSource: request.data?.triggerSource || "callable"
    });
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});

export const deleteMyData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to delete your account data.");
  }
  try {
    return await deleteUserAccountData(request.auth.uid);
  } catch (error) {
    throw new HttpsError("internal", error.message);
  }
});
