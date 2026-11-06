/**
 * CareerMatch AI: Career Report Feature Module
 * Single authoritative controller for #view-report.
 * Manages tabs, score spotlights, evidence ledger, interactive resume proof highlighting, and export.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class ReportModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Report Tab navigation
    const tabBtns = document.querySelectorAll(".report-tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
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

  load() {
    const result = store.get("analysisResult");
    if (result) {
      this.render(result);
    } else {
      this.renderEmptyState();
    }
  }

  switchTab(tabId) {
    document.querySelectorAll(".report-tab-btn").forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".report-tab-panel").forEach((p) => {
      p.classList.toggle("active", p.id === `tab-${tabId}`);
      p.hidden = p.id !== `tab-${tabId}`;
    });
  }

  renderEmptyState() {
    const emptyContainer = document.getElementById("reportEmptyState");
    const contentContainer = document.getElementById("reportContentContainer");
    if (emptyContainer) emptyContainer.hidden = false;
    if (contentContainer) contentContainer.hidden = true;
  }

  render(data) {
    if (!data) {
      this.renderEmptyState();
      return;
    }

    const emptyContainer = document.getElementById("reportEmptyState");
    const contentContainer = document.getElementById("reportContentContainer");
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

    // Candidate title
    const candTitle = document.getElementById("reportCandidateCardTitle");
    if (candTitle) candTitle.textContent = resume?.contact?.name || "Candidate";

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

    // Render Evidence Tab
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

          return `
            <div class="evidence-req-item card" tabindex="0" role="button" data-proof="${escapeHtml(proofLine)}" data-skill="${escapeHtml(item.jobSkill)}" data-fix-skill="${escapeHtml(item.jobSkill)}" data-fix-status="${item.bucket}" style="padding: 10px 14px; margin-bottom: 6px; cursor: pointer;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
                <strong style="font-size: 0.9rem;">${escapeHtml(item.jobSkill)} <small style="color:var(--text-tertiary);font-weight:400;">(${escapeHtml(item.tier || "Skill")})</small></strong>
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

  clearHighlights() {
    document.querySelectorAll("#resumeViewerLines .resume-line").forEach((el) => {
      el.classList.remove("highlighted");
    });
  }
}

export const reportModule = new ReportModule();
