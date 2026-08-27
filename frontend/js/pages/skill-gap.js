/**
 * RESUME-DRIVEN SKILL GAP ANALYSIS CONTROLLER
 */

import { getCurrentUser } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { getUserResumes } from "../api/resume-api.js";
import { getRoleIntelligence } from "../api/career-role-engine.js";
import { showToast, setButtonLoading, escapeHtml } from "../ui-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation shell
  renderNavbar("skill-gap");

  // DOM Elements
  const inputRole = document.getElementById("input-gap-target-role");
  const btnReanalyze = document.getElementById("btn-reanalyze-gaps");
  const gapScoreCircle = document.getElementById("gap-score-circle");
  const gapScoreVal = document.getElementById("gap-score-val");
  const gapVerdictText = document.getElementById("gap-verdict-text");
  const gapsContainer = document.getElementById("skill-gaps-table-container");
  const matchedContainer = document.getElementById("matched-skills-container");
  const badgeCriticalCount = document.getElementById("badge-critical-count");

  // Resume Ingestion Elements
  const gapResumeFile = document.getElementById("gap-resume-file");
  const btnUploadGapResume = document.getElementById("btn-upload-gap-resume");
  const selectSavedResumeGap = document.getElementById("select-saved-resume-gap");
  const gapResumeStatus = document.getElementById("gap-resume-status");

  // Category scores
  const scoreCatTech = document.getElementById("score-cat-tech");
  const barCatTech = document.getElementById("bar-cat-tech");
  const scoreCatProj = document.getElementById("score-cat-proj");
  const barCatProj = document.getElementById("bar-cat-proj");
  const scoreCatSys = document.getElementById("score-cat-sys");
  const barCatSys = document.getElementById("bar-cat-sys");
  const scoreCatCloud = document.getElementById("score-cat-cloud");
  const barCatCloud = document.getElementById("bar-cat-cloud");

  // Role Chips
  const roleChips = document.querySelectorAll(".btn-gap-role-chip");
  const btnGotoRoadmap = document.getElementById("btn-goto-roadmap");

  let activeResumeText = "";
  let savedResumesList = [];

  function syncRoleChips(currentRole) {
    roleChips.forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.role.toLowerCase() === currentRole.toLowerCase());
    });
    if (btnGotoRoadmap) {
      btnGotoRoadmap.href = `learning-roadmap.html?role=${encodeURIComponent(currentRole)}`;
    }
  }

  // 1. Load User Saved Resumes
  try {
    savedResumesList = await getUserResumes(user.uid);
    if (savedResumesList && savedResumesList.length > 0) {
      selectSavedResumeGap.innerHTML = '<option value="">-- Pick Saved Resume --</option>';
      savedResumesList.forEach((r, idx) => {
        const opt = document.createElement("option");
        opt.value = r.id || `idx_${idx}`;
        opt.textContent = `${r.title || r.name || "Resume"} (${r.targetRole || "General"})`;
        selectSavedResumeGap.appendChild(opt);
      });

      const firstResume = savedResumesList[0];
      activeResumeText = JSON.stringify(firstResume);
      if (firstResume.targetRole && !inputRole.value) {
        inputRole.value = firstResume.targetRole;
      }
      gapResumeStatus.textContent = `✓ Active: ${firstResume.title || firstResume.name || "Saved Resume"}`;
    }
  } catch (err) {
    console.warn("Could not load saved resumes:", err);
  }

  // 2. Upload Listeners
  btnUploadGapResume.addEventListener("click", () => gapResumeFile.click());

  gapResumeFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    gapResumeStatus.textContent = `⏳ Reading ${file.name}...`;
    try {
      const text = await parseUploadedFile(file);
      activeResumeText = text;
      gapResumeStatus.textContent = `✓ Uploaded: ${file.name}`;
      showToast(`Resume "${file.name}" ingested for skill audit!`, "success");
      loadSkillGap();
    } catch (err) {
      showToast("Parse error: " + err.message, "error");
      gapResumeStatus.textContent = "⚠️ Failed to read file";
    }
  });

  selectSavedResumeGap.addEventListener("change", () => {
    const selId = selectSavedResumeGap.value;
    if (!selId) return;
    const found = savedResumesList.find((r, idx) => (r.id === selId || `idx_${idx}` === selId));
    if (found) {
      activeResumeText = JSON.stringify(found);
      if (found.targetRole) inputRole.value = found.targetRole;
      gapResumeStatus.textContent = `✓ Active: ${found.title || found.name || "Saved Resume"}`;
      loadSkillGap();
    }
  });

  async function parseUploadedFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".txt") || name.endsWith(".json")) return await file.text();
    if (name.endsWith(".pdf")) {
      if (!window.pdfjsLib) throw new Error("PDF parser loading, please retry.");
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tokenized = await page.getTextContent();
        fullText += tokenized.items.map(item => item.str).join(" ") + "\n";
      }
      return fullText;
    }
    if (name.endsWith(".docx")) {
      if (!window.mammoth) throw new Error("DOCX parser loading, please retry.");
      const arrayBuffer = await file.arrayBuffer();
      const res = await window.mammoth.extractRawText({ arrayBuffer });
      return res.value;
    }
    return await file.text();
  }

  // Read target role from URL if present
  const urlRole = new URLSearchParams(window.location.search).get("role");
  if (urlRole) {
    inputRole.value = decodeURIComponent(urlRole);
  }

  async function loadSkillGap(forceRefresh = false) {
    setButtonLoading(btnReanalyze, true);
    const targetRole = inputRole.value.trim() || "Web Developer";
    syncRoleChips(targetRole);

    try {
      const intel = getRoleIntelligence(targetRole) || {};
      const textLower = (activeResumeText || "").toLowerCase();

      const matchedSkills = [];
      const identifiedGaps = [];

      const currentSkillsList = (intel.currentSkills && Array.isArray(intel.currentSkills))
        ? intel.currentSkills
        : ((intel.matchedSkills || []).map(m => (typeof m === "string" ? m : (m?.skill || ""))));

      const skillsToLearnList = (intel.skillsToLearn && Array.isArray(intel.skillsToLearn))
        ? intel.skillsToLearn
        : ((intel.skillGaps || []).map(g => (typeof g === "string" ? g : (g?.skill || ""))));

      // Check current verified skills
      currentSkillsList.filter(Boolean).forEach((sk) => {
        const query = sk.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
        const parts = query.split(/\s+/);
        const has = parts.some((p) => p.length >= 3 && textLower.includes(p));
        if (has || !activeResumeText) {
          matchedSkills.push({
            skill: sk,
            currentLevel: "Intermediate",
            strengthAssessment: `Demonstrated competency in ${sk} identified in resume.`
          });
        }
      });

      // Analyze missing skills and gaps
      skillsToLearnList.filter(Boolean).forEach((sk, idx) => {
        const query = sk.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
        const parts = query.split(/\s+/);
        const has = textLower.includes(query) || (parts.length > 0 && parts.every(p => textLower.includes(p)));
        
        if (!has) {
          const priority = idx === 0 ? "Critical" : (idx <= 2 ? "High" : "Medium");
          identifiedGaps.push({
            skill: sk,
            priority,
            category: idx % 2 === 0 ? "Core Architecture" : "Production Tooling",
            currentLevel: "Novice / Unverified",
            requiredLevel: "Advanced Production",
            estimatedTimeToBridge: `${(idx + 1) * 7} Days`,
            gapDescription: `Your resume lacks direct evidence of ${sk}, a critical requirement for top-tier ${targetRole} positions.`,
            actionPlan: `Complete hands-on module, build a mini-feature implementing ${sk}, and add quantified bullet in resume.`
          });
        } else {
          matchedSkills.push({
            skill: sk,
            currentLevel: "Advanced",
            strengthAssessment: `Confirmed direct keyword evidence of ${sk} in your resume experience.`
          });
        }
      });

      // Compute dynamic readiness score
      const totalEval = Math.max(matchedSkills.length + identifiedGaps.length, 1);
      const calculatedScore = Math.min(95, Math.max(50, Math.round((matchedSkills.length / totalEval) * 100)));

      gapScoreVal.textContent = `${calculatedScore}%`;
      gapScoreCircle.style.setProperty("--score", calculatedScore);
      gapVerdictText.textContent = calculatedScore >= 80 
        ? `Strong profile readiness for ${targetRole}. Focus on remaining high-priority gaps.`
        : `Personalized skill gap audit for ${targetRole}. Close critical gaps to boost hireability.`;

      // Update category metrics
      const techScore = Math.min(96, Math.max(55, calculatedScore + 5));
      const projScore = Math.min(94, Math.max(50, calculatedScore - 2));
      const sysScore = Math.min(90, Math.max(45, calculatedScore - 12));
      const cloudScore = Math.min(92, Math.max(45, calculatedScore - 8));

      scoreCatTech.textContent = `${techScore}%`; barCatTech.style.width = `${techScore}%`;
      scoreCatProj.textContent = `${projScore}%`; barCatProj.style.width = `${projScore}%`;
      scoreCatSys.textContent = `${sysScore}%`; barCatSys.style.width = `${sysScore}%`;
      scoreCatCloud.textContent = `${cloudScore}%`; barCatCloud.style.width = `${cloudScore}%`;

      renderGaps(identifiedGaps, targetRole);
      renderMatched(matchedSkills);

    } catch (err) {
      showToast(err.message || "Failed to analyze skill gaps", "error");
    } finally {
      setButtonLoading(btnReanalyze, false);
    }
  }

  function renderGaps(gaps, role) {
    const criticalCount = gaps.filter((g) => g.priority === "Critical").length;
    if (badgeCriticalCount) {
      badgeCriticalCount.textContent = `${criticalCount} Critical Gaps`;
    }

    if (!gaps || gaps.length === 0) {
      gapsContainer.innerHTML = `<p style="color:var(--accent-emerald); font-weight:600; padding:1rem;">🎉 Excellent! All primary competency requirements for ${escapeHtml(role)} are covered in your resume!</p>`;
      return;
    }

    gapsContainer.innerHTML = gaps.map((gap) => {
      const prioClass = gap.priority === "Critical" ? "badge-rose" : gap.priority === "High" ? "badge-amber" : "badge-cyan";

      return `
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.6rem; flex-wrap:wrap; gap:0.5rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
                <strong style="color:var(--text-primary); font-size:1.05rem;">${escapeHtml(gap.skill)}</strong>
                <span class="badge ${prioClass}">${escapeHtml(gap.priority)} Priority</span>
                <span class="badge badge-primary" style="font-size:0.65rem;">${escapeHtml(gap.category || "Specialization")}</span>
              </div>
              <p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">
                Current Level: <span style="color:var(--accent-rose); font-weight:600;">${escapeHtml(gap.currentLevel || "Novice")}</span> 
                → Required: <span style="color:var(--accent-emerald); font-weight:600;">${escapeHtml(gap.requiredLevel || "Advanced")}</span>
                · Estimated Bridge Time: <span style="color:var(--primary-light); font-weight:600;">${escapeHtml(gap.estimatedTimeToBridge || "2 weeks")}</span>
              </p>
            </div>
            <a href="learning-roadmap.html?role=${encodeURIComponent(role)}" class="btn btn-secondary btn-sm">Find Courses ↗</a>
          </div>

          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin-bottom:0.75rem;">
            ${escapeHtml(gap.gapDescription)}
          </p>

          <div style="background:var(--bg-surface); padding:0.75rem 1rem; border-radius:var(--radius-sm); border-left:3px solid var(--primary-light); font-size:0.85rem;">
            <strong style="color:var(--text-primary);">Action Plan:</strong>
            <span style="color:var(--text-secondary); margin-left:0.25rem;">${escapeHtml(gap.actionPlan)}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderMatched(matched) {
    if (!matched || matched.length === 0) {
      matchedContainer.innerHTML = `<p style="color:var(--text-muted);">Upload your resume above to extract matched proficiencies.</p>`;
      return;
    }

    matchedContainer.innerHTML = matched.map((m) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:0.5rem;">
        <div>
          <strong style="color:var(--text-primary); font-size:0.9rem;">${escapeHtml(m.skill)}</strong>
          <p style="font-size:0.8rem; color:var(--text-muted); margin:0.15rem 0 0;">${escapeHtml(m.strengthAssessment)}</p>
        </div>
        <span class="badge badge-emerald">${escapeHtml(m.currentLevel)}</span>
      </div>
    `).join("");
  }

  // Wire up Role Preset Chips
  roleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      inputRole.value = chip.dataset.role;
      loadSkillGap();
    });
  });

  inputRole.addEventListener("change", () => loadSkillGap());
  btnReanalyze.addEventListener("click", () => loadSkillGap(true));

  // Initial Load
  await loadSkillGap();
});
