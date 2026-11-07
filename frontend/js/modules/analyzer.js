/**
 * CareerMatch AI: Analyzer Feature Module
 * Single authoritative controller for #view-analyzer.
 * Manages synchronous file chooser, drag & drop, text paste, role selection,
 * client-side file validation (size <= 5MB, type, empty check), and manual "Run Match Analysis".
 * 
 * Complies with Bug 1 (accessible synchronous file picker) and Bug 6 (upload does NOT auto-analyze).
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export class AnalyzerModule {
  constructor() {
    this.initialized = false;
    this.inFlight = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const fileInput = document.getElementById("resumeFileInput");
    const dropzone = document.getElementById("uploadDropZone") || document.getElementById("resumeDropzone");
    const chooseBtn = document.getElementById("chooseFileBtn");
    const removeBtn = document.getElementById("removeFileBtn");

    // Bug 1: Synchronous user-gesture file picker trigger
    if (chooseBtn && fileInput) {
      chooseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", (e) => {
        // Do not double-trigger if clicking the choose button or remove action
        if (e.target.closest("#chooseFileBtn") || e.target.closest("#removeFileBtn")) return;
        fileInput.click();
      });

      dropzone.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fileInput.click();
        }
      });

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
    }

    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        if (e.target.files?.length) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.clearResume();
      });
    }

    // Pasted text parse button
    const parsePasteBtn = document.getElementById("parseTextBtn") || document.getElementById("parsePastedResumeBtn");
    if (parsePasteBtn) {
      parsePasteBtn.addEventListener("click", () => this.handlePastedText());
    }

    // Role selector change
    const roleSelect = document.getElementById("targetRoleSelect");
    const customRoleContainer = document.getElementById("customRoleInputContainer") || document.getElementById("customRoleGroup");
    const customRoleInput = document.getElementById("customRoleInput");

    if (roleSelect) {
      roleSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "Other") {
          if (customRoleContainer) customRoleContainer.classList.remove("hidden");
          if (customRoleInput) {
            customRoleInput.focus();
            store.set("targetRole", customRoleInput.value.trim() || "");
          }
        } else {
          if (customRoleContainer) customRoleContainer.classList.add("hidden");
          store.set("targetRole", val);
        }
        this.updateRunButtonState();
      });
    }

    if (customRoleInput) {
      customRoleInput.addEventListener("input", (e) => {
        store.set("targetRole", e.target.value.trim());
        this.updateRunButtonState();
      });
    }

    // Run Match Analysis Button (Bug 6: only explicit user click triggers match analysis)
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
      this.updateRunButtonState();
    });

    this.updateRunButtonState();
  }

  load() {
    const resume = store.get("activeResume");
    if (resume) {
      this.render(resume);
    }
    this.updateRunButtonState();
  }

  updateRunButtonState() {
    const runBtn = document.getElementById("runAnalysisBtn");
    if (!runBtn) return;

    const hasResume = Boolean(store.get("activeResume"));
    const roleSelect = document.getElementById("targetRoleSelect");
    const customRoleInput = document.getElementById("customRoleInput");

    let hasRole = false;
    if (roleSelect) {
      if (roleSelect.value === "Other") {
        hasRole = Boolean(customRoleInput?.value.trim().length >= 2);
      } else {
        hasRole = Boolean(roleSelect.value && roleSelect.value !== "Select role...");
      }
    }

    runBtn.disabled = !(hasResume && hasRole && !this.inFlight);
  }

  clearResume() {
    const fileInput = document.getElementById("resumeFileInput");
    if (fileInput) fileInput.value = "";

    const banner = document.getElementById("selectedFileBanner");
    if (banner) banner.classList.add("hidden");

    const statusEl = document.getElementById("uploadStatusText");
    if (statusEl) statusEl.textContent = "";

    const metaBox = document.getElementById("parsedResumeMeta");
    if (metaBox) metaBox.classList.add("hidden");

    const pastedInput = document.getElementById("pastedResumeInput");
    if (pastedInput) pastedInput.value = "";

    store.set("activeResume", null);
    this.hideError();
    this.updateRunButtonState();
  }

  render(resume = null) {
    const currentResume = resume || store.get("activeResume");
    const metaBox = document.getElementById("parsedResumeMeta");

    if (!currentResume) {
      if (metaBox) metaBox.classList.add("hidden");
      return;
    }

    if (metaBox) metaBox.classList.remove("hidden");

    const nameEl = document.getElementById("parsedCandidateName");
    if (nameEl) {
      nameEl.textContent = currentResume.contact?.name || "Parsed Candidate Profile";
    }

    const degreeEl = document.getElementById("parsedResumeDegree");
    const edu = currentResume.education?.[0];
    const degreeText = edu
      ? `${edu.degree || "Degree"} · ${edu.institution || "Institution"}`
      : currentResume.summary || "Technical Profile";
    if (degreeEl) degreeEl.textContent = degreeText;

    const badgeCountEl = document.getElementById("parsedSkillsCountBadge");
    const skills = currentResume.technicalSkills || currentResume.skills || [];
    if (badgeCountEl) {
      badgeCountEl.textContent = `${skills.length} Skills Detected`;
    }

    const container = document.getElementById("parsedSkillBadges") || document.getElementById("parsedSkillsPreview");
    if (container) {
      if (skills.length === 0) {
        container.innerHTML = `<span class="text-tertiary text-xs">No technical skills detected yet.</span>`;
      } else {
        container.innerHTML = skills
          .slice(0, 15)
          .map((s) => `<span class="score-pill score-pill-green">${escapeHtml(s)}</span>`)
          .join("");
        if (skills.length > 15) {
          container.innerHTML += `<span class="score-pill score-pill-neutral">+${skills.length - 15} more</span>`;
        }
      }
    }
  }

  async handleFileUpload(file) {
    if (!file) return;

    // Client-side validation: empty file check
    if (file.size === 0) {
      this.showError("The selected file is empty (0 bytes). Please choose a valid resume file.");
      return;
    }

    // Client-side validation: file type & size (5 MB limit)
    const validExtensions = [".pdf", ".docx", ".txt"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!validExtensions.includes(ext)) {
      this.showError(`Invalid file format "${ext}". Please upload a PDF, DOCX, or plain text (.txt) file.`);
      return;
    }

    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      this.showError(`File size (${formatBytes(file.size)}) exceeds the 5 MB limit. Please upload a smaller document.`);
      return;
    }

    // Show file details banner
    const selectedBanner = document.getElementById("selectedFileBanner");
    const nameEl = document.getElementById("selectedFileName");
    const sizeEl = document.getElementById("selectedFileSize");
    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatBytes(file.size);
    if (selectedBanner) selectedBanner.classList.remove("hidden");

    const statusEl = document.getElementById("uploadStatusText");
    if (statusEl) statusEl.textContent = `Parsing ${file.name}...`;
    this.hideError();

    try {
      const base64Data = await this._readFileAsDataURL(file);
      const dontSave = Boolean(store.get("dontSaveResume"));

      const data = await api.post("/api/resume/parse", {
        filename: file.name,
        base64Data,
        dontSave,
      });

      if (!data || !data.resume) {
        throw new Error("Server returned empty parse result.");
      }

      store.set("activeResume", data.resume);
      if (statusEl) statusEl.textContent = `Parsed successfully: ${file.name}`;
      this.render(data.resume);
      this.updateRunButtonState();
      // Bug 6 verification: Do NOT call runAnalysis here!
    } catch (err) {
      if (statusEl) statusEl.textContent = "Upload failed. Please try again.";
      this.showError(err.message || "Failed to parse resume document.");
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

    const statusEl = document.getElementById("uploadStatusText");
    if (statusEl) statusEl.textContent = "Parsing pasted text...";

    try {
      const dontSave = Boolean(store.get("dontSaveResume"));
      const data = await api.post("/api/resume/parse", {
        filename: "Pasted_Resume.txt",
        pastedText: raw,
        dontSave,
      });

      if (!data || !data.resume) {
        throw new Error("Server returned empty parse result.");
      }

      store.set("activeResume", data.resume);
      if (statusEl) statusEl.textContent = "Parsed pasted text successfully.";
      this.render(data.resume);
      this.updateRunButtonState();
      // Bug 6 verification: Do NOT call runAnalysis here!
    } catch (err) {
      if (statusEl) statusEl.textContent = "";
      this.showError(err.message || "Failed to parse pasted resume text.");
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
    let targetRole = roleSelect?.value || store.get("targetRole") || "";
    if (targetRole === "Other") {
      const customInput = document.getElementById("customRoleInput");
      targetRole = customInput?.value.trim() || "";
    }

    if (!targetRole || targetRole === "Select role...") {
      this.showError("Please select or enter your Target Role to benchmark your resume.");
      return;
    }

    const goalCompany = document.getElementById("goalCompanyInput")?.value.trim() || "";
    const customJd = document.getElementById("customJdInput")?.value.trim() || "";
    const dontSave = Boolean(store.get("dontSaveResume"));

    const runBtn = document.getElementById("runAnalysisBtn");
    const progressBox = document.getElementById("analysisProgressBox");
    const originalText = runBtn ? runBtn.textContent : "Run Match Analysis";

    if (runBtn) {
      runBtn.disabled = true;
      runBtn.textContent = "Evaluating match report...";
    }
    if (progressBox) progressBox.classList.remove("hidden");

    this.inFlight = true;
    this.hideError();

    try {
      const data = await api.post("/api/analyze", {
        resume,
        roleTitle: targetRole,
        goalCompany,
        customJdText: customJd,
        dontSave,
      });

      if (!data || !data.matchResult) {
        throw new Error("Analysis generation failed or returned invalid format.");
      }

      store.set("analysisResult", data);
      store.set("targetRole", targetRole);
      store.set("goalCompany", goalCompany);

      if (navigateOnSuccess) {
        window.location.hash = "#/report";
      }
    } catch (err) {
      this.showError(err.message || "Match analysis generation failed.");
    } finally {
      this.inFlight = false;
      if (runBtn) {
        runBtn.textContent = originalText;
      }
      if (progressBox) progressBox.classList.add("hidden");
      this.updateRunButtonState();
    }
  }

  showError(msg) {
    const banner = document.getElementById("analyzerErrorBanner");
    if (banner) {
      banner.textContent = msg;
      banner.classList.remove("hidden");
    } else {
      console.warn("Analyzer error:", msg);
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
