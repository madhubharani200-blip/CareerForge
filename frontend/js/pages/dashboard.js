/**
 * DASHBOARD / CAREER COCKPIT CONTROLLER
 */

import { getCurrentUser } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { getUserResumes } from "../api/resume-api.js";
import { getUserPortfolios, getCandidateInquiries } from "../api/portfolio-api.js";
import { getLatestAgentRun } from "../api/agent-api.js";
import { getCareerRecommendations } from "../api/career-api.js";
import { improveContentWithAI } from "../api/content-api.js";
import { showToast, setButtonLoading, escapeHtml } from "../ui-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation shell
  renderNavbar("dashboard");

  // DOM Elements
  const greetingEl = document.getElementById("user-greeting");
  const headlineEl = document.getElementById("user-headline");
  const targetRoleEl = document.getElementById("dash-target-role");
  const agentDeltaSummary = document.getElementById("agent-delta-summary");
  const agentActionsList = document.getElementById("agent-actions-list");
  const resumesList = document.getElementById("resumes-list");
  const quickCareerMatches = document.getElementById("quick-career-matches");
  const btnViewPublicPortfolio = document.getElementById("btn-view-public-portfolio");
  const linkPublicStat = document.getElementById("link-public-stat");
  const statProjectsCount = document.getElementById("stat-projects-count");

  // AI Widget Elements
  const dashAiInput = document.getElementById("dash-ai-input");
  const dashAiTone = document.getElementById("dash-ai-tone");
  const btnDashImprove = document.getElementById("btn-dash-improve-text");
  const dashAiOutput = document.getElementById("dash-ai-output");

  // Set Greeting based on new vs returning user
  const isNewUser = localStorage.getItem("cf_is_new_user") === "true" || user.isNewUser;
  const displayName = user.displayName || user.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];

  if (isNewUser) {
    greetingEl.textContent = `Welcome to CareerForge, ${firstName}! 🎉`;
    if (headlineEl) headlineEl.textContent = "Your autonomous AI career cockpit is ready. Start by building a resume or creating your portfolio!";
  } else {
    greetingEl.textContent = `Welcome back, ${firstName}! 👋`;
    if (headlineEl) headlineEl.textContent = "Here is your career readiness overview and next steps for today.";
  }

  // Set Public Portfolio Link
  const publicUrl = `public-portfolio.html?u=${user.uid}`;
  if (btnViewPublicPortfolio) btnViewPublicPortfolio.href = publicUrl;
  if (linkPublicStat) linkPublicStat.href = publicUrl;

  // Load all dashboard sections in parallel for instant responsiveness
  const [agentRunRes, resumesRes, portfoliosRes, inquiriesRes, recsRes] = await Promise.allSettled([
    getLatestAgentRun(user.uid),
    getUserResumes(user.uid),
    getUserPortfolios(user.uid),
    getCandidateInquiries(user.uid),
    getCareerRecommendations({ uid: user.uid })
  ]);

  // 1. Render Latest Agent Run
  try {
    const latestRun = agentRunRes.status === "fulfilled" ? agentRunRes.value : null;
    if (latestRun) {
      targetRoleEl.textContent = latestRun.targetRole || "Full Stack Software Engineer";
      
      const delta = latestRun.deltaFromPrevious || {};
      agentDeltaSummary.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
          <strong style="color:var(--primary-light);">Snapshot from ${new Date(latestRun.evaluationTimestamp || Date.now()).toLocaleDateString()}</strong>
          <span class="badge badge-emerald">${delta.overallCareerReadinessChange || "+8%"}</span>
        </div>
        <p style="color:var(--text-secondary); margin:0;">${escapeHtml(delta.progressSummary || "Continuous progress recorded.")}</p>
      `;

      // Render Top 3 Actions
      const actions = latestRun.top3NextActions || [];
      if (actions.length > 0) {
        agentActionsList.innerHTML = actions.map((act, idx) => `
          <div style="display:flex; align-items:center; gap:0.75rem; background:var(--bg-surface); padding:0.75rem 1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
            <input type="checkbox" id="action-chk-${idx}" style="accent-color:var(--primary); width:18px; height:18px; cursor:pointer;">
            <div style="flex:1;">
              <label for="action-chk-${idx}" style="font-size:0.875rem; font-weight:600; color:var(--text-primary); cursor:pointer; display:block;">
                ${escapeHtml(act.action)}
              </label>
              <div style="display:flex; gap:0.5rem; margin-top:0.25rem; font-size:0.75rem; color:var(--text-muted);">
                <span class="badge badge-primary" style="font-size:0.65rem; padding:1px 6px;">${escapeHtml(act.category || "General")}</span>
                <span>⏱ ~${escapeHtml(act.estimatedTime || "1 hour")}</span>
              </div>
            </div>
            <span class="badge ${act.urgency === "High" ? "badge-rose" : "badge-amber"}" style="font-size:0.65rem;">
              ${escapeHtml(act.urgency || "Medium")}
            </span>
          </div>
        `).join("");
      }
    } else {
      agentDeltaSummary.innerHTML = `
        <p style="margin:0;">No agent run recorded yet. Click <strong>Run Career Agent</strong> to generate your baseline career roadmap!</p>
      `;
    }
  } catch (err) {
    console.warn("Could not load agent run:", err);
  }

  // 2. Render Resumes
  try {
    let resumes = resumesRes.status === "fulfilled" ? resumesRes.value : null;
    if (!resumes || resumes.length === 0) {
      resumes = [
        {
          id: "res_primary_default",
          title: "Full Stack Engineer Resume (ATS Optimized)",
          updatedAt: new Date().toISOString(),
          targetRole: "Full Stack Software Engineer",
          score: 84
        }
      ];
    }

    resumesList.innerHTML = resumes.map((res) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-elevated); padding:1rem 1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <strong style="color:var(--text-primary); font-size:0.95rem;">${escapeHtml(res.title || "Untitled Resume")}</strong>
            <span class="badge badge-cyan" style="font-size:0.65rem;">ATS ${res.score || 84}%</span>
          </div>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
            Updated: ${new Date(res.updatedAt).toLocaleDateString()} · Target: ${escapeHtml(res.targetRole || "Software Engineer")}
          </p>
        </div>
        <div style="display:flex; gap:0.5rem;">
          <a href="resume-builder.html?id=${res.id}" class="btn btn-secondary btn-sm">Edit</a>
          <a href="resume-analyzer.html?id=${res.id}" class="btn btn-outline btn-sm">ATS Scan</a>
        </div>
      </div>
    `).join("");
  } catch (err) {
    console.warn("Error loading resumes:", err);
  }

  // 3. Render Portfolio & Inquiries Count
  try {
    const portfolios = portfoliosRes.status === "fulfilled" ? portfoliosRes.value : null;
    const count = portfolios?.[0]?.projects?.length || 0;
    if (statProjectsCount) statProjectsCount.textContent = `${count} Projects`;

    const inquiries = inquiriesRes.status === "fulfilled" ? inquiriesRes.value : null;
    const inqCountEl = document.getElementById("dash-inquiries-count");
    if (inqCountEl) {
      inqCountEl.textContent = `${inquiries?.length || 0} Inquiries`;
      if (inquiries?.length > 0) {
        inqCountEl.className = "badge badge-emerald";
      }
    }
  } catch (e) {}

  // 4. Render Quick Career Recommendations
  try {
    const recs = recsRes.status === "fulfilled" ? recsRes.value : null;
    if (recs?.careerPaths?.length > 0) {
      quickCareerMatches.innerHTML = recs.careerPaths.slice(0, 3).map((cp) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-elevated); padding:0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          <div>
            <strong style="font-size:0.85rem; color:var(--text-primary); display:block;">${escapeHtml(cp.roleTitle)}</strong>
            <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHtml(cp.salaryRange)}</span>
          </div>
          <span class="badge badge-emerald" style="font-size:0.75rem;">${cp.fitScore}% Match</span>
        </div>
      `).join("");
    }
  } catch (e) {}

  // 5. Quick AI Content Assistant Widget Handler
  if (btnDashImprove) {
    btnDashImprove.addEventListener("click", async () => {
      const text = dashAiInput.value.trim();
      if (!text) {
        showToast("Please enter a bullet point or text to improve.", "error");
        return;
      }
      setButtonLoading(btnDashImprove, true);
      try {
        const result = await improveContentWithAI({
          text,
          tone: dashAiTone.value,
          context: "dashboard_quick_tool"
        });
        dashAiOutput.style.display = "block";
        dashAiOutput.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <strong style="font-size:0.8rem; color:var(--primary-light);">Enhanced Output (${escapeHtml(result.toneApplied)}):</strong>
            <button class="btn btn-secondary btn-sm" id="btn-copy-dash-ai" style="padding:2px 8px; font-size:0.7rem;">Copy</button>
          </div>
          <p style="font-size:0.85rem; color:var(--text-primary); line-height:1.5; margin:0;" id="dash-ai-text">${escapeHtml(result.improvedText)}</p>
        `;

        document.getElementById("btn-copy-dash-ai")?.addEventListener("click", () => {
          navigator.clipboard.writeText(result.improvedText);
          showToast("Copied to clipboard!", "success");
        });
      } catch (err) {
        showToast(err.message || "Improvement failed.", "error");
      } finally {
        setButtonLoading(btnDashImprove, false);
      }
    });
  }
});
