/**
 * CareerMatch AI: Job Market Feature Module
 * Single authoritative controller for #view-jobs (route: #/market).
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class MarketModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const filterBtn = document.getElementById("applyJobFiltersBtn");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => this.load(true));
    }

    const searchInput = document.getElementById("jobFilterSkill");
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.load(true);
        }
      });
    }

    store.subscribe("activeResume", () => {
      if (store.get("currentView") === "market") {
        this.load();
      }
    });
  }

  async load(showToastMsg = false) {
    const roleFilter = document.getElementById("jobFilterRole")?.value || "All";
    const workModeFilter = document.getElementById("jobFilterMode")?.value || "All";
    const locationFilter = document.getElementById("jobFilterLocation")?.value || "";
    const skillFilter = document.getElementById("jobFilterSkill")?.value || "";
    const preferLiveApi = Boolean(document.getElementById("jobPreferLiveCheck")?.checked);

    try {
      const resume = store.get("activeResume");
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/jobs/market", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resume,
          resumeId: resume?.id || "",
          roleFilter,
          workModeFilter,
          locationFilter,
          skillFilter,
          preferLiveApi,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch job market intelligence.");

      store.set("jobsData", data);
      this.render(data);
    } catch (err) {
      this.renderError(err.message);
    }
  }

  renderError(msg) {
    const cardsGrid = document.getElementById("jobsCardsGrid");
    if (cardsGrid) {
      cardsGrid.innerHTML = `
        <div class="card error-card" style="padding:1.5rem;text-align:center;grid-column:1/-1;">
          <p style="color:var(--score-low);">Unable to load job market data: ${escapeHtml(msg)}</p>
          <button type="button" class="btn btn-secondary btn-sm" id="jobsRetryBtn">Retry Search</button>
        </div>
      `;
      document.getElementById("jobsRetryBtn")?.addEventListener("click", () => this.load(true));
    }
  }

  render(data) {
    if (!data) return;

    const srcLabel = document.getElementById("jobsDataSourceLabel");
    if (srcLabel) srcLabel.textContent = data.dataSource || "Verified Industry Benchmarks";

    const updatedLabel = document.getElementById("jobsLastUpdatedLabel");
    if (updatedLabel) updatedLabel.textContent = data.lastUpdated || "Just now";

    const countLabel = document.getElementById("jobsTotalCount");
    if (countLabel) countLabel.textContent = data.totalListings ?? 0;

    // Trending Skills Chart
    const trendEl = document.getElementById("jobsTrendingChart");
    if (trendEl) {
      trendEl.innerHTML = (data.trendingSkills || [])
        .map(
          (t) => `
          <div class="bar-chart-row" style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
              <strong>${escapeHtml(t.skill)} ${t.inCandidateResume ? "✓" : ""}</strong>
              <span class="tabular-nums">${t.demandPct}%</span>
            </div>
            <div class="bar-chart-track" style="height:6px;background:var(--bg-sunken);border-radius:var(--radius-sm);overflow:hidden;">
              <div class="bar-chart-fill" style="width:${Math.min(100, t.demandPct)}%;height:100%;background:${t.inCandidateResume ? "var(--score-high)" : "var(--brand-accent)"};"></div>
            </div>
          </div>
        `
        )
        .join("");
    }

    // Company Matrix Table
    const matrixBody = document.getElementById("jobsCompanyMatrixBody");
    if (matrixBody) {
      matrixBody.innerHTML = (data.companyMatrix || [])
        .map(
          (cm) => `
          <tr>
            <td><strong>${escapeHtml(cm.companyName)}</strong><br><small style="color:var(--text-tertiary);">${escapeHtml(cm.location)}</small></td>
            <td>${escapeHtml(cm.roleTitle)}</td>
            <td class="tabular-nums">${escapeHtml(cm.salaryRange)}</td>
            <td><strong class="tabular-nums" style="color:var(--score-high);">${Math.round(cm.candidateMatchPct)}%</strong></td>
          </tr>
        `
        )
        .join("");
    }

    // Job Listings Cards
    const cardsGrid = document.getElementById("jobsCardsGrid");
    if (cardsGrid) {
      cardsGrid.innerHTML = (data.jobs || [])
        .map(
          (j) => `
          <div class="card" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; margin-bottom: 12px;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span class="step-badge">${escapeHtml(j.workMode)} · ${escapeHtml(j.experienceLevel)}</span>
                <span class="tag tag-match tabular-nums">${Math.round(j.matchScore)}% Match</span>
              </div>
              <h4 style="margin:4px 0; font-size:1.05rem;">${escapeHtml(j.title)}</h4>
              <p style="margin:0 0 6px; font-size:0.85rem;"><strong>${escapeHtml(j.companyName)}</strong> · ${escapeHtml(j.location)} · <span class="tabular-nums" style="color:var(--brand-accent); font-weight:600;">${escapeHtml(j.salaryRange)}</span></p>
              <p style="margin-bottom:8px; font-size:0.8125rem; color:var(--text-secondary);">${escapeHtml(j.descriptionSummary)}</p>
              <div style="display:flex; flex-wrap:wrap; gap:4px;">
                ${(j.matchedSkills || []).map((s) => `<span class="tag tag-match">● [✓] ${escapeHtml(s)}</span>`).join("")}
                ${(j.missingSkills || []).map((s) => `<span class="tag tag-gap">⬡ [✕] ${escapeHtml(s)}</span>`).join("")}
              </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:8px;border-top:1px solid var(--border-subtle);">
              <small style="color:var(--text-tertiary);font-size:0.75rem;font-family:var(--font-mono);">${escapeHtml(j.dataSource)}</small>
              <div style="display:flex;gap:6px;align-items:center;">
                <button type="button" class="btn btn-secondary btn-sm" data-track-job="${encodeURIComponent(JSON.stringify(j))}">+ Track in Kanban</button>
                <a href="${escapeHtml(j.applyUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Apply ↗</a>
              </div>
            </div>
          </div>
        `
        )
        .join("");

      cardsGrid.querySelectorAll("button[data-track-job]").forEach((btn) => {
        btn.addEventListener("click", () => {
          try {
            const raw = btn.getAttribute("data-track-job");
            const job = JSON.parse(decodeURIComponent(raw));
            const currentTracker = store.get("trackerJobs") || [];
            const exists = currentTracker.some((t) => t.id === job.id);
            if (!exists) {
              const newJob = {
                id: job.id || "job-" + Date.now(),
                title: job.title,
                company: job.companyName,
                location: job.location,
                stage: "wishlist",
                salary: job.salaryRange,
                match: job.matchScore,
                appliedDate: new Date().toISOString().split("T")[0],
              };
              currentTracker.push(newJob);
              store.set("trackerJobs", currentTracker);
              alert(`Added "${job.title} at ${job.companyName}" to your Application Kanban!`);
            } else {
              alert("This role is already in your application tracker.");
            }
          } catch (_) {}
        });
      });
    }
  }
}

export const marketModule = new MarketModule();
