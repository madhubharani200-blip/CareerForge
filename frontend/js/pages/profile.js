/**
 * STUDENT PROFILE MANAGEMENT CONTROLLER
 */

import { getCurrentUser, logOut, updateUserSession } from "../auth.js";
import { renderNavbar } from "../nav.js";
import { uploadUserFile } from "../storage.js";
import { db } from "../firebase-config.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { callBackendApi } from "../api/client.js";
import { showToast, setButtonLoading, openModal, closeModal, escapeHtml } from "../ui-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  // Render navigation bar
  renderNavbar("profile");

  // DOM Elements
  const avatarPreview = document.getElementById("profile-avatar-preview");
  const inputAvatarFile = document.getElementById("input-avatar-file");
  const btnChangeAvatar = document.getElementById("btn-change-avatar");
  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profileUid = document.getElementById("profile-uid");
  const profileHeadline = document.getElementById("profile-headline");
  const profileTargetRole = document.getElementById("profile-target-role");
  const profileExpLevel = document.getElementById("profile-experience-level");
  const profileInterests = document.getElementById("profile-interests");

  // Education Elements
  const eduInstitution = document.getElementById("edu-institution");
  const eduDegree = document.getElementById("edu-degree");
  const eduGradYear = document.getElementById("edu-grad-year");
  const eduGpa = document.getElementById("edu-gpa");

  // Skills Elements
  const inputNewSkill = document.getElementById("input-new-skill");
  const selectSkillLevel = document.getElementById("select-skill-level");
  const btnAddSkill = document.getElementById("btn-add-skill");
  const skillsContainer = document.getElementById("profile-skills-container");

  // Links
  const linkGithub = document.getElementById("link-github");
  const linkLinkedin = document.getElementById("link-linkedin");

  // Save & Delete
  const btnSaveProfile = document.getElementById("btn-save-profile");
  const btnOpenDeleteData = document.getElementById("btn-open-delete-data");
  const modalDelete = "modal-delete-confirm";
  const btnCloseDeleteModal = document.getElementById("btn-close-delete-modal");
  const btnCancelDelete = document.getElementById("btn-cancel-delete");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete-data");

  // State
  let skillsList = [];

  let currentAvatarUrl = user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || user.email || "User")}&backgroundColor=6366f1,3b82f6,06b6d4`;

  // 1. Load User Profile from LocalStorage / Firestore
  async function loadProfile() {
    profileEmail.value = user.email || "";
    profileName.value = user.displayName || "";
    if (profileUid) profileUid.value = user.uid || "Verified Account";
    avatarPreview.src = currentAvatarUrl;

    // Load from local storage cache first
    const cachedProfile = JSON.parse(localStorage.getItem(`user_profile_${user.uid}`) || localStorage.getItem("cf_user_profile") || "null");
    if (cachedProfile) {
      if (cachedProfile.displayName) profileName.value = cachedProfile.displayName;
      if (cachedProfile.headline) profileHeadline.value = cachedProfile.headline;
      if (cachedProfile.targetRole) profileTargetRole.value = cachedProfile.targetRole;
      if (cachedProfile.experienceLevel) profileExpLevel.value = cachedProfile.experienceLevel;
      if (cachedProfile.interests) profileInterests.value = cachedProfile.interests;
      if (cachedProfile.photoURL) {
        currentAvatarUrl = cachedProfile.photoURL;
        avatarPreview.src = currentAvatarUrl;
      }
      if (cachedProfile.education && cachedProfile.education[0]) {
        eduInstitution.value = cachedProfile.education[0].institution || "";
        eduDegree.value = cachedProfile.education[0].degree || "";
        eduGradYear.value = cachedProfile.education[0].gradYear || "";
        eduGpa.value = cachedProfile.education[0].gpa || "";
      }
      if (cachedProfile.skills && Array.isArray(cachedProfile.skills)) {
        skillsList = cachedProfile.skills;
      }
      if (cachedProfile.links) {
        linkGithub.value = cachedProfile.links.github || "";
        linkLinkedin.value = cachedProfile.links.linkedin || "";
      }
    }

    // Try Firestore in background without blocking
    try {
      if (db && user.uid) {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.displayName) profileName.value = data.displayName;
          if (data.headline) profileHeadline.value = data.headline;
          if (data.targetRole) profileTargetRole.value = data.targetRole;
          if (data.experienceLevel) profileExpLevel.value = data.experienceLevel;
          if (data.interests) profileInterests.value = data.interests;

          if (data.photoURL) {
            currentAvatarUrl = data.photoURL;
            avatarPreview.src = currentAvatarUrl;
          }

          if (data.education && data.education[0]) {
            eduInstitution.value = data.education[0].institution || eduInstitution.value;
            eduDegree.value = data.education[0].degree || eduDegree.value;
            eduGradYear.value = data.education[0].gradYear || eduGradYear.value;
            eduGpa.value = data.education[0].gpa || eduGpa.value;
          }

          if (data.skills && Array.isArray(data.skills)) {
            skillsList = data.skills;
          }

          if (data.links) {
            linkGithub.value = data.links.github || linkGithub.value;
            linkLinkedin.value = data.links.linkedin || linkLinkedin.value;
          }
        }
      }
    } catch (e) {
      console.warn("[Profile] Firestore read notice (using local storage):", e.message);
    }

    renderSkills();
  }

  // 2. Render Skills Tags
  function renderSkills() {
    if (skillsList.length === 0) {
      skillsContainer.innerHTML = `<span style="color:var(--text-muted); font-size:0.85rem;">No skills added yet. Add your technical competencies above.</span>`;
      return;
    }

    skillsContainer.innerHTML = skillsList.map((s, idx) => {
      const levelColors = {
        Beginner: "badge-amber",
        Intermediate: "badge-cyan",
        Advanced: "badge-primary",
        Expert: "badge-emerald"
      };
      const badgeClass = levelColors[s.level] || "badge-primary";

      return `
        <div style="display:inline-flex; align-items:center; gap:0.4rem; background:var(--bg-surface-elevated); border:1px solid var(--border-subtle); padding:0.35rem 0.65rem; border-radius:var(--radius-full); font-size:0.85rem;">
          <strong style="color:var(--text-primary);">${escapeHtml(s.name)}</strong>
          <span class="badge ${badgeClass}" style="font-size:0.65rem; padding:1px 5px;">${escapeHtml(s.level)}</span>
          <button type="button" class="btn-remove-skill" data-index="${idx}" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; line-height:1; padding:0 2px;">&times;</button>
        </div>
      `;
    }).join("");

    // Attach remove listeners
    document.querySelectorAll(".btn-remove-skill").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        skillsList.splice(idx, 1);
        renderSkills();
      });
    });
  }

  // 3. Add Skill Handler
  btnAddSkill.addEventListener("click", () => {
    const name = inputNewSkill.value.trim();
    if (!name) {
      showToast("Please enter a skill name.", "error");
      return;
    }

    if (skillsList.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      showToast("Skill already exists in your list.", "error");
      return;
    }

    skillsList.push({
      name,
      level: selectSkillLevel.value
    });

    inputNewSkill.value = "";
    renderSkills();
  });

  inputNewSkill.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      btnAddSkill.click();
    }
  });

  // 4. Photo Upload Handler
  btnChangeAvatar.addEventListener("click", () => inputAvatarFile.click());

  inputAvatarFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setButtonLoading(btnChangeAvatar, true);

    // Instant permanent Base64 Data URL reading
    const reader = new FileReader();
    reader.onload = async (evt) => {
      if (evt.target?.result) {
        currentAvatarUrl = evt.target.result;
        avatarPreview.src = currentAvatarUrl;

        // Immediately update session & local profile
        await updateUserSession({ photoURL: currentAvatarUrl });
        showToast("Profile picture updated! Click 'Save Profile Changes' to lock in.", "success");
      }
      setButtonLoading(btnChangeAvatar, false);
    };
    reader.readAsDataURL(file);

    // Optional Firebase Storage upload in background
    try {
      const uploadRes = await uploadUserFile(user.uid, file, "avatars");
      if (uploadRes?.url) {
        currentAvatarUrl = uploadRes.url;
        avatarPreview.src = currentAvatarUrl;
        await updateUserSession({ photoURL: currentAvatarUrl });
      }
    } catch (err) {
      console.warn("[Profile] Storage notice (using persistent Data URL):", err.message);
    }
  });

  // 5. Save Profile Handler
  btnSaveProfile.addEventListener("click", async () => {
    setButtonLoading(btnSaveProfile, true);

    const updatedProfile = {
      displayName: profileName.value.trim() || user.displayName || "User",
      headline: profileHeadline.value.trim(),
      targetRole: profileTargetRole.value.trim() || "Full Stack Software Engineer",
      experienceLevel: profileExpLevel.value,
      interests: profileInterests.value.trim(),
      photoURL: currentAvatarUrl,
      education: [
        {
          institution: eduInstitution.value.trim(),
          degree: eduDegree.value.trim(),
          gradYear: eduGradYear.value.trim(),
          gpa: eduGpa.value.trim()
        }
      ],
      skills: skillsList,
      links: {
        github: linkGithub.value.trim(),
        linkedin: linkLinkedin.value.trim()
      }
    };

    try {
      // 1. Permanently update local profile and active user session
      await updateUserSession(updatedProfile);
      localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(updatedProfile));

      // 2. Try Firestore in background
      if (db && user.uid) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          await setDoc(userDocRef, {
            ...updatedProfile,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (firestoreErr) {
          console.warn("[Profile] Firestore save notice (saved locally):", firestoreErr.message);
        }
      }

      // Re-render navbar to reflect updated avatar and name
      renderNavbar("profile");
      showToast("Profile & picture successfully saved!", "success");
    } catch (err) {
      console.error("Save error:", err);
      showToast("Error saving profile: " + err.message, "error");
    } finally {
      setButtonLoading(btnSaveProfile, false);
    }
  });

  // 6. Delete My Data Modal & Functionality (GDPR Compliance)
  btnOpenDeleteData.addEventListener("click", () => openModal(modalDelete));
  btnCloseDeleteModal.addEventListener("click", () => closeModal(modalDelete));
  btnCancelDelete.addEventListener("click", () => closeModal(modalDelete));

  btnConfirmDelete.addEventListener("click", async () => {
    setButtonLoading(btnConfirmDelete, true);
    try {
      await callBackendApi("user/delete-my-data", { uid: user.uid });
      showToast("All your account data has been permanently deleted.", "info");
      setTimeout(() => {
        logOut();
      }, 1000);
    } catch (err) {
      showToast("Deletion error: " + err.message, "error");
      setButtonLoading(btnConfirmDelete, false);
    }
  });

  // Initial Load
  await loadProfile();
});
