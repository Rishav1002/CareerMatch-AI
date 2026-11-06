/**
 * CareerMatch AI: Placement Readiness Index (PRI) Feature Module
 * Single authoritative controller for #view-pri (route: #/readiness).
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class PriModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const recalcBtn = document.getElementById("recalculatePriBtn");
    if (recalcBtn) {
      recalcBtn.addEventListener("click", () => this.load());
    }

    const uploadCta = document.getElementById("priEmptyUploadCtaBtn");
    if (uploadCta) {
      uploadCta.addEventListener("click", () => {
        window.location.hash = "#/analyzer";
      });
    }

    store.subscribe("activeResume", (resume) => {
      if (store.get("currentView") === "readiness") {
        if (resume) this.load();
        else this.renderEmptyState();
      }
    });
  }

  async load() {
    const resume = store.get("activeResume");
    if (!resume) {
      this.renderEmptyState();
      return;
    }

    try {
      const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const weights = {
        technicalSkills: parseFloat(document.getElementById("priWTech")?.value || "25"),
        resumeQuality: parseFloat(document.getElementById("priWRes")?.value || "15"),
        interviewPerformance: parseFloat(document.getElementById("priWInt")?.value || "20"),
        portfolioEvidence: parseFloat(document.getElementById("priWPort")?.value || "15"),
        assessmentPerformance: parseFloat(document.getElementById("priWAsmt")?.value || "15"),
        marketAlignment: parseFloat(document.getElementById("priWMkt")?.value || "10"),
      };

      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/readiness/index", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resume,
          resumeId: resume.id,
          targetRole,
          weights,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not compute PRI.");

      store.set("priData", data);
      this.render(data);
    } catch (err) {
      this.renderError(err.message);
    }
  }

  renderEmptyState() {
    const emptyContainer = document.getElementById("priEmptyState");
    const contentContainer = document.getElementById("priContentContainer");
    if (emptyContainer) emptyContainer.hidden = false;
    if (contentContainer) contentContainer.hidden = true;
  }

  renderError(msg) {
    const container = document.getElementById("priBreakdownBars");
    if (container) {
      container.innerHTML = `
        <div class="card error-card" style="padding:1.5rem;text-align:center;">
          <p style="color:var(--score-low);">Unable to compute readiness index: ${escapeHtml(msg)}</p>
          <button type="button" class="btn btn-secondary btn-sm" id="priRetryBtn">Retry</button>
        </div>
      `;
      document.getElementById("priRetryBtn")?.addEventListener("click", () => this.load());
    }
  }

  render(data) {
    if (!data) {
      this.renderEmptyState();
      return;
    }

    const emptyContainer = document.getElementById("priEmptyState");
    const contentContainer = document.getElementById("priContentContainer");
    if (emptyContainer) emptyContainer.hidden = true;
    if (contentContainer) contentContainer.hidden = false;

    const priRounded = Math.round(data.priScore || 0);

    const bigScore = document.getElementById("priBigScore");
    if (bigScore) bigScore.textContent = `${priRounded}%`;

    const tierBadge = document.getElementById("priTierBadge");
    if (tierBadge) tierBadge.textContent = data.readinessTier || "";

    const candHeader = document.getElementById("priCandidateHeader");
    if (candHeader) candHeader.textContent = `${data.candidateName || "Candidate"} — ${data.targetRole || "Target Role"}`;

    const verifiedText = document.getElementById("priVerifiedCountText");
    if (verifiedText) verifiedText.textContent = `${data.verifiedModulesCount || 0} of ${data.totalModulesCount || 6} intelligence pillars verified with live data`;

    const disclaimer = document.getElementById("priDisclaimerText");
    if (disclaimer) disclaimer.textContent = data.disclaimer || "";

    // Sync sidebar badge
    const sbBadge = document.getElementById("sidebarPriBadge");
    if (sbBadge) sbBadge.textContent = `${priRounded}%`;

    // Render 6 Pillar Breakdown Bars
    const priBars = document.getElementById("priBreakdownBars");
    if (priBars) {
      priBars.innerHTML = (data.categoryBreakdown || [])
        .map(
          (c) => `
          <div class="bar-chart-row" style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
              <span><strong>${escapeHtml(c.category)}</strong> <small style="color:var(--text-tertiary);">(${c.weightPct}% weight)</small></span>
              <span class="tabular-nums" style="font-weight:600;">${Math.round(c.rawScore)}%</span>
            </div>
            <div class="bar-chart-track" style="height:6px;background:var(--bg-sunken);border-radius:var(--radius-sm);overflow:hidden;">
              <div class="bar-chart-fill" style="width:${Math.min(100, c.rawScore)}%;height:100%;background:${c.isVerified ? "var(--score-high)" : "var(--brand-accent)"};"></div>
            </div>
          </div>
        `
        )
        .join("");
    }

    // Strengths
    const strEl = document.getElementById("priStrengthsList");
    if (strEl) {
      strEl.innerHTML = (data.strengths || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
    }

    // Weaknesses / Priority Gaps
    const wkEl = document.getElementById("priWeaknessesList");
    if (wkEl) {
      wkEl.innerHTML = (data.weaknesses || []).map((w) => `<li>${escapeHtml(w)}</li>`).join("");
    }
  }
}

export const priModule = new PriModule();
