/**
 * CareerMatch AI: Analyzer Feature Module
 * Single authoritative controller for #view-analyzer.
 * Manages file drag & drop, text paste, role selection, validation, and full analysis dispatch.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class AnalyzerModule {
  constructor() {
    this.initialized = false;
    this.inFlight = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // File input & dropzone
    const fileInput = document.getElementById("resumeFileInput");
    const dropzone = document.getElementById("resumeDropzone");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer?.files?.length) {
          this.handleFileUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files?.length) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // Pasted text parse button
    const parsePasteBtn = document.getElementById("parsePastedResumeBtn");
    if (parsePasteBtn) {
      parsePasteBtn.addEventListener("click", () => this.handlePastedText());
    }

    // Role selector change
    const roleSelect = document.getElementById("targetRoleSelect");
    const customRoleContainer = document.getElementById("customRoleGroup");
    const customRoleInput = document.getElementById("customRoleInput");

    if (roleSelect) {
      roleSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "Other") {
          if (customRoleContainer) customRoleContainer.classList.remove("hidden");
          if (customRoleInput) {
            customRoleInput.focus();
            store.set("targetRole", customRoleInput.value.trim() || "Software Engineer");
          }
        } else {
          if (customRoleContainer) customRoleContainer.classList.add("hidden");
          store.set("targetRole", val);
        }
      });
    }

    if (customRoleInput) {
      customRoleInput.addEventListener("input", (e) => {
        store.set("targetRole", e.target.value.trim() || "Software Engineer");
      });
    }

    // Run Analysis Button
    const runBtn = document.getElementById("runAnalysisBtn");
    if (runBtn) {
      runBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.runAnalysis(true);
      });
    }

    // Don't save checkbox
    const dontSaveCheck = document.getElementById("dontSaveCheckbox");
    if (dontSaveCheck) {
      dontSaveCheck.addEventListener("change", (e) => {
        store.set("dontSaveResume", Boolean(e.target.checked));
      });
    }

    // Subscribe to store changes
    store.subscribe("activeResume", (resume) => {
      this.render(resume);
    });
  }

  load() {
    const resume = store.get("activeResume");
    if (resume) {
      this.render(resume);
    }
  }

  render(resume = null) {
    const currentResume = resume || store.get("activeResume");
    if (!currentResume) return;

    const nameEl = document.getElementById("parsedCandidateName");
    if (nameEl) nameEl.textContent = currentResume.contact?.name || "Candidate Profile";

    const degreeEl = document.getElementById("parsedResumeDegree");
    const edu = currentResume.education?.[0];
    const degreeText = edu
      ? `${edu.degree || "Degree"} · ${edu.institution || "Institution"}`
      : currentResume.summary || "Resume Profile";
    if (degreeEl) degreeEl.textContent = degreeText;

    const container = document.getElementById("parsedSkillsPreview");
    if (container) {
      const skills = currentResume.technicalSkills || [];
      if (skills.length === 0) {
        container.innerHTML = `<span style="color:var(--text-tertiary);font-size:0.8rem;">No technical skills detected yet.</span>`;
      } else {
        container.innerHTML = skills
          .map((s) => `<span class="tag tag-match">${escapeHtml(s)}</span>`)
          .join("");
      }
    }
  }

  async handleFileUpload(file) {
    if (!file) return;

    // Client-side validation: file type & size
    const validExtensions = [".pdf", ".docx", ".txt"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      this.showError(`Invalid file format "${ext}". Please upload a PDF, DOCX, or plain text (.txt) file.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showError("File size exceeds 10 MB limit. Please upload a smaller document.");
      return;
    }

    const statusEl = document.getElementById("uploadStatusText");
    if (statusEl) statusEl.textContent = `Parsing ${file.name}...`;
    this.hideError();

    try {
      const base64Data = await this._readFileAsDataURL(file);
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers,
        body: JSON.stringify({
          filename: file.name,
          base64Data,
          dontSave: Boolean(store.get("dontSaveResume")),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to parse file.");

      store.set("activeResume", data.resume);
      if (statusEl) statusEl.textContent = `Parsed: ${file.name}`;
      this.render(data.resume);
    } catch (err) {
      if (statusEl) statusEl.textContent = "Click to upload or drag & drop (PDF, DOCX, TXT)";
      this.showError(err.message);
    }
  }

  async handlePastedText() {
    const textEl = document.getElementById("pastedResumeInput");
    const raw = textEl ? textEl.value.trim() : "";
    if (raw.length < 20) {
      this.showError("Please paste at least 20 characters of resume text to extract skills.");
      return;
    }
    this.hideError();

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers,
        body: JSON.stringify({
          filename: "Pasted_Resume.txt",
          pastedText: raw,
          dontSave: Boolean(store.get("dontSaveResume")),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to parse pasted text.");

      store.set("activeResume", data.resume);
      this.render(data.resume);
    } catch (err) {
      this.showError(err.message);
    }
  }

  async runAnalysis(navigateOnSuccess = true) {
    if (this.inFlight) return;
    const resume = store.get("activeResume");
    if (!resume) {
      this.showError("Please upload or paste a resume before running the analysis.");
      return;
    }

    const roleSelect = document.getElementById("targetRoleSelect");
    let targetRole = roleSelect?.value || store.get("targetRole") || "Full Stack Developer";
    if (targetRole === "Other") {
      const customInput = document.getElementById("customRoleInput");
      targetRole = customInput?.value.trim() || "Software Engineer";
    }

    const goalCompany = document.getElementById("goalCompanyInput")?.value.trim() || "";
    const customJd = document.getElementById("customJdInput")?.value.trim() || "";

    const runBtn = document.getElementById("runAnalysisBtn");
    const originalText = runBtn ? runBtn.textContent : "Analyze Resume";
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.textContent = "Generating career report...";
    }
    this.inFlight = true;
    this.hideError();

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resume,
          roleTitle: targetRole,
          goalCompany,
          customJdText: customJd,
          dontSave: Boolean(store.get("dontSaveResume")),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis generation failed.");

      store.set("analysisResult", data);
      store.set("targetRole", targetRole);
      store.set("goalCompany", goalCompany);

      if (navigateOnSuccess) {
        window.location.hash = "#/report";
      }
    } catch (err) {
      this.showError(err.message);
    } finally {
      this.inFlight = false;
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.textContent = originalText;
      }
    }
  }

  showError(msg) {
    const banner = document.getElementById("analyzerErrorBanner");
    if (banner) {
      banner.textContent = msg;
      banner.classList.remove("hidden");
    } else {
      alert(msg);
    }
  }

  hideError() {
    const banner = document.getElementById("analyzerErrorBanner");
    if (banner) banner.classList.add("hidden");
  }

  _readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Unable to read local file."));
      reader.readAsDataURL(file);
    });
  }
}

export const analyzerModule = new AnalyzerModule();
