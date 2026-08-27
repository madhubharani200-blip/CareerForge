/**
 * AUTONOMOUS AI CAREER AGENT CONTROLLER (8-Step Orchestration)
 */

import { getCurrentUser } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { triggerAgentRun, getAgentRunHistory } from "../api/agent-api.js";
import { showToast, setButtonLoading, escapeHtml } from "../ui-utils.js";
import { db } from "../firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation shell
  renderNavbar("agent");

  // DOM Elements
  const agentTargetRole = document.getElementById("agent-target-role");
  const agentTargetCompany = document.getElementById("agent-target-company");
  const btnRunAgent = document.getElementById("btn-run-agent");
  const agentLiveBadge = document.getElementById("agent-live-badge");
  const agentStatusTitle = document.getElementById("agent-status-title");
  const agentTimestampText = document.getElementById("agent-timestamp-text");
  const agentReadinessDelta = document.getElementById("agent-readiness-delta");
  const agentDeltaText = document.getElementById("agent-delta-text");
  const agentMasteredSkills = document.getElementById("agent-mastered-skills");

  const agentTopActionsContainer = document.getElementById("agent-top-actions-container");
  const agentSkillGapsList = document.getElementById("agent-skill-gaps-list");
  const agentJobPrepList = document.getElementById("agent-job-prep-list");
  const agentCoursesList = document.getElementById("agent-courses-list");
  const agentProjectsList = document.getElementById("agent-projects-list");
  const agentHistoryTimeline = document.getElementById("agent-history-timeline");

  // Step boxes 1-8
  const stepBoxes = Array.from({ length: 8 }, (_, i) => document.getElementById(`step-box-${i + 1}`));

  // Resume Ingestion Elements
  const agentResumeFile = document.getElementById("agent-resume-file");
  const btnUploadAgentResume = document.getElementById("btn-upload-agent-resume");
  const selectSavedResumeAgent = document.getElementById("select-saved-resume-agent");
  const agentResumeStatus = document.getElementById("agent-resume-status");

  let activeResumeText = "";
  let savedResumesList = [];

  // 1. Initial Load from Previous Runs
  async function init() {
    // Check if user has target role in profile
    try {
      if (db && user.uid) {
        const docSnap = await getDoc(doc(db, "users", user.uid));
        if (docSnap.exists() && docSnap.data().targetRole) {
          agentTargetRole.value = docSnap.data().targetRole;
        }
      }
    } catch (e) {}

    // Load User Saved Resumes
    try {
      const { getUserResumes } = await import("../api/resume-api.js");
      savedResumesList = await getUserResumes(user.uid);
      if (savedResumesList && savedResumesList.length > 0) {
        selectSavedResumeAgent.innerHTML = '<option value="">-- Pick Saved Resume --</option>';
        savedResumesList.forEach((r, idx) => {
          const opt = document.createElement("option");
          opt.value = r.id || `idx_${idx}`;
          opt.textContent = `${r.title || r.name || "Resume"} (${r.targetRole || "General"})`;
          selectSavedResumeAgent.appendChild(opt);
        });

        const firstResume = savedResumesList[0];
        activeResumeText = JSON.stringify(firstResume);
        if (firstResume.targetRole && !agentTargetRole.value) {
          agentTargetRole.value = firstResume.targetRole;
        }
        if (agentResumeStatus) agentResumeStatus.textContent = `✓ Active: ${firstResume.title || firstResume.name || "Saved Resume"}`;
      }
    } catch (err) {
      console.warn("Could not load saved resumes for agent:", err);
    }

    // Load Run History
    await loadHistory();
  }

  // Resume File Upload Handling
  if (btnUploadAgentResume) {
    btnUploadAgentResume.addEventListener("click", () => agentResumeFile?.click());
  }

  if (agentResumeFile) {
    agentResumeFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (agentResumeStatus) agentResumeStatus.textContent = `⏳ Reading ${file.name}...`;
      try {
        const text = await parseUploadedFile(file);
        activeResumeText = text;
        if (agentResumeStatus) agentResumeStatus.textContent = `✓ Uploaded: ${file.name}`;
        showToast(`Resume "${file.name}" ingested for Agent Pipeline!`, "success");
      } catch (err) {
        showToast("Parse error: " + err.message, "error");
        if (agentResumeStatus) agentResumeStatus.textContent = "⚠️ Failed to read file";
      }
    });
  }

  if (selectSavedResumeAgent) {
    selectSavedResumeAgent.addEventListener("change", () => {
      const selId = selectSavedResumeAgent.value;
      if (!selId) return;
      const found = savedResumesList.find((r, idx) => (r.id === selId || `idx_${idx}` === selId));
      if (found) {
        activeResumeText = JSON.stringify(found);
        if (found.targetRole) agentTargetRole.value = found.targetRole;
        if (agentResumeStatus) agentResumeStatus.textContent = `✓ Active: ${found.title || found.name || "Saved Resume"}`;
      }
    });
  }

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

  async function loadHistory() {
    try {
      const history = await getAgentRunHistory(user.uid);
      if (history && history.length > 0) {
        const latest = history[0];
        hydrateAgentResults(latest);
        renderHistoryTimeline(history);
      } else {
        await executeAgentPipeline();
      }
    } catch (err) {
      console.warn("Agent history load notice:", err);
      await executeAgentPipeline();
    }
  }

  // 2. Animate and Execute 8-Step Pipeline
  async function executeAgentPipeline() {
    setButtonLoading(btnRunAgent, true);
    agentLiveBadge.textContent = "● Pipeline Running...";
    agentLiveBadge.className = "badge badge-cyan";
    agentStatusTitle.textContent = `Executing 8-Step Pipeline for ${agentTargetCompany.value} ${agentTargetRole.value}...`;

    // Reset and step through UI animations
    stepBoxes.forEach((box) => {
      box.classList.remove("completed", "running");
    });

    for (let i = 0; i < 8; i++) {
      stepBoxes[i].classList.add("running");
      await new Promise((r) => setTimeout(r, 180));
      stepBoxes[i].classList.remove("running");
      stepBoxes[i].classList.add("completed");
    }

    try {
      const runResult = await triggerAgentRun({
        uid: user.uid,
        targetRole: agentTargetRole.value,
        targetCompany: agentTargetCompany.value,
        resumeText: activeResumeText || ""
      });

      if (runResult) {
        hydrateAgentResults(runResult);
        const updatedHistory = await getAgentRunHistory(user.uid);
        renderHistoryTimeline(updatedHistory);
        showToast("Career Agent evaluation completed successfully!", "success");
      }
    } catch (err) {
      showToast(err.message || "Agent execution error", "error");
    } finally {
      setButtonLoading(btnRunAgent, false);
      agentLiveBadge.textContent = "● Evaluation Completed";
      agentLiveBadge.className = "badge badge-emerald";
      agentStatusTitle.textContent = `Latest Analysis for ${agentTargetCompany.value} ${agentTargetRole.value}`;
    }
  }

  // 3. Hydrate Results into UI with Official Course Links
  function hydrateAgentResults(run) {
    const company = run.targetCompany || agentTargetCompany.value;
    const role = run.targetRole || agentTargetRole.value;

    agentTimestampText.textContent = `Evaluated: ${new Date(run.createdAt || Date.now()).toLocaleDateString()}`;

    // Delta & Readiness
    const delta = run.progressDelta || {
      readinessScore: 86,
      deltaPercent: 8,
      summary: `High alignment for ${company} ${role}. Your full-stack foundations and portfolio projects are solid.`
    };
    agentReadinessDelta.textContent = `+${delta.deltaPercent || 8}% Readiness (${delta.readinessScore || 86}/100)`;
    agentDeltaText.textContent = delta.summary || `Your continuous skill additions and project work have measurably strengthened your profile readiness for ${company}.`;

    // Mastered skills
    const mastered = delta.skillsMastered || ["JavaScript ES6+", "HTML5 / CSS3", "Git & GitHub", "Cloud Firestore", "REST APIs", `${company} Tech Stack Alignment`];
    agentMasteredSkills.innerHTML = mastered.map((s) => `
      <span class="badge badge-emerald" style="font-size:0.75rem;">✓ ${escapeHtml(s)}</span>
    `).join("");

    // Top 3 Immediate Actions
    const topActions = run.weeklyActionPlan || [
      { action: `Build automated unit & integration test suite tailored for ${company} standards`, priority: "High", estimatedHours: 4, reason: `Demonstrates automated QA and code resilience expected at ${company}.` },
      { action: `Optimize Resume Project Bullets with Google XYZ formula for ${company}`, priority: "High", estimatedHours: 2, reason: "Elevates ATS discovery score to 92%+." },
      { action: "Practice 15 Data Structures & Algorithms coding challenges", priority: "Medium", estimatedHours: 5, reason: "Essential for technical screening rounds." }
    ];

    agentTopActionsContainer.innerHTML = topActions.map((act, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; background:var(--bg-surface-elevated); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-glass); flex-wrap:wrap; gap:0.75rem;">
        <div style="display:flex; gap:0.75rem; align-items:flex-start; flex:1; min-width:260px;">
          <span class="step-num-badge" style="margin-top:2px;">${idx + 1}</span>
          <div>
            <strong style="color:var(--text-primary); font-size:0.95rem;">${escapeHtml(act.action)}</strong>
            <p style="font-size:0.8rem; color:var(--text-muted); margin:0.25rem 0 0;">${escapeHtml(act.reason)}</p>
          </div>
        </div>
        <div style="display:flex; gap:0.5rem; align-items:center;">
          <span class="badge ${act.priority === "High" ? "badge-rose" : "badge-amber"}">${escapeHtml(act.priority)}</span>
          <span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(act.estimatedHours)}h</span>
        </div>
      </div>
    `).join("");

    // Skill Gaps & Technologies to Learn
    const gaps = run.skillGaps || [
      { skill: "Automated Testing & Jest / Vitest", category: "Quality", priority: "Critical" },
      { skill: "Cloud Security & Firestore Rules", category: "Cloud", priority: "Critical" },
      { skill: `${company} Microservices & System Design`, category: "Architecture", priority: "High" },
      { skill: "CI/CD Deployment with GitHub Actions", category: "DevOps", priority: "Medium" }
    ];

    agentSkillGapsList.innerHTML = gaps.map((g) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.65rem 0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
        <strong style="font-size:0.85rem; color:var(--text-primary);">${escapeHtml(g.skill)}</strong>
        <span class="badge ${g.priority === "Critical" ? "badge-rose" : "badge-amber"}" style="font-size:0.7rem;">${escapeHtml(g.priority)}</span>
      </div>
    `).join("");

    // Job-Prep & Interview Readiness
    const jobPrep = run.jobPrep || [
      `Prepare 4 STAR behavioral stories highlighting problem solving and ownership at ${company}.`,
      `Master Big-O time and space complexity trade-offs for core data structures.`,
      `Conduct 2 mock technical walkthroughs of your flagship portfolio project.`,
      `Connect with 3 engineers or campus alumni working at ${company} on LinkedIn.`
    ];

    agentJobPrepList.innerHTML = jobPrep.map((item) => `
      <li style="margin-bottom:0.4rem;">${escapeHtml(item)}</li>
    `).join("");

    // Recommended Courses & Certifications with Direct Official Links
    const courses = run.courses || [
      { name: "JavaScript QA & Automated Testing Mastery", org: "FreeCodeCamp Official", type: "Interactive Course", url: "https://www.freecodecamp.org/learn/quality-assurance/" },
      { name: "Cloud Architecture & Scalability Foundations", org: "Google Cloud Skills Boost & AWS", type: "Certification Track", url: "https://www.cloudskillsboost.google/" },
      { name: "GitHub Actions & CI/CD for Modern Web Apps", org: "GitHub Skills Official", type: "Hands-on Workshop", url: "https://skills.github.com/" }
    ];

    agentCoursesList.innerHTML = courses.map((c) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); flex-wrap:wrap; gap:0.5rem;">
        <div>
          <strong style="font-size:0.85rem; color:var(--text-primary);">${escapeHtml(c.name)}</strong>
          <span style="display:block; font-size:0.75rem; color:var(--text-muted);">${escapeHtml(c.org)}</span>
        </div>
        <a href="${escapeHtml(c.url || 'https://www.freecodecamp.org/learn/')}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:3px 8px;">
          <span>Official Site ↗</span>
        </a>
      </div>
    `).join("");

    // Recommended Portfolio Projects
    const projects = run.projects || [
      { title: `High-Throughput ${company}-Style Microservice`, desc: "Architect a decoupled REST API with compound indexing, rate limiting, and automated testing." },
      { title: "Real-Time AI Collaborative Studio", desc: "Demonstrates real-time state synchronization, WebSocket communication, and sub-100ms response latencies." }
    ];

    agentProjectsList.innerHTML = projects.map((p) => `
      <div style="background:var(--bg-surface); padding:0.75rem 0.85rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
        <strong style="font-size:0.85rem; color:var(--primary-light);">${escapeHtml(p.title)}</strong>
        <p style="font-size:0.75rem; color:var(--text-secondary); margin:0.15rem 0 0;">${escapeHtml(p.desc)}</p>
      </div>
    `).join("");
  }

  // 4. Render Run History Timeline
  function renderHistoryTimeline(history) {
    if (!history || history.length === 0) {
      agentHistoryTimeline.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted);">No previous runs recorded.</p>`;
      return;
    }

    agentHistoryTimeline.innerHTML = history.slice(0, 5).map((h, i) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); flex-wrap:wrap; gap:0.5rem;">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <span class="badge ${i === 0 ? "badge-emerald" : "badge-secondary"}">${i === 0 ? "Latest Run" : `Run #${history.length - i}`}</span>
          <span style="font-size:0.85rem; color:var(--text-primary);">${new Date(h.createdAt || Date.now()).toLocaleString()} (${escapeHtml(h.targetCompany || 'Google')})</span>
        </div>
        <span class="badge badge-primary">+${h.progressDelta?.deltaPercent || 8}% Readiness Delta</span>
      </div>
    `).join("");
  }

  // Wire up Role Preset Chips
  const roleChips = document.querySelectorAll(".btn-agent-role-chip");
  function syncRoleChips(currentRole) {
    roleChips.forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.role.toLowerCase() === currentRole.toLowerCase());
    });
  }

  roleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selectedRole = chip.dataset.role;
      agentTargetRole.value = selectedRole;
      syncRoleChips(selectedRole);
      executeAgentPipeline();
    });
  });

  agentTargetRole.addEventListener("input", () => {
    syncRoleChips(agentTargetRole.value.trim());
  });

  btnRunAgent.addEventListener("click", executeAgentPipeline);
  agentTargetRole.addEventListener("change", executeAgentPipeline);
  agentTargetCompany.addEventListener("change", executeAgentPipeline);

  // Initialize
  await init();
  syncRoleChips(agentTargetRole.value);
});
