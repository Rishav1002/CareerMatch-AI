/**
 * CareerMatch AI: Application Kanban Tracker
 * Columns: Saved, Applied, Interview, Offer
 * Fed directly from Job Market Intelligence
 */

import { store } from "../store.js";

const LEGACY_FAKE_COMPANIES = new Set([
  "NexusCloud India",
  "FinTech ScaleUp",
  "Tata Consultancy Services (Digital)",
]);

function normalizeTrackerJob(raw) {
  if (!raw || typeof raw !== "object") return null;
  const col = raw.column || (raw.stage === "wishlist" ? "saved" : raw.stage) || "saved";
  return {
    id: raw.id || `job-${Date.now()}`,
    role: raw.role || raw.title || "Target Role",
    company: raw.company || raw.companyName || "Target Company",
    location: raw.location || "Remote / India",
    salary: raw.salary || raw.salaryRange || "Competitive",
    matchPct: raw.matchPct != null ? Math.round(Number(raw.matchPct)) : (raw.match != null ? Math.round(Number(raw.match)) : null),
    column: ["saved", "applied", "interview", "offer"].includes(col) ? col : "saved",
    dateAdded: raw.dateAdded || raw.appliedDate || new Date().toISOString().split("T")[0],
    notes: raw.notes || "",
  };
}

export class ApplicationTracker {
  constructor() {
    const stored = Array.isArray(store.get("trackerJobs")) ? store.get("trackerJobs") : [];
    const cleaned = stored
      .filter((j) => !(j && LEGACY_FAKE_COMPANIES.has(j.company) && /^job-[123]$/.test(String(j.id))))
      .map(normalizeTrackerJob)
      .filter(Boolean);
    this.jobs = cleaned;
    if (cleaned.length !== stored.length) {
      store.set("trackerJobs", this.jobs);
    }
  }

  init() {
    this.render();
    store.subscribe("trackerJobs", (newJobs) => {
      this.jobs = Array.isArray(newJobs) ? newJobs.map(normalizeTrackerJob).filter(Boolean) : [];
      this.render();
    });
  }

  addJob(jobData) {
    const newJob = {
      id: `job-${Date.now()}`,
      role: jobData.title || jobData.role || "Target Role",
      company: jobData.company || "Target Company",
      location: jobData.location || "India",
      salary: jobData.salary || "Competitive",
      matchPct: jobData.matchPct != null ? Math.round(Number(jobData.matchPct)) : null,
      column: "saved",
      dateAdded: new Date().toISOString().split("T")[0],
      notes: jobData.notes || "Added from Job Market Intelligence",
    };
    this.jobs.unshift(newJob);
    store.set("trackerJobs", [...this.jobs]);
    return newJob;
  }

  moveJob(jobId, targetCol) {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) {
      job.column = targetCol;
      store.set("trackerJobs", [...this.jobs]);
    }
  }

  deleteJob(jobId) {
    this.jobs = this.jobs.filter((j) => j.id !== jobId);
    store.set("trackerJobs", [...this.jobs]);
  }

  render() {
    const board = document.getElementById("kanbanBoardContainer");
    if (!board) return;

    const columns = [
      { id: "saved", title: "Saved Opportunities" },
      { id: "applied", title: "Applications Submitted" },
      { id: "interview", title: "Interviewing" },
      { id: "offer", title: "Offers & Next Steps" },
    ];

    board.innerHTML = columns
      .map((col) => {
        const colJobs = this.jobs.filter((j) => j.column === col.id);
        return `
          <div class="kanban-col" data-col="${col.id}">
            <div class="kanban-col-header">
              <span>${col.title}</span>
              <span class="score-pill">${colJobs.length}</span>
            </div>
            <div class="kanban-col-cards" style="display: flex; flex-direction: column; gap: var(--space-1);">
              ${colJobs.length === 0 ? `
                <div style="padding: var(--space-3); text-align: center; color: var(--text-tertiary); font-size: 0.8125rem;">
                  No jobs in this stage.
                </div>
              ` : colJobs.map((j) => this._renderJobCard(j)).join("")}
            </div>
          </div>
        `;
      })
      .join("");

    this._bindCardActions(board);
  }

  _renderJobCard(job) {
    const matchClass = job.matchPct >= 80 ? "high" : job.matchPct >= 65 ? "mid" : "low";
    return `
      <div class="kanban-card" data-job-id="${job.id}">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-1);">
          <strong style="font-size: 0.9rem; line-height: 1.3; color: var(--text-primary);">${job.role}</strong>
          ${job.matchPct != null ? `<span class="score-pill ${matchClass}" style="white-space:nowrap;flex-shrink:0;">${job.matchPct}% match</span>` : ""}
        </div>
        <div style="font-size: 0.8125rem; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between;">
          <span>${job.company}</span>
          <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-tertiary);">${job.salary}</span>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-tertiary); margin: 2px 0;">${job.location}</p>
        ${job.notes ? `<div style="font-size: 0.75rem; background: var(--bg-sunken); padding: 4px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); color: var(--text-secondary);">${job.notes}</div>` : ""}

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-subtle);">
          <select class="form-select kanban-move-select" style="font-size: 0.75rem; padding: 2px 6px; width: auto;" data-job-id="${job.id}">
            <option value="saved" ${job.column === "saved" ? "selected" : ""}>Stage: Saved</option>
            <option value="applied" ${job.column === "applied" ? "selected" : ""}>Stage: Applied</option>
            <option value="interview" ${job.column === "interview" ? "selected" : ""}>Stage: Interview</option>
            <option value="offer" ${job.column === "offer" ? "selected" : ""}>Stage: Offer</option>
          </select>
          <button class="btn btn-ghost btn-sm kanban-delete-btn" data-job-id="${job.id}" style="font-size: 0.75rem; padding: 2px 6px;" title="Remove">✕</button>
        </div>
      </div>
    `;
  }

  _bindCardActions(container) {
    container.querySelectorAll(".kanban-move-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        const jobId = e.target.getAttribute("data-job-id");
        this.moveJob(jobId, e.target.value);
      });
    });

    container.querySelectorAll(".kanban-delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const jobId = e.target.getAttribute("data-job-id");
        this.deleteJob(jobId);
      });
    });
  }
}

export const tracker = new ApplicationTracker();
