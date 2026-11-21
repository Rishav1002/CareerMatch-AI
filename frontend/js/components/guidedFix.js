/**
 * CareerMatch AI: Guided "Fix This" Learning & Remediation Hub Drawer
 * Clean, tabbed drawer so 3+ Free Courses, 3+ Paid/Certifications, 3+ Project Ideas,
 * and Resume Fix never congest mobile or desktop viewports.
 */

import { api } from "../api.js";
import { router } from "../router.js";
import { store } from "../store.js";
import { escapeHtml } from "../formatters.js";

export class GuidedFixDrawer {
  constructor() {
    this.isOpen = false;
    this.drawerEl = null;
    this.currentSkill = null;
    this.currentStatus = "missing";
    this.activeTab = "free";
    this.cache = new Map();
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
      <aside class="drawer-panel learning-hub-drawer" role="dialog" aria-modal="true" aria-labelledby="guidedFixTitle">
        <header class="drawer-header">
          <div style="min-width: 0;">
            <span class="status-badge status-missing" id="guidedFixBadge">Skill Gap</span>
            <h3 id="guidedFixTitle" style="margin: 4px 0 0; font-size: 1.2rem; overflow-wrap: break-word;">Skill Learning Hub</h3>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" id="closeGuidedFixBtn" aria-label="Close Drawer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div class="drawer-content" id="guidedFixContent"></div>
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

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    });

    // Listen for global guided-fix / skill learning trigger clicks: [data-fix-skill]
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-fix-skill]");
      if (trigger) {
        const skillName = trigger.getAttribute("data-fix-skill");
        const status = trigger.getAttribute("data-fix-status") || "missing";
        if (skillName) this.open(skillName, status);
      }
    });
  }

  async open(skillName, status = "missing") {
    this.currentSkill = skillName;
    this.currentStatus = status;
    this.activeTab = "free";
    this.isOpen = true;
    this.drawerEl.style.display = "flex";

    const badge = document.getElementById("guidedFixBadge");
    const title = document.getElementById("guidedFixTitle");

    if (badge) {
      badge.className = `status-badge ${status === "matched" ? "status-matched" : status === "partial" || status === "adjacent" ? "status-partial" : "status-missing"}`;
      badge.textContent = status === "matched" ? "Skill Deep Dive" : (status === "partial" || status === "adjacent" ? "Partial Match" : "Skill Gap");
    }
    if (title) {
      title.textContent = `Learn & Fix: ${skillName}`;
    }

    const cacheKey = skillName.toLowerCase();
    if (this.cache.has(cacheKey)) {
      this._renderHub(this.cache.get(cacheKey));
      return;
    }

    this._renderLoading(skillName);
    await this._fetchResources(skillName, false);
  }

  close() {
    this.isOpen = false;
    this.drawerEl.style.display = "none";
  }

  async _fetchResources(skillName, useAi = false) {
    const targetRole = store.get("targetRole") || "Software Engineer";
    try {
      const data = await api.post("/api/learning/resources", {
        skill: skillName,
        targetRole,
        useAi,
      }, { timeoutMs: useAi ? 18000 : 10000 });
      this.cache.set(skillName.toLowerCase(), data);
      if (this.currentSkill === skillName && this.isOpen) {
        this._renderHub(data);
      }
    } catch (err) {
      const fallback = this._clientFallback(skillName);
      if (this.currentSkill === skillName && this.isOpen) {
        this._renderHub(fallback, err?.message);
      }
    }
  }

  _clientFallback(skill) {
    const q = encodeURIComponent(skill);
    return {
      skill,
      source: "curated",
      freeCourses: [
        { title: `${skill} Developer Roadmap`, platform: "roadmap.sh", duration: "Self-paced", summary: `Structured topic guide and checklists for ${skill}.`, url: "https://roadmap.sh/" },
        { title: `${skill} Hands-On Curriculum`, platform: "freeCodeCamp", duration: "Self-paced", summary: `Free interactive lessons and projects covering ${skill}.`, url: `https://www.freecodecamp.org/news/search/?query=${q}` },
        { title: `Microsoft Learn: ${skill} Modules`, platform: "Microsoft Learn", duration: "4-8 hrs", summary: `Interactive training paths and sandbox labs for ${skill}.`, url: `https://learn.microsoft.com/en-us/training/browse/?terms=${q}` },
      ],
      paidAndCerts: [
        { title: `${skill} Professional Specialization`, platform: "Coursera", badge: "Certification", duration: "1-3 months", summary: `Structured specialization with capstone projects and certificate.`, url: `https://www.coursera.org/courses?query=${q}` },
        { title: `Complete ${skill} Bootcamp`, platform: "Udemy", badge: "Paid Course", duration: "15-30 hrs", summary: `Practical project-driven course for production ${skill}.`, url: `https://www.udemy.com/courses/search/?q=${q}` },
        { title: `Verified ${skill} Certificate Program`, platform: "edX", badge: "Certificate", duration: "6-8 weeks", summary: `University-authored program covering core ${skill} mastery.`, url: `https://www.edx.org/search?q=${q}` },
      ],
      projects: [
        { title: `Production ${skill} Starter Service`, difficulty: "Beginner", duration: "4-5 days", summary: `Build a clean, tested repository showcasing core ${skill} patterns.`, url: "https://roadmap.sh/" },
        { title: `End-to-End ${skill} Integration App`, difficulty: "Intermediate", duration: "1-2 weeks", summary: `Connect ${skill} with an API and database with benchmarks and error handling.`, url: "https://roadmap.sh/" },
        { title: `Scalable ${skill} Capstone`, difficulty: "Advanced", duration: "2 weeks", summary: `Deploy a full ${skill} project with CI/CD, logging, and architecture docs.`, url: "https://roadmap.sh/" },
      ],
      resumeBullet: `Engineered production ${skill} modules, improving workflow reliability and cutting manual processing time by 35%.`,
    };
  }

  _renderLoading(skillName) {
    const content = document.getElementById("guidedFixContent");
    if (!content) return;
    content.innerHTML = `
      <div class="p-4 text-center">
        <div class="spinner mb-2 mx-auto" aria-hidden="true"></div>
        <p class="text-sm text-secondary m-0">Loading verified courses, certifications &amp; projects for <strong>${escapeHtml(skillName)}</strong>...</p>
      </div>
    `;
  }

  _renderHub(data, notice = "") {
    const content = document.getElementById("guidedFixContent");
    if (!content) return;

    const free = data.freeCourses || [];
    const paid = data.paidAndCerts || [];
    const projects = data.projects || [];
    const isPartial = this.currentStatus === "partial" || this.currentStatus === "adjacent";
    const pointGain = this.currentStatus === "matched" ? "Core Strength" : (isPartial ? "+6 to +9 pts" : "+10 to +16 pts");

    const renderResourceCards = (items, isPaid = false) =>
      items.map((c) => `
        <div class="card learning-resource-card p-2">
          <div class="d-flex justify-between items-start gap-xs mb-1">
            <strong class="text-sm text-primary" style="line-height: 1.35;">${escapeHtml(c.title)}</strong>
            <span class="status-badge ${isPaid ? "status-info" : "status-matched"}" style="font-size: 0.68rem; white-space: nowrap; flex-shrink: 0;">
              ${escapeHtml(isPaid ? (c.badge || "Certified") : "Free")}
            </span>
          </div>
          <div class="text-xxs font-mono text-tertiary mb-1">${escapeHtml(c.platform || "Verified")} · ${escapeHtml(c.duration || "Self-paced")}</div>
          <p class="text-xs text-secondary m-0 mb-2" style="line-height: 1.45;">${escapeHtml(c.summary || "")}</p>
          <a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" style="align-self: flex-start;">
            ${isPaid ? "View Course / Cert ↗" : "Open Free Course ↗"}
          </a>
        </div>
      `).join("");

    const renderProjectCards = (items) =>
      items.map((p) => `
        <div class="card learning-resource-card p-2">
          <div class="d-flex justify-between items-start gap-xs mb-1">
            <strong class="text-sm text-primary" style="line-height: 1.35;">${escapeHtml(p.title)}</strong>
            <span class="score-pill" style="font-size: 0.68rem; white-space: nowrap; flex-shrink: 0;">${escapeHtml(p.difficulty || "Intermediate")}</span>
          </div>
          <div class="text-xxs font-mono text-tertiary mb-1">Est. ${escapeHtml(p.duration || "1 week")}</div>
          <p class="text-xs text-secondary m-0 mb-2" style="line-height: 1.45;">${escapeHtml(p.summary || "")}</p>
          <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs" style="align-self: flex-start;">
            Starter Guide ↗
          </a>
        </div>
      `).join("");

    content.innerHTML = `
      <div class="d-flex flex-col gap-md">
        <!-- Top Action Strip -->
        <div class="d-flex justify-between items-center flex-wrap gap-xs p-2 bg-sunken rounded-sm border-subtle">
          <div class="text-xs text-secondary">
            ${data.source === "ai" ? '<span class="score-pill score-pill-green text-xxs">Gemini AI Updated</span>' : '<span class="score-pill text-xxs">Verified Curated Catalog</span>'}
          </div>
          <button type="button" class="btn btn-secondary btn-xs" id="hubRefreshAiBtn">
            ✨ Fetch Latest via Gemini AI
          </button>
        </div>
        ${notice ? `<div class="text-xs text-tertiary">${escapeHtml(notice)}</div>` : ""}

        <!-- Compact 4-Tab Bar -->
        <div class="learning-tabs" role="tablist" aria-label="Learning Resources">
          <button type="button" class="learning-tab-btn ${this.activeTab === "free" ? "active" : ""}" data-hub-tab="free">Free (${free.length})</button>
          <button type="button" class="learning-tab-btn ${this.activeTab === "paid" ? "active" : ""}" data-hub-tab="paid">Paid &amp; Certs (${paid.length})</button>
          <button type="button" class="learning-tab-btn ${this.activeTab === "projects" ? "active" : ""}" data-hub-tab="projects">Projects (${projects.length})</button>
          <button type="button" class="learning-tab-btn ${this.activeTab === "fix" ? "active" : ""}" data-hub-tab="fix">Resume Fix</button>
        </div>

        <!-- Tab Panels -->
        <div class="learning-tab-panel ${this.activeTab === "free" ? "" : "hidden"}" data-hub-panel="free">
          <div class="d-flex flex-col gap-sm">${renderResourceCards(free, false)}</div>
        </div>

        <div class="learning-tab-panel ${this.activeTab === "paid" ? "" : "hidden"}" data-hub-panel="paid">
          <div class="d-flex flex-col gap-sm">${renderResourceCards(paid, true)}</div>
        </div>

        <div class="learning-tab-panel ${this.activeTab === "projects" ? "" : "hidden"}" data-hub-panel="projects">
          <div class="d-flex flex-col gap-sm">${renderProjectCards(projects)}</div>
        </div>

        <div class="learning-tab-panel ${this.activeTab === "fix" ? "" : "hidden"}" data-hub-panel="fix">
          <div class="d-flex flex-col gap-md">
            <div class="card p-2 bg-raised border-subtle">
              <div class="d-flex justify-between items-center flex-wrap gap-sm">
                <div>
                  <span class="font-mono text-xxs text-tertiary uppercase">Estimated Impact</span>
                  <div class="font-serif text-xl font-semibold text-high">${pointGain}</div>
                </div>
                <button type="button" class="btn btn-secondary btn-xs" id="fixJumpRoadmapBtn">Jump to Roadmap →</button>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-semibold mb-1">High-Impact Resume Bullet (XYZ / STAR)</h4>
              <div class="p-2 bg-sunken border-subtle rounded-sm font-mono text-xs mb-1" style="line-height: 1.5;" id="bulletTextTarget">
                ${escapeHtml(data.resumeBullet || "")}
              </div>
              <button type="button" class="btn btn-secondary btn-xs" id="copyBulletBtn">Copy to Clipboard</button>
            </div>

            <button type="button" class="btn btn-primary w-full" id="addSkillToPlannerBtn">
              + Schedule ${escapeHtml(data.skill)} in Study Planner
            </button>
          </div>
        </div>
      </div>
    `;

    this._bindContentEvents(content, data.skill);
  }

  _bindContentEvents(container, skill) {
    container.querySelectorAll("[data-hub-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-hub-tab");
        this.activeTab = tab;
        container.querySelectorAll("[data-hub-tab]").forEach((b) => b.classList.toggle("active", b.getAttribute("data-hub-tab") === tab));
        container.querySelectorAll("[data-hub-panel]").forEach((p) => p.classList.toggle("hidden", p.getAttribute("data-hub-panel") !== tab));
      });
    });

    const aiBtn = container.querySelector("#hubRefreshAiBtn");
    if (aiBtn) {
      aiBtn.addEventListener("click", async () => {
        aiBtn.disabled = true;
        aiBtn.textContent = "Fetching via Gemini...";
        await this._fetchResources(skill, true);
      });
    }

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
        const text = container.querySelector("#bulletTextTarget")?.textContent.trim() || "";
        try {
          await navigator.clipboard.writeText(text);
          copyBtn.textContent = "✓ Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy to Clipboard"), 1800);
        } catch {
          copyBtn.textContent = "Copied";
        }
      });
    }

    const addPlannerBtn = container.querySelector("#addSkillToPlannerBtn");
    if (addPlannerBtn) {
      addPlannerBtn.addEventListener("click", () => {
        const tasks = store.get("plannerTasks") || [];
        tasks.push({
          id: Date.now(),
          title: `Master ${skill}: Complete Course & Build Starter Project`,
          day: "Monday",
          completed: false,
          skill,
        });
        store.set("plannerTasks", tasks);
        addPlannerBtn.textContent = "✓ Scheduled in Planner!";
        setTimeout(() => {
          this.close();
          router.navigate("planner");
        }, 700);
      });
    }
  }
}

export const guidedFix = new GuidedFixDrawer();
