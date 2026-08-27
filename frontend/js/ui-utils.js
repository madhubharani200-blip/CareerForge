/**
 * UI UTILITIES & COMMON HELPERS
 */

// Toast Notifications System
export function showToast(message, type = "info", duration = 4000) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    info: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  toast.innerHTML = `
    <span style="display:flex;align-items:center;color:${type === "success" ? "var(--accent-emerald)" : type === "error" ? "var(--accent-rose)" : "var(--primary-light)"}">
      ${iconMap[type] || iconMap.info}
    </span>
    <span style="flex:1;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(40px)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Modal Helpers
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}

// Debounce helper
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// HTML escape helper
export function escapeHtml(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Button loading state manager
export function setButtonLoading(btn, isLoading, originalHtml = null) {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="spin-animation" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
      <span>Processing...</span>
    `;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalHtml || btn.dataset.originalContent || "Submit";
  }
}

// Style for spin animation
const spinStyle = document.createElement("style");
spinStyle.textContent = `
  @keyframes spin { 100% { transform: rotate(360deg); } }
  .spin-animation { animation: spin 0.8s linear infinite; }
`;
document.head.appendChild(spinStyle);
