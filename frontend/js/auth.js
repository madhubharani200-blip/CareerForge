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
      if (firebaseUser) {
        const u = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Emerging Professional",
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`
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
  if (auth?.currentUser) {
    const u = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Emerging Professional",
      photoURL: auth.currentUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${auth.currentUser.uid}`
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

  const demoJson = localStorage.getItem(DEMO_USER_KEY);
  if (demoJson) {
    try {
      return JSON.parse(demoJson);
    } catch (e) {}
  }

  return null;
}

/**
 * Helper to save active user session
 */
export function persistUserSession(user) {
  if (!user) return;
  const sessionUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split("@")[0] || "Emerging Professional",
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`
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

  const defaultProfile = {
    displayName: user.displayName || additionalData.displayName || "Emerging Professional",
    email: user.email || "",
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
    headline: "Aspiring Software Engineer & Problem Solver",
    targetRole: "Full Stack Software Engineer",
    experienceLevel: "Entry-Level / Student",
    education: [
      {
        institution: "University of Technology",
        degree: "B.S. Computer Science",
        gradYear: "2026",
        gpa: "3.8"
      }
    ],
    skills: [
      { name: "JavaScript", level: "Advanced" },
      { name: "HTML5 / CSS3", level: "Advanced" },
      { name: "Node.js", level: "Intermediate" },
      { name: "Git", level: "Intermediate" }
    ],
    interests: "Full Stack Web Apps, Cloud Computing, Generative AI Agent Workflows",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      portfolio: ""
    },
    ...additionalData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    if (db) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, defaultProfile);
      }
    }
  } catch (err) {
    console.warn("[Auth] Firestore doc creation bypassed or offline:", err.message);
  }

  // Also cache in localStorage for fast instant UI hydration
  const localProfileKey = `user_profile_${user.uid}`;
  if (!localStorage.getItem(localProfileKey)) {
    localStorage.setItem(localProfileKey, JSON.stringify(defaultProfile));
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
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (displayName) {
      await updateProfile(user, { displayName });
    }

    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: displayName || user.email?.split("@")[0] || "Emerging Professional",
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      isNewUser: true
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem("cf_is_new_user", "true");

    await ensureUserProfileDoc(user, { displayName });
    return { success: true, user: sessionUser };
  } catch (error) {
    if (isPlaceholderOrNetworkError(error) || !auth) {
      const mockUser = {
        uid: "user_" + Math.random().toString(36).substring(2, 9),
        email,
        displayName: displayName || email.split("@")[0],
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
        isNewUser: true
      };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem("cf_is_new_user", "true");
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
      await ensureUserProfileDoc(mockUser, { displayName: mockUser.displayName });
      return { success: true, user: mockUser, isDemo: true };
    }
    throw error;
  }
}

/**
 * Login with Email & Password
 */
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Emerging Professional",
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      isNewUser: false
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem("cf_is_new_user", "false");

    await ensureUserProfileDoc(user);
    return { success: true, user: sessionUser };
  } catch (error) {
    if (isPlaceholderOrNetworkError(error) || !auth) {
      const mockUser = {
        uid: "user_" + Math.random().toString(36).substring(2, 9),
        email,
        displayName: email.split("@")[0] || "User",
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
        isNewUser: false
      };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem("cf_is_new_user", "false");
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(mockUser));
      await ensureUserProfileDoc(mockUser);
      return { success: true, user: mockUser, isDemo: true };
    }
    throw error;
  }
}

/**
 * Google Sign-In Popup
 */
export async function loginWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    
    const sessionUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Emerging Professional",
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
      isNewUser: false
    };
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(sessionUser));
    localStorage.setItem("cf_is_new_user", "false");

    await ensureUserProfileDoc(user);
    return { success: true, user: sessionUser };
  } catch (error) {
    if (isPlaceholderOrNetworkError(error) || !auth) {
      const mockUser = {
        uid: "google_user_demo",
        email: "student@university.edu",
        displayName: "Student User",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        isNewUser: false
      };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(mockUser));
      localStorage.setItem("cf_is_new_user", "false");
      return { success: true, user: mockUser, isDemo: true };
    }
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
  localStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  if (auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("[Auth] Firebase signout notice:", err.message);
    }
  }
  window.location.href = "auth.html";
}

/**
 * Listen for Auth state changes
 */
export function onAuthChanged(callback) {
  if (auth) {
    onAuthStateChanged(auth, (user) => {
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
