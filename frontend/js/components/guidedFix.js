/**
 * CareerMatch AI: Guided "Fix This" Remediation Drawer
 * Transforms any skill gap into an immediate action plan:
 * 1. Roadmap Stage Jump
 * 2. Curated Free & Paid Course
 * 3. Tailored Resume Bullet Rewrite
 */

import { router } from "../router.js";
import { store } from "../store.js";

export class GuidedFixDrawer {
  constructor() {
    this.isOpen = false;
    this.drawerEl = null;
    this.currentSkill = null;
  }

  init() {
    this._injectDOM();
    this._attachListeners();
  }

  _injectDOM() {
    if (document.getElementById("guidedFixDrawerBackdrop")) return;

    const el = document.createElement("div");
    el.id = "guidedFixDrawerBackdrop";
    el.className = "drawer-backdrop";
    el.style.display = "none";
    el.innerHTML = `
      <aside class="drawer-panel" role="dialog" aria-modal="true" aria-labelledby="guidedFixTitle">
        <header class="drawer-header">
          <div>
            <span class="status-badge status-missing" id="guidedFixBadge">Skill Gap</span>
            <h3 id="guidedFixTitle" style="margin-top: 4px; font-size: 1.25rem;">Remediation Guide</h3>
          </div>
          <button class="btn btn-ghost btn-sm" id="closeGuidedFixBtn" aria-label="Close Drawer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div class="drawer-content" id="guidedFixContent">
          <!-- Populated dynamically -->
        </div>
      </aside>
    `;
    document.body.appendChild(el);
    this.drawerEl = el;
  }

  _attachListeners() {
    this.drawerEl.addEventListener("click", (e) => {
      if (e.target === this.drawerEl) this.close();
    });

    const closeBtn = document.getElementById("closeGuidedFixBtn");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    // Listen for global guided-fix trigger clicks: [data-fix-skill]
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-fix-skill]");
      if (trigger) {
        const skillName = trigger.getAttribute("data-fix-skill");
        const status = trigger.getAttribute("data-fix-status") || "missing";
        this.open(skillName, status);
      }
    });
  }

  open(skillName, status = "missing") {
    this.currentSkill = skillName;
    this.isOpen = true;
    this.drawerEl.style.display = "flex";

    const badge = document.getElementById("guidedFixBadge");
    const title = document.getElementById("guidedFixTitle");
    const content = document.getElementById("guidedFixContent");

    if (badge) {
      badge.className = `status-badge ${status === "partial" ? "status-partial" : "status-missing"}`;
      badge.textContent = status === "partial" ? "Partial Match" : "Skill Gap";
    }

    if (title) {
      title.textContent = `Fix: ${skillName}`;
    }

    if (content) {
      content.innerHTML = this._generateRemediationHTML(skillName, status);
      this._bindContentEvents(content, skillName);
    }
  }

  close() {
    this.isOpen = false;
    this.drawerEl.style.display = "none";
  }

  _generateRemediationHTML(skill, status) {
    const isPartial = status === "partial";
    const pointGain = isPartial ? "+6 to +9 pts" : "+10 to +16 pts";

    // Bullet rewrite templates tailored by skill
    const sampleBullet = `Engineered data pipeline modules using ${skill}, optimizing ETL throughput by 34% and automating daily telemetry reporting across 4 operational databases.`;

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-3);">
        <!-- Expected Point Gain Ledger -->
        <div class="card" style="background: var(--bg-raised); border-color: var(--border-medium);">
          <div class="card-body" style="padding: var(--space-2);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-tertiary); text-transform: uppercase;">
                  Estimated Score Gain
                </span>
                <div style="font-family: var(--font-display); font-size: 1.5rem; color: var(--score-high); font-weight: 600;">
                  ${pointGain}
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" id="fixJumpRoadmapBtn">
                Jump to Roadmap Node →
              </button>
            </div>
          </div>
        </div>

        <!-- Section 1: Recommended Courses -->
        <div>
          <h4 style="margin-bottom: var(--space-1); font-size: 0.95rem;">1. Curated Learning Modules</h4>
          <p style="font-size: 0.85rem; margin-bottom: var(--space-15);">
            High-yield technical resources verified for Indian campus recruitment and lateral hiring:
          </p>

          <div style="display: flex; flex-direction: column; gap: var(--space-1);">
            <div class="card" style="padding: var(--space-15);">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 0.9rem;">${skill} Essentials & Architecture</strong>
                <span class="status-badge status-matched" style="font-size: 0.7rem;">Free</span>
              </div>
              <p style="font-size: 0.8rem; margin: 4px 0 8px;">Comprehensive documentation, official walk-throughs and hands-on coding drills.</p>
              <a href="https://www.google.com/search?q=${encodeURIComponent(skill + ' documentation tutorial')}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="align-self: flex-start;">
                Open Free Course ↗
              </a>
            </div>

            <div class="card" style="padding: var(--space-15);">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong style="font-size: 0.9rem;">Production ${skill} for Engineers</strong>
                <span class="status-badge status-info" style="font-size: 0.7rem;">Certified</span>
              </div>
              <p style="font-size: 0.8rem; margin: 4px 0 8px;">Industry-recognized specialization with capstone projects and evaluation.</p>
              <a href="https://www.coursera.org/search?query=${encodeURIComponent(skill)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="align-self: flex-start;">
                View Specialization ↗
              </a>
            </div>
          </div>
        </div>

        <!-- Section 2: Resume Bullet Rewrite -->
        <div>
          <h4 style="margin-bottom: var(--space-1); font-size: 0.95rem;">2. High-Impact Resume Bullet Rewrite</h4>
          <p style="font-size: 0.85rem; margin-bottom: var(--space-15);">
            Use the Google XYZ / STAR format (Action + Context + Quantifiable Metric):
          </p>
          <div style="background: var(--bg-sunken); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: var(--space-15); font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.5; color: var(--text-primary); margin-bottom: var(--space-1);" id="bulletTextTarget">
            ${sampleBullet}
          </div>
          <button class="btn btn-secondary btn-sm" id="copyBulletBtn">
            Copy to Clipboard
          </button>
        </div>

        <!-- Section 3: Add to Study Planner -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-2);">
          <button class="btn btn-primary" style="width: 100%;" id="addSkillToPlannerBtn">
            + Schedule in Weekly Study Planner
          </button>
        </div>
      </div>
    `;
  }

  _bindContentEvents(container, skill) {
    const jumpBtn = container.querySelector("#fixJumpRoadmapBtn");
    if (jumpBtn) {
      jumpBtn.addEventListener("click", () => {
        this.close();
        router.navigate("roadmap");
      });
    }

    const copyBtn = container.querySelector("#copyBulletBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const text = container.querySelector("#bulletTextTarget").textContent.trim();
        try {
          await navigator.clipboard.writeText(text);
          copyBtn.textContent = "✓ Copied to Clipboard!";
          setTimeout(() => (copyBtn.textContent = "Copy to Clipboard"), 2000);
        } catch {
          copyBtn.textContent = "Selected";
        }
      });
    }

    const addPlannerBtn = container.querySelector("#addSkillToPlannerBtn");
    if (addPlannerBtn) {
      addPlannerBtn.addEventListener("click", () => {
        const tasks = store.get("plannerTasks") || [];
        const newTask = {
          id: Date.now(),
          title: `Master ${skill} Core Concepts & Code Sample`,
          day: "Monday",
          completed: false,
          skill: skill,
        };
        tasks.push(newTask);
        store.set("plannerTasks", tasks);
        addPlannerBtn.textContent = "✓ Scheduled in Planner!";
        setTimeout(() => {
          this.close();
          router.navigate("planner");
        }, 800);
      });
    }
  }
}

export const guidedFix = new GuidedFixDrawer();
