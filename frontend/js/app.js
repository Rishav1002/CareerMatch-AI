
function openAuthModal() {
  const el = document.getElementById("authModalBackdrop");
  if (!el) return;
  el.classList.remove("hidden");
  el.style.display = "flex";
}

function closeAuthModal() {
  const el = document.getElementById("authModalBackdrop");
  if (!el) return;
  el.classList.add("hidden");
  el.style.display = "none";
}

/**
 * CareerMatch AI — Unified Frontend Controller
 * Preserves 100% of existing Resume & Role Analyzer workflows while powering
 * all 11 SaaS Views, JWT Authentication, Dark/Light Theme Toggle, and the
 * 8 Advanced Career Intelligence Modules.
 */

const state = {
  demos: [],
  roles: [],
  activeResume: null,
  activeJob: null,
  analysisResult: null,
  selectedNodeId: null,
  completedNodes: {},
  simulatedSkills: new Set(),
  courseFilter: "All",
  customWeights: {
    mandatorySkills: 0.60,
    preferredSkills: 0.15,
    projectsExperience: 0.15,
    education: 0.05,
    certifications: 0.05,
  },
  sampleJdText: "",
  dontSaveResume: false,
  // CareerMatch AI State
  activeView: "overview",
  jwtToken: localStorage.getItem("cm_jwt_token") || "",
  studentProfile: null,
  authMode: "login",
  atsReportData: null,
  interviewSession: null,
  interviewTimerInterval: null,
  interviewSecondsElapsed: 0,
  adaptiveRoadmapData: null,
  activeAssessment: null,
  priReportData: null,
};

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const item = document.createElement("div");
  item.className = "toast-item";
  item.textContent = message;
  container.appendChild(item);
  setTimeout(() => {
    item.remove();
  }, 3400);
}

function authHeaders() {
  const h = { "Content-Type": "application/json" };
  if (state.jwtToken) {
    h["Authorization"] = `Bearer ${state.jwtToken}`;
  }
  return h;
}

function startApp() {
  if (window.__cmAppStarted) return;
  window.__cmAppStarted = true;
  initNavigationAndTheme();
  initEventListeners();
  initCareerMatch2Listeners();
  bootstrapApplication();
}

if (window.__cmBooted) {
  startApp();
} else {
  window.addEventListener("careermatch:booted", startApp, { once: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => { if (!window.__cmAppStarted) startApp(); }, 400);
    });
  } else {
    setTimeout(() => { if (!window.__cmAppStarted) startApp(); }, 400);
  }
}

function normalizeCourse(raw) {
  const c = raw || {};
  const pricingType = c.pricingType || (String(c.priceNote || "").toLowerCase().includes("free") ? "Free" : "Paid");
  const provider = String(c.provider || c.platform || c.instructorOrOrg || "").trim();
  const instructorOrOrg = String(c.instructorOrOrg || c.platform || c.provider || "").trim();
  const priceDetail = String(
    c.priceDetail || c.priceNote || (pricingType === "Free" ? "100% Free" : "Paid Certificate")
  ).trim();
  const duration = String(c.duration || "Self-paced").trim();
  const title = String(c.title || "Recommended Course").trim();
  const skillFocus = String(c.skillFocus || "Core Skill").trim();
  const whyViable = String(c.whyViable || "").trim();
  const url = String(c.url || "https://roadmap.sh/").trim();

  return {
    title,
    provider,
    instructorOrOrg: instructorOrOrg && instructorOrOrg !== provider ? instructorOrOrg : "",
    pricingType,
    priceDetail,
    duration,
    skillFocus,
    whyViable,
    url,
  };
}

function updateAnalyzerMiniCards() {
  const candEl = document.getElementById("miniCardCandidate");
  const candSubEl = document.getElementById("miniCardCandidateSub");
  const roleEl = document.getElementById("miniCardRole");
  const compEl = document.getElementById("miniCardCompany");

  if (candEl) {
    candEl.textContent = state.activeResume?.contact?.name || "Not selected";
  }
  if (candSubEl) {
    const skCount = state.activeResume?.technicalSkills?.length || 0;
    candSubEl.textContent = state.activeResume ? `${skCount} skills extracted` : "Upload your resume to begin";
  }

  const roleSelectEl = document.getElementById("targetRoleSelect");
  const customRoleContainer = document.getElementById("customRoleInputContainer");
  if (customRoleContainer && roleSelectEl) {
    customRoleContainer.style.display = roleSelectEl.value === "Other" ? "block" : "none";
  }

  let roleVal = roleSelectEl?.value || "Full Stack Developer";
  if (roleVal === "Other") {
    const customInp = document.getElementById("customRoleInput")?.value?.trim();
    roleVal = customInp || "Custom Role";
  }
  if (roleEl) roleEl.textContent = roleVal;

  const compVal = document.getElementById("goalCompanyInput")?.value?.trim() || "Any company";
  if (compEl) compEl.textContent = compVal;

  const banner = document.getElementById("toolkitNoResumeBanner");
  if (banner) {
    banner.classList.toggle("hidden", Boolean(state.activeResume));
  }
}

function switchProfileSubTab(subTab) {
  const isAccount = subTab === "account";
  document.getElementById("profileInnerTabBtn")?.classList.toggle("active", !isAccount);
  document.getElementById("accountInnerTabBtn")?.classList.toggle("active", isAccount);
  document.getElementById("profileSubTabPanel")?.classList.toggle("hidden", isAccount);
  document.getElementById("accountSubTabPanel")?.classList.toggle("hidden", !isAccount);
}

function switchReportTab(tabId) {
  if (!tabId) return;
  document.querySelectorAll("[data-report-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-report-tab") === tabId);
  });
  document.querySelectorAll(".report-tab-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.id !== tabId);
  });
  if (tabId === "sec-roles") {
    loadCareerComparison(false);
  }
}

function switchWorkspaceView(viewName, scrollToToolkit = false) {
  if (!viewName) return;
  if (window.__careermatch && window.__careermatch.router) {
    const route = window.__careermatch.router.getRoute(viewName);
    const target = route ? route.id : viewName;
    window.__careermatch.router.navigate(target);
  } else {
    window.location.hash = `#/${viewName}`;
  }
}

function initNavigationAndTheme() {
  // Smooth scroll links
  document.querySelectorAll("[data-scroll-target]").forEach((el) => {
    el.addEventListener("click", (e) => {
      const targetSel = el.getAttribute("data-scroll-target");
      const targetEl = targetSel ? document.querySelector(targetSel) : null;
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth" });
        document.getElementById("mobileDrawer")?.classList.remove("open");
      }
    });
  });

  // Tools dropdown in sticky pill navbar
  const toolsBtn = document.getElementById("toolsDropdownBtn");
  const toolsMenu = document.getElementById("toolsDropdownMenu");
  if (toolsBtn && toolsMenu) {
    toolsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = toolsMenu.classList.toggle("hidden");
      toolsBtn.setAttribute("aria-expanded", String(!isHidden));
    });
    document.addEventListener("click", (e) => {
      if (!toolsMenu.contains(e.target) && e.target !== toolsBtn) {
        toolsMenu.classList.add("hidden");
        toolsBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Dropdown & mobile drawer toolkit links
  document.querySelectorAll("[data-toolkit-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const v = el.getAttribute("data-toolkit-open");
      switchWorkspaceView(v, true);
    });
  });

  // Toolkit tab strip buttons
  document.querySelectorAll("[data-toolkit-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-toolkit-tab");
      switchWorkspaceView(v, false);
    });
  });

  // Career Report 5 tabs
  document.querySelectorAll("[data-report-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-report-tab");
      switchReportTab(tabId);
    });
  });

  document.querySelectorAll("[data-nav-view], [data-jump-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const v = el.getAttribute("data-nav-view") || el.getAttribute("data-jump-view");
      switchWorkspaceView(v, true);
    });
  });

  document.querySelectorAll("[data-profile-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchProfileSubTab(btn.getAttribute("data-profile-tab"));
    });
  });
}

// ============================================================================
// BOOTSTRAP APPLICATION (Guest by default — no auto-login, no auto-analysis)
// ============================================================================

async function bootstrapApplication() {
  try {
    let res = await fetch("/api/bootstrap", { headers: authHeaders() });
    if (res.status === 401) {
      state.jwtToken = "";
      localStorage.removeItem("cm_jwt_token");
      res = await fetch("/api/bootstrap");
    }
    if (!res.ok) throw new Error("Failed to bootstrap application");
    const data = await res.json();

    state.demos = data.demos || [];
    state.roles = data.roles || [];
    state.sampleJdText = data.sampleJdText || "";
    state.studentProfile = data.studentProfile || null;

    if (data.defaultWeights) {
      state.customWeights = { ...data.defaultWeights };
    }

    renderDashboardMetrics(data.dashboard);
    syncStudentProfileSidebar();
    updateAnalyzerMiniCards();
    renderEmptyReadinessPlaceholders();
  } catch (err) {
    showErrorBanner("Could not connect to backend server: " + err.message);
  }
}

function renderEmptyReadinessPlaceholders() {
  if (state.activeResume) return;
  const ids = ["ovPriScore", "ovTechScore", "ovAtsScore", "ovMarketScore", "priBigScore"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = "—";
  });
  const tierEl = document.getElementById("ovPriTier");
  if (tierEl) tierEl.textContent = "Analyze a resume to see this";
  const roleLbl = document.getElementById("ovTargetRoleLabel");
  if (roleLbl) roleLbl.textContent = "Analyze a resume to see this";
  const priBadge = document.getElementById("priTierBadge");
  if (priBadge) priBadge.textContent = "Analyze a resume to see this";
}

function syncStudentProfileSidebar() {
  const p = state.studentProfile;
  const topBtn = document.getElementById("openAuthModalBtn");
  const ghInput = document.getElementById("githubUsernameInput");
  const statusEl = document.getElementById("authCurrentStatusText");

  if (!p) {
    if (topBtn) topBtn.textContent = "Sign in";
    if (statusEl) statusEl.textContent = "Guest session (not signed in)";
    return;
  }

  if (topBtn) topBtn.textContent = p.fullName || "Account";
  if (statusEl) statusEl.textContent = `Signed in as ${p.fullName} (${p.email || "student"})`;
  if (ghInput && p.githubUsername && p.githubUsername !== "tiangolo") {
    ghInput.value = p.githubUsername;
  }
}

// ============================================================================
// EXISTING EVENT LISTENERS (100% PRESERVED)
// ============================================================================

function initEventListeners() {
  const mobileBtn = document.getElementById("mobileMenuBtn");
  const mobileDrawer = document.getElementById("mobileDrawer");
  if (mobileBtn && mobileDrawer) {
    mobileBtn.addEventListener("click", () => {
      mobileDrawer.classList.toggle("open");
    });
  }

  document.querySelectorAll("[data-demo-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = parseInt(btn.getAttribute("data-demo-index"), 10);
      document.querySelectorAll("[data-demo-index]").forEach((b) => {
        b.classList.toggle("active", parseInt(b.getAttribute("data-demo-index"), 10) === idx);
      });
      selectDemoResume(idx, true);
    });
  });

  document.getElementById("targetRoleSelect")?.addEventListener("change", updateAnalyzerMiniCards);
  document.getElementById("customRoleInput")?.addEventListener("input", updateAnalyzerMiniCards);
  document.getElementById("goalCompanyInput")?.addEventListener("input", updateAnalyzerMiniCards);

  const quickRoleSel = document.getElementById("reportQuickRoleSelect");
  if (quickRoleSel) {
    quickRoleSel.addEventListener("change", () => {
      const mainSel = document.getElementById("targetRoleSelect");
      if (mainSel) mainSel.value = quickRoleSel.value;
      updateAnalyzerMiniCards();
      runFullAnalysis(true);
    });
  }

  const topicBtn = document.getElementById("courseTopicSearchBtn");
  const topicInp = document.getElementById("courseTopicSearchInput");
  if (topicBtn && topicInp) {
    const triggerTopicUpdate = () => {
      const val = topicInp.value.trim();
      const focusEl = document.getElementById("customFocusInput");
      if (focusEl && val) focusEl.value = val;
      if (state.activeResume) {
        runFullAnalysis(false);
      }
    };
    topicBtn.addEventListener("click", triggerTopicUpdate);
    topicInp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        triggerTopicUpdate();
      }
    });
  }

  document.getElementById("printReportBtn")?.addEventListener("click", () => {
    window.print();
  });

  document.getElementById("downloadReportJsonBtn")?.addEventListener("click", () => {
    if (!state.analysisResult) return;
    const blob = new Blob([JSON.stringify(state.analysisResult, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (state.activeResume?.contact?.name || "Candidate").replace(/\s+/g, "_");
    a.download = `${name}_Career_Report.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Downloaded Career Report (.json)");
  });

  const fileInput = document.getElementById("resumeFileInput");
  const dropZone = document.getElementById("uploadDropZone");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleFileUpload(file);
    });
    fileInput.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }
  if (dropZone) {
    dropZone.addEventListener("click", () => {
      if (fileInput) fileInput.click();
    });
    dropZone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });
    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });
    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });
    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  const parseTextBtn = document.getElementById("parseTextBtn");
  if (parseTextBtn) {
    parseTextBtn.addEventListener("click", handlePastedResumeParse);
  }

  const sampleJdBtn = document.getElementById("loadSampleJdBtn");
  if (sampleJdBtn) {
    sampleJdBtn.addEventListener("click", () => {
      const jdInput = document.getElementById("customJdInput");
      const roleSelect = document.getElementById("targetRoleSelect");
      if (jdInput && state.sampleJdText) {
        jdInput.value = state.sampleJdText;
      }
      if (roleSelect) {
        roleSelect.value = "Data Engineer";
      }
      updateAnalyzerMiniCards();
      if (state.activeResume) {
        runFullAnalysis(true);
      } else {
        showToast("Loaded sample Data Engineer JD. Upload or select a sample resume to analyze.");
      }
    });
  }

  const dontSaveCheck = document.getElementById("dontSaveCheckbox");
  if (dontSaveCheck) {
    dontSaveCheck.addEventListener("change", (e) => {
      state.dontSaveResume = Boolean(e.target.checked);
    });
  }

  const runBtn = document.getElementById("runAnalysisBtn");
  if (runBtn && !runBtn.__cm_bound_click) {
    runBtn.__cm_bound_click = true;
    runBtn.addEventListener("click", () => runFullAnalysis(true));
  }

  const clearHlBtn = document.getElementById("clearEvidenceHighlightBtn");
  if (clearHlBtn) {
    clearHlBtn.addEventListener("click", () => {
      clearResumeHighlights();
      clearHlBtn.classList.add("hidden");
    });
  }

  const evFilterInput = document.getElementById("evidenceSkillFilterInput");
  if (evFilterInput) {
    evFilterInput.addEventListener("input", () => {
      if (state.analysisResult) {
        renderEvidenceAndGapsTab(state.analysisResult);
      }
    });
  }

  document.querySelectorAll(".filter-pill[data-course-filter]").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill[data-course-filter]").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      state.courseFilter = pill.getAttribute("data-course-filter");
      if (state.analysisResult) {
        renderCoursesGrid(state.analysisResult.advisor.viableCourses);
      }
    });
  });

  const inspCheck = document.getElementById("inspCompleteCheckbox");
  if (inspCheck) {
    inspCheck.addEventListener("change", async (e) => {
      if (!state.selectedNodeId || !state.analysisResult) return;
      state.completedNodes[state.selectedNodeId] = e.target.checked;
      renderRoadmapTree(state.analysisResult.roadmapNodes);

      if (!state.dontSaveResume && state.activeResume && state.activeJob) {
        try {
          await fetch("/api/roadmap/progress", {
            method: "PUT",
            headers: authHeaders(),
            body: JSON.stringify({
              resumeId: state.activeResume.id,
              targetRole: state.activeJob.title,
              completedNodes: state.completedNodes,
            }),
          });
        } catch (_err) {
          // Ignore network error for local toggle
        }
      }
    });
  }

  const wMand = document.getElementById("weightMandatoryInput");
  const wPref = document.getElementById("weightPreferredInput");
  const wProj = document.getElementById("weightProjectsInput");

  const updateSliderLabels = () => {
    if (wMand) document.getElementById("weightMandatoryVal").textContent = wMand.value + "%";
    if (wPref) document.getElementById("weightPreferredVal").textContent = wPref.value + "%";
    if (wProj) document.getElementById("weightProjectsVal").textContent = wProj.value + "%";
  };
  [wMand, wPref, wProj].forEach((el) => {
    if (el) el.addEventListener("input", updateSliderLabels);
  });

  const recalcBtn = document.getElementById("recalculateWeightsBtn");
  if (recalcBtn) {
    recalcBtn.addEventListener("click", () => {
      state.customWeights = {
        mandatorySkills: parseInt(wMand.value, 10) / 100,
        preferredSkills: parseInt(wPref.value, 10) / 100,
        projectsExperience: parseInt(wProj.value, 10) / 100,
        education: 0.05,
        certifications: 0.05,
      };
      runFullAnalysis(false);
    });
  }

  const resetWBtn = document.getElementById("resetWeightsBtn");
  if (resetWBtn) {
    resetWBtn.addEventListener("click", () => {
      if (wMand) wMand.value = 60;
      if (wPref) wPref.value = 15;
      if (wProj) wProj.value = 15;
      updateSliderLabels();
      state.customWeights = {
        mandatorySkills: 0.60,
        preferredSkills: 0.15,
        projectsExperience: 0.15,
        education: 0.05,
        certifications: 0.05,
      };
      runFullAnalysis(false);
    });
  }

  const addSkillBtn = document.getElementById("addSkillBtn");
  const newSkillInput = document.getElementById("newSkillInput");
  if (addSkillBtn && newSkillInput) {
    addSkillBtn.addEventListener("click", () => {
      const val = newSkillInput.value.trim();
      if (!val || !state.activeResume) return;
      if (!state.activeResume.technicalSkills.includes(val)) {
        state.activeResume.technicalSkills.push(val);
        renderParsedResumePreview(state.activeResume);
        renderEditableSkillsTab(state.activeResume);
      }
      newSkillInput.value = "";
    });
  }

  const saveSkillsBtn = document.getElementById("saveSkillsBtn");
  if (saveSkillsBtn) {
    saveSkillsBtn.addEventListener("click", async () => {
      if (!state.activeResume) return;
      try {
        await fetch("/api/resume/skills", {
          method: "PUT",
          headers: authHeaders(),
          body: JSON.stringify({
            resumeId: state.activeResume.id,
            skills: state.activeResume.technicalSkills,
          }),
        });
      } catch (_e) {
        // Proceed with analysis even if local skill save is skipped
      }
      await runFullAnalysis(true);
    });
  }
}

function selectDemoResume(index, triggerAnalysis = false) {
  if (!state.demos[index]) return;
  state.activeResume = JSON.parse(JSON.stringify(state.demos[index]));
  window.dispatchEvent(new CustomEvent("cm:resume-changed", { detail: state.activeResume }));
  renderParsedResumePreview(state.activeResume);
  hideErrorBanner();

  const roleSelect = document.getElementById("targetRoleSelect");
  if (roleSelect) {
    if (index === 0) roleSelect.value = "Full Stack Developer";
    if (index === 1) roleSelect.value = "Machine Learning Engineer";
    if (index === 2) roleSelect.value = "Java Developer";
  }
  updateAnalyzerMiniCards();

  if (triggerAnalysis) {
    runFullAnalysis(false);
  }
}

async function handleFileUpload(file) {
  const statusEl = document.getElementById("uploadStatusText");
  const fileInput = document.getElementById("resumeFileInput");
  if (fileInput) fileInput.value = "";
  if (statusEl) statusEl.textContent = `Parsing ${file.name}...`;
  hideErrorBanner();

  try {
    const base64Data = await readFileAsDataURL(file);
    const res = await fetch("/api/resume/parse", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        filename: file.name,
        base64Data,
        dontSave: state.dontSaveResume,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to parse file");

    state.activeResume = data.resume;
    window.dispatchEvent(new CustomEvent("cm:resume-changed", { detail: state.activeResume }));
    renderParsedResumePreview(state.activeResume);
    updateAnalyzerMiniCards();
    if (data.dashboard) renderDashboardMetrics(data.dashboard);
    if (statusEl) statusEl.textContent = `Parsed: ${file.name}`;
    showToast(`Parsed ${file.name} (${(state.activeResume.technicalSkills || []).length} skills detected)`);
    await runFullAnalysis(false);
  } catch (err) {
    if (statusEl) statusEl.textContent = "Click to upload or drag & drop";
    showErrorBanner(err.message);
  }
}

async function handlePastedResumeParse() {
  const textEl = document.getElementById("pastedResumeInput");
  const raw = textEl ? textEl.value.trim() : "";
  if (raw.length < 20) {
    showErrorBanner("Please paste at least 20 characters of resume text.");
    return;
  }
  hideErrorBanner();

  try {
    const res = await fetch("/api/resume/parse", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        filename: "Pasted_Resume.txt",
        pastedText: raw,
        dontSave: state.dontSaveResume,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to parse pasted text");

    state.activeResume = data.resume;
    window.dispatchEvent(new CustomEvent("cm:resume-changed", { detail: state.activeResume }));
    renderParsedResumePreview(state.activeResume);
    updateAnalyzerMiniCards();
    if (data.dashboard) renderDashboardMetrics(data.dashboard);
    showToast("Extracted skills from pasted resume text");
    await runFullAnalysis(false);
  } catch (err) {
    showErrorBanner(err.message);
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

function renderParsedResumePreview(resume) {
  if (!resume) return;

  const nameEl = document.getElementById("parsedCandidateName");
  if (nameEl) {
    nameEl.textContent = resume.contact?.name || "Candidate";
  }

  const degreeEl = document.getElementById("parsedResumeDegree");
  const edu = resume.education?.[0];
  const degreeText = edu
    ? `${edu.degree || "Degree"} · ${edu.institution || "Institution"}`
    : resume.summary || "Resume Profile";
  if (degreeEl) {
    degreeEl.textContent = degreeText;
  }

  const skills = resume.technicalSkills || [];
  const countBadge = document.getElementById("parsedSkillsCountBadge");
  if (countBadge) {
    countBadge.textContent = `${skills.length} Skills Found`;
  }

  const badgesContainer = document.getElementById("parsedSkillBadges");
  if (badgesContainer) {
    badgesContainer.innerHTML = skills
      .map((s) => `<span class="tag tag-match">${escapeHtml(s)}</span>`)
      .join("");
  }

  const metaRow = document.getElementById("parsedMetaRow");
  if (metaRow) {
    const projCount = (resume.projects || []).length;
    const certCount = (resume.certifications || []).length;
    metaRow.innerHTML = `
      <span>📄 ${escapeHtml(resume.filename || "Resume.pdf")}</span>
      <span>🛠️ ${projCount} Project(s)</span>
      <span>🏅 ${certCount} Certification(s)</span>
    `;
  }

  const previewCard = document.getElementById("parsedResumeMeta");
  if (previewCard) {
    previewCard.style.display = "block";
    previewCard.classList.remove("hidden");
  }

  updateAnalyzerMiniCards();
}

async function runFullAnalysis(persistRecord = true) {
  if (!state.activeResume) {
    showErrorBanner("Please select or upload a resume first.");
    return;
  }

  const runBtn = document.getElementById("runAnalysisBtn");
  const originalText = runBtn ? runBtn.textContent : "";
  if (runBtn) {
    runBtn.disabled = true;
    runBtn.textContent = "Generating career report...";
  }
  hideErrorBanner();

  const progBox = document.getElementById("analysisProgressBox");
  const s1 = document.getElementById("pStep1");
  const s2 = document.getElementById("pStep2");
  const s3 = document.getElementById("pStep3");
  let stepTimer1 = null;
  let stepTimer2 = null;

  if (progBox && s1 && s2 && s3) {
    progBox.classList.remove("hidden");
    s1.className = "progress-step active";
    s2.className = "progress-step";
    s3.className = "progress-step";
    stepTimer1 = setTimeout(() => {
      s1.className = "progress-step done";
      s2.className = "progress-step active";
    }, 350);
    stepTimer2 = setTimeout(() => {
      s2.className = "progress-step done";
      s3.className = "progress-step active";
    }, 800);
  }

  try {
    const roleTitle = document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
    const goalCompany = document.getElementById("goalCompanyInput")?.value || "";
    const jobUrl = document.getElementById("jobUrlInput")?.value || "";
    const customJdText = document.getElementById("customJdInput")?.value || "";
    const customFocus = document.getElementById("customFocusInput")?.value || "";

    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        resume: state.activeResume,
        roleTitle,
        goalCompany,
        jobUrl,
        customJdText,
        customFocus,
        weights: state.customWeights,
        persistRecord,
        dontSave: state.dontSaveResume,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Analysis request failed");

    state.analysisResult = data;
    state.activeJob = data.activeJob;
    state.completedNodes = data.completedNodes || {};
    state.simulatedSkills.clear();
    if (data.atsReport) {
      state.atsReportData = data.atsReport;
    }

    const resultsSec = document.getElementById("results");
    if (resultsSec) resultsSec.classList.remove("hidden");
    const navResLink = document.getElementById("navResultsLink");
    if (navResLink) navResLink.classList.remove("hidden");

    updateAnalyzerMiniCards();
    renderHeroLiveSnapshot(data);
    renderSpotlightBar(data);
    renderRoadmapTree(data.roadmapNodes || []);
    renderRoadmapStages(data.stages || []);
    renderCoursesGrid(data.advisor?.viableCourses || []);
    renderMaterialsGrid(data.advisor?.websitesAndMaterials || []);
    renderProjectsGrid(data.projects || []);
    renderEvidenceAndGapsTab(data);
    renderSimulatorTab(data);
    renderImprovementsSection(data.improvements || {});
    renderRoleComparisonsTab(data.roleComparisons || []);
    renderEditableSkillsTab(state.activeResume);

    if (data.dashboard) {
      renderDashboardMetrics(data.dashboard);
    }

    if (data.roadmapNodes && data.roadmapNodes.length > 0) {
      const firstGap = data.roadmapNodes.find((n) => n.status !== "mastered") || data.roadmapNodes[0];
      selectRoadmapNode(firstGap.id);
    }

    loadPlacementReadinessIndex(false);
    loadAtsSimulator(false);

    if (window.__careermatch && window.__careermatch.historyDiff) {
      window.__careermatch.historyDiff.recordAnalysis(data, state.activeResume, roleTitle);
    }
    if (window.__careermatch && window.__careermatch.router) {
      window.__careermatch.router.navigate("report");
    }
  } catch (err) {
    showErrorBanner(err.message);
  } finally {
    if (stepTimer1) clearTimeout(stepTimer1);
    if (stepTimer2) clearTimeout(stepTimer2);
    if (progBox) progBox.classList.add("hidden");
    if (runBtn) {
      runBtn.disabled = false;
      runBtn.textContent = originalText || "Generate career report";
    }
  }
}

function renderHeroLiveSnapshot(data) {
  const { resume, activeJob, matchResult, skillGaps } = data;
  const score = Math.round(matchResult.overallScore);

  const emptyEl = document.getElementById("heroEmptyState");
  const liveEl = document.getElementById("heroLiveSnapshot");
  if (emptyEl) emptyEl.classList.add("hidden");
  if (liveEl) liveEl.classList.remove("hidden");

  document.getElementById("heroCandidateName").textContent = `${resume.contact?.name || "Candidate"} — ${activeJob.title}`;
  document.getElementById("heroStatusPill").textContent =
    score >= 80 ? "Strong Match" : score >= 60 ? "Moderate Match" : "Needs Upskilling";

  document.getElementById("heroScoreNum").textContent = score;
  const ring = document.getElementById("heroScoreRing");
  if (ring) {
    ring.style.background = `conic-gradient(#8b5cf6 0% ${score}%, rgba(255,255,255,0.08) ${score}% 100%)`;
  }

  document.getElementById("heroRoleTitle").textContent = `${activeJob.title} Fit`;
  document.getElementById("heroCompanyTitle").textContent = activeJob.companyName || "Role Expectation";

  const missingCount = (matchResult.missingSkills || []).length + (matchResult.partialSkills || []).length;
  const potentialGain = Math.min(100 - score, missingCount * 6);
  document.getElementById("heroPotentialText").textContent =
    potentialGain > 0 ? `+${potentialGain}% potential after closing top gaps` : "All core requirements satisfied!";

  const totalMand = (activeJob.mandatorySkills || []).length;
  const matchedMand = (matchResult.matchedSkills || []).filter((m) => m.tier === "Mandatory").length;
  document.getElementById("heroSkillCount").textContent = `${matchedMand} / ${totalMand} mandatory`;

  const tagsEl = document.getElementById("heroSkillTags");
  const matchedTags = (matchResult.matchedSkills || [])
    .slice(0, 3)
    .map((m) => `<span class="tag tag-match">${escapeHtml(m.jobSkill)} ✓</span>`);
  const partialTags = (matchResult.partialSkills || [])
    .slice(0, 2)
    .map((p) => `<span class="tag tag-partial">${escapeHtml(p.jobSkill)} ~</span>`);
  const gapTags = (matchResult.missingSkills || [])
    .slice(0, 2)
    .map((g) => `<span class="tag tag-gap">${escapeHtml(g.jobSkill)} !</span>`);

  tagsEl.innerHTML = [...matchedTags, ...partialTags, ...gapTags].join("");

  const topGap = skillGaps?.[0];
  document.getElementById("heroNextStepText").textContent = topGap
    ? `Master ${topGap.skillName} (${topGap.estimatedDuration}) — ${topGap.practicalExercise}`
    : "Build a production capstone project to showcase your mastery.";
}

function renderSpotlightBar(data) {
  const { resume, activeJob, matchResult, source, aiError } = data;
  const score = Math.round(matchResult.overallScore);

  document.getElementById("spotlightScoreNum").textContent = score;

  const srcBadge = document.getElementById("reportSourceBadge");
  if (srcBadge) {
    const isAi = source === "ai";
    srcBadge.textContent = isAi ? "SOURCE: AI" : "SOURCE: TEMPLATE";
    srcBadge.title = isAi
      ? "Generated with Google Gemini AI"
      : aiError
        ? String(aiError)
        : "Generated with deterministic template engine";
  }

  const badge = document.getElementById("spotlightVerdictBadge");
  if (badge) {
    if (score >= 80) {
      badge.textContent = "Industry Ready";
    } else if (score >= 60) {
      badge.textContent = "Competitive Foundation";
    } else {
      badge.textContent = "Skill Bridge Needed";
    }
  }

  const candTitle = document.getElementById("reportCandidateCardTitle");
  if (candTitle) candTitle.textContent = resume.contact?.name || "Candidate";

  const summaryTitle = document.getElementById("spotlightSummaryTitle");
  if (summaryTitle) {
    const edu = resume.education?.[0];
    summaryTitle.textContent = edu
      ? `${edu.degree} · ${edu.institution}`
      : `${(resume.technicalSkills || []).length} skills detected`;
  }

  const roleCardTitle = document.getElementById("reportTargetRoleCardTitle");
  if (roleCardTitle) roleCardTitle.textContent = activeJob.title;

  const quickSel = document.getElementById("reportQuickRoleSelect");
  if (quickSel) quickSel.value = activeJob.title;

  const compCardTitle = document.getElementById("reportGoalCompanyCardTitle");
  if (compCardTitle) compCardTitle.textContent = activeJob.companyName || "Any Company";

  const gapCount = (matchResult.missingSkills || []).length + (matchResult.partialSkills || []).length;
  document.getElementById("spotlightSummaryDesc").textContent =
    `Detected ${(matchResult.matchedSkills || []).length} required skills with ${gapCount} skill gap(s) to close.`;

  document.getElementById("spotMandatoryPct").textContent = `${matchResult.mandatorySatisfiedPct}%`;
  document.getElementById("spotPreferredPct").textContent = `${matchResult.preferredSatisfiedPct}%`;
  document.getElementById("spotProjectsScore").textContent = `${Math.round(matchResult.projectsExperienceScore)}%`;
  document.getElementById("spotEducationScore").textContent = `${Math.round(matchResult.educationScore)}%`;

  // Row 2 Matched skills & Skills to build cards
  const matchedList = matchResult.matchedSkills || [];
  const toBuildList = [
    ...(matchResult.partialSkills || []).map((p) => ({ skill: p.jobSkill, cls: "tag-partial", suffix: "~" })),
    ...(matchResult.missingSkills || []).map((m) => ({ skill: m.jobSkill, cls: "tag-gap", suffix: "!" })),
  ];

  const mBadge = document.getElementById("reportMatchedCountBadge");
  if (mBadge) mBadge.textContent = `${matchedList.length} Matched`;
  const mTags = document.getElementById("reportMatchedSkillsTags");
  if (mTags) {
    mTags.innerHTML = matchedList.length
      ? matchedList.map((m) => `<span class="tag tag-match">${escapeHtml(m.jobSkill)} ✓</span>`).join("")
      : `<span style="font-size:0.82rem;color:var(--text-muted);">No matched role skills yet</span>`;
  }

  const bBadge = document.getElementById("reportMissingCountBadge");
  if (bBadge) bBadge.textContent = `${toBuildList.length} To Build`;
  const bTags = document.getElementById("reportMissingSkillsTags");
  if (bTags) {
    bTags.innerHTML = toBuildList.length
      ? toBuildList.map((item) => `<span class="tag ${item.cls}">${escapeHtml(item.skill)} ${item.suffix}</span>`).join("")
      : `<span class="tag tag-match">All target role skills matched!</span>`;
  }
}

function renderRoadmapTree(nodes) {
  const container = document.getElementById("roadmapTreeContainer");
  if (!container) return;

  const phases = {};
  nodes.forEach((n) => {
    if (!phases[n.phaseIndex]) {
      phases[n.phaseIndex] = { title: n.phaseTitle, items: [] };
    }
    phases[n.phaseIndex].items.push(n);
  });

  container.innerHTML = Object.keys(phases)
    .sort((a, b) => Number(a) - Number(b))
    .map((pIdx) => {
      const group = phases[pIdx];
      const buttonsHtml = group.items
        .map((node) => {
          const isCompleted = state.completedNodes[node.id];
          const isSelected = state.selectedNodeId === node.id;
          return `
            <button
              type="button"
              class="tree-node-btn ${node.status} ${isSelected ? "active" : ""}"
              data-node-id="${escapeHtml(node.id)}"
            >
              <span>${escapeHtml(node.skillName)}</span>
              <small style="opacity:0.75;">${isCompleted ? "✓ Done" : escapeHtml(node.statusLabel)}</small>
            </button>
          `;
        })
        .join("");

      return `
        <div class="tree-phase-block">
          <div class="tree-phase-title">${escapeHtml(group.title)}</div>
          <div class="tree-nodes-row">${buttonsHtml}</div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".tree-node-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nodeId = btn.getAttribute("data-node-id");
      selectRoadmapNode(nodeId);
    });
  });
}

function selectRoadmapNode(nodeId) {
  if (!state.analysisResult) return;
  const nodes = state.analysisResult.roadmapNodes || [];
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;

  state.selectedNodeId = nodeId;
  renderRoadmapTree(nodes);

  document.getElementById("nodeInspectorEmpty").classList.add("hidden");
  document.getElementById("nodeInspectorContent").classList.remove("hidden");

  document.getElementById("inspPhaseBadge").textContent = node.phaseTitle;
  document.getElementById("inspStatusBadge").textContent = node.statusLabel;
  document.getElementById("inspSkillTitle").textContent = node.skillName;
  document.getElementById("inspTimeEstimate").textContent = `Estimated Time: ${node.estimatedTime}`;
  document.getElementById("inspCompleteCheckbox").checked = Boolean(state.completedNodes[node.id]);
  document.getElementById("inspWhyText").textContent = node.whyItMatters;

  const subList = document.getElementById("inspSubtopicsList");
  subList.innerHTML = (node.subtopics || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");

  document.getElementById("inspTaskText").textContent = node.practicalTask;

  if (node.freeCourse) {
    const fc = normalizeCourse({ ...node.freeCourse, pricingType: "Free" });
    document.getElementById("inspFreeCourseTitle").textContent = fc.title;
    document.getElementById("inspFreeCourseMeta").textContent = [fc.provider, fc.priceDetail].filter(Boolean).join(" · ");
    document.getElementById("inspFreeCourseLink").href = fc.url;
  }
  if (node.paidCourse) {
    const pc = normalizeCourse({ ...node.paidCourse, pricingType: "Paid" });
    document.getElementById("inspPaidCourseTitle").textContent = pc.title;
    document.getElementById("inspPaidCourseMeta").textContent = [pc.provider, pc.priceDetail].filter(Boolean).join(" · ");
    document.getElementById("inspPaidCourseLink").href = pc.url;
  }
}

function renderRoadmapStages(stages) {
  const container = document.getElementById("roadmapStagesContainer");
  if (!container) return;
  container.innerHTML = stages
    .map(
      (st) => `
      <div class="course-card">
        <div>
          <span class="step-badge">${escapeHtml(st.estimatedCompletionTime)}</span>
          <h4 style="margin-top:0.55rem;">${escapeHtml(st.stageName)}</h4>
          <ul class="clean-list" style="margin:0.5rem 0;padding-left:1.1rem;font-size:0.84rem;">
            ${(st.learningObjectives || []).map((obj) => `<li>${escapeHtml(obj)}</li>`).join("")}
          </ul>
        </div>
        <div class="next-step" style="margin-top:0.5rem;">
          <span class="tiny-label">MILESTONE DELIVERABLE</span>
          <p>${escapeHtml(st.projectAssignment)}</p>
        </div>
      </div>
    `
    )
    .join("");
}

function renderCoursesGrid(courses) {
  const container = document.getElementById("coursesGridContainer");
  if (!container) return;

  const normalizedList = (courses || []).map(normalizeCourse);
  const filtered = normalizedList.filter((c) => {
    if (state.courseFilter === "All") return true;
    return c.pricingType.toLowerCase() === state.courseFilter.toLowerCase();
  });

  container.innerHTML = filtered
    .map((c) => {
      const isFree = c.pricingType === "Free";
      const providerLine = [c.provider, c.instructorOrOrg].filter(Boolean).map(escapeHtml).join(" · ");
      return `
        <div class="course-card">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
              <span class="${isFree ? "course-badge-free" : "course-badge-paid"}">
                ${isFree ? "FREE COURSE" : "PAID CERTIFICATE"} · ${escapeHtml(c.priceDetail)}
              </span>
              <small style="color:var(--text-muted);font-size:0.75rem;">${escapeHtml(c.duration)}</small>
            </div>
            <h4>${escapeHtml(c.title)}</h4>
            ${providerLine ? `<p style="margin-bottom:0.4rem;"><strong>${providerLine}</strong></p>` : ""}
            ${c.whyViable ? `<p>${escapeHtml(c.whyViable)}</p>` : ""}
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;flex-wrap:wrap;gap:0.4rem;">
            <span class="tag tag-match">${escapeHtml(c.skillFocus)}</span>
            <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="course-link">
              Enroll / View Course ↗
            </a>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderMaterialsGrid(materials) {
  const container = document.getElementById("materialsGridContainer");
  if (!container) return;
  container.innerHTML = materials
    .map(
      (m) => `
      <div class="course-card">
        <div>
          <span class="tiny-label">${escapeHtml(m.category)}</span>
          <h4>${escapeHtml(m.name)}</h4>
          <p>${escapeHtml(m.summary)}</p>
        </div>
        <a href="${escapeHtml(m.url)}" target="_blank" rel="noopener noreferrer" class="course-link">
          Visit Platform ↗
        </a>
      </div>
    `
    )
    .join("");
}

function renderProjectsGrid(projects) {
  const container = document.getElementById("projectsGridContainer");
  if (!container) return;
  container.innerHTML = projects
    .map(
      (p) => `
      <div class="project-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
          <span class="step-badge">${escapeHtml(p.difficulty)}</span>
          <small style="color:var(--text-muted);font-size:0.75rem;">${escapeHtml(p.estimatedDuration)}</small>
        </div>
        <h4>${escapeHtml(p.title)}</h4>
        <p>${escapeHtml(p.problemStatement)}</p>
        <div class="skill-tags" style="margin-top:0.75rem;">
          ${(p.skillsCovered || []).map((s) => `<span class="tag tag-partial">${escapeHtml(s)}</span>`).join("")}
        </div>
      </div>
    `
    )
    .join("");
}

function renderEvidenceAndGapsTab(data) {
  const { resume, matchResult, skillGaps } = data;
  const filenameEl = document.getElementById("evidenceResumeFilename");
  if (filenameEl) filenameEl.textContent = resume?.filename || "Resume Text";

  const linesBox = document.getElementById("resumeViewerLines");
  const rawLines = (resume?.rawText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (linesBox) {
    linesBox.innerHTML = rawLines
      .map((ln, idx) => `<div class="resume-line" data-line-idx="${idx}">${escapeHtml(ln)}</div>`)
      .join("");
  }

  const reqListEl = document.getElementById("evidenceReqList");
  const filterVal = (document.getElementById("evidenceSkillFilterInput")?.value || "").trim().toLowerCase();

  const allReqs = [
    ...(matchResult.matchedSkills || []).map((m) => ({ ...m, bucket: "matched" })),
    ...(matchResult.partialSkills || []).map((p) => ({ ...p, bucket: "adjacent" })),
    ...(matchResult.missingSkills || []).map((g) => ({ ...g, bucket: "missing" })),
  ].filter((item) => !filterVal || item.jobSkill.toLowerCase().includes(filterVal));

  if (reqListEl) {
    reqListEl.innerHTML = allReqs
      .map((item) => {
        const badgeClass =
          item.bucket === "matched" ? "status-matched" : item.bucket === "adjacent" ? "status-partial" : "status-missing";
        const iconPrefix =
          item.bucket === "matched" ? "● [✓]" : item.bucket === "adjacent" ? "◆ [▲]" : "⬡ [✕]";
        const statusText =
          item.bucket === "matched"
            ? `${iconPrefix} Matched · Detected`
            : item.bucket === "adjacent"
              ? `${iconPrefix} Adjacent · Knows ${item.resumeSkill}`
              : `${iconPrefix} Gap · Click to Fix`;
        const proofLine = item.resumeEvidence || "";

        return `
          <div class="evidence-req-item card" tabindex="0" role="button" data-proof="${escapeHtml(proofLine)}" data-skill="${escapeHtml(item.jobSkill)}" data-fix-skill="${escapeHtml(item.jobSkill)}" data-fix-status="${item.bucket}" style="padding: 10px 14px; margin-bottom: 6px; cursor: pointer;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
              <strong style="font-size: 0.9rem;">${escapeHtml(item.jobSkill)} <small style="color:var(--text-tertiary);font-weight:400;">(${escapeHtml(item.tier)})</small></strong>
              <span class="status-badge ${badgeClass}">${escapeHtml(statusText)}</span>
            </div>
            <p style="margin:4px 0 0;font-size:0.8125rem;color:var(--text-secondary);">
              ${item.bucket === "missing" ? 'No proof line in resume — click to open Guided "Fix This" drawer.' : `Proof: "${escapeHtml(proofLine)}"`}
            </p>
          </div>
        `;
      })
      .join("");

    reqListEl.querySelectorAll(".evidence-req-item").forEach((card) => {
      const triggerHighlight = () => {
        const proof = card.getAttribute("data-proof") || "";
        const skill = card.getAttribute("data-skill") || "";
        highlightResumeProofLine(proof, skill);
      };
      card.addEventListener("click", triggerHighlight);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          triggerHighlight();
        }
      });
    });
  }

  const gapsContainer = document.getElementById("gapsGridContainer");
  if (!gapsContainer) return;
  if (!skillGaps || skillGaps.length === 0) {
    gapsContainer.innerHTML = `<p style="color:var(--accent-green);">Zero skill gaps remaining! You meet all requirements for this role.</p>`;
    return;
  }

  gapsContainer.innerHTML = skillGaps
    .map(
      (g) => `
      <div class="gap-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
          <span class="tag ${g.tier === "Mandatory" ? "tag-gap" : "tag-partial"}">
            Priority #${g.priorityRank} · ${escapeHtml(g.tier)}
          </span>
          <small style="color:var(--text-muted);font-size:0.75rem;">⏱ ${escapeHtml(g.estimatedDuration)}</small>
        </div>
        <h4>${escapeHtml(g.skillName)}</h4>
        <p>${escapeHtml(g.whyItMatters)}</p>
        <p style="margin-top:0.45rem;color:var(--text-main);"><strong>Action Task:</strong> ${escapeHtml(g.practicalExercise)}</p>
      </div>
    `
    )
    .join("");
}

function clearResumeHighlights() {
  document.querySelectorAll("#resumeViewerLines .resume-line").forEach((el) => {
    el.classList.remove("highlighted");
  });
}

function highlightResumeProofLine(proofText, skillName) {
  clearResumeHighlights();
  const clearBtn = document.getElementById("clearEvidenceHighlightBtn");
  const lines = Array.from(document.querySelectorAll("#resumeViewerLines .resume-line"));
  if (!lines.length) return;

  const cleanProof = (proofText || "").trim().toLowerCase();
  let matchedEl = null;

  if (cleanProof && cleanProof !== "not found in resume.") {
    matchedEl = lines.find((el) => {
      const txt = el.textContent.trim().toLowerCase();
      return txt.includes(cleanProof.slice(0, 32)) || cleanProof.includes(txt.slice(0, 32));
    });
  }

  if (!matchedEl && skillName) {
    matchedEl = lines.find((el) => el.textContent.toLowerCase().includes(skillName.toLowerCase()));
  }

  if (matchedEl) {
    matchedEl.classList.add("highlighted");
    matchedEl.scrollIntoView({ behavior: "smooth", block: "center" });
    if (clearBtn) clearBtn.classList.remove("hidden");
  } else {
    const roadmapSec = document.getElementById("sec-roadmap");
    if (roadmapSec) roadmapSec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderSimulatorTab(data) {
  const { matchResult, activeJob } = data;
  const baseScore = Math.round(matchResult.overallScore);
  document.getElementById("simBaseScore").textContent = `${baseScore}%`;

  const unmastered = [
    ...(matchResult.missingSkills || []).map((m) => ({ skill: m.jobSkill, tier: m.tier })),
    ...(matchResult.partialSkills || []).map((p) => ({ skill: p.jobSkill, tier: p.tier })),
  ];

  const checklistEl = document.getElementById("simSkillsChecklist");
  if (unmastered.length === 0) {
    checklistEl.innerHTML = `<p style="color:var(--accent-green);">All role skills are already mastered!</p>`;
  } else {
    checklistEl.innerHTML = unmastered
      .map((item) => {
        const isSim = state.simulatedSkills.has(item.skill);
        return `
          <button type="button" class="sim-skill-btn ${isSim ? "active" : ""}" data-sim-skill="${escapeHtml(item.skill)}">
            ${isSim ? "✓ " : "+ "} ${escapeHtml(item.skill)} <small>(${escapeHtml(item.tier)})</small>
          </button>
        `;
      })
      .join("");

    checklistEl.querySelectorAll(".sim-skill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sk = btn.getAttribute("data-sim-skill");
        if (state.simulatedSkills.has(sk)) {
          state.simulatedSkills.delete(sk);
        } else {
          state.simulatedSkills.add(sk);
        }
        renderSimulatorTab(state.analysisResult);
      });
    });
  }

  const mandList = activeJob.mandatorySkills || [];
  const prefList = activeJob.preferredSkills || [];

  let simMandGain = 0;
  let simPrefGain = 0;
  state.simulatedSkills.forEach((sk) => {
    if (mandList.includes(sk)) simMandGain += 1;
    else if (prefList.includes(sk)) simPrefGain += 1;
  });

  const mandBoost = mandList.length > 0 ? (simMandGain / mandList.length) * 60 : 0;
  const prefBoost = prefList.length > 0 ? (simPrefGain / prefList.length) * 15 : 0;
  const projected = Math.min(100, Math.round(baseScore + mandBoost + prefBoost));
  const delta = Math.max(0, projected - baseScore);

  document.getElementById("simProjectedScore").textContent = `${projected}%`;
  document.getElementById("simDeltaBadge").textContent = `+${delta}% Gain`;
  const progBar = document.getElementById("simProgressBar");
  if (progBar) progBar.style.width = `${projected}%`;
}

function renderImprovementsSection(improvements) {
  document.getElementById("improvedSummaryText").textContent =
    improvements.improvedSummary || "Add a concise summary highlighting your core stack and project metrics.";

  const groupList = document.getElementById("skillGroupingList");
  groupList.innerHTML = (improvements.skillGrouping || []).map((g) => `<li>${escapeHtml(g)}</li>`).join("");

  const tipsList = document.getElementById("actionTipsList");
  tipsList.innerHTML = (improvements.actionTips || []).map((t) => `<li>${escapeHtml(t)}</li>`).join("");

  const rewritesEl = document.getElementById("bulletRewritesList");
  if (rewritesEl) {
    const rewrites = improvements.bulletRewrites || [];
    rewritesEl.innerHTML = rewrites
      .map(
        (rw) => `
        <div class="evidence-req-item" style="cursor:default;">
          <div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.25rem;">
            <strong>Before:</strong> ${escapeHtml(rw.before)}
          </div>
          <div style="font-size:0.84rem;color:var(--text-main);font-weight:600;margin-bottom:0.25rem;">
            <strong>After:</strong> ${escapeHtml(rw.after)}
          </div>
          <div style="font-size:0.76rem;color:var(--accent-green);">
            Why: ${escapeHtml(rw.reason)}
          </div>
        </div>
      `
      )
      .join("");
  }
}

function renderRoleComparisonsTab(comparisons) {
  const grid = document.getElementById("rolesComparisonGrid");
  if (!grid) return;

  grid.innerHTML = comparisons
    .map(
      (rc) => `
      <div class="role-comp-card" data-role-title="${escapeHtml(rc.title)}">
        <span class="tiny-label">BENCHMARK ROLE</span>
        <h4 style="margin:0.25rem 0 0.5rem;">${escapeHtml(rc.title)}</h4>
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong class="tabular-nums" style="font-size:1.5rem;color:var(--accent-blue);">${Math.round(rc.overallScore)}%</strong>
          <small style="color:var(--text-muted);">${rc.missingCount} gap(s)</small>
        </div>
        <small style="display:block;margin-top:0.35rem;color:var(--text-muted);">
          Mandatory Met: ${rc.mandatorySatisfiedPct}%
        </small>
      </div>
    `
    )
    .join("");

  grid.querySelectorAll(".role-comp-card").forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.getAttribute("data-role-title");
      const roleSelect = document.getElementById("targetRoleSelect");
      if (roleSelect && title) {
        roleSelect.value = title;
        runFullAnalysis(true);
      }
    });
  });
}

function renderEditableSkillsTab(resume) {
  const container = document.getElementById("editableSkillsContainer");
  if (!container || !resume) return;

  const skills = resume.technicalSkills || [];
  container.innerHTML = skills
    .map(
      (sk) => `
      <span class="tag tag-match" style="padding-right:0.4rem;">
        ${escapeHtml(sk)}
        <button
          type="button"
          data-remove-skill="${escapeHtml(sk)}"
          style="background:none;border:none;color:inherit;cursor:pointer;font-weight:700;margin-left:0.25rem;"
          title="Remove skill"
        >×</button>
      </span>
    `
    )
    .join("");

  container.querySelectorAll("button[data-remove-skill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-remove-skill");
      state.activeResume.technicalSkills = state.activeResume.technicalSkills.filter((s) => s !== target);
      renderParsedResumePreview(state.activeResume);
      renderEditableSkillsTab(state.activeResume);
    });
  });
}

function renderDashboardMetrics(dash) {
  if (!dash) return;
  const totalRes = document.getElementById("dashTotalResumes");
  if (totalRes) totalRes.textContent = dash.totalResumes ?? 0;
  const totalAna = document.getElementById("dashTotalAnalyses");
  if (totalAna) totalAna.textContent = dash.totalJobsCompared ?? 0;
  const avgSc = document.getElementById("dashAvgScore");
  if (avgSc) avgSc.textContent = `${dash.averageCompatibilityScore ?? 0}%`;
  const readSt = document.getElementById("dashReadinessStatus");
  if (readSt) readSt.textContent = dash.readinessStatus || "Ready";

  const matchedEl = document.getElementById("dashTopMatched");
  if (matchedEl) {
    matchedEl.innerHTML = (dash.topMatchedSkills || [])
      .map((s) => `<span class="tag tag-match">${escapeHtml(s.skill)} (${s.count})</span>`)
      .join("");
  }

  const missingEl = document.getElementById("dashTopMissing");
  if (missingEl) {
    missingEl.innerHTML = (dash.topMissingSkills || [])
      .map((s) => `<span class="tag tag-gap">${escapeHtml(s.skill)} (${s.count})</span>`)
      .join("");
  }

  const tbody = document.getElementById("dashHistoryBody");
  if (!tbody) return;
  const history = dash.recentHistory || [];
  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No analyses recorded yet. Click "Analyze Resume" in the Analyzer view.</td></tr>`;
    return;
  }

  tbody.innerHTML = history
    .map(
      (h) => `
      <tr>
        <td><strong>${escapeHtml(h.candidateName)}</strong></td>
        <td>${escapeHtml(h.targetRole)} <small style="color:var(--text-muted);">(${escapeHtml(h.goalCompany)})</small></td>
        <td><strong class="tabular-nums" style="color:var(--accent-green);">${Math.round(h.overallScore)}%</strong></td>
        <td class="tabular-nums">${Math.round(h.mandatoryMetPct)}%</td>
        <td>${h.matchedCount} matched · ${h.missingCount} gaps</td>
        <td style="color:var(--text-muted);font-size:0.78rem;">${escapeHtml(h.createdAt)}</td>
        <td>
          <div style="display:flex;gap:0.35rem;">
            <button type="button" class="demo-btn" data-load-history="${h.id}">Load</button>
            <button type="button" class="demo-btn" data-delete-history="${h.id}">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll("button[data-load-history]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-load-history");
      try {
        const res = await fetch(`/api/history/${id}`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Could not load record");
        state.analysisResult = data;
        state.activeResume = data.resume;
        window.dispatchEvent(new CustomEvent("cm:resume-changed", { detail: state.activeResume }));
        state.activeJob = data.activeJob;
        state.completedNodes = data.completedNodes || {};
        renderParsedResumePreview(state.activeResume);
        renderHeroLiveSnapshot(data);
        renderSpotlightBar(data);
        renderRoadmapTree(data.roadmapNodes || []);
        renderRoadmapStages(data.stages || []);
        renderCoursesGrid(data.advisor?.viableCourses || []);
        renderMaterialsGrid(data.advisor?.websitesAndMaterials || []);
        renderProjectsGrid(data.projects || []);
        renderEvidenceAndGapsTab(data);
        renderSimulatorTab(data);
        renderImprovementsSection(data.improvements || {});
        renderRoleComparisonsTab(data.roleComparisons || []);
        renderEditableSkillsTab(state.activeResume);
        switchWorkspaceView("analyzer");
        document.getElementById("results")?.scrollIntoView({ behavior: "smooth" });
      } catch (err) {
        showErrorBanner(err.message);
      }
    });
  });

  tbody.querySelectorAll("button[data-delete-history]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-delete-history");
      const res = await fetch(`/api/history/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (data.dashboard) renderDashboardMetrics(data.dashboard);
    });
  });
}

function showErrorBanner(msg) {
  const el = document.getElementById("analyzerErrorBanner");
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
    el.style.display = "block";
  }
  showToast(msg);
}

function hideErrorBanner() {
  const el = document.getElementById("analyzerErrorBanner");
  if (el) {
    el.textContent = "";
    el.classList.add("hidden");
    el.style.display = "none";
  }
}

// ============================================================================
// CAREERMATCH AI — 8 CORE MODULE CONTROLLERS & LISTENERS
// ============================================================================

function initCareerMatch2Listeners() {
  // Sync interview placeholder disabled state
  const roundSel = document.getElementById("interviewRoundSelect");
  const diffSel = document.getElementById("interviewDiffSelect");
  const startIntBtn = document.getElementById("startInterviewBtn");
  function syncInterviewBtn() {
    if (startIntBtn) {
      startIntBtn.disabled = !roundSel?.value || !diffSel?.value;
    }
  }
  roundSel?.addEventListener("change", syncInterviewBtn);
  diffSel?.addEventListener("change", syncInterviewBtn);
  syncInterviewBtn();

  // Sync assessment placeholder disabled state
  const asmtTopSel = document.getElementById("asmtTopicSelect");
  const asmtDiffSel = document.getElementById("asmtDifficultySelect");
  const genAsmtBtn = document.getElementById("generateAssessmentBtn");
  function syncAssessmentBtn() {
    if (genAsmtBtn) {
      genAsmtBtn.disabled = !asmtTopSel?.value || !asmtDiffSel?.value;
    }
  }
  asmtTopSel?.addEventListener("change", syncAssessmentBtn);
  asmtDiffSel?.addEventListener("change", syncAssessmentBtn);
  syncAssessmentBtn();

  // Overview & PRI buttons
  document.getElementById("refreshOverviewPriBtn")?.addEventListener("click", () => {
    loadPlacementReadinessIndex(true);
  });
  document.getElementById("recalcPriBtn")?.addEventListener("click", () => {
    loadPlacementReadinessIndex(true);
  });

  // PRI weight sliders
  const priSliderMap = [
    ["priWTech", "priWTechVal"],
    ["priWRes", "priWResVal"],
    ["priWInt", "priWIntVal"],
    ["priWPort", "priWPortVal"],
    ["priWAsmt", "priWAsmtVal"],
    ["priWMkt", "priWMktVal"],
  ];
  priSliderMap.forEach(([inputId, valId]) => {
    const inp = document.getElementById(inputId);
    const valEl = document.getElementById(valId);
    if (inp && valEl) {
      inp.addEventListener("input", () => {
        valEl.textContent = `${inp.value}%`;
      });
    }
  });

  document.getElementById("applyPriWeightsBtn")?.addEventListener("click", () => {
    loadPlacementReadinessIndex(true);
  });

  // Module 1: Live Job Market Intelligence
  document.getElementById("runJobsFilterBtn")?.addEventListener("click", () => {
    loadJobMarketIntelligence(true);
  });

  // Module 3: ATS Resume Simulator
  document.getElementById("runAtsAuditBtn")?.addEventListener("click", () => {
    loadAtsSimulator(true);
  });
  document.getElementById("downloadAtsResumeBtn")?.addEventListener("click", downloadOptimizedAtsResume);

  // Module 2: AI Mock Interview Simulator
  document.getElementById("startInterviewBtn")?.addEventListener("click", startNewInterviewSession);
  document.getElementById("submitInterviewAnswerBtn")?.addEventListener("click", submitCurrentInterviewAnswer);
  document.getElementById("nextInterviewQuestionBtn")?.addEventListener("click", advanceToNextInterviewQuestion);
  document.getElementById("voiceInputToggleBtn")?.addEventListener("click", toggleWebSpeechVoiceInput);

  // Module 4: GitHub Skill Verification
  document.getElementById("runGithubAnalyzeBtn")?.addEventListener("click", () => {
    loadGithubPortfolio(true);
  });

  // Module 5: Adaptive Learning Roadmap
  document.getElementById("regenerateAdaptiveRoadmapBtn")?.addEventListener("click", () => {
    loadAdaptiveRoadmap(true);
  });
  document.getElementById("adapQuizStageSelect")?.addEventListener("change", renderSelectedStageQuiz);
  document.getElementById("submitAdapQuizBtn")?.addEventListener("click", submitAdaptiveStageQuiz);

  // Module 6: AI Skill Assessment Lab
  document.getElementById("generateAssessmentBtn")?.addEventListener("click", () => {
    loadSkillAssessment(true);
  });
  document.getElementById("submitAssessmentBtn")?.addEventListener("click", submitActiveSkillAssessment);

  // Module 7: Career Path & Salary Intelligence
  document.getElementById("runCareerCompareBtn")?.addEventListener("click", () => {
    loadCareerComparison(true);
  });

  // Module 11: Profile & JWT Auth Modal
  document.getElementById("saveProfileBtn")?.addEventListener("click", saveStudentCareerProfile);
  document.getElementById("openAuthModalBtn")?.addEventListener("click", openAuthModal);
  document.getElementById("openLoginModalFromProfileBtn")?.addEventListener("click", openAuthModal);
  document.getElementById("closeAuthModalBtn")?.addEventListener("click", closeAuthModal);
  document.getElementById("authModalBackdrop")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("authModalBackdrop")) {
      closeAuthModal();
    }
  });
  document.getElementById("tabLoginBtn")?.addEventListener("click", () => setAuthModalMode("login"));
  document.getElementById("tabRegisterBtn")?.addEventListener("click", () => setAuthModalMode("register"));
  document.getElementById("submitAuthFormBtn")?.addEventListener("click", submitAuthModalForm);
}

// ============================================================================
// MODULE 1 CONTROLLER: LIVE JOB MARKET INTELLIGENCE
// ============================================================================

async function loadJobMarketIntelligence(showNotif = false) {
  try {
    const roleFilter = document.getElementById("jobFilterRole")?.value || "All";
    const workModeFilter = document.getElementById("jobFilterMode")?.value || "All";
    const locationFilter = document.getElementById("jobFilterLocation")?.value || "";
    const skillFilter = document.getElementById("jobFilterSkill")?.value || "";
    const preferLiveApi = Boolean(document.getElementById("jobPreferLiveCheck")?.checked);

    const res = await fetch("/api/jobs/market", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        resume: state.activeResume,
        resumeId: state.activeResume?.id || "",
        roleFilter,
        workModeFilter,
        locationFilter,
        skillFilter,
        preferLiveApi,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Job market fetch failed");

    document.getElementById("jobsDataSourceLabel").textContent = data.dataSource || "Benchmark Dataset";
    document.getElementById("jobsLastUpdatedLabel").textContent = data.lastUpdated || "Just now";
    document.getElementById("jobsTotalCount").textContent = data.totalListings ?? 0;

    // Render Trending Skills Demand Bar Chart
    const trendEl = document.getElementById("jobsTrendingChart");
    if (trendEl) {
      trendEl.innerHTML = (data.trendingSkills || [])
        .map(
          (t) => `
          <div class="bar-chart-row">
            <span><strong>${escapeHtml(t.skill)}</strong> ${t.inCandidateResume ? "✓" : ""}</span>
            <div class="bar-chart-track">
              <div class="bar-chart-fill ${t.inCandidateResume ? "green" : ""}" style="width:${Math.min(100, t.demandPct)}%;"></div>
            </div>
            <span class="tabular-nums" style="text-align:right;">${t.demandPct}%</span>
          </div>
        `
        )
        .join("");
    }

    // Render Company Matrix
    const matrixBody = document.getElementById("jobsCompanyMatrixBody");
    if (matrixBody) {
      matrixBody.innerHTML = (data.companyMatrix || [])
        .map(
          (cm) => `
          <tr>
            <td><strong>${escapeHtml(cm.companyName)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(cm.location)}</small></td>
            <td>${escapeHtml(cm.roleTitle)}</td>
            <td class="tabular-nums">${escapeHtml(cm.salaryRange)}</td>
            <td><strong class="tabular-nums" style="color:var(--accent-green);">${Math.round(cm.candidateMatchPct)}%</strong></td>
          </tr>
        `
        )
        .join("");
    }

    // Render Job Listing Cards
    const cardsGrid = document.getElementById("jobsCardsGrid");
    if (cardsGrid) {
      cardsGrid.innerHTML = (data.jobs || [])
        .map(
          (j) => `
          <div class="card" style="padding: var(--space-2); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;margin-bottom:6px;">
                <span class="score-pill" style="font-size:0.75rem;">${escapeHtml(j.workMode)} · ${escapeHtml(j.experienceLevel)}</span>
                <span class="score-pill high tabular-nums">${Math.round(j.matchScore)}% Match</span>
              </div>
              <h4 style="margin:0 0 4px; font-size:1.05rem;">${escapeHtml(j.title)}</h4>
              <p style="margin:0 0 6px; font-size:0.85rem;"><strong>${escapeHtml(j.companyName)}</strong> · ${escapeHtml(j.location)} · <span class="tabular-nums" style="color:var(--brand-accent); font-weight:600;">${escapeHtml(j.salaryRange)}</span></p>
              <p style="margin-bottom:8px; font-size:0.8125rem; color:var(--text-secondary);">${escapeHtml(j.descriptionSummary)}</p>
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                ${(j.matchedSkills || []).map((s) => `<span class="status-badge status-matched" style="font-size:0.72rem;">● [✓] ${escapeHtml(s)}</span>`).join("")}
                ${(j.missingSkills || []).map((s) => `<span class="status-badge status-missing" style="font-size:0.72rem;" data-fix-skill="${escapeHtml(s)}" data-fix-status="missing">⬡ [✕] ${escapeHtml(s)}</span>`).join("")}
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:8px;border-top:1px solid var(--border-subtle);">
              <small style="color:var(--text-tertiary);font-size:0.75rem;font-family:var(--font-mono);">${escapeHtml(j.dataSource)}</small>
              <div style="display:flex;gap:6px;align-items:center;">
                <button type="button" class="btn btn-ghost btn-sm" data-match-job-role="${escapeHtml(j.roleCategory)}" data-match-job-co="${escapeHtml(j.companyName)}">Analyze Role</button>
                <button type="button" class="btn btn-secondary btn-sm" data-track-job="${encodeURIComponent(JSON.stringify(j))}">+ Track in Kanban</button>
                <a href="${escapeHtml(j.applyUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Apply ↗</a>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      cardsGrid.querySelectorAll("button[data-match-job-role]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const r = btn.getAttribute("data-match-job-role");
          const c = btn.getAttribute("data-match-job-co");
          const rSel = document.getElementById("targetRoleSelect");
          const cInp = document.getElementById("goalCompanyInput");
          if (rSel && r) rSel.value = r;
          if (cInp && c) cInp.value = c;
          switchWorkspaceView("analyzer");
          runFullAnalysis(true);
        });
      });
    }

    if (showNotif) showToast(`Loaded ${data.totalListings} job listings`);
  } catch (err) {
    const container = document.getElementById("jobsCardsGrid");
    if (container && window.renderInlineError) {
      window.renderInlineError(container, err.message, () => loadJobMarketIntelligence(true));
    }
    showToast("Job Market error: " + err.message);
  }
}

// ============================================================================
// MODULE 3 CONTROLLER: ATS RESUME SIMULATOR
// ============================================================================

async function loadAtsSimulator(showNotif = false) {
  if (!state.activeResume) {
    const kpiContainer = document.getElementById("atsPillarKpis");
    if (kpiContainer) {
      kpiContainer.innerHTML = `<div class="kpi-card" style="grid-column:1 / -1;"><span class="kpi-label">ATS Check</span><div class="kpi-value" style="font-size:1.1rem;">Analyze a resume to see this</div><span class="kpi-sub">Upload a resume or select a sample profile above</span></div>`;
    }
    if (showNotif) showToast("Upload or select a resume first to run an ATS check.");
    return;
  }
  try {
    const targetRole = document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
    const goalCompany = document.getElementById("goalCompanyInput")?.value || "";
    const customJdText = document.getElementById("customJdInput")?.value || "";

    const res = await fetch("/api/ats/evaluate", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        resume: state.activeResume,
        resumeId: state.activeResume.id,
        targetRole,
        goalCompany,
        customJdText,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "ATS evaluation failed");

    state.atsReportData = data;

    const kpiContainer = document.getElementById("atsPillarKpis");
    if (kpiContainer) {
      kpiContainer.innerHTML = [
        `<div class="kpi-card"><span class="kpi-label">Overall ATS Compatibility</span><div class="kpi-value" style="color:var(--accent-green);">${Math.round(data.atsScore)}%</div><span class="kpi-sub">Role: ${escapeHtml(data.targetRole)}</span></div>`,
        ...(data.pillars || []).slice(0, 3).map(
          (p) => `
          <div class="kpi-card">
            <span class="kpi-label">${escapeHtml(p.name)} (${p.weightPct}%)</span>
            <div class="kpi-value">${Math.round(p.score)}%</div>
            <span class="kpi-sub">Explainable ATS Pillar</span>
          </div>
        `
        ),
      ].join("");
    }

    const secAuditEl = document.getElementById("atsSectionAuditList");
    if (secAuditEl) {
      secAuditEl.innerHTML = (data.sectionAudit || [])
        .map(
          (s) => `
          <div class="evidence-req-item" style="cursor:default;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${escapeHtml(s.section)}</strong>
              <span class="tag ${s.status === "Pass" ? "tag-match" : "tag-partial"}">${escapeHtml(s.status)} · ${s.score}%</span>
            </div>
            <p style="margin:0.25rem 0 0;font-size:0.8rem;color:var(--text-muted);">${escapeHtml(s.finding)}</p>
          </div>
        `
        )
        .join("");
    }

    const fmtChecksEl = document.getElementById("atsFormattingChecksList");
    if (fmtChecksEl) {
      fmtChecksEl.innerHTML = (data.formattingChecks || [])
        .map(
          (f) => `
          <div class="evidence-req-item" style="cursor:default;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${escapeHtml(f.check)}</strong>
              <span class="tag ${f.passed ? "tag-match" : "tag-gap"}">${f.passed ? "✓ Passed" : "Needs Fix"}</span>
            </div>
            <p style="margin:0.25rem 0 0;font-size:0.8rem;color:var(--text-muted);">${escapeHtml(f.detail)}</p>
          </div>
        `
        )
        .join("");
    }

    const missingTagsEl = document.getElementById("atsMissingKeywordsTags");
    if (missingTagsEl) {
      const mList = data.missingKeywords || [];
      missingTagsEl.innerHTML = mList.length
        ? mList.map((k) => `<span class="tag tag-gap">${escapeHtml(k)}</span>`).join("")
        : `<span class="tag tag-match">All core role keywords present!</span>`;
    }

    const rewritesEl = document.getElementById("atsBulletRewritesContainer");
    if (rewritesEl) {
      rewritesEl.innerHTML = (data.bulletRewrites || [])
        .map(
          (b) => `
          <div class="course-card">
            <div>
              <span class="tiny-label" style="color:var(--status-amber);">${escapeHtml(b.issue)}</span>
              <p style="margin:0.35rem 0;font-size:0.82rem;color:var(--text-muted);"><strong>Original:</strong> ${escapeHtml(b.before)}</p>
              <p style="margin:0.35rem 0 0;font-size:0.86rem;color:var(--text-main);"><strong>ATS-Optimized Rewrite:</strong> ${escapeHtml(b.after)}</p>
            </div>
          </div>
        `
        )
        .join("");
    }

    if (showNotif) showToast(`ATS Compatibility Score: ${Math.round(data.atsScore)}%`);
  } catch (err) {
    const container = document.getElementById("atsPillarKpis");
    if (container && window.renderInlineError) {
      window.renderInlineError(container, err.message, () => loadAtsSimulator(true));
    }
    showToast("ATS Simulator error: " + err.message);
  }
}

function downloadOptimizedAtsResume() {
  const txt = state.atsReportData?.downloadableResumeText;
  if (!txt) {
    showToast("Running ATS evaluation first...");
    loadAtsSimulator(true);
    return;
  }
  const blob = new Blob([txt], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const candidateName = (state.activeResume?.contact?.name || "Candidate").replace(/\s+/g, "_");
  a.download = `${candidateName}_ATS_Optimized_Resume.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Downloaded ATS-Optimized Resume (.md)");
}

// ============================================================================
// MODULE 2 CONTROLLER: AI MOCK INTERVIEW SIMULATOR
// ============================================================================

function startInterviewTimer() {
  if (state.interviewTimerInterval) clearInterval(state.interviewTimerInterval);
  state.interviewSecondsElapsed = 0;
  const disp = document.getElementById("intTimerDisplay");
  state.interviewTimerInterval = setInterval(() => {
    state.interviewSecondsElapsed += 1;
    const mins = String(Math.floor(state.interviewSecondsElapsed / 60)).padStart(2, "0");
    const secs = String(state.interviewSecondsElapsed % 60).padStart(2, "0");
    if (disp) disp.textContent = `${mins}:${secs}`;
  }, 1000);
}

async function startNewInterviewSession() {
  try {
    const targetRole = document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
    const goalCompany = document.getElementById("goalCompanyInput")?.value || "Google";
    const interviewRound = document.getElementById("interviewRoundSelect")?.value || "Technical";
    const difficulty = document.getElementById("interviewDiffSelect")?.value || "Intermediate";

    const res = await fetch("/api/interview/start", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        resume: state.activeResume,
        resumeId: state.activeResume?.id || "",
        targetRole,
        goalCompany,
        interviewRound,
        difficulty,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Could not start interview");

    state.interviewSession = {
      ...data,
      nextQuestionCandidate: null,
    };

    renderCurrentInterviewQuestion(data.currentQuestion, data.totalQuestions);
    startInterviewTimer();
    showToast(`Started ${interviewRound} Mock Interview (${data.totalQuestions} questions)`);
  } catch (err) {
    showToast("Interview error: " + err.message);
  }
}

function renderCurrentInterviewQuestion(qObj, totalQuestions) {
  if (!qObj) return;
  document.getElementById("intProgressBadge").textContent = `Question ${qObj.index} of ${totalQuestions}`;
  document.getElementById("intQuestionContext").textContent = qObj.context || "Interview Question";
  document.getElementById("intQuestionText").textContent = qObj.question;
  document.getElementById("intAnswerInput").value = "";
  document.getElementById("nextInterviewQuestionBtn")?.classList.add("hidden");
}

async function submitCurrentInterviewAnswer() {
  if (!state.interviewSession) {
    await startNewInterviewSession();
    return;
  }

  const ansEl = document.getElementById("intAnswerInput");
  const answerText = ansEl ? ansEl.value.trim() : "";
  if (answerText.length < 5) {
    showToast("Please enter your response (at least 5 characters) before submitting.");
    return;
  }

  const btn = document.getElementById("submitInterviewAnswerBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Evaluating Answer...";
  }

  try {
    const res = await fetch("/api/interview/answer", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        sessionId: state.interviewSession.sessionId,
        questionIndex: state.interviewSession.currentQuestion.index,
        answerText,
        inputMode: "text",
        timeTakenSeconds: state.interviewSecondsElapsed,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Evaluation failed");

    const ev = data.questionEvaluation;
    document.getElementById("intEvalScoreBadge").textContent = `Question Score: ${Math.round(ev.overallScore)}%`;

    const barsEl = document.getElementById("intRubricBars");
    if (barsEl) {
      const dims = [
        ["Technical Accuracy", ev.technicalScore],
        ["Communication Clarity", ev.communicationScore],
        ["Role & Resume Relevance", ev.relevanceScore],
        ["Problem-Solving Depth", ev.problemSolvingScore],
        ["Textual Specificity Indicator", ev.confidenceIndicatorScore],
      ];
      barsEl.innerHTML = dims
        .map(
          ([label, val]) => `
          <div class="bar-chart-row">
            <span>${escapeHtml(label)}</span>
            <div class="bar-chart-track">
              <div class="bar-chart-fill ${val >= 75 ? "green" : ""}" style="width:${Math.min(100, val)}%;"></div>
            </div>
            <span class="tabular-nums" style="text-align:right;">${Math.round(val)}%</span>
          </div>
        `
        )
        .join("");
    }

    const fbBox = document.getElementById("intFeedbackBox");
    if (fbBox) {
      fbBox.innerHTML = `
        <p style="margin:0 0 0.5rem;"><strong>Feedback:</strong> ${escapeHtml(ev.feedback)}</p>
        <div style="margin-bottom:0.5rem;">
          <strong style="font-size:0.8rem;color:var(--status-amber);">Areas to Improve:</strong>
          <ul style="margin:0.25rem 0;padding-left:1.15rem;">
            ${(ev.mistakes || []).map((m) => `<li>${escapeHtml(m)}</li>`).join("")}
          </ul>
        </div>
        <div style="padding:0.65rem;border-radius:0.5rem;background:var(--bg-main);border:1px solid var(--border-subtle);margin-bottom:0.5rem;">
          <span class="tiny-label">STRONG SAMPLE ANSWER</span>
          <p style="margin:0.2rem 0 0;font-size:0.82rem;">${escapeHtml(ev.sampleAnswer)}</p>
        </div>
        <div style="font-size:0.8rem;color:var(--accent-blue);">
          <strong>Contextual Follow-Up:</strong> ${escapeHtml(ev.followUpQuestion)}
        </div>
      `;
    }

    state.interviewSession.nextQuestionCandidate = data.nextQuestion;
    const nextBtn = document.getElementById("nextInterviewQuestionBtn");
    if (data.nextQuestion && nextBtn) {
      nextBtn.classList.remove("hidden");
    } else {
      showToast(`Interview completed! Overall Score: ${Math.round(data.sessionProgress.overallScore)}%`);
    }

    await loadInterviewHistory();
  } catch (err) {
    showToast("Evaluation error: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Submit Answer for AI Evaluation";
    }
  }
}

function advanceToNextInterviewQuestion() {
  if (!state.interviewSession?.nextQuestionCandidate) return;
  state.interviewSession.currentQuestion = state.interviewSession.nextQuestionCandidate;
  state.interviewSession.nextQuestionCandidate = null;
  renderCurrentInterviewQuestion(
    state.interviewSession.currentQuestion,
    state.interviewSession.totalQuestions
  );
  startInterviewTimer();
}

function toggleWebSpeechVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Web Speech API is not supported in this browser; please type your response.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  const btn = document.getElementById("voiceInputToggleBtn");
  if (btn) btn.textContent = "🔴 Listening... Speak now";

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const ansInput = document.getElementById("intAnswerInput");
    if (ansInput) {
      ansInput.value = (ansInput.value + " " + transcript).trim();
    }
    showToast("Captured voice input via Web Speech API");
  };
  recognition.onerror = () => {
    showToast("Voice capture ended or microphone permission declined.");
  };
  recognition.onend = () => {
    if (btn) btn.textContent = "🎙️ Voice Input (Web Speech)";
  };
  recognition.start();
}

async function loadInterviewHistory() {
  try {
    const resId = state.activeResume?.id || "";
    const res = await fetch(`/api/interview/history?resumeId=${encodeURIComponent(resId)}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    const tbody = document.getElementById("intHistoryTableBody");
    if (!tbody) return;
    const sessions = data.sessions || [];
    if (!sessions.length) {
      tbody.innerHTML = `<tr><td colspan="6">No mock interview sessions recorded yet. Click "Start New Interview Session" above.</td></tr>`;
      return;
    }
    tbody.innerHTML = sessions
      .map(
        (s) => `
        <tr>
          <td class="tabular-nums">${escapeHtml(s.id)}</td>
          <td><strong>${escapeHtml(s.targetRole)}</strong> · ${escapeHtml(s.interviewRound)} (${escapeHtml(s.difficulty)})</td>
          <td class="tabular-nums">${s.answeredCount} / ${s.totalQuestions}</td>
          <td><strong class="tabular-nums" style="color:var(--accent-green);">${Math.round(s.overallScore)}%</strong></td>
          <td class="tabular-nums">Tech: ${Math.round(s.technicalScore)}% · Comm: ${Math.round(s.communicationScore)}%</td>
          <td style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(s.startedAt)}</td>
        </tr>
      `
      )
      .join("");
  } catch (_e) {
    // Ignore history error
  }
}

// ============================================================================
// MODULE 4 CONTROLLER: GITHUB SKILL VERIFICATION & PORTFOLIO ANALYZER
// ============================================================================

function renderGithubUnavailableMessage(msg) {
  const sourceEl = document.getElementById("githubSourceTag");
  if (sourceEl) sourceEl.textContent = msg;
  const sScore = document.getElementById("ghStrengthScore");
  if (sScore) sScore.textContent = "—";
  const vRate = document.getElementById("ghVerifiedRate");
  if (vRate) vRate.textContent = "—";
  const vSub = document.getElementById("ghVerifiedSub");
  if (vSub) vSub.textContent = "—";
  const rCount = document.getElementById("ghRepoCount");
  if (rCount) rCount.textContent = "—";
  const fSub = document.getElementById("ghFollowersSub");
  if (fSub) fSub.textContent = "—";
  const dScore = document.getElementById("ghDocScore");
  if (dScore) dScore.textContent = "—";

  const verEl = document.getElementById("ghVerifiedSkillsList");
  if (verEl) {
    verEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.84rem;">${escapeHtml(msg)}</p>`;
  }
  const unverEl = document.getElementById("ghUnverifiedSkillsList");
  if (unverEl) {
    unverEl.innerHTML = `<p style="color:var(--text-muted);font-size:0.84rem;">${escapeHtml(msg)}</p>`;
  }
  const reposGrid = document.getElementById("ghReposGrid");
  if (reposGrid) {
    reposGrid.innerHTML = `<p style="color:var(--text-muted);font-size:0.84rem;grid-column:1 / -1;">${escapeHtml(msg)}</p>`;
  }
}

async function loadGithubPortfolio(showNotif = false) {
  const username = document.getElementById("githubUsernameInput")?.value.trim() || "";
  if (!username) {
    renderGithubUnavailableMessage("Enter a GitHub username.");
    if (showNotif) showToast("Enter a GitHub username.");
    return;
  }

  const btn = document.getElementById("runGithubAnalyzeBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Analyzing GitHub...";
  }

  try {
    const targetRole = document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
    const res = await fetch("/api/github/analyze", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        githubUsername: username,
        resume: state.activeResume,
        resumeId: state.activeResume?.id || "",
        targetRole,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.available === false) {
      const msg = data.message || data.detail || data.error || "Enter a GitHub username.";
      renderGithubUnavailableMessage(msg);
      if (showNotif) showToast(msg);
      return;
    }

    document.getElementById("githubSourceTag").textContent = `${data.dataSource} · ${data.methodologyNote}`;
    document.getElementById("ghStrengthScore").textContent = `${Math.round(data.portfolioStrengthScore)}%`;
    document.getElementById("ghVerifiedRate").textContent = `${Math.round(data.verificationRatePct)}%`;
    document.getElementById("ghVerifiedSub").textContent = `${(data.verifiedSkills || []).length} resume skills verified`;
    document.getElementById("ghRepoCount").textContent = data.publicReposCount ?? 0;
    document.getElementById("ghFollowersSub").textContent = `${data.followersCount ?? 0} followers`;
    document.getElementById("ghDocScore").textContent = `${Math.round(data.readmeQualityReport?.averageDocumentationScore || 0)}%`;

    const verEl = document.getElementById("ghVerifiedSkillsList");
    if (verEl) {
      const vList = data.verifiedSkills || [];
      verEl.innerHTML = vList.length
        ? vList
            .map(
              (v) => `
            <div class="evidence-req-item" style="cursor:default;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${escapeHtml(v.skill)}</strong>
                <span class="tag tag-match">Verified in Code ✓</span>
              </div>
              <p style="margin:0.2rem 0 0;font-size:0.78rem;color:var(--text-muted);">${escapeHtml(v.evidence)}</p>
            </div>
          `
            )
            .join("")
        : `<p style="color:var(--text-muted);font-size:0.84rem;">No resume skills matched public repository metadata for @${escapeHtml(username)}.</p>`;
    }

    const unverEl = document.getElementById("ghUnverifiedSkillsList");
    if (unverEl) {
      const uList = data.unverifiedResumeSkills || [];
      unverEl.innerHTML = uList.length
        ? uList
            .map(
              (u) => `
            <div class="evidence-req-item" style="cursor:default;">
              <div style="display:flex;justify-content:space-between;">
                <strong>${escapeHtml(u.skill)}</strong>
                <span class="tag tag-partial">Resume Claim Only</span>
              </div>
              <p style="margin:0.2rem 0 0;font-size:0.78rem;color:var(--text-muted);">${escapeHtml(u.recommendation)}</p>
            </div>
          `
            )
            .join("")
        : `<p style="color:var(--accent-green);font-size:0.84rem;">Every skill on your resume is backed by public GitHub evidence!</p>`;
    }

    const reposGrid = document.getElementById("ghReposGrid");
    if (reposGrid) {
      reposGrid.innerHTML = (data.repositories || [])
        .map(
          (r) => `
          <div class="course-card">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="step-badge">${escapeHtml(r.language)}</span>
                <span class="tag ${r.documentationScore >= 75 ? "tag-match" : "tag-partial"}">Docs: ${r.documentationScore}%</span>
              </div>
              <h4 style="margin:0.45rem 0 0.2rem;">${escapeHtml(r.name)}</h4>
              <p style="font-size:0.8rem;">${escapeHtml(r.description)}</p>
              <div class="skill-tags" style="margin-top:0.5rem;">
                ${(r.detectedSkills || []).map((s) => `<span class="tag tag-match">${escapeHtml(s)}</span>`).join("")}
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem;">
              <small style="color:var(--text-muted);font-size:0.74rem;">Updated: ${escapeHtml(r.updatedAt)}</small>
              <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="course-link">View Repo ↗</a>
            </div>
          </div>
        `
        )
        .join("");
    }

    if (showNotif) showToast(`Analyzed GitHub portfolio @${username}`);
  } catch (err) {
    renderGithubUnavailableMessage(err.message);
    if (showNotif) showToast("GitHub Analyzer error: " + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Verify GitHub Portfolio";
    }
  }
}

// ============================================================================
// MODULE 5 CONTROLLER: ADAPTIVE AI LEARNING ROADMAP
// ============================================================================

async function loadAdaptiveRoadmap(regenerate = false) {
  if (!state.activeResume) {
    return;
  }
  try {
    const targetRole = document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
    const res = await fetch("/api/roadmap/adaptive", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        resume: state.activeResume,
        resumeId: state.activeResume.id,
        targetRole,
        weeklyHoursGoal: 10,
        regenerate,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Could not load adaptive roadmap");

    state.adaptiveRoadmapData = data;
    renderAdaptiveRoadmapUI(data);
    if (regenerate) showToast("Regenerated Adaptive Learning Roadmap");
  } catch (err) {
    const container = document.getElementById("roadmapStagesContainer");
    if (container && window.renderInlineError) {
      window.renderInlineError(container, err.message, () => loadAdaptiveRoadmap(true));
    }
    showToast("Roadmap error: " + err.message);
  }
}

function renderAdaptiveRoadmapUI(data) {
  document.getElementById("adapProgressBadge").textContent = `${Math.round(data.overallProgressPct || 0)}% Completed (${data.completedHours || 0}/${data.totalEstimatedHours || 0} hrs)`;

  const barsEl = document.getElementById("adapSkillProgressBars");
  if (barsEl) {
    barsEl.innerHTML = (data.skillProgress || [])
      .map(
        (sp) => `
        <div class="bar-chart-row">
          <span><strong>Stage ${sp.stageIndex}: ${escapeHtml(sp.skillName)}</strong></span>
          <div class="bar-chart-track">
            <div class="bar-chart-fill green" style="width:${Math.min(100, sp.progressPct)}%;"></div>
          </div>
          <span class="tabular-nums" style="text-align:right;">${sp.completedTasks}/${sp.totalTasks}</span>
        </div>
      `
      )
      .join("");
  }

  const notesEl = document.getElementById("adapNotesList");
  if (notesEl) {
    const notes = data.adaptiveNotes || [];
    notesEl.innerHTML = notes.length
      ? notes.map((n) => `<div class="evidence-req-item" style="cursor:default;">${escapeHtml(n)}</div>`).join("")
      : `<p style="color:var(--text-muted);margin:0;">Take a Stage Mastery Quiz below. If your score is under 80%, the adaptive engine will automatically inject targeted remediation tasks.</p>`;
  }

  const tasksEl = document.getElementById("adapTasksContainer");
  if (tasksEl) {
    tasksEl.innerHTML = (data.tasks || [])
      .map(
        (t) => `
        <div class="evidence-req-item" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;cursor:default;">
          <label style="display:flex;align-items:flex-start;gap:0.65rem;cursor:pointer;flex:1;">
            <input type="checkbox" data-adap-task-id="${escapeHtml(t.id)}" ${t.completed ? "checked" : ""} style="margin-top:0.25rem;" />
            <div>
              <div style="display:flex;gap:0.45rem;align-items:center;flex-wrap:wrap;">
                <span class="tag ${t.isAdaptiveRemediation ? "tag-gap" : "tag-partial"}">${escapeHtml(t.taskType)} · ${escapeHtml(t.cadence)}</span>
                <strong style="${t.completed ? "text-decoration:line-through;opacity:0.65;" : ""}">${escapeHtml(t.title)}</strong>
              </div>
              <p style="margin:0.2rem 0 0;font-size:0.8rem;color:var(--text-muted);">${escapeHtml(t.description)} (${t.estimatedHours} hrs)</p>
            </div>
          </label>
          <a href="${escapeHtml(t.resourceUrl || "https://roadmap.sh/")}" target="_blank" rel="noopener noreferrer" class="course-link">Resource ↗</a>
        </div>
      `
      )
      .join("");

    tasksEl.querySelectorAll("input[data-adap-task-id]").forEach((chk) => {
      chk.addEventListener("change", async () => {
        const taskId = chk.getAttribute("data-adap-task-id");
        const res = await fetch("/api/roadmap/task", {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ taskId, completed: chk.checked }),
        });
        const updated = await res.json();
        if (res.ok) {
          state.adaptiveRoadmapData = updated;
          renderAdaptiveRoadmapUI(updated);
        }
      });
    });
  }

  const sel = document.getElementById("adapQuizStageSelect");
  if (sel && data.stages) {
    const currentVal = sel.value;
    sel.innerHTML = data.stages
      .map((s) => `<option value="${s.stageIndex}">Stage ${s.stageIndex}: ${escapeHtml(s.skillName)}</option>`)
      .join("");
    if (currentVal && Array.from(sel.options).some((o) => o.value === currentVal)) {
      sel.value = currentVal;
    }
    renderSelectedStageQuiz();
  }
}

function renderSelectedStageQuiz() {
  const data = state.adaptiveRoadmapData;
  if (!data || !data.stages) return;
  const stageIdx = parseInt(document.getElementById("adapQuizStageSelect")?.value || "1", 10);
  const st = data.stages.find((s) => Number(s.stageIndex) === stageIdx) || data.stages[0];
  const box = document.getElementById("adapQuizQuestionsBox");
  if (!box || !st) return;

  box.innerHTML = (st.quizQuestions || [])
    .map(
      (q, qIdx) => `
      <div class="evidence-req-item" style="cursor:default;margin-bottom:0.65rem;">
        <strong style="display:block;margin-bottom:0.4rem;">Q${qIdx + 1}. ${escapeHtml(q.question)}</strong>
        <div style="display:flex;flex-direction:column;gap:0.3rem;font-size:0.84rem;">
          ${(q.options || [])
            .map(
              (opt, oIdx) => `
              <label style="display:flex;align-items:center;gap:0.45rem;cursor:pointer;">
                <input type="radio" name="adap_quiz_q_${qIdx}" value="${oIdx}" ${oIdx === 1 ? "checked" : ""} />
                <span>${escapeHtml(opt)}</span>
              </label>
            `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");
}

async function submitAdaptiveStageQuiz() {
  const data = state.adaptiveRoadmapData;
  if (!data) return;
  const stageIndex = parseInt(document.getElementById("adapQuizStageSelect")?.value || "1", 10);
  const st = data.stages.find((s) => Number(s.stageIndex) === stageIndex) || data.stages[0];
  const qList = st?.quizQuestions || [];

  const answers = qList.map((_, idx) => {
    const checked = document.querySelector(`input[name="adap_quiz_q_${idx}"]:checked`);
    return checked ? parseInt(checked.value, 10) : -1;
  });

  try {
    const res = await fetch("/api/roadmap/quiz", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        roadmapId: data.roadmapId,
        stageIndex,
        answers,
      }),
    });
    const updated = await res.json();
    if (!res.ok) throw new Error(updated.detail || "Quiz submission failed");

    state.adaptiveRoadmapData = updated;
    renderAdaptiveRoadmapUI(updated);

    const qr = updated.latestQuizResult;
    const banner = document.getElementById("adapQuizResultBanner");
    if (banner && qr) {
      banner.style.color = qr.scorePct >= 80 ? "var(--accent-green)" : "var(--status-amber)";
      banner.textContent = qr.remediationAdded
        ? `Scored ${qr.scorePct}% (${qr.correctCount}/${qr.totalQuestions}) — Adaptive Remediation Task added to your roadmap!`
        : `Scored ${qr.scorePct}% (${qr.correctCount}/${qr.totalQuestions}) — Stage Mastery Verified!`;
    }
    showToast(`Stage ${stageIndex} Quiz Scored: ${qr?.scorePct}%`);
  } catch (err) {
    showToast("Quiz error: " + err.message);
  }
}

// ============================================================================
// MODULE 6 CONTROLLER: AI SKILL ASSESSMENT LAB
// ============================================================================

async function loadSkillAssessment(showNotif = false) {
  try {
    const topic = document.getElementById("asmtTopicSelect")?.value || "Python";
    const difficulty = document.getElementById("asmtDifficultySelect")?.value || "Intermediate";

    const res = await fetch("/api/assessment/generate", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        topic,
        difficulty,
        resumeId: state.activeResume?.id || "",
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to generate assessment");

    state.activeAssessment = data;
    document.getElementById("asmtResultCard")?.classList.add("hidden");

    const mcqBox = document.getElementById("asmtMcqContainer");
    if (mcqBox) {
      mcqBox.innerHTML = (data.questions || [])
        .map(
          (q, qIdx) => `
          <div class="card glass-card" style="margin-bottom: 12px; padding: 14px 18px; border-radius: var(--r-md, 14px);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span class="status-badge" style="background: var(--glass-bg-subtle); font-size: 0.72rem; letter-spacing: 0.04em;">Question ${qIdx + 1} of ${(data.questions || []).length} · ${escapeHtml(q.subtopic || topic)}</span>
            </div>
            <strong style="display: block; font-size: 0.95rem; margin-bottom: 10px; color: var(--text-primary);">${qIdx + 1}. ${escapeHtml(q.question)}</strong>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${(q.options || [])
                .map(
                  (opt, oIdx) => `
                  <label class="asmt-option-label" style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--r-sm, 10px); background: var(--glass-bg-subtle); border: 1px solid var(--glass-border); cursor: pointer; transition: background 150ms ease, border-color 150ms ease;">
                    <input type="radio" name="asmt_mcq_${qIdx}" value="${oIdx}" style="accent-color: var(--brand-accent); width: 16px; height: 16px; margin: 0;" />
                    <span style="font-size: 0.88rem; color: var(--text-primary);">${escapeHtml(opt)}</span>
                  </label>
                `
                )
                .join("")}
            </div>
          </div>
        `
        )
        .join("");
    }

    const ch = data.codingChallenge || {};
    document.getElementById("asmtCodingTitle").textContent = `Part 2 · ${ch.title || "Coding Challenge"} (35% Weight)`;
    document.getElementById("asmtCodingPrompt").textContent = ch.prompt || "";
    document.getElementById("asmtCodeEditor").value = ch.starterCode || "";

    const tcList = document.getElementById("asmtTestCasesList");
    if (tcList) {
      tcList.innerHTML = (ch.testCases || [])
        .map((tc) => `<div>• <strong>Input:</strong> <code>${escapeHtml(tc.input)}</code> → <strong>Expected:</strong> <code>${escapeHtml(tc.expected)}</code></div>`)
        .join("");
    }

    if (showNotif) showToast(`Loaded ${topic} (${difficulty}) Assessment`);
  } catch (err) {
    const container = document.getElementById("asmtMcqContainer");
    if (container && window.renderInlineError) {
      window.renderInlineError(container, err.message, () => loadSkillAssessment(true));
    }
    showToast("Assessment Lab error: " + err.message);
  }
}

async function submitActiveSkillAssessment() {
  if (!state.activeAssessment) {
    await loadSkillAssessment(false);
  }
  const sess = state.activeAssessment;
  if (!sess) return;

  const mcqAnswers = (sess.questions || []).map((_, qIdx) => {
    const el = document.querySelector(`input[name="asmt_mcq_${qIdx}"]:checked`);
    return el ? parseInt(el.value, 10) : -1;
  });
  const codeSubmission = document.getElementById("asmtCodeEditor")?.value || "";

  try {
    const res = await fetch("/api/assessment/submit", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        sessionId: sess.sessionId,
        mcqAnswers,
        codeSubmission,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Assessment grading failed");

    const resCard = document.getElementById("asmtResultCard");
    if (resCard) {
      resCard.style.display = "block";
      resCard.classList.remove("hidden");
    }
    document.getElementById("asmtFinalScoreBadge").textContent = `Overall: ${Math.round(data.overallScore)}% (MCQ: ${Math.round(data.mcqScore)}% · Code: ${Math.round(data.codingScore)}%)`;

    const revList = document.getElementById("asmtReviewList");
    if (revList) {
      const codeRev = data.codingReview || {};
      const weakList = data.weakSubtopics || [];
      revList.innerHTML = [
        `<div class="card glass-card" style="padding: 12px 16px; margin-bottom: 12px; border-left: 3px solid var(--brand-accent);">
          <strong style="font-size: 0.92rem;">${escapeHtml(data.evaluationMode)}</strong>
          <p style="margin: 4px 0 0; font-size: 0.84rem; color: var(--text-secondary);">${escapeHtml(codeRev.feedback || "")} (Test Cases Verified: ${codeRev.passedCases}/${codeRev.totalCases})</p>
        </div>`,
        ...(data.questionReviews || []).map(
          (qr, i) => `
          <div class="card glass-card" style="padding: 12px 16px; margin-bottom: 10px; border-left: 3px solid ${qr.isCorrect ? "var(--score-high)" : "var(--score-low)}"};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <strong style="font-size: 0.88rem;">${i + 1}. ${escapeHtml(qr.question)}</strong>
              <span class="status-badge ${qr.isCorrect ? "status-matched" : "status-missing"}" style="flex-shrink: 0;">${qr.isCorrect ? "Correct ✓" : "Incorrect ✕"}</span>
            </div>
            <div style="margin-top: 6px; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5;">
              <div>Your answer: <strong>${escapeHtml(qr.selectedOption)}</strong></div>
              ${!qr.isCorrect ? `<div>Correct answer: <strong style="color: var(--score-high);">${escapeHtml(qr.correctOption)}</strong></div>` : ""}
              <p style="margin: 4px 0 0; color: var(--text-tertiary); font-style: italic;">${escapeHtml(qr.explanation)}</p>
            </div>
          </div>
        `
        ),
        weakList.length
          ? `<div style="margin-top: 14px; padding: 12px 16px; background: var(--glass-bg-subtle); border-radius: var(--r-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <strong style="font-size: 0.88rem;">Recommended Action:</strong>
                <p style="margin: 2px 0 0; font-size: 0.82rem; color: var(--text-secondary);">Identified ${weakList.length} gap area${weakList.length > 1 ? "s" : ""}: ${weakList.map(w => escapeHtml(w)).join(", ")}</p>
              </div>
              <a href="#/roadmap" class="btn btn-primary btn-sm" id="asmtAddWeakAreasToRoadmapBtn">
                Add to Learning Roadmap →
              </a>
            </div>`
          : "",
      ].join("");
    }

    showToast(`Assessment Graded: ${Math.round(data.overallScore)}%`);
    await loadAssessmentHistory();
  } catch (err) {
    showToast("Assessment grading error: " + err.message);
  }
}

async function loadAssessmentHistory() {
  try {
    const resId = state.activeResume?.id || "";
    const res = await fetch(`/api/assessment/history?resumeId=${encodeURIComponent(resId)}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    const tbody = document.getElementById("asmtHistoryBody");
    if (!tbody) return;
    const list = data.results || [];
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7">No skill assessments completed yet. Submit the assessment above to record your score.</td></tr>`;
      return;
    }
    tbody.innerHTML = list
      .map(
        (r) => `
        <tr>
          <td><strong>${escapeHtml(r.topic)}</strong></td>
          <td>${escapeHtml(r.difficulty)}</td>
          <td><strong class="tabular-nums" style="color:var(--accent-green);">${Math.round(r.overallScore)}%</strong></td>
          <td class="tabular-nums">${Math.round(r.mcqScore)}% (${r.correctCount}/${r.totalQuestions})</td>
          <td class="tabular-nums">${Math.round(r.codingScore)}%</td>
          <td style="font-size:0.76rem;color:var(--text-muted);">${escapeHtml(r.evaluationMode)}</td>
          <td style="font-size:0.76rem;color:var(--text-muted);">${escapeHtml(r.createdAt)}</td>
        </tr>
      `
      )
      .join("");
  } catch (_e) {
    // Ignore
  }
}

// ============================================================================
// MODULE 7 CONTROLLER: CAREER PATH & SALARY INTELLIGENCE
// ============================================================================

async function loadCareerComparison(showNotif = false) {
  try {
    const primaryRole = document.getElementById("careerPrimaryRoleSelect")?.value || "Full Stack Developer";
    const secondaryRole = document.getElementById("careerSecondaryRoleSelect")?.value || "Data Engineer";

    const res = await fetch("/api/career/compare", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        resume: state.activeResume,
        resumeId: state.activeResume?.id || "",
        primaryRole,
        secondaryRole,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Career comparison failed");

    const renderRoleCard = (r, badgeLabel) => `
      <span class="tiny-label">${escapeHtml(badgeLabel)}</span>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:0.2rem 0 0.5rem;">
        <h3 style="margin:0;">${escapeHtml(r.roleTitle)}</h3>
        <span class="status-pill tabular-nums">${Math.round(r.candidateMatchScore)}% Resume Match</span>
      </div>
      <p style="font-size:0.82rem;color:var(--text-muted);margin:0 0 0.65rem;">${escapeHtml(r.experienceExpectation)}</p>
      <div class="kpi-grid-4" style="grid-template-columns:repeat(3,1fr);margin-bottom:0.75rem;">
        <div class="kpi-card" style="padding:0.65rem;"><span class="kpi-label">Entry (India)</span><div class="kpi-value" style="font-size:1.15rem;">₹${r.indiaEntryLPA}L</div></div>
        <div class="kpi-card" style="padding:0.65rem;"><span class="kpi-label">Mid-Level</span><div class="kpi-value" style="font-size:1.15rem;">₹${r.indiaMidLPA}L</div></div>
        <div class="kpi-card" style="padding:0.65rem;"><span class="kpi-label">Senior</span><div class="kpi-value" style="font-size:1.15rem;">₹${r.indiaSeniorLPA}L</div></div>
      </div>
      <span class="tiny-label">PROGRESSION PATH</span>
      <p style="font-size:0.8rem;margin:0.2rem 0 0.6rem;">${(r.progressionPath || []).map(escapeHtml).join(" → ")}</p>
      <small style="color:var(--text-muted);font-size:0.72rem;">Source: ${escapeHtml(r.benchmarkSource)}</small>
    `;

    const cardA = document.getElementById("careerRoleACard");
    const cardB = document.getElementById("careerRoleBCard");
    if (cardA && data.primaryRole) cardA.innerHTML = renderRoleCard(data.primaryRole, "PRIMARY TARGET PATH");
    if (cardB && data.secondaryRole) cardB.innerHTML = renderRoleCard(data.secondaryRole, "COMPARISON / PIVOT PATH");

    const br = data.transitionBridge || {};
    document.getElementById("careerBridgeTitle").textContent = `Transition Bridge: ${br.fromRole} → ${br.toRole} (${br.estimatedTransitionTime})`;
    const bridgeBody = document.getElementById("careerBridgeBody");
    if (bridgeBody) {
      bridgeBody.innerHTML = `
        <div class="grid-3-col" style="margin-bottom:0;">
          <div>
            <span class="tiny-label">SHARED FOUNDATION SKILLS</span>
            <div class="skill-tags" style="margin-top:0.35rem;">
              ${(br.sharedFoundationSkills || []).map((s) => `<span class="tag tag-match">${escapeHtml(s)}</span>`).join("")}
            </div>
          </div>
          <div>
            <span class="tiny-label">YOU ALREADY HAVE FOR ${escapeHtml(br.toRole)}</span>
            <div class="skill-tags" style="margin-top:0.35rem;">
              ${(br.candidateAlreadyHasForTarget || []).map((s) => `<span class="tag tag-match">${escapeHtml(s)} ✓</span>`).join("") || `<span style="font-size:0.8rem;color:var(--text-muted);">None yet</span>`}
            </div>
          </div>
          <div>
            <span class="tiny-label">BRIDGE SKILLS NEEDED TO PIVOT</span>
            <div class="skill-tags" style="margin-top:0.35rem;">
              ${(br.skillsNeededToTransition || []).map((s) => `<span class="tag tag-gap">${escapeHtml(s)} !</span>`).join("") || `<span class="tag tag-match">Ready to Transition!</span>`}
            </div>
          </div>
        </div>
      `;
    }

    const tbody = document.getElementById("careerMatrixTableBody");
    if (tbody) {
      tbody.innerHTML = (data.allRolesMatrix || [])
        .map(
          (m) => `
          <tr>
            <td><strong>${escapeHtml(m.roleTitle)}</strong></td>
            <td><strong class="tabular-nums" style="color:var(--accent-green);">${Math.round(m.candidateMatchScore)}%</strong></td>
            <td class="tabular-nums">₹${m.indiaEntryLPA}L / ₹${m.indiaMidLPA}L / ₹${m.indiaSeniorLPA}L</td>
            <td class="tabular-nums">$${(m.globalEntryUSD / 1000).toFixed(0)}k / $${(m.globalMidUSD / 1000).toFixed(0)}k / $${(m.globalSeniorUSD / 1000).toFixed(0)}k</td>
            <td class="tabular-nums" style="color:var(--accent-blue);font-weight:600;">${escapeHtml(m.demandGrowthYoY)}</td>
            <td style="font-size:0.75rem;color:var(--text-muted);">${escapeHtml(m.benchmarkSource)}</td>
          </tr>
        `
        )
        .join("");
    }

    const mirrorEl = document.getElementById("toolkitCareerCompareMirror");
    if (mirrorEl) {
      const matrixRows = (data.allRolesMatrix || [])
        .map(
          (m) => `
          <tr>
            <td><strong>${escapeHtml(m.roleTitle)}</strong></td>
            <td><strong class="tabular-nums" style="color:var(--accent-green);">${Math.round(m.candidateMatchScore)}%</strong></td>
            <td class="tabular-nums">₹${m.indiaEntryLPA}L / ₹${m.indiaMidLPA}L / ₹${m.indiaSeniorLPA}L</td>
            <td class="tabular-nums">$${(m.globalEntryUSD / 1000).toFixed(0)}k / $${(m.globalMidUSD / 1000).toFixed(0)}k / $${(m.globalSeniorUSD / 1000).toFixed(0)}k</td>
            <td class="tabular-nums" style="color:var(--accent-blue);font-weight:600;">${escapeHtml(m.demandGrowthYoY)}</td>
          </tr>
        `
        )
        .join("");
      mirrorEl.innerHTML = `
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Your Match</th>
                <th>India (Entry / Mid / Sr)</th>
                <th>Global USD (Entry / Mid / Sr)</th>
                <th>YoY Growth</th>
              </tr>
            </thead>
            <tbody>${matrixRows}</tbody>
          </table>
        </div>
      `;
    }

    if (showNotif) showToast(`Compared ${primaryRole} vs ${secondaryRole}`);
  } catch (err) {
    const container = document.getElementById("careerBridgeBody");
    if (container && window.renderInlineError) {
      window.renderInlineError(container, err.message, () => loadCareerComparison(true));
    }
    showToast("Career comparison error: " + err.message);
  }
}

// ============================================================================
// MODULE 8 CONTROLLER: PLACEMENT READINESS INDEX (PRI) & OVERVIEW SYNC
// ============================================================================

async function loadPlacementReadinessIndex(showNotif = false) {
  if (!state.activeResume) {
    renderEmptyReadinessPlaceholders();
    if (showNotif) showToast("Analyze a resume first to calculate readiness.");
    return;
  }
  try {
    const targetRole = document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
    const weights = {
      technicalSkills: parseFloat(document.getElementById("priWTech")?.value || "25"),
      resumeQuality: parseFloat(document.getElementById("priWRes")?.value || "15"),
      interviewPerformance: parseFloat(document.getElementById("priWInt")?.value || "20"),
      portfolioEvidence: parseFloat(document.getElementById("priWPort")?.value || "15"),
      assessmentPerformance: parseFloat(document.getElementById("priWAsmt")?.value || "15"),
      marketAlignment: parseFloat(document.getElementById("priWMkt")?.value || "10"),
    };

    const res = await fetch("/api/readiness/index", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        resume: state.activeResume,
        resumeId: state.activeResume.id,
        targetRole,
        weights,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Could not compute PRI");

    state.priReportData = data;
    const priRounded = Math.round(data.priScore || 0);

    if (window.__careermatch && window.__careermatch.store) {
      window.__careermatch.store.set("priData", data);
    }
    const circle = document.getElementById("dashPriGaugeCircle");
    if (circle) {
      const circ = 2 * Math.PI * 42;
      const offset = circ - (Math.min(100, priRounded) / 100) * circ;
      circle.style.strokeDashoffset = offset;
    }

    // Sync Sidebar & Overview KPIs
    const sbBadge = document.getElementById("sidebarPriBadge");
    if (sbBadge) sbBadge.textContent = `${priRounded}%`;

    const ovPri = document.getElementById("ovPriScore");
    const ovTier = document.getElementById("ovPriTier");
    if (ovPri) ovPri.textContent = `${priRounded}%`;
    if (ovTier) ovTier.textContent = data.readinessTier || "";

    const byKey = {};
    (data.categoryBreakdown || []).forEach((c) => {
      byKey[c.key] = c;
    });

    if (byKey.technicalSkills) {
      document.getElementById("ovTechScore").textContent = `${Math.round(byKey.technicalSkills.rawScore)}%`;
      document.getElementById("ovTargetRoleLabel").textContent = `Target: ${data.targetRole}`;
    }
    if (byKey.resumeQuality) {
      document.getElementById("ovAtsScore").textContent = `${Math.round(byKey.resumeQuality.rawScore)}%`;
    }
    if (byKey.marketAlignment) {
      document.getElementById("ovMarketScore").textContent = `${Math.round(byKey.marketAlignment.rawScore)}%`;
    }

    const renderBars = (list) =>
      list
        .map(
          (c) => `
          <div class="bar-chart-row">
            <span><strong>${escapeHtml(c.category)}</strong> <small style="color:var(--text-muted);">(${c.weightPct}%)</small></span>
            <div class="bar-chart-track">
              <div class="bar-chart-fill ${c.isVerified ? "green" : "amber"}" style="width:${Math.min(100, c.rawScore)}%;"></div>
            </div>
            <span class="tabular-nums" style="text-align:right;">${Math.round(c.rawScore)}%</span>
          </div>
        `
        )
        .join("");

    const ovBars = document.getElementById("overviewPillarBars");
    if (ovBars) ovBars.innerHTML = renderBars(data.categoryBreakdown || []);

    const priBars = document.getElementById("priBreakdownBars");
    if (priBars) priBars.innerHTML = renderBars(data.categoryBreakdown || []);

    const ovActions = document.getElementById("overviewNextActionsList");
    if (ovActions) {
      ovActions.innerHTML = (data.nextActions || [])
        .map(
          (a) => `
          <div class="evidence-req-item" style="cursor:default;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>#${a.priority} · ${escapeHtml(a.module)}</strong>
              <span class="tag tag-match">${escapeHtml(a.expectedGain)}</span>
            </div>
            <p style="margin:0.2rem 0 0;font-size:0.8rem;color:var(--text-muted);">${escapeHtml(a.action)}</p>
          </div>
        `
        )
        .join("");
    }

    // PRI dedicated view
    document.getElementById("priBigScore").textContent = `${priRounded}%`;
    document.getElementById("priTierBadge").textContent = data.readinessTier || "";
    document.getElementById("priCandidateHeader").textContent = `${data.candidateName} — ${data.targetRole}`;
    document.getElementById("priVerifiedCountText").textContent = `${data.verifiedModulesCount} of ${data.totalModulesCount} intelligence pillars verified with live data`;
    document.getElementById("priDisclaimerText").textContent = data.disclaimer || "";

    const strEl = document.getElementById("priStrengthsList");
    if (strEl) strEl.innerHTML = (data.strengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");

    const wkEl = document.getElementById("priWeaknessesList");
    if (wkEl) wkEl.innerHTML = (data.weaknesses || []).map((w) => `<li>${escapeHtml(w)}</li>`).join("");

    if (showNotif) showToast(`Placement Readiness Index: ${priRounded}%`);
  } catch (err) {
    const container = document.getElementById("priBreakdownBars");
    if (container && window.renderInlineError) {
      window.renderInlineError(container, err.message, () => loadPlacementReadinessIndex(true));
    }
    showToast("PRI error: " + err.message);
  }
}

// ============================================================================
// MODULE 11 CONTROLLER: PROFILE & JWT AUTHENTICATION
// ============================================================================

function populateProfileForm() {
  const p = state.studentProfile;
  if (!p) return;
  document.getElementById("profFullName").value = p.fullName || "";
  document.getElementById("profEmail").value = p.email || "";
  document.getElementById("profDegree").value = p.educationDegree || "";
  document.getElementById("profInstitution").value = p.institution || "";
  document.getElementById("profGradYear").value = p.graduationYear || "2026";
  document.getElementById("profTargetRole").value = p.targetRole || "Full Stack Developer";
  document.getElementById("profGithub").value = p.githubUsername || "";
  document.getElementById("profCompanies").value = (p.targetCompanies || []).join(", ");
}

async function saveStudentCareerProfile() {
  try {
    const payload = {
      fullName: document.getElementById("profFullName")?.value || "",
      email: document.getElementById("profEmail")?.value || "",
      educationDegree: document.getElementById("profDegree")?.value || "",
      institution: document.getElementById("profInstitution")?.value || "",
      graduationYear: document.getElementById("profGradYear")?.value || "2026",
      targetRole: document.getElementById("profTargetRole")?.value || "Full Stack Developer",
      githubUsername: document.getElementById("profGithub")?.value || "",
      targetCompanies: document.getElementById("profCompanies")?.value || "",
    };

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update profile");

    state.studentProfile = data.profile;
    syncStudentProfileSidebar();

    const rSel = document.getElementById("targetRoleSelect");
    if (rSel && state.studentProfile.targetRole) {
      rSel.value = state.studentProfile.targetRole;
    }
    showToast("Saved Student Career Profile & synced across modules");
  } catch (err) {
    showToast("Profile save error: " + err.message);
  }
}

function setAuthModalMode(mode) {
  state.authMode = mode;
  document.getElementById("tabLoginBtn")?.classList.toggle("active", mode === "login");
  document.getElementById("tabRegisterBtn")?.classList.toggle("active", mode === "register");
  document.getElementById("authNameRow")?.classList.toggle("hidden", mode !== "register");
  document.getElementById("submitAuthFormBtn").textContent =
    mode === "register" ? "Create account & sign in" : "Sign in";
  document.getElementById("authErrorMsg")?.classList.add("hidden");
}

async function submitAuthModalForm() {
  const errEl = document.getElementById("authErrorMsg");
  if (errEl) errEl.classList.add("hidden");

  const email = document.getElementById("authEmailInput")?.value || "";
  const password = document.getElementById("authPasswordInput")?.value || "";
  const fullName = document.getElementById("authFullNameInput")?.value || "";
  const endpoint = state.authMode === "register" ? "/api/auth/register" : "/api/auth/login";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Authentication failed");

    state.jwtToken = data.token;
    localStorage.setItem("cm_jwt_token", data.token);
    state.studentProfile = data.profile;
    syncStudentProfileSidebar();
    populateProfileForm();

    document.getElementById("authCurrentStatusText").textContent = `Signed in as ${data.user.fullName} (${data.user.email})`;
    closeAuthModal();
    showToast(`Signed in as ${data.user.fullName}`);
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message;
      errEl.classList.remove("hidden");
    }
  }
}

async function handleDemoLogin() {
  try {
    const res = await fetch("/api/auth/demo", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error("Demo login failed");

    state.jwtToken = data.token;
    localStorage.setItem("cm_jwt_token", data.token);
    state.studentProfile = data.profile;
    syncStudentProfileSidebar();
    populateProfileForm();

    document.getElementById("authCurrentStatusText").textContent = `Demo Student Session (${data.user.fullName})`;
    closeAuthModal();
    if (state.demos.length > 0) {
      selectDemoResume(0, true);
    }
    showToast("Signed in as Demo Student");
  } catch (err) {
    showToast(err.message);
  }
}

// Global window exposure for modular interoperability
window.selectDemoResume = selectDemoResume;
window.runFullAnalysis = runFullAnalysis;
window.switchWorkspaceView = switchWorkspaceView;
window.loadJobMarketIntelligence = loadJobMarketIntelligence;
window.loadAtsSimulator = loadAtsSimulator;
window.loadAdaptiveRoadmap = loadAdaptiveRoadmap;
window.loadSkillAssessment = loadSkillAssessment;
window.loadCareerComparison = loadCareerComparison;
window.loadPlacementReadinessIndex = loadPlacementReadinessIndex;
window.loadInterviewHistory = loadInterviewHistory;
window.loadGithubPortfolio = loadGithubPortfolio;
window.populateProfileForm = populateProfileForm;
window.renderDashboardMetrics = renderDashboardMetrics;
window.getAppState = () => state;
window.hasActiveResume = () => Boolean(state.activeResume);

