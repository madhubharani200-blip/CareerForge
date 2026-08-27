/**
 * CAREER & SKILLS API WRAPPER
 */

import { callBackendApi } from "./client.js";
import { db } from "../firebase-config.js";
import { collection, doc, getDocs, setDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Fetch or generate Career Recommendations
 */
export async function getCareerRecommendations(params) {
  const result = await callBackendApi("ai/career-recommendations", params);
  
  if (params.uid) {
    localStorage.setItem(`career_recs_${params.uid}`, JSON.stringify(result));
  }
  return result;
}

/**
 * Fetch or generate Skill Gap Analysis
 */
export async function getSkillGapAnalysis(params) {
  const result = await callBackendApi("ai/skill-gap", params);
  if (params.uid) {
    localStorage.setItem(`skill_gap_${params.uid}`, JSON.stringify(result));
  }
  return result;
}

/**
 * Fetch or generate Personalized Learning Roadmap
 */
export async function getLearningRoadmap(params) {
  const result = await callBackendApi("ai/learning-roadmap", params);
  if (params.uid) {
    localStorage.setItem(`learning_roadmap_${params.uid}`, JSON.stringify(result));
  }
  return result;
}

/**
 * Get cached career recommendations from local storage or Firestore
 */
export function getCachedCareerRecommendations(uid) {
  const cached = localStorage.getItem(`career_recs_${uid}`);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Get cached skill gap report
 */
export function getCachedSkillGap(uid) {
  const cached = localStorage.getItem(`skill_gap_${uid}`);
  return cached ? JSON.parse(cached) : null;
}

/**
 * Get cached learning roadmap
 */
export function getCachedRoadmap(uid) {
  const cached = localStorage.getItem(`learning_roadmap_${uid}`);
  return cached ? JSON.parse(cached) : null;
}
