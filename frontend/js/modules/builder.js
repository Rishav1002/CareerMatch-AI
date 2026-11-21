/**
 * CareerMatch AI: AI Resume Builder & Template Studio Module
 * Comprehensive controller for #view-builder:
 * - 10 Bespoke, publication-grade resume templates (Editorial Serif, Classic Executive, Corporate Accent,
 *   Clean Minimalist, Swiss Modern, Executive Slate, Editorial Warmth, Timeline Studio, Emerald Sidebar, ATS Compact Pro)
 * - Resume upload (PDF/DOCX/TXT) & parsing
 * - Seamless Analyzer-to-Builder auto-sync with notification banner (#builderSyncBanner)
 * - Create from scratch & load Indian demo profiles (Fresher, SDE, Data Scientist)
 * - Multi-section profile editor with full CRUD, Move Up / Move Down reordering
 * - Per-template theme customization (Accent swatches + native color picker + reset for color templates;
 *   monochrome badge for classic ATS templates)
 * - Headshot photo management with client-side canvas resize
 * - Responsive sliding template carousel + categorized grid gallery with filter tabs
 * - Live A4 preview with zoom (fit/100%/85%/70%) and page break indicators
 * - Pixel-perfect A4 PDF export via hidden print frame awaiting document.fonts.ready
 * - Profile sync to logged-in user account
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";
import {
  RESUME_TEMPLATES,
  ACCENT_SWATCHES,
  LEGACY_TEMPLATE_MAP,
  PAGE_H,
  getTemplate,
  renderResume,
  SAMPLE_PROFILE,
} from "./resumeTemplates.js";
import { TemplateCarousel } from "../components/templateCarousel.js";


function cleanParsedText(val) {
  if (!val) return "";
  const s = String(val)
    .replace(/[\u2022\u25aa\u25a0\u25cf\u25c6\u27a2\u2756\u25ba\u25b8\u25e6\uf0b7\uf0a7\uf0d8\uf076\x00-\x08\x0b\x0c\x0e-\x1f]+/g, " ")
    .replace(/[-_=~—–*#]{3,}/g, " ")
    .replace(/^[\s•·\-–—|:=_*]+|[\s•·\-–—|:=_*]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  const alnum = (s.match(/[a-zA-Z0-9]/g) || []).length;
  return alnum >= 2 ? s : "";
}

function cleanProfileObject(profile) {
  if (!profile || typeof profile !== "object") return profile;
  if (profile.summary) profile.summary = cleanParsedText(profile.summary);
  if (Array.isArray(profile.workExperience)) {
    profile.workExperience = profile.workExperience
      .map((e) => ({
        ...e,
        role: cleanParsedText(e.role || e.title || ""),
        company: cleanParsedText(e.company || ""),
        description: cleanParsedText(e.description || ""),
        highlights: Array.isArray(e.highlights) ? e.highlights.map(cleanParsedText).filter(Boolean) : [],
      }))
      .filter((e) => e.role || e.company || e.highlights.length);
  }
  if (Array.isArray(profile.education)) {
    profile.education = profile.education
      .map((ed) => ({
        ...ed,
        degree: cleanParsedText(ed.degree || ""),
        institution: cleanParsedText(ed.institution || ""),
      }))
      .filter((ed) => ed.degree || ed.institution);
  }
  if (Array.isArray(profile.projects)) {
    profile.projects = profile.projects
      .map((p) => ({
        ...p,
        title: cleanParsedText(p.title || p.name || ""),
        description: cleanParsedText(p.description || ""),
        bullets: Array.isArray(p.bullets) ? p.bullets.map(cleanParsedText).filter(Boolean) : [],
      }))
      .filter((p) => p.title || p.description || p.bullets.length);
  }
  if (Array.isArray(profile.certifications)) {
    profile.certifications = profile.certifications
      .map((c) => (typeof c === "string" ? cleanParsedText(c) : { ...c, name: cleanParsedText(c.name || c.title || "") }))
      .filter((c) => (typeof c === "string" ? Boolean(c) : Boolean(c.name)));
  }
  if (Array.isArray(profile.achievements)) {
    profile.achievements = profile.achievements.map(cleanParsedText).filter(Boolean);
  }
  return profile;
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export class ResumeBuilderModule {
  constructor() {
    this.initialized = false;
    this.inFlight = false;
    this.selectedTemplate = "editorial_serif";
    this.accent = null; // null = template default accent colour
    this.zoomMode = "fit";
    this.carousels = {};
    this.activeEditorTab = "personal";
    this.activeFilter = "all";
    this.hasUserEdits = false;
    this.lastSyncedResumeId = null;
    this.renderTimer = null;
    this.templates = RESUME_TEMPLATES;
    this.sampleProfiles = {};

    this.profile = this.createEmptyProfile();
  }

  createEmptyProfile() {
    return {
      personalInfo: {
        full_name: "",
        headline: "",
        photo: "",
        photo_data_url: "",
        email: "",
        phone: "",
        city: "",
        location: "",
        address: "",
        dob: "",
        nationality: "",
        linkedin: "",
        github: "",
        portfolio: "",
      },
      summary: "",
      education: [],
      workExperience: [],
      projects: [],
      technicalSkills: [],
      languages: [],
      certifications: [],
      achievements: [],
      references: [],
      hobbies: "",
      additionalInfo: {
        languages_known: [],
        research_interests: [],
        publications: [],
        extracurriculars: [],
      },
    };
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.bindUploadEvents();
    this.bindSyncBanner();
    this.bindEditorTabs();
    this.mountGalleries();
    this.bindActionButtons();
    this.bindThemeControls();
    this.bindPhotoUpload();
    this.bindConfirmationModal();

    this.selectTemplate(this.selectedTemplate);
    this.loadCatalogData();
  }

  load() {
    // Check if store has an analyzed resume from analyzer
    const activeResume = store.get("activeResume");
    if (activeResume) {
      const activeId = activeResume.id || activeResume.filename || activeResume.candidate_name || "analyzed_resume";
      if (!this.hasUserEdits && (!this.profile.personalInfo.full_name || this.profile.personalInfo.full_name === "Candidate")) {
        this.populateFromParsedResume(activeResume);
        this.lastSyncedResumeId = activeId;
      } else if (this.lastSyncedResumeId !== activeId) {
        this.showSyncBanner(activeResume);
      }
    }

    this.render();
    requestAnimationFrame(() => {
      Object.values(this.carousels).forEach((c) => c?.layout?.(false));
      this.fitPreview();
      this.fitTemplateGridCards();
    });
  }

  async loadCatalogData() {
    try {
      const sampleRes = await api.get("/api/builder/sample-profiles");
      if (sampleRes?.profiles) {
        this.sampleProfiles = sampleRes.profiles;
      }
    } catch (e) {
      console.warn("Could not load sample profiles from backend:", e);
    }
  }

  // ------------------------------------------------------------------
  // Upload, Import & Sync Handling
  // ------------------------------------------------------------------
  bindUploadEvents() {
    const fileInput = document.getElementById("builderFileInput");
    const dropzone = document.getElementById("builderUploadDropzone");
    const chooseBtn = document.getElementById("builderChooseFileBtn");

    if (chooseBtn && fileInput) {
      chooseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        fileInput.click();
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", (e) => {
        if (e.target.closest("#builderChooseFileBtn") || e.target.closest("button")) return;
        fileInput.click();
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

    const pasteBtn = document.getElementById("builderParsePasteBtn");
    if (pasteBtn) {
      pasteBtn.addEventListener("click", () => this.handlePastedText());
    }

    const scratchBtn = document.getElementById("builderStartScratchBtn");
    if (scratchBtn) {
      scratchBtn.addEventListener("click", () => this.startFromScratch());
    }

    const landingScratchBtn = document.getElementById("builderLandingScratchBtn");
    if (landingScratchBtn) {
      landingScratchBtn.addEventListener("click", () => this.startFromScratch());
    }

    // Dropdown toggle button
    const demoDropdownBtn = document.getElementById("builderLoadDemoDropdownBtn");
    const demoDropdownMenu = document.getElementById("builderLoadDemoDropdownMenu");
    if (demoDropdownBtn && demoDropdownMenu) {
      demoDropdownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        demoDropdownMenu.classList.toggle("hidden");
      });
      document.addEventListener("click", (e) => {
        if (!e.target.closest(".dropdown-wrapper")) {
          demoDropdownMenu.classList.add("hidden");
        }
      });
    }

    // Sample Profile Buttons (dropdown + landing cards)
    const wireDemo = (btnId, key) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener("click", () => {
          if (demoDropdownMenu) demoDropdownMenu.classList.add("hidden");
          this.loadSampleProfile(key);
        });
      }
    };

    wireDemo("builderLoadFresherBtn", "fresher");
    wireDemo("builderLandingFresherBtn", "fresher");
    wireDemo("builderLoadSdeBtn", "software_engineer");
    wireDemo("builderLandingSdeBtn", "software_engineer");
    wireDemo("builderLoadDsBtn", "data_scientist");
    wireDemo("builderLandingDsBtn", "data_scientist");
  }

  bindSyncBanner() {
    const banner = document.getElementById("builderSyncBanner");
    const syncBtn = document.getElementById("builderSyncResumeBtn");
    const dismissBtn = document.getElementById("builderDismissSyncBtn");

    if (syncBtn) {
      syncBtn.addEventListener("click", () => {
        const activeResume = store.get("activeResume");
        if (activeResume) {
          this.populateFromParsedResume(activeResume);
          this.hasUserEdits = false;
          this.lastSyncedResumeId = activeResume.id || activeResume.filename || activeResume.candidate_name || "synced";
          this.showToast("Resume details synced into Builder!", "success");
        }
        if (banner) banner.classList.add("hidden");
      });
    }

    if (dismissBtn && banner) {
      dismissBtn.addEventListener("click", () => {
        banner.classList.add("hidden");
      });
    }
  }

  showSyncBanner(activeResume) {
    const banner = document.getElementById("builderSyncBanner");
    const textEl = document.getElementById("builderSyncBannerText");
    if (!banner) return;
    const name = activeResume.candidate_name || activeResume.filename || "Recent Analysis";
    if (textEl) {
      textEl.textContent = `A newly analyzed resume ("${name}") is available. Sync into builder?`;
    }
    banner.classList.remove("hidden");
  }

  async handleFileUpload(file) {
    if (!file) return;

    if (file.size === 0) {
      this.showToast("Selected file is empty (0 bytes).", "warning");
      return;
    }

    const validExtensions = [".pdf", ".docx", ".txt"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!validExtensions.includes(ext)) {
      this.showToast(`Invalid file format "${ext}". Please upload PDF, DOCX, or TXT.`, "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast(`File size (${formatBytes(file.size)}) exceeds the 5 MB limit.`, "warning");
      return;
    }

    this.showExtractionLoader(true, `Extracting resume information from ${file.name}...`);

    try {
      const base64Data = await this._readFileAsDataURL(file);
      const res = await api.post("/api/builder/parse", {
        filename: file.name,
        base64Data,
        templateId: this.selectedTemplate,
      });

      if (!res?.profile) {
        throw new Error("Server returned an empty profile extraction.");
      }

      this.populateFromParsedResume(res.profile);
      this.hasUserEdits = true;
      this.showToast(`Extracted resume details from ${file.name}!`, "success");
      this.showEditorWorkspace();
    } catch (err) {
      console.error("Resume extraction failed:", err);
      this.showToast(err.message || "Failed to extract resume info.", "error");
    } finally {
      this.showExtractionLoader(false);
    }
  }

  async handlePastedText() {
    const textEl = document.getElementById("builderPastedInput");
    const raw = textEl ? textEl.value.trim() : "";
    if (raw.length < 20) {
      this.showToast("Please paste at least 20 characters of resume text.", "warning");
      return;
    }

    this.showExtractionLoader(true, "Extracting structured profile from pasted text...");

    try {
      const res = await api.post("/api/builder/parse", {
        filename: "Pasted_Resume.txt",
        pastedText: raw,
        templateId: this.selectedTemplate,
      });

      if (!res?.profile) {
        throw new Error("Server returned an empty profile extraction.");
      }

      this.populateFromParsedResume(res.profile);
      this.hasUserEdits = true;
      this.showToast("Resume details extracted from pasted text!", "success");
      this.showEditorWorkspace();
    } catch (err) {
      console.error("Pasted text parse failed:", err);
      this.showToast(err.message || "Failed to parse pasted resume text.", "error");
    } finally {
      this.showExtractionLoader(false);
    }
  }

  _readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file from disk."));
      reader.readAsDataURL(file);
    });
  }

  populateFromParsedResume(parsed) {
    if (!parsed) return;

    const pinfo = parsed.personalInfo || {};
    const contact = parsed.contact || parsed.basics || {};

    const keepPhoto = this.profile.personalInfo?.photo || pinfo.photo_data_url || pinfo.photo || "";
    const keepHeadline = this.profile.personalInfo?.headline || "";

    this.profile.personalInfo = {
      headline: pinfo.headline || keepHeadline,
      photo: keepPhoto,
      photo_data_url: keepPhoto,
      full_name: pinfo.full_name || contact.name || parsed.candidate_name || "",
      email: pinfo.email || contact.email || "",
      phone: pinfo.phone || contact.phone || "",
      city: pinfo.city || pinfo.location || contact.location || "",
      location: pinfo.location || pinfo.city || contact.location || "",
      address: pinfo.address || contact.address || "",
      dob: pinfo.dob || contact.dob || "",
      nationality: pinfo.nationality || contact.nationality || "",
      linkedin: pinfo.linkedin || contact.linkedin || "",
      github: pinfo.github || contact.github || "",
      portfolio: pinfo.portfolio || contact.portfolio || "",
    };

    this.profile.summary = parsed.summary || parsed.professionalSummary || parsed.careerObjective || "";

    // Education
    const rawEdu = Array.isArray(parsed.education) ? parsed.education : [];
    this.profile.education = rawEdu.map((edu) => ({
      degree: edu.degree || edu.qualification || "",
      institution: edu.institution || edu.school || edu.college || "",
      location: edu.location || "",
      year: edu.year || edu.dates || edu.duration || "",
      dates: edu.dates || edu.year || edu.duration || "",
      score: edu.score || edu.gpa || edu.cgpa || "",
      gpa: edu.gpa || edu.score || edu.cgpa || "",
      specialization: edu.specialization || "",
      coursework: edu.coursework || "",
      bullets: Array.isArray(edu.bullets) ? [...edu.bullets] : (edu.bullets ? [String(edu.bullets)] : []),
    }));

    // Experience
    const rawExp = Array.isArray(parsed.workExperience)
      ? parsed.workExperience
      : (Array.isArray(parsed.experience) ? parsed.experience : []);
    this.profile.workExperience = rawExp.map((exp) => {
      const bullets = Array.isArray(exp.bullets)
        ? [...exp.bullets]
        : (Array.isArray(exp.highlights) ? [...exp.highlights] : []);
      return {
        role: exp.role || exp.designation || exp.title || "",
        company: exp.company || exp.employer || exp.organization || "",
        location: exp.location || "",
        duration: exp.duration || exp.dates || exp.start_date || "",
        dates: exp.dates || exp.duration || exp.start_date || "",
        overview: exp.overview || "",
        bullets,
        highlights: bullets,
      };
    });

    // Projects
    const rawProj = Array.isArray(parsed.projects) ? parsed.projects : [];
    this.profile.projects = rawProj.map((proj) => {
      const bullets = Array.isArray(proj.bullets)
        ? [...proj.bullets]
        : (proj.description ? [proj.description] : []);
      const techStack = Array.isArray(proj.techStack)
        ? [...proj.techStack]
        : (Array.isArray(proj.tech_stack)
            ? [...proj.tech_stack]
            : (typeof proj.technologies === "string" ? proj.technologies.split(",").map((s) => s.trim()).filter(Boolean) : []));
      return {
        title: proj.title || proj.name || "",
        name: proj.name || proj.title || "",
        techStack,
        tech_stack: techStack,
        dates: proj.dates || proj.year || "",
        github_link: proj.github_link || proj.github || "",
        live_link: proj.live_link || proj.live || proj.link || "",
        description: proj.description || bullets.join(". ") || "",
        bullets,
      };
    });

    // Technical Skills
    const rawSkills = Array.isArray(parsed.technicalSkills)
      ? parsed.technicalSkills
      : (Array.isArray(parsed.skills?.technical)
          ? parsed.skills.technical
          : (Array.isArray(parsed.skills) ? parsed.skills : []));
    this.profile.technicalSkills = rawSkills.map((s) => {
      if (typeof s === "string") return s;
      return {
        name: s.name || s.skill || "",
        level: typeof s.level === "number" ? s.level : (typeof s.proficiency === "number" ? s.proficiency : 85),
        category: s.category || "Languages",
      };
    });

    // Languages
    const rawLangs = Array.isArray(parsed.languages)
      ? parsed.languages
      : (Array.isArray(parsed.additionalInfo?.languages_known) ? parsed.additionalInfo.languages_known : []);
    this.profile.languages = rawLangs.map((l) => {
      if (typeof l === "string") return { name: l, proficiency: "Fluent", level: 90 };
      return {
        name: l.name || l.language || "",
        proficiency: l.proficiency || "Fluent",
        level: typeof l.level === "number" ? l.level : 90,
      };
    });

    // Certifications
    this.profile.certifications = Array.isArray(parsed.certifications)
      ? JSON.parse(JSON.stringify(parsed.certifications))
      : [];

    // Achievements
    this.profile.achievements = Array.isArray(parsed.achievements)
      ? JSON.parse(JSON.stringify(parsed.achievements))
      : [];

    // References
    this.profile.references = Array.isArray(parsed.references)
      ? JSON.parse(JSON.stringify(parsed.references))
      : [];

    // Hobbies
    this.profile.hobbies = parsed.hobbies || "";

    // Additional Info
    const addn = parsed.additionalInfo || {};
    this.profile.additionalInfo = {
      languages_known: this.profile.languages.map((l) => (typeof l === "string" ? l : l.name)),
      research_interests: Array.isArray(addn.research_interests)
        ? [...addn.research_interests]
        : (Array.isArray(parsed.researchInterests) ? [...parsed.researchInterests] : []),
      publications: Array.isArray(addn.publications)
        ? JSON.parse(JSON.stringify(addn.publications))
        : (Array.isArray(parsed.publications) ? JSON.parse(JSON.stringify(parsed.publications)) : []),
      extracurriculars: Array.isArray(addn.extracurriculars) ? [...addn.extracurriculars] : [],
    };

    this.render();
  }

  startFromScratch() {
    const keepPhoto = this.profile.personalInfo?.photo || "";
    this.profile = this.createEmptyProfile();
    this.profile.personalInfo.photo = keepPhoto;
    this.profile.personalInfo.photo_data_url = keepPhoto;
    this.profile.education = [
      {
        degree: "B.Tech in Computer Science & Engineering",
        institution: "Indian Institute of Technology Bombay",
        location: "Mumbai, India",
        year: "2021 – 2025",
        dates: "2021 – 2025",
        score: "8.9 / 10 CGPA",
        gpa: "8.9",
        specialization: "Data & Systems",
        coursework: "Data Structures, Algorithms, Distributed Systems, DBMS",
        bullets: ["Secured Institute Academic Excellence Award", "Led Department Competitive Programming Chapter"],
      },
    ];
    this.profile.projects = [
      {
        title: "Distributed Key-Value Store",
        name: "Distributed Key-Value Store",
        techStack: ["Go", "Raft", "gRPC", "Docker"],
        tech_stack: ["Go", "Raft", "gRPC", "Docker"],
        dates: "2024",
        github_link: "https://github.com/example/raft-kv",
        live_link: "",
        description: "Implemented a fault-tolerant replicated key-value storage engine using Raft consensus protocol.",
        bullets: [
          "Implemented consensus layer with leader election and log replication with sub-5ms heartbeat latency.",
          "Handled network partitioning and split-brain scenarios with zero data loss under simulated stress tests.",
        ],
      },
    ];
    this.profile.technicalSkills = ["Python", "Go", "FastAPI", "React", "PostgreSQL", "Docker", "AWS", "Git"];
    this.profile.languages = [
      { name: "English", proficiency: "Fluent", level: 95 },
      { name: "Hindi", proficiency: "Native", level: 100 },
    ];

    this.hasUserEdits = true;
    this.showToast("Started fresh resume! Edit your details in the left pane.", "info");
    this.showEditorWorkspace();
    this.render();
  }

  loadSampleProfile(key) {
    if (this.sampleProfiles && this.sampleProfiles[key]) {
      this.populateFromParsedResume(this.sampleProfiles[key]);
      this.hasUserEdits = true;
      const label = key === "fresher" ? "Indian Fresher" : (key === "data_scientist" ? "Data Scientist" : "Software Engineer");
      this.showToast(`Loaded ${label} profile!`, "success");
      this.showEditorWorkspace();
    } else {
      this.showToast("Loading sample profile...", "info");
      api.get("/api/builder/sample-profiles").then((res) => {
        if (res?.profiles?.[key]) {
          this.sampleProfiles = res.profiles;
          this.populateFromParsedResume(res.profiles[key]);
          this.hasUserEdits = true;
          this.showEditorWorkspace();
        }
      });
    }
  }

  showExtractionLoader(show, message = "Processing...") {
    const loaderEl = document.getElementById("builderExtractionProgress");
    const msgEl = document.getElementById("builderExtractionMsg");
    if (!loaderEl) return;
    if (show) {
      loaderEl.classList.remove("hidden");
      if (msgEl) msgEl.textContent = message;
    } else {
      loaderEl.classList.add("hidden");
    }
  }

  showEditorWorkspace() {
    const landingEl = document.getElementById("builderLandingSection");
    const workspaceEl = document.getElementById("builderWorkspaceSection");
    if (landingEl) landingEl.classList.add("hidden");
    if (workspaceEl) workspaceEl.classList.remove("hidden");
    this.renderPreview();
  }

  showLandingUpload() {
    const landingEl = document.getElementById("builderLandingSection");
    const workspaceEl = document.getElementById("builderWorkspaceSection");
    if (landingEl) landingEl.classList.remove("hidden");
    if (workspaceEl) workspaceEl.classList.add("hidden");
    this.renderTemplateGallery();
    requestAnimationFrame(() => this.carousels.landing?.layout?.(false));
  }

  // ------------------------------------------------------------------
  // Editor Tabs & Dynamic Form Inputs
  // ------------------------------------------------------------------
  bindEditorTabs() {
    const tabBtns = document.querySelectorAll(".builder-tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeEditorTab = btn.dataset.tab;
        this.renderActiveEditorTab();
      });
    });
  }

  renderActiveEditorTab() {
    const forms = document.querySelectorAll(".builder-form-pane");
    forms.forEach((pane) => {
      if (pane.id === `builderPane_${this.activeEditorTab}`) {
        pane.classList.remove("hidden");
      } else {
        pane.classList.add("hidden");
      }
    });
  }

  // ------------------------------------------------------------------
  // Template Switching, Galleries & Theming
  // ------------------------------------------------------------------
  mountGalleries() {
    this.selectedTemplate = LEGACY_TEMPLATE_MAP[this.selectedTemplate] || this.selectedTemplate;
    const getProfile = () => this.profile;

    const landingRoot = document.getElementById("builderCarouselLanding");
    if (landingRoot) {
      this.carousels.landing = new TemplateCarousel(landingRoot, {
        title: "10 Bespoke Publication-Grade Resume Templates",
        subtitle: "Faithfully modeled layouts. Switch designs any time with zero data loss, then download a print-ready A4 PDF.",
        selectedId: this.selectedTemplate,
        getProfile,
        onChange: (id) => this.selectTemplate(id, { source: "landing" }),
        onUse: (id) => this.useTemplateFromLanding(id),
      });
    }

    const changeBtn = document.getElementById("builderChangeTplBtn");
    if (changeBtn) {
      changeBtn.addEventListener("click", () => this.toggleWorkspaceGallery());
    }

    const closeGalBtn = document.getElementById("builderCloseGalleryBtn");
    if (closeGalBtn) {
      closeGalBtn.addEventListener("click", () => this.toggleWorkspaceGallery(false));
    }

    // Filter bar
    const filterBar = document.getElementById("builderTemplateFilterBar");
    if (filterBar) {
      filterBar.querySelectorAll(".bld-filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          filterBar.querySelectorAll(".bld-filter-btn").forEach((b) => {
            b.classList.remove("btn-primary", "active");
            b.classList.add("btn-ghost");
          });
          btn.classList.remove("btn-ghost");
          btn.classList.add("btn-primary", "active");
          this.activeFilter = btn.dataset.filter || "all";
          this.renderTemplateGrid();
        });
      });
    }
  }

  useTemplateFromLanding(id) {
    this.selectTemplate(id, { source: "landing" });
    const hasProfile = Boolean(this.profile.personalInfo.full_name?.trim());
    if (hasProfile) {
      this.showEditorWorkspace();
      this.render();
    } else {
      this.startFromScratch();
    }
    this.scrollToTop();
  }

  toggleWorkspaceGallery(force) {
    const panel = document.getElementById("builderWorkspaceGallery");
    const btn = document.getElementById("builderChangeTplBtn");
    if (!panel) return;
    const open = typeof force === "boolean" ? force : panel.classList.contains("hidden");
    panel.classList.toggle("hidden", !open);
    if (btn) {
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Close templates" : "Change template";
    }
    if (open) {
      this.renderTemplateGrid();
    }
    this.fitPreview();
  }

  renderTemplateGrid() {
    const grid = document.getElementById("builderTemplateGrid");
    if (!grid) return;

    let filtered = RESUME_TEMPLATES;
    if (this.activeFilter === "classic") {
      filtered = RESUME_TEMPLATES.filter((t) =>
        ["editorial_serif", "classic_executive", "clean_minimalist", "ats_compact_pro"].includes(t.id)
      );
    } else if (this.activeFilter === "modern") {
      filtered = RESUME_TEMPLATES.filter((t) =>
        ["corporate_accent", "swiss_modern", "executive_slate", "editorial_warmth"].includes(t.id)
      );
    } else if (this.activeFilter === "twocol") {
      filtered = RESUME_TEMPLATES.filter((t) =>
        t.isTwoColumn || ["swiss_modern", "timeline_studio", "emerald_sidebar"].includes(t.id)
      );
    } else if (this.activeFilter === "photo") {
      filtered = RESUME_TEMPLATES.filter((t) => t.supportsPhoto);
    }

    grid.innerHTML = filtered.map((tpl) => {
      const isActive = tpl.id === this.selectedTemplate;
      return `
        <div class="bld-grid-card ${isActive ? "active" : ""}" data-id="${tpl.id}" role="button" tabindex="0">
          <div class="bld-grid-card-thumb">
            <div class="bld-grid-card-inner" style="transform: scale(${200 / 794});">
              ${renderResume(SAMPLE_PROFILE, tpl.id, { sample: true })}
            </div>
          </div>
          <div class="bld-grid-card-meta">
            <div class="d-flex justify-between items-center mb-1">
              <span class="bld-grid-card-title">${escapeHtml(tpl.name)}</span>
              <span class="score-pill score-pill-green text-xs">${escapeHtml(tpl.atsBadge || "ATS Pro")}</span>
            </div>
            <div class="d-flex justify-between items-center text-xs">
              <span class="bld-grid-card-tag">${escapeHtml(tpl.category || tpl.tag || "")}</span>
              ${tpl.supportsPhoto ? '<span class="score-pill score-pill-blue text-xs">Photo</span>' : ""}
            </div>
          </div>
        </div>
      `;
    }).join("");

    grid.querySelectorAll(".bld-grid-card").forEach((card) => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        if (id) {
          this.selectTemplate(id);
          this.toggleWorkspaceGallery(false);
        }
      });
    });

    requestAnimationFrame(() => this.fitTemplateGridCards());
  }

  fitTemplateGridCards() {
    const grid = document.getElementById("builderTemplateGrid");
    if (!grid) return;
    grid.querySelectorAll(".bld-grid-card-thumb").forEach((thumb) => {
      const inner = thumb.querySelector(".bld-grid-card-inner");
      if (!inner) return;
      const w = thumb.clientWidth;
      if (w > 0) {
        const scale = w / 794;
        inner.style.transform = `scale(${scale.toFixed(5)})`;
        thumb.style.height = `${Math.round(1123 * scale)}px`;
      }
    });
  }

  scrollToTop() {
    const view = document.getElementById("view-builder");
    if (view?.scrollIntoView) view.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  selectTemplate(templateId, { source } = {}) {
    const id = getTemplate(LEGACY_TEMPLATE_MAP[templateId] || templateId).id;
    const changed = id !== this.selectedTemplate;
    this.selectedTemplate = id;
    if (changed) this.accent = null; // reset to template default

    // keep carousel in sync
    Object.entries(this.carousels).forEach(([key, c]) => {
      if (key !== source) c.setSelected(id);
    });

    const tpl = getTemplate(id);

    // Active Template Label & Badges
    const nameEl = document.getElementById("builderActiveTemplateName");
    if (nameEl) nameEl.textContent = tpl.name;

    const badgeEl = document.getElementById("builderActiveTemplateBadge");
    if (badgeEl) {
      badgeEl.textContent = tpl.atsBadge || `ATS: ${tpl.ats || "High"}`;
      badgeEl.className = `score-pill text-xs ${tpl.atsSuitability === "medium" ? "score-pill-neutral" : "score-pill-green"}`;
    }

    const note = document.getElementById("builderAtsNote");
    if (note) {
      note.textContent = tpl.description || (tpl.isTwoColumn
        ? "Two-column design optimized for readability."
        : "Single flow linear layout — maximum ATS parse fidelity.");
    }

    // Photo slot indicator
    const photoHint = document.getElementById("bldPhotoHint");
    if (photoHint) {
      if (tpl.supportsPhoto) {
        photoHint.innerHTML = `<b>${escapeHtml(tpl.name)}</b> displays a photo slot. Upload your headshot above.`;
        photoHint.className = "text-xs text-primary font-semibold mt-1";
      } else {
        photoHint.textContent = `Optional — this template (${tpl.name}) uses a clean text-only header for maximum ATS readability.`;
        photoHint.className = "text-xs text-tertiary mt-1";
      }
    }

    this.updateThemeControls(tpl);
    this.renderPreview();
  }

  updateThemeControls(tpl) {
    const colorRow = document.getElementById("builderThemeColorRow");
    const monoBadge = document.getElementById("builderMonochromeBadge");
    const picker = document.getElementById("builderCustomColorPicker");

    if (tpl.supportsTheme) {
      if (colorRow) colorRow.classList.remove("hidden");
      if (monoBadge) monoBadge.classList.add("hidden");
      if (picker) picker.value = this.accent || tpl.accentColor || "#2563A6";
      this.renderSwatches(tpl);
    } else {
      if (colorRow) colorRow.classList.add("hidden");
      if (monoBadge) monoBadge.classList.remove("hidden");
    }
  }

  renderSwatches(tpl = null) {
    const box = document.getElementById("builderSwatches");
    if (!box) return;
    const currentTpl = tpl || getTemplate(this.selectedTemplate);
    const swatches = currentTpl.swatches || ACCENT_SWATCHES;

    box.innerHTML = [
      `<button type="button" class="bld-swatch reset ${this.accent ? "" : "active"}" data-color="" title="Template default" aria-label="Template default colour"></button>`,
      ...swatches.map((c) => `<button type="button" class="bld-swatch ${this.accent === c ? "active" : ""}" data-color="${c}" style="background:${c}" title="${c}" aria-label="Accent ${c}"></button>`),
    ].join("");
  }

  bindThemeControls() {
    const box = document.getElementById("builderSwatches");
    if (box) {
      box.addEventListener("click", (e) => {
        const b = e.target.closest(".bld-swatch");
        if (!b) return;
        this.accent = b.dataset.color || null;
        this.renderSwatches();
        const picker = document.getElementById("builderCustomColorPicker");
        if (picker && this.accent) picker.value = this.accent;
        this.renderPreview();
      });
    }

    const picker = document.getElementById("builderCustomColorPicker");
    if (picker) {
      picker.addEventListener("input", (e) => {
        this.accent = e.target.value;
        this.renderSwatches();
        this.renderPreview();
      });
    }

    const resetBtn = document.getElementById("builderResetColorBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.accent = null;
        this.renderSwatches();
        const tpl = getTemplate(this.selectedTemplate);
        if (picker && tpl.accentColor) picker.value = tpl.accentColor;
        this.renderPreview();
      });
    }
  }

  // ------------------------------------------------------------------
  // Photo upload
  // ------------------------------------------------------------------
  bindPhotoUpload() {
    const input = document.getElementById("bldPhotoInput");
    const btn = document.getElementById("bldPhotoBtn");
    const rm = document.getElementById("bldPhotoRemoveBtn");
    if (btn && input) btn.addEventListener("click", () => input.click());
    if (input) {
      input.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          this.showToast("Please choose an image file (PNG, JPG, WebP).", "warning");
          return;
        }
        try {
          const resized = await this._resizeImage(file, 300);
          this.profile.personalInfo.photo = resized;
          this.profile.personalInfo.photo_data_url = resized;
          this.hasUserEdits = true;
          this.updatePhotoPreview();
          this.renderPreview();
          this.carousels.workspace?.renderCards?.();
        } catch (err) {
          this.showToast("Could not process that image.", "error");
        }
        input.value = "";
      });
    }
    if (rm) {
      rm.addEventListener("click", () => {
        this.profile.personalInfo.photo = "";
        this.profile.personalInfo.photo_data_url = "";
        this.hasUserEdits = true;
        this.updatePhotoPreview();
        this.renderPreview();
        this.carousels.workspace?.renderCards?.();
      });
    }
  }

  _resizeImage(file, size) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.88));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image processing failed"));
      };
      img.src = url;
    });
  }

  updatePhotoPreview() {
    const prev = document.getElementById("bldPhotoPreview");
    const rm = document.getElementById("bldPhotoRemoveBtn");
    const btn = document.getElementById("bldPhotoBtn");
    const photo = this.profile.personalInfo?.photo || this.profile.personalInfo?.photo_data_url || "";
    if (prev) {
      prev.style.backgroundImage = photo ? `url("${photo}")` : "";
      prev.textContent = photo ? "" : "Photo";
    }
    if (rm) rm.classList.toggle("hidden", !photo);
    if (btn) btn.textContent = photo ? "Change photo" : "Upload photo";
  }

  // ------------------------------------------------------------------
  // Action Buttons & Form Binding
  // ------------------------------------------------------------------
  bindActionButtons() {
    const genBtn = document.getElementById("builderGenerateBtn");
    if (genBtn) genBtn.addEventListener("click", () => this.openConfirmModal());

    const dlBtn = document.getElementById("builderDownloadBtn");
    if (dlBtn && dlBtn !== genBtn) dlBtn.addEventListener("click", () => this.openConfirmModal());

    const docxBtn = document.getElementById("builderDownloadDocxBtn");
    if (docxBtn) docxBtn.addEventListener("click", () => this.downloadDocx());

    const saveAccountBtn = document.getElementById("builderSaveAccountBtn");
    if (saveAccountBtn) saveAccountBtn.addEventListener("click", () => this.saveToAccount());

    // Mobile Segmented View Toggle
    const viewToggleBtns = document.querySelectorAll(".bld-view-toggle-btn");
    viewToggleBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.bldView;
        viewToggleBtns.forEach((b) => {
          b.classList.toggle("btn-primary", b === btn);
          b.classList.toggle("btn-ghost", b !== btn);
        });
        const editorPane = document.querySelector(".builder-editor-pane");
        const previewPane = document.querySelector(".builder-preview-pane");
        const galleryPanel = document.getElementById("builderWorkspaceGallery");
        if (editorPane) editorPane.classList.toggle("bld-mobile-hidden", view !== "editor");
        if (previewPane) previewPane.classList.toggle("bld-mobile-hidden", view === "editor");
        if (galleryPanel) {
          if (view === "templates") {
            galleryPanel.classList.remove("hidden");
            this.renderGalleryGrid();
          } else {
            galleryPanel.classList.add("hidden");
          }
        }
        if (view === "preview") {
          setTimeout(() => this.fitPreview(), 60);
        }
      });
    });

    const resetBtn = document.getElementById("builderResetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("Reset current resume and start over?")) {
          this.showLandingUpload();
        }
      });
    }

    // Auto-sync input fields
    const editorForm = document.getElementById("builderEditorForm");
    if (editorForm) {
      editorForm.addEventListener("submit", (e) => e.preventDefault());
      editorForm.addEventListener("input", (e) => {
        this.hasUserEdits = true;
        this.syncInputToProfile(e.target);
        this.debouncedRenderPreview();
      });
    }

    // Add Entry Buttons
    const addEduBtn = document.getElementById("builderAddEduBtn");
    if (addEduBtn) {
      addEduBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.education.push({
          degree: "",
          institution: "",
          location: "",
          year: "",
          dates: "",
          score: "",
          gpa: "",
          specialization: "",
          coursework: "",
          bullets: [],
        });
        this.renderEducationList();
        this.renderPreview();
      });
    }

    const addExpBtn = document.getElementById("builderAddExpBtn");
    if (addExpBtn) {
      addExpBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.workExperience.push({
          role: "",
          company: "",
          location: "",
          duration: "",
          dates: "",
          overview: "",
          bullets: [],
          highlights: [],
        });
        this.renderExperienceList();
        this.renderPreview();
      });
    }

    const addProjBtn = document.getElementById("builderAddProjBtn");
    if (addProjBtn) {
      addProjBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.projects.push({
          title: "",
          name: "",
          techStack: [],
          tech_stack: [],
          dates: "",
          github_link: "",
          live_link: "",
          description: "",
          bullets: [],
        });
        this.renderProjectsList();
        this.renderPreview();
      });
    }

    const addSkillBtn = document.getElementById("builderAddSkillBtn");
    if (addSkillBtn) {
      addSkillBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.technicalSkills.push({ name: "", category: "Languages", level: 85 });
        this.renderSkillsList();
        this.renderPreview();
      });
    }

    const addLangBtn = document.getElementById("builderAddLangBtn");
    if (addLangBtn) {
      addLangBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.languages.push({ name: "", proficiency: "Fluent", level: 90 });
        this.renderLanguagesList();
        this.renderPreview();
      });
    }

    const addCertBtn = document.getElementById("builderAddCertBtn");
    if (addCertBtn) {
      addCertBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.certifications.push({ name: "", issuer: "", issue_date: "", credential_link: "" });
        this.renderCertificationsList();
        this.renderPreview();
      });
    }

    const addAchBtn = document.getElementById("builderAddAchBtn");
    if (addAchBtn) {
      addAchBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.achievements.push({ title: "", description: "", date: "" });
        this.renderAchievementsList();
        this.renderPreview();
      });
    }

    const addRefBtn = document.getElementById("builderAddRefBtn");
    if (addRefBtn) {
      addRefBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        this.profile.references.push({ name: "", title: "", company: "", contact: "" });
        this.renderReferencesList();
        this.renderPreview();
      });
    }

    const addPubBtn = document.getElementById("builderAddPubBtn");
    if (addPubBtn) {
      addPubBtn.addEventListener("click", () => {
        this.hasUserEdits = true;
        if (!this.profile.additionalInfo.publications) this.profile.additionalInfo.publications = [];
        this.profile.additionalInfo.publications.push({ title: "", publisher: "", year: "", link: "" });
        this.renderPublicationsList();
        this.renderPreview();
      });
    }

    // Zoom control
    const zoomSelect = document.getElementById("builderZoomSelect");
    if (zoomSelect) {
      zoomSelect.addEventListener("change", (e) => {
        this.zoomMode = e.target.value;
        this.fitPreview();
      });
    }
    window.addEventListener("resize", () => { this.fitPreview(); this.fitTemplateGridCards(); });
  }

  debouncedRenderPreview() {
    if (this.renderTimer) clearTimeout(this.renderTimer);
    this.renderTimer = setTimeout(() => this.renderPreview(), 60);
  }

  syncInputToProfile(input) {
    const field = input.dataset.field;
    if (!field) return;

    if (field.startsWith("personalInfo.")) {
      const key = field.split(".")[1];
      this.profile.personalInfo[key] = input.value;
      if (key === "city") this.profile.personalInfo.location = input.value;
    } else if (field === "summary") {
      this.profile.summary = input.value;
    } else if (field === "hobbies") {
      this.profile.hobbies = input.value;
    } else if (field === "technicalSkills") {
      const items = input.value.split(",").map((s) => s.trim()).filter(Boolean);
      // Keep existing object structures if present
      this.profile.technicalSkills = items;
    } else if (field === "researchInterests") {
      this.profile.additionalInfo.research_interests = input.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  moveItem(list, idx, delta) {
    const target = idx + delta;
    if (target < 0 || target >= list.length) return;
    const item = list.splice(idx, 1)[0];
    list.splice(target, 0, item);
    this.hasUserEdits = true;
  }

  // ------------------------------------------------------------------
  // Confirmation Modal & Generation Logic
  // ------------------------------------------------------------------
  bindConfirmationModal() {
    const modal = document.getElementById("builderConfirmModal");
    const closeBtn = document.getElementById("builderModalCloseBtn");
    const editBtn = document.getElementById("builderModalEditBtn");
    const changeTplBtn = document.getElementById("builderModalChangeTplBtn");
    const confirmGenBtn = document.getElementById("builderModalConfirmBtn");

    const closeModal = () => {
      if (modal) modal.classList.add("hidden");
    };

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        closeModal();
        const editorSec = document.getElementById("builderEditorForm");
        if (editorSec) editorSec.scrollIntoView({ behavior: "smooth" });
      });
    }
    if (changeTplBtn) {
      changeTplBtn.addEventListener("click", () => {
        closeModal();
        this.toggleWorkspaceGallery(true);
      });
    }
    if (confirmGenBtn) {
      confirmGenBtn.addEventListener("click", () => {
        this.confirmAndGeneratePdf();
      });
    }
  }

  openConfirmModal() {
    const modal = document.getElementById("builderConfirmModal");
    if (!modal) return;

    const name = this.profile.personalInfo.full_name?.trim() || "";
    const email = this.profile.personalInfo.email?.trim() || "";
    const phone = this.profile.personalInfo.phone?.trim() || "";
    const hasContact = Boolean(email || phone);
    const hasSubstantive = Boolean(
      (this.profile.education && this.profile.education.length > 0) ||
      (this.profile.workExperience && this.profile.workExperience.length > 0) ||
      (this.profile.projects && this.profile.projects.length > 0)
    );

    const errors = [];
    const warnings = [];

    if (!name) errors.push("Candidate Full Name is required.");
    if (!hasContact) errors.push("At least one contact method (Email or Phone) is required.");
    if (!hasSubstantive) errors.push("At least one substantive section (Education, Experience, or Projects) is required.");

    if (!this.profile.technicalSkills || this.profile.technicalSkills.length === 0) {
      warnings.push("Technical Skills section is empty (recommended for tech roles).");
    }
    if (!this.profile.summary) {
      warnings.push("Professional Summary is omitted (will be cleanly hidden from PDF).");
    }

    const modalTplName = document.getElementById("builderModalTemplateName");
    const modalCandName = document.getElementById("builderModalCandidateName");
    const modalContact = document.getElementById("builderModalContact");
    const modalIncluded = document.getElementById("builderModalIncludedSections");
    const modalErrors = document.getElementById("builderModalErrors");
    const modalWarnings = document.getElementById("builderModalWarnings");
    const confirmBtn = document.getElementById("builderModalConfirmBtn");

    const tplObj = getTemplate(this.selectedTemplate);
    if (modalTplName) modalTplName.textContent = tplObj.name;
    if (modalCandName) modalCandName.textContent = name || "Unspecified Candidate";
    if (modalContact) modalContact.textContent = [email, phone, this.profile.personalInfo.city].filter(Boolean).join(" · ") || "None provided";

    // Included sections
    const included = [];
    if (this.profile.summary) included.push("Professional Summary");
    if (this.profile.education?.length) included.push(`Education (${this.profile.education.length})`);
    if (this.profile.workExperience?.length) included.push(`Experience (${this.profile.workExperience.length})`);
    if (this.profile.projects?.length) included.push(`Projects (${this.profile.projects.length})`);
    if (this.profile.technicalSkills?.length) included.push(`Technical Skills (${this.profile.technicalSkills.length})`);
    if (this.profile.languages?.length) included.push(`Languages (${this.profile.languages.length})`);
    if (this.profile.certifications?.length) included.push(`Certifications (${this.profile.certifications.length})`);
    if (this.profile.achievements?.length) included.push(`Achievements (${this.profile.achievements.length})`);
    if (this.profile.references?.length) included.push(`References (${this.profile.references.length})`);
    if (this.profile.hobbies) included.push("Hobbies & Interests");
    if (this.profile.additionalInfo?.publications?.length) included.push(`Publications (${this.profile.additionalInfo.publications.length})`);

    if (modalIncluded) {
      modalIncluded.innerHTML = included.map((s) => `<li class="text-sm text-secondary">✓ ${escapeHtml(s)}</li>`).join("");
    }

    if (modalErrors) {
      if (errors.length > 0) {
        modalErrors.innerHTML = `
          <div class="card p-3 mb-3 border-danger bg-sunken">
            <div class="text-sm font-semibold text-danger mb-1">Required Information Missing:</div>
            <ul class="text-xs text-danger pl-4 mb-0">
              ${errors.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}
            </ul>
          </div>
        `;
        modalErrors.classList.remove("hidden");
        if (confirmBtn) confirmBtn.disabled = true;
      } else {
        modalErrors.innerHTML = "";
        modalErrors.classList.add("hidden");
        if (confirmBtn) confirmBtn.disabled = false;
      }
    }

    if (modalWarnings) {
      if (warnings.length > 0) {
        modalWarnings.innerHTML = `
          <div class="card p-2 mb-3 border-warning bg-sunken">
            <div class="text-xs font-semibold text-warning mb-1">Recommended Suggestions:</div>
            <ul class="text-xs text-secondary pl-4 mb-0">
              ${warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}
            </ul>
          </div>
        `;
        modalWarnings.classList.remove("hidden");
      } else {
        modalWarnings.innerHTML = "";
        modalWarnings.classList.add("hidden");
      }
    }

    modal.classList.remove("hidden");
  }

  async confirmAndGeneratePdf() {
    const modal = document.getElementById("builderConfirmModal");
    const confirmBtn = document.getElementById("builderModalConfirmBtn");
    const statusBox = document.getElementById("builderGenerationStatus");

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<span class="spinner" aria-hidden="true"></span> Preparing PDF...`;
    }

    try {
      const cleanName = (this.profile.personalInfo.full_name || "Candidate")
        .replace(/[^A-Za-z0-9_\- ]/g, "")
        .trim()
        .replace(/\s+/g, "_") || "Candidate";
      const filename = `${cleanName}_Resume`;
      await this.printResume(filename);

      if (modal) modal.classList.add("hidden");
      if (statusBox) {
        statusBox.classList.remove("hidden");
        statusBox.innerHTML = `
          <div class="card p-4 border-success bg-sunken mb-4">
            <div class="text-success font-semibold mb-1">✓ Your PDF is ready — print dialog opened</div>
            <div class="text-xs text-secondary mb-2">
              Choose <b>Save as PDF</b> as destination. For optimal precision, set <b>Margins → None</b> and untick <b>Headers and footers</b>.
              Target file: <b>${escapeHtml(filename)}.pdf</b>.
            </div>
            <div class="flex-row gap-2">
              <button type="button" class="btn btn-secondary btn-sm" id="builderRedownloadBtn">Open dialog again</button>
              <button type="button" class="btn btn-ghost btn-sm" id="builderStatusDismissBtn">Dismiss</button>
            </div>
          </div>`;
        document.getElementById("builderRedownloadBtn")?.addEventListener("click", () => this.printResume(filename));
        document.getElementById("builderStatusDismissBtn")?.addEventListener("click", () => statusBox.classList.add("hidden"));
      }
    } catch (err) {
      console.error("PDF export failed:", err);
      this.showToast(err.message || "Failed to prepare the resume PDF.", "error");
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirm & Download PDF";
      }
    }
  }

  async downloadDocx() {
    const docxBtn = document.getElementById("builderDownloadDocxBtn");
    const origText = docxBtn ? docxBtn.textContent : "Download DOCX";
    if (docxBtn) {
      docxBtn.disabled = true;
      docxBtn.innerHTML = `<span class="spinner" aria-hidden="true"></span> Generating...`;
    }

    try {
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const resp = await fetch("/api/builder/generate-docx", {
        method: "POST",
        headers,
        body: JSON.stringify({
          profile: this.profile,
          templateId: this.selectedTemplate,
          accentColor: this.accent,
        }),
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.detail || "DOCX generation failed.");
      }

      const blob = await resp.blob();
      const cleanName = (this.profile.personalInfo.full_name || "Candidate")
        .replace(/[^A-Za-z0-9_\- ]/g, "")
        .trim()
        .replace(/\s+/g, "_") || "Candidate";
      const filename = `${cleanName}_Resume.docx`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);

      this.showToast("Resume DOCX downloaded successfully!", "success");
    } catch (err) {
      console.error("DOCX download error:", err);
      this.showToast(err.message || "Failed to download DOCX.", "error");
    } finally {
      if (docxBtn) {
        docxBtn.disabled = false;
        docxBtn.textContent = origText;
      }
    }
  }

  printResume(fileTitle) {
    return new Promise((resolve, reject) => {
      const cssHref = new URL("../../css/resume-templates.css", import.meta.url).href;
      const fontLinks = [...document.querySelectorAll('link[href*="fonts.googleapis.com/css"]')]
        .map((l) => `<link rel="stylesheet" href="${l.href}">`)
        .join("");
      const pageHtml = renderResume(this.profile, this.selectedTemplate, { accent: this.accent });

      const old = document.getElementById("builderPrintFrame");
      if (old) old.remove();

      const frame = document.createElement("iframe");
      frame.id = "builderPrintFrame";
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0;visibility:hidden;";
      frame.srcdoc = `<!doctype html><html class="rt-print-doc"><head><meta charset="utf-8"><title>${escapeHtml(fileTitle)}</title>${fontLinks}<link rel="stylesheet" href="${cssHref}"><style>@page { size: A4; margin: 0; } body { margin: 0; padding: 0; background: #fff; }</style></head><body>${pageHtml}</body></html>`;

      frame.onload = async () => {
        try {
          const doc = frame.contentDocument;
          await Promise.race([
            Promise.all([
              doc.fonts?.ready,
              ...[...doc.images].map((im) => (im.complete ? 1 : new Promise((r) => { im.onload = r; im.onerror = r; }))),
            ]),
            new Promise((r) => setTimeout(r, 2200)),
          ]);
          frame.contentWindow.focus();
          frame.contentWindow.print();
          resolve();
          setTimeout(() => frame.remove(), 120000);
        } catch (e) {
          reject(e);
        }
      };
      frame.onerror = () => reject(new Error("Could not prepare the print view."));
      document.body.appendChild(frame);
    });
  }

  async saveToAccount() {
    const token = store.get("token");
    if (!token) {
      this.showToast("Please sign in or register to save this resume profile to your account.", "info");
      window.location.hash = "#/login";
      return;
    }

    try {
      const res = await api.post("/api/builder/save-to-profile", {
        profile: this.profile,
      });
      if (res?.studentProfile) {
        store.set("studentProfile", res.studentProfile);
      }
      this.showToast("Resume profile saved to your student account!", "success");
    } catch (err) {
      this.showToast(err.message || "Could not save to account.", "error");
    }
  }

  // ------------------------------------------------------------------
  // UI Rendering & Editor Form Lists
  // ------------------------------------------------------------------
  render() {
    this.populateEditorFormValues();
    this.renderEducationList();
    this.renderExperienceList();
    this.renderProjectsList();
    this.renderSkillsList();
    this.renderLanguagesList();
    this.renderCertificationsList();
    this.renderAchievementsList();
    this.renderReferencesList();
    this.renderPublicationsList();
    this.renderTemplateGallery();
    this.renderPreview();
  }

  populateEditorFormValues() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || "";
    };

    const p = this.profile.personalInfo;
    setVal("bldFullName", p.full_name);
    setVal("bldHeadline", p.headline);
    setVal("bldEmail", p.email);
    setVal("bldPhone", p.phone);
    setVal("bldCity", p.city || p.location);
    setVal("bldAddress", p.address);
    setVal("bldDob", p.dob);
    setVal("bldNationality", p.nationality);
    setVal("bldLinkedIn", p.linkedin);
    setVal("bldGitHub", p.github);
    setVal("bldPortfolio", p.portfolio);

    this.updatePhotoPreview();

    setVal("bldSummary", this.profile.summary);
    setVal("bldHobbiesInput", this.profile.hobbies);

    const skillsStr = (this.profile.technicalSkills || [])
      .map((s) => (typeof s === "string" ? s : s.name))
      .filter(Boolean)
      .join(", ");
    setVal("bldSkillsInput", skillsStr);

    setVal("bldResearchInput", (this.profile.additionalInfo?.research_interests || []).join(", "));
  }

  renderEducationList() {
    const listEl = document.getElementById("builderEducationList");
    if (!listEl) return;

    if (!this.profile.education || this.profile.education.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No education entries yet. Click "+ Add Education".</div>`;
      return;
    }

    listEl.innerHTML = this.profile.education.map((edu, idx) => {
      const bulletsText = Array.isArray(edu.bullets) ? edu.bullets.join("\n") : (edu.bullets || "");
      return `
        <div class="card p-3 mb-2 bg-sunken builder-item-card" data-idx="${idx}">
          <div class="flex-row justify-between mb-2">
            <span class="text-xs font-semibold text-primary">#${idx + 1} Education Entry</span>
            <div class="d-flex items-center gap-1">
              <button type="button" class="bld-reorder-btn bld-edu-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move Up">▲</button>
              <button type="button" class="bld-reorder-btn bld-edu-down" data-idx="${idx}" ${idx === this.profile.education.length - 1 ? "disabled" : ""} title="Move Down">▼</button>
              <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-edu" data-idx="${idx}">Delete</button>
            </div>
          </div>
          <div class="grid-2 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Degree / Qualification *</label>
              <input type="text" class="input input-sm bld-edu-degree" value="${escapeHtml(edu.degree || "")}" placeholder="B.Tech in Computer Science" />
            </div>
            <div>
              <label class="text-xs text-secondary">Institution / University *</label>
              <input type="text" class="input input-sm bld-edu-inst" value="${escapeHtml(edu.institution || "")}" placeholder="IIT Bombay" />
            </div>
          </div>
          <div class="grid-3 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Dates / Years</label>
              <input type="text" class="input input-sm bld-edu-year" value="${escapeHtml(edu.year || edu.dates || "")}" placeholder="2021 – 2025" />
            </div>
            <div>
              <label class="text-xs text-secondary">Score / CGPA</label>
              <input type="text" class="input input-sm bld-edu-score" value="${escapeHtml(edu.score || edu.gpa || "")}" placeholder="8.9 / 10 CGPA" />
            </div>
            <div>
              <label class="text-xs text-secondary">Location</label>
              <input type="text" class="input input-sm bld-edu-loc" value="${escapeHtml(edu.location || "")}" placeholder="Mumbai, India" />
            </div>
          </div>
          <div class="mb-2">
            <label class="text-xs text-secondary">Specialization / Coursework</label>
            <input type="text" class="input input-sm bld-edu-spec" value="${escapeHtml(edu.specialization || edu.coursework || "")}" placeholder="Distributed Systems, Algorithms" />
          </div>
          <div>
            <label class="text-xs text-secondary">Highlights & Honors (one per line)</label>
            <textarea class="input input-sm bld-edu-bullets" rows="2" placeholder="• Secured Dean's Honors List&#10;• Led Technical Society">${escapeHtml(bulletsText)}</textarea>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".bld-delete-edu").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.education.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderEducationList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-edu-up").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.education, idx, -1);
        this.renderEducationList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-edu-down").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.education, idx, 1);
        this.renderEducationList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-item-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        const edu = this.profile.education[idx];
        if (!edu) return;
        this.hasUserEdits = true;
        edu.degree = card.querySelector(".bld-edu-degree")?.value || "";
        edu.institution = card.querySelector(".bld-edu-inst")?.value || "";
        edu.year = card.querySelector(".bld-edu-year")?.value || "";
        edu.dates = edu.year;
        edu.score = card.querySelector(".bld-edu-score")?.value || "";
        edu.gpa = edu.score;
        edu.location = card.querySelector(".bld-edu-loc")?.value || "";
        edu.specialization = card.querySelector(".bld-edu-spec")?.value || "";
        const rawBullets = card.querySelector(".bld-edu-bullets")?.value || "";
        edu.bullets = rawBullets.split("\n").map((b) => b.replace(/^[\s•·\-*]+/, "").trim()).filter(Boolean);
        this.debouncedRenderPreview();
      });
    });
  }

  renderExperienceList() {
    const listEl = document.getElementById("builderExperienceList");
    if (!listEl) return;

    if (!this.profile.workExperience || this.profile.workExperience.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No work experience added (optional for freshers). Click "+ Add Experience".</div>`;
      return;
    }

    listEl.innerHTML = this.profile.workExperience.map((exp, idx) => {
      const bullets = Array.isArray(exp.bullets) ? exp.bullets : (Array.isArray(exp.highlights) ? exp.highlights : []);
      const bulletsText = bullets.join("\n");
      return `
        <div class="card p-3 mb-2 bg-sunken builder-exp-card" data-idx="${idx}">
          <div class="flex-row justify-between mb-2">
            <span class="text-xs font-semibold text-primary">#${idx + 1} Experience Entry</span>
            <div class="d-flex items-center gap-1">
              <button type="button" class="bld-reorder-btn bld-exp-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move Up">▲</button>
              <button type="button" class="bld-reorder-btn bld-exp-down" data-idx="${idx}" ${idx === this.profile.workExperience.length - 1 ? "disabled" : ""} title="Move Down">▼</button>
              <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-exp" data-idx="${idx}">Delete</button>
            </div>
          </div>
          <div class="grid-2 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Designation / Role *</label>
              <input type="text" class="input input-sm bld-exp-role" value="${escapeHtml(exp.role || exp.designation || "")}" placeholder="Senior Software Engineer" />
            </div>
            <div>
              <label class="text-xs text-secondary">Company Name *</label>
              <input type="text" class="input input-sm bld-exp-comp" value="${escapeHtml(exp.company || "")}" placeholder="Razorpay" />
            </div>
          </div>
          <div class="grid-2 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Dates / Duration</label>
              <input type="text" class="input input-sm bld-exp-dur" value="${escapeHtml(exp.duration || exp.dates || "")}" placeholder="2022 – Present" />
            </div>
            <div>
              <label class="text-xs text-secondary">Location</label>
              <input type="text" class="input input-sm bld-exp-loc" value="${escapeHtml(exp.location || "")}" placeholder="Bengaluru, India" />
            </div>
          </div>
          <div class="mb-2">
            <label class="text-xs text-secondary">Role Overview (1-2 sentences)</label>
            <input type="text" class="input input-sm bld-exp-overview" value="${escapeHtml(exp.overview || "")}" placeholder="Led core payments orchestration service handling 45k TPS." />
          </div>
          <div>
            <label class="text-xs text-secondary">Impact Bullets (one per line, start with action verbs)</label>
            <textarea class="input input-sm bld-exp-bullets" rows="3" placeholder="• Scaled payment microservice to 50k req/min with 99.99% availability&#10;• Reduced p99 latency from 180ms to 42ms via Redis cluster">${escapeHtml(bulletsText)}</textarea>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".bld-delete-exp").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.workExperience.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderExperienceList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-exp-up").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.workExperience, idx, -1);
        this.renderExperienceList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-exp-down").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.workExperience, idx, 1);
        this.renderExperienceList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-exp-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        const exp = this.profile.workExperience[idx];
        if (!exp) return;
        this.hasUserEdits = true;
        exp.role = card.querySelector(".bld-exp-role")?.value || "";
        exp.company = card.querySelector(".bld-exp-comp")?.value || "";
        exp.duration = card.querySelector(".bld-exp-dur")?.value || "";
        exp.dates = exp.duration;
        exp.location = card.querySelector(".bld-exp-loc")?.value || "";
        exp.overview = card.querySelector(".bld-exp-overview")?.value || "";
        const rawBullets = card.querySelector(".bld-exp-bullets")?.value || "";
        const parsedBullets = rawBullets.split("\n").map((b) => b.replace(/^[\s•·\-*]+/, "").trim()).filter(Boolean);
        exp.bullets = parsedBullets;
        exp.highlights = parsedBullets;
        this.debouncedRenderPreview();
      });
    });
  }

  renderProjectsList() {
    const listEl = document.getElementById("builderProjectsList");
    if (!listEl) return;

    if (!this.profile.projects || this.profile.projects.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No projects added yet. Click "+ Add Project".</div>`;
      return;
    }

    listEl.innerHTML = this.profile.projects.map((proj, idx) => {
      const techStr = Array.isArray(proj.techStack)
        ? proj.techStack.join(", ")
        : (Array.isArray(proj.tech_stack) ? proj.tech_stack.join(", ") : (proj.technologies || ""));
      const bullets = Array.isArray(proj.bullets) ? proj.bullets : (proj.description ? [proj.description] : []);
      const bulletsText = bullets.join("\n");
      return `
        <div class="card p-3 mb-2 bg-sunken builder-proj-card" data-idx="${idx}">
          <div class="flex-row justify-between mb-2">
            <span class="text-xs font-semibold text-primary">#${idx + 1} Project Entry</span>
            <div class="d-flex items-center gap-1">
              <button type="button" class="bld-reorder-btn bld-proj-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move Up">▲</button>
              <button type="button" class="bld-reorder-btn bld-proj-down" data-idx="${idx}" ${idx === this.profile.projects.length - 1 ? "disabled" : ""} title="Move Down">▼</button>
              <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-proj" data-idx="${idx}">Delete</button>
            </div>
          </div>
          <div class="grid-2 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Project Title *</label>
              <input type="text" class="input input-sm bld-proj-title" value="${escapeHtml(proj.title || proj.name || "")}" placeholder="Distributed Cache Engine" />
            </div>
            <div>
              <label class="text-xs text-secondary">Technologies Used (comma separated)</label>
              <input type="text" class="input input-sm bld-proj-tech" value="${escapeHtml(techStr)}" placeholder="Python, FastAPI, Redis, Docker" />
            </div>
          </div>
          <div class="grid-3 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Dates / Period</label>
              <input type="text" class="input input-sm bld-proj-dates" value="${escapeHtml(proj.dates || "")}" placeholder="2024" />
            </div>
            <div>
              <label class="text-xs text-secondary">GitHub Link (optional)</label>
              <input type="text" class="input input-sm bld-proj-gh" value="${escapeHtml(proj.github_link || proj.github || "")}" placeholder="https://github.com/..." />
            </div>
            <div>
              <label class="text-xs text-secondary">Live Demo Link (optional)</label>
              <input type="text" class="input input-sm bld-proj-live" value="${escapeHtml(proj.live_link || proj.live || "")}" placeholder="https://demo.example.com" />
            </div>
          </div>
          <div>
            <label class="text-xs text-secondary">Project Bullets & Metrics (one per line)</label>
            <textarea class="input input-sm bld-proj-desc" rows="3" placeholder="• Built an in-memory key-value cache with LRU eviction supporting 5k req/sec&#10;• Reduced database read loads by 64% with cache-aside pattern">${escapeHtml(bulletsText)}</textarea>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".bld-delete-proj").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.projects.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderProjectsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-proj-up").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.projects, idx, -1);
        this.renderProjectsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-proj-down").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.projects, idx, 1);
        this.renderProjectsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-proj-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        const proj = this.profile.projects[idx];
        if (!proj) return;
        this.hasUserEdits = true;
        proj.title = card.querySelector(".bld-proj-title")?.value || "";
        proj.name = proj.title;
        const rawTech = card.querySelector(".bld-proj-tech")?.value || "";
        const techArr = rawTech.split(",").map((s) => s.trim()).filter(Boolean);
        proj.techStack = techArr;
        proj.tech_stack = techArr;
        proj.dates = card.querySelector(".bld-proj-dates")?.value || "";
        proj.github_link = card.querySelector(".bld-proj-gh")?.value || "";
        proj.live_link = card.querySelector(".bld-proj-live")?.value || "";
        const rawDesc = card.querySelector(".bld-proj-desc")?.value || "";
        const parsed = rawDesc.split("\n").map((b) => b.replace(/^[\s•·\-*]+/, "").trim()).filter(Boolean);
        proj.bullets = parsed;
        proj.description = parsed.join(". ");
        this.debouncedRenderPreview();
      });
    });
  }

  renderSkillsList() {
    const listEl = document.getElementById("builderSkillsList");
    if (!listEl) return;

    // Filter to detailed object skills
    const objSkills = this.profile.technicalSkills.filter((s) => typeof s === "object" && s !== null);

    if (objSkills.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No detailed skills with proficiency levels added yet. Click "+ Add Detailed Skill" or use the quick comma-separated box above.</div>`;
      return;
    }

    listEl.innerHTML = objSkills.map((sk, idx) => `
      <div class="card p-3 mb-2 bg-sunken builder-skill-item" data-idx="${idx}">
        <div class="bld-item-top-grid">
          <div class="min-w-0">
            <label class="text-xs text-secondary mb-05">Skill Name</label>
            <input type="text" class="input input-sm bld-skill-name" value="${escapeHtml(sk.name || "")}" placeholder="Python" />
          </div>
          <div class="min-w-0">
            <label class="text-xs text-secondary mb-05">Category</label>
            <select class="input input-sm bld-skill-cat w-100">
              <option value="Languages" ${sk.category === "Languages" ? "selected" : ""}>Languages</option>
              <option value="Frameworks" ${sk.category === "Frameworks" ? "selected" : ""}>Frameworks</option>
              <option value="Databases" ${sk.category === "Databases" ? "selected" : ""}>Databases</option>
              <option value="DevOps & Cloud" ${sk.category === "DevOps & Cloud" ? "selected" : ""}>DevOps & Cloud</option>
              <option value="Tools" ${sk.category === "Tools" ? "selected" : ""}>Tools</option>
            </select>
          </div>
          <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-skill bld-row-del" data-idx="${idx}" aria-label="Delete skill">✕</button>
        </div>
        <div class="bld-slider-row mt-2">
          <div class="d-flex justify-between items-center mb-05">
            <label class="text-xs text-secondary m-0">Level (${sk.level || 85}%)</label>
          </div>
          <input type="range" min="30" max="100" class="w-100 bld-skill-lvl" value="${sk.level || 85}" />
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll(".bld-delete-skill").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        let found = 0;
        for (let i = 0; i < this.profile.technicalSkills.length; i++) {
          if (typeof this.profile.technicalSkills[i] === "object") {
            if (found === idx) {
              this.profile.technicalSkills.splice(i, 1);
              break;
            }
            found++;
          }
        }
        this.hasUserEdits = true;
        this.renderSkillsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-skill-item").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", (e) => {
        let found = 0;
        let sk = null;
        for (let i = 0; i < this.profile.technicalSkills.length; i++) {
          if (typeof this.profile.technicalSkills[i] === "object") {
            if (found === idx) {
              sk = this.profile.technicalSkills[i];
              break;
            }
            found++;
          }
        }
        if (!sk) return;
        this.hasUserEdits = true;
        sk.name = card.querySelector(".bld-skill-name")?.value || "";
        sk.category = card.querySelector(".bld-skill-cat")?.value || "Languages";
        sk.level = parseInt(card.querySelector(".bld-skill-lvl")?.value || "85", 10);
        const lbl = card.querySelector("label:has(+ .bld-skill-lvl)") || card.querySelectorAll("label")[2];
        if (lbl) lbl.textContent = `Level (${sk.level}%)`;
        this.debouncedRenderPreview();
      });
    });
  }

  renderLanguagesList() {
    const listEl = document.getElementById("builderLangList");
    if (!listEl) return;

    if (!this.profile.languages || this.profile.languages.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No languages added yet. Click "+ Add Language".</div>`;
      return;
    }

    listEl.innerHTML = this.profile.languages.map((lang, idx) => {
      const name = typeof lang === "string" ? lang : (lang.name || "");
      const prof = typeof lang === "object" ? (lang.proficiency || "Fluent") : "Fluent";
      const lvl = typeof lang === "object" ? (lang.level || 90) : 90;
      return `
        <div class="card p-3 mb-2 bg-sunken builder-lang-card" data-idx="${idx}">
          <div class="bld-item-top-grid">
            <div class="min-w-0">
              <label class="text-xs text-secondary mb-05">Language</label>
              <input type="text" class="input input-sm bld-lang-name" value="${escapeHtml(name)}" placeholder="English" />
            </div>
            <div class="min-w-0">
              <label class="text-xs text-secondary mb-05">Proficiency</label>
              <select class="input input-sm bld-lang-prof w-100">
                <option value="Native / Bilingual" ${prof === "Native / Bilingual" ? "selected" : ""}>Native / Bilingual</option>
                <option value="Fluent" ${prof === "Fluent" ? "selected" : ""}>Fluent</option>
                <option value="Professional" ${prof === "Professional" ? "selected" : ""}>Professional</option>
                <option value="Intermediate" ${prof === "Intermediate" ? "selected" : ""}>Intermediate</option>
                <option value="Basic" ${prof === "Basic" ? "selected" : ""}>Basic</option>
              </select>
            </div>
            <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-lang bld-row-del" data-idx="${idx}" aria-label="Delete language">✕</button>
          </div>
          <div class="bld-slider-row mt-2">
            <div class="d-flex justify-between items-center mb-05">
              <label class="text-xs text-secondary m-0">Bar Level (${lvl}%)</label>
            </div>
            <input type="range" min="20" max="100" class="w-100 bld-lang-lvl" value="${lvl}" />
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".bld-delete-lang").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.languages.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderLanguagesList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-lang-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        const l = this.profile.languages[idx];
        if (!l) return;
        this.hasUserEdits = true;
        const name = card.querySelector(".bld-lang-name")?.value || "";
        const prof = card.querySelector(".bld-lang-prof")?.value || "Fluent";
        const lvl = parseInt(card.querySelector(".bld-lang-lvl")?.value || "90", 10);
        this.profile.languages[idx] = { name, proficiency: prof, level: lvl };
        this.debouncedRenderPreview();
      });
    });
  }

  renderCertificationsList() {
    const listEl = document.getElementById("builderCertList");
    if (!listEl) return;

    if (!this.profile.certifications || this.profile.certifications.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No certifications added. Click "+ Add Cert".</div>`;
      return;
    }

    listEl.innerHTML = this.profile.certifications.map((cert, idx) => {
      const name = typeof cert === "object" ? (cert.name || "") : cert;
      const issuer = typeof cert === "object" ? (cert.issuer || cert.organization || "") : "";
      const dateVal = typeof cert === "object" ? (cert.issue_date || cert.date || "") : "";
      const linkVal = typeof cert === "object" ? (cert.credential_link || "") : "";
      return `
        <div class="card p-3 mb-2 bg-sunken builder-cert-card" data-idx="${idx}">
          <div class="flex-row justify-between mb-2">
            <span class="text-xs font-semibold text-primary">#${idx + 1} Certification</span>
            <div class="d-flex items-center gap-1">
              <button type="button" class="bld-reorder-btn bld-cert-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move Up">▲</button>
              <button type="button" class="bld-reorder-btn bld-cert-down" data-idx="${idx}" ${idx === this.profile.certifications.length - 1 ? "disabled" : ""} title="Move Down">▼</button>
              <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-cert" data-idx="${idx}">Delete</button>
            </div>
          </div>
          <div class="grid-2 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Certification Name</label>
              <input type="text" class="input input-sm bld-cert-name" value="${escapeHtml(name)}" placeholder="AWS Solutions Architect" />
            </div>
            <div>
              <label class="text-xs text-secondary">Issuing Organization</label>
              <input type="text" class="input input-sm bld-cert-issuer" value="${escapeHtml(issuer)}" placeholder="Amazon Web Services" />
            </div>
          </div>
          <div class="grid-2 gap-2">
            <div>
              <label class="text-xs text-secondary">Issue Date</label>
              <input type="text" class="input input-sm bld-cert-date" value="${escapeHtml(dateVal)}" placeholder="2024" />
            </div>
            <div>
              <label class="text-xs text-secondary">Credential Link</label>
              <input type="text" class="input input-sm bld-cert-link" value="${escapeHtml(linkVal)}" placeholder="https://..." />
            </div>
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".bld-delete-cert").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.certifications.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderCertificationsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-cert-up").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.certifications, idx, -1);
        this.renderCertificationsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-cert-down").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.certifications, idx, 1);
        this.renderCertificationsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-cert-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        this.hasUserEdits = true;
        this.profile.certifications[idx] = {
          name: card.querySelector(".bld-cert-name")?.value || "",
          issuer: card.querySelector(".bld-cert-issuer")?.value || "",
          issue_date: card.querySelector(".bld-cert-date")?.value || "",
          credential_link: card.querySelector(".bld-cert-link")?.value || "",
        };
        this.debouncedRenderPreview();
      });
    });
  }

  renderAchievementsList() {
    const listEl = document.getElementById("builderAchList");
    if (!listEl) return;

    if (!this.profile.achievements || this.profile.achievements.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No achievements added. Click "+ Add Achievement".</div>`;
      return;
    }

    listEl.innerHTML = this.profile.achievements.map((ach, idx) => {
      const title = typeof ach === "object" ? (ach.title || "") : ach;
      const desc = typeof ach === "object" ? (ach.description || "") : "";
      const dateVal = typeof ach === "object" ? (ach.date || "") : "";
      return `
        <div class="card p-3 mb-2 bg-sunken builder-ach-card" data-idx="${idx}">
          <div class="flex-row justify-between mb-2">
            <span class="text-xs font-semibold text-primary">#${idx + 1} Achievement</span>
            <div class="d-flex items-center gap-1">
              <button type="button" class="bld-reorder-btn bld-ach-up" data-idx="${idx}" ${idx === 0 ? "disabled" : ""} title="Move Up">▲</button>
              <button type="button" class="bld-reorder-btn bld-ach-down" data-idx="${idx}" ${idx === this.profile.achievements.length - 1 ? "disabled" : ""} title="Move Down">▼</button>
              <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-ach" data-idx="${idx}">Delete</button>
            </div>
          </div>
          <div class="grid-2 gap-2 mb-2">
            <div>
              <label class="text-xs text-secondary">Title</label>
              <input type="text" class="input input-sm bld-ach-title" value="${escapeHtml(title)}" placeholder="Smart India Hackathon Finalist" />
            </div>
            <div>
              <label class="text-xs text-secondary">Date / Year</label>
              <input type="text" class="input input-sm bld-ach-date" value="${escapeHtml(dateVal)}" placeholder="2024" />
            </div>
          </div>
          <div>
            <label class="text-xs text-secondary">Description</label>
            <input type="text" class="input input-sm bld-ach-desc" value="${escapeHtml(desc)}" placeholder="Ranked top 5 out of 1,500 teams nationwide..." />
          </div>
        </div>
      `;
    }).join("");

    listEl.querySelectorAll(".bld-delete-ach").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.achievements.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderAchievementsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-ach-up").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.achievements, idx, -1);
        this.renderAchievementsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".bld-ach-down").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.moveItem(this.profile.achievements, idx, 1);
        this.renderAchievementsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-ach-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        this.hasUserEdits = true;
        this.profile.achievements[idx] = {
          title: card.querySelector(".bld-ach-title")?.value || "",
          date: card.querySelector(".bld-ach-date")?.value || "",
          description: card.querySelector(".bld-ach-desc")?.value || "",
        };
        this.debouncedRenderPreview();
      });
    });
  }

  renderReferencesList() {
    const listEl = document.getElementById("builderRefList");
    if (!listEl) return;

    if (!this.profile.references || this.profile.references.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No professional references added. Click "+ Add Reference".</div>`;
      return;
    }

    listEl.innerHTML = this.profile.references.map((ref, idx) => `
      <div class="card p-2 mb-2 bg-sunken builder-ref-card" data-idx="${idx}">
        <div class="flex-row justify-between mb-1">
          <span class="text-xs font-semibold text-primary">#${idx + 1} Reference</span>
          <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-ref" data-idx="${idx}">✕</button>
        </div>
        <div class="grid-2 gap-2 mb-1">
          <input type="text" class="input input-sm bld-ref-name" value="${escapeHtml(ref.name || "")}" placeholder="Full Name" />
          <input type="text" class="input input-sm bld-ref-title" value="${escapeHtml(ref.title || "")}" placeholder="Title / Role (e.g. VP Engineering)" />
        </div>
        <div class="grid-2 gap-2">
          <input type="text" class="input input-sm bld-ref-comp" value="${escapeHtml(ref.company || "")}" placeholder="Company / University" />
          <input type="text" class="input input-sm bld-ref-contact" value="${escapeHtml(ref.contact || "")}" placeholder="Contact (Email / Phone)" />
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll(".bld-delete-ref").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.references.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderReferencesList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-ref-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        this.hasUserEdits = true;
        this.profile.references[idx] = {
          name: card.querySelector(".bld-ref-name")?.value || "",
          title: card.querySelector(".bld-ref-title")?.value || "",
          company: card.querySelector(".bld-ref-comp")?.value || "",
          contact: card.querySelector(".bld-ref-contact")?.value || "",
        };
        this.debouncedRenderPreview();
      });
    });
  }

  renderPublicationsList() {
    const listEl = document.getElementById("builderPubList");
    if (!listEl) return;

    const pubs = this.profile.additionalInfo?.publications || [];
    if (pubs.length === 0) {
      listEl.innerHTML = `<div class="text-xs text-tertiary p-2 text-center border-dashed">No publications added (optional). Click "+ Add Publication".</div>`;
      return;
    }

    listEl.innerHTML = pubs.map((pub, idx) => `
      <div class="card p-3 mb-2 bg-sunken builder-pub-card" data-idx="${idx}">
        <div class="flex-row justify-between mb-2">
          <span class="text-xs font-semibold text-primary">#${idx + 1} Publication</span>
          <button type="button" class="btn btn-ghost btn-xs text-danger bld-delete-pub" data-idx="${idx}">Delete</button>
        </div>
        <div class="mb-2">
          <label class="text-xs text-secondary">Paper / Book Title</label>
          <input type="text" class="input input-sm bld-pub-title" value="${escapeHtml(pub.title || "")}" placeholder="Attention Mechanisms for..." />
        </div>
        <div class="grid-3 gap-2">
          <div>
            <label class="text-xs text-secondary">Journal / Conference</label>
            <input type="text" class="input input-sm bld-pub-pub" value="${escapeHtml(pub.publisher || pub.journal || "")}" placeholder="IEEE Big Data" />
          </div>
          <div>
            <label class="text-xs text-secondary">Year</label>
            <input type="text" class="input input-sm bld-pub-year" value="${escapeHtml(pub.year || "")}" placeholder="2024" />
          </div>
          <div>
            <label class="text-xs text-secondary">Link / DOI</label>
            <input type="text" class="input input-sm bld-pub-link" value="${escapeHtml(pub.link || "")}" placeholder="https://doi.org/..." />
          </div>
        </div>
      </div>
    `).join("");

    listEl.querySelectorAll(".bld-delete-pub").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.idx, 10);
        this.profile.additionalInfo.publications.splice(idx, 1);
        this.hasUserEdits = true;
        this.renderPublicationsList();
        this.renderPreview();
      });
    });

    listEl.querySelectorAll(".builder-pub-card").forEach((card) => {
      const idx = parseInt(card.dataset.idx, 10);
      card.addEventListener("input", () => {
        this.hasUserEdits = true;
        this.profile.additionalInfo.publications[idx] = {
          title: card.querySelector(".bld-pub-title")?.value || "",
          publisher: card.querySelector(".bld-pub-pub")?.value || "",
          year: card.querySelector(".bld-pub-year")?.value || "",
          link: card.querySelector(".bld-pub-link")?.value || "",
        };
        this.debouncedRenderPreview();
      });
    });
  }

  renderTemplateGallery() {
    if (this.carousels.landing) this.carousels.landing.renderCards();
    if (!document.getElementById("builderWorkspaceGallery")?.classList.contains("hidden")) {
      this.renderTemplateGrid();
    }
  }

  // ------------------------------------------------------------------
  // Live A4 Preview
  // ------------------------------------------------------------------
  renderPreview() {
    const doc = document.getElementById("builderLivePreviewDoc");
    if (!doc) return;
    doc.innerHTML = renderResume(this.profile, this.selectedTemplate, { accent: this.accent });
    this.updatePageBreaks();
    this.fitPreview();
  }

  updatePageBreaks() {
    const wrap = document.getElementById("builderPreviewPaper");
    const doc = document.getElementById("builderLivePreviewDoc");
    if (!wrap || !doc) return;
    wrap.querySelectorAll(".bld-pagebreak").forEach((n) => n.remove());
    const page = doc.firstElementChild;
    const h = page ? page.scrollHeight : PAGE_H;
    const pages = Math.max(1, Math.ceil((h - 4) / PAGE_H));
    for (let i = 1; i < pages; i += 1) {
      const line = document.createElement("div");
      line.className = "bld-pagebreak";
      line.style.top = `${i * PAGE_H}px`;
      line.innerHTML = `<span>Page ${i + 1} starts here</span>`;
      wrap.appendChild(line);
    }
    const count = document.getElementById("builderPageCount");
    if (count) {
      count.textContent = pages === 1 ? "1 page" : `${pages} pages`;
      count.classList.toggle("warn", pages > 1);
      count.title = pages > 1 ? "Most recruiters prefer a single page — consider trimming bullets or picking a denser template." : "";
    }
  }

  fitPreview() {
    const wrap = document.getElementById("builderPreviewPaper");
    const viewport = document.getElementById("builderPreviewViewport");
    if (!wrap || !viewport) return;
    let z = parseFloat(this.zoomMode);
    if (this.zoomMode === "fit" || Number.isNaN(z)) {
      const avail = viewport.clientWidth - 16;
      z = avail > 0 ? Math.min(1, avail / 794) : 0.85;
    }
    wrap.style.zoom = "";
    wrap.style.width = "794px";
    wrap.style.transformOrigin = "top left";
    wrap.style.transform = `scale(${z.toFixed(5)})`;
    const naturalH = Math.max(wrap.scrollHeight || 1123, 1123);
    wrap.style.marginBottom = `${Math.round(naturalH * (z - 1))}px`;
    wrap.style.marginRight = `${Math.round(794 * (z - 1))}px`;
  }

  showToast(msg, type = "info") {
    if (typeof window.showToast === "function") {
      window.showToast(msg, type);
    } else {
      console.log(`[Toast ${type}]: ${msg}`);
    }
  }
}

export const builderModule = new ResumeBuilderModule();
