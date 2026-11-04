/**
 * CareerMatch AI: Resume Version History & Score Diff Ledger
 * Compares iterations of candidate resumes over time with point deltas
 */

import { store } from "../store.js";

const DEFAULT_RESUME_HISTORY = [];

export class HistoryDiff {
  constructor() {
    this.history = store.get("resumeHistory") || [];
  }

  init() {
    this.render();
    store.subscribe("resumeHistory", (h) => {
      this.history = h;
      this.render();
    });
  }

  recordAnalysis(result, resume, targetRole) {
    if (!result) return;
    const match = result.matchResult || result;
    const rawScore = match.overallScore !== undefined ? match.overallScore : (result.overallScore || 0);
    const entry = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      role: targetRole || "Data Engineer",
      filename: (resume && (resume.filename || resume.rawFilename)) || "Uploaded_Resume.pdf",
      score: Math.round(rawScore * 10) / 10,
      matchedCount: (match.matchedSkills || []).length,
      missingCount: (match.missingSkills || []).length,
      matchedSkills: (match.matchedSkills || []).map((s) => s.jobSkill || s),
      missingSkills: (match.missingSkills || []).map((s) => s.jobSkill || s),
    };
    this.history.unshift(entry);
    store.set("resumeHistory", [...this.history]);
  }

  render() {
    const container = document.getElementById("resumeHistoryListContainer");
    const diffContainer = document.getElementById("historyDiffContainer");
    if (!container) return;

    if (this.history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--space-3); color: var(--text-tertiary); font-size: 0.85rem;">
          No previous analysis versions recorded yet.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="ledger-table-wrapper">
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Version / File</th>
              <th>Target Role</th>
              <th class="num">Score</th>
              <th>Matched / Gaps</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${this.history.map((h, i) => `
              <tr>
                <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-tertiary);">${h.timestamp}</td>
                <td><strong style="color: var(--text-primary); font-size: 0.85rem;">${h.filename}</strong></td>
                <td>${h.role}</td>
                <td class="num">
                  <span class="score-pill ${h.score >= 70 ? "high" : h.score >= 50 ? "mid" : "low"}">
                    ${h.score}%
                  </span>
                </td>
                <td style="font-family: var(--font-mono); font-size: 0.8rem;">
                  <span style="color: var(--score-high);">${h.matchedCount} matched</span> / 
                  <span style="color: var(--score-low);">${h.missingCount} gaps</span>
                </td>
                <td>
                  <button class="btn btn-secondary btn-sm diff-select-btn" data-hist-id="${h.id}">
                    Compare Diff
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    // Render diff between the two most recent versions if at least 2 exist
    if (this.history.length >= 2 && diffContainer) {
      this.renderDiff(this.history[1], this.history[0], diffContainer);
    }

    container.querySelectorAll(".diff-select-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-hist-id");
        const selected = this.history.find((h) => h.id === id);
        const latest = this.history[0];
        if (selected && diffContainer) {
          this.renderDiff(selected, latest, diffContainer);
          diffContainer.scrollIntoView({ behavior: "smooth" });
        }
      });
    });
  }

  renderDiff(vOld, vNew, container) {
    const delta = Math.round((vNew.score - vOld.score) * 10) / 10;
    const isGain = delta >= 0;

    // Skills gained
    const oldMatchedSet = new Set(vOld.matchedSkills || []);
    const newlyMatched = (vNew.matchedSkills || []).filter((s) => !oldMatchedSet.has(s));

    container.innerHTML = `
      <div class="card" style="margin-top: var(--space-3); border-color: var(--border-medium);">
        <div class="card-header" style="background: var(--bg-raised);">
          <h3>Side-by-Side Version Diff Ledger</h3>
          <span class="status-badge ${isGain ? "status-matched" : "status-missing"}">
            ${isGain ? `+${delta}% Gain` : `${delta}% Change`}
          </span>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-3);">
            <div class="card" style="padding: var(--space-2); background: var(--bg-sunken);">
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase;">
                Baseline: ${vOld.filename} (${vOld.timestamp})
              </span>
              <div style="font-family: var(--font-display); font-size: 2rem; font-weight: 600; color: var(--text-primary); margin: 4px 0;">
                ${vOld.score}%
              </div>
              <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                ${vOld.matchedCount} matched skills · ${vOld.missingCount} remaining gaps
              </div>
            </div>

            <div class="card" style="padding: var(--space-2); background: var(--brand-subtle); border-color: var(--brand-border);">
              <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--brand-accent); text-transform: uppercase;">
                Current: ${vNew.filename} (${vNew.timestamp})
              </span>
              <div style="font-family: var(--font-display); font-size: 2rem; font-weight: 600; color: var(--brand-accent); margin: 4px 0;">
                ${vNew.score}%
              </div>
              <div style="font-size: 0.8125rem; color: var(--text-secondary);">
                ${vNew.matchedCount} matched skills · ${vNew.missingCount} remaining gaps
              </div>
            </div>
          </div>

          <div>
            <h4 style="font-size: 0.95rem; margin-bottom: var(--space-1);">Newly Verified / Matched Skills in this Iteration:</h4>
            ${newlyMatched.length > 0 ? `
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                ${newlyMatched.map((s) => `
                  <span class="status-badge status-matched">✓ + ${s}</span>
                `).join("")}
              </div>
            ` : `
              <p style="font-size: 0.85rem; color: var(--text-tertiary);">Skill set identical; scoring delta driven by profile weighting or JD adjustments.</p>
            `}
          </div>
        </div>
      </div>
    `;
  }
}

export const historyDiff = new HistoryDiff();
