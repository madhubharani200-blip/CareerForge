/**
 * AUTHENTICATION PAGE CONTROLLER
 */

import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  resetPassword,
  getCurrentUser
} from "../auth.js";
import { openModal, closeModal, showToast, setButtonLoading } from "../ui-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isLogout = urlParams.get("logout") === "true" || sessionStorage.getItem("cf_logged_out") === "true";

  if (isLogout) {
    sessionStorage.setItem("cf_logged_out", "true");
    localStorage.removeItem("career_ai_session_user");
    localStorage.removeItem("cf_user_profile");
    localStorage.removeItem("cf_is_new_user");
    try {
      if (window.indexedDB) {
        indexedDB.deleteDatabase("firebaseLocalStorageDb");
      }
    } catch (e) {}

    if (urlParams.get("logout") === "true") {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (e) {}
      showToast("Signed out successfully.", "info");
    }
  } else {
    // If already logged in, redirect to dashboard
    const user = getCurrentUser();
    if (user) {
      window.location.href = "dashboard.html";
      return;
    }
  }

  // DOM Elements
  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabSignupBtn = document.getElementById("tab-signup-btn");
  const authTitle = document.getElementById("auth-title");
  const authSubtitle = document.getElementById("auth-subtitle");
  const authForm = document.getElementById("auth-form");
  const groupDisplayName = document.getElementById("group-display-name");
  const inputDisplayName = document.getElementById("input-display-name");
  const inputEmail = document.getElementById("input-email");
  const inputPassword = document.getElementById("input-password");
  const btnAuthSubmit = document.getElementById("btn-auth-submit");
  const btnGoogleAuth = document.getElementById("btn-google-auth");
  const btnDemoLogin = document.getElementById("btn-demo-login");
  const authAlert = document.getElementById("auth-alert");

  // Modal elements
  const linkForgotPassword = document.getElementById("link-forgot-password");
  const modalReset = "modal-reset-password";
  const btnCloseResetModal = document.getElementById("btn-close-reset-modal");
  const btnCancelReset = document.getElementById("btn-cancel-reset");
  const btnSubmitReset = document.getElementById("btn-submit-reset");
  const inputResetEmail = document.getElementById("input-reset-email");

  let isSignUp = false;

  // Check URL params for mode=signup
  if (urlParams.get("mode") === "signup") {
    setMode(true);
  }

  function setMode(signUpMode) {
    isSignUp = signUpMode;
    if (isSignUp) {
      tabSignupBtn.classList.add("active");
      tabLoginBtn.classList.remove("active");
      authTitle.textContent = "Create Account";
      authSubtitle.textContent = "Start your journey with AI-assisted career tools";
      groupDisplayName.style.display = "block";
      inputDisplayName.required = true;
      btnAuthSubmit.querySelector("span").textContent = "Create Account";
    } else {
      tabLoginBtn.classList.add("active");
      tabSignupBtn.classList.remove("active");
      authTitle.textContent = "Welcome Back";
      authSubtitle.textContent = "Access your AI Career dossier and agent";
      groupDisplayName.style.display = "none";
      inputDisplayName.required = false;
      btnAuthSubmit.querySelector("span").textContent = "Sign In";
    }
    hideAlert();
  }

  function showAlert(message, type = "error") {
    authAlert.style.display = "block";
    authAlert.style.background = type === "error" ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)";
    authAlert.style.border = `1px solid ${type === "error" ? "var(--accent-rose)" : "var(--accent-emerald)"}`;
    authAlert.style.color = type === "error" ? "var(--accent-rose)" : "var(--accent-emerald)";
    authAlert.textContent = message;
  }

  function hideAlert() {
    authAlert.style.display = "none";
  }

  // Tab Listeners
  tabLoginBtn.addEventListener("click", () => setMode(false));
  tabSignupBtn.addEventListener("click", () => setMode(true));

  // Form Submit Handler
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = inputEmail.value.trim();
    const password = inputPassword.value;
    const displayName = inputDisplayName.value.trim();

    if (!email || !password) {
      showAlert("Please enter both email and password.");
      return;
    }

    setButtonLoading(btnAuthSubmit, true);

    try {
      if (isSignUp) {
        await registerWithEmail(email, password, displayName);
        showToast("Account created successfully! Welcome to CareerForge.", "success");
      } else {
        await loginWithEmail(email, password);
        showToast("Signed in successfully!", "success");
      }
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 200);
    } catch (error) {
      setButtonLoading(btnAuthSubmit, false);
      let friendlyMsg = error.message || "Authentication failed. Please check your credentials.";
      const code = error.code || "";

      if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
        if (!isSignUp) {
          friendlyMsg = "Incorrect password or account credentials. Please check your details or create an account.";
        } else {
          friendlyMsg = "Invalid email or credentials. Please check your details.";
        }
      } else if (code === "auth/email-already-in-use") {
        friendlyMsg = "This email is already registered. Please switch to the 'Sign In' tab.";
      } else if (code === "auth/weak-password") {
        friendlyMsg = "Password should be at least 6 characters long.";
      } else if (code === "auth/invalid-email") {
        friendlyMsg = "Please enter a valid email address.";
      }

      showAlert(friendlyMsg);
    }
  });

  // Google Sign-In Handler
  btnGoogleAuth.addEventListener("click", async () => {
    hideAlert();
    setButtonLoading(btnGoogleAuth, true);
    try {
      await loginWithGoogle();
      showToast("Google sign-in successful! Welcome.", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 200);
    } catch (error) {
      setButtonLoading(btnGoogleAuth, false);
      const code = error.code || "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        showToast("Google sign-in window was closed. Please try again or use Email Sign-In.", "info");
        return;
      }
      showAlert(error.message || "Google sign-in encountered an issue. Please try Email Sign-In.");
    }
  });

  // 1-Click Demo User Handler (for easy testing)
  btnDemoLogin.addEventListener("click", async () => {
    setButtonLoading(btnDemoLogin, true);
    try {
      await loginWithEmail("demo.student@careerforge.ai", "DemoPassword123!");
      showToast("Loaded demo student profile!", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 200);
    } catch (err) {
      setButtonLoading(btnDemoLogin, false);
    }
  });

  // Password Reset Modal Handlers
  linkForgotPassword.addEventListener("click", (e) => {
    e.preventDefault();
    if (inputEmail.value) {
      inputResetEmail.value = inputEmail.value;
    }
    openModal(modalReset);
  });

  btnCloseResetModal.addEventListener("click", () => closeModal(modalReset));
  btnCancelReset.addEventListener("click", () => closeModal(modalReset));

  btnSubmitReset.addEventListener("click", async () => {
    const resetEmail = inputResetEmail.value.trim();
    if (!resetEmail) {
      showToast("Please enter your email address.", "error");
      return;
    }
    setButtonLoading(btnSubmitReset, true);
    try {
      await resetPassword(resetEmail);
      showToast(`Password reset link sent to ${resetEmail}`, "success");
      closeModal(modalReset);
    } catch (error) {
      showToast(error.message || "Could not send reset email.", "error");
    } finally {
      setButtonLoading(btnSubmitReset, false);
    }
  });
});
