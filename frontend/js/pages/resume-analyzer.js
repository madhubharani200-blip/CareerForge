/**
 * COMPANY & ROLE ATS RESUME ANALYZER CONTROLLER
 * 100% Dynamic - Evaluates strictly on user's target role, target company, and uploaded resume text.
 * Calculates distinct ATS match scores based on company-specific hiring criteria and tech requirements.
 */

import { getCurrentUser } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { getUserResumes } from "../api/resume-api.js";
import { getRoleIntelligence, getCompanyIntelligence } from "../api/career-role-engine.js?v=2.3.0";
import { showToast, setButtonLoading, escapeHtml } from "../ui-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation shell
  renderNavbar("analyzer");

  // DOM Elements
  const scanCompanySelect = document.getElementById("scan-company-select");
  const scanRoleInput = document.getElementById("scan-role-input");
  const atsTargetCompanyLbl = document.getElementById("ats-target-company-lbl");

  const scanResumeFile = document.getElementById("scan-resume-file");
  const btnUploadScanResume = document.getElementById("btn-upload-scan-resume");
  const selectSavedResumeScan = document.getElementById("select-saved-resume-scan");
  const scanResumeStatus = document.getElementById("scan-resume-status");

  const atsScoreCircle = document.getElementById("ats-score-circle");
  const atsOverallVal = document.getElementById("ats-overall-val");
  const atsTierBadge = document.getElementById("ats-tier-badge");
  const scoreAtsParse = document.getElementById("score-ats-parse");
  const barAtsParse = document.getElementById("bar-ats-parse");
  const scoreAtsMetrics = document.getElementById("score-ats-metrics");
  const barAtsMetrics = document.getElementById("bar-ats-metrics");
  const scoreAtsKeywords = document.getElementById("score-ats-keywords");
  const barAtsKeywords = document.getElementById("bar-ats-keywords");
  const scoreAtsClarity = document.getElementById("score-ats-clarity");
  const barAtsClarity = document.getElementById("bar-ats-clarity");

  const strengthsContainer = document.getElementById("ats-strengths-container");
  const weaknessesContainer = document.getElementById("ats-weaknesses-container");
  const matchingKeywordsContainer = document.getElementById("ats-matching-keywords-container");
  const missingKeywordsContainer = document.getElementById("ats-missing-keywords-container");
  const structureIssuesContainer = document.getElementById("structure-issues-container");
  const lineByLineContainer = document.getElementById("line-by-line-container");
  const btnReScan = document.getElementById("btn-re-scan");

  // In-memory active resume text and data
  let activeResumeText = "";
  let activeResumeObj = null;
  let savedResumesList = [];

  // 1. Load User Saved Resumes (Without running default scan)
  try {
    savedResumesList = await getUserResumes(user.uid);
    if (savedResumesList && Array.isArray(savedResumesList) && savedResumesList.length > 0) {
      selectSavedResumeScan.innerHTML = '<option value="">-- Pick Saved Resume from Profile --</option>';
      savedResumesList.forEach((r, idx) => {
        const opt = document.createElement("option");
        opt.value = r.id || `idx_${idx}`;
        opt.textContent = `${r.title || r.name || "Resume"} (${r.targetRole || "Profile"})`;
        selectSavedResumeScan.appendChild(opt);
      });
    }
  } catch (err) {
    console.warn("Could not load saved resumes:", err);
  }

  // 2. File Upload Listeners
  btnUploadScanResume.addEventListener("click", () => {
    scanResumeFile.click();
  });

  scanResumeFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    scanResumeStatus.textContent = `⏳ Reading ${file.name}...`;
    scanResumeStatus.style.color = "var(--primary-light)";
    try {
      const text = await parseUploadedFile(file);
      activeResumeText = text;
      activeResumeObj = { rawText: text, fileName: file.name };
      scanResumeStatus.textContent = `✓ Uploaded: ${file.name} (${text.split(/\s+/).length} words)`;
      scanResumeStatus.style.color = "var(--accent-emerald)";

      // Auto-detect role from text if empty
      if (!scanRoleInput.value.trim()) {
        const detected = detectRoleFromResumeText(text);
        if (detected) {
          scanRoleInput.value = detected;
        }
      }

      showToast(`Resume "${file.name}" loaded successfully!`, "success");

      // Auto run scan if role is present
      if (scanRoleInput.value.trim()) {
        performScan();
      } else {
        showToast("Please enter your Target Job Role above to run the ATS scan.", "info");
        scanRoleInput.focus();
      }
    } catch (parseErr) {
      showToast("Error parsing file: " + parseErr.message, "error");
      scanResumeStatus.textContent = "⚠️ Failed to parse file";
      scanResumeStatus.style.color = "var(--accent-rose)";
    }
  });

  selectSavedResumeScan.addEventListener("change", () => {
    const selectedId = selectSavedResumeScan.value;
    if (!selectedId) return;
    const found = (savedResumesList || []).find((r, idx) => (r.id === selectedId || `idx_${idx}` === selectedId));
    if (found) {
      activeResumeObj = found;
      activeResumeText = extractStructuredResumeText(found);
      if (found.targetRole) {
        scanRoleInput.value = found.targetRole;
      } else if (!scanRoleInput.value.trim()) {
        const detected = detectRoleFromResumeText(activeResumeText);
        if (detected) scanRoleInput.value = detected;
      }
      scanResumeStatus.textContent = `✓ Selected: ${found.title || found.name || "Saved Resume"}`;
      scanResumeStatus.style.color = "var(--accent-emerald)";
      showToast(`Selected saved resume: "${found.title || found.name || "Resume"}"`, "info");
      
      if (scanRoleInput.value.trim()) {
        performScan();
      }
    }
  });

  // Re-run scan immediately when target company dropdown changes
  scanCompanySelect.addEventListener("change", () => {
    if (activeResumeText && scanRoleInput.value.trim()) {
      performScan();
    }
  });

  function detectRoleFromResumeText(text) {
    if (!text) return "";
    const lower = text.toLowerCase();
    const knownRoles = [
      "full stack developer", "full stack engineer", "full stack",
      "frontend developer", "frontend engineer", "front end developer",
      "backend developer", "backend engineer", "back end developer",
      "software engineer", "software developer",
      "react developer", "angular developer", "vue developer", "node.js developer",
      "data analyst", "data scientist", "machine learning engineer", "ai engineer",
      "cloud architect", "cloud engineer", "devops engineer",
      "qa engineer", "automation engineer", "test engineer",
      "mobile developer", "android developer", "ios developer", "flutter developer",
      "cybersecurity analyst", "security engineer",
      "ui/ux designer", "product manager"
    ];
    for (const r of knownRoles) {
      if (lower.includes(r)) {
        return r.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      }
    }
    return "";
  }

  function extractStructuredResumeText(r) {
    const parts = [];
    if (r.name) parts.push(r.name);
    if (r.targetRole) parts.push(r.targetRole);
    if (r.summary) parts.push(r.summary);
    if (r.skills) parts.push(typeof r.skills === "string" ? r.skills : (Array.isArray(r.skills) ? r.skills.join(", ") : ""));
    if (r.experience && Array.isArray(r.experience)) {
      r.experience.forEach(exp => {
        if (exp.role) parts.push(exp.role);
        if (exp.company) parts.push(exp.company);
        if (exp.bullets) parts.push(Array.isArray(exp.bullets) ? exp.bullets.join(". ") : exp.bullets);
        if (exp.rawBullets) parts.push(exp.rawBullets);
      });
    }
    if (r.projects && Array.isArray(r.projects)) {
      r.projects.forEach(proj => {
        if (proj.title) parts.push(proj.title);
        if (proj.techStack) parts.push(proj.techStack);
        if (proj.overview) parts.push(proj.overview);
        if (proj.solution) parts.push(proj.solution);
        if (proj.bullets) parts.push(Array.isArray(proj.bullets) ? proj.bullets.join(". ") : proj.bullets);
      });
    }
    if (r.education && Array.isArray(r.education)) {
      r.education.forEach(edu => {
        if (edu.degree) parts.push(edu.degree);
        if (edu.institution) parts.push(edu.institution);
      });
    }
    return parts.join("\n\n") || JSON.stringify(r);
  }

  async function parseUploadedFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith(".txt") || name.endsWith(".json")) {
      return await file.text();
    }
    if (name.endsWith(".pdf")) {
      if (!window.pdfjsLib) throw new Error("PDF parser loading, please retry in a moment.");
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const tokenized = await page.getTextContent();
        const pageText = tokenized.items.map((item) => item.str).join(" ");
        fullText += pageText + "\n";
      }
      return fullText;
    }
    if (name.endsWith(".docx")) {
      if (!window.mammoth) throw new Error("DOCX parser loading, please retry in a moment.");
      const arrayBuffer = await file.arrayBuffer();
      const res = await window.mammoth.extractRawText({ arrayBuffer });
      return res.value;
    }
    return await file.text();
  }

  // 3. Scan & Analyze Engine (Strictly based on User Role, Company, and Resume)
  async function performScan() {
    const targetRole = scanRoleInput.value.trim();
    const selectedCompany = scanCompanySelect.value || "General";

    if (!targetRole) {
      showToast("Please enter your Target Job Role before scanning!", "error");
      scanRoleInput.focus();
      return;
    }

    if (!activeResumeText || activeResumeText.trim().length < 10) {
      showToast("Please upload your resume file or choose a saved resume first!", "error");
      return;
    }

    setButtonLoading(btnReScan, true);

    try {
      // 1. Fetch Dynamic Role Intelligence AND Company-Specific Intelligence
      const compIntel = getCompanyIntelligence(selectedCompany);
      const roleIntel = getRoleIntelligence(targetRole, selectedCompany) || {};
      const textLower = (activeResumeText || "").toLowerCase();

      atsTargetCompanyLbl.textContent = `${compIntel.companyName} ATS Benchmark · ${compIntel.keyDifferentiators}`;

      // 2. Company-Specific Required Skills vs Role Skills
      const companyRequiredSkills = compIntel.requiredKeywords || [];
      const companyCoreTech = compIntel.coreTechnologies || [];
      const allCompanyKeywords = Array.from(new Set([...companyRequiredSkills, ...companyCoreTech]));

      const roleRequiredSkills = [
        ...(Array.isArray(roleIntel.skillsToLearn) ? roleIntel.skillsToLearn : []),
        ...(Array.isArray(roleIntel.currentSkills) ? roleIntel.currentSkills : []),
        ...(Array.isArray(roleIntel.skillGaps) ? roleIntel.skillGaps.map(g => (typeof g === "string" ? g : (g?.skill || ""))) : [])
      ].filter(Boolean);

      // Evaluate Company-Specific Keyword Matches
      const matchedCompanyKeywords = [];
      const missingCompanyKeywords = [];
      allCompanyKeywords.forEach((ck) => {
        const query = ck.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
        const parts = query.split(/\s+/).filter(p => p.length >= 2);
        const match = textLower.includes(query) || (parts.length > 0 && parts.every(p => textLower.includes(p)));
        if (match) {
          if (!matchedCompanyKeywords.includes(ck)) matchedCompanyKeywords.push(ck);
        } else {
          if (!missingCompanyKeywords.includes(ck)) missingCompanyKeywords.push(ck);
        }
      });

      // Evaluate Role-Specific Keyword Matches
      const matchedRoleSkills = [];
      const missingRoleSkills = [];
      roleRequiredSkills.forEach((rk) => {
        const query = rk.toLowerCase().replace(/[^a-z0-9]/g, " ").trim();
        const parts = query.split(/\s+/).filter(p => p.length >= 2);
        const match = textLower.includes(query) || (parts.length > 0 && parts.every(p => textLower.includes(p)));
        if (match) {
          if (!matchedRoleSkills.includes(rk)) matchedRoleSkills.push(rk);
        } else {
          if (!missingRoleSkills.includes(rk)) missingRoleSkills.push(rk);
        }
      });

      // Combined Matched & Missing for UI
      const combinedMatched = Array.from(new Set([...matchedCompanyKeywords, ...matchedRoleSkills]));
      const combinedMissing = Array.from(new Set([...missingCompanyKeywords, ...missingRoleSkills]));

      // 3. Keyword Match Percentage (Differentiated by Company requirements)
      const companyMatchPct = Math.min(100, Math.round((matchedCompanyKeywords.length / Math.max(allCompanyKeywords.length, 1)) * 100));
      const roleMatchPct = Math.min(100, Math.round((matchedRoleSkills.length / Math.max(roleRequiredSkills.length, 1)) * 100));
      const kwMatchPercent = Math.min(100, Math.max(15, Math.round((companyMatchPct * 0.50) + (roleMatchPct * 0.50))));

      // 4. Metrics & Numbers Analysis specifically tested against Company Expectations
      const metricMatches = activeResumeText.match(/\b\d+(\.\d+)?%|\b\d+\s*(ms|s|sec|users|clients|x|k|m|projects|features|rps|qps|endpoints|bugs|hours|weeks|gb|mb|fps)\b/gi) || [];
      
      let companyMetricBonus = 0;
      if (compIntel.companyName === "Google") {
        // Google wants latency (ms, sub-), scale (k, m, users), or algorithmic Big-O
        if (/(\d+\s*ms|\blatency\b|\bqps\b|\brps\b|\bbig-o\b|\bconcurrency\b)/i.test(activeResumeText)) companyMetricBonus += 25;
        if (/\d+%/i.test(activeResumeText)) companyMetricBonus += 15;
      } else if (compIntel.companyName === "Amazon") {
        // Amazon wants availability, cost, users, cloud scale
        if (/(\b99\.9|\bavailability\b|\bcost\b|\baws\b|\bthroughput\b)/i.test(activeResumeText)) companyMetricBonus += 25;
        if (/\d+%/i.test(activeResumeText)) companyMetricBonus += 15;
      } else if (compIntel.companyName === "Meta") {
        // Meta wants render speed, bundle size, web vitals, engagement
        if (/(\bfps\b|\brender\b|\bvitals\b|\bbundle\b|\bengagement\b)/i.test(activeResumeText)) companyMetricBonus += 25;
        if (/\d+%/i.test(activeResumeText)) companyMetricBonus += 15;
      } else if (compIntel.companyName === "Apple") {
        // Apple wants memory (MB), launch speed, frame rates (60fps), crash rate
        if (/(\bfps\b|\bmemory\b|\bmb\b|\bcrash\b|\bsec\b)/i.test(activeResumeText)) companyMetricBonus += 25;
        if (/\d+%/i.test(activeResumeText)) companyMetricBonus += 15;
      } else if (compIntel.companyName === "TCS" || compIntel.companyName === "Infosys" || compIntel.companyName === "Wipro") {
        // Enterprise service companies want sprint deliverables, SLA compliance, defect reduction
        if (/(\bsprint\b|\bdefect\b|\bsla\b|\buptime\b|\bcoverage\b)/i.test(activeResumeText)) companyMetricBonus += 25;
        if (/\d+%/i.test(activeResumeText)) companyMetricBonus += 15;
      } else if (compIntel.companyName === "Early-Stage Startup") {
        // Startups want launch timeframe (weeks, days), user growth %
        if (/(\bweeks?\b|\bdays?\b|\bgrowth\b|\bmvp\b|\blaunched\b)/i.test(activeResumeText)) companyMetricBonus += 25;
        if (/\d+%/i.test(activeResumeText)) companyMetricBonus += 15;
      } else {
        if (metricMatches.length >= 2) companyMetricBonus += 25;
        if (/\d+%/i.test(activeResumeText)) companyMetricBonus += 15;
      }

      const baseMetricScore = Math.min(60, metricMatches.length * 15);
      const metricsScore = Math.min(96, Math.max(25, baseMetricScore + companyMetricBonus));

      // 5. Section Parsing & Structure Detection
      const detectedSections = [];
      if (/summary|about|profile/i.test(activeResumeText)) detectedSections.push("Summary");
      if (/skills|technologies|proficiencies|stack/i.test(activeResumeText)) detectedSections.push("Skills");
      if (/experience|employment|work|history/i.test(activeResumeText)) detectedSections.push("Experience");
      if (/projects|case\s*studies/i.test(activeResumeText)) detectedSections.push("Projects");
      if (/education|degree|university|college|academic/i.test(activeResumeText)) detectedSections.push("Education");
      if (/certifications|certs|credentials|awards/i.test(activeResumeText)) detectedSections.push("Certifications");

      const parseScore = Math.min(98, Math.max(35, Math.round((detectedSections.length / 6) * 100)));

      // 6. Clarity & Brevity Ratio
      const wordCount = activeResumeText.split(/\s+/).filter(Boolean).length;
      const clarityScore = wordCount >= 150 && wordCount <= 850 ? 92 : (wordCount > 850 ? 74 : 52);

      // 7. Overall ATS Compatibility Score with Company Strictness Factor
      const rawScore = (kwMatchPercent * 0.45) + (metricsScore * 0.25) + (parseScore * 0.15) + (clarityScore * 0.15);
      const adjustedScore = Math.round(rawScore / (compIntel.strictnessWeight || 1.0));
      const overallAtsScore = Math.min(98, Math.max(22, adjustedScore));

      // Render Score & Meter
      atsOverallVal.textContent = overallAtsScore;
      atsScoreCircle.style.setProperty("--score", overallAtsScore);
      
      const tierBadgeClass = overallAtsScore >= 80 ? "badge-emerald" : (overallAtsScore >= 60 ? "badge-amber" : "badge-rose");
      const tierBadgeText = overallAtsScore >= 80 ? "Competitive Tier" : (overallAtsScore >= 60 ? "Average Match" : "High Rejection Risk");
      atsTierBadge.textContent = tierBadgeText;
      atsTierBadge.className = `badge ${tierBadgeClass}`;

      // Progress bars
      scoreAtsParse.textContent = `${parseScore}%`; barAtsParse.style.width = `${parseScore}%`;
      scoreAtsMetrics.textContent = `${metricsScore}%`; barAtsMetrics.style.width = `${metricsScore}%`;
      scoreAtsKeywords.textContent = `${kwMatchPercent}%`; barAtsKeywords.style.width = `${kwMatchPercent}%`;
      scoreAtsClarity.textContent = `${clarityScore}%`; barAtsClarity.style.width = `${clarityScore}%`;

      // 8. Render Exact Real Strengths (Company Specific)
      const strengths = [];
      if (matchedCompanyKeywords.length > 0) {
        strengths.push(`Matches ${compIntel.companyName} core stack requirements: ${matchedCompanyKeywords.slice(0, 4).join(", ")}.`);
      }
      if (matchedRoleSkills.length > 0) {
        strengths.push(`Demonstrates ${matchedRoleSkills.length} required competencies for ${targetRole}.`);
      }
      if (companyMetricBonus > 0) {
        strengths.push(`Satisfies ${compIntel.companyName}'s impact metric standard (${compIntel.targetMetricTypes.slice(0, 3).join(", ")} indicators detected).`);
      }
      if (detectedSections.length >= 4) {
        strengths.push(`Standard ATS parsing layout verified with ${detectedSections.length} core sections.`);
      }
      const linkMatch = activeResumeText.match(/https?:\/\/[^\s]+|github\.com\/[^\s]+|linkedin\.com\/in\/[^\s]+/gi);
      if (linkMatch && linkMatch.length > 0) {
        strengths.push(`Includes direct links for technical review (${linkMatch[0]}).`);
      }
      if (strengths.length === 0) {
        strengths.push(`Parsed ${wordCount} words. Add ${compIntel.companyName} target keywords to increase score.`);
      }

      strengthsContainer.innerHTML = strengths.map((s) => `
        <div style="display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.85rem; color: var(--text-primary); background: rgba(16, 185, 129, 0.08); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-emerald);">
          <span style="color: var(--accent-emerald); font-weight: bold;">✓</span>
          <span>${escapeHtml(s)}</span>
        </div>
      `).join("");

      // 9. Render Exact Real Weaknesses for this Role & Specific Company
      const weaknesses = [];
      if (missingCompanyKeywords.length > 0) {
        weaknesses.push(`${compIntel.companyName} ATS flags missing company keywords: ${missingCompanyKeywords.slice(0, 4).join(", ")}.`);
      }
      if (missingRoleSkills.length > 0) {
        weaknesses.push(`Missing role capabilities for ${targetRole}: ${missingRoleSkills.slice(0, 3).join(", ")}.`);
      }
      if (companyMetricBonus === 0) {
        weaknesses.push(`Lacks ${compIntel.companyName}'s expected metric format (${compIntel.recommendedAction}).`);
      }
      if (!detectedSections.includes("Projects")) {
        weaknesses.push(`No dedicated "Projects" section found. ${compIntel.companyName} evaluates hands-on code examples heavily.`);
      }
      if (!textLower.includes("github") && !textLower.includes("portfolio")) {
        weaknesses.push(`No GitHub repository or live project demos found.`);
      }
      if (weaknesses.length === 0) {
        weaknesses.push(`High compatibility with ${compIntel.companyName} standard.`);
      }

      weaknessesContainer.innerHTML = weaknesses.map((w) => `
        <div style="display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.85rem; color: var(--text-primary); background: rgba(244, 63, 94, 0.08); padding: 0.6rem 0.8rem; border-radius: var(--radius-sm); border-left: 3px solid var(--accent-rose);">
          <span style="color: var(--accent-rose); font-weight: bold;">⚠️</span>
          <span>${escapeHtml(w)}</span>
        </div>
      `).join("");

      // 10. Render Matching Keywords
      matchingKeywordsContainer.innerHTML = combinedMatched.length > 0 ? combinedMatched.map((k) => `
        <span class="badge badge-emerald" style="font-size:0.75rem; padding:3px 8px;">✓ ${escapeHtml(k)}</span>
      `).join("") : `<p style="font-size:0.8rem; color:var(--text-muted);">No direct keyword matches found for ${escapeHtml(compIntel.companyName)}.</p>`;

      // 11. Render Missing Keywords
      missingKeywordsContainer.innerHTML = combinedMissing.length > 0 ? combinedMissing.map((k) => `
        <span class="badge badge-rose" style="font-size:0.75rem; padding:3px 8px;">+ ${escapeHtml(k)}</span>
      `).join("") : `<p style="font-size:0.8rem; color:var(--accent-emerald);">All primary target skills found in resume!</p>`;

      // 12. Render Structure Checklist
      const structureChecks = [
        { title: `${compIntel.companyName} Keyword Alignment`, status: companyMatchPct >= 60 ? "Pass" : "Action Required", desc: `Matched ${matchedCompanyKeywords.length}/${allCompanyKeywords.length} company-specific keywords (${companyMatchPct}% match).` },
        { title: `${targetRole} Skill Density`, status: roleMatchPct >= 60 ? "Pass" : "Action Required", desc: `Matched ${matchedRoleSkills.length}/${roleRequiredSkills.length} role requirements (${roleMatchPct}% match).` },
        { title: "Quantified Impact Ratio", status: metricsScore >= 65 ? "Pass" : "Action Required", desc: `${compIntel.recommendedAction}` }
      ];

      structureIssuesContainer.innerHTML = structureChecks.map((c) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
          <div>
            <strong style="color:var(--text-primary); font-size:0.9rem;">${escapeHtml(c.title)}</strong>
            <p style="font-size:0.75rem; color:var(--text-muted); margin:0.15rem 0 0;">${escapeHtml(c.desc)}</p>
          </div>
          <span class="badge ${c.status === "Pass" ? "badge-emerald" : "badge-rose"}">${escapeHtml(c.status)}</span>
        </div>
      `).join("");

      // 13. Extract Real Sentences from User Resume and Rewrite Tailored to THIS Specific Company
      const candidateSentences = extractSentencesFromResume(activeResumeText);
      const sampleSnippet1 = candidateSentences[0] || "Developed web features and fixed application issues.";
      const sampleSnippet2 = candidateSentences[1] || "Built a project using database and API endpoints.";

      const missingCompKeyword = missingCompanyKeywords[0] || (allCompanyKeywords[0] || "RESTful APIs");
      const missingRoleKeyword = missingRoleSkills[0] || (roleRequiredSkills[0] || "System Architecture");

      let tailoredRewrite1 = "";
      let tailoredRewrite2 = "";

      if (compIntel.companyName === "Google") {
        tailoredRewrite1 = `Architected core ${escapeHtml(targetRole)} service utilizing ${escapeHtml(missingCompKeyword)}, reducing algorithmic latency by 35% (sub-80ms) across 500K+ daily queries.`;
        tailoredRewrite2 = `Engineered concurrent distributed processing pipeline leveraging ${escapeHtml(missingRoleKeyword)} with 92% automated unit test coverage.`;
      } else if (compIntel.companyName === "Amazon") {
        tailoredRewrite1 = `Architected serverless ${escapeHtml(targetRole)} workflow utilizing ${escapeHtml(missingCompKeyword)}, achieving 99.99% high availability and cutting infrastructure costs by 28%.`;
        tailoredRewrite2 = `Built decoupled microservice pipeline implementing ${escapeHtml(missingRoleKeyword)}, accelerating deployment frequency to 4x per week.`;
      } else if (compIntel.companyName === "Meta") {
        tailoredRewrite1 = `Engineered high-performance ${escapeHtml(targetRole)} UI components using ${escapeHtml(missingCompKeyword)}, cutting bundle size by 32% and achieving sub-100ms render speeds.`;
        tailoredRewrite2 = `Optimized client-side state architecture with ${escapeHtml(missingRoleKeyword)}, improving core Web Vitals (LCP by 40%) for 100K+ active sessions.`;
      } else if (compIntel.companyName === "Apple") {
        tailoredRewrite1 = `Developed native ${escapeHtml(targetRole)} feature with ${escapeHtml(missingCompKeyword)}, maintaining consistent 60 FPS rendering and reducing memory footprint by 25MB.`;
        tailoredRewrite2 = `Implemented on-device security architecture with ${escapeHtml(missingRoleKeyword)}, ensuring strict privacy compliance and zero fatal crash reports.`;
      } else if (compIntel.companyName === "TCS" || compIntel.companyName === "Infosys") {
        tailoredRewrite1 = `Delivered enterprise ${escapeHtml(targetRole)} backend services utilizing ${escapeHtml(missingCompKeyword)}, completing 100% of sprint deliverables on time.`;
        tailoredRewrite2 = `Engineered relational SQL database schemas and REST APIs with ${escapeHtml(missingRoleKeyword)}, reducing defect rates by 30%.`;
      } else if (compIntel.companyName === "Early-Stage Startup") {
        tailoredRewrite1 = `Independently built and shipped full-stack ${escapeHtml(targetRole)} MVP in 3 weeks using ${escapeHtml(missingCompKeyword)}, onboarding 500+ initial users.`;
        tailoredRewrite2 = `Integrated rapid payment and data pipeline using ${escapeHtml(missingRoleKeyword)}, increasing conversion rates by 22%.`;
      } else {
        tailoredRewrite1 = `Architected and delivered ${escapeHtml(targetRole)} module implementing ${escapeHtml(missingCompKeyword)}, reducing processing latency by 32% and serving 500+ concurrent requests.`;
        tailoredRewrite2 = `Engineered a scalable full-stack system utilizing ${escapeHtml(missingRoleKeyword)}, achieving 99.9% uptime and accelerating data fetch speed by 40%.`;
      }

      const improvements = [
        {
          section: "Experience / Project Bullet 1",
          currentSnippet: sampleSnippet1,
          suggestedFix: tailoredRewrite1,
          rationale: `Directly satisfies ${compIntel.companyName}'s ATS filter by inserting '${missingCompKeyword}' and applying Google XYZ impact metrics.`
        },
        {
          section: "Technical Implementation Bullet 2",
          currentSnippet: sampleSnippet2,
          suggestedFix: tailoredRewrite2,
          rationale: `Integrates missing competency '${missingRoleKeyword}' to increase candidate ranking for ${targetRole} at ${compIntel.companyName}.`
        }
      ];

      lineByLineContainer.innerHTML = improvements.map((item, idx) => `
        <div style="background:var(--bg-surface-elevated); border:1px solid var(--border-glass); border-radius:var(--radius-md); padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <span class="badge badge-primary">${escapeHtml(item.section)}</span>
            <button class="btn btn-secondary btn-sm btn-copy-fix" data-idx="${idx}">Copy Fix</button>
          </div>

          <div style="background:rgba(244,63,94,0.06); border-left:3px solid var(--accent-rose); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); margin-bottom:0.6rem; font-size:0.85rem;">
            <span style="font-size:0.75rem; color:var(--accent-rose); font-weight:700; display:block; margin-bottom:0.2rem;">EXTRACTED FROM YOUR RESUME:</span>
            <span style="color:var(--text-secondary);">${escapeHtml(item.currentSnippet)}</span>
          </div>

          <div style="background:rgba(16,185,129,0.06); border-left:3px solid var(--accent-emerald); padding:0.6rem 0.85rem; border-radius:var(--radius-sm); margin-bottom:0.6rem; font-size:0.85rem;">
            <span style="font-size:0.75rem; color:var(--accent-emerald); font-weight:700; display:block; margin-bottom:0.2rem;">GOOGLE XYZ REWRITE FOR ${escapeHtml(compIntel.companyName).toUpperCase()}:</span>
            <span style="color:var(--text-primary); font-weight:600;" id="fix-text-${idx}">${escapeHtml(item.suggestedFix)}</span>
          </div>

          <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
            <strong>Improvement Rationale:</strong> ${escapeHtml(item.rationale)}
          </p>
        </div>
      `).join("");

      document.querySelectorAll(".btn-copy-fix").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const idx = e.currentTarget.dataset.idx;
          const fixText = document.getElementById(`fix-text-${idx}`)?.textContent || "";
          navigator.clipboard.writeText(fixText);
          showToast("Copied suggested fix to clipboard!", "success");
        });
      });

      showToast(`ATS score updated for ${compIntel.companyName} (${overallAtsScore}%)!`, "success");

    } catch (err) {
      console.error("ATS Scan Error:", err);
      showToast(err.message || "Failed to scan resume", "error");
    } finally {
      setButtonLoading(btnReScan, false);
    }
  }

  function extractSentencesFromResume(text) {
    if (!text) return [];
    // Split by bullet points, newlines, or sentence punctuation
    const lines = text
      .split(/[\r\n•\-\*]+/)
      .map(l => l.replace(/^[0-9]+[\.\)]\s*/, "").trim())
      .filter(l => l.length > 25 && l.length < 250);

    // Look for lines containing action verbs
    const actionLines = lines.filter(l => /\b(built|developed|created|implemented|designed|engineered|managed|worked|assisted|maintained|integrated|optimized|led|delivered)\b/i.test(l));
    if (actionLines.length >= 2) return actionLines.slice(0, 2);
    if (lines.length >= 2) return lines.slice(0, 2);
    return lines.length > 0 ? [lines[0]] : [];
  }

  btnReScan.addEventListener("click", performScan);
});
