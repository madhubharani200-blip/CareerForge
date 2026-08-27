/**
 * RESUME API WRAPPER
 */

import { callBackendApi } from "./client.js";
import { db } from "../firebase-config.js";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Generate polished bullet points from raw notes
 */
export async function generateAIBullets(params) {
  return await callBackendApi("ai/resume-bullets", params);
}

/**
 * Generate career summary/objective
 */
export async function generateAIObjective(params) {
  return await callBackendApi("ai/career-objective", params);
}

/**
 * Audit / scan resume against ATS criteria
 */
export async function scanResumeWithAI(params) {
  return await callBackendApi("ai/analyze-resume", params);
}

/**
 * Save resume document to Firestore: users/{uid}/resumes/{resumeId}
 */
export async function saveResumeDoc(uid, resumeId, resumeData) {
  const localKey = `user_resumes_${uid}`;
  const existingResumes = JSON.parse(localStorage.getItem(localKey) || "[]");

  const id = resumeId || "res_" + Date.now();
  const savedData = {
    id,
    ...resumeData,
    updatedAt: new Date().toISOString()
  };

  // Save to Firestore if available
  try {
    if (db && uid) {
      const resumeRef = doc(db, "users", uid, "resumes", id);
      await setDoc(resumeRef, {
        ...resumeData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.warn("[Resume API] Firestore save notice:", err.message);
  }

  // Update local storage cache
  const idx = existingResumes.findIndex((r) => r.id === id);
  if (idx >= 0) {
    existingResumes[idx] = savedData;
  } else {
    existingResumes.unshift(savedData);
  }
  localStorage.setItem(localKey, JSON.stringify(existingResumes));

  return savedData;
}

/**
 * Get all user resumes
 */
export async function getUserResumes(uid) {
  const localKey = `user_resumes_${uid}`;
  const localList = JSON.parse(localStorage.getItem(localKey) || "[]");

  try {
    if (db && uid) {
      const resumesRef = collection(db, "users", uid, "resumes");
      const q = query(resumesRef, orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    }
  } catch (err) {
    console.warn("[Resume API] Firestore read notice:", err.message);
  }

  return localList;
}

/**
 * Get a specific resume by ID
 */
export async function getResumeById(uid, resumeId) {
  try {
    if (db && uid && resumeId) {
      const resumeRef = doc(db, "users", uid, "resumes", resumeId);
      const snap = await getDoc(resumeRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    }
  } catch (err) {
    console.warn("[Resume API] Firestore getDoc notice:", err.message);
  }

  const list = JSON.parse(localStorage.getItem(`user_resumes_${uid}`) || "[]");
  return list.find((r) => r.id === resumeId) || null;
}
