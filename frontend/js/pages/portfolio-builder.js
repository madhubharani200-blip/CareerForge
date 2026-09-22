/**
 * PORTFOLIO BUILDER CONTROLLER
 * 
 * Supports:
 * 1. Two creation pathways: "Create with Resume" (Upload/Import/Parse) vs "Create with AI"
 * 2. 4 Professional Portfolio Templates (Modern Dev, Creative Visual, Executive Minimal, Student Academic)
 * 3. Live Interactive Preview Modal
 * 4. AI Story / Case Study Generation and Firestore sync
 */

import { getCurrentUser } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { generateAIProjectStory, generateAIAboutMe, savePortfolioDoc, getUserPortfolios, encodePortfolioPayload, getCandidateInquiries } from "../api/portfolio-api.js";
import { getUserResumes } from "../api/resume-api.js";
import { showToast, setButtonLoading, escapeHtml, openModal, closeModal } from "../ui-utils.js";
import { db } from "../firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation bar
  renderNavbar("portfolio");

  // State
  let currentPortfolioId = "port_primary_default";
  let isPublished = true;
  let activeTemplate = "modern-dev";
  let projectsList = [];
  let userResumesList = [];

  // DOM Elements - Inputs
  const portName = document.getElementById("port-name");
  const portEmail = document.getElementById("port-email");
  const portPhone = document.getElementById("port-phone");
  const portLocation = document.getElementById("port-location");
  const portLinkedin = document.getElementById("port-linkedin");
  const portGithub = document.getElementById("port-github");
  const portHeroTitle = document.getElementById("port-hero-title");
  const portAboutText = document.getElementById("port-about-text");
  const portSkills = document.getElementById("port-skills");
  const portCerts = document.getElementById("port-certs");
  const portAchievements = document.getElementById("port-achievements");
  const portExperience = document.getElementById("port-experience");
  const portEducation = document.getElementById("port-education");

  // Recruiter Q&A Inputs
  const portPhilosophy = document.getElementById("port-philosophy");
  const portLearning = document.getElementById("port-learning");
  const portAvailability = document.getElementById("port-availability");
  const portDomains = document.getElementById("port-domains");
  const portTestimonial = document.getElementById("port-testimonial");
  const portPublications = document.getElementById("port-publications");

  // Contact & Profile Photo Elements
  const portPhotoPreview = document.getElementById("port-photo-preview");
  const inputPortPhoto = document.getElementById("input-port-photo");
  const btnUploadPortPhoto = document.getElementById("btn-upload-port-photo");
  const btnUseProfileAvatar = document.getElementById("btn-use-profile-avatar");
  const portPhotoUrl = document.getElementById("port-photo-url");

  let currentPhotoURL = user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || "User")}&backgroundColor=6366f1,3b82f6,06b6d4`;

  // Check if profile has a saved picture
  const storedProfile = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || localStorage.getItem("cf_user_profile") || "{}");
  if (storedProfile.photoURL) {
    currentPhotoURL = storedProfile.photoURL;
  }

  // 1. Photo Upload Listener
  if (btnUploadPortPhoto && inputPortPhoto) {
    btnUploadPortPhoto.addEventListener("click", () => inputPortPhoto.click());
    
    inputPortPhoto.addEventListener("change", () => {
      if (inputPortPhoto.files.length) {
        const file = inputPortPhoto.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          currentPhotoURL = e.target.result;
          if (portPhotoPreview) portPhotoPreview.src = currentPhotoURL;
          if (portPhotoUrl) portPhotoUrl.value = "";
          
          // Persist in profile cache so other pages reflect it
          try {
            const prof = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || "{}");
            prof.photoURL = currentPhotoURL;
            localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(prof));
            localStorage.setItem("cf_user_profile", JSON.stringify(prof));
          } catch {}

          refreshShareUrl();
          showToast("Profile picture uploaded and saved in portfolio!", "success");
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 2. Use Profile Photo Button Listener
  if (btnUseProfileAvatar) {
    btnUseProfileAvatar.addEventListener("click", () => {
      const prof = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || localStorage.getItem("cf_user_profile") || "{}");
      const avatar = prof.photoURL || user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || "User")}&backgroundColor=6366f1,3b82f6,06b6d4`;
      currentPhotoURL = avatar;
      if (portPhotoPreview) portPhotoPreview.src = currentPhotoURL;
      if (portPhotoUrl && !avatar.startsWith("data:")) portPhotoUrl.value = avatar;
      refreshShareUrl();
      showToast("Applied saved profile photo to portfolio!", "success");
    });
  }

  // 3. Photo URL input Listener
  if (portPhotoUrl) {
    portPhotoUrl.addEventListener("input", () => {
      const url = portPhotoUrl.value.trim();
      if (url) {
        currentPhotoURL = url;
        if (portPhotoPreview) portPhotoPreview.src = currentPhotoURL;
        refreshShareUrl();
      }
    });
  }

  // Projects Container & Buttons
  const portProjectsContainer = document.getElementById("portfolio-projects-container");
  const btnAddProj = document.getElementById("btn-add-portfolio-proj");
  const btnAiAboutMe = document.getElementById("btn-ai-about-me");
  const btnSavePortfolio = document.getElementById("btn-save-portfolio");
  const btnPublishPortfolio = document.getElementById("btn-publish-portfolio");
  const txtPublishBtn = document.getElementById("txt-publish-btn");
  const btnPreviewPublic = document.getElementById("btn-preview-public");
  const btnCopyShareLink = document.getElementById("btn-copy-share-link");
  const portfolioShareUrlText = document.getElementById("portfolio-share-url-text");

  // Creation Options
  const cardOptionResume = document.getElementById("card-option-resume");
  const cardOptionAi = document.getElementById("card-option-ai");
  const btnTriggerResumeImport = document.getElementById("btn-trigger-resume-import");
  const btnDirectUploadResume = document.getElementById("btn-direct-upload-resume");
  const directResumeFileInput = document.getElementById("direct-resume-file-input");
  const btnTriggerAiMode = document.getElementById("btn-trigger-ai-mode");

  // Template Selector
  const templateCards = document.querySelectorAll("#portfolio-template-picker .template-card");
  const badgeActiveTemplateLabel = document.getElementById("badge-active-template-label");

  // Modals
  const modalResumeImport = "modal-resume-import";
  const btnCloseResumeModal = document.getElementById("btn-close-resume-modal");
  const btnCancelResumeImport = document.getElementById("btn-cancel-resume-import");
  const btnExecuteResumeImport = document.getElementById("btn-execute-resume-import");
  const resumeFileDropzone = document.getElementById("resume-file-dropzone");
  const inputResumeFile = document.getElementById("input-resume-file");
  const fileUploadStatus = document.getElementById("file-upload-status");
  const selectSavedResume = document.getElementById("select-saved-resume");
  const selectSavedPortfolio = document.getElementById("select-saved-portfolio");
  const textareaResumePaste = document.getElementById("textarea-resume-paste");
  const tabButtons = document.querySelectorAll(".tab-import-method");

  const modalLivePreview = "modal-live-preview";
  const btnOpenLivePreview = document.getElementById("btn-open-live-preview");
  const btnCloseLivePreview = document.getElementById("btn-close-live-preview");
  const btnClosePreviewFooter = document.getElementById("btn-close-preview-footer");
  const livePreviewContent = document.getElementById("live-preview-content");
  const previewActiveThemeTag = document.getElementById("preview-active-theme-tag");
  const btnPreviewModalOpenTab = document.getElementById("btn-preview-modal-open-tab");

  // Inquiries Modal Elements
  const modalInquiries = "modal-inquiries";
  const btnOpenInquiriesModal = document.getElementById("btn-open-inquiries-modal");
  const badgeInquiriesCount = document.getElementById("badge-inquiries-count");
  const btnCloseInquiriesModal = document.getElementById("btn-close-inquiries-modal");
  const btnCloseInquiriesFooter = document.getElementById("btn-close-inquiries-footer");
  const inquiriesListContainer = document.getElementById("inquiries-list-container");

  // Set Public Link
  const publicShareUrl = `${window.location.origin}/pages/public-portfolio.html?u=${user.uid}`;
  portfolioShareUrlText.textContent = publicShareUrl;
  btnPreviewPublic.href = `public-portfolio.html?u=${user.uid}`;
  if (btnPreviewModalOpenTab) btnPreviewModalOpenTab.href = `public-portfolio.html?u=${user.uid}`;

  // =========================================================================
  // 1. INITIALIZE PORTFOLIO DATA (RESTORES ALL EXACT SAVED DETAILS)
  // =========================================================================
  async function init() {
    portName.value = user.displayName || "";
    portEmail.value = user.email || "";
    portPhone.value = "";
    portLocation.value = "";
    portLinkedin.value = "";
    portGithub.value = "";
    portHeroTitle.value = "";
    portAboutText.value = "";
    portSkills.value = "";
    portCerts.value = "";
    portAchievements.value = "";
    portExperience.value = "";
    portEducation.value = "";
    if (portPhotoPreview) portPhotoPreview.src = currentPhotoURL;

    // Check user profile cache
    const userProf = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || localStorage.getItem("cf_user_profile") || "{}");
    if (userProf.displayName) portName.value = userProf.displayName;
    if (userProf.photoURL) {
      currentPhotoURL = userProf.photoURL;
      if (portPhotoPreview) portPhotoPreview.src = currentPhotoURL;
    }
    if (userProf.headline) portHeroTitle.value = userProf.headline;
    if (userProf.links?.linkedin) portLinkedin.value = userProf.links.linkedin;
    if (userProf.links?.github) portGithub.value = userProf.links.github;

    // Starter baseline if user is brand new
    projectsList = [
      {
        id: "p_1",
        title: "Full-Stack Web Application",
        overview: "A modern, high-performance web platform built with modular architecture and cloud data services.",
        techStack: "JavaScript, Node.js, Firebase, CSS3",
        problem: "Users require responsive, low-latency workflow management with offline capability.",
        solution: "Engineered client-side state caching with real-time Firestore synchronization.",
        highlights: "Sub-100ms UI response times and secure authentication flow.",
        demoUrl: "",
        githubUrl: ""
      }
    ];

    // Load existing portfolio from Firestore or Local Cache
    try {
      if (db && user.uid) {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const profile = userSnap.data();
          if (profile.displayName && !portName.value) portName.value = profile.displayName;
          if (profile.photoURL) {
            currentPhotoURL = profile.photoURL;
            if (portPhotoPreview) portPhotoPreview.src = currentPhotoURL;
          }
          if (profile.links?.linkedin && !portLinkedin.value) portLinkedin.value = profile.links.linkedin;
          if (profile.links?.github && !portGithub.value) portGithub.value = profile.links.github;
          if (profile.headline && !portHeroTitle.value) portHeroTitle.value = profile.headline;
          if (profile.skills && Array.isArray(profile.skills) && !portSkills.value) {
            portSkills.value = profile.skills.map((s) => (typeof s === "object" ? s.name : s)).join(", ");
          }
        }
      }

      const portfolios = await getUserPortfolios(user.uid);
      if (portfolios && portfolios.length > 0) {
        const p = portfolios[0];
        applyExactSavedPortfolio(p);
      }
    } catch (e) {
      console.warn("Portfolio init notice:", e);
    }

    // Refresh live share link with initial data
    refreshShareUrl();
    updatePublishButtonState();
    renderProjects();
    await loadUserResumesForImport();
    await loadSavedPortfoliosForImport();
    await loadCandidateInquiries();
  }

  function applyExactSavedPortfolio(p) {
    if (!p) return;
    currentPortfolioId = p.id || currentPortfolioId;
    isPublished = p.isPublished !== false;

    if (p.name !== undefined && p.name !== null) portName.value = p.name || p.displayName || "";
    if (p.email !== undefined && p.email !== null) portEmail.value = p.email || "";
    if (p.phone !== undefined && p.phone !== null) portPhone.value = p.phone || "";
    if (p.location !== undefined && p.location !== null) portLocation.value = p.location || "";
    if (p.linkedin !== undefined && p.linkedin !== null) portLinkedin.value = p.linkedin || "";
    if (p.github !== undefined && p.github !== null) portGithub.value = p.github || "";
    if (p.heroTitle !== undefined && p.heroTitle !== null) portHeroTitle.value = p.heroTitle || p.headline || "";
    if (p.aboutMe !== undefined && p.aboutMe !== null) portAboutText.value = p.aboutMe || p.about || "";
    
    if (p.skills !== undefined && p.skills !== null) {
      if (typeof p.skills === "string") {
        portSkills.value = p.skills;
      } else if (Array.isArray(p.skills)) {
        portSkills.value = p.skills.map((s) => (typeof s === "object" ? s.name || s.title || JSON.stringify(s) : String(s))).join(", ");
      } else {
        portSkills.value = String(p.skills);
      }
    }

    if (p.certifications !== undefined && p.certifications !== null) portCerts.value = p.certifications || "";
    if (p.achievements !== undefined && p.achievements !== null) portAchievements.value = p.achievements || "";
    if (p.experience !== undefined && p.experience !== null) portExperience.value = p.experience || "";
    if (p.education !== undefined && p.education !== null) portEducation.value = p.education || "";

    if (p.philosophy !== undefined && portPhilosophy) portPhilosophy.value = p.philosophy || "";
    if (p.learning !== undefined && portLearning) portLearning.value = p.learning || "";
    if (p.availability !== undefined && portAvailability) portAvailability.value = p.availability || "";
    if (p.domains !== undefined && portDomains) portDomains.value = p.domains || "";
    if (p.testimonial !== undefined && portTestimonial) portTestimonial.value = p.testimonial || "";
    if (p.publications !== undefined && portPublications) portPublications.value = p.publications || "";

    if (p.photoURL) {
      currentPhotoURL = p.photoURL;
      if (portPhotoPreview) portPhotoPreview.src = currentPhotoURL;
      if (portPhotoUrl && !p.photoURL.startsWith("data:")) portPhotoUrl.value = p.photoURL;
    }

    if (p.template) setPortfolioTemplate(p.template);
    if (p.projects && Array.isArray(p.projects) && p.projects.length > 0) {
      projectsList = p.projects;
    }

    renderProjects();
    refreshShareUrl();
    updatePublishButtonState();

    setTimeout(() => {
      if (portName) portName.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }

  function refreshShareUrl() {
    const currentData = {
      template: activeTemplate,
      name: portName.value.trim(),
      email: portEmail.value.trim(),
      phone: portPhone.value.trim(),
      location: portLocation.value.trim(),
      linkedin: portLinkedin.value.trim(),
      github: portGithub.value.trim(),
      heroTitle: portHeroTitle.value.trim(),
      aboutMe: portAboutText.value.trim(),
      skills: portSkills.value.trim(),
      certifications: portCerts.value.trim(),
      achievements: portAchievements.value.trim(),
      experience: portExperience.value.trim(),
      education: portEducation.value.trim(),
      philosophy: portPhilosophy ? portPhilosophy.value.trim() : "",
      learning: portLearning ? portLearning.value.trim() : "",
      availability: portAvailability ? portAvailability.value.trim() : "",
      domains: portDomains ? portDomains.value.trim() : "",
      testimonial: portTestimonial ? portTestimonial.value.trim() : "",
      publications: portPublications ? portPublications.value.trim() : "",
      projects: projectsList,
      isPublished: isPublished,
      displayName: portName.value.trim() || user.displayName,
      photoURL: currentPhotoURL
    };
    const token = encodePortfolioPayload(currentData);
    const url = `${window.location.origin}/pages/public-portfolio.html?u=${user.uid}${token ? `&d=${token}` : ""}`;
    portfolioShareUrlText.textContent = url;
    btnPreviewPublic.href = `public-portfolio.html?u=${user.uid}${token ? `&d=${token}` : ""}`;
    if (btnPreviewModalOpenTab) btnPreviewModalOpenTab.href = `public-portfolio.html?u=${user.uid}${token ? `&d=${token}` : ""}`;
    return { data: currentData, url };
  }

  function updatePublishButtonState() {
    if (isPublished) {
      btnPublishPortfolio.className = "btn btn-primary";
      txtPublishBtn.textContent = "● Published Live";
    } else {
      btnPublishPortfolio.className = "btn btn-secondary";
      txtPublishBtn.textContent = "Publish Live";
    }
  }

  // =========================================================================
  // 2. TEMPLATE SELECTION
  // =========================================================================
  const TEMPLATE_NAMES = {
    "modern-dev": "Modern Developer",
    "creative": "Creative & Visual",
    "executive": "Executive Minimal",
    "academic": "Student & Early Career",
    "minimal-dark": "Minimalist Midnight",
    "gradient-aurora": "Aurora Vivid"
  };

  function formatExternalUrl(url, type = "website") {
    if (!url || typeof url !== "string") {
      if (type === "github") return "https://github.com";
      if (type === "linkedin") return "https://linkedin.com";
      return "#";
    }
    url = url.trim();
    if (!url) {
      if (type === "github") return "https://github.com";
      if (type === "linkedin") return "https://linkedin.com";
      return "#";
    }
    if (type === "github" && !url.includes("github.com") && !url.startsWith("http")) {
      return `https://github.com/${url.replace(/^@/, "")}`;
    }
    if (type === "linkedin" && !url.includes("linkedin.com") && !url.startsWith("http")) {
      return `https://linkedin.com/in/${url.replace(/^@/, "")}`;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }
    return url;
  }

  function setPortfolioTemplate(templateId) {
    activeTemplate = templateId;
    templateCards.forEach((card) => {
      card.classList.toggle("active", card.dataset.template === templateId);
    });
    if (badgeActiveTemplateLabel) {
      badgeActiveTemplateLabel.textContent = `Active: ${TEMPLATE_NAMES[templateId] || templateId}`;
    }
  }

  templateCards.forEach((card) => {
    card.addEventListener("click", () => {
      setPortfolioTemplate(card.dataset.template);
      showToast(`Selected template: ${TEMPLATE_NAMES[card.dataset.template]}`, "info");
    });
  });

  // =========================================================================
  // 3. CREATION MODE TOGGLES & ACTIONS
  // =========================================================================
  if (cardOptionResume) {
    cardOptionResume.addEventListener("click", (e) => {
      // Don't trigger twice if clicking buttons
      if (e.target.closest("button")) return;
      cardOptionResume.classList.add("active");
      if (cardOptionAi) cardOptionAi.classList.remove("active");
      openModal(modalResumeImport);
    });
  }

  if (btnDirectUploadResume && directResumeFileInput) {
    btnDirectUploadResume.addEventListener("click", (e) => {
      e.stopPropagation();
      cardOptionResume.classList.add("active");
      if (cardOptionAi) cardOptionAi.classList.remove("active");
      directResumeFileInput.click();
    });

    directResumeFileInput.addEventListener("change", () => {
      if (directResumeFileInput.files.length) {
        handleFileSelection(directResumeFileInput.files[0], true);
      }
    });
  }

  if (btnTriggerResumeImport) {
    btnTriggerResumeImport.addEventListener("click", (e) => {
      e.stopPropagation();
      cardOptionResume.classList.add("active");
      if (cardOptionAi) cardOptionAi.classList.remove("active");
      openModal(modalResumeImport);
    });
  }

  if (cardOptionAi) {
    cardOptionAi.addEventListener("click", () => {
      cardOptionAi.classList.add("active");
      if (cardOptionResume) cardOptionResume.classList.remove("active");
      portHeroTitle.focus();
      showToast("AI Customization Mode active! Fill your details and use AI buttons.", "info");
    });
  }

  if (btnTriggerAiMode) {
    btnTriggerAiMode.addEventListener("click", (e) => {
      e.stopPropagation();
      cardOptionAi.classList.add("active");
      if (cardOptionResume) cardOptionResume.classList.remove("active");
      portHeroTitle.focus();
      showToast("AI Customization Mode active! Fill your details and use AI buttons.", "info");
    });
  }

  // =========================================================================
  // 4. RESUME & SAVED PORTFOLIO IMPORT PARSERS
  // =========================================================================
  async function loadUserResumesForImport() {
    try {
      userResumesList = await getUserResumes(user.uid);
      if (selectSavedResume) {
        if (userResumesList && userResumesList.length > 0) {
          selectSavedResume.innerHTML = userResumesList.map((r, i) => `
            <option value="${i}">${escapeHtml(r.title || "Resume #" + (i + 1))} — ${escapeHtml(r.targetRole || "Software")}</option>
          `).join("");
        } else {
          selectSavedResume.innerHTML = `<option value="">No saved resumes found in account yet</option>`;
        }
      }
    } catch (e) {
      console.warn("Could not load resumes for import:", e);
    }
  }

  const quickSwitchPortfolio = document.getElementById("quick-switch-portfolio");
  const portfolioCountIndicator = document.getElementById("portfolio-count-indicator");
  const btnQuickLoadPortfolio = document.getElementById("btn-quick-load-portfolio");
  let cachedSavedPortfoliosList = [];

  async function loadSavedPortfoliosForImport() {
    try {
      cachedSavedPortfoliosList = await getUserPortfolios(user.uid);
      const count = cachedSavedPortfoliosList ? cachedSavedPortfoliosList.length : 0;

      if (portfolioCountIndicator) {
        portfolioCountIndicator.textContent = count > 0 ? `${count} Saved ${count === 1 ? "Portfolio" : "Portfolios"}` : "No saved portfolios yet (Save a draft to add one)";
      }

      if (quickSwitchPortfolio) {
        if (count > 0) {
          quickSwitchPortfolio.innerHTML = '<option value="">-- Select Portfolio to Open --</option>' + cachedSavedPortfoliosList.map((p, i) => `
            <option value="${i}">${escapeHtml(p.heroTitle || p.name || `Portfolio #${i + 1}`)} (${new Date(p.updatedAt || Date.now()).toLocaleDateString()})</option>
          `).join("");
        } else {
          quickSwitchPortfolio.innerHTML = `<option value="">No saved portfolios found yet</option>`;
        }
      }

      if (selectSavedPortfolio) {
        if (count > 0) {
          selectSavedPortfolio.innerHTML = cachedSavedPortfoliosList.map((p, i) => `
            <option value="${i}">${escapeHtml(p.heroTitle || p.name || `Portfolio #${i + 1}`)} (${new Date(p.updatedAt || Date.now()).toLocaleDateString()})</option>
          `).join("");
        } else {
          selectSavedPortfolio.innerHTML = `<option value="">No saved portfolios found in account yet</option>`;
        }
      }
    } catch (e) {
      console.warn("Could not load saved portfolios for import:", e);
    }
  }

  if (btnQuickLoadPortfolio && quickSwitchPortfolio) {
    btnQuickLoadPortfolio.addEventListener("click", async () => {
      let idx = quickSwitchPortfolio.value;
      if (idx === "" || idx === undefined) {
        if (cachedSavedPortfoliosList.length > 0) {
          idx = "0";
        } else {
          showToast("Please save a portfolio draft first or choose from the dropdown.", "info");
          return;
        }
      }
      const selected = cachedSavedPortfoliosList[parseInt(idx, 10)] || (await getUserPortfolios(user.uid))[parseInt(idx, 10)];
      if (selected) {
        applyExactSavedPortfolio(selected);
        showToast(`✓ Opened portfolio: "${selected.heroTitle || selected.name || "Portfolio"}" with all details intact!`, "success");
      } else {
        showToast("Selected portfolio could not be found.", "error");
      }
    });

    quickSwitchPortfolio.addEventListener("change", async () => {
      const idx = quickSwitchPortfolio.value;
      if (idx !== "" && idx !== undefined) {
        const selected = cachedSavedPortfoliosList[parseInt(idx, 10)] || (await getUserPortfolios(user.uid))[parseInt(idx, 10)];
        if (selected) {
          applyExactSavedPortfolio(selected);
          showToast(`✓ Switched to portfolio: "${selected.heroTitle || selected.name || "Portfolio"}"!`, "success");
        }
      }
    });
  }

  // =========================================================================
  // RECRUITER INQUIRIES & MESSAGES CONTROLLER
  // =========================================================================
  async function loadCandidateInquiries() {
    try {
      const list = await getCandidateInquiries(user.uid);
      const count = list ? list.length : 0;
      if (badgeInquiriesCount) {
        badgeInquiriesCount.textContent = `Inquiries (${count})`;
      }
      if (inquiriesListContainer) {
        if (count === 0) {
          inquiriesListContainer.innerHTML = `
            <div style="text-align:center; padding: 2.5rem 1rem; color:var(--text-muted);">
              <span style="font-size:2.5rem; display:block; margin-bottom:0.75rem;">📭</span>
              <strong style="color:var(--text-primary); font-size:1.05rem;">No Inquiries Received Yet</strong>
              <p style="font-size:0.85rem; margin-top:0.35rem; max-width:420px; margin-left:auto; margin-right:auto;">
                When recruiters or hiring managers use the <strong>"Contact Candidate"</strong> button on your public portfolio, their messages, contact number, and opportunity details will appear here.
              </p>
            </div>
          `;
        } else {
          inquiriesListContainer.innerHTML = list.map((inq) => `
            <div class="card card-glass" style="padding:1.25rem; margin-bottom:1rem; border:1px solid var(--border-glass);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                <div>
                  <strong style="font-size:1rem; color:var(--text-primary);">${escapeHtml(inq.senderName || "Recruiter")}</strong>
                  <span style="color:var(--text-secondary); font-size:0.85rem;"> · ${escapeHtml(inq.company || "Company")}</span>
                  ${inq.role ? `<div style="font-size:0.8rem; color:var(--primary-light); font-weight:600; margin-top:0.2rem;">🎯 Opportunity: ${escapeHtml(inq.role)}</div>` : ""}
                </div>
                <span style="font-size:0.75rem; color:var(--text-muted);">${new Date(inq.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div style="display:flex; gap:1.25rem; font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem; flex-wrap:wrap; background:rgba(255,255,255,0.03); padding:0.5rem 0.75rem; border-radius:var(--radius-sm);">
                <span>📧 <a href="mailto:${escapeHtml(inq.senderEmail)}" style="color:var(--accent-cyan); text-decoration:underline;">${escapeHtml(inq.senderEmail)}</a></span>
                <span>📞 <strong style="color:var(--text-primary);">${escapeHtml(inq.senderPhone || "N/A")}</strong></span>
              </div>
              <p style="font-size:0.85rem; color:var(--text-primary); background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-sm); margin:0 0 0.75rem; line-height:1.5; white-space:pre-wrap;">
                ${escapeHtml(inq.message || "")}
              </p>
              <div style="display:flex; justify-content:flex-end;">
                <a href="mailto:${escapeHtml(inq.senderEmail)}?subject=Re:%20Opportunity%20Inquiry%20via%20CareerForge" class="btn btn-primary btn-sm">
                  Reply via Email ✉️
                </a>
              </div>
            </div>
          `).join("");
        }
      }
    } catch (e) {
      console.warn("Could not load inquiries:", e);
    }
  }

  if (btnOpenInquiriesModal) {
    btnOpenInquiriesModal.addEventListener("click", async () => {
      await loadCandidateInquiries();
      openModal(modalInquiries);
    });
  }
  if (btnCloseInquiriesModal) {
    btnCloseInquiriesModal.addEventListener("click", () => closeModal(modalInquiries));
  }
  if (btnCloseInquiriesFooter) {
    btnCloseInquiriesFooter.addEventListener("click", () => closeModal(modalInquiries));
  }

  // Import Modal Tabs
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      tabButtons.forEach((b) => {
        b.classList.remove("btn-primary");
        b.classList.add("btn-secondary");
      });
      btn.classList.remove("btn-secondary");
      btn.classList.add("btn-primary");

      document.querySelectorAll(".import-tab-content").forEach((tab) => {
        tab.style.display = "none";
      });
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.style.display = "block";

      const btnTxt = document.getElementById("btn-execute-import-txt");
      if (btnTxt) {
        if (btn.dataset.tab === "tab-saved-portfolios") {
          btnTxt.textContent = "Open Selected Portfolio ➔";
          await loadSavedPortfoliosForImport();
        } else {
          btnTxt.textContent = "Import Portfolio ✨";
        }
      }
    });
  });

  // File Upload Handlers
  let uploadedResumeText = "";

  if (resumeFileDropzone && inputResumeFile) {
    resumeFileDropzone.addEventListener("click", () => inputResumeFile.click());
    
    resumeFileDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      resumeFileDropzone.classList.add("drag-over");
    });
    resumeFileDropzone.addEventListener("dragleave", () => {
      resumeFileDropzone.classList.remove("drag-over");
    });
    resumeFileDropzone.addEventListener("drop", async (e) => {
      e.preventDefault();
      resumeFileDropzone.classList.remove("drag-over");
      if (e.dataTransfer.files.length) {
        await handleFileSelection(e.dataTransfer.files[0], true);
      }
    });

    inputResumeFile.addEventListener("change", async () => {
      if (inputResumeFile.files.length) {
        await handleFileSelection(inputResumeFile.files[0], true);
      }
    });
  }

  async function handleFileSelection(file, autoProcess = true) {
    if (!file) return;
    if (fileUploadStatus) {
      fileUploadStatus.innerHTML = `Reading <em>${escapeHtml(file.name)}</em>...`;
    }
    showToast(`Reading ${file.name}... extracting resume details & generating AI portfolio ✨`, "info");

    const fileNameLower = file.name.toLowerCase();

    try {
      if (fileNameLower.endsWith(".pdf")) {
        // PDF parsing via PDF.js
        if (window.pdfjsLib) {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(" ");
            fullText += pageText + "\n";
          }
          uploadedResumeText = fullText;
        } else {
          uploadedResumeText = await file.text();
        }
      } else if (fileNameLower.endsWith(".docx")) {
        // DOCX parsing via Mammoth.js
        if (window.mammoth) {
          const arrayBuffer = await file.arrayBuffer();
          const result = await window.mammoth.extractRawText({ arrayBuffer });
          uploadedResumeText = result.value || "";
        } else {
          uploadedResumeText = await file.text();
        }
      } else if (fileNameLower.endsWith(".json")) {
        // JSON structured resume export
        const raw = await file.text();
        try {
          uploadedResumeText = JSON.parse(raw);
        } catch {
          uploadedResumeText = raw;
        }
      } else {
        // Plain text / Markdown / other formats
        uploadedResumeText = await file.text();
      }

      if (fileUploadStatus) {
        fileUploadStatus.innerHTML = `✓ Uploaded: <strong>${escapeHtml(file.name)}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
      }

      if (autoProcess) {
        await parseAndApplyResumeData(uploadedResumeText);
      } else {
        showToast(`Loaded ${file.name}! Click 'Generate Portfolio ✨' below.`, "success");
      }
    } catch (err) {
      console.error("Resume file extraction error:", err);
      showToast("Could not read file: " + err.message + ". Please try uploading a TXT, PDF, or JSON file.", "error");
    }
  }

  // Execute Resume Import Parser & Comprehensive AI Portfolio Generator
  async function parseAndApplyResumeData(resumeData) {
    if (!resumeData) return;

    showToast("✨ AI is analyzing your resume & populating your portfolio...", "info");

    let detectedRole = "Full Stack Software Engineer";
    let candidateName = user.displayName || "Engineer";
    let candidateEmail = user.email || "";
    let candidatePhone = "";
    let candidateLocation = "";
    let candidateLinkedin = "";
    let candidateGithub = "";
    let candidateSkillsText = "";
    let candidateSummary = "";
    let candidateExperienceText = "";
    let candidateEducationText = "";
    let candidateCertsText = "";
    let candidateAchievementsText = "";
    let rawProjectsFound = [];

    if (typeof resumeData === "string") {
      const text = resumeData;
      const lines = text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);

      // 1. Contact Information Extraction
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) candidateEmail = emailMatch[0];

      const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) candidatePhone = phoneMatch[0];

      const linkedinMatch = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i) || text.match(/linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
      if (linkedinMatch) {
        const link = linkedinMatch[0];
        candidateLinkedin = link.startsWith("http") ? link : `https://${link}`;
      }

      const githubMatch = text.match(/https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i) || text.match(/github\.com\/[a-zA-Z0-9_-]+/i);
      if (githubMatch) {
        const link = githubMatch[0];
        candidateGithub = link.startsWith("http") ? link : `https://${link}`;
      }

      // Name Extraction (clean top header lines)
      for (let i = 0; i < Math.min(5, lines.length); i++) {
        const l = lines[i].trim();
        if (l && !l.includes("@") && !l.match(/\d{5,}/) && !l.toLowerCase().includes("resume") && !l.toLowerCase().includes("curriculum") && !l.toLowerCase().includes("http") && !l.toLowerCase().includes("page")) {
          candidateName = l.replace(/[|•,].*/, "").trim();
          break;
        }
      }

      // 2. Comprehensive Section Identification
      const SECTION_PATTERNS = [
        { key: "summary", regex: /^(summary|professional summary|executive summary|career summary|objective|career objective|profile|about me|about|overview)/i },
        { key: "education", regex: /^(education|academic background|academics|educational background|qualifications|academic qualifications|degrees|coursework)/i },
        { key: "experience", regex: /^(experience|work experience|employment history|employment|professional experience|work history|career history|internships|internship experience|relevant experience)/i },
        { key: "projects", regex: /^(projects|personal projects|academic projects|key projects|featured projects|technical projects|portfolio projects)/i },
        { key: "skills", regex: /^(skills|technical skills|technologies|tech stack|core competencies|skills & abilities|skills & tools|programming skills|key skills)/i },
        { key: "certifications", regex: /^(certifications|certificates|licenses|certifications & licenses|courses|trainings|credentials)/i },
        { key: "achievements", regex: /^(achievements|awards|honors|awards & achievements|accomplishments|publications|extracurricular activities|extra-curricular|co-curricular|activities|leadership)/i }
      ];

      // Partition all document lines by section
      const sectionBuckets = {
        summary: [],
        education: [],
        experience: [],
        projects: [],
        skills: [],
        certifications: [],
        achievements: [],
        header: []
      };

      let currentSection = "header";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineClean = line.replace(/[:\-—–]+$/, "").trim();

        // Check if line is a section header
        let matchedKey = null;
        for (const pattern of SECTION_PATTERNS) {
          if (pattern.regex.test(lineClean)) {
            matchedKey = pattern.key;
            break;
          }
        }

        if (matchedKey) {
          currentSection = matchedKey;
        } else {
          if (sectionBuckets[currentSection]) {
            sectionBuckets[currentSection].push(line);
          }
        }
      }

      // Populate Extracted Content directly from parsed section buckets
      if (sectionBuckets.summary.length > 0) {
        candidateSummary = sectionBuckets.summary.join("\n");
      }

      if (sectionBuckets.education.length > 0) {
        candidateEducationText = sectionBuckets.education.join("\n");
      }

      if (sectionBuckets.experience.length > 0) {
        candidateExperienceText = sectionBuckets.experience.join("\n");
      }

      if (sectionBuckets.skills.length > 0) {
        candidateSkillsText = sectionBuckets.skills.join(", ").replace(/\s+/g, " ");
      }

      if (sectionBuckets.certifications.length > 0) {
        candidateCertsText = sectionBuckets.certifications.join("\n");
      }

      if (sectionBuckets.achievements.length > 0) {
        candidateAchievementsText = sectionBuckets.achievements.join("\n");
      }

      // Parse Projects from project bucket
      if (sectionBuckets.projects.length > 0) {
        const projLines = sectionBuckets.projects;
        const projectBlocks = [];
        let currentProj = null;

        for (let i = 0; i < projLines.length; i++) {
          const l = projLines[i];
          const isBullet = l.startsWith("•") || l.startsWith("-") || l.startsWith("*") || /^\d+\./.test(l);
          
          if (!isBullet && l.length < 80 && !l.includes("http")) {
            if (currentProj) projectBlocks.push(currentProj);
            currentProj = { title: l.replace(/^[-•*]\s*/, ""), bullets: "" };
          } else if (currentProj) {
            currentProj.bullets += (currentProj.bullets ? "\n" : "") + l;
          } else {
            currentProj = { title: l.replace(/^[-•*]\s*/, ""), bullets: "" };
          }
        }
        if (currentProj) projectBlocks.push(currentProj);

        if (projectBlocks.length > 0) {
          rawProjectsFound = projectBlocks;
        }
      }

      // Fallback for Skills if no dedicated section was labeled
      if (!candidateSkillsText) {
        const commonTech = [
          "JavaScript", "TypeScript", "HTML5", "CSS3", "React", "React Native", "Vue.js", "Angular",
          "Node.js", "Express", "Next.js", "Python", "Django", "Flask", "Java", "Spring Boot",
          "C++", "C#", ".NET", "Golang", "Rust", "PHP", "Laravel", "SQL", "PostgreSQL",
          "MySQL", "MongoDB", "Firebase", "Redis", "AWS", "Docker", "Kubernetes", "Git",
          "GitHub", "REST APIs", "GraphQL", "TailwindCSS", "Figma", "CI/CD"
        ];
        const found = [];
        for (const t of commonTech) {
          const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`(?:^|[^a-zA-Z0-9_+#.])${escaped}(?:$|[^a-zA-Z0-9_+#.])`, "i");
          if (regex.test(text)) {
            found.push(t);
          }
        }
        candidateSkillsText = found.length > 0 ? found.join(", ") : "JavaScript (ES6+), HTML5, CSS3, React, Node.js, REST APIs, Git & GitHub, Cloud Architecture";
      }

      // Target Role Detection
      if (/full[- ]?stack/i.test(text)) detectedRole = "Full Stack Engineer";
      else if (/frontend|react|vue|angular|web developer/i.test(text)) detectedRole = "Frontend & Web Engineer";
      else if (/backend|node|python|java|api|database|microservice|golang/i.test(text)) detectedRole = "Backend & Systems Engineer";
      else if (/data scientist|machine learning|ai|deep learning|nlp|tensorflow|pytorch/i.test(text)) detectedRole = "Data Scientist & AI Engineer";
      else if (/devops|cloud|aws|docker|kubernetes|sre|terraform|gcp|azure/i.test(text)) detectedRole = "DevOps & Cloud Engineer";
      else if (/mobile|ios|android|flutter|react native|swift|kotlin/i.test(text)) detectedRole = "Mobile App Developer";
      else if (/cyber|security|soc|penetration|infosec|siem/i.test(text)) detectedRole = "Cybersecurity Analyst";
      else if (/ui\/ux|product design|figma|designer|wireframe/i.test(text)) detectedRole = "UI/UX & Product Designer";

    } else {
      // Structured Resume Object
      if (resumeData.name) candidateName = resumeData.name;
      if (resumeData.email) candidateEmail = resumeData.email;
      if (resumeData.phone) candidatePhone = resumeData.phone;
      if (resumeData.address) candidateLocation = resumeData.address;
      if (resumeData.linkedin) candidateLinkedin = resumeData.linkedin;
      if (resumeData.github) candidateGithub = resumeData.github;
      if (resumeData.targetRole) detectedRole = resumeData.targetRole;
      if (resumeData.skills) candidateSkillsText = resumeData.skills;
      if (resumeData.summary) candidateSummary = resumeData.summary;

      if (resumeData.certifications && Array.isArray(resumeData.certifications)) {
        candidateCertsText = resumeData.certifications.map((c) => `${c.name || ""} — ${c.issuer || ""} (${c.year || ""})`).join("\n");
      }

      if (resumeData.achievements && Array.isArray(resumeData.achievements)) {
        candidateAchievementsText = resumeData.achievements.map((a) => `${a.title || ""}: ${a.details || ""}`).join("\n");
      }

      if (resumeData.workExperience && Array.isArray(resumeData.workExperience)) {
        candidateExperienceText = resumeData.workExperience.map((w) => `${w.role || ""} at ${w.company || ""} (${w.period || ""})\n${w.rawBullets || ""}`).join("\n\n");
      } else if (resumeData.internships && Array.isArray(resumeData.internships)) {
        candidateExperienceText = resumeData.internships.map((i) => `${i.role || ""} at ${i.company || ""} (${i.period || ""})\n${i.rawBullets || ""}`).join("\n\n");
      }

      if (resumeData.educationList && Array.isArray(resumeData.educationList)) {
        candidateEducationText = resumeData.educationList.map((e) => `${e.degree || ""} — ${e.institution || ""} (${e.year || ""}) | GPA: ${e.gpa || "N/A"}`).join("\n");
      }

      if (resumeData.projects && Array.isArray(resumeData.projects)) {
        rawProjectsFound = resumeData.projects;
      }
    }

    // =========================================================================
    // 4. POPULATE EVERY FIELD IN THE PORTFOLIO FORM NON-DESTRUCTIVELY
    // =========================================================================
    if (candidateName) portName.value = candidateName;
    if (candidateEmail) portEmail.value = candidateEmail;
    if (candidatePhone) portPhone.value = candidatePhone;
    if (candidateLocation) portLocation.value = candidateLocation;
    if (candidateLinkedin) portLinkedin.value = candidateLinkedin;
    if (candidateGithub) portGithub.value = candidateGithub;
    if (candidateSkillsText) portSkills.value = candidateSkillsText;

    if (candidateExperienceText) portExperience.value = candidateExperienceText;
    if (candidateEducationText) portEducation.value = candidateEducationText;
    if (candidateCertsText) portCerts.value = candidateCertsText;
    if (candidateAchievementsText) portAchievements.value = candidateAchievementsText;

    // AI-Generated Hero Tagline (only update if empty or general placeholder)
    if (!portHeroTitle.value || portHeroTitle.value.includes("Building intuitive")) {
      portHeroTitle.value = `${detectedRole} | Building Scalable, Modern Solutions & Engaging User Experiences`;
    }

    // AI-Generated First-Person Narrative Story (using extracted resume facts)
    const firstName = (candidateName || portName.value || user.displayName || "Engineer").split(" ")[0];
    const topSkillsList = (candidateSkillsText || portSkills.value).split(",").slice(0, 4).map((s) => s.trim()).join(", ") || "Modern Computing Standards";
    
    if (candidateSummary && candidateSummary.length > 40) {
      portAboutText.value = `I am ${firstName}, a dedicated ${detectedRole} with a strong foundation in ${topSkillsList}.\n\n${candidateSummary}\n\nI am driven by writing maintainable, clean code, building responsive user experiences, and collaborating in high-impact engineering teams.`;
    } else if (!portAboutText.value) {
      portAboutText.value = `I am ${firstName}, a passionate ${detectedRole} dedicated to engineering intuitive, high-performance web applications and digital experiences. With strong proficiencies in ${topSkillsList}, I bridge clean design and scalable system architecture.\n\nI thrive in collaborative problem-solving environments, delivering reliable, user-focused products from initial prototype to production cloud deployment.`;
    }

    // AI-Synthesized Project Case Studies (Structured with Problem, Solution, Highlights)
    if (rawProjectsFound.length > 0) {
      projectsList = rawProjectsFound.map((p, idx) => ({
        id: "p_" + Date.now() + "_" + idx,
        title: p.title || `${detectedRole} Project #${idx + 1}`,
        overview: (p.bullets || p.rawBullets || `High-performance technical solution engineered for ${detectedRole} workflows.`).split("\n")[0],
        techStack: p.tech || topSkillsList || "JavaScript, REST APIs, Cloud Database",
        problem: `Users required scalable, low-latency execution with high availability and seamless data management.`,
        solution: p.bullets || p.rawBullets || `Architected modular component hierarchy and integrated RESTful endpoints with automated validation.`,
        highlights: `Achieved sub-100ms API response latency and maintained verified test coverage across core pathways.`,
        demoUrl: p.link || "https://demo.example.com",
        githubUrl: p.github || candidateGithub || "https://github.com"
      }));
    } else {
      projectsList = [
        {
          id: "p_" + Date.now() + "_1",
          title: `Flagship ${detectedRole} Platform`,
          overview: `Architected a high-throughput, reactive web platform providing real-time data visualization and cloud synchronization.`,
          techStack: topSkillsList || "JavaScript (ES6+), React, Node.js, Cloud Firestore",
          problem: `Users required low-latency real-time collaboration with offline persistence and zero state conflicts.`,
          solution: `Engineered a reactive client-side store synchronized with serverless cloud database events and compound indexing to optimize payload delivery.`,
          highlights: `Achieved sub-100ms UI latency, 99.9% uptime, and 100% test coverage across core data transformation modules.`,
          demoUrl: "https://demo.example.com",
          githubUrl: candidateGithub || "https://github.com"
        },
        {
          id: "p_" + Date.now() + "_2",
          title: `Automated Workflow & Analytics Engine`,
          overview: `Engineered a modular analytics dashboard processing dynamic event metrics, interactive data charts, and automated reporting.`,
          techStack: "JavaScript ES6+, RESTful APIs, Cloud Functions, CSS Grid",
          problem: `Visualizing high-volume metric streams without degrading frontend rendering performance or blocking the main thread.`,
          solution: `Implemented debounced event streams, client-side caching strategies, and lazy-loaded chart modules to maintain 60 FPS scrolling.`,
          highlights: `Boosted client query throughput by 40% and reduced initial bundle load time by 35%.`,
          demoUrl: "https://demo.example.com",
          githubUrl: candidateGithub || "https://github.com"
        }
      ];
    }

    // Smart Portfolio Template Activation Based on Detected Role
    if (/design|ui|ux/i.test(detectedRole)) {
      setPortfolioTemplate("creative");
    } else if (/lead|executive|manager|architect/i.test(detectedRole)) {
      setPortfolioTemplate("executive");
    } else if (/student|early/i.test(detectedRole)) {
      setPortfolioTemplate("academic");
    } else {
      setPortfolioTemplate("modern-dev");
    }

    // Re-render project cards in UI
    renderProjects();

    // Auto-Save Portfolio to Firestore & Local Storage
    try {
      if (user && user.uid) {
        await savePortfolioDoc(user.uid, currentPortfolioId, {
          name: portName.value,
          email: portEmail.value,
          phone: portPhone.value,
          location: portLocation.value,
          linkedin: portLinkedin.value,
          github: portGithub.value,
          heroTitle: portHeroTitle.value,
          aboutMe: portAboutText.value,
          skills: portSkills.value,
          certifications: portCerts.value,
          achievements: portAchievements.value,
          experience: portExperience.value,
          education: portEducation.value,
          projects: projectsList,
          template: activeTemplate,
          isPublished: true,
          photoURL: currentPhotoURL,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (saveErr) {
      console.warn("Auto-save notice:", saveErr);
    }

    closeModal(modalResumeImport);
    showToast("🎉 Portfolio generated from resume with AI! All details populated.", "success");

    // Smooth scroll down to the portfolio form
    setTimeout(() => {
      const formEl = document.getElementById("port-name");
      if (formEl) {
        formEl.scrollIntoView({ behavior: "smooth", block: "center" });
        formEl.focus();
      }
    }, 300);
  }

  if (btnExecuteResumeImport) {
    btnExecuteResumeImport.addEventListener("click", async () => {
      const activeTabBtn = document.querySelector(".tab-import-method.btn-primary");
      const mode = activeTabBtn?.dataset.tab;

      if (mode === "tab-saved-portfolios") {
        const idx = selectSavedPortfolio?.value;
        if (idx === "" || idx === undefined) {
          showToast("Please select a saved portfolio to load.", "error");
          return;
        }
        try {
          const portfolios = await getUserPortfolios(user.uid);
          const selected = portfolios && portfolios[parseInt(idx, 10)];
          if (selected) {
            applyExactSavedPortfolio(selected);
            closeModal(modalResumeImport);
            showToast("✓ Successfully loaded saved portfolio with all details intact!", "success");
            return;
          } else {
            showToast("Selected portfolio could not be found.", "error");
          }
        } catch (err) {
          showToast("Error loading portfolio: " + err.message, "error");
        }
        return;
      } else if (mode === "tab-saved") {
        const idx = selectSavedResume.value;
        if (idx !== "" && userResumesList[idx]) {
          await parseAndApplyResumeData(userResumesList[idx]);
        } else if (userResumesList.length > 0) {
          await parseAndApplyResumeData(userResumesList[0]);
        } else {
          showToast("No saved resumes found in account.", "error");
        }
      } else if (mode === "tab-paste") {
        const text = textareaResumePaste.value.trim();
        if (!text) {
          showToast("Please paste some resume text first.", "error");
          return;
        }
        await parseAndApplyResumeData(text);
      } else {
        if (!uploadedResumeText) {
          if (textareaResumePaste.value.trim()) {
            await parseAndApplyResumeData(textareaResumePaste.value.trim());
          } else if (userResumesList.length > 0) {
            await parseAndApplyResumeData(userResumesList[0]);
          } else {
            showToast("Please upload a resume file or select a saved resume.", "error");
            return;
          }
          return;
        }
        try {
          const parsedJson = typeof uploadedResumeText === "object" ? uploadedResumeText : JSON.parse(uploadedResumeText);
          await parseAndApplyResumeData(parsedJson);
        } catch {
          await parseAndApplyResumeData(uploadedResumeText);
        }
      }
    });
  }

  if (btnCloseResumeModal) {
    btnCloseResumeModal.addEventListener("click", () => closeModal(modalResumeImport));
  }
  if (btnCancelResumeImport) {
    btnCancelResumeImport.addEventListener("click", () => closeModal(modalResumeImport));
  }

  // =========================================================================
  // 5. RENDER PROJECT CARDS
  // =========================================================================
  function renderProjects() {
    portProjectsContainer.innerHTML = projectsList.map((proj, idx) => `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1.25rem; border:1px solid var(--border-glass);" data-id="${proj.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <strong style="color:var(--text-primary); font-size:0.95rem;">Project #${idx + 1}: ${escapeHtml(proj.title || "Untitled Project")}</strong>
          <div style="display:flex; gap:0.5rem;">
            <button type="button" class="btn btn-ai btn-sm btn-ai-case-study" data-idx="${idx}">
              <span>AI Case Study ✨</span>
            </button>
            <button type="button" class="btn btn-danger btn-sm btn-delete-proj" data-idx="${idx}" style="padding:2px 8px;">Delete</button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom:0.75rem;">
          <label class="form-label" style="font-size:0.75rem;">Project Title</label>
          <input type="text" class="form-input proj-title" value="${escapeHtml(proj.title || "")}" placeholder="e.g. Real-Time AI Platform">
        </div>

        <div class="form-group" style="margin-bottom:0.75rem;">
          <label class="form-label" style="font-size:0.75rem;">Technologies / Tags</label>
          <input type="text" class="form-input proj-tech" value="${escapeHtml(proj.techStack || "")}" placeholder="e.g. JavaScript, Firebase, WebSockets">
        </div>

        <div class="form-group" style="margin-bottom:0.75rem;">
          <label class="form-label" style="font-size:0.75rem;">Project Overview & Problem Statement</label>
          <textarea class="form-textarea proj-overview" rows="2" placeholder="Describe the problem this project addresses...">${escapeHtml(proj.overview || "")}</textarea>
        </div>

        <div class="form-group" style="margin-bottom:0.75rem;">
          <label class="form-label" style="font-size:0.75rem;">Architecture & Solution</label>
          <textarea class="form-textarea proj-solution" rows="2" placeholder="How you built it and technical achievements...">${escapeHtml(proj.solution || "")}</textarea>
        </div>

        <div class="grid grid-cols-2" style="gap:0.75rem; margin-bottom:0;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size:0.75rem;">Live Demo URL</label>
            <input type="url" class="form-input proj-demo" value="${escapeHtml(proj.demoUrl || "")}" placeholder="https://example.com/demo">
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size:0.75rem;">GitHub Repository URL</label>
            <input type="url" class="form-input proj-github" value="${escapeHtml(proj.githubUrl || "")}" placeholder="https://github.com/user/repo">
          </div>
        </div>
      </div>
    `).join("");

    // Attach input listeners
    document.querySelectorAll(".proj-title, .proj-tech, .proj-overview, .proj-solution, .proj-demo, .proj-github").forEach((input) => {
      input.addEventListener("input", updateProjectsState);
    });

    // Delete Project
    document.querySelectorAll(".btn-delete-proj").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        projectsList.splice(idx, 1);
        renderProjects();
      });
    });

    // AI Case Study Generation per project
    document.querySelectorAll(".btn-ai-case-study").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        const proj = projectsList[idx];

        if (!proj.title) {
          showToast("Please enter a project title first.", "error");
          return;
        }

        setButtonLoading(btn, true);
        try {
          const result = await generateAIProjectStory({
            title: proj.title,
            rawDescription: proj.overview,
            techStack: proj.techStack
          });

          if (result) {
            proj.overview = result.overview || proj.overview;
            proj.solution = result.solutionArchitecture || proj.solution;
            if (result.recommendedTags?.length) {
              proj.techStack = result.recommendedTags.join(", ");
            }
            renderProjects();
            showToast("AI Case Study narrative generated!", "success");
          }
        } catch (err) {
          showToast(err.message || "Case study generation failed", "error");
        } finally {
          setButtonLoading(btn, false);
        }
      });
    });
  }

  function updateProjectsState() {
    const cards = portProjectsContainer.querySelectorAll("[data-id]");
    cards.forEach((card, idx) => {
      if (projectsList[idx]) {
        projectsList[idx].title = card.querySelector(".proj-title")?.value || "";
        projectsList[idx].techStack = card.querySelector(".proj-tech")?.value || "";
        projectsList[idx].overview = card.querySelector(".proj-overview")?.value || "";
        projectsList[idx].solution = card.querySelector(".proj-solution")?.value || "";
        projectsList[idx].demoUrl = card.querySelector(".proj-demo")?.value || "";
        projectsList[idx].githubUrl = card.querySelector(".proj-github")?.value || "";
      }
    });
  }

  // Add Project
  btnAddProj.addEventListener("click", () => {
    projectsList.push({
      id: "p_" + Date.now(),
      title: "New Project Showcase",
      overview: "Built to solve modern developer workflow bottlenecks.",
      techStack: "JavaScript, Cloud, APIs",
      solution: "Architected modular client-side state and optimized cloud queries.",
      demoUrl: "",
      githubUrl: ""
    });
    renderProjects();
  });

  // AI About Me Generator
  btnAiAboutMe.addEventListener("click", async () => {
    setButtonLoading(btnAiAboutMe, true);
    try {
      const result = await generateAIAboutMe({
        name: portName.value || user.displayName || "Professional",
        targetRole: portHeroTitle.value || "Full Stack Software Engineer",
        interests: portSkills.value || "Cloud architectures, AI agents, full-stack web platforms"
      });

      if (result?.detailedStory) {
        portAboutText.value = result.detailedStory;
        if (result.heroTagline && !portHeroTitle.value) portHeroTitle.value = result.heroTagline;
        showToast("Personal summary & story generated!", "success");
      }
    } catch (err) {
      showToast(err.message || "Failed to generate bio", "error");
    } finally {
      setButtonLoading(btnAiAboutMe, false);
    }
  });

  // =========================================================================
  // 6. LIVE INTERACTIVE PREVIEW MODAL
  // =========================================================================
  btnOpenLivePreview.addEventListener("click", () => {
    updateProjectsState();
    renderLivePreview();
    openModal(modalLivePreview);
  });

  btnCloseLivePreview.addEventListener("click", () => closeModal(modalLivePreview));
  btnClosePreviewFooter.addEventListener("click", () => closeModal(modalLivePreview));

  function renderLivePreview() {
    if (previewActiveThemeTag) {
      previewActiveThemeTag.textContent = TEMPLATE_NAMES[activeTemplate] || activeTemplate;
    }

    const name = portName.value.trim() || user.displayName || "Candidate Name";
    const heroTitle = portHeroTitle.value.trim() || "Full Stack Developer & Technical Innovator";
    const about = portAboutText.value.trim() || "Driven technologist passionate about engineering elegant, high-performance solutions.";
    const skillsArray = (portSkills.value || "").split(",").map((s) => s.trim()).filter(Boolean);

    livePreviewContent.className = `modal-body portfolio-theme-${activeTemplate}`;
    livePreviewContent.innerHTML = `
      <div style="max-width: 900px; margin: 0 auto;">
        
        <!-- Header with Profile Photo -->
        <div style="text-align: center; margin-bottom: 2.5rem;">
          <img src="${escapeHtml(currentPhotoURL)}" alt="Profile Photo" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); box-shadow: var(--shadow-glow); margin-bottom: 1rem;">
          <h1 style="font-size: 2rem; margin-bottom: 0.5rem;" id="pub-name">${escapeHtml(name)}</h1>
          <p style="font-size: 1.1rem; color: var(--primary-light); font-weight: 600; margin-bottom: 0.75rem;">${escapeHtml(heroTitle)}</p>
          <div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap; font-size: 0.85rem; color: var(--text-muted);">
            ${portEmail.value ? `<span>✉️ ${escapeHtml(portEmail.value)}</span>` : ""}
            ${portLocation.value ? `<span>📍 ${escapeHtml(portLocation.value)}</span>` : ""}
            <a href="${escapeHtml(formatExternalUrl(portLinkedin.value, "linkedin"))}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-light);">LinkedIn ↗</a>
            <a href="${escapeHtml(formatExternalUrl(portGithub.value, "github"))}" target="_blank" rel="noopener noreferrer" style="color:var(--primary-light);">GitHub ↗</a>
          </div>
        </div>

        <!-- About Me Section -->
        <div class="card card-glass" style="margin-bottom: 2rem;">
          <h3 class="card-title" style="margin-bottom: 0.75rem;">About Me</h3>
          <p style="color: var(--text-secondary); line-height: 1.6; margin: 0; font-size: 0.95rem;">${escapeHtml(about)}</p>
        </div>

        <!-- Skills Chips -->
        ${skillsArray.length > 0 ? `
          <div class="card card-glass" style="margin-bottom: 2rem;">
            <h3 class="card-title" style="margin-bottom: 0.75rem;">Core Competencies & Stack</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${skillsArray.map((s) => `<span class="badge badge-primary pub-accent-tag">${escapeHtml(s)}</span>`).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Featured Projects Showcase -->
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.25rem; color: var(--text-primary); margin-bottom: 1rem;">Featured Projects & Case Studies</h3>
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            ${projectsList.map((p) => `
              <div class="card card-glass">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <h4 style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">${escapeHtml(p.title || "Project")}</h4>
                  <div style="display: flex; gap: 0.5rem;">
                    ${p.demoUrl ? `<a href="${escapeHtml(formatExternalUrl(p.demoUrl, "website"))}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Live Demo ↗</a>` : ""}
                    ${p.githubUrl ? `<a href="${escapeHtml(formatExternalUrl(p.githubUrl, "github"))}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Source Code ↗</a>` : ""}
                  </div>
                </div>
                ${p.techStack ? `<div style="font-size: 0.8rem; color: var(--primary-light); margin-bottom: 0.75rem; font-family: var(--font-mono);">${escapeHtml(p.techStack)}</div>` : ""}
                <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">${escapeHtml(p.overview || "")}</p>
                ${p.solution ? `<div style="font-size: 0.85rem; color: var(--text-muted); background: rgba(255,255,255,0.02); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm);"><strong style="color:var(--text-primary);">Architecture:</strong> ${escapeHtml(p.solution)}</div>` : ""}
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Experience & Education -->
        ${(portExperience.value || portEducation.value) ? `
          <div class="grid grid-cols-2" style="gap: 1.5rem; margin-bottom: 2rem;">
            ${portExperience.value ? `
              <div class="card card-glass">
                <h3 class="card-title" style="margin-bottom: 0.75rem;">Experience</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); white-space: pre-line; line-height: 1.5;">${escapeHtml(portExperience.value)}</p>
              </div>
            ` : ""}
            ${portEducation.value ? `
              <div class="card card-glass">
                <h3 class="card-title" style="margin-bottom: 0.75rem;">Education</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); white-space: pre-line; line-height: 1.5;">${escapeHtml(portEducation.value)}</p>
              </div>
            ` : ""}
          </div>
        ` : ""}

        <!-- Recruiter Highlights & Philosophy Section -->
        ${(portPhilosophy?.value || portLearning?.value || portAvailability?.value || portTestimonial?.value || portPublications?.value) ? `
          <div class="card card-glass" style="margin-bottom: 2rem; border: 1px solid var(--border-glass);">
            <h3 class="card-title" style="margin-bottom: 1rem; color: var(--primary-light);">🌟 Recruiter Highlights & Engineering Values</h3>
            
            ${portPhilosophy?.value ? `
              <div style="margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">💡 Engineering Philosophy</span>
                <p style="font-size: 0.9rem; color: var(--text-primary); margin: 0.25rem 0 0; line-height: 1.5;">${escapeHtml(portPhilosophy.value)}</p>
              </div>
            ` : ""}

            ${portLearning?.value ? `
              <div style="margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">🚀 Active Learning & Exploring</span>
                <p style="font-size: 0.9rem; color: var(--accent-cyan); margin: 0.25rem 0 0; font-weight: 500;">${escapeHtml(portLearning.value)}</p>
              </div>
            ` : ""}

            ${(portAvailability?.value || portDomains?.value) ? `
              <div class="grid grid-cols-2" style="gap: 1rem; margin-bottom: 1rem;">
                ${portAvailability?.value ? `
                  <div>
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">📅 Work Availability</span>
                    <p style="font-size: 0.85rem; color: var(--accent-emerald); margin: 0.2rem 0 0; font-weight: 500;">${escapeHtml(portAvailability.value)}</p>
                  </div>
                ` : ""}
                ${portDomains?.value ? `
                  <div>
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">🏢 Target Domains</span>
                    <p style="font-size: 0.85rem; color: var(--primary-light); margin: 0.2rem 0 0;">${escapeHtml(portDomains.value)}</p>
                  </div>
                ` : ""}
              </div>
            ` : ""}

            ${portTestimonial?.value ? `
              <div style="background: rgba(99, 102, 241, 0.08); border-left: 3px solid var(--primary); padding: 0.75rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
                <span style="font-size: 0.75rem; color: var(--primary-light); text-transform: uppercase; font-weight: 600;">💬 Endorsement</span>
                <p style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic; margin: 0.25rem 0 0;">${escapeHtml(portTestimonial.value)}</p>
              </div>
            ` : ""}

            ${portPublications?.value ? `
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">📝 Publications & Talks</span>
                <p style="font-size: 0.85rem; color: var(--text-secondary); white-space: pre-line; margin: 0.25rem 0 0;">${escapeHtml(portPublications.value)}</p>
              </div>
            ` : ""}

          </div>
        ` : ""}

      </div>
    `;
  }

  // =========================================================================
  // 7. SAVE & PUBLISH HANDLERS
  // =========================================================================
  async function savePortfolio(publishStatus = null) {
    updateProjectsState();
    if (publishStatus !== null) isPublished = publishStatus;

    const data = {
      template: activeTemplate,
      name: portName.value.trim(),
      email: portEmail.value.trim(),
      phone: portPhone.value.trim(),
      location: portLocation.value.trim(),
      linkedin: portLinkedin.value.trim(),
      github: portGithub.value.trim(),
      heroTitle: portHeroTitle.value.trim(),
      aboutMe: portAboutText.value.trim(),
      skills: portSkills.value.trim(),
      certifications: portCerts.value.trim(),
      achievements: portAchievements.value.trim(),
      experience: portExperience.value.trim(),
      education: portEducation.value.trim(),
      philosophy: portPhilosophy ? portPhilosophy.value.trim() : "",
      learning: portLearning ? portLearning.value.trim() : "",
      availability: portAvailability ? portAvailability.value.trim() : "",
      domains: portDomains ? portDomains.value.trim() : "",
      testimonial: portTestimonial ? portTestimonial.value.trim() : "",
      publications: portPublications ? portPublications.value.trim() : "",
      projects: projectsList,
      isPublished: isPublished,
      displayName: portName.value.trim() || user.displayName,
      photoURL: currentPhotoURL
    };

    const saved = await savePortfolioDoc(user.uid, currentPortfolioId, data);
    refreshShareUrl();
    return saved;
  }

  btnSavePortfolio.addEventListener("click", async () => {
    setButtonLoading(btnSavePortfolio, true);
    try {
      await savePortfolio();
      showToast("Portfolio draft saved with shareable link!", "success");
    } catch (err) {
      showToast("Save error: " + err.message, "error");
    } finally {
      setButtonLoading(btnSavePortfolio, false);
    }
  });

  btnPublishPortfolio.addEventListener("click", async () => {
    setButtonLoading(btnPublishPortfolio, true);
    try {
      await savePortfolio(true);
      updatePublishButtonState();
      showToast("Portfolio is live & share link updated!", "success");
    } catch (err) {
      showToast("Publish error: " + err.message, "error");
    } finally {
      setButtonLoading(btnPublishPortfolio, false);
    }
  });

  // Copy Link Handler (Cross-Browser URL with payload)
  btnCopyShareLink.addEventListener("click", () => {
    const { url } = refreshShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast("Universal portfolio link copied! Works across all browsers.", "success");
      }).catch(() => {
        showToast("Link: " + url, "info");
      });
    } else {
      showToast("Shareable link ready in box below!", "info");
    }
  });

  // View Public Page Link Handler (Generates live token on click)
  if (btnPreviewPublic) {
    btnPreviewPublic.addEventListener("click", (e) => {
      const { url } = refreshShareUrl();
      btnPreviewPublic.href = url;
    });
  }

  // Initialize
  await init();
});
