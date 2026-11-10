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
    const uploadBtn = document.getElementById("dashUploadResumeBtn") || document.getElementById("dashStartAnalysisBtn");
    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
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
      if (store.get("currentView") === "dashboard") this.load();
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
    if (!dash || typeof dash !== "object") {
      this._renderFallback();
      return;
    }

    const currentUser = store.get("currentUser");
    const isAuthenticated = Boolean(currentUser?.id && store.get("token"));
    const totalResumesValue = Number(dash.totalResumes ?? 0);
    const totalAnalysesValue = Number(dash.totalJobsCompared ?? 0);
    const history = Array.isArray(dash.recentHistory) ? dash.recentHistory : [];
    const hasAnalysis = totalAnalysesValue > 0 || history.length > 0;

    const totalRes = document.getElementById("dashTotalResumes");
    if (totalRes) totalRes.textContent = String(totalResumesValue);

    const totalAna = document.getElementById("dashTotalAnalyses");
    if (totalAna) totalAna.textContent = String(totalAnalysesValue);

    const avgSc = document.getElementById("dashAvgScore");
    if (avgSc) {
      avgSc.textContent = hasAnalysis
        ? `${Math.round(Number(dash.averageCompatibilityScore ?? 0))}%`
        : "—";
    }

    const readSt = document.getElementById("dashReadinessStatus");
    if (readSt) {
      readSt.textContent = hasAnalysis
        ? (dash.readinessStatus || "Analysis available")
        : "Not calculated";
    }

    const greeting = document.getElementById("dashCandidateGreeting");
    if (greeting) {
      const name = currentUser?.fullName || currentUser?.name;
      greeting.textContent = name ? `Welcome, ${name}` : "Welcome to CareerMatch AI";
    }

    // The dashboard API currently does not provide a verified PRI/ATS/market
    // score contract. Never display hardcoded sample scores as real results.
    const priScore = document.getElementById("ovPriScore");
    if (priScore) priScore.textContent = "—";
    const priTier = document.getElementById("ovPriTier");
    if (priTier) priTier.textContent = "Not calculated";
    ["ovTechScore", "ovAtsScore", "ovMarketScore"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = "—";
    });
    const gauge = document.getElementById("dashPriGaugeCircle");
    if (gauge) gauge.style.strokeDashoffset = "264";

    const matchedEl = document.getElementById("dashTopMatched");
    if (matchedEl) {
      const skills = Array.isArray(dash.topMatchedSkills) ? dash.topMatchedSkills : [];
      matchedEl.innerHTML = skills.length
        ? skills.map((s) => `<span class="tag tag-match">${escapeHtml(s.skill)} (${Number(s.count) || 0})</span>`).join("")
        : `<span class="text-tertiary text-xs">No matched skills recorded yet.</span>`;
    }

    const missingEl = document.getElementById("dashTopMissing");
    if (missingEl) {
      const gaps = Array.isArray(dash.topMissingSkills) ? dash.topMissingSkills : [];
      missingEl.innerHTML = gaps.length
        ? gaps.map((s) => `<span class="tag tag-gap">${escapeHtml(s.skill)} (${Number(s.count) || 0})</span>`).join("")
        : `<span class="text-tertiary text-xs">No priority skill gaps recorded.</span>`;
    }

    // History is a signed-in workspace feature. This is a UI privacy measure;
    // the API must independently enforce owner-scoped access on the server.
    const historyCard = document.getElementById("dashHistoryCard");
    const tbody = document.getElementById("dashHistoryBody");
    if (historyCard) historyCard.hidden = !isAuthenticated;

    if (tbody) {
      if (!isAuthenticated) {
        tbody.replaceChildren();
      } else if (history.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-tertiary">No analyses recorded yet. <a href="#/analyzer">Analyze a resume</a> to get started.</td></tr>`;
      } else {
        tbody.innerHTML = history.map((h) => `
          <tr>
            <td><strong>${escapeHtml(h.candidateName || "Candidate")}</strong></td>
            <td>${escapeHtml(h.targetRole || "—")} <small class="text-tertiary">(${escapeHtml(h.goalCompany || "Benchmark")})</small></td>
            <td><strong class="tabular-nums">${Math.round(Number(h.overallScore) || 0)}%</strong></td>
            <td class="tabular-nums">${Math.round(Number(h.mandatoryMetPct) || 0)}%</td>
            <td>${Number(h.matchedCount) || 0} matched · ${Number(h.missingCount) || 0} gaps</td>
            <td class="text-tertiary text-xs">${escapeHtml(h.createdAt || "")}</td>
            <td>
              <div class="d-flex gap-xs">
                <button type="button" class="btn btn-ghost btn-sm" data-load-history="${encodeURIComponent(String(h.id))}">Load</button>
                <button type="button" class="btn btn-ghost btn-sm" data-delete-history="${encodeURIComponent(String(h.id))}">Delete</button>
              </div>
            </td>
          </tr>
        `).join("");

        tbody.querySelectorAll("button[data-load-history]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            await this.loadHistoryItem(decodeURIComponent(btn.getAttribute("data-load-history")));
          });
        });

        tbody.querySelectorAll("button[data-delete-history]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            await this.deleteHistoryItem(decodeURIComponent(btn.getAttribute("data-delete-history")));
          });
        });
      }
    }

    const nextAction = document.getElementById("dashNextActionCard");
    if (nextAction) nextAction.hidden = !hasAnalysis;
    const tipsCard = document.getElementById("dashActionTipsCard");
    if (tipsCard) tipsCard.hidden = !hasAnalysis;
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
    const defaults = {
      dashTotalResumes: "0",
      dashTotalAnalyses: "0",
      dashAvgScore: "—",
      dashReadinessStatus: "Not calculated",
      ovPriScore: "—",
      ovPriTier: "Not calculated",
      ovTechScore: "—",
      ovAtsScore: "—",
      ovMarketScore: "—",
    };

    Object.entries(defaults).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });

    const gauge = document.getElementById("dashPriGaugeCircle");
    if (gauge) gauge.style.strokeDashoffset = "264";

    const currentUser = store.get("currentUser");
    const isAuthenticated = Boolean(currentUser?.id && store.get("token"));
    const historyCard = document.getElementById("dashHistoryCard");
    if (historyCard) historyCard.hidden = !isAuthenticated;

    const tbody = document.getElementById("dashHistoryBody");
    if (tbody) {
      tbody.innerHTML = isAuthenticated
        ? `<tr><td colspan="7" class="text-center text-tertiary">History could not be loaded. Please retry.</td></tr>`
        : "";
    }

    const nextAction = document.getElementById("dashNextActionCard");
    if (nextAction) nextAction.hidden = true;
    const tipsCard = document.getElementById("dashActionTipsCard");
    if (tipsCard) tipsCard.hidden = true;
  }}

export const dashboardModule = new DashboardModule();
