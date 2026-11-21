/**
 * CareerMatch AI: Branching Interactive Skill Roadmap Diagram
 * Inspired by roadmap.sh: central vertical progress spine with live fill bar,
 * pulsing "You Are Here" current stage hub, left/right dotted branches,
 * direct Mark Complete toggles on every node, and click-to-open Learning Hub.
 */

import { escapeHtml } from "../formatters.js";
import { guidedFix } from "./guidedFix.js";

export class RoadmapDiagram {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.onToggleTask = null;
    this.onRetry = null;
  }

  mount(containerElOrId) {
    this.container =
      typeof containerElOrId === "string"
        ? document.getElementById(containerElOrId)
        : containerElOrId;
  }

  render(roadmapData, opts = {}) {
    if (!this.container) {
      this.container = document.getElementById(this.containerId);
    }
    if (!this.container) return;

    if (typeof opts.onToggleTask === "function") {
      this.onToggleTask = opts.onToggleTask;
    }

    const stages = Array.isArray(roadmapData?.stages) ? roadmapData.stages : [];
    const tasks = Array.isArray(roadmapData?.tasks) ? roadmapData.tasks : [];

    if (!stages.length && !tasks.length) {
      this.renderEmptyState();
      return;
    }

    const totalTasks = tasks.length || stages.length;
    const completedTasks = tasks.length
      ? tasks.filter((t) => Boolean(t.completed)).length
      : 0;
    const overallPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Determine which stage is currently active ("You Are Here")
    let activeStageIdx = stages.length;
    for (let i = 0; i < stages.length; i++) {
      const sIdx = i + 1;
      const sTasks = tasks.filter((t) => Number(t.stageIndex) === sIdx);
      const allDone = sTasks.length > 0 && sTasks.every((t) => Boolean(t.completed));
      if (!allDone) {
        activeStageIdx = sIdx;
        break;
      }
    }

    this.container.innerHTML = `
      <div class="rm-branch-shell" role="tree" aria-label="Interactive Branching Skill Roadmap">
        <!-- Live Overall Progress Bar -->
        <div class="rm-progress-header">
          <div class="d-flex justify-between items-center flex-wrap gap-xs mb-1">
            <div class="d-flex items-center gap-sm flex-wrap">
              <span class="rm-legend-dot is-done"></span><span class="text-xs text-secondary">Completed</span>
              <span class="rm-legend-dot is-current"></span><span class="text-xs text-secondary">Current Stage</span>
              <span class="rm-legend-dot is-upcoming"></span><span class="text-xs text-secondary">Upcoming</span>
            </div>
            <span class="font-mono text-xs font-semibold text-primary tabular-nums">${completedTasks}/${totalTasks} Milestones (${overallPct}%)</span>
          </div>
          <div class="rm-master-track">
            <div class="rm-master-fill" style="width:${overallPct}%;"></div>
          </div>
        </div>

        <!-- Central Spine + Branching Stages -->
        <div class="rm-tree-canvas">
          <div class="rm-central-spine" aria-hidden="true">
            <div class="rm-central-spine-fill" style="height:${overallPct}%;"></div>
          </div>

          ${stages.map((stage, idx) => {
            const sIdx = idx + 1;
            const sTasks = tasks.filter((t) => Number(t.stageIndex) === sIdx);
            const items = sTasks.length
              ? sTasks
              : [{
                  id: `stage-${sIdx}-core`,
                  title: `${stage.skillName || "Core"} Fundamentals & Project`,
                  skillName: stage.skillName || `Stage ${sIdx}`,
                  taskType: "Core Milestone",
                  estimatedHours: stage.estimatedHours || 6,
                  completed: false,
                  synthetic: true,
                }];

            const doneCount = items.filter((t) => Boolean(t.completed)).length;
            const stagePct = items.length ? Math.round((doneCount / items.length) * 100) : 0;
            const stageState =
              stagePct === 100
                ? "is-done"
                : sIdx === activeStageIdx
                  ? "is-current"
                  : "is-upcoming";

            const leftItems = items.filter((_, i) => i % 2 === 0);
            const rightItems = items.filter((_, i) => i % 2 === 1);

            const renderLeaf = (task, side) => {
              const isDone = Boolean(task.completed);
              const isCurrentLeaf = !isDone && stageState === "is-current";
              const leafCls = isDone ? "is-done" : isCurrentLeaf ? "is-current" : "is-upcoming";
              const skillName = task.skillName || stage.skillName || "Skill";

              return `
                <div class="rm-branch-leaf rm-side-${side} ${leafCls}" data-task-id="${escapeHtml(task.id)}">
                  <span class="rm-connector" aria-hidden="true"></span>
                  <div class="rm-leaf-card">
                    <button
                      type="button"
                      class="rm-check-btn ${isDone ? "checked" : ""}"
                      data-toggle-task="${escapeHtml(task.id)}"
                      data-completed="${isDone ? "1" : "0"}"
                      aria-label="${isDone ? "Mark incomplete" : "Mark completed"}"
                      title="${isDone ? "Completed — click to undo" : "Mark completed"}"
                    >
                      ${isDone ? "✓" : ""}
                    </button>
                    <button
                      type="button"
                      class="rm-leaf-body"
                      data-open-skill="${escapeHtml(skillName)}"
                      data-leaf-status="${isDone ? "matched" : "missing"}"
                    >
                      <div class="rm-leaf-meta">
                        <span class="rm-leaf-type">${escapeHtml(task.taskType || "Milestone")}</span>
                        <span class="rm-leaf-hrs tabular-nums">${task.estimatedHours || 3}h</span>
                      </div>
                      <div class="rm-leaf-title ${isDone ? "done" : ""}">${escapeHtml(task.title)}</div>
                      <div class="rm-leaf-cta">Courses &amp; projects →</div>
                    </button>
                  </div>
                </div>
              `;
            };

            return `
              <div class="rm-stage-row ${stageState}" data-stage-index="${sIdx}">
                <!-- Left Branch Column -->
                <div class="rm-branch-col rm-col-left">
                  ${leftItems.map((t) => renderLeaf(t, "left")).join("")}
                </div>

                <!-- Center Hub Node -->
                <div class="rm-hub-col">
                  <button
                    type="button"
                    class="rm-hub-node ${stageState}"
                    data-open-skill="${escapeHtml(stage.skillName || "")}"
                    data-leaf-status="${stageState === "is-done" ? "matched" : "missing"}"
                  >
                    <div class="rm-hub-top">
                      <span class="rm-hub-stage">Stage ${sIdx}</span>
                      <span class="rm-hub-status-tag">
                        ${stageState === "is-done" ? "✓ Done" : stageState === "is-current" ? "● Now" : `${stagePct}%`}
                      </span>
                    </div>
                    <div class="rm-hub-skill">${escapeHtml(stage.skillName || `Milestone ${sIdx}`)}</div>
                    <div class="rm-hub-bar"><div class="rm-hub-bar-fill" style="width:${stagePct}%;"></div></div>
                  </button>
                </div>

                <!-- Right Branch Column -->
                <div class="rm-branch-col rm-col-right">
                  ${rightItems.map((t) => renderLeaf(t, "right")).join("")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.container) return;

    this.container.querySelectorAll("[data-toggle-task]").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const taskId = btn.getAttribute("data-toggle-task");
        const nextState = btn.getAttribute("data-completed") !== "1";
        btn.disabled = true;
        if (typeof this.onToggleTask === "function") {
          await this.onToggleTask(taskId, nextState);
        }
        btn.disabled = false;
      });
    });

    this.container.querySelectorAll("[data-open-skill]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const skill = btn.getAttribute("data-open-skill");
        const status = btn.getAttribute("data-leaf-status") || "missing";
        if (skill) {
          guidedFix.open(skill, status);
        }
      });
    });
  }

  renderEmptyState() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card p-4 text-center bg-sunken border-subtle">
        <h4 class="text-base font-semibold mb-1">No Skill Roadmap Yet</h4>
        <p class="text-sm text-secondary mx-auto mb-3" style="max-width:440px;">
          Upload and analyze your resume to generate your personalized branching skill roadmap.
        </p>
        <a href="#/analyzer" class="btn btn-primary btn-sm">Open Resume Analyzer →</a>
      </div>
    `;
  }

  renderError(msg, retryFn = null) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card p-3 text-center bg-sunken border-subtle">
        <p class="text-sm text-low mb-2">${escapeHtml(msg || "Could not load roadmap.")}</p>
        <button type="button" class="btn btn-secondary btn-sm" id="diagramRetryBtn">Retry</button>
      </div>
    `;
    this.container.querySelector("#diagramRetryBtn")?.addEventListener("click", () => {
      if (typeof retryFn === "function") retryFn();
      else window.dispatchEvent(new CustomEvent("cm:roadmap-reload"));
    });
  }
}

export const roadmapDiagram = new RoadmapDiagram("roadmapDiagramViewport");
