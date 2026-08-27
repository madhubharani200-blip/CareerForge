import { getFirebaseAdmin } from "./authMiddleware.js";
import { FieldValue } from "firebase-admin/firestore";

export function getDb() {
  const admin = getFirebaseAdmin();
  return admin.firestore();
}

/**
 * Fetch full user profile document
 */
export async function getUserProfile(uid) {
  const db = getDb();
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? { uid, ...doc.data() } : null;
}

/**
 * Update or create user profile document
 */
export async function updateUserProfile(uid, profileData) {
  const db = getDb();
  await db.collection("users").doc(uid).set(
    {
      ...profileData,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
  return getUserProfile(uid);
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(uid) {
  const db = getDb();
  const snap = await db.collection("users").doc(uid).collection("resumes").orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Save or update a resume in users/{uid}/resumes/{resumeId}
 */
export async function saveResume(uid, resumeId, resumeData) {
  const db = getDb();
  const ref = resumeId
    ? db.collection("users").doc(uid).collection("resumes").doc(resumeId)
    : db.collection("users").doc(uid).collection("resumes").doc();

  const dataToSave = {
    ...resumeData,
    updatedAt: FieldValue.serverTimestamp()
  };

  await ref.set(dataToSave, { merge: true });
  return { id: ref.id, ...dataToSave };
}

/**
 * Get all portfolios for a user
 */
export async function getUserPortfolios(uid) {
  const db = getDb();
  const snap = await db.collection("users").doc(uid).collection("portfolios").orderBy("updatedAt", "desc").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Save or update a portfolio
 */
export async function savePortfolio(uid, portfolioId, portfolioData) {
  const db = getDb();
  const ref = portfolioId
    ? db.collection("users").doc(uid).collection("portfolios").doc(portfolioId)
    : db.collection("users").doc(uid).collection("portfolios").doc();

  const dataToSave = {
    ...portfolioData,
    updatedAt: FieldValue.serverTimestamp()
  };

  await ref.set(dataToSave, { merge: true });
  return { id: ref.id, ...dataToSave };
}

/**
 * Save Career Recommendations
 */
export async function saveCareerRecommendations(uid, recData) {
  const db = getDb();
  const ref = db.collection("users").doc(uid).collection("careerRecommendations").doc();
  const data = {
    ...recData,
    createdAt: FieldValue.serverTimestamp()
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

/**
 * Save Skill Gap Report
 */
export async function saveSkillGapReport(uid, reportData) {
  const db = getDb();
  const ref = db.collection("users").doc(uid).collection("skillGapReports").doc();
  const data = {
    ...reportData,
    createdAt: FieldValue.serverTimestamp()
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

/**
 * Save Learning Roadmap
 */
export async function saveLearningRoadmap(uid, roadmapData) {
  const db = getDb();
  const ref = db.collection("users").doc(uid).collection("learningRoadmaps").doc();
  const data = {
    ...roadmapData,
    createdAt: FieldValue.serverTimestamp()
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

/**
 * Save Resume Scan
 */
export async function saveResumeScan(uid, scanData) {
  const db = getDb();
  const ref = db.collection("users").doc(uid).collection("resumeScans").doc();
  const data = {
    ...scanData,
    createdAt: FieldValue.serverTimestamp()
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

/**
 * Save Agent Run snapshot
 */
export async function saveAgentRun(uid, runData) {
  const db = getDb();
  const ref = db.collection("users").doc(uid).collection("agentRuns").doc();
  const data = {
    ...runData,
    timestamp: FieldValue.serverTimestamp()
  };
  await ref.set(data);
  return { id: ref.id, ...data };
}

/**
 * Get latest agent run snapshot for comparison
 */
export async function getLatestAgentRun(uid) {
  const db = getDb();
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("agentRuns")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Fetch full career dossier for a user (Profile + Latest Resume + Latest Portfolio)
 */
export async function getFullUserDossier(uid) {
  const [profile, resumes, portfolios] = await Promise.all([
    getUserProfile(uid),
    getUserResumes(uid),
    getUserPortfolios(uid)
  ]);

  return {
    profile: profile || {},
    latestResume: resumes.length > 0 ? resumes[0] : null,
    latestPortfolio: portfolios.length > 0 ? portfolios[0] : null
  };
}
