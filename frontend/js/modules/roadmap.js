/**
 * CareerMatch AI: Skill Roadmap Feature Module
 * Single authoritative controller for #view-roadmap.
 */

import { api } from "../api.js";
import { store } from "../store.js";
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

    window.addEventListener("cm:roadmap-reload", () => this.load(true));

    store.subscribe("activeResume", (resume) => {
      store.set("roadmapData", null);
      if (store.get("currentView") === "roadmap") {
        if (resume) this.load(true);
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

    roadmapDiagram.mount("roadmapDiagramViewport");
    const vp = document.getElementById("roadmapDiagramViewport");
    if (vp) {
      vp.innerHTML = `<div class="p-4 text-center text-sm text-secondary"><div class="spinner mb-2 mx-auto"></div>Building your branching skill roadmap...</div>`;
    }

    try {
      const targetRole = store.get("targetRole") || document.getElementById("targetRoleSelect")?.value || "Full Stack Developer";
      const data = await api.post("/api/roadmap/adaptive", {
        resume,
        resumeId: resume.id,
        targetRole,
        weeklyHoursGoal: 10,
        regenerate,
      }, { timeoutMs: 25000 });

      store.set("roadmapData", data);
      this.render(data);
    } catch (err) {
      this.renderError(err?.message || "Unable to load roadmap.");
    }
  }

  async toggleTask(taskId, completed) {
    const current = store.get("roadmapData");
    if (!current) return;

    // Optimistic local update for instant visual feedback
    const tasks = (current.tasks || []).map((t) =>
      String(t.id) === String(taskId) ? { ...t, completed } : t
    );
    const totalHours = tasks.reduce((acc, t) => acc + (Number(t.estimatedHours) || 0), 0);
    const doneHours = tasks.filter((t) => t.completed).reduce((acc, t) => acc + (Number(t.estimatedHours) || 0), 0);
    const pct = tasks.length ? Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100) : 0;

    const updated = {
      ...current,
      tasks,
      completedHours: doneHours,
      totalEstimatedHours: totalHours || current.totalEstimatedHours,
      overallProgressPct: pct,
    };
    store.set("roadmapData", updated);
    this.render(updated);

    // Sync to backend silently
    try {
      const resume = store.get("activeResume");
      const targetRole = store.get("targetRole") || "Full Stack Developer";
      const serverData = await api.post("/api/roadmap/task", {
        resume,
        resumeId: resume?.id,
        targetRole,
        taskId,
        completed,
      });
      if (serverData && Array.isArray(serverData.tasks)) {
        store.set("roadmapData", serverData);
        this.render(serverData);
      }
    } catch (_) {
      // Optimistic state already applied
    }
  }

  renderEmptyState() {
    roadmapDiagram.mount("roadmapDiagramViewport");
    roadmapDiagram.renderEmptyState();
  }

  renderError(msg) {
    roadmapDiagram.mount("roadmapDiagramViewport");
    roadmapDiagram.renderError(msg, () => this.load(true));
  }

  render(data) {
    if (!data) {
      this.renderEmptyState();
      return;
    }

    const badge = document.getElementById("adapProgressBadge");
    if (badge) {
      const pct = Math.round(data.overallProgressPct || 0);
      badge.textContent = `${pct}% Completed · ${data.completedHours || 0}/${data.totalEstimatedHours || 0} hrs`;
    }

    roadmapDiagram.mount("roadmapDiagramViewport");
    roadmapDiagram.render(data, {
      onToggleTask: (taskId, completed) => this.toggleTask(taskId, completed),
    });
  }
}

export const roadmapModule = new RoadmapModule();
