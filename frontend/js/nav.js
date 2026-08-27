/**
 * REUSABLE NAVIGATION SHELL & HEADER MANAGER
 */

import { getCurrentUser, logOut } from "./auth.js";

export function renderNavbar(activePage = "dashboard") {
  const navContainer = document.getElementById("app-navbar-container");
  if (!navContainer) return;

  const user = getCurrentUser();

  // Resolve user's real uploaded profile picture from cache/profile/portfolio
  let cachedProf = {};
  let lastPort = {};
  try {
    if (user?.uid) {
      cachedProf = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || localStorage.getItem("cf_user_profile") || "{}");
      lastPort = JSON.parse(localStorage.getItem("cf_last_saved_portfolio") || localStorage.getItem(`public_portfolio_${user.uid}`) || "{}");
    }
  } catch {}

  const displayName = cachedProf.displayName || user?.displayName || user?.email?.split("@")[0] || "My Account";
  const realPhoto = cachedProf.photoURL || lastPort.photoURL || user?.photoURL;
  const avatarUrl = (realPhoto && typeof realPhoto === "string" && realPhoto.trim() !== "")
    ? realPhoto
    : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=6366f1,3b82f6,06b6d4`;

  const isCurrent = (page) => (page === activePage ? "active" : "");

  navContainer.innerHTML = `
    <nav class="navbar">
      <a href="../index.html" class="nav-brand">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <span>CareerForge</span>
        <span class="brand-badge">Cockpit</span>
      </a>

      <!-- Desktop Links -->
      <ul class="nav-links" id="nav-links-menu">
        <li><a href="dashboard.html" class="nav-link ${isCurrent("dashboard")}">Cockpit</a></li>
        <li><a href="resume-builder.html" class="nav-link ${isCurrent("resume")}">Resume</a></li>
        <li><a href="portfolio-builder.html" class="nav-link ${isCurrent("portfolio")}">Portfolio</a></li>
        <li><a href="career-agent.html" class="nav-link ${isCurrent("agent")}">
          <span class="ai-badge" style="padding:1px 5px;font-size:0.65rem;">Agent</span>
          <span>Career Agent</span>
        </a></li>
        <li><a href="skill-gap.html" class="nav-link ${isCurrent("skill-gap")}">Skill Gap</a></li>
        <li><a href="recommendations.html" class="nav-link ${isCurrent("recommendations")}">Careers</a></li>
        <li><a href="learning-roadmap.html" class="nav-link ${isCurrent("roadmap")}">Roadmap</a></li>
        <li><a href="resume-analyzer.html" class="nav-link ${isCurrent("analyzer")}">ATS Scan</a></li>
      </ul>

      <!-- User Menu & Actions -->
      <div class="nav-actions">
        <button class="btn btn-secondary btn-icon nav-toggle-btn" id="btn-mobile-nav-toggle" style="display: none;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>

        <div class="user-dropdown">
          <button class="user-avatar-btn" id="btn-user-dropdown-toggle">
            <img src="${avatarUrl}" alt="${displayName}" class="user-avatar-img" id="nav-user-avatar">
            <span style="font-size: 0.85rem; font-weight: 600; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>

          <div class="dropdown-menu" id="user-dropdown-menu">
            <div class="dropdown-header">
              <strong style="font-size: 0.85rem; color: var(--text-primary); display:block;">${displayName}</strong>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${user?.email || "user@example.com"}</span>
            </div>
            <a href="profile.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>Profile & Skills</span>
            </a>
            <a href="public-portfolio.html?u=${user?.uid || ""}" target="_blank" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
              <span>View Public Portfolio</span>
            </a>
            <a href="career-agent.html" class="dropdown-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              <span>Run Career Agent</span>
            </a>
            <div style="height: 1px; background: var(--border-subtle); margin: 0.25rem 0;"></div>
            <button class="dropdown-item danger" id="btn-nav-logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;

  // Attach event listeners for user dropdown
  const dropdownToggle = document.getElementById("btn-user-dropdown-toggle");
  const dropdownMenu = document.getElementById("user-dropdown-menu");
  const btnLogout = document.getElementById("btn-nav-logout");
  const mobileToggle = document.getElementById("btn-mobile-nav-toggle");
  const navLinksMenu = document.getElementById("nav-links-menu");

  if (dropdownToggle && dropdownMenu) {
    dropdownToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      logOut();
    });
  }

  if (mobileToggle && navLinksMenu) {
    mobileToggle.addEventListener("click", () => {
      navLinksMenu.classList.toggle("mobile-open");
    });
  }
}
