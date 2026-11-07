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

    const filterBtn = document.getElementById("runJobsFilterBtn") || document.getElementById("applyJobFiltersBtn");
    if (filterBtn) {
      filterBtn.addEventListener("click", () => this.load(true));
    }

    const exportCsvBtn = document.getElementById("jobsExportCsvBtn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.exportCsv());
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

    ["jobFilterRole", "jobFilterLocation", "jobFilterMode", "jobFilterExp"].forEach((id) => {
      document.getElementById(id)?.addEventListener("change", () => this.load());
    });

    store.subscribe("activeResume", () => {
      if (store.get("currentView") === "market" || store.get("currentView") === "jobs") {
        this.load();
      }
    });
  }

  exportCsv() {
    const data = store.get("jobsData");
    const jobs = data?.jobs || [];
    if (!jobs.length) {
      if (window.showToast) window.showToast("No jobs to export. Please load openings first.");
      return;
    }

    const headers = ["Title", "Company", "Location", "WorkMode", "Experience", "SalaryRange", "MatchScore", "Source", "ApplyUrl"];
    const rows = jobs.map((j) => [
      `"${(j.title || "").replace(/"/g, '""')}"`,
      `"${(j.companyName || "").replace(/"/g, '""')}"`,
      `"${(j.location || "").replace(/"/g, '""')}"`,
      `"${(j.workMode || "").replace(/"/g, '""')}"`,
      `"${(j.experienceLevel || "").replace(/"/g, '""')}"`,
      `"${(j.salaryRange || "").replace(/"/g, '""')}"`,
      j.matchScore != null ? `${j.matchScore}%` : "N/A",
      `"${(j.dataSource || "").replace(/"/g, '""')}"`,
      `"${(j.applyUrl || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `careermatch_jobs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast("Exported jobs to CSV");
  }

  async load(showToastMsg = false) {
    const roleFilter = document.getElementById("jobFilterRole")?.value || "All";
    const workModeFilter = document.getElementById("jobFilterMode")?.value || "";
    const locationFilter = document.getElementById("jobFilterLocation")?.value || "";
    const experienceFilter = document.getElementById("jobFilterExp")?.value || "";
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
          experienceFilter,
          skillFilter,
          preferLiveApi,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch job market intelligence.");

      store.set("jobsData", data);
      this.render(data);
      if (showToastMsg && window.showToast) window.showToast(`Found ${data.totalListings || 0} active openings`);
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
          <div class="card p-3 d-flex flex-col flex-between mb-2 border-subtle">
            <div>
              <div class="d-flex flex-between align-center mb-1">
                <span class="badge-tag">${escapeHtml(j.workMode)} · ${escapeHtml(j.experienceLevel)}</span>
                ${j.matchScore != null ? `<span class="tag tag-match tabular-nums font-semibold">${Math.round(j.matchScore)}% Match</span>` : ""}
              </div>
              <h4 class="text-base font-semibold m-0 mb-1 text-primary">${escapeHtml(j.title)}</h4>
              <p class="text-xs text-secondary m-0 mb-1"><strong>${escapeHtml(j.companyName)}</strong> · ${escapeHtml(j.location)} · <span class="tabular-nums font-semibold text-accent">${escapeHtml(j.salaryRange)}</span></p>
              <p class="text-xs text-tertiary mb-2 line-clamp-2">${escapeHtml(j.descriptionSummary)}</p>
              ${j.matchedSkills?.length || j.missingSkills?.length ? `
                <div class="d-flex flex-wrap gap-xxs mb-2">
                  ${(j.matchedSkills || []).map((s) => `<span class="tag tag-match text-xxs">✓ ${escapeHtml(s)}</span>`).join("")}
                  ${(j.missingSkills || []).map((s) => `<span class="tag tag-gap text-xxs">✕ ${escapeHtml(s)}</span>`).join("")}
                </div>
              ` : ""}
            </div>
            <div class="d-flex flex-between align-center pt-2 border-top mt-2">
              <small class="text-tertiary font-mono text-xxs">${escapeHtml(j.dataSource)}</small>
              <div class="d-flex gap-xs align-center">
                <button type="button" class="btn btn-secondary btn-sm" data-track-job="${encodeURIComponent(JSON.stringify(j))}">+ Track</button>
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
                match: job.matchScore || 0,
                appliedDate: new Date().toISOString().split("T")[0],
              };
              currentTracker.push(newJob);
              store.set("trackerJobs", currentTracker);
              if (window.showToast) window.showToast(`Added "${job.title}" to Application Tracker`);
            } else {
              if (window.showToast) window.showToast("Role is already in your application tracker", "warning");
            }
          } catch (_) {}
        });
      });
    }
  }
}

export const marketModule = new MarketModule();
