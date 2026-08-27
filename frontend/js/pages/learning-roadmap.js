/**
 * 8-STAGE PERSONALIZED CAREER ROADMAP & EXPORT CONTROLLER
 */

import { getCurrentUser } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { getRoleIntelligence } from "../api/career-role-engine.js";
import { showToast, setButtonLoading, escapeHtml, debounce } from "../ui-utils.js";
import { db } from "../firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation shell
  renderNavbar("roadmap");

  // DOM Elements
  const roadmapTargetInput = document.getElementById("roadmap-target-input");
  const roadmapCompanySelect = document.getElementById("roadmap-company-select");
  const canvasRoadmapTitle = document.getElementById("canvas-roadmap-title");
  const canvasUserName = document.getElementById("canvas-user-name");
  const canvasTargetCompany = document.getElementById("canvas-target-company");
  const canvasDate = document.getElementById("canvas-date");

  // Stage containers
  const stageCurrentSkills = document.getElementById("stage-current-skills");
  const stageSkillsToLearn = document.getElementById("stage-skills-to-learn");
  const stageCoursesList = document.getElementById("stage-courses-list");
  const stageProjectsList = document.getElementById("stage-projects-list");

  // Buttons
  const btnExportPdf = document.getElementById("btn-export-roadmap-pdf");
  const btnExportImg = document.getElementById("btn-export-roadmap-img");
  const btnRegen = document.getElementById("btn-regen-roadmap");
  const roadmapCanvas = document.getElementById("roadmap-export-canvas");

  // Template Picker Elements
  const templateCards = document.querySelectorAll(".roadmap-template-card");
  const badgeActiveRoadmapTemplate = document.getElementById("badge-active-roadmap-template");

  // Role Chips
  const roleChips = document.querySelectorAll(".btn-roadmap-role-chip");

  const TEMPLATE_META = {
    cyber: { name: "Cyber Grid (Dark)", class: "roadmap-theme-cyber", bg: "#0b1120" },
    executive: { name: "Executive Minimal", class: "roadmap-theme-executive", bg: "#ffffff" },
    aurora: { name: "Aurora Vivid", class: "roadmap-theme-aurora", bg: "#0f172a" },
    timeline: { name: "Timeline Flow", class: "roadmap-theme-timeline", bg: "#090e1a" }
  };

  let activeTemplateKey = localStorage.getItem("cf_roadmap_template") || "cyber";

  function setRoadmapTemplate(templateKey) {
    if (!TEMPLATE_META[templateKey]) templateKey = "cyber";
    activeTemplateKey = templateKey;
    localStorage.setItem("cf_roadmap_template", templateKey);

    // Update UI Badges & Cards
    templateCards.forEach((card) => {
      card.classList.toggle("active", card.dataset.template === templateKey);
    });

    if (badgeActiveRoadmapTemplate) {
      badgeActiveRoadmapTemplate.textContent = `Active: ${TEMPLATE_META[templateKey].name}`;
    }

    // Apply theme class to canvas
    if (roadmapCanvas) {
      roadmapCanvas.className = TEMPLATE_META[templateKey].class;
    }
  }

  templateCards.forEach((card) => {
    card.addEventListener("click", () => {
      const selected = card.dataset.template;
      setRoadmapTemplate(selected);
      showToast(`Applied ${TEMPLATE_META[selected].name} template!`, "info");
    });
  });

  // Initialize Template
  setRoadmapTemplate(activeTemplateKey);

  function syncRoleChips(currentRole) {
    roleChips.forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.role.toLowerCase() === currentRole.toLowerCase());
    });
  }

  // State
  let candidateSkills = ["JavaScript (ES6+)", "HTML5 & CSS3", "Git & GitHub", "REST APIs"];
  let targetRole = "Web Developer";
  let targetCompany = "Google";

  // Check URL params or profile
  const urlRole = new URLSearchParams(window.location.search).get("role");
  if (urlRole) {
    roadmapTargetInput.value = decodeURIComponent(urlRole);
  }

  async function loadRoadmapData(forceRefresh = false) {
    setButtonLoading(btnRegen, true);

    canvasUserName.textContent = user.displayName || user.email?.split("@")[0] || "Candidate";
    canvasDate.textContent = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    targetRole = roadmapTargetInput.value.trim() || "Web Developer";
    targetCompany = roadmapCompanySelect.value || "Google";
    canvasTargetCompany.textContent = targetCompany;
    canvasRoadmapTitle.textContent = `8-Stage Career Roadmap: ${targetRole}`;

    syncRoleChips(targetRole);

    // 1. Fetch user's verified profile skills if available
    try {
      if (db && user.uid) {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const profileData = snap.data();
          if (profileData.skills && Array.isArray(profileData.skills)) {
            candidateSkills = profileData.skills.map(s => typeof s === "object" ? s.name : s);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load user profile skills:", e);
    }

    // 2. Fetch Dynamic Role Intelligence
    const info = getRoleIntelligence(targetRole, targetCompany);

    // Render Stage 1: Current Skills
    const displaySkills = candidateSkills.length > 0 ? candidateSkills : info.matchedSkills.map(m => m.skill);
    stageCurrentSkills.innerHTML = displaySkills.map((s) => `
      <span class="badge badge-emerald" style="font-size:0.8rem; padding:4px 10px;">✓ ${escapeHtml(s)}</span>
    `).join("");

    // Render Stage 2: Skills to Learn (Gaps tailored to this exact role)
    const skillsToLearnData = info.skillGaps || [];
    stageSkillsToLearn.innerHTML = skillsToLearnData.map((g) => `
      <div class="inner-item-box" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); flex-wrap:wrap; gap:0.5rem;">
        <div style="flex:1; min-width:220px;">
          <strong style="color:var(--text-primary); font-size:0.85rem;">${escapeHtml(g.skill)}</strong>
          <p style="font-size:0.75rem; color:var(--text-muted); margin:0.1rem 0 0;">${escapeHtml(g.gapDescription || "")}</p>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge ${g.priority === "Critical" ? "badge-rose" : "badge-amber"}" style="font-size:0.7rem;">${escapeHtml(g.priority || "High")}</span>
          <span style="font-size:0.75rem; color:var(--primary-light);">${escapeHtml(g.estimatedTimeToBridge || "2 weeks")}</span>
        </div>
      </div>
    `).join("");

    // Render Stage 3: Courses & Certifications tailored to this exact role with Direct Working Links
    const courses = info.courses || [];
    stageCoursesList.innerHTML = courses.map((c) => `
      <div class="inner-item-box" style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.85rem 1.15rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); flex-wrap:wrap; gap:0.75rem; transition: border-color 0.2s;">
        <div style="flex:1; min-width:240px;">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
            <strong style="color:var(--text-primary); font-size:0.95rem;">${escapeHtml(c.title)}</strong>
            <span class="badge badge-cyan" style="font-size:0.65rem;">${escapeHtml(c.cert || "Official")}</span>
          </div>
          <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">Platform: <strong style="color:var(--primary-light);">${escapeHtml(c.platform)}</strong> · Duration: ${escapeHtml(c.hours)}</p>
        </div>
        <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="font-size:0.8rem; padding:0.4rem 0.9rem;">
          <span>Official Site ↗</span>
        </a>
      </div>
    `).join("");

    // Render Stage 4: Flagship Projects tailored to this exact role
    const projects = info.projects || [];
    stageProjectsList.innerHTML = projects.map((p) => `
      <div class="inner-item-box" style="background:var(--bg-surface); padding:0.85rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem; flex-wrap:wrap; gap:0.5rem;">
          <strong style="color:var(--primary-light); font-size:0.9rem;">${escapeHtml(p.title)}</strong>
          <span class="badge badge-emerald" style="font-size:0.65rem;">Portfolio Milestone</span>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin:0;">${escapeHtml(p.desc)}</p>
      </div>
    `).join("");

    setButtonLoading(btnRegen, false);
  }

  // Wire up Role Preset Chips
  roleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selectedRole = chip.dataset.role;
      roadmapTargetInput.value = selectedRole;
      syncRoleChips(selectedRole);
      loadRoadmapData();
    });
  });

  roadmapTargetInput.addEventListener("input", debounce(() => {
    loadRoadmapData();
  }, 400));

  roadmapCompanySelect.addEventListener("change", () => loadRoadmapData());

  btnRegen.addEventListener("click", () => {
    loadRoadmapData(true);
    showToast("Roadmap regenerated for " + (roadmapTargetInput.value || "Web Developer"), "success");
  });

  // Export to PDF
  btnExportPdf.addEventListener("click", async () => {
    setButtonLoading(btnExportPdf, true);
    try {
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `CareerRoadmap_${targetRole.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };
      await html2pdf().set(opt).from(roadmapCanvas).save();
      showToast("🎉 Roadmap exported to PDF successfully!", "success");
    } catch (err) {
      console.warn("html2pdf notice:", err);
      window.print();
    } finally {
      setButtonLoading(btnExportPdf, false);
    }
  });

  // Export to Image (PNG)
  btnExportImg.addEventListener("click", async () => {
    setButtonLoading(btnExportImg, true);
    try {
      const canvasBg = TEMPLATE_META[activeTemplateKey]?.bg || "#0b1120";
      const canvas = await html2canvas(roadmapCanvas, {
        scale: 2,
        useCORS: true,
        backgroundColor: canvasBg,
        logging: false
      });
      const link = document.createElement("a");
      const candidateName = (user.displayName || user.email?.split("@")[0] || "Career").replace(/[^a-zA-Z0-9]/g, "_");
      link.download = `${candidateName}_${targetRole.replace(/[^a-zA-Z0-9]/g, "_")}_Roadmap.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      showToast("🎉 High-resolution Roadmap Image (PNG) exported!", "success");
    } catch (err) {
      showToast("Image export error: " + err.message, "error");
    } finally {
      setButtonLoading(btnExportImg, false);
    }
  });

  // Initialize
  await loadRoadmapData();
});
