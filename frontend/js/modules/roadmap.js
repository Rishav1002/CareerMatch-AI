/**
 * CareerMatch AI: Adaptive AI Learning Roadmap Feature Module
 * Single authoritative controller for #view-roadmap.
 * Exports init(), load(), render().
 */

import { api } from "../api.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";
import { roadmapDiagram } from "../components/roadmapDiagram.js";

export class RoadmapModule {
  constructor() {
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const regenBtn = document.getElementById("regenerateRoadmapBtn") || document.getElementById("regenerateAdaptiveRoadmapBtn");
    if (regenBtn) {
      regenBtn.addEventListener("click", () => this.load(true));
    }

    const quizBtn = document.getElementById("openStageQuizModalBtn");
    if (quizBtn) {
      quizBtn.addEventListener("click", () => this.openQuizModal());
    }

    store.subscribe("activeResume", (resume) => {
      if (store.get("currentView") === "roadmap") {
        if (resume) this.load();
        else this.renderEmptyState();
      }
    });
  }

  async load(regenerate = false) {
    const resume = store.get("activeResume");
    if (!resume) {
      this.renderEmptyState();
      return;
    }

    const cached = store.get("roadmapData");
    if (cached && !regenerate) {
      this.render(cached);
      return;
    }

    try {
      const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const token = store.get("token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/roadmap/adaptive", {
        method: "POST",
        headers,
        body: JSON.stringify({
          resume,
          resumeId: resume.id,
          targetRole,
          weeklyHoursGoal: 10,
          regenerate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not load adaptive roadmap.");

      store.set("roadmapData", data);
      this.render(data);
    } catch (err) {
      this.renderError(err.message);
    }
  }

  renderEmptyState() {
    roadmapDiagram.mount("roadmapDiagramViewport");
    roadmapDiagram.renderEmptyState();
    const tasksEl = document.getElementById("adapTasksContainer");
    if (tasksEl) {
      tasksEl.innerHTML = `<div class="p-2 text-center text-sm text-tertiary">No milestone tasks found. Run match analysis to generate weekly tasks.</div>`;
    }
  }

  renderError(msg) {
    roadmapDiagram.mount("roadmapDiagramViewport");
    roadmapDiagram.renderError(msg);
  }

  render(data) {
    if (!data) {
      this.renderEmptyState();
      return;
    }

    // Render interactive diagram progression tree (Bug 8)
    roadmapDiagram.mount("roadmapDiagramViewport");
    roadmapDiagram.render(data);

    // Progress badge
    const badge = document.getElementById("adapProgressBadge");
    if (badge) {
      badge.textContent = `${Math.round(data.overallProgressPct || 0)}% Completed (${data.completedHours || 0}/${data.totalEstimatedHours || 0} hrs)`;
    }

    // Skill progress bars
    const barsEl = document.getElementById("adapSkillProgressBars");
    if (barsEl) {
      barsEl.innerHTML = (data.skillProgress || [])
        .map(
          (sp) => `
          <div class="bar-chart-row" style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:4px;">
              <strong>Stage ${sp.stageIndex}: ${escapeHtml(sp.skillName)}</strong>
              <span class="tabular-nums">${sp.completedTasks}/${sp.totalTasks}</span>
            </div>
            <div class="bar-chart-track" style="height:6px;background:var(--bg-sunken);border-radius:var(--radius-sm);overflow:hidden;">
              <div class="bar-chart-fill" style="width:${Math.min(100, sp.progressPct)}%;height:100%;background:var(--score-high);"></div>
            </div>
          </div>
        `
        )
        .join("");
    }

    // Tasks list
    const tasksEl = document.getElementById("adapTasksContainer");
    if (tasksEl) {
      tasksEl.innerHTML = (data.tasks || [])
        .map(
          (t) => `
          <div class="evidence-req-item card" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:8px;padding:10px 14px;">
            <label style="display:flex;align-items:flex-start;gap:0.75rem;cursor:pointer;flex:1;">
              <input type="checkbox" data-adap-task-id="${escapeHtml(t.id)}" ${t.completed ? "checked" : ""} style="margin-top:0.25rem;" />
              <div>
                <div style="display:flex;gap:0.45rem;align-items:center;flex-wrap:wrap;">
                  <span class="tag ${t.isAdaptiveRemediation ? "tag-gap" : "tag-partial"}">${escapeHtml(t.taskType)} · ${escapeHtml(t.cadence)}</span>
                  <strong style="${t.completed ? "text-decoration:line-through;opacity:0.65;" : ""}">${escapeHtml(t.title)}</strong>
                </div>
                <p style="margin:0.2rem 0 0;font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(t.description)} (${t.estimatedHours} hrs)</p>
              </div>
            </label>
            <a href="${escapeHtml(t.resourceUrl || "https://roadmap.sh/")}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Resource ↗</a>
          </div>
        `
        )
        .join("");

      tasksEl.querySelectorAll("input[data-adap-task-id]").forEach((chk) => {
        chk.addEventListener("change", async () => {
          const taskId = chk.getAttribute("data-adap-task-id");
          try {
            const token = store.get("token");
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch("/api/roadmap/task", {
              method: "POST",
              headers,
              body: JSON.stringify({ taskId, completed: chk.checked }),
            });
            const updated = await res.json();
            if (res.ok) {
              store.set("roadmapData", updated);
              this.render(updated);
            }
          } catch (_) {}
        });
      });
    }

    // Quiz stage selector
    const sel = document.getElementById("adapQuizStageSelect");
    if (sel && data.stages) {
      sel.innerHTML = data.stages
        .map((st) => `<option value="${st.stageIndex}">Stage ${st.stageIndex}: ${escapeHtml(st.skillName)}</option>`)
        .join("");
    }
  }

  openQuizModal() {
    const sel = document.getElementById("adapQuizStageSelect");
    const stageIdx = sel ? parseInt(sel.value, 10) : 1;
    // Route to skill assessment with target stage or open quiz
    window.location.hash = "#/skills";
  }
}

export const roadmapModule = new RoadmapModule();
