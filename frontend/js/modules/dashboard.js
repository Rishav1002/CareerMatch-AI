/**
 * CareerMatch AI: Dashboard Feature Module
 * Single authoritative controller for #view-dashboard.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { formatPercent, escapeHtml } from "../formatters.js";

export class DashboardModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Attach listeners for actions inside dashboard
    const startAnalysisBtn = document.getElementById("dashStartAnalysisBtn");
    if (startAnalysisBtn) {
      startAnalysisBtn.addEventListener("click", () => {
        window.location.hash = "#/analyzer";
      });
    }

    const uploadResumeBtn = document.getElementById("dashUploadResumeBtn");
    if (uploadResumeBtn) {
      uploadResumeBtn.addEventListener("click", () => {
        window.location.hash = "#/analyzer";
      });
    }

    // Subscribe to activeResume and analysisResult changes
    store.subscribe("activeResume", () => {
      if (store.get("currentView") === "dashboard") {
        this.load();
      }
    });

    store.subscribe("analysisResult", (res) => {
      if (store.get("currentView") === "dashboard" && res?.dashboard) {
        this.render(res.dashboard);
      }
    });
  }

  async load() {
    const resume = store.get("activeResume");
    const resumeId = resume?.id || null;

    try {
      const url = resumeId ? `/api/dashboard?resumeId=${encodeURIComponent(resumeId)}` : "/api/dashboard";
      const headers = {};
      const token = store.get("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        this.render(data);
      } else {
        this._renderFallback();
      }
    } catch (_) {
      this._renderFallback();
    }
  }

  render(dash) {
    if (!dash) {
      this._renderFallback();
      return;
    }

    const totalRes = document.getElementById("dashTotalResumes");
    if (totalRes) totalRes.textContent = dash.totalResumes ?? 0;

    const totalAna = document.getElementById("dashTotalAnalyses");
    if (totalAna) totalAna.textContent = dash.totalJobsCompared ?? 0;

    const avgSc = document.getElementById("dashAvgScore");
    if (avgSc) avgSc.textContent = `${Math.round(dash.averageCompatibilityScore ?? 0)}%`;

    const readSt = document.getElementById("dashReadinessStatus");
    if (readSt) readSt.textContent = dash.readinessStatus || "Ready to evaluate";

    const matchedEl = document.getElementById("dashTopMatched");
    if (matchedEl) {
      const skills = dash.topMatchedSkills || [];
      if (skills.length === 0) {
        matchedEl.innerHTML = `<span style="color:var(--text-tertiary);font-size:0.8rem;">No matched skills recorded yet.</span>`;
      } else {
        matchedEl.innerHTML = skills
          .map((s) => `<span class="tag tag-match">${escapeHtml(s.skill)} (${s.count})</span>`)
          .join("");
      }
    }

    const missingEl = document.getElementById("dashTopMissing");
    if (missingEl) {
      const gaps = dash.topMissingSkills || [];
      if (gaps.length === 0) {
        missingEl.innerHTML = `<span style="color:var(--text-tertiary);font-size:0.8rem;">No priority skill gaps recorded.</span>`;
      } else {
        missingEl.innerHTML = gaps
          .map((s) => `<span class="tag tag-gap">${escapeHtml(s.skill)} (${s.count})</span>`)
          .join("");
      }
    }

    // Render recent analyses history table
    const tbody = document.getElementById("dashHistoryBody");
    if (tbody) {
      const history = dash.recentHistory || [];
      if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:var(--text-tertiary);">No analyses recorded yet. Click <a href="#/analyzer" style="color:var(--brand-accent);">Analyze Resume</a> to benchmark your profile.</td></tr>`;
      } else {
        tbody.innerHTML = history
          .map(
            (h) => `
            <tr>
              <td><strong>${escapeHtml(h.candidateName || "Candidate")}</strong></td>
              <td>${escapeHtml(h.targetRole)} <small style="color:var(--text-tertiary);">(${escapeHtml(h.goalCompany || "Benchmark")})</small></td>
              <td><strong class="tabular-nums" style="color:var(--score-high);">${Math.round(h.overallScore)}%</strong></td>
              <td class="tabular-nums">${Math.round(h.mandatoryMetPct)}%</td>
              <td>${h.matchedCount} matched · ${h.missingCount} gaps</td>
              <td style="color:var(--text-tertiary);font-size:0.78rem;">${escapeHtml(h.createdAt || "")}</td>
              <td>
                <div style="display:flex;gap:0.35rem;">
                  <button type="button" class="btn btn-ghost btn-sm" data-load-history="${h.id}">Load</button>
                  <button type="button" class="btn btn-ghost btn-sm" data-delete-history="${h.id}">Delete</button>
                </div>
              </td>
            </tr>
          `
          )
          .join("");

        tbody.querySelectorAll("button[data-load-history]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-load-history");
            await this.loadHistoryItem(id);
          });
        });

        tbody.querySelectorAll("button[data-delete-history]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-delete-history");
            await this.deleteHistoryItem(id);
          });
        });
      }
    }
  }

  async loadHistoryItem(id) {
    if (!id) return;
    try {
      const token = store.get("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/history/${encodeURIComponent(id)}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not load record");

      store.set("analysisResult", data);
      store.set("activeResume", data.resume);
      if (data.targetRole) store.set("targetRole", data.targetRole);
      window.location.hash = "#/report";
    } catch (err) {
      alert("Failed to load analysis: " + err.message);
    }
  }

  async deleteHistoryItem(id) {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this analysis record?")) return;
    try {
      const token = store.get("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/history/${encodeURIComponent(id)}`, { method: "DELETE", headers });
      if (res.ok) {
        this.load();
      }
    } catch (_) {}
  }

  _renderFallback() {
    const resume = store.get("activeResume");
    const totalRes = document.getElementById("dashTotalResumes");
    if (totalRes) totalRes.textContent = resume ? 1 : 0;
    const totalAna = document.getElementById("dashTotalAnalyses");
    if (totalAna) totalAna.textContent = store.get("analysisResult") ? 1 : 0;
  }
}

export const dashboardModule = new DashboardModule();
