/**
 * PUBLIC PORTFOLIO CONTROLLER (Unauthenticated / Public Read-Only)
 */

import { getCurrentUser } from "../auth.js";
import { getPublicPortfolio, saveContactInquiry } from "../api/portfolio-api.js";
import { showToast, escapeHtml } from "../ui-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  let currentUser = null;
  try {
    currentUser = getCurrentUser();
  } catch (e) {}

  const targetUid = urlParams.get("u") || currentUser?.uid || "demo_user";
  const targetToken = urlParams.get("d");

  // DOM Elements
  const pubAvatar = document.getElementById("pub-avatar");
  const pubName = document.getElementById("pub-name");
  const pubHeadline = document.getElementById("pub-headline");
  const pubContactInfo = document.getElementById("pub-contact-info");
  const pubHeroTitle = document.getElementById("pub-hero-title");
  const pubAboutText = document.getElementById("pub-about-text");
  const pubLinkGithub = document.getElementById("pub-link-github");
  const pubLinkLinkedin = document.getElementById("pub-link-linkedin");
  const pubLinkEmail = document.getElementById("pub-link-email");
  const pubSkillsTags = document.getElementById("pub-skills-tags");
  const pubCertsContainer = document.getElementById("pub-certs-container");
  const pubProjectsList = document.getElementById("pub-projects-list");
  const pubExperienceContainer = document.getElementById("pub-experience-container");
  const pubAchievementsContainer = document.getElementById("pub-achievements-container");
  const pubEducationContainer = document.getElementById("pub-education-container");
  const btnShare = document.getElementById("btn-share-portfolio");

  // Recruiter Highlights Elements
  const pubHighlightsCard = document.getElementById("pub-highlights-card");
  const pubPhilosophyBox = document.getElementById("pub-philosophy-box");
  const pubPhilosophyText = document.getElementById("pub-philosophy-text");
  const pubLearningBox = document.getElementById("pub-learning-box");
  const pubLearningText = document.getElementById("pub-learning-text");
  const pubAvailDomainsBox = document.getElementById("pub-avail-domains-box");
  const pubAvailabilityText = document.getElementById("pub-availability-text");
  const pubDomainsText = document.getElementById("pub-domains-text");
  const pubTestimonialBox = document.getElementById("pub-testimonial-box");
  const pubTestimonialText = document.getElementById("pub-testimonial-text");
  const pubPublicationsBox = document.getElementById("pub-publications-box");
  const pubPublicationsText = document.getElementById("pub-publications-text");

  // Contact Candidate Modal Elements
  const modalContactCandidate = document.getElementById("modal-contact-candidate");
  const contactModalTitle = document.getElementById("contact-modal-title");
  const btnCloseContactModal = document.getElementById("btn-close-contact-modal");
  const btnCancelContactModal = document.getElementById("btn-cancel-contact-modal");
  const formContactCandidate = document.getElementById("form-contact-candidate");
  const contactSenderName = document.getElementById("contact-sender-name");
  const contactSenderEmail = document.getElementById("contact-sender-email");
  const contactSenderPhone = document.getElementById("contact-sender-phone");
  const contactSenderCompany = document.getElementById("contact-sender-company");
  const contactOpportunityRole = document.getElementById("contact-opportunity-role");
  const contactMessage = document.getElementById("contact-message");
  const contactFormStatus = document.getElementById("contact-form-status");
  const btnSubmitContactInquiry = document.getElementById("btn-submit-contact-inquiry");
  const contactDirectMailtoLink = document.getElementById("contact-direct-mailto-link");

  // Helper: Safe Split (Array / String / Object Resilient)
  function safeSplit(val, delimiter = "\n") {
    if (!val) return [];
    if (Array.isArray(val)) return val.map((v) => (typeof v === "object" ? (v.name || v.title || JSON.stringify(v)) : String(v)));
    if (typeof val === "string") return val.split(delimiter).map((s) => s.trim()).filter(Boolean);
    return [String(val)];
  }

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

  // Share button handler
  if (btnShare) {
    btnShare.addEventListener("click", () => {
      if (navigator.share) {
        navigator.share({
          title: `${pubName?.textContent || "Candidate"} — Developer Portfolio`,
          url: window.location.href
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast("Universal portfolio link copied to clipboard!", "success");
      }
    });
  }

  // Load Data
  try {
    const portfolio = await getPublicPortfolio(targetUid, targetToken);
    const template = portfolio?.template || "modern-dev";
    document.body.className = `portfolio-theme-${template}`;

    // Read cached profile info if available
    let cachedProf = {};
    try {
      cachedProf = JSON.parse(localStorage.getItem(`user_profile_${targetUid}`) || localStorage.getItem("cf_user_profile") || "{}");
    } catch {}

    // Resolve real user display name without generic fallback
    const resolvedName = portfolio?.name || portfolio?.displayName || cachedProf.displayName || currentUser?.displayName || (currentUser?.email ? currentUser.email.split("@")[0] : "") || "Candidate Portfolio";
    const resolvedEmail = portfolio?.email || cachedProf.email || currentUser?.email || "";
    const resolvedHeadline = portfolio?.heroTitle || cachedProf.headline || "Full Stack Software Engineer";
    const resolvedAbout = portfolio?.aboutMe || "Passionate engineer dedicated to building clean, high-performance web applications and scalable solutions.";
    const resolvedPhoto = portfolio?.photoURL || cachedProf.photoURL || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUid}`;

    const candidate = {
      displayName: resolvedName,
      email: resolvedEmail,
      phone: portfolio?.phone || cachedProf.phone || "",
      location: portfolio?.location || cachedProf.location || "",
      linkedin: portfolio?.linkedin || cachedProf.links?.linkedin || "",
      github: portfolio?.github || cachedProf.links?.github || "",
      photoURL: resolvedPhoto,
      headline: resolvedHeadline,
      aboutMe: resolvedAbout,
      skills: portfolio?.skills || cachedProf.skills || "JavaScript, TypeScript, React, Node.js, Python, Firebase, Git, REST APIs",
      certifications: portfolio?.certifications || "",
      achievements: portfolio?.achievements || "",
      experience: portfolio?.experience || "",
      education: portfolio?.education || "",
      philosophy: portfolio?.philosophy || "",
      learning: portfolio?.learning || "",
      availability: portfolio?.availability || "",
      domains: portfolio?.domains || "",
      testimonial: portfolio?.testimonial || "",
      publications: portfolio?.publications || "",
      projects: Array.isArray(portfolio?.projects) && portfolio.projects.length > 0 ? portfolio.projects : [
        {
          title: "Flagship Technical Project",
          overview: "A modern, high-performance web platform built with modular architecture and cloud data services.",
          techStack: "JavaScript, Firebase, CSS3",
          solution: "Architected modular client-side state and optimized cloud queries.",
          demoUrl: `${window.location.origin}/index.html`,
          githubUrl: ""
        }
      ]
    };

    // Hydrate Hero & Details
    if (pubName) pubName.textContent = candidate.displayName;
    document.title = `${candidate.displayName} — Portfolio`;

    if (pubAvatar) {
      pubAvatar.src = candidate.photoURL;
      pubAvatar.onerror = () => {
        pubAvatar.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${targetUid}`;
      };
    }

    if (pubHeadline) pubHeadline.textContent = candidate.headline;
    if (pubContactInfo) {
      pubContactInfo.textContent = [candidate.location, candidate.email, candidate.phone].filter(Boolean).join(" · ") || "Verified Candidate";
    }
    if (pubHeroTitle) pubHeroTitle.textContent = candidate.headline;
    if (pubAboutText) pubAboutText.textContent = candidate.aboutMe;

    // External Links
    if (pubLinkGithub) {
      pubLinkGithub.href = formatExternalUrl(candidate.github, "github");
      pubLinkGithub.style.display = "inline-flex";
    }
    if (pubLinkLinkedin) {
      pubLinkLinkedin.href = formatExternalUrl(candidate.linkedin, "linkedin");
      pubLinkLinkedin.style.display = "inline-flex";
    }

    // Hydrate Skills
    if (pubSkillsTags) {
      const skillsList = safeSplit(candidate.skills, ",");
      pubSkillsTags.innerHTML = skillsList.map((s) => `
        <span style="background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); padding:0.35rem 0.75rem; border-radius:var(--radius-full); font-size:0.85rem; color:var(--text-primary); font-weight:500;">
          ${escapeHtml(s)}
        </span>
      `).join("");
    }

    // Hydrate Certifications
    if (pubCertsContainer) {
      const certsList = safeSplit(candidate.certifications, "\n");
      if (certsList.length === 0) {
        pubCertsContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; margin:0;">Verified Industry Credentials & Certificates</p>`;
      } else {
        pubCertsContainer.innerHTML = certsList.map((line) => {
          const linkMatch = line.match(/\[(.*?)\]/);
          const url = linkMatch ? formatExternalUrl(linkMatch[1]) : null;
          const cleanText = line.replace(/\[.*?\]/, "").trim();

          return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
              <span style="color:var(--text-primary); font-size:0.9rem;">📜 ${escapeHtml(cleanText)}</span>
              ${url ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:2px 8px;">Verify ↗</a>` : ""}
            </div>
          `;
        }).join("");
      }
    }

    // Hydrate Projects & Case Studies
    if (pubProjectsList) {
      pubProjectsList.innerHTML = candidate.projects.map((proj, idx) => {
        const techArr = safeSplit(proj.techStack, ",");
        return `
          <div class="card card-glass" style="padding:1.75rem; border:1px solid var(--border-glass);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span class="badge badge-cyan" style="margin-bottom:0.35rem;">Case Study #${idx + 1}</span>
                <h3 style="font-size:1.3rem; color:var(--text-primary);">${escapeHtml(proj.title || "Project")}</h3>
              </div>
              <div style="display:flex; gap:0.5rem;">
                ${proj.githubUrl ? `<a href="${escapeHtml(formatExternalUrl(proj.githubUrl, "github"))}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">GitHub ↗</a>` : ""}
                ${proj.demoUrl ? `<a href="${escapeHtml(formatExternalUrl(proj.demoUrl, "website"))}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Live Demo ↗</a>` : ""}
              </div>
            </div>

            <p style="font-size:0.9rem; color:var(--text-secondary); line-height:1.6; margin-bottom:1rem;">
              ${escapeHtml(proj.overview || "")}
            </p>

            ${proj.solution ? `
              <div style="background:var(--bg-surface-elevated); padding:1rem; border-radius:var(--radius-md); font-size:0.85rem; margin-bottom:1rem; border-left:3px solid var(--primary-light);">
                <strong style="color:var(--text-primary);">Architecture & Implementation:</strong>
                <p style="color:var(--text-secondary); margin:0.25rem 0 0; line-height:1.5;">${escapeHtml(proj.solution)}</p>
              </div>
            ` : ""}

            <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
              ${techArr.map((t) => `
                <span style="background:rgba(99,102,241,0.12); color:var(--primary-light); border:1px solid rgba(99,102,241,0.25); padding:0.2rem 0.5rem; border-radius:var(--radius-sm); font-size:0.75rem; font-weight:600;">
                  ${escapeHtml(t)}
                </span>
              `).join("")}
            </div>
          </div>
        `;
      }).join("");
    }

    // Hydrate Experience
    if (pubExperienceContainer) {
      const expList = safeSplit(candidate.experience, "\n");
      pubExperienceContainer.innerHTML = expList.length > 0
        ? expList.map((l) => `<p style="margin:0.25rem 0;">${escapeHtml(l)}</p>`).join("")
        : `<p style="color:var(--text-muted); font-size:0.85rem; margin:0;">Professional Software Engineering & Technical Experience</p>`;
    }

    // Hydrate Achievements
    if (pubAchievementsContainer) {
      const achList = safeSplit(candidate.achievements, "\n");
      pubAchievementsContainer.innerHTML = achList.length > 0
        ? achList.map((ach) => `
            <div style="background:var(--bg-surface-elevated); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); font-size:0.875rem;">
              🏆 ${escapeHtml(ach)}
            </div>
          `).join("")
        : `<p style="color:var(--text-muted); font-size:0.85rem; margin:0;">Key Milestones & Technical Achievements</p>`;
    }

    // Hydrate Recruiter Highlights
    let hasHighlights = false;
    if (candidate.philosophy && pubPhilosophyBox && pubPhilosophyText) {
      pubPhilosophyText.textContent = candidate.philosophy;
      pubPhilosophyBox.style.display = "block";
      hasHighlights = true;
    }
    if (candidate.learning && pubLearningBox && pubLearningText) {
      pubLearningText.textContent = candidate.learning;
      pubLearningBox.style.display = "block";
      hasHighlights = true;
    }
    if ((candidate.availability || candidate.domains) && pubAvailDomainsBox) {
      if (candidate.availability && pubAvailabilityText) pubAvailabilityText.textContent = candidate.availability;
      if (candidate.domains && pubDomainsText) pubDomainsText.textContent = candidate.domains;
      pubAvailDomainsBox.style.display = "grid";
      hasHighlights = true;
    }
    if (candidate.testimonial && pubTestimonialBox && pubTestimonialText) {
      pubTestimonialText.textContent = candidate.testimonial;
      pubTestimonialBox.style.display = "block";
      hasHighlights = true;
    }
    if (candidate.publications && pubPublicationsBox && pubPublicationsText) {
      pubPublicationsText.textContent = candidate.publications;
      pubPublicationsBox.style.display = "block";
      hasHighlights = true;
    }
    if (hasHighlights && pubHighlightsCard) {
      pubHighlightsCard.style.display = "block";
    }

    // Hydrate Education
    if (pubEducationContainer) {
      const eduList = safeSplit(candidate.education, "\n");
      pubEducationContainer.innerHTML = eduList.length > 0
        ? eduList.map((l) => `<p style="margin:0.25rem 0;">${escapeHtml(l)}</p>`).join("")
        : `<p style="color:var(--text-muted); font-size:0.85rem; margin:0;">Degree & Academic Background</p>`;
    }

    // =========================================================================
    // CONTACT CANDIDATE MODAL CONTROLLER & FIREBASE INQUIRY SYNC
    // =========================================================================
    function openContactModal() {
      if (contactModalTitle) {
        contactModalTitle.textContent = `Get in Touch with ${candidate.displayName || "Candidate"}`;
      }
      if (contactDirectMailtoLink) {
        contactDirectMailtoLink.href = candidate.email ? `mailto:${candidate.email}?subject=Opportunity%20Inquiry%20via%20CareerForge` : "#";
      }
      if (contactFormStatus) {
        contactFormStatus.style.display = "none";
        contactFormStatus.innerHTML = "";
      }
      if (modalContactCandidate) {
        modalContactCandidate.classList.add("active");
        modalContactCandidate.style.display = "flex";
      }
    }

    function closeContactModal() {
      if (modalContactCandidate) {
        modalContactCandidate.classList.remove("active");
        modalContactCandidate.style.display = "none";
      }
    }

    if (pubLinkEmail) {
      pubLinkEmail.addEventListener("click", (e) => {
        e.preventDefault();
        openContactModal();
      });
    }

    if (btnCloseContactModal) {
      btnCloseContactModal.addEventListener("click", closeContactModal);
    }
    if (btnCancelContactModal) {
      btnCancelContactModal.addEventListener("click", closeContactModal);
    }

    if (modalContactCandidate) {
      modalContactCandidate.addEventListener("click", (e) => {
        if (e.target === modalContactCandidate) {
          closeContactModal();
        }
      });
    }

    if (formContactCandidate) {
      formContactCandidate.addEventListener("submit", async (e) => {
        e.preventDefault();

        const senderName = contactSenderName?.value.trim();
        const senderEmail = contactSenderEmail?.value.trim();
        const senderPhone = contactSenderPhone?.value.trim();
        const company = contactSenderCompany?.value.trim();
        const role = contactOpportunityRole ? contactOpportunityRole.value.trim() : "";
        const message = contactMessage?.value.trim();

        if (!senderName || !senderEmail || !senderPhone || !company || !message) {
          showToast("Please fill in all required fields marked with *", "error");
          return;
        }

        try {
          if (btnSubmitContactInquiry) {
            btnSubmitContactInquiry.disabled = true;
            btnSubmitContactInquiry.innerHTML = "<span>Sending Inquiry... ⏳</span>";
          }

          // Save to Firebase Firestore and local cache
          await saveContactInquiry(targetUid, {
            senderName,
            senderEmail,
            senderPhone,
            company,
            role,
            message,
            candidateName: candidate.displayName,
            candidateEmail: candidate.email
          });

          if (contactFormStatus) {
            contactFormStatus.style.display = "block";
            contactFormStatus.style.background = "rgba(16, 185, 129, 0.12)";
            contactFormStatus.style.border = "1px solid var(--accent-emerald)";
            contactFormStatus.style.color = "var(--accent-emerald)";
            contactFormStatus.innerHTML = `
              <div style="font-weight:600; margin-bottom:0.25rem;">✓ Inquiry Sent to ${escapeHtml(candidate.displayName)}!</div>
              <div style="font-size:0.8rem; color:var(--text-secondary);">
                Your message has been delivered. The candidate can review your opportunity and contact you back at <strong>${escapeHtml(senderEmail)}</strong> or <strong>${escapeHtml(senderPhone)}</strong>.
              </div>
            `;
          }

          showToast(`Inquiry sent to ${candidate.displayName}!`, "success");
          formContactCandidate.reset();

          setTimeout(() => {
            closeContactModal();
          }, 3500);

        } catch (submitErr) {
          console.error("Error submitting contact inquiry:", submitErr);
          showToast("Could not send inquiry. Please try again or use direct email.", "error");
        } finally {
          if (btnSubmitContactInquiry) {
            btnSubmitContactInquiry.disabled = false;
            btnSubmitContactInquiry.innerHTML = "<span>Send Message 🚀</span>";
          }
        }
      });
    }

  } catch (err) {
    console.error("Public portfolio loading error:", err);
  }
});
