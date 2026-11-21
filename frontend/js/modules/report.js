/**
 * CareerMatch AI: Career Report Feature Module
 * Single authoritative controller for #view-report.
 * Manages tabs, score spotlights, evidence ledger, interactive resume proof highlighting, and export.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";
import { roadmapDiagram } from "../components/roadmapDiagram.js";
import { analyzerModule } from "./analyzer.js";

export class ReportModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Report Tab navigation
    const tabBtns = document.querySelectorAll("[data-report-tab]");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-report-tab");
        this.switchTab(targetTab);
      });
    });

    // Print / Export PDF button
    const printBtn = document.getElementById("exportPdfBtn") || document.getElementById("printReportBtn");
    if (printBtn) {
      printBtn.addEventListener("click", () => window.print());
    }

    // Evidence Skill Filter
    const filterInput = document.getElementById("evidenceSkillFilterInput");
    if (filterInput) {
      filterInput.addEventListener("input", () => {
        const result = store.get("analysisResult");
        if (result) this.renderEvidenceTab(result);
      });
    }

    // Clear highlight button
    const clearHlBtn = document.getElementById("clearEvidenceHighlightBtn");
    if (clearHlBtn) {
      clearHlBtn.addEventListener("click", () => {
        this.clearHighlights();
        clearHlBtn.classList.add("hidden");
      });
    }

    // Subscribe to analysis changes
    store.subscribe("analysisResult", (res) => {
      if (res) this.render(res);
    });
  }

  async load() {
    const result = store.get("analysisResult");
    if (result && result.matchResult) {
      this.render(result);
      return;
    }

    const activeResume = store.get("activeResume");
    if (activeResume) {
      this.renderLoadingState();
      try {
        const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
        const data = await api.post("/api/analyze", {
          resume: activeResume,
          roleTitle: targetRole,
          goalCompany: store.get("goalCompany") || "",
          customJdText: document.getElementById("customJdInput")?.value.trim() || "",
          dontSave: Boolean(store.get("dontSaveResume")),
        });
        if (data && data.matchResult) {
          store.set("analysisResult", data);
          this.render(data);
          return;
        }
      } catch (err) {
        this.renderEmptyState(err?.message || "Could not evaluate match report. Please retry.");
        return;
      }
    }
    this.renderEmptyState();
  }

  _ensureEmptyStateContainer() {
    let emptyContainer = document.getElementById("reportEmptyState");
    if (!emptyContainer) {
      const panel = document.getElementById("view-report");
      if (panel) {
        emptyContainer = document.createElement("div");
        emptyContainer.id = "reportEmptyState";
        emptyContainer.className = "card p-4 text-center";
        panel.prepend(emptyContainer);
      }
    }
    return emptyContainer;
  }

  renderLoadingState() {
    const emptyContainer = this._ensureEmptyStateContainer();
    const contentContainer = document.getElementById("reportContentContainer") || document.getElementById("results");
    if (contentContainer) contentContainer.hidden = true;
    if (emptyContainer) {
      emptyContainer.hidden = false;
      emptyContainer.innerHTML = `
        <div class="p-4 text-center">
          <div class="spinner mb-2" aria-hidden="true"></div>
          <h3 class="text-lg font-semibold mb-1">Evaluating Evidence &amp; Skill Gaps...</h3>
          <p class="text-sm text-secondary m-0">Matching your parsed resume against target role requirements.</p>
        </div>
      `;
    }
  }

  switchTab(tabId) {
    document.querySelectorAll("[data-report-tab]").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-report-tab") === tabId);
    });
    document.querySelectorAll(".report-tab-panel").forEach((p) => {
      p.classList.toggle("active", p.id === tabId);
      p.hidden = p.id !== tabId;
    });
  }

  renderEmptyState(errorMsg = "") {
    const emptyContainer = this._ensureEmptyStateContainer();
    const contentContainer = document.getElementById("reportContentContainer") || document.getElementById("results");
    if (contentContainer) contentContainer.hidden = true;
    if (emptyContainer) {
      emptyContainer.hidden = false;
      const hasResume = Boolean(store.get("activeResume"));
      emptyContainer.innerHTML = `
        <div class="p-4 text-center" style="max-width: 520px; margin: 0 auto;">
          <h3 class="text-lg font-semibold mb-1">${errorMsg ? "Match Evaluation Paused" : "No Match Report Yet"}</h3>
          <p class="text-sm text-secondary mb-3">${escapeHtml(errorMsg || (hasResume ? "Run a match analysis to populate your Evidence Ledger and Skill Gaps." : "Upload your resume in the Analyzer to generate your Evidence & Gaps report."))}</p>
          <div class="d-flex gap-sm justify-center flex-wrap">
            ${hasResume ? `<button type="button" class="btn btn-primary btn-sm" id="reportRetryAnalyzeBtn">Evaluate Resume Now</button>` : ""}
            <a href="#/analyzer" class="btn btn-secondary btn-sm">Go to Resume Analyzer</a>
          </div>
        </div>
      `;
      document.getElementById("reportRetryAnalyzeBtn")?.addEventListener("click", () => this.load());
    }
  }

  render(data) {
    if (!data) {
      this.renderEmptyState();
      return;
    }

    const emptyContainer = document.getElementById("reportEmptyState");
    const contentContainer = document.getElementById("reportContentContainer") || document.getElementById("results");
    if (emptyContainer) emptyContainer.hidden = true;
    if (contentContainer) contentContainer.hidden = false;

    const { resume, activeJob, matchResult, source, aiError } = data;
    const score = Math.round(matchResult?.overallScore ?? 0);

    // Spotlight score
    const scoreNum = document.getElementById("spotlightScoreNum");
    if (scoreNum) scoreNum.textContent = score;

    // Verdict badge
    const verdict = document.getElementById("spotlightVerdictBadge");
    if (verdict) {
      if (score >= 80) verdict.textContent = "Industry Ready";
      else if (score >= 60) verdict.textContent = "Competitive Foundation";
      else verdict.textContent = "Skill Bridge Needed";
    }

    // Candidate title & Spotlight summary
    const candName = resume?.contact?.name || "Candidate";
    const resolvedRole = activeJob?.title || store.get("targetRole") || "Target Role";
    const candTitle = document.getElementById("reportCandidateCardTitle");
    if (candTitle) candTitle.textContent = candName;

    const spotTitle = document.getElementById("spotlightSummaryTitle");
    if (spotTitle) spotTitle.textContent = `${resolvedRole} Alignment`;
    const spotDesc = document.getElementById("spotlightSummaryDesc");
    if (spotDesc) {
      const mCount = (matchResult?.matchedSkills || []).length;
      const gCount = (matchResult?.missingSkills || []).length + (matchResult?.partialSkills || []).length;
      spotDesc.textContent = `${candName} · ${mCount} matched skills · ${gCount} skills to build`;
    }
    const fnEl = document.getElementById("evidenceResumeFilename");
    if (fnEl) fnEl.textContent = resume?.filename || "parsed_resume.pdf";

    // Target role title
    const roleTitle = document.getElementById("reportTargetRoleCardTitle");
    if (roleTitle) roleTitle.textContent = activeJob?.title || store.get("targetRole") || "Full Stack Developer";

    // Company
    const compTitle = document.getElementById("reportGoalCompanyCardTitle");
    if (compTitle) compTitle.textContent = activeJob?.companyName || "Industry Benchmark";

    // Score components
    const setScore = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${Math.round(val ?? 0)}%`;
    };
    setScore("spotMandatoryPct", matchResult?.mandatorySatisfiedPct);
    setScore("spotPreferredPct", matchResult?.preferredSatisfiedPct);
    setScore("spotProjectsScore", matchResult?.projectsExperienceScore);
    setScore("spotEducationScore", matchResult?.educationScore);

    // Matched skills tags
    const matchedList = matchResult?.matchedSkills || [];
    const mBadge = document.getElementById("reportMatchedCountBadge");
    if (mBadge) mBadge.textContent = `${matchedList.length} Matched`;
    const mTags = document.getElementById("reportMatchedSkillsTags");
    if (mTags) {
      mTags.innerHTML = matchedList.length
        ? matchedList.map((m) => `<span class="tag tag-match">${escapeHtml(m.jobSkill)} ✓</span>`).join("")
        : `<span style="font-size:0.82rem;color:var(--text-tertiary);">No required skills matched yet.</span>`;
    }

    // Missing skills tags
    const toBuildList = [
      ...(matchResult?.partialSkills || []).map((p) => ({ skill: p.jobSkill, cls: "tag-partial", suffix: "▲" })),
      ...(matchResult?.missingSkills || []).map((m) => ({ skill: m.jobSkill, cls: "tag-gap", suffix: "✕" })),
    ];
    const bBadge = document.getElementById("reportMissingCountBadge");
    if (bBadge) bBadge.textContent = `${toBuildList.length} To Build`;
    const bTags = document.getElementById("reportMissingSkillsTags");
    if (bTags) {
      bTags.innerHTML = toBuildList.length
        ? toBuildList.map((item) => `<span class="tag ${item.cls}">${escapeHtml(item.skill)} ${item.suffix}</span>`).join("")
        : `<span class="tag tag-match">All target role skills matched!</span>`;
    }

    // Render Evidence & Skill Gap Matrix
    this.renderEvidenceTab(data);
  }

  renderEvidenceTab(data) {
    const { resume, matchResult } = data;
    const filterVal = (document.getElementById("evidenceSkillFilterInput")?.value || "").trim().toLowerCase();

    // Render resume text lines in resume viewer
    const linesBox = document.getElementById("resumeViewerLines");
    if (linesBox && resume?.rawText) {
      const rawLines = resume.rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      linesBox.innerHTML = rawLines
        .map((ln, idx) => `<div class="resume-line" data-line-idx="${idx}">${escapeHtml(ln)}</div>`)
        .join("");
    }

    // Filter requirements
    const allReqs = [
      ...(matchResult?.matchedSkills || []).map((m) => ({ ...m, bucket: "matched" })),
      ...(matchResult?.partialSkills || []).map((p) => ({ ...p, bucket: "adjacent" })),
      ...(matchResult?.missingSkills || []).map((g) => ({ ...g, bucket: "missing" })),
    ].filter((item) => !filterVal || item.jobSkill.toLowerCase().includes(filterVal));

    const reqListEl = document.getElementById("evidenceReqList");
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
                ? `${iconPrefix} Adjacent · Knows ${item.resumeSkill || "related"}`
                : `${iconPrefix} Gap · Click to Fix`;
          const proofLine = item.resumeEvidence || "";

          const compactStatus =
            item.bucket === "matched"
              ? "✓ Matched"
              : item.bucket === "adjacent"
                ? `▲ Adjacent${item.resumeSkill ? ` · ${item.resumeSkill}` : ""}`
                : "✕ Gap · Fix";

          return `
            <div class="evidence-req-item" tabindex="0" role="button" data-proof="${escapeHtml(proofLine)}" data-skill="${escapeHtml(item.jobSkill)}" data-fix-skill="${escapeHtml(item.jobSkill)}" data-fix-status="${item.bucket}">
              <div class="evidence-req-top">
                <div class="evidence-req-title">
                  <strong class="evidence-skill-name">${escapeHtml(item.jobSkill)}</strong>
                  <span class="evidence-skill-tier">${escapeHtml(item.tier || "Skill")}</span>
                </div>
                <span class="status-badge ${badgeClass} evidence-status-pill">${escapeHtml(compactStatus)}</span>
              </div>
              <p class="evidence-req-proof">
                ${item.bucket === "missing" ? "No proof line in resume — click for courses, projects &amp; resume fix." : `Proof: "${escapeHtml(proofLine)}"`}
              </p>
            </div>
          `;
        })
        .join("");

      reqListEl.querySelectorAll(".evidence-req-item").forEach((card) => {
        const triggerHighlight = () => {
          const proof = card.getAttribute("data-proof") || "";
          const skill = card.getAttribute("data-skill") || "";
          this.highlightProofLine(proof, skill);
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
  }

  highlightProofLine(proofText, skillName) {
    this.clearHighlights();
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
    }
  }


  renderCoursesTab(data) {
    const pillsBox = document.getElementById("reportCoursesSkillPills");
    const grid = document.getElementById("reportCoursesGrid");
    if (!pillsBox || !grid) return;

    const { matchResult } = data || {};
    const skills = [
      ...(matchResult?.missingSkills || []).map((m) => ({ name: m.jobSkill, type: "gap" })),
      ...(matchResult?.partialSkills || []).map((p) => ({ name: p.jobSkill, type: "partial" })),
      ...(matchResult?.matchedSkills || []).map((m) => ({ name: m.jobSkill, type: "matched" })),
    ];

    if (!skills.length) {
      pillsBox.innerHTML = `<span class="text-xs text-tertiary">Analyze a resume to see skill-specific courses and projects.</span>`;
      grid.innerHTML = "";
      return;
    }

    if (!this._selectedCourseSkill || !skills.some((s) => s.name === this._selectedCourseSkill)) {
      this._selectedCourseSkill = skills[0].name;
    }
    if (!this._selectedCourseCat) this._selectedCourseCat = "free";
    if (!this._coursesCache) this._coursesCache = new Map();

    pillsBox.innerHTML = skills.map((s) => {
      const active = s.name === this._selectedCourseSkill;
      const cls = s.type === "gap" ? "tag-gap" : s.type === "partial" ? "tag-partial" : "tag-match";
      return `<button type="button" class="tag ${cls} skill-pill-btn ${active ? "active" : ""}" data-course-skill="${escapeHtml(s.name)}">${escapeHtml(s.name)}</button>`;
    }).join("");

    pillsBox.querySelectorAll("[data-course-skill]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._selectedCourseSkill = btn.getAttribute("data-course-skill");
        pillsBox.querySelectorAll("[data-course-skill]").forEach((b) => b.classList.toggle("active", b === btn));
        this._loadCoursesForSkill(this._selectedCourseSkill, false);
      });
    });

    const catBar = document.getElementById("reportCoursesCategoryTabs");
    if (catBar && !catBar.dataset.bound) {
      catBar.dataset.bound = "1";
      catBar.querySelectorAll("[data-course-cat]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this._selectedCourseCat = btn.getAttribute("data-course-cat");
          catBar.querySelectorAll("[data-course-cat]").forEach((b) => b.classList.toggle("active", b === btn));
          const cached = this._coursesCache.get((this._selectedCourseSkill || "").toLowerCase());
          if (cached) this._paintCoursesGrid(cached);
        });
      });
    }

    const aiBtn = document.getElementById("reportCoursesAiRefreshBtn");
    if (aiBtn && !aiBtn.dataset.bound) {
      aiBtn.dataset.bound = "1";
      aiBtn.addEventListener("click", () => {
        if (this._selectedCourseSkill) {
          this._loadCoursesForSkill(this._selectedCourseSkill, true);
        }
      });
    }

    this._loadCoursesForSkill(this._selectedCourseSkill, false);
  }

  async _loadCoursesForSkill(skillName, useAi = false) {
    const grid = document.getElementById("reportCoursesGrid");
    if (!grid || !skillName) return;
    const key = skillName.toLowerCase();
    if (!useAi && this._coursesCache?.has(key)) {
      this._paintCoursesGrid(this._coursesCache.get(key));
      return;
    }

    const aiBtn = document.getElementById("reportCoursesAiRefreshBtn");
    if (useAi && aiBtn) {
      aiBtn.disabled = true;
      aiBtn.textContent = "Fetching via Gemini...";
    }
    grid.innerHTML = `<div class="p-3 text-center text-sm text-secondary" style="grid-column:1/-1;"><div class="spinner mb-1 mx-auto"></div>Loading ${escapeHtml(skillName)} courses &amp; projects...</div>`;

    try {
      const res = await api.post("/api/learning/resources", {
        skill: skillName,
        targetRole: store.get("targetRole") || "",
        useAi,
      }, { timeoutMs: useAi ? 18000 : 10000 });
      this._coursesCache.set(key, res);
      this._paintCoursesGrid(res);
    } catch (err) {
      grid.innerHTML = `<div class="card p-3 text-center text-xs text-secondary" style="grid-column:1/-1;">Unable to load courses right now: ${escapeHtml(err?.message || "Please retry.")}</div>`;
    } finally {
      if (aiBtn) {
        aiBtn.disabled = false;
        aiBtn.textContent = "✨ Fetch Latest via Gemini AI";
      }
    }
  }

  _paintCoursesGrid(data) {
    const grid = document.getElementById("reportCoursesGrid");
    if (!grid || !data) return;
    const cat = this._selectedCourseCat || "free";
    const items = cat === "paid" ? (data.paidAndCerts || []) : cat === "projects" ? (data.projects || []) : (data.freeCourses || []);

    grid.innerHTML = items.map((item) => `
      <div class="card learning-resource-card p-3 d-flex flex-col justify-between">
        <div>
          <div class="d-flex justify-between items-start gap-xs mb-1">
            <strong class="text-sm text-primary" style="line-height:1.35;">${escapeHtml(item.title)}</strong>
            <span class="status-badge ${cat === "paid" ? "status-info" : cat === "projects" ? "status-partial" : "status-matched"}" style="font-size:0.68rem;white-space:nowrap;flex-shrink:0;">
              ${escapeHtml(cat === "paid" ? (item.badge || "Certified") : cat === "projects" ? (item.difficulty || "Project") : "Free")}
            </span>
          </div>
          <div class="text-xxs font-mono text-tertiary mb-1">${escapeHtml(item.platform || (cat === "projects" ? "Portfolio Project" : "Verified"))} · ${escapeHtml(item.duration || "Self-paced")}</div>
          <p class="text-xs text-secondary m-0 mb-2" style="line-height:1.45;">${escapeHtml(item.summary || "")}</p>
        </div>
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" style="align-self:flex-start;">
          ${cat === "projects" ? "Starter Guide ↗" : cat === "paid" ? "View Course / Cert ↗" : "Open Free Course ↗"}
        </a>
      </div>
    `).join("");
  }

  clearHighlights() {
    document.querySelectorAll("#resumeViewerLines .resume-line").forEach((el) => {
      el.classList.remove("highlighted");
    });
  }
}

export const reportModule = new ReportModule();
