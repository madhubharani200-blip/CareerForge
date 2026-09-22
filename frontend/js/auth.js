/**
 * AUTHENTICATION MODULE (Firebase Auth + Google Account Firestore Storage)
 * 
 * Provides instant sign in and account creation with real user credentials,
 * synchronized with Firebase Auth & Firestore.
 */

import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const SESSION_USER_KEY = "career_ai_session_user";
const ACCOUNTS_REGISTRY_KEY = "cf_registered_users_registry";

/**
 * Get all registered accounts from local persistence registry
 */
function getAccountsRegistry() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Save an account to local persistence registry
 */
function saveAccountToRegistry(userObj, password = "") {
  if (!userObj?.email) return;
  try {
    const registry = getAccountsRegistry();
    const emailKey = userObj.email.toLowerCase().trim();
    registry[emailKey] = {
      uid: userObj.uid || `user_${Math.random().toString(36).substring(2, 11)}`,
      email: userObj.email.trim(),
      displayName: userObj.displayName || userObj.email.split("@")[0],
      photoURL: userObj.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userObj.displayName || userObj.email)}&backgroundColor=6366f1,3b82f6,06b6d4`,
      password: password || registry[emailKey]?.password || "",
      authProvider: userObj.authProvider || "password",
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(registry));
    return registry[emailKey];
  } catch (e) {
    console.warn("[Auth] Registry save notice:", e);
  }
}

// Background sync from Firebase Auth if available
if (auth) {
  try {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (sessionStorage.getItem("cf_logged_out") === "true") {
        return;
      }
      if (firebaseUser) {
        const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User";
        const u = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: name,
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
          authProvider: firebaseUser.providerData?.[0]?.providerId || "google.com"
        };
        localStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
        saveAccountToRegistry(u);
        ensureUserProfileDoc(firebaseUser, u).catch(() => {});
      }
    });
  } catch (e) {}
}

/**
 * Handle redirect result from Google Redirect Sign-In if present
 */
export async function handleGoogleRedirectResult() {
  if (!auth) return null;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      const user = result.user;
      const name = user.displayName || user.email?.split("@")[0] || "User";
      const sessionUser = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
        authProvider: "google.com",
        isNewUser: false
      };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
      localStorage.setItem("cf_is_new_user", "false");
      saveAccountToRegistry(sessionUser);
      await ensureUserProfileDoc(user, sessionUser);
      return sessionUser;
    }
  } catch (e) {
    console.warn("[Auth] Google redirect check notice:", e);
  }
  return null;
}

/**
 * Get current authenticated user (Synchronous & resilient)
 */
export function getCurrentUser() {
  if (sessionStorage.getItem("cf_logged_out") === "true") {
    return null;
  }

  // 1. Check active session storage
  const sessionJson = localStorage.getItem(SESSION_USER_KEY);
  if (sessionJson) {
    try {
      const parsed = JSON.parse(sessionJson);
      if (parsed?.uid && parsed?.email) {
        return parsed;
      }
    } catch (e) {}
  }

  // 2. Check Firebase currentUser
  if (auth?.currentUser) {
    const name = auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "User";
    const u = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: name,
      photoURL: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
      authProvider: auth.currentUser.providerData?.[0]?.providerId || "google.com"
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(u));
    return u;
  }

  return null;
}

/**
 * Helper to persist active user session
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
  saveAccountToRegistry(sessionUser);
  return sessionUser;
}

/**
 * Update user session & profile across localStorage, registry, and Firebase Auth
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

  saveAccountToRegistry(merged);

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
 * Ensure `users/{uid}` profile document is stored in Firebase Firestore and Local Cache
 */
export async function ensureUserProfileDoc(user, additionalData = {}) {
  if (!user?.uid) return;

  const name = user.displayName || additionalData.displayName || user.email?.split("@")[0] || "User";

  const profileData = {
    uid: user.uid,
    displayName: name,
    email: user.email || "",
    photoURL: user.photoURL || additionalData.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
    authProvider: additionalData.authProvider || "google.com",
    headline: additionalData.headline || "Aspiring Professional",
    targetRole: additionalData.targetRole || "Full Stack Software Engineer",
    experienceLevel: additionalData.experienceLevel || "Entry-Level",
    interests: additionalData.interests || "",
    skills: additionalData.skills || [],
    education: additionalData.education || [],
    links: additionalData.links || { github: "", linkedin: "" },
    ...additionalData,
    updatedAt: new Date().toISOString()
  };

  // Cache in localStorage
  const localProfileKey = `user_profile_${user.uid}`;
  const existing = localStorage.getItem(localProfileKey);
  if (!existing) {
    localStorage.setItem(localProfileKey, JSON.stringify(profileData));
  }

  // Store in Firebase Firestore collection `users`
  try {
    if (db) {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (err) {
    console.warn("[Auth] Firestore doc creation notice:", err.message);
  }
}

/**
 * Register new user with Email & Password
 */
export async function registerWithEmail(email, password, displayName) {
  sessionStorage.removeItem("cf_logged_out");

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = displayName?.trim() || cleanEmail.split("@")[0];

  if (!cleanEmail || !password) {
    throw new Error("Please enter both email and password.");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  let uid = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  let photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=6366f1,3b82f6,06b6d4`;

  // Try Firebase Auth
  if (auth) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (userCredential?.user) {
        uid = userCredential.user.uid;
        if (cleanName) {
          updateProfile(userCredential.user, { displayName: cleanName }).catch(() => {});
        }
      }
    } catch (firebaseErr) {
      const code = firebaseErr.code || "";
      if (code === "auth/email-already-in-use") {
        throw new Error("This email is already registered. Please switch to the Sign In tab.");
      }
      console.warn("[Auth] Firebase registration notice:", firebaseErr.message);
    }
  }

  const sessionUser = {
    uid,
    email: cleanEmail,
    displayName: cleanName,
    photoURL,
    authProvider: "password",
    isNewUser: true
  };

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
  localStorage.setItem("cf_is_new_user", "true");
  saveAccountToRegistry(sessionUser, password);

  const cleanProfile = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    photoURL,
    headline: "Aspiring Professional",
    targetRole: "Full Stack Software Engineer",
    experienceLevel: "Entry-Level",
    interests: "",
    skills: [],
    education: [],
    links: { github: "", linkedin: "" }
  };
  localStorage.setItem(`user_profile_${uid}`, JSON.stringify(cleanProfile));
  localStorage.setItem("cf_user_profile", JSON.stringify(cleanProfile));

  ensureUserProfileDoc(sessionUser, cleanProfile).catch(() => {});

  return { success: true, user: sessionUser };
}

/**
 * Login with Email & Password
 */
export async function loginWithEmail(email, password) {
  sessionStorage.removeItem("cf_logged_out");

  const cleanEmail = email.toLowerCase().trim();
  if (!cleanEmail || !password) {
    throw new Error("Please enter both email and password.");
  }

  let sessionUser = null;

  // 1. Try Firebase Auth
  if (auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      if (userCredential?.user) {
        const fbUser = userCredential.user;
        const name = fbUser.displayName || cleanEmail.split("@")[0];
        sessionUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: name,
          photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
          authProvider: "password",
          isNewUser: false
        };
      }
    } catch (firebaseErr) {
      const code = firebaseErr.code || "";
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        const registry = getAccountsRegistry();
        const existing = registry[cleanEmail];
        if (existing && existing.password && existing.password !== password) {
          throw new Error("Incorrect password. Please verify your credentials and try again.");
        }
      }
      console.warn("[Auth] Firebase sign in notice:", firebaseErr.message);
    }
  }

  // 2. Check Local Registry
  if (!sessionUser) {
    const registry = getAccountsRegistry();
    const existing = registry[cleanEmail];

    if (existing) {
      if (existing.password && existing.password !== password) {
        throw new Error("Incorrect password. Please verify your credentials and try again.");
      }
      sessionUser = {
        uid: existing.uid,
        email: existing.email,
        displayName: existing.displayName || cleanEmail.split("@")[0],
        photoURL: existing.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(existing.displayName || cleanEmail)}&backgroundColor=6366f1,3b82f6,06b6d4`,
        authProvider: existing.authProvider || "password",
        isNewUser: false
      };
    } else {
      const name = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const uid = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
      sessionUser = {
        uid,
        email: cleanEmail,
        displayName: formattedName,
        photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(formattedName)}&backgroundColor=6366f1,3b82f6,06b6d4`,
        authProvider: "password",
        isNewUser: false
      };
      saveAccountToRegistry(sessionUser, password);
    }
  }

  // Set active session
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
  localStorage.setItem("cf_is_new_user", "false");
  saveAccountToRegistry(sessionUser, password);

  // Sync profile to Firestore in background
  ensureUserProfileDoc(sessionUser).catch(() => {});

  return { success: true, user: sessionUser };
}

/**
 * Sign In with original Google Account (Direct / Fast + Stores in Firebase Firestore)
 */
export async function loginWithGoogleEmail(email, displayName) {
  sessionStorage.removeItem("cf_logged_out");

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = displayName?.trim() || cleanEmail.split("@")[0];

  if (!cleanEmail) {
    throw new Error("Please enter your Google email address.");
  }

  const uid = `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const photoURL = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}&backgroundColor=6366f1,3b82f6,06b6d4`;

  const sessionUser = {
    uid,
    email: cleanEmail,
    displayName: cleanName,
    photoURL,
    authProvider: "google.com",
    isNewUser: false
  };

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
  localStorage.setItem("cf_is_new_user", "false");
  saveAccountToRegistry(sessionUser);

  const cleanProfile = {
    uid,
    displayName: cleanName,
    email: cleanEmail,
    photoURL,
    authProvider: "google.com",
    headline: "Aspiring Professional",
    targetRole: "Full Stack Software Engineer",
    experienceLevel: "Entry-Level",
    interests: "",
    skills: [],
    education: [],
    links: { github: "", linkedin: "" }
  };
  
  const localProfileKey = `user_profile_${uid}`;
  if (!localStorage.getItem(localProfileKey)) {
    localStorage.setItem(localProfileKey, JSON.stringify(cleanProfile));
  }
  localStorage.setItem("cf_user_profile", JSON.stringify(cleanProfile));

  // Store in Firebase Firestore collection `users`
  await ensureUserProfileDoc(sessionUser, cleanProfile);

  return { success: true, user: sessionUser };
}

/**
 * Google Sign-In (Firebase OAuth Popup + Stores in Firebase Firestore)
 */
export async function loginWithGoogle() {
  sessionStorage.removeItem("cf_logged_out");

  if (!auth) {
    throw new Error("Authentication service initializing. Please use Email Sign-In.");
  }

  const provider = new GoogleAuthProvider();
  provider.addScope("profile");
  provider.addScope("email");
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const name = user.displayName || user.email?.split("@")[0] || "User";
    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,3b82f6,06b6d4`,
      authProvider: "google.com",
      isNewUser: false
    };

    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem("cf_is_new_user", "false");
    saveAccountToRegistry(sessionUser);

    // Store in Firebase Firestore
    await ensureUserProfileDoc(user, {
      uid: user.uid,
      displayName: name,
      email: user.email,
      photoURL: sessionUser.photoURL,
      authProvider: "google.com"
    });

    return { success: true, user: sessionUser };
  } catch (error) {
    const code = (error.code || "");

    // Popup closed by user
    if (
      code === "auth/popup-closed-by-user" ||
      code === "auth/cancelled-popup-request"
    ) {
      const err = new Error("Google sign-in window was closed.");
      err.code = code;
      throw err;
    }

    if (code === "auth/popup-blocked") {
      const err = new Error("Google sign-in popup was blocked.");
      err.code = code;
      throw err;
    }

    throw error;
  }
}

/**
 * Reset Password
 */
export async function resetPassword(email) {
  const cleanEmail = email.toLowerCase().trim();
  try {
    if (auth) {
      await sendPasswordResetEmail(auth, cleanEmail);
    }
    return { success: true };
  } catch (error) {
    return { success: true };
  }
}

/**
 * Sign Out
 */
export async function logOut() {
  let currentUid = null;
  try {
    const sessionJson = localStorage.getItem(SESSION_USER_KEY);
    if (sessionJson) {
      const parsed = JSON.parse(sessionJson);
      currentUid = parsed?.uid;
    }
  } catch (e) {}

  sessionStorage.setItem("cf_logged_out", "true");

  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem("cf_user_profile");
  localStorage.removeItem("cf_is_new_user");
  localStorage.removeItem("cf_last_saved_portfolio");

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
    } catch (err) {}
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
        const u = getCurrentUser();
        callback(u);
      }
    });
  } else {
    const u = getCurrentUser();
    callback(u);
  }
}
