/**
 * FIREBASE CONFIGURATION & INITIALIZATION (Modular v10 ES Modules)
 * 
 * Uses CDN ESM imports so no bundler (webpack/vite) is required.
 * Replace the firebaseConfig object with your actual Firebase project credentials when deploying.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, connectStorageEmulator } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Default / Placeholder Firebase Configuration
// Replace with your project settings from Firebase Console

export const firebaseConfig = {
  apiKey: "AIzaSyBTHxcO0qQ8pADJ9REOU3rnlwtNItMm-Qs",
  authDomain: "miniproject-e1acd.firebaseapp.com",
  projectId: "miniproject-e1acd",
  storageBucket: "miniproject-e1acd.firebasestorage.app",
  messagingSenderId: "285188643444",
  appId: "1:285188643444:web:f301a6eb2469f42a298f21",
  measurementId: "G-QMCF875YVW"
};



// Initialize Firebase App
let app;
let auth;
let db;
let storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // If running locally with emulators enabled (optional)
  if (window.location.hostname === "localhost" && window.__USE_EMULATORS__) {
    connectAuthEmulator(auth, "http://localhost:9099");
    connectFirestoreEmulator(db, "localhost", 8080);
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("[Firebase] Connected to local Firebase emulators");
  }
} catch (err) {
  console.warn("[Firebase] Initializing with mock/local state fallback for demonstration.", err.message);
}

export { app, auth, db, storage };
