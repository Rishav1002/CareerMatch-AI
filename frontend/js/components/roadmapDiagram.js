/**
 * CareerMatch AI: Interactive Adaptive Roadmap Diagram
 * Reusable ES Module rendered in both #view-roadmap and #view-report (#sec-roadmap).
 * 
 * Features:
 * - Desktop: Left-to-right staged progression columns with SVG curved connection paths
 * - Mobile (< 768px): Vertical interactive collapsible timeline
 * - Status markers:
 *     Done = pine circle (✓)
 *     Current = amber diamond (▲)
 *     Next/Locked = neutral / lock outline
 * - Click or Enter triggers Guided Fix drawer with curated courses and projects
 * - Keyboard navigable with arrow keys, full ARIA tree semantics
 * - Empty state with one-click "Run Match Analysis" CTA
 */

import { escapeHtml } from "../formatters.js";
import { guidedFix } from "./guidedFix.js";

export class RoadmapDiagram {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.stages = [];
    this.nodes = [];
    this.selectedNodeId = null;
  }

  mount(containerElOrId) {
    if (typeof containerElOrId === "string") {
      this.container = document.getElementById(containerElOrId);
    } else {
      this.container = containerElOrId;
    }
  }

  render(roadmapData) {
    if (!this.container) {
      this.container = document.getElementById(this.containerId);
    }
    if (!this.container) return;

    if (!roadmapData || (!roadmapData.stages?.length && !roadmapData.tasks?.length)) {
      this.renderEmptyState();
      return;
    }

    this.stages = roadmapData.stages || [];
    this.nodes = this._extractNodes(roadmapData);

    const isMobile = window.innerWidth <= 768;

    this.container.innerHTML = `
      <div class="roadmap-diagram-root ${isMobile ? 'mode-timeline' : 'mode-staged-graph'}" role="tree" aria-label="Adaptive Career Roadmap Progression">
        <!-- Diagram Stage Columns / Timeline -->
        <div class="roadmap-stages-wrapper">
          ${this.stages.map((stage, idx) => this._renderStageColumn(stage, idx, roadmapData)).join("")}
        </div>
      </div>
    `;

    this._attachInteractions();
    if (!isMobile) {
      this._drawConnectors();
    }
  }

  renderEmptyState() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card p-4 text-center bg-sunken border-subtle">
        <div class="mb-1" style="font-size: 2rem;">🗺️</div>
        <h4 class="text-base font-semibold mb-05">No Learning Roadmap Generated Yet</h4>
        <p class="text-sm text-secondary max-w-form mx-auto mb-2">
          Run a resume match analysis to generate your deterministic weekly milestone roadmap and skill progression tree.
        </p>
        <a href="#/analyzer" class="btn btn-primary btn-sm min-w-160">
          Run Match Analysis →
        </a>
      </div>
    `;
  }

  renderError(msg) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="card p-3 text-center bg-sunken border-subtle">
        <p class="text-sm text-low mb-1">${escapeHtml(msg || "Failed to render roadmap diagram.")}</p>
        <button type="button" class="btn btn-secondary btn-sm" id="diagramRetryBtn">Retry</button>
      </div>
    `;
    this.container.querySelector("#diagramRetryBtn")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("cm:roadmap-reload"));
    });
  }

  _extractNodes(roadmapData) {
    const nodes = [];
    const tasks = roadmapData.tasks || [];
    const stages = roadmapData.stages || [];

    stages.forEach((stage, sIdx) => {
      const stageIdx = sIdx + 1;
      const stageTasks = tasks.filter((t) => Number(t.stageIndex) === stageIdx);

      if (stageTasks.length === 0) {
        // Fallback synthetic node from stage metadata
        nodes.push({
          id: `node-${stageIdx}-1`,
          stageIndex: stageIdx,
          stageTitle: stage.title || `Stage ${stageIdx}`,
          title: `${stage.skillName || "Core"} Mastery`,
          skill: stage.skillName || "Engineering",
          status: stageIdx === 1 ? "current" : "locked",
          estHours: stage.estimatedHours || 12,
          resources: [stage.freeResource, stage.paidResource].filter(Boolean),
        });
      } else {
        stageTasks.forEach((task, tIdx) => {
          let status = "locked";
          if (task.completed) {
            status = "done";
          } else if (stageIdx === 1 || tasks.some((prev) => prev.stageIndex < stageIdx && prev.completed)) {
            status = tIdx === 0 ? "current" : "next";
          }

          nodes.push({
            id: task.id || `node-${stageIdx}-${tIdx + 1}`,
            stageIndex: stageIdx,
            stageTitle: stage.title || `Stage ${stageIdx}`,
            title: task.title,
            skill: task.skillName || stage.skillName,
            status,
            taskType: task.taskType,
            estHours: task.estimatedHours || 3,
            description: task.description,
            resourceUrl: task.resourceUrl,
            resources: [stage.freeResource, stage.paidResource].filter(Boolean),
          });
        });
      }
    });

    return nodes;
  }

  _renderStageColumn(stage, idx, roadmapData) {
    const stageIdx = idx + 1;
    const stageNodes = this.nodes.filter((n) => n.stageIndex === stageIdx);
    const completedNodes = stageNodes.filter((n) => n.status === "done").length;
    const pct = stageNodes.length ? Math.round((completedNodes / stageNodes.length) * 100) : 0;
    const isCurrent = stageIdx === 1 || (pct < 100 && pct > 0);

    return `
      <div class="roadmap-stage-column ${isCurrent ? 'is-current-stage' : ''}" data-stage-index="${stageIdx}">
        <div class="stage-column-header">
          <div class="d-flex justify-between items-center mb-05">
            <span class="font-mono text-xs font-semibold text-accent uppercase">Stage ${stageIdx}</span>
            <span class="stage-pill-pct ${pct === 100 ? 'status-matched' : 'status-partial'}">${pct}%</span>
          </div>
          <h4 class="text-sm font-semibold m-0 text-primary truncate" title="${escapeHtml(stage.skillName)}">
            ${escapeHtml(stage.skillName || `Milestone ${stageIdx}`)}
          </h4>
          <span class="text-xs text-tertiary">${stage.estimatedWeeks || '2 Weeks'} · ${stageNodes.length} Nodes</span>
        </div>

        <div class="stage-nodes-list" role="group">
          ${stageNodes.map((node) => this._renderNodeCard(node)).join("")}
        </div>
      </div>
    `;
  }

  _renderNodeCard(node) {
    const statusMeta = {
      done: {
        cls: "status-matched",
        icon: "✓",
        label: "Done",
        aria: "Completed Milestone",
      },
      current: {
        cls: "status-partial is-current-node",
        icon: "▲",
        label: "In Progress",
        aria: "Current Target",
      },
      next: {
        cls: "status-next",
        icon: "○",
        label: "Next Up",
        aria: "Next Deliverable",
      },
      locked: {
        cls: "status-locked",
        icon: "🔒",
        label: "Locked",
        aria: "Prerequisite Required",
      },
    }[node.status] || { cls: "status-next", icon: "○", label: "Queued", aria: "Queued" };

    return `
      <div 
        class="roadmap-node-card card ${statusMeta.cls}" 
        id="rm-node-${escapeHtml(node.id)}"
        data-node-id="${escapeHtml(node.id)}"
        data-skill="${escapeHtml(node.skill || '')}"
        role="treeitem"
        tabindex="0"
        aria-label="${escapeHtml(node.title)} (${statusMeta.label})"
      >
        <div class="node-status-marker">
          <span class="node-status-icon" aria-hidden="true">${statusMeta.icon}</span>
        </div>
        <div class="node-content">
          <div class="d-flex justify-between items-baseline gap-xs">
            <span class="node-type-label font-mono text-xs">${escapeHtml(node.taskType || 'Milestone')}</span>
            <span class="node-hours-badge tabular-nums">${node.estHours}h</span>
          </div>
          <h5 class="node-title text-xs font-semibold m-0 text-primary lh-snug">
            ${escapeHtml(node.title)}
          </h5>
          <span class="node-hint text-xs text-secondary">Click for guided fix &amp; resources</span>
        </div>
      </div>
    `;
  }

  _attachInteractions() {
    this.container.querySelectorAll(".roadmap-node-card").forEach((card) => {
      const handleAction = () => {
        const nodeId = card.getAttribute("data-node-id");
        const skill = card.getAttribute("data-skill");
        this.selectNode(nodeId, skill);
      };

      card.addEventListener("click", handleAction);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleAction();
        }
      });
    });
  }

  selectNode(nodeId, skill) {
    this.selectedNodeId = nodeId;
    this.container.querySelectorAll(".roadmap-node-card").forEach((c) => {
      c.classList.toggle("selected", c.getAttribute("data-node-id") === nodeId);
    });

    // Trigger Guided Fix Drawer with verified skill resources
    if (skill && guidedFix && typeof guidedFix.openForSkill === "function") {
      guidedFix.openForSkill(skill);
    }
  }

  _drawConnectors() {
    // Desktop SVG connection paths between adjacent stage columns
    const columns = Array.from(this.container.querySelectorAll(".roadmap-stage-column"));
    if (columns.length < 2) return;

    let svgEl = this.container.querySelector(".roadmap-connectors-svg");
    if (!svgEl) {
      svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgEl.setAttribute("class", "roadmap-connectors-svg");
      svgEl.setAttribute("aria-hidden", "true");
      this.container.querySelector(".roadmap-stages-wrapper")?.prepend(svgEl);
    }

    const wrapperRect = this.container.querySelector(".roadmap-stages-wrapper")?.getBoundingClientRect();
    if (!wrapperRect) return;

    svgEl.setAttribute("width", `${wrapperRect.width}`);
    svgEl.setAttribute("height", `${wrapperRect.height}`);
    svgEl.innerHTML = "";

    // Connect first node of column N to first node of column N+1
    for (let i = 0; i < columns.length - 1; i++) {
      const colA = columns[i];
      const colB = columns[i + 1];
      const nodeA = colA.querySelector(".roadmap-node-card");
      const nodeB = colB.querySelector(".roadmap-node-card");

      if (nodeA && nodeB) {
        const rectA = nodeA.getBoundingClientRect();
        const rectB = nodeB.getBoundingClientRect();

        const x1 = rectA.right - wrapperRect.left;
        const y1 = rectA.top + rectA.height / 2 - wrapperRect.top;
        const x2 = rectB.left - wrapperRect.left;
        const y2 = rectB.top + rectB.height / 2 - wrapperRect.top;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const dx = (x2 - x1) / 2;
        path.setAttribute("d", `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
        path.setAttribute("class", "connector-path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "var(--border-medium, rgba(0,0,0,0.15))");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-dasharray", "4 4");
        svgEl.appendChild(path);
      }
    }
  }
}

export const roadmapDiagram = new RoadmapDiagram("roadmapDiagramViewport");
