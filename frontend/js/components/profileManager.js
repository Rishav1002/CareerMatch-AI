/**
 * CareerMatch AI: Student Profile Manager (Section 13 G)
 * Renders glass card per section in exact order:
 * 1. Basics, 2. Target Role, 3. Skills, 4. Experience, 5. Education, 6. Projects, 7. Certifications.
 * Supports inline add/edit/delete with undo toast, 0-100% completeness meter, and "Import from resume".
 */

import { storage } from "../storage.js";
import { store } from "../store.js";
import { fmt } from "../formatters.js";

export class ProfileManager {
  constructor() {
    this.profile = {
      basics: { name: "", email: "", phone: "", location: "" },
      targetRole: { primaryRole: "", companies: "", targetCtc: "" },
      skills: { technical: [], soft: [] },
      experience: [],
      education: [],
      projects: [],
      certifications: [],
    };
    this.undoStack = [];
  }

  init() {
    this.loadInitialData();
    this.attachEventListeners();
    this.render();
  }

  loadInitialData() {
    const saved = store.get("profile");
    if (saved && typeof saved === "object") {
      this.profile = { ...this.profile, ...saved };
    }
  }

  attachEventListeners() {
    // Save All button
    document.getElementById("profSaveAllBtn")?.addEventListener("click", () => this.saveProfile(true));

    // Import from resume button
    document.getElementById("profImportResumeBtn")?.addEventListener("click", () => this.importFromActiveResume());

    // Add Skill
    const addSkillBtn = document.getElementById("profAddSkillBtn");
    const addSkillInput = document.getElementById("profAddSkillInput");
    if (addSkillBtn && addSkillInput) {
      const handleAdd = () => {
        const val = addSkillInput.value.trim();
        if (val) {
          if (!this.profile.skills.technical.includes(val)) {
            this.profile.skills.technical.push(val);
            this.renderSkills();
            this.updateCompleteness();
            addSkillInput.value = "";
          }
        }
      };
      addSkillBtn.addEventListener("click", handleAdd);
      addSkillInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleAdd();
        }
      });
    }

    // Add Entry buttons
    document.getElementById("profAddExpBtn")?.addEventListener("click", () => this.addExperienceEntry());
    document.getElementById("profAddEduBtn")?.addEventListener("click", () => this.addEducationEntry());
    document.getElementById("profAddProjBtn")?.addEventListener("click", () => this.addProjectEntry());
    document.getElementById("profAddCertBtn")?.addEventListener("click", () => this.addCertEntry());

    // Inputs change synchronization
    const syncInputs = [
      { id: "profFullName", path: ["basics", "name"] },
      { id: "profEmail", path: ["basics", "email"] },
      { id: "profPhone", path: ["basics", "phone"] },
      { id: "profLocation", path: ["basics", "location"] },
      { id: "profTargetRole", path: ["targetRole", "primaryRole"] },
      { id: "profCompanies", path: ["targetRole", "companies"] },
      { id: "profTargetCtc", path: ["targetRole", "targetCtc"] },
    ];

    syncInputs.forEach(({ id, path }) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", (e) => {
          this.profile[path[0]][path[1]] = e.target.value;
          this.updateCompleteness();
        });
      }
    });
  }

  render() {
    // Populate form values
    const basics = this.profile.basics || {};
    const tr = this.profile.targetRole || {};

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };

    setVal("profFullName", basics.name);
    setVal("profEmail", basics.email);
    setVal("profPhone", basics.phone);
    setVal("profLocation", basics.location);
    setVal("profTargetRole", tr.primaryRole);
    setVal("profCompanies", tr.companies);
    setVal("profTargetCtc", tr.targetCtc);

    this.renderSkills();
    this.renderExperience();
    this.renderEducation();
    this.renderProjects();
    this.renderCerts();
    this.updateCompleteness();
  }

  renderSkills() {
    const techBox = document.getElementById("profTechnicalSkillsContainer");
    const softBox = document.getElementById("profSoftSkillsContainer");
    const countBadge = document.getElementById("profSkillCountBadge");

    const tech = this.profile.skills?.technical || [];
    const soft = this.profile.skills?.soft || [];

    if (countBadge) {
      countBadge.textContent = `${tech.length + soft.length} Verified Skills`;
    }

    if (techBox) {
      techBox.innerHTML = tech
        .map(
          (s, idx) => `
          <span class="status-badge" style="background: var(--glass-bg-subtle); display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--r-sm);">
            <span>${fmt.escape(s)}</span>
            <button type="button" class="del-chip-btn" data-del-tech="${idx}" style="background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 0; line-height: 1;" title="Remove skill">&times;</button>
          </span>
        `
        )
        .join("");

      techBox.querySelectorAll("[data-del-tech]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-del-tech"), 10);
          const removed = this.profile.skills.technical.splice(idx, 1)[0];
          this.pushUndo("Skill Removed", () => {
            this.profile.skills.technical.splice(idx, 0, removed);
            this.renderSkills();
            this.updateCompleteness();
          });
          this.renderSkills();
          this.updateCompleteness();
        });
      });
    }

    if (softBox) {
      softBox.innerHTML = soft
        .map(
          (s, idx) => `
          <span class="status-badge" style="background: var(--glass-bg-subtle); display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: var(--r-sm);">
            <span>${fmt.escape(s)}</span>
            <button type="button" class="del-chip-btn" data-del-soft="${idx}" style="background: none; border: none; cursor: pointer; color: var(--text-tertiary); padding: 0; line-height: 1;" title="Remove skill">&times;</button>
          </span>
        `
        )
        .join("");

      softBox.querySelectorAll("[data-del-soft]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.getAttribute("data-del-soft"), 10);
          const removed = this.profile.skills.soft.splice(idx, 1)[0];
          this.pushUndo("Skill Removed", () => {
            this.profile.skills.soft.splice(idx, 0, removed);
            this.renderSkills();
            this.updateCompleteness();
          });
          this.renderSkills();
          this.updateCompleteness();
        });
      });
    }
  }

  renderExperience() {
    const list = document.getElementById("profExperienceList");
    if (!list) return;
    const items = this.profile.experience || [];
    if (!items.length) {
      list.innerHTML = `<div style="font-size: 0.84rem; color: var(--text-tertiary); padding: 8px 0;">No experience entries added yet. Click "+ Add Entry" or import from your resume.</div>`;
      return;
    }

    list.innerHTML = items
      .map(
        (exp, i) => `
        <div class="card glass-card" style="padding: 14px 16px; border-radius: var(--r-sm); position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong style="font-size: 0.95rem; color: var(--text-primary);">${fmt.escape(exp.role || "Software Role")}</strong>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
                ${fmt.escape(exp.company || "")} ${exp.duration ? `· ${fmt.escape(exp.duration)}` : ""}
              </div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" data-del-exp="${i}" style="color: var(--score-low); font-size: 0.75rem; padding: 2px 6px;">Delete</button>
          </div>
          ${exp.highlights && exp.highlights.length ? `<ul style="margin: 8px 0 0; padding-left: 18px; font-size: 0.82rem; color: var(--text-secondary);">${exp.highlights.map((h) => `<li>${fmt.escape(h)}</li>`).join("")}</ul>` : ""}
        </div>
      `
      )
      .join("");

    list.querySelectorAll("[data-del-exp]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-del-exp"), 10);
        const removed = this.profile.experience.splice(idx, 1)[0];
        this.pushUndo("Experience Entry Removed", () => {
          this.profile.experience.splice(idx, 0, removed);
          this.renderExperience();
          this.updateCompleteness();
        });
        this.renderExperience();
        this.updateCompleteness();
      });
    });
  }

  renderEducation() {
    const list = document.getElementById("profEducationList");
    if (!list) return;
    const items = this.profile.education || [];
    if (!items.length) {
      list.innerHTML = `<div style="font-size: 0.84rem; color: var(--text-tertiary); padding: 8px 0;">No education credentials added yet.</div>`;
      return;
    }

    list.innerHTML = items
      .map(
        (edu, i) => `
        <div class="card glass-card" style="padding: 12px 16px; border-radius: var(--r-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary);">${fmt.escape(edu.degree || "B.Tech")}</strong>
              <div style="font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px;">
                ${fmt.escape(edu.institution || "")} ${edu.year ? `· Class of ${fmt.escape(edu.year)}` : ""}
              </div>
            </div>
            <button type="button" class="btn btn-ghost btn-sm" data-del-edu="${i}" style="color: var(--score-low); font-size: 0.75rem; padding: 2px 6px;">Delete</button>
          </div>
        </div>
      `
      )
      .join("");

    list.querySelectorAll("[data-del-edu]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-del-edu"), 10);
        const removed = this.profile.education.splice(idx, 1)[0];
        this.pushUndo("Education Entry Removed", () => {
          this.profile.education.splice(idx, 0, removed);
          this.renderEducation();
          this.updateCompleteness();
        });
        this.renderEducation();
        this.updateCompleteness();
      });
    });
  }

  renderProjects() {
    const list = document.getElementById("profProjectsList");
    if (!list) return;
    const items = this.profile.projects || [];
    if (!items.length) {
      list.innerHTML = `<div style="font-size: 0.84rem; color: var(--text-tertiary); padding: 8px 0;">No projects added yet.</div>`;
      return;
    }

    list.innerHTML = items
      .map(
        (proj, i) => `
        <div class="card glass-card" style="padding: 14px 16px; border-radius: var(--r-sm);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <strong style="font-size: 0.92rem; color: var(--text-primary);">${fmt.escape(proj.title || "Project")}</strong>
              <p style="margin: 4px 0 6px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">${fmt.escape(proj.description || "")}</p>
              ${proj.techStack && proj.techStack.length ? `<div style="display: flex; gap: 4px; flex-wrap: wrap;">${proj.techStack.map((t) => `<span class="status-badge" style="font-size: 0.72rem; padding: 1px 6px;">${fmt.escape(t)}</span>`).join("")}</div>` : ""}
            </div>
            <button type="button" class="btn btn-ghost btn-sm" data-del-proj="${i}" style="color: var(--score-low); font-size: 0.75rem; padding: 2px 6px;">Delete</button>
          </div>
        </div>
      `
      )
      .join("");

    list.querySelectorAll("[data-del-proj]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-del-proj"), 10);
        const removed = this.profile.projects.splice(idx, 1)[0];
        this.pushUndo("Project Removed", () => {
          this.profile.projects.splice(idx, 0, removed);
          this.renderProjects();
          this.updateCompleteness();
        });
        this.renderProjects();
        this.updateCompleteness();
      });
    });
  }

  renderCerts() {
    const list = document.getElementById("profCertsList");
    if (!list) return;
    const items = this.profile.certifications || [];
    if (!items.length) {
      list.innerHTML = `<div style="font-size: 0.84rem; color: var(--text-tertiary); padding: 8px 0;">No certificates added yet.</div>`;
      return;
    }

    list.innerHTML = items
      .map(
        (cert, i) => `
        <div class="card glass-card" style="padding: 10px 14px; border-radius: var(--r-sm); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 0.86rem; color: var(--text-primary);">${fmt.escape(typeof cert === "string" ? cert : cert.title)}</span>
          <button type="button" class="btn btn-ghost btn-sm" data-del-cert="${i}" style="color: var(--score-low); font-size: 0.75rem; padding: 2px 6px;">Delete</button>
        </div>
      `
      )
      .join("");

    list.querySelectorAll("[data-del-cert]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-del-cert"), 10);
        const removed = this.profile.certifications.splice(idx, 1)[0];
        this.pushUndo("Certificate Removed", () => {
          this.profile.certifications.splice(idx, 0, removed);
          this.renderCerts();
          this.updateCompleteness();
        });
        this.renderCerts();
        this.updateCompleteness();
      });
    });
  }

  addExperienceEntry() {
    const role = prompt("Enter Role / Title (e.g. Backend Intern):");
    if (!role) return;
    const company = prompt("Enter Company / Organization:") || "";
    this.profile.experience.unshift({ role, company, duration: "Recent", highlights: [] });
    this.renderExperience();
    this.updateCompleteness();
  }

  addEducationEntry() {
    const degree = prompt("Enter Degree (e.g. B.Tech Computer Science):");
    if (!degree) return;
    const institution = prompt("Enter College / University:") || "";
    this.profile.education.unshift({ degree, institution, year: "2026" });
    this.renderEducation();
    this.updateCompleteness();
  }

  addProjectEntry() {
    const title = prompt("Enter Project Title:");
    if (!title) return;
    const desc = prompt("Enter Brief Description:") || "";
    this.profile.projects.unshift({ title, description: desc, techStack: [] });
    this.renderProjects();
    this.updateCompleteness();
  }

  addCertEntry() {
    const title = prompt("Enter Certification Title:");
    if (!title) return;
    this.profile.certifications.unshift(title);
    this.renderCerts();
    this.updateCompleteness();
  }

  updateCompleteness() {
    let score = 0;
    const b = this.profile.basics || {};
    if (b.name) score += 10;
    if (b.email) score += 10;
    if (this.profile.targetRole?.primaryRole) score += 15;
    if ((this.profile.skills?.technical || []).length >= 3) score += 20;
    if ((this.profile.experience || []).length >= 1) score += 15;
    if ((this.profile.education || []).length >= 1) score += 15;
    if ((this.profile.projects || []).length >= 1) score += 15;

    const pct = Math.min(100, score);
    const bar = document.getElementById("profCompletenessBar");
    const txt = document.getElementById("profCompletenessPct");
    if (bar) bar.style.width = `${pct}%`;
    if (txt) txt.textContent = `${pct}%`;
  }

  importFromActiveResume() {
    const activeResume = store.get("activeResume") || (window.getAppState ? window.getAppState().activeResume : null);
    if (!activeResume) {
      alert("No active resume parsed yet. Upload a resume in Analyzer first.");
      return;
    }

    if (activeResume.contact || activeResume.basics) {
      const c = activeResume.basics || activeResume.contact || {};
      this.profile.basics = {
        name: c.name || this.profile.basics.name,
        email: c.email || this.profile.basics.email,
        phone: c.phone || this.profile.basics.phone,
        location: c.location || this.profile.basics.location,
      };
    }

    if (activeResume.technicalSkills) {
      this.profile.skills.technical = Array.from(new Set([...this.profile.skills.technical, ...activeResume.technicalSkills]));
    }
    if (activeResume.softSkills) {
      this.profile.skills.soft = Array.from(new Set([...this.profile.skills.soft, ...activeResume.softSkills]));
    }
    if (activeResume.workExperience && activeResume.workExperience.length) {
      this.profile.experience = activeResume.workExperience;
    }
    if (activeResume.education && activeResume.education.length) {
      this.profile.education = activeResume.education;
    }
    if (activeResume.projects && activeResume.projects.length) {
      this.profile.projects = activeResume.projects;
    }
    if (activeResume.certifications && activeResume.certifications.length) {
      this.profile.certifications = activeResume.certifications;
    }

    this.render();
    if (window.showToast) window.showToast("Imported credentials from active resume!");
  }

  pushUndo(message, undoFn) {
    this.undoStack.push(undoFn);
    const container = document.getElementById("toastContainer");
    if (container) {
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.style.display = "flex";
      toast.style.justifyContent = "space-between";
      toast.style.alignItems = "center";
      toast.style.gap = "12px";
      toast.innerHTML = `
        <span>${fmt.escape(message)}</span>
        <button type="button" class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 0.75rem;">Undo</button>
      `;
      const undoBtn = toast.querySelector("button");
      undoBtn.addEventListener("click", () => {
        undoFn();
        toast.remove();
      });
      container.appendChild(toast);
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 5000);
    }
  }

  async saveProfile(showNotif = true) {
    store.set("profile", this.profile);
    storage.setGuest("profile", this.profile);

    const token = store.get("token") || localStorage.getItem("cm_jwt_token");
    if (token) {
      try {
        await fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: this.profile.basics.name,
            email: this.profile.basics.email,
            targetRole: this.profile.targetRole.primaryRole,
            targetCompanies: this.profile.targetRole.companies,
          }),
        });
      } catch (e) {
        console.warn("Could not sync profile to backend:", e);
      }
    }

    if (showNotif && window.showToast) {
      window.showToast("Student profile saved and synced across workspaces");
    }
  }
}

export const profileManager = new ProfileManager();
