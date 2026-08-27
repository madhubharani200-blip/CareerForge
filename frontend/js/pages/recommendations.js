import { getCurrentUser, updateUserSession } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { getCareerRecommendations } from "../api/career-api.js";
import { db } from "../firebase-config.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast, setButtonLoading, escapeHtml, debounce } from "../ui-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation shell
  renderNavbar("recommendations");

  // DOM Elements
  const inputTargetRole = document.getElementById("input-rec-target-role");
  const btnSubmitRoleAnalysis = document.getElementById("btn-submit-role-analysis");
  const summaryTopRole = document.getElementById("summary-top-role");
  const summaryTopScore = document.getElementById("summary-top-score");
  const summaryTopFitCircle = document.getElementById("summary-top-fit-circle");
  const summaryExecutiveText = document.getElementById("summary-executive-text");
  const careerPathsGrid = document.getElementById("career-paths-grid");
  const btnRefresh = document.getElementById("btn-refresh-recommendations");
  const roleChips = document.querySelectorAll(".btn-rec-role-chip");

  function syncRoleChips(currentRole) {
    roleChips.forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.role.toLowerCase() === currentRole.toLowerCase());
    });
  }

  // Check URL params or user profile (local storage first, then Firestore)
  const urlRole = new URLSearchParams(window.location.search).get("role");
  if (urlRole) {
    inputTargetRole.value = decodeURIComponent(urlRole);
  } else {
    try {
      const localProf = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || localStorage.getItem("cf_user_profile") || "{}");
      if (localProf.targetRole) {
        inputTargetRole.value = localProf.targetRole;
      } else if (db && user.uid) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().targetRole) {
          inputTargetRole.value = snap.data().targetRole;
        }
      }
    } catch (e) {
      console.warn("Notice loading target role:", e);
    }
  }

  async function loadRecommendations(forceRefresh = false) {
    setButtonLoading(btnRefresh, true);
    if (btnSubmitRoleAnalysis) setButtonLoading(btnSubmitRoleAnalysis, true);

    const targetRole = inputTargetRole.value.trim() || "Web Developer";
    syncRoleChips(targetRole);

    try {
      const data = await getCareerRecommendations({
        uid: user.uid,
        targetRole,
        forceRefresh
      });

      if (data) {
        summaryTopRole.textContent = data.topRecommendedRole || targetRole;
        const topFit = data.careerPaths?.[0]?.fitScore || 95;
        summaryTopScore.textContent = `${topFit}%`;
        summaryTopFitCircle.style.setProperty("--score", topFit);
        summaryExecutiveText.textContent = data.executiveSummary || `Tailored career recommendations and course pathways for ${targetRole}.`;

        renderCareerPaths(data.careerPaths || []);
      }
    } catch (err) {
      showToast(err.message || "Failed to load recommendations", "error");
    } finally {
      setButtonLoading(btnRefresh, false);
      if (btnSubmitRoleAnalysis) setButtonLoading(btnSubmitRoleAnalysis, false);
    }
  }

  function renderCareerPaths(paths) {
    if (!paths || paths.length === 0) {
      careerPathsGrid.innerHTML = `<p style="color:var(--text-muted);">No career paths generated yet. Click analyze above.</p>`;
      return;
    }

    careerPathsGrid.innerHTML = paths.map((cp) => {
      const courses = cp.recommendedCourses || [];

      return `
        <div class="card card-glass card-interactive" style="display:flex; flex-direction:column; justify-content:space-between; margin-bottom: 1.5rem;">
          <div>
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span class="badge ${cp.fitScore >= 90 ? "badge-emerald" : cp.fitScore >= 80 ? "badge-cyan" : "badge-amber"}">
                  ${cp.fitScore}% Fit Match
                </span>
                <h3 style="font-size:1.25rem; color:var(--text-primary); margin-top:0.4rem;">${escapeHtml(cp.roleTitle)}</h3>
              </div>
              <div style="text-align:right;">
                <span style="font-size:0.85rem; font-weight:700; color:var(--text-primary);">${escapeHtml(cp.salaryRange)}</span>
                <span style="display:block; font-size:0.75rem; color:var(--text-muted);">${escapeHtml(cp.marketDemand)} Demand</span>
              </div>
            </div>

            <!-- Rationale -->
            <p style="font-size:0.875rem; color:var(--text-secondary); line-height:1.5; margin-bottom:1rem;">
              ${escapeHtml(cp.matchRationale)}
            </p>

            <!-- Core Skills Requirements -->
            <div style="margin-bottom:1rem;">
              <strong style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.05em; display:block; margin-bottom:0.4rem;">
                Core Competencies & Skills
              </strong>
              <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                ${(cp.coreSkillRequirements || []).map((s) => `
                  <span style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); padding:0.2rem 0.5rem; border-radius:var(--radius-sm); font-size:0.75rem; color:var(--text-primary);">
                    ${escapeHtml(s)}
                  </span>
                `).join("")}
              </div>
            </div>

            <!-- Recommended Courses & Certifications Based on What User Needs -->
            ${courses.length > 0 ? `
              <div style="margin-bottom:1rem; background:rgba(99,102,241,0.06); padding:0.85rem; border-radius:var(--radius-md); border:1px solid rgba(99,102,241,0.2);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                  <strong style="font-size:0.8rem; text-transform:uppercase; color:var(--primary-light); letter-spacing:0.05em;">
                    📚 Tailored Courses & Certifications
                  </strong>
                  <span class="badge badge-primary" style="font-size:0.65rem;">Official Links</span>
                </div>
                <div style="display:flex; flex-direction:column; gap:0.5rem;">
                  ${courses.map(c => `
                    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.5rem 0.75rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); flex-wrap:wrap; gap:0.5rem;">
                      <div style="flex:1; min-width:180px;">
                        <strong style="font-size:0.85rem; color:var(--text-primary);">${escapeHtml(c.title)}</strong>
                        <p style="font-size:0.75rem; color:var(--text-muted); margin:0.1rem 0 0;">${escapeHtml(c.platform)} · ${escapeHtml(c.hours || "Self-Paced")}</p>
                      </div>
                      <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline" style="font-size:0.75rem; padding:0.25rem 0.6rem;">
                        Official Course ↗
                      </a>
                    </div>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            <!-- Day in the Life -->
            <div style="background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-md); font-size:0.8rem; color:var(--text-secondary); margin-bottom:1.25rem;">
              <strong style="color:var(--text-primary);">Day in the Life:</strong> ${escapeHtml(cp.dayInTheLife || "")}
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex; gap:0.5rem; border-top:1px solid var(--border-subtle); padding-top:1rem; margin-top:auto; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm btn-set-target" data-role="${escapeHtml(cp.roleTitle)}" style="flex:1; min-width:130px;">
              🎯 Set as Target
            </button>
            <a href="learning-roadmap.html?role=${encodeURIComponent(cp.roleTitle)}" class="btn btn-primary btn-sm" style="flex:1; min-width:130px; text-align:center;">
              Roadmap & Courses →
            </a>
            <a href="skill-gap.html?role=${encodeURIComponent(cp.roleTitle)}" class="btn btn-outline btn-sm" style="flex:1; min-width:110px; text-align:center;">
              Audit Gap ⚡
            </a>
          </div>
        </div>
      `;
    }).join("");

    // Attach Set as Target Role listener
    document.querySelectorAll(".btn-set-target").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const targetRole = e.currentTarget.dataset.role;
        setButtonLoading(btn, true);
        try {
          // 1. Permanently update local profile, active user session, and storage
          await updateUserSession({ targetRole });
          const existingProfile = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || "{}");
          existingProfile.targetRole = targetRole;
          localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(existingProfile));

          // 2. Safely sync to Firestore in background
          if (db && user.uid) {
            try {
              await setDoc(doc(db, "users", user.uid), {
                targetRole,
                updatedAt: serverTimestamp()
              }, { merge: true });
            } catch (firestoreErr) {
              console.warn("[Recommendations] Firestore sync notice (saved locally):", firestoreErr.message);
            }
          }

          // 3. Update input value and active chips
          inputTargetRole.value = targetRole;
          syncRoleChips(targetRole);

          showToast(`Target role successfully set to "${targetRole}"!`, "success");
        } catch (err) {
          console.error("Target role error:", err);
          showToast("Error updating target role: " + err.message, "error");
        } finally {
          setButtonLoading(btn, false);
        }
      });
    });
  }

  // Role Chips Listeners
  roleChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const selectedRole = chip.dataset.role;
      inputTargetRole.value = selectedRole;
      syncRoleChips(selectedRole);
      loadRecommendations(false);
    });
  });

  inputTargetRole.addEventListener("input", () => {
    syncRoleChips(inputTargetRole.value.trim());
  });

  if (btnSubmitRoleAnalysis) {
    btnSubmitRoleAnalysis.addEventListener("click", () => loadRecommendations(true));
  }

  btnRefresh.addEventListener("click", () => loadRecommendations(true));

  // Initialize
  await loadRecommendations();
});
