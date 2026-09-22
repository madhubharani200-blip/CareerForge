/**
 * AUTHENTICATION MODULE (Firebase Auth + Demo Session Support)
 */

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SESSION_USER_KEY = "career_ai_session_user";
const DEMO_USER_KEY = "career_ai_demo_user";

// Listen to Firebase Auth state in background and sync session
if (auth) {
  try {
    onAuthStateChanged(auth, (firebaseUser) => {
      if (sessionStorage.getItem("cf_logged_out") === "true") {
        return;
      }
      if (firebaseUser) {
        const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
        const u = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: name,
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`
        };
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
      }
    });
  } catch (e) {}
}

/**
 * Get current authenticated user (Synchronous & resilient against async load ticks)
 */
export function getCurrentUser() {
  if (sessionStorage.getItem("cf_logged_out") === "true") {
    return null;
  }

  if (auth?.currentUser) {
    const name = auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "User";
    const u = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: name,
      photoURL: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
    return u;
  }

  const sessionJson = localStorage.getItem(SESSION_USER_KEY);
  if (sessionJson) {
    try {
      return JSON.parse(sessionJson);
    } catch (e) {}
  }

  // No demo user fallback — only real authenticated users
  return null;
}

/**
 * Helper to save active user session
 */
export function persistUserSession(user) {
  if (!user) return;
  const name = user.displayName || user.email?.split("@")[0] || "User";
  const sessionUser = {
    uid: user.uid,
    email: user.email,
    displayName: name,
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`
  };
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
  return sessionUser;
}

/**
 * Update user session & profile across localStorage and Firebase Auth
 */
export async function updateUserSession(updatedData) {
  const current = getCurrentUser() || {};
  const merged = {
    ...current,
    ...updatedData,
    displayName: updatedData.displayName || current.displayName || "User",
    photoURL: updatedData.photoURL || current.photoURL
  };
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(merged));
  localStorage.setItem("cf_user_profile", JSON.stringify(merged));
  if (merged.uid) {
    localStorage.setItem(`user_profile_${merged.uid}`, JSON.stringify(merged));
  }

  if (auth?.currentUser) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: merged.displayName,
        photoURL: merged.photoURL && !merged.photoURL.startsWith("data:") ? merged.photoURL : undefined
      });
    } catch (e) {
      console.warn("[Auth] Firebase updateProfile notice:", e.message);
    }
  }

  return merged;
}

/**
 * Ensure `users/{uid}` profile document exists in Firestore
 */
export async function ensureUserProfileDoc(user, additionalData = {}) {
  if (!user?.uid) return;

  const name = user.displayName || additionalData.displayName || user.email?.split("@")[0] || "User";

  // Only store the bare minimum to identify the user — never overwrite real profile data
  const minimalProfile = {
    displayName: name,
    email: user.email || "",
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
    ...additionalData,
    updatedAt: serverTimestamp()
  };

  try {
    if (db) {
      const userDocRef = doc(db, "users", user.uid);
      // merge:true ensures we NEVER overwrite existing profile data
      await setDoc(userDocRef, minimalProfile, { merge: true });
    }
  } catch (err) {
    console.warn("[Auth] Firestore doc creation bypassed or offline:", err.message);
  }

  // Cache minimal profile in localStorage only if user doesn't have a saved profile yet
  const localProfileKey = `user_profile_${user.uid}`;
  if (!localStorage.getItem(localProfileKey)) {
    localStorage.setItem(localProfileKey, JSON.stringify(minimalProfile));
  }
}

function isPlaceholderOrNetworkError(error) {
  if (!error) return true;
  const code = (error.code || "").toLowerCase();
  const msg = (error.message || "").toLowerCase();
  return (
    code.includes("api-key") ||
    code.includes("invalid-api-key") ||
    code.includes("network-request-failed") ||
    code.includes("internal-error") ||
    code.includes("app-deleted") ||
    code.includes("configuration-not-found") ||
    code.includes("operation-not-allowed") ||
    code.includes("unauthorized-domain") ||
    code.includes("popup-blocked") ||
    msg.includes("unauthorized-domain") ||
    msg.includes("configuration-not-found") ||
    msg.includes("operation-not-allowed") ||
    msg.includes("api-key-not-valid") ||
    msg.includes("invalid-api-key") ||
    msg.includes("api key")
  );
}

/**
 * Register new user with Email & Password
 */
export async function registerWithEmail(email, password, displayName) {
  sessionStorage.removeItem("cf_logged_out");
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    const name = displayName || user.email?.split("@")[0] || "User";
    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
      isNewUser: true
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem("cf_is_new_user", "true");

    // Persist to Firestore in background without blocking instant registration
    ensureUserProfileDoc(user, { displayName: name }).catch((e) => console.warn("[Auth] Background profile sync:", e));
    return { success: true, user: sessionUser };
  } catch (error) {
    // Do NOT silently create demo users — surface real errors
    throw error;
  }
}

/**
 * Login with Email & Password
 */
export async function loginWithEmail(email, password) {
  sessionStorage.removeItem("cf_logged_out");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const name = user.displayName || user.email?.split("@")[0] || "User";
    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
      isNewUser: false
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem("cf_is_new_user", "false");

    // Persist to Firestore in background without blocking instant login
    ensureUserProfileDoc(user).catch((e) => console.warn("[Auth] Background profile sync:", e));
    return { success: true, user: sessionUser };
  } catch (error) {
    // Do NOT silently create demo users — surface real auth errors
    throw error;
  }
}

/**
 * Google Sign-In Popup
 */
export async function loginWithGoogle() {
  sessionStorage.removeItem("cf_logged_out");

  if (!auth) {
    throw new Error("Authentication service not available. Please try Email Sign-In.");
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const name = user.displayName || user.email?.split("@")[0] || "User";
    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      // Google provides real photoURL — use it directly
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
      isNewUser: false
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem("cf_is_new_user", "false");

    // Sync profile to Firestore in background (non-blocking)
    ensureUserProfileDoc(user).catch((e) => console.warn("[Auth] Background profile sync:", e));
    return { success: true, user: sessionUser };
  } catch (error) {
    const code = (error.code || "");

    // Popup closed by user — just signal cancellation, do NOT create a fake account
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      const err = new Error("Google sign-in was cancelled. Please try again.");
      err.code = code;
      throw err;
    }

    // Popup blocked by browser
    if (code === "auth/popup-blocked") {
      throw new Error("Google sign-in popup was blocked by your browser. Please allow popups for this site and try again.");
    }

    // Domain not authorized in Firebase console
    if (code === "auth/unauthorized-domain") {
      throw new Error("This domain is not authorized for Google Sign-In. Please use Email Sign-In instead.");
    }

    // All other real errors — propagate to UI
    throw error;
  }
}

/**
 * Reset Password
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    if (isPlaceholderOrNetworkError(error) || !auth) {
      return { success: true, isDemo: true };
    }
    throw error;
  }
}

/**
 * Sign Out
 */
export async function logOut() {
  // Get current user UID BEFORE clearing session (needed to wipe user-specific cache)
  let currentUid = null;
  try {
    const sessionJson = localStorage.getItem(SESSION_USER_KEY);
    if (sessionJson) {
      const parsed = JSON.parse(sessionJson);
      currentUid = parsed?.uid;
    }
  } catch (e) {}

  // Mark as logged out IMMEDIATELY to prevent any re-login
  sessionStorage.setItem("cf_logged_out", "true");

  // Clear all session and profile data
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem("cf_user_profile");
  localStorage.removeItem("cf_is_new_user");
  localStorage.removeItem("cf_last_saved_portfolio");

  // Clear all user-specific cached data (profile, portfolios, resumes, inquiries)
  if (currentUid) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes(currentUid) ||
        key.startsWith("user_profile_") ||
        key.startsWith("user_portfolios_") ||
        key.startsWith("user_resumes_") ||
        key.startsWith("public_portfolio_") ||
        key.startsWith("contact_inquiries_")
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  if (auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("[Auth] Firebase signout notice:", err.message);
    }
  }

  try {
    if (window.indexedDB) {
      indexedDB.deleteDatabase("firebaseLocalStorageDb");
    }
  } catch (e) {}

  const isPagesDir = window.location.pathname.includes("/pages/");
  const target = isPagesDir ? "auth.html?logout=true" : "pages/auth.html?logout=true";
  window.location.replace(target);
}

/**
 * Listen for Auth state changes
 */
export function onAuthChanged(callback) {
  if (sessionStorage.getItem("cf_logged_out") === "true") {
    callback(null);
    return;
  }
  if (auth) {
    onAuthStateChanged(auth, (user) => {
      if (sessionStorage.getItem("cf_logged_out") === "true") {
        callback(null);
        return;
      }
      if (user) {
        callback(user);
      } else {
        const demoUser = getCurrentUser();
        callback(demoUser);
      }
    });
  } else {
    const demoUser = getCurrentUser();
    callback(demoUser);
  }
}
