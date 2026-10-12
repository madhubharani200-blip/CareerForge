/**
 * THEME MANAGER (Dark & Light Mode Switcher)
 * Provides seamless theme toggling, persistence, and reactive updates across all pages.
 */

const THEME_KEY = "cf_theme";

/**
 * Get currently selected or preferred theme ('dark' | 'light')
 */
export function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  // Default to dark theme for CareerForge AI
  return "dark";
}

/**
 * Apply theme to the document and persist in localStorage
 */
export function applyTheme(theme) {
  const activeTheme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", activeTheme);
  localStorage.setItem(THEME_KEY, activeTheme);

  // Update all toggle buttons in DOM
  updateToggleButtons(activeTheme);

  // Dispatch custom event for components that need to respond
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: activeTheme } }));
  return activeTheme;
}

/**
 * Toggle between dark and light themes
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || getPreferredTheme();
  const nextTheme = current === "light" ? "dark" : "light";
  return applyTheme(nextTheme);
}

/**
 * Update UI state of all theme toggle buttons on the page
 */
export function updateToggleButtons(theme) {
  const isLight = theme === "light";
  document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
    btn.setAttribute("data-theme", theme);
    btn.setAttribute("title", isLight ? "Switch to Dark Mode" : "Switch to Light Mode");
    btn.setAttribute("aria-label", isLight ? "Switch to Dark Mode" : "Switch to Light Mode");

    const sunIcon = btn.querySelector(".sun-icon");
    const moonIcon = btn.querySelector(".moon-icon");
    if (sunIcon && moonIcon) {
      if (isLight) {
        sunIcon.style.display = "none";
        moonIcon.style.display = "block";
      } else {
        sunIcon.style.display = "block";
        moonIcon.style.display = "none";
      }
    }
  });
}

function handleToggleClick(e) {
  e.preventDefault();
  e.stopPropagation();
  toggleTheme();
}

/**
 * Initialize theme and bind event listeners
 */
export function initTheme() {
  const theme = getPreferredTheme();
  applyTheme(theme);

  // Bind click listeners on all toggle buttons
  document.querySelectorAll(".theme-toggle-btn").forEach((btn) => {
    btn.removeEventListener("click", handleToggleClick);
    btn.addEventListener("click", handleToggleClick);
  });

  // Listen to system preference changes if user hasn't explicitly set a preference
  if (window.matchMedia) {
    try {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
    } catch (e) {}
  }
}

// Auto-run immediately to prevent flash
try {
  const t = localStorage.getItem(THEME_KEY) || "dark";
  document.documentElement.setAttribute("data-theme", t);
} catch (e) {}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTheme);
  } else {
    initTheme();
  }
}
