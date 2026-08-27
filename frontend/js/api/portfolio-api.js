/**
 * PORTFOLIO API WRAPPER
 */

import { callBackendApi } from "./client.js";
import { db } from "../firebase-config.js";
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/**
 * Generate project story narrative
 */
export async function generateAIProjectStory(params) {
  return await callBackendApi("ai/project-story", params);
}

/**
 * Generate About Me story
 */
export async function generateAIAboutMe(params) {
  return await callBackendApi("ai/portfolio-about-me", params);
}

/**
 * Save portfolio document to Firestore: users/{uid}/portfolios/{portfolioId}
 */
export async function savePortfolioDoc(uid, portfolioId, portfolioData) {
  const localKey = `user_portfolios_${uid}`;
  const existing = JSON.parse(localStorage.getItem(localKey) || "[]");

  const id = portfolioId || "port_" + Date.now();
  const savedData = {
    id,
    uid,
    ...portfolioData,
    updatedAt: new Date().toISOString()
  };

  // 1. Try Firestore in user's portfolios subcollection & publicPortfolios collection
  try {
    if (db && uid && uid !== "demo_user") {
      const portRef = doc(db, "users", uid, "portfolios", id);
      await setDoc(portRef, {
        ...portfolioData,
        uid,
        updatedAt: serverTimestamp()
      }, { merge: true });

      const pubRef = doc(db, "publicPortfolios", uid);
      await setDoc(pubRef, {
        ...portfolioData,
        uid,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.warn("[Portfolio API] Firestore save notice:", err.message);
  }

  // Also save in public portfolio cache and last saved cache for instant standalone link sharing
  localStorage.setItem(`public_portfolio_${uid}`, JSON.stringify(savedData));
  localStorage.setItem("cf_last_saved_portfolio", JSON.stringify(savedData));

  const idx = existing.findIndex((p) => p.id === id);
  if (idx >= 0) {
    existing[idx] = savedData;
  } else {
    existing.unshift(savedData);
  }
  localStorage.setItem(localKey, JSON.stringify(existing));

  return savedData;
}

/**
 * Get all portfolios for a user
 */
export async function getUserPortfolios(uid) {
  const localKey = `user_portfolios_${uid}`;
  const localList = JSON.parse(localStorage.getItem(localKey) || "[]");

  try {
    if (db && uid && uid !== "demo_user") {
      const colRef = collection(db, "users", uid, "portfolios");
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    }
  } catch (err) {
    console.warn("[Portfolio API] Firestore read notice:", err.message);
  }

  return localList;
}

/**
 * Encode portfolio data into URL-safe Base64 token (Supports Full UTF-8, Emojis, and Special Characters)
 */
export function encodePortfolioPayload(data) {
  try {
    if (!data) return "";
    const payload = { ...data };
    // Keep URL compact if photo is a huge inline base64 string (>200 chars)
    if (payload.photoURL && payload.photoURL.startsWith("data:") && payload.photoURL.length > 200) {
      delete payload.photoURL;
    }
    const jsonStr = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    // Make URL safe: replace + with -, / with _, remove =
    return encodeURIComponent(base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
  } catch (e) {
    console.warn("[Portfolio API] Payload encode notice:", e);
    return "";
  }
}

/**
 * Decode portfolio data from URL-safe Base64 token (Supports Full UTF-8)
 */
export function decodePortfolioPayload(token) {
  try {
    if (!token) return null;
    let base64 = decodeURIComponent(token).replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn("[Portfolio API] Payload decode notice:", e);
    return null;
  }
}

/**
 * Fetch public portfolio data by uid or direct data token (Cross-browser & unauthenticated support)
 */
export async function getPublicPortfolio(uid, token = null) {
  let result = null;

  // 1. If payload token is present in URL, decode immediately
  if (token) {
    const decoded = decodePortfolioPayload(token);
    if (decoded) {
      result = decoded;
    }
  }

  // 2. Fetch from Firestore if configured
  if (!result && uid && uid !== "demo_user") {
    try {
      if (db) {
        const pubDocRef = doc(db, "publicPortfolios", uid);
        const pubSnap = await getDoc(pubDocRef);
        if (pubSnap.exists()) {
          result = { id: pubSnap.id, ...pubSnap.data() };
        } else {
          const colRef = collection(db, "users", uid, "portfolios");
          const snap = await getDocs(colRef);
          if (!snap.empty) {
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            result = docs.find((p) => p.isPublished) || docs[0];
          }
        }
      }
    } catch (err) {
      console.warn("[Portfolio API] Public fetch error:", err.message);
    }
  }

  // 3. Check local cache
  if (!result && uid && uid !== "demo_user") {
    try {
      const cached = localStorage.getItem(`public_portfolio_${uid}`);
      if (cached) result = JSON.parse(cached);
      
      if (!result) {
        const userPorts = JSON.parse(localStorage.getItem(`user_portfolios_${uid}`) || "[]");
        if (userPorts.length > 0) result = userPorts[0];
      }
    } catch (e) {}
  }

  // Fallback to local profile photo if omitted from token
  if (result && !result.photoURL && uid) {
    try {
      const prof = JSON.parse(localStorage.getItem(`user_profile_${uid}`) || localStorage.getItem("cf_user_profile") || "{}");
      if (prof.photoURL) result.photoURL = prof.photoURL;
    } catch {}
  }

  // 4. Fallback: check any saved user portfolio in localStorage
  if (!result) {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("public_portfolio_")) {
        try {
          const data = JSON.parse(localStorage.getItem(k));
          if (data) return data;
        } catch {}
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("user_portfolios_")) {
        try {
          const data = JSON.parse(localStorage.getItem(k));
          if (Array.isArray(data) && data.length > 0) return data[0];
        } catch {}
      }
    }
  }

  return result;
}

/**
 * Save recruiter contact inquiry to Firebase Firestore and local cache
 */
export async function saveContactInquiry(candidateUid, inquiryData) {
  const inquiryId = "inq_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const payload = {
    id: inquiryId,
    candidateUid: candidateUid || "demo_user",
    ...inquiryData,
    status: "unread",
    createdAt: new Date().toISOString()
  };

  // 1. Save in local cache first for instant cross-session & offline availability
  try {
    const key = `contact_inquiries_${candidateUid}`;
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    list.unshift(payload);
    localStorage.setItem(key, JSON.stringify(list));
    
    // Also save in a global inquiries cache so candidate can access across profiles
    const globalKey = "cf_all_contact_inquiries";
    const allList = JSON.parse(localStorage.getItem(globalKey) || "[]");
    allList.unshift(payload);
    localStorage.setItem(globalKey, JSON.stringify(allList));
  } catch (e) {}

  // 2. Try Firestore in candidate's inquiries subcollection
  try {
    if (db && candidateUid && candidateUid !== "demo_user") {
      const inqRef = doc(db, "users", candidateUid, "inquiries", inquiryId);
      await setDoc(inqRef, {
        ...payload,
        timestamp: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.warn("[Portfolio API] Firestore inquiry notice (saved to local cache):", err.message);
  }

  return payload;
}

/**
 * Get all contact inquiries for a candidate
 */
export async function getCandidateInquiries(candidateUid) {
  const key = `contact_inquiries_${candidateUid}`;
  let localList = JSON.parse(localStorage.getItem(key) || "[]");

  // Also check global inquiries cache
  try {
    const globalKey = "cf_all_contact_inquiries";
    const allList = JSON.parse(localStorage.getItem(globalKey) || "[]");
    const matching = allList.filter((i) => i.candidateUid === candidateUid || !candidateUid || candidateUid === "demo_user");
    if (matching.length > localList.length) {
      localList = matching;
    }
  } catch {}

  try {
    if (db && candidateUid && candidateUid !== "demo_user") {
      const colRef = collection(db, "users", candidateUid, "inquiries");
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
    }
  } catch (err) {
    console.warn("[Portfolio API] Firestore read inquiries notice:", err.message);
  }

  return localList;
}
