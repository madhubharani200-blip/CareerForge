/**
 * AI RESUME BUILDER CONTROLLER (Strict 9-Section Hierarchy & Company-Specific Matcher)
 */

import { getCurrentUser } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { generateAIBullets, generateAIObjective, saveResumeDoc, getResumeById } from "../api/resume-api.js";
import { showToast, setButtonLoading, openModal, closeModal, escapeHtml, debounce } from "../ui-utils.js";
import { db } from "../firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Company Requirements Database
const COMPANY_REQUIREMENTS = {
  Google: {
    roleKeywords: ["Data Structures & Algorithms", "Distributed Systems", "TypeScript", "Python / Go", "System Design", "Scalability", "Unit Testing", "CI/CD"],
    expectations: "Focus on algorithmic efficiency, performance complexity (Big-O), scalable web architectures, and clean code craftsmanship.",
    atsFocus: "Include measurable metrics (e.g. latency reduction in ms, memory optimization, queries/sec)."
  },
  Amazon: {
    roleKeywords: ["AWS Services", "Customer Obsession", "Microservices Architecture", "High Availability", "NoSQL / DynamoDB", "Java / Node.js", "Operational Excellence"],
    expectations: "Leadership Principles alignment: Customer Obsession, Ownership, Bias for Action, and Deliver Results.",
    atsFocus: "Highlight end-to-end service ownership, metrics (e.g. 99.99% uptime), and cost/latency reductions."
  },
  Microsoft: {
    roleKeywords: ["Cloud Infrastructure (Azure)", "TypeScript / React", "C# / .NET / Node.js", "Accessibility (a11y)", "Cross-Platform", "Git Collaboration", "Security"],
    expectations: "Emphasis on cross-team collaboration, accessibility standards, enterprise cloud scalability, and continuous integration.",
    atsFocus: "Showcase user impact, code quality, testing rigor, and cross-browser/cross-platform support."
  },
  Meta: {
    roleKeywords: ["React / React Native", "GraphQL", "High-Throughput APIs", "Frontend Performance", "Move Fast", "Distributed Cache", "A/B Testing"],
    expectations: "Velocity, product intuition, rapid prototyping, and optimizing client-side performance.",
    atsFocus: "Emphasize frontend performance optimizations (Core Web Vitals), component reusability, and user engagement."
  },
  Apple: {
    roleKeywords: ["Privacy & Security", "UI/UX Precision", "Swift / Web Standards", "Memory Safety", "Low Latency", "API Design"],
    expectations: "Extreme attention to detail, privacy-first design, pixel precision, and bulletproof user experience.",
    atsFocus: "Focus on seamless user experience, privacy protocols, and zero-defect deployments."
  },
  Netflix: {
    roleKeywords: ["Chaos Engineering", "Node.js / Java", "Microservices", "Telemetry & Observability", "High-Throughput Streaming", "Autonomous Ownership"],
    expectations: "High freedom & responsibility, resilience, telemetry monitoring, and independent technical leadership.",
    atsFocus: "Highlight telemetry, automated alerting, failure isolation, and performance monitoring."
  },
  Stripe: {
    roleKeywords: ["Payment APIs", "Idempotency", "High Reliability (99.999%)", "TypeScript / Ruby", "Distributed Systems", "Developer Experience"],
    expectations: "Extreme reliability, API ergonomics, financial precision, and bulletproof error handling.",
    atsFocus: "Highlight idempotency, zero-downtime deployments, and robust API integration projects."
  },
  Uber: {
    roleKeywords: ["Real-Time Geospatial", "Kafka / Event Streams", "Go / Java", "Microservices", "High Concurrency", "Low Latency (p99)"],
    expectations: "Real-time dispatch systems, high-concurrency event streaming, and sub-second SLAs.",
    atsFocus: "Showcase real-time websockets, concurrency patterns, and microservices scalability."
  },
  OpenAI: {
    roleKeywords: ["LLM Integration", "Prompt Engineering", "Python / PyTorch", "RAG Pipelines", "Vector Databases", "API Latency Optimization"],
    expectations: "Deep intuition for modern generative AI, agentic patterns, safety evaluation, and rapid experimentation.",
    atsFocus: "Highlight autonomous AI agent architectures, vector embeddings, and LLM orchestration."
  },
  TCS: {
    roleKeywords: ["Full Stack Java / Python / JavaScript", "SQL & Database Normalization", "Agile Methodologies", "Client Project Delivery", "Software Development Lifecycle (SDLC)"],
    expectations: "Strong grasp of fundamental computing concepts, SDLC, client communication, and structured problem-solving.",
    atsFocus: "Clear project methodologies, database architecture, and teamwork achievements."
  },
  Infosys: {
    roleKeywords: ["Core Java / Python / Web Dev", "RESTful Web Services", "Database Management (RDBMS)", "SDLC", "Object-Oriented Design (OOP)"],
    expectations: "Sound foundation in OOP, problem solving, full-stack fundamentals, and willingness to learn emerging technologies.",
    atsFocus: "Highlight fundamental software projects, certifications, and academic excellence."
  },
  Wipro: {
    roleKeywords: ["Cloud Fundamentals", "JavaScript / Python", "REST APIs", "Debugging & Quality Assurance", "SDLC Documentation"],
    expectations: "Practical coding aptitude, quality assurance, system documentation, and collaborative engineering.",
    atsFocus: "Detail development steps, testing methods, and project outcomes clearly."
  },
  Startup: {
    roleKeywords: ["Full Stack Velocity", "End-to-End Ownership", "AI API Integration", "Next.js / Modern JS", "Firebase / Supabase", "Product Sense"],
    expectations: "High velocity, wearing multiple hats, building minimum viable products (MVPs), and direct user impact.",
    atsFocus: "Showcase deployed live demo links, rapid delivery speed, and full-stack versatility."
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation bar
  renderNavbar("resume");

  // State
  let currentResumeId = new URLSearchParams(window.location.search).get("id") || "res_primary_default";
  let activeTargetCompany = "All Companies";
  let activeTemplate = "ats-modern";

  let certificationsList = [
    { id: "c_1", name: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", year: "2025", link: "https://aws.amazon.com" }
  ];

  let internshipsList = [
    { id: "int_1", role: "Software Engineering Intern", company: "CloudScale Technologies", location: "Remote", period: "May 2025 - Aug 2025", rawBullets: "Engineered responsive dashboard modules using modular ES6+ JavaScript.\nOptimized database query latencies by 35% through compound indexes.\nParticipated in daily agile standups and code review cycles." }
  ];

  let projectsList = [
    { id: "proj_1", title: "Real-Time Cloud Platform", tech: "JavaScript, Firebase, REST APIs, CSS3", period: "2026", bullets: "Architected real-time dashboard with side-by-side ATS preview and 1-click PDF export.\nIntegrated AI API to convert raw notes into Google XYZ-formula quantified impact bullets.\nBuilt autonomous career intelligence tracker monitoring skill progress over time." }
  ];

  let workExperienceList = [];

  let achievementsList = [
    { id: "ach_1", title: "1st Place Winner — University Hackathon 2025", details: "Built an AI-assisted accessibility tool within 24 hours." }
  ];

  let educationList = [
    { id: "edu_1", institution: "University of Technology", degree: "B.S. in Computer Science", gradYear: "2026", gpa: "3.8 / 4.0", location: "San Francisco, CA" }
  ];

  // DOM Elements - Personal Details
  const resTitle = document.getElementById("res-title");
  const resTargetRole = document.getElementById("res-target-role");
  const resName = document.getElementById("res-name");
  const resEmail = document.getElementById("res-email");
  const resPhone = document.getElementById("res-phone");
  const resAddress = document.getElementById("res-address");
  const resLinkedin = document.getElementById("res-linkedin");
  const resGithub = document.getElementById("res-github");
  const resPortfolio = document.getElementById("res-portfolio");

  // Summary & Skills
  const resSummary = document.getElementById("res-summary");
  const resSkills = document.getElementById("res-skills");

  // Paper Preview Elements
  const paperName = document.getElementById("paper-name");
  const paperContact = document.getElementById("paper-contact");
  const paperSummary = document.getElementById("paper-summary");
  const paperSkills = document.getElementById("paper-skills");
  const paperCertsList = document.getElementById("paper-certs-list");
  const paperInternshipsList = document.getElementById("paper-internships-list");
  const paperProjectsList = document.getElementById("paper-projects-list");
  const paperWorkList = document.getElementById("paper-work-list");
  const paperAchievementsList = document.getElementById("paper-achievements-list");
  const paperEducationList = document.getElementById("paper-education-list");

  // Buttons & Containers
  const btnSaveResume = document.getElementById("btn-save-resume");
  const btnExportPdf = document.getElementById("btn-export-pdf");
  const btnAiObjective = document.getElementById("btn-ai-generate-objective");
  const btnOpenCompanyMatcher = document.getElementById("btn-open-company-matcher");
  const btnQuickCompanyMatch = document.getElementById("btn-quick-company-match");
  const lblActiveCompany = document.getElementById("lbl-active-company");

  const certsContainer = document.getElementById("certifications-container");
  const internshipsContainer = document.getElementById("internships-container");
  const projContainer = document.getElementById("projects-items-container");
  const workContainer = document.getElementById("work-experience-container");
  const achievementsContainer = document.getElementById("achievements-container");
  const educationContainer = document.getElementById("education-container");

  const btnAddCert = document.getElementById("btn-add-cert");
  const btnAddInternship = document.getElementById("btn-add-internship");
  const btnAddProject = document.getElementById("btn-add-project");
  const btnAddWorkExp = document.getElementById("btn-add-work-exp");
  const btnAddAchievement = document.getElementById("btn-add-achievement");
  const btnAddEducation = document.getElementById("btn-add-education");

  // Modals
  const modalObjective = "modal-ai-objective";
  const btnCloseObjModal = document.getElementById("btn-close-obj-modal");
  const btnCancelObj = document.getElementById("btn-cancel-obj");
  const aiObjectiveOptions = document.getElementById("ai-objective-options");

  const modalCompany = "modal-company-matcher";
  const btnCloseCompanyModal = document.getElementById("btn-close-company-modal");
  const btnCloseCompanyFooter = document.getElementById("btn-close-company-footer");
  const selectCompanyPreset = document.getElementById("select-company-preset");
  const inputCustomCompany = document.getElementById("input-custom-company");
  const btnAnalyzeCompanyMatch = document.getElementById("btn-analyze-company-match");
  const companyAnalysisResults = document.getElementById("company-analysis-results");

  const resumePrintArea = document.getElementById("resume-print-area");
  const templateCards = document.querySelectorAll("#resume-template-picker .template-card");

  // Template Switching
  function setResumeTemplate(templateName) {
    activeTemplate = templateName;
    templateCards.forEach((card) => {
      card.classList.toggle("active", card.dataset.template === templateName);
    });

    if (resumePrintArea) {
      resumePrintArea.className = `resume-paper-preview resume-template-${templateName}`;
    }
    syncPaperPreview();
  }

  function updateRecommendedTemplate(role) {
    const lower = (role || "").toLowerCase();
    let recommended = "ats-modern";
    let badgeText = "Tech Recommended";

    if (lower.includes("manager") || lower.includes("lead") || lower.includes("director") || lower.includes("executive")) {
      recommended = "executive";
      badgeText = "Leadership Recommended";
    } else if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("product") || lower.includes("creative")) {
      recommended = "creative-split";
      badgeText = "Creative Recommended";
    } else if (lower.includes("student") || lower.includes("intern") || lower.includes("academic") || lower.includes("graduate") || lower.includes("entry")) {
      recommended = "student-academic";
      badgeText = "Student Recommended";
    } else if (lower.includes("consultant") || lower.includes("analyst") || lower.includes("finance")) {
      recommended = "minimalist-compact";
      badgeText = "Clean Recommended";
    } else if (lower.includes("marketing") || lower.includes("art") || lower.includes("media") || lower.includes("writer")) {
      recommended = "infographic-modern";
      badgeText = "Visual Recommended";
    }

    const badgeEl = document.getElementById("badge-role-recommendation");
    if (badgeEl) badgeEl.textContent = badgeText;

    ["ats-modern", "executive", "creative-split", "student-academic", "minimalist-compact", "infographic-modern"].forEach((t) => {
      const recTag = document.getElementById(`rec-tag-${t}`);
      if (recTag) recTag.style.display = t === recommended ? "inline-block" : "none";
    });
  }

  templateCards.forEach((card) => {
    card.addEventListener("click", () => {
      setResumeTemplate(card.dataset.template);
      showToast(`Switched to ${card.querySelector("strong")?.textContent || "Template"}`, "info");
    });
  });

  // 1. Initialize with User Profile
  async function init() {
    resName.value = user.displayName || "";
    resEmail.value = user.email || "";
    resPhone.value = "";
    resAddress.value = "";
    resLinkedin.value = "";
    resGithub.value = "";
    resPortfolio.value = `${window.location.origin}/pages/public-portfolio.html?u=${user.uid}`;

    // Pre-populate skills and target role from profile if exists
    try {
      if (db && user.uid) {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const profileData = snap.data();
          if (profileData.displayName && !resName.value) resName.value = profileData.displayName;
          if (profileData.targetRole) resTargetRole.value = profileData.targetRole;
          if (profileData.links?.github) resGithub.value = profileData.links.github;
          if (profileData.links?.linkedin) resLinkedin.value = profileData.links.linkedin;
          if (profileData.links?.portfolio) resPortfolio.value = profileData.links.portfolio;
          if (profileData.skills && Array.isArray(profileData.skills)) {
            const skillNames = profileData.skills.map((s) => (typeof s === "object" ? s.name : s)).join(", ");
            resSkills.value = `Languages & Core: ${skillNames}\nTools & Frameworks: Git, GitHub, REST APIs, Cloud Firestore, Firebase, Docker`;
          }
        }
      }
    } catch (e) {}

    // Check if loading saved resume
    const existing = await getResumeById(user.uid, currentResumeId);
    if (existing) {
      if (existing.title) resTitle.value = existing.title;
      if (existing.targetRole) resTargetRole.value = existing.targetRole;
      if (existing.name) resName.value = existing.name;
      if (existing.email) resEmail.value = existing.email;
      if (existing.phone) resPhone.value = existing.phone;
      if (existing.address) resAddress.value = existing.address;
      if (existing.linkedin) resLinkedin.value = existing.linkedin;
      if (existing.github) resGithub.value = existing.github;
      if (existing.portfolio) resPortfolio.value = existing.portfolio;
      if (existing.summary) resSummary.value = existing.summary;
      if (existing.skills) resSkills.value = existing.skills;
      if (existing.template) activeTemplate = existing.template;
      if (existing.certifications) certificationsList = existing.certifications;
      if (existing.internships) internshipsList = existing.internships;
      if (existing.projects) projectsList = existing.projects;
      if (existing.workExperience) workExperienceList = existing.workExperience;
      if (existing.achievements) achievementsList = existing.achievements;
      if (existing.educationList) educationList = existing.educationList;
      if (existing.targetCompany) {
        activeTargetCompany = existing.targetCompany;
        lblActiveCompany.textContent = activeTargetCompany;
      }
    } else {
      resSummary.value = `Results-oriented ${resTargetRole.value} with proven foundation in full-stack architecture, responsive web applications, and AI integrations. Demonstrates track record of delivering clean, scalable solutions.`;
    }

    updateRecommendedTemplate(resTargetRole.value);
    setResumeTemplate(activeTemplate);
    renderAllSections();
    syncPaperPreview();
  }

  resTargetRole.addEventListener("input", () => {
    updateRecommendedTemplate(resTargetRole.value);
  });

  function renderAllSections() {
    renderCertifications();
    renderInternships();
    renderProjects();
    renderWorkExperience();
    renderAchievements();
    renderEducation();
  }

  // 2. Render Certifications Section
  function renderCertifications() {
    certsContainer.innerHTML = certificationsList.map((cert, idx) => `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1rem; border:1px solid var(--border-glass);" data-id="${cert.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="font-size:0.85rem; color:var(--text-primary);">Certification #${idx + 1}</strong>
          <button type="button" class="btn btn-danger btn-sm btn-delete-cert" data-idx="${idx}" style="padding:1px 6px; font-size:0.7rem;">Delete</button>
        </div>
        <div class="grid grid-cols-2" style="gap:0.5rem;">
          <input type="text" class="form-input cert-name" value="${escapeHtml(cert.name)}" placeholder="Certification Name (e.g. AWS Cloud Practitioner)">
          <input type="text" class="form-input cert-issuer" value="${escapeHtml(cert.issuer)}" placeholder="Issuing Organization (e.g. AWS / Google)">
          <input type="text" class="form-input cert-year" value="${escapeHtml(cert.year)}" placeholder="Year (e.g. 2025)">
          <input type="url" class="form-input cert-link" value="${escapeHtml(cert.link || "")}" placeholder="Verification Link URL">
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".cert-name, .cert-issuer, .cert-year, .cert-link").forEach((inp) => {
      inp.addEventListener("input", () => {
        updateCertsState();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-delete-cert").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        certificationsList.splice(parseInt(e.currentTarget.dataset.idx, 10), 1);
        renderCertifications();
        syncPaperPreview();
      });
    });
  }

  function updateCertsState() {
    const cards = certsContainer.querySelectorAll("[data-id]");
    cards.forEach((card, idx) => {
      if (certificationsList[idx]) {
        certificationsList[idx].name = card.querySelector(".cert-name")?.value || "";
        certificationsList[idx].issuer = card.querySelector(".cert-issuer")?.value || "";
        certificationsList[idx].year = card.querySelector(".cert-year")?.value || "";
        certificationsList[idx].link = card.querySelector(".cert-link")?.value || "";
      }
    });
  }

  // 3. Render Internships Section
  function renderInternships() {
    internshipsContainer.innerHTML = internshipsList.map((intn, idx) => `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1.25rem; border:1px solid var(--border-glass);" data-id="${intn.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <strong style="color:var(--text-primary); font-size:0.9rem;">Internship #${idx + 1}</strong>
          <button type="button" class="btn btn-danger btn-sm btn-delete-int" data-idx="${idx}" style="padding:2px 8px; font-size:0.75rem;">Delete</button>
        </div>
        <div class="grid grid-cols-2" style="gap:0.75rem; margin-bottom:0.75rem;">
          <input type="text" class="form-input int-role" value="${escapeHtml(intn.role)}" placeholder="Internship Role (e.g. Frontend Engineering Intern)">
          <input type="text" class="form-input int-company" value="${escapeHtml(intn.company)}" placeholder="Company Name">
          <input type="text" class="form-input int-period" value="${escapeHtml(intn.period)}" placeholder="Duration (e.g. May 2025 - Aug 2025)">
          <input type="text" class="form-input int-location" value="${escapeHtml(intn.location || "")}" placeholder="Location (e.g. Remote / Seattle, WA)">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
            <label class="form-label" style="font-size:0.75rem; margin:0;">Key Contributions & Outcomes</label>
            <button type="button" class="btn btn-ai btn-sm btn-ai-int-bullets" data-idx="${idx}">AI Polish (XYZ) ✨</button>
          </div>
          <textarea class="form-textarea int-bullets" rows="3" placeholder="Enter raw notes or bullet points...">${escapeHtml(intn.rawBullets || "")}</textarea>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".int-role, .int-company, .int-period, .int-location, .int-bullets").forEach((inp) => {
      inp.addEventListener("input", () => {
        updateInternshipsState();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-delete-int").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        internshipsList.splice(parseInt(e.currentTarget.dataset.idx, 10), 1);
        renderInternships();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-ai-int-bullets").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        const item = internshipsList[idx];
        if (!item.rawBullets) {
          showToast("Please enter raw notes first.", "error");
          return;
        }
        setButtonLoading(btn, true);
        try {
          const result = await generateAIBullets({
            roleTitle: item.role || "Software Intern",
            company: item.company || "Company",
            rawInputs: item.rawBullets.split("\n").filter((b) => b.trim().length > 0),
            targetRole: resTargetRole.value
          });
          if (result?.bullets?.length > 0) {
            item.rawBullets = result.bullets.map((b) => b.polished).join("\n");
            renderInternships();
            syncPaperPreview();
            showToast("Transformed into Google XYZ formula bullets!", "success");
          }
        } catch (err) {
          showToast(err.message || "AI Polish error", "error");
        } finally {
          setButtonLoading(btn, false);
        }
      });
    });
  }

  function updateInternshipsState() {
    const cards = internshipsContainer.querySelectorAll("[data-id]");
    cards.forEach((card, idx) => {
      if (internshipsList[idx]) {
        internshipsList[idx].role = card.querySelector(".int-role")?.value || "";
        internshipsList[idx].company = card.querySelector(".int-company")?.value || "";
        internshipsList[idx].period = card.querySelector(".int-period")?.value || "";
        internshipsList[idx].location = card.querySelector(".int-location")?.value || "";
        internshipsList[idx].rawBullets = card.querySelector(".int-bullets")?.value || "";
      }
    });
  }

  // 4. Render Projects Section
  function renderProjects() {
    projContainer.innerHTML = projectsList.map((proj, idx) => `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1.25rem; border:1px solid var(--border-glass);" data-id="${proj.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <strong style="color:var(--text-primary); font-size:0.9rem;">Project #${idx + 1}</strong>
          <button type="button" class="btn btn-danger btn-sm btn-delete-proj" data-idx="${idx}" style="padding:2px 8px; font-size:0.75rem;">Delete</button>
        </div>
        <div class="grid grid-cols-2" style="gap:0.75rem; margin-bottom:0.75rem;">
          <input type="text" class="form-input proj-title" value="${escapeHtml(proj.title)}" placeholder="Project Name">
          <input type="text" class="form-input proj-tech" value="${escapeHtml(proj.tech)}" placeholder="Technologies (e.g. React, Node.js, Firebase)">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
            <label class="form-label" style="font-size:0.75rem; margin:0;">Project Highlights / Bullets</label>
            <button type="button" class="btn btn-ai btn-sm btn-ai-proj-bullets" data-idx="${idx}">AI Polish ✨</button>
          </div>
          <textarea class="form-textarea proj-bullets" rows="3" placeholder="Key outcomes and implementation details...">${escapeHtml(proj.bullets || "")}</textarea>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".proj-title, .proj-tech, .proj-bullets").forEach((inp) => {
      inp.addEventListener("input", () => {
        updateProjectsState();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-delete-proj").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        projectsList.splice(parseInt(e.currentTarget.dataset.idx, 10), 1);
        renderProjects();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-ai-proj-bullets").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const idx = parseInt(e.currentTarget.dataset.idx, 10);
        const item = projectsList[idx];
        if (!item.bullets) return showToast("Enter project notes first.", "error");
        setButtonLoading(btn, true);
        try {
          const result = await generateAIBullets({
            roleTitle: item.title,
            company: item.tech,
            rawInputs: item.bullets.split("\n").filter(Boolean),
            targetRole: resTargetRole.value
          });
          if (result?.bullets?.length) {
            item.bullets = result.bullets.map((b) => b.polished).join("\n");
            renderProjects();
            syncPaperPreview();
            showToast("Project bullets polished with quantifiable metrics!", "success");
          }
        } catch (e) {
          showToast(e.message, "error");
        } finally {
          setButtonLoading(btn, false);
        }
      });
    });
  }

  function updateProjectsState() {
    const cards = projContainer.querySelectorAll("[data-id]");
    cards.forEach((card, idx) => {
      if (projectsList[idx]) {
        projectsList[idx].title = card.querySelector(".proj-title")?.value || "";
        projectsList[idx].tech = card.querySelector(".proj-tech")?.value || "";
        projectsList[idx].bullets = card.querySelector(".proj-bullets")?.value || "";
      }
    });
  }

  // 5. Render Work Experience Section
  function renderWorkExperience() {
    workContainer.innerHTML = workExperienceList.map((work, idx) => `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1.25rem; border:1px solid var(--border-glass);" data-id="${work.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <strong style="color:var(--text-primary); font-size:0.9rem;">Work Role #${idx + 1}</strong>
          <button type="button" class="btn btn-danger btn-sm btn-delete-work" data-idx="${idx}" style="padding:2px 8px; font-size:0.75rem;">Delete</button>
        </div>
        <div class="grid grid-cols-2" style="gap:0.75rem; margin-bottom:0.75rem;">
          <input type="text" class="form-input work-role" value="${escapeHtml(work.role)}" placeholder="Job Title">
          <input type="text" class="form-input work-company" value="${escapeHtml(work.company)}" placeholder="Company / Org">
          <input type="text" class="form-input work-period" value="${escapeHtml(work.period)}" placeholder="Timeline (e.g. 2024 - 2025)">
          <input type="text" class="form-input work-location" value="${escapeHtml(work.location || "")}" placeholder="Location">
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label class="form-label" style="font-size:0.75rem;">Achievements & Responsibilities</label>
          <textarea class="form-textarea work-bullets" rows="2" placeholder="Responsibilities and accomplishments...">${escapeHtml(work.rawBullets || "")}</textarea>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".work-role, .work-company, .work-period, .work-location, .work-bullets").forEach((inp) => {
      inp.addEventListener("input", () => {
        updateWorkState();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-delete-work").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        workExperienceList.splice(parseInt(e.currentTarget.dataset.idx, 10), 1);
        renderWorkExperience();
        syncPaperPreview();
      });
    });
  }

  function updateWorkState() {
    const cards = workContainer.querySelectorAll("[data-id]");
    cards.forEach((card, idx) => {
      if (workExperienceList[idx]) {
        workExperienceList[idx].role = card.querySelector(".work-role")?.value || "";
        workExperienceList[idx].company = card.querySelector(".work-company")?.value || "";
        workExperienceList[idx].period = card.querySelector(".work-period")?.value || "";
        workExperienceList[idx].location = card.querySelector(".work-location")?.value || "";
        workExperienceList[idx].rawBullets = card.querySelector(".work-bullets")?.value || "";
      }
    });
  }

  // 6. Render Achievements Section
  function renderAchievements() {
    achievementsContainer.innerHTML = achievementsList.map((ach, idx) => `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1rem; border:1px solid var(--border-glass);" data-id="${ach.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="font-size:0.85rem; color:var(--text-primary);">Achievement #${idx + 1}</strong>
          <button type="button" class="btn btn-danger btn-sm btn-delete-ach" data-idx="${idx}" style="padding:1px 6px; font-size:0.7rem;">Delete</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem;">
          <input type="text" class="form-input ach-title" value="${escapeHtml(ach.title)}" placeholder="Honor / Award / Competition Title">
          <textarea class="form-textarea ach-details" rows="2" placeholder="Context, rank, or impact summary...">${escapeHtml(ach.details || "")}</textarea>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".ach-title, .ach-details").forEach((inp) => {
      inp.addEventListener("input", () => {
        updateAchievementsState();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-delete-ach").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        achievementsList.splice(parseInt(e.currentTarget.dataset.idx, 10), 1);
        renderAchievements();
        syncPaperPreview();
      });
    });
  }

  function updateAchievementsState() {
    const cards = achievementsContainer.querySelectorAll("[data-id]");
    cards.forEach((card, idx) => {
      if (achievementsList[idx]) {
        achievementsList[idx].title = card.querySelector(".ach-title")?.value || "";
        achievementsList[idx].details = card.querySelector(".ach-details")?.value || "";
      }
    });
  }

  // 7. Render Education Section
  function renderEducation() {
    educationContainer.innerHTML = educationList.map((edu, idx) => `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1rem; border:1px solid var(--border-glass);" data-id="${edu.id}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <strong style="font-size:0.85rem; color:var(--text-primary);">Education #${idx + 1}</strong>
          <button type="button" class="btn btn-danger btn-sm btn-delete-edu" data-idx="${idx}" style="padding:1px 6px; font-size:0.7rem;">Delete</button>
        </div>
        <div class="grid grid-cols-2" style="gap:0.5rem;">
          <input type="text" class="form-input edu-inst" value="${escapeHtml(edu.institution)}" placeholder="University / College">
          <input type="text" class="form-input edu-degree" value="${escapeHtml(edu.degree)}" placeholder="Degree & Major">
          <input type="text" class="form-input edu-year" value="${escapeHtml(edu.gradYear)}" placeholder="Graduation Year (e.g. 2026)">
          <input type="text" class="form-input edu-gpa" value="${escapeHtml(edu.gpa)}" placeholder="GPA (e.g. 3.8 / 4.0)">
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".edu-inst, .edu-degree, .edu-year, .edu-gpa").forEach((inp) => {
      inp.addEventListener("input", () => {
        updateEducationState();
        syncPaperPreview();
      });
    });

    document.querySelectorAll(".btn-delete-edu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        educationList.splice(parseInt(e.currentTarget.dataset.idx, 10), 1);
        renderEducation();
        syncPaperPreview();
      });
    });
  }

  function updateEducationState() {
    const cards = educationContainer.querySelectorAll("[data-id]");
    cards.forEach((card, idx) => {
      if (educationList[idx]) {
        educationList[idx].institution = card.querySelector(".edu-inst")?.value || "";
        educationList[idx].degree = card.querySelector(".edu-degree")?.value || "";
        educationList[idx].gradYear = card.querySelector(".edu-year")?.value || "";
        educationList[idx].gpa = card.querySelector(".edu-gpa")?.value || "";
      }
    });
  }

  // 8. Add Section Item Listeners
  btnAddCert.addEventListener("click", () => {
    certificationsList.push({ id: "c_" + Date.now(), name: "Professional Technical Certificate", issuer: "Credential Authority", year: "2025", link: "" });
    renderCertifications();
    syncPaperPreview();
  });

  btnAddInternship.addEventListener("click", () => {
    internshipsList.push({ id: "int_" + Date.now(), role: "Software Engineering Intern", company: "Innovative Tech Lab", location: "Remote", period: "Summer 2025", rawBullets: "Delivered responsive features and improved code quality standards." });
    renderInternships();
    syncPaperPreview();
  });

  btnAddProject.addEventListener("click", () => {
    projectsList.push({ id: "p_" + Date.now(), title: "Flagship Full-Stack Platform", tech: "JavaScript, Firebase, Cloud APIs", period: "2026", bullets: "Built high-performance application with sub-200ms API latencies." });
    renderProjects();
    syncPaperPreview();
  });

  btnAddWorkExp.addEventListener("click", () => {
    workExperienceList.push({ id: "w_" + Date.now(), role: "Developer Assistant", company: "Tech Services", location: "City, Country", period: "2024 - 2025", rawBullets: "Maintained software modules and handled technical inquiries." });
    renderWorkExperience();
    syncPaperPreview();
  });

  btnAddAchievement.addEventListener("click", () => {
    achievementsList.push({ id: "ach_" + Date.now(), title: "Hackathon Finalist / Academic Honor", details: "Recognized for top performance among competitive cohort." });
    renderAchievements();
    syncPaperPreview();
  });

  btnAddEducation.addEventListener("click", () => {
    educationList.push({ id: "edu_" + Date.now(), institution: "College / University", degree: "B.S. in Computing", gradYear: "2026", gpa: "3.7" });
    renderEducation();
    syncPaperPreview();
  });

  // Font and Header Alignment Customizers
  const selectResumeFont = document.getElementById("select-resume-font");
  const selectResumeAlign = document.getElementById("select-resume-align");
  const paperHeaderContainer = document.getElementById("paper-header-container");

  if (selectResumeFont && resumePrintArea) {
    selectResumeFont.addEventListener("change", () => {
      resumePrintArea.style.fontFamily = selectResumeFont.value;
    });
  }

  if (selectResumeAlign && paperHeaderContainer) {
    selectResumeAlign.addEventListener("change", () => {
      paperHeaderContainer.style.textAlign = selectResumeAlign.value;
    });
  }

  function formatExternalUrl(url) {
    if (!url) return "";
    return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  }

  // 9. Live Synchronization into ATS Printable Paper (Strict 9-Section Order)
  function syncPaperPreview() {
    // 1. Personal Details Header with Clean, Clickable Links
    paperName.textContent = resName.value.trim() || user.displayName || "Your Full Name";
    
    const contactParts = [];
    if (resEmail.value.trim()) {
      contactParts.push(`<a href="mailto:${escapeHtml(resEmail.value.trim())}" style="color:#374151; text-decoration:none;">${escapeHtml(resEmail.value.trim())}</a>`);
    }
    if (resPhone.value.trim()) {
      contactParts.push(`<span>${escapeHtml(resPhone.value.trim())}</span>`);
    }
    if (resAddress.value.trim()) {
      contactParts.push(`<span>${escapeHtml(resAddress.value.trim())}</span>`);
    }
    if (resLinkedin.value.trim()) {
      const url = formatExternalUrl(resLinkedin.value.trim());
      contactParts.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8; text-decoration:underline; font-weight:600;">LinkedIn</a>`);
    }
    if (resGithub.value.trim()) {
      const url = formatExternalUrl(resGithub.value.trim());
      contactParts.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8; text-decoration:underline; font-weight:600;">GitHub</a>`);
    }
    if (resPortfolio.value.trim()) {
      const url = formatExternalUrl(resPortfolio.value.trim());
      contactParts.push(`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="color:#1d4ed8; text-decoration:underline; font-weight:600;">Portfolio</a>`);
    }
    
    paperContact.innerHTML = contactParts.join(" | ");

    // 2. Summary
    paperSummary.textContent = resSummary.value || "Results-driven Software Engineer...";

    // 3. Core Skills
    paperSkills.innerHTML = (resSkills.value || "")
      .split("\n")
      .filter(Boolean)
      .map((line) => `<div style="margin-bottom:2px;">${escapeHtml(line)}</div>`)
      .join("");

    // 4. Certifications
    if (certificationsList.length > 0) {
      document.getElementById("sec-paper-certs").style.display = "block";
      paperCertsList.innerHTML = certificationsList.map((c) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.issuer)}</span>
          <span style="color:#4b5563; font-size:8.5pt;">${escapeHtml(c.year)}</span>
        </div>
      `).join("");
    } else {
      document.getElementById("sec-paper-certs").style.display = "none";
    }

    // 5. Internships
    if (internshipsList.length > 0) {
      document.getElementById("sec-paper-internships").style.display = "block";
      paperInternshipsList.innerHTML = internshipsList.map((intn) => `
        <div style="margin-bottom:0.5rem;">
          <div style="display:flex; justify-content:space-between; font-weight:700; color:#111827;">
            <span>${escapeHtml(intn.role)}</span>
            <span style="font-weight:600; color:#4b5563; font-size:8.5pt;">${escapeHtml(intn.company)}${intn.period ? ` | ${escapeHtml(intn.period)}` : ""}</span>
          </div>
          <ul style="margin:2px 0 0 1.2rem; padding:0; color:#374151;">
            ${(intn.rawBullets || "").split("\n").filter(Boolean).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
        </div>
      `).join("");
    } else {
      document.getElementById("sec-paper-internships").style.display = "none";
    }

    // 6. Projects
    if (projectsList.length > 0) {
      document.getElementById("sec-paper-projects").style.display = "block";
      paperProjectsList.innerHTML = projectsList.map((p) => `
        <div style="margin-bottom:0.5rem;">
          <div style="display:flex; justify-content:space-between; font-weight:700; color:#111827;">
            <span>${escapeHtml(p.title)}</span>
            <span style="font-weight:500; color:#4b5563; font-size:8.5pt;">${escapeHtml(p.tech || "")}</span>
          </div>
          <ul style="margin:2px 0 0 1.2rem; padding:0; color:#374151;">
            ${(p.bullets || "").split("\n").filter(Boolean).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
        </div>
      `).join("");
    } else {
      document.getElementById("sec-paper-projects").style.display = "none";
    }

    // 7. Work Experience
    if (workExperienceList.length > 0) {
      document.getElementById("sec-paper-work-exp").style.display = "block";
      paperWorkList.innerHTML = workExperienceList.map((w) => `
        <div style="margin-bottom:0.5rem;">
          <div style="display:flex; justify-content:space-between; font-weight:700; color:#111827;">
            <span>${escapeHtml(w.role)}</span>
            <span style="font-weight:600; color:#4b5563; font-size:8.5pt;">${escapeHtml(w.company)}${w.period ? ` | ${escapeHtml(w.period)}` : ""}</span>
          </div>
          <ul style="margin:2px 0 0 1.2rem; padding:0; color:#374151;">
            ${(w.rawBullets || "").split("\n").filter(Boolean).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}
          </ul>
        </div>
      `).join("");
    } else {
      document.getElementById("sec-paper-work-exp").style.display = "none";
    }

    // 8. Achievements
    if (achievementsList.length > 0) {
      document.getElementById("sec-paper-achievements").style.display = "block";
      paperAchievementsList.innerHTML = achievementsList.map((ach) => `
        <div style="margin-bottom:3px;">
          <strong>${escapeHtml(ach.title)}</strong>${ach.details ? `: <span style="color:#4b5563;">${escapeHtml(ach.details)}</span>` : ""}
        </div>
      `).join("");
    } else {
      document.getElementById("sec-paper-achievements").style.display = "none";
    }

    // 9. Education
    if (educationList.length > 0) {
      document.getElementById("sec-paper-education").style.display = "block";
      paperEducationList.innerHTML = educationList.map((edu) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
          <span><strong>${escapeHtml(edu.degree)}</strong> — ${escapeHtml(edu.institution)}</span>
          <span style="color:#4b5563; font-size:8.5pt;">${escapeHtml(edu.gradYear)}${edu.gpa ? ` | GPA: ${escapeHtml(edu.gpa)}` : ""}</span>
        </div>
      `).join("");
    } else {
      document.getElementById("sec-paper-education").style.display = "none";
    }
  }

  // Live input sync bindings
  [resName, resEmail, resPhone, resAddress, resLinkedin, resGithub, resPortfolio, resSummary, resSkills, resTargetRole].forEach((el) => {
    el.addEventListener("input", debounce(syncPaperPreview, 80));
  });

  // 10. AI Career Objective Generator
  btnAiObjective.addEventListener("click", async () => {
    setButtonLoading(btnAiObjective, true);
    try {
      const result = await generateAIObjective({
        name: resName.value,
        targetRole: resTargetRole.value,
        skills: resSkills.value
      });

      if (result?.options?.length > 0) {
        aiObjectiveOptions.innerHTML = result.options.map((opt, i) => `
          <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-glass); border-radius:var(--radius-md); padding:1rem; cursor:pointer;" class="ai-opt-card" data-index="${i}">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
              <strong style="color:var(--primary-light); font-size:0.85rem;">${escapeHtml(opt.tone)}</strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(opt.bestFor)}</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-primary); margin:0; line-height:1.5;">${escapeHtml(opt.text)}</p>
          </div>
        `).join("");

        document.querySelectorAll(".ai-opt-card").forEach((card) => {
          card.addEventListener("click", (e) => {
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            resSummary.value = result.options[idx].text;
            syncPaperPreview();
            closeModal(modalObjective);
            showToast("Career summary applied!", "success");
          });
        });

        openModal(modalObjective);
      }
    } catch (err) {
      showToast(err.message || "Failed to generate summary", "error");
    } finally {
      setButtonLoading(btnAiObjective, false);
    }
  });

  btnCloseObjModal.addEventListener("click", () => closeModal(modalObjective));
  btnCancelObj.addEventListener("click", () => closeModal(modalObjective));

  // 11. COMPANY-SPECIFIC RESUME MATCHING (Requirement 3)
  function analyzeAndRenderCompanyFit(targetCompany) {
    const selectedCompany = targetCompany || inputCustomCompany.value.trim() || selectCompanyPreset.value || "Google";
    activeTargetCompany = selectedCompany;
    lblActiveCompany.textContent = activeTargetCompany;

    if (selectCompanyPreset) {
      if (COMPANY_REQUIREMENTS[selectedCompany]) {
        selectCompanyPreset.value = selectedCompany;
      } else {
        selectCompanyPreset.value = "Custom";
        inputCustomCompany.value = selectedCompany;
      }
    }

    document.querySelectorAll(".btn-company-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.company === selectedCompany);
    });

    const compData = COMPANY_REQUIREMENTS[selectedCompany] || COMPANY_REQUIREMENTS.Google;
    
    // Combine full resume text to analyze matching vs missing
    const fullResumeText = `${resSummary.value} ${resSkills.value} ${internshipsList.map(i => i.rawBullets).join(" ")} ${projectsList.map(p => p.bullets).join(" ")}`.toLowerCase();

    const matchedKeywords = [];
    const missingKeywords = [];

    compData.roleKeywords.forEach((kw) => {
      const simplified = kw.toLowerCase().split(/[\s\/\(\)]+/)[0];
      if (fullResumeText.includes(simplified)) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    });

    const matchPercent = Math.round((matchedKeywords.length / compData.roleKeywords.length) * 100);

    companyAnalysisResults.style.display = "flex";
    companyAnalysisResults.innerHTML = `
      <div class="card card-glass" style="background:var(--bg-surface-elevated); padding:1.25rem; border:1px solid var(--border-glass);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <div>
            <h4 style="font-size:1.1rem; color:var(--text-primary); margin:0;">${escapeHtml(selectedCompany)} Hiring Alignment</h4>
            <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(resTargetRole.value || "Software Engineer")}</span>
          </div>
          <span class="badge ${matchPercent >= 75 ? "badge-emerald" : matchPercent >= 50 ? "badge-amber" : "badge-rose"}" style="font-size:0.85rem; padding:4px 10px;">
            ${matchPercent}% Keyword Match
          </span>
        </div>

        <div style="background:var(--bg-surface); padding:0.75rem; border-radius:var(--radius-sm); font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
          <strong style="color:var(--text-primary);">${escapeHtml(selectedCompany)} Hiring Expectations:</strong> ${escapeHtml(compData.expectations)}
        </div>

        <!-- Matched Keywords -->
        <div style="margin-bottom:0.75rem;">
          <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--accent-emerald); display:block; margin-bottom:0.35rem;">
            ✓ Matched in Your Resume (${matchedKeywords.length}):
          </strong>
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
            ${matchedKeywords.map(k => `<span class="badge badge-emerald" style="font-size:0.7rem;">${escapeHtml(k)}</span>`).join("")}
          </div>
        </div>

        <!-- Missing Keywords -->
        <div style="margin-bottom:1rem;">
          <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--accent-rose); display:block; margin-bottom:0.35rem;">
            ⚠️ Suggested Keywords to Add (${missingKeywords.length}):
          </strong>
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
            ${missingKeywords.map(k => `
              <span class="badge badge-rose btn-add-kw-chip" data-kw="${escapeHtml(k)}" style="font-size:0.7rem; cursor:pointer;" title="Click to add to skills">
                + ${escapeHtml(k)}
              </span>
            `).join("")}
          </div>
        </div>

        <!-- ATS Specific Advice -->
        <div style="border-top:1px solid var(--border-subtle); padding-top:0.75rem; font-size:0.8rem;">
          <strong style="color:var(--primary-light);">ATS Recommendation:</strong>
          <p style="color:var(--text-secondary); margin:0.2rem 0 0;">${escapeHtml(compData.atsFocus)}</p>
        </div>
      </div>
    `;

    // Click on missing keyword to automatically add to skills
    document.querySelectorAll(".btn-add-kw-chip").forEach((chip) => {
      chip.addEventListener("click", (e) => {
        const kw = e.currentTarget.dataset.kw;
        if (!resSkills.value.includes(kw)) {
          resSkills.value += (resSkills.value ? ", " : "") + kw;
          syncPaperPreview();
          analyzeAndRenderCompanyFit(selectedCompany);
          showToast(`Added "${kw}" to Core Skills!`, "success");
        }
      });
    });
  }

  function openCompanyMatcherModal() {
    openModal(modalCompany);
    analyzeAndRenderCompanyFit(activeTargetCompany !== "All Companies" ? activeTargetCompany : "Google");
  }

  btnOpenCompanyMatcher.addEventListener("click", openCompanyMatcherModal);
  btnQuickCompanyMatch.addEventListener("click", openCompanyMatcherModal);
  btnCloseCompanyModal.addEventListener("click", () => closeModal(modalCompany));
  btnCloseCompanyFooter.addEventListener("click", () => {
    closeModal(modalCompany);
    showToast(`Target company set to ${activeTargetCompany}`, "success");
  });

  document.querySelectorAll(".btn-company-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => {
      const comp = e.currentTarget.dataset.company;
      analyzeAndRenderCompanyFit(comp);
    });
  });

  selectCompanyPreset.addEventListener("change", () => {
    if (selectCompanyPreset.value === "Custom") {
      inputCustomCompany.style.display = "block";
      inputCustomCompany.focus();
    } else {
      inputCustomCompany.value = "";
      analyzeAndRenderCompanyFit(selectCompanyPreset.value);
    }
  });

  inputCustomCompany.addEventListener("input", debounce(() => {
    if (inputCustomCompany.value.trim()) {
      analyzeAndRenderCompanyFit(inputCustomCompany.value.trim());
    }
  }, 300));

  btnAnalyzeCompanyMatch.addEventListener("click", () => {
    const selectedCompany = inputCustomCompany.value.trim() || selectCompanyPreset.value;
    analyzeAndRenderCompanyFit(selectedCompany);
  });

  // 12. Save Resume
  btnSaveResume.addEventListener("click", async () => {
    setButtonLoading(btnSaveResume, true);
    updateCertsState();
    updateInternshipsState();
    updateProjectsState();
    updateWorkState();
    updateAchievementsState();
    updateEducationState();

    const resumeData = {
      title: resTitle.value.trim() || "Software Engineer Resume",
      targetRole: resTargetRole.value.trim(),
      targetCompany: activeTargetCompany,
      template: activeTemplate,
      name: resName.value.trim(),
      email: resEmail.value.trim(),
      phone: resPhone.value.trim(),
      address: resAddress.value.trim(),
      linkedin: resLinkedin.value.trim(),
      github: resGithub.value.trim(),
      portfolio: resPortfolio.value.trim(),
      summary: resSummary.value.trim(),
      skills: resSkills.value.trim(),
      certifications: certificationsList,
      internships: internshipsList,
      projects: projectsList,
      workExperience: workExperienceList,
      achievements: achievementsList,
      educationList: educationList,
      score: 88
    };

    try {
      const saved = await saveResumeDoc(user.uid, currentResumeId, resumeData);
      currentResumeId = saved.id;
      showToast("Resume saved to your account!", "success");
    } catch (err) {
      showToast("Save error: " + err.message, "error");
    } finally {
      setButtonLoading(btnSaveResume, false);
    }
  });

  // 13. PDF Export Handler
  btnExportPdf.addEventListener("click", () => {
    const element = document.getElementById("resume-print-area");
    const exportName = (resName.value.trim() || user.displayName || "My").replace(/\s+/g, "_");
    const opt = {
      margin: [0.3, 0.3, 0.3, 0.3],
      filename: `${exportName}_Resume.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    };

    if (window.html2pdf) {
      showToast("Exporting PDF resume...", "info");
      window.html2pdf().set(opt).from(element).save().then(() => {
        showToast("PDF Resume exported successfully!", "success");
      });
    } else {
      window.print();
    }
  });

  // Initialize
  await init();
});
