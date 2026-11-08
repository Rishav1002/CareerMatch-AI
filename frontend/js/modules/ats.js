/**
 * CareerMatch AI: ATS Resume Simulator Feature Module
 * Single authoritative controller for #view-ats.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class AtsModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const rerunBtn = document.getElementById("reEvaluateAtsBtn") || document.getElementById("runAtsAuditBtn");
    if (rerunBtn) {
      rerunBtn.addEventListener("click", () => this.load(true));
    }

    const downloadBtn = document.getElementById("downloadAtsResumeBtn");
    if (downloadBtn) {
      downloadBtn.addEventListener("click", () => {
        const resume = store.get("activeResume");
        const text = resume?.raw_text || resume?.text || "No resume text available";
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ats-optimized-resume-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }

    const uploadCta = document.getElementById("atsEmptyUploadCtaBtn");
    if (uploadCta) {
      uploadCta.addEventListener("click", () => {
        window.location.hash = "#/analyzer";
      });
    }

    store.subscribe("activeResume", (resume) => {
      if (store.get("currentView") === "ats") {
        if (resume) this.load();
        else this.renderEmptyState();
      }
    });
  }

  async load(forceRefresh = false) {
    const resume = store.get("activeResume");
    if (!resume) {
      this.renderEmptyState();
      return;
    }

    // Use cached ATS result if present and not forced
    const cached = store.get("atsResult");
    if (cached && !forceRefresh) {
      this.render(cached);
      return;
    }

    try {
      const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const goalCompany = store.get("goalCompany") || document.getElementById("goalCompanyInput")?.value || "";
      const customJd = document.getElementById("customJdInput")?.value || "";

      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/ats/evaluate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resume,
          resumeId: resume.id,
          targetRole,
          goalCompany,
          customJdText: customJd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "ATS evaluation failed.");

      store.set("atsResult", data);
      this.render(data);
    } catch (err) {
      this.renderError(err.message);
    }
  }

  renderEmptyState() {
    const emptyContainer = document.getElementById("atsEmptyStateContainer");
    const contentContainer = document.getElementById("atsContentContainer");
    if (emptyContainer) emptyContainer.hidden = false;
    if (contentContainer) contentContainer.hidden = true;
  }

  renderError(msg) {
    const content = document.getElementById("atsContentContainer");
    if (content) {
      content.innerHTML = `
        <div class="card error-card" style="padding:1.5rem;text-align:center;">
          <p style="color:var(--score-low);font-weight:600;">Unable to evaluate ATS score: ${escapeHtml(msg)}</p>
          <button type="button" class="btn btn-secondary btn-sm" id="atsRetryBtn">Retry Evaluation</button>
        </div>
      `;
      document.getElementById("atsRetryBtn")?.addEventListener("click", () => this.load(true));
    }
  }

  render(data) {
    if (!data) {
      this.renderEmptyState();
      return;
    }

    const emptyContainer = document.getElementById("atsEmptyStateContainer");
    const contentContainer = document.getElementById("atsContentContainer");
    if (emptyContainer) emptyContainer.hidden = true;
    if (contentContainer) contentContainer.hidden = false;

    // Render KPI tiles
    const kpiContainer = document.getElementById("atsPillarKpis");
    if (kpiContainer) {
      kpiContainer.innerHTML = [
        `<div class="kpi-card"><span class="kpi-label">Overall ATS Compatibility</span><div class="kpi-value" style="color:var(--score-high);">${Math.round(data.atsScore)}%</div><span class="kpi-sub">Role: ${escapeHtml(data.targetRole || "Benchmark")}</span></div>`,
        ...(data.pillars || []).slice(0, 3).map(
          (p) => `
          <div class="kpi-card">
            <span class="kpi-label">${escapeHtml(p.name)} (${p.weightPct}%)</span>
            <div class="kpi-value">${Math.round(p.score)}%</div>
            <span class="kpi-sub">Pillar Weight: ${p.weightPct}%</span>
          </div>
        `
        ),
      ].join("");
    }

    // Section audit list
    const secAuditEl = document.getElementById("atsSectionAuditList");
    if (secAuditEl) {
      secAuditEl.innerHTML = (data.sectionAudit || [])
        .map(
          (s) => `
          <div class="evidence-req-item" style="cursor:default;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${escapeHtml(s.section)}</strong>
              <span class="tag ${s.status === "Pass" ? "tag-match" : "tag-partial"}">${escapeHtml(s.status)} · ${s.score}%</span>
            </div>
            <p style="margin:0.25rem 0 0;font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(s.finding)}</p>
          </div>
        `
        )
        .join("");
    }

    // Formatting checks
    const fmtChecksEl = document.getElementById("atsFormattingChecksList");
    if (fmtChecksEl) {
      fmtChecksEl.innerHTML = (data.formattingChecks || [])
        .map(
          (f) => `
          <div class="evidence-req-item" style="cursor:default;margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${escapeHtml(f.check)}</strong>
              <span class="tag ${f.passed ? "tag-match" : "tag-gap"}">${f.passed ? "✓ Passed" : "Needs Fix"}</span>
            </div>
            <p style="margin:0.25rem 0 0;font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(f.detail)}</p>
          </div>
        `
        )
        .join("");
    }

    // Missing ATS keywords
    const kwEl = document.getElementById("atsMissingKeywordsList") || document.getElementById("atsMissingKeywordsTags");
    if (kwEl) {
      const missingKw = data.missingKeywords || [];
      if (missingKw.length === 0) {
        kwEl.innerHTML = `<span class="tag tag-match">No critical keywords missing!</span>`;
      } else {
        kwEl.innerHTML = missingKw
          .map((k) => `<span class="tag tag-gap">${escapeHtml(k.keyword)} (+${k.impactPoints} pts)</span>`)
          .join("");
      }
    }
  }
}

export const atsModule = new AtsModule();
