/**
 * CareerMatch AI: Single Authoritative Route Registry & Hash Router
 * Direct ES module dispatch, scroll reset, focus management, and honest empty states.
 */

import { store } from "./store.js";
import { dashboardModule } from "./modules/dashboard.js";
import { analyzerModule } from "./modules/analyzer.js";
import { reportModule } from "./modules/report.js";
import { atsModule } from "./modules/ats.js";
import { roadmapModule } from "./modules/roadmap.js";
import { interviewModule } from "./modules/interview.js";
import { assessmentModule } from "./modules/assessment.js";
import { githubModule } from "./modules/github.js";
import { marketModule } from "./modules/market.js";
import { careerModule } from "./modules/career.js";
import { priModule } from "./modules/pri.js";

export const ROUTE_REGISTRY = {
  landing: {
    id: "landing",
    hash: "#/landing",
    panelId: "view-landing",
    title: "Field Guide & Overview",
    requiresResume: false,
    group: "overview",
    loader: null,
  },
  dashboard: {
    id: "dashboard",
    hash: "#/dashboard",
    panelId: "view-dashboard",
    title: "Placement Readiness Dashboard",
    requiresResume: false,
    group: "overview",
    loader: () => dashboardModule.load(),
  },
  analyzer: {
    id: "analyzer",
    hash: "#/analyzer",
    panelId: "view-analyzer",
    title: "Resume & Job Match Analyzer",
    requiresResume: false,
    group: "diagnose",
    loader: () => analyzerModule.load(),
  },
  ats: {
    id: "ats",
    hash: "#/ats",
    panelId: "view-ats",
    title: "ATS Resume Simulator & Optimizer",
    requiresResume: true,
    group: "diagnose",
    loader: () => atsModule.load(),
  },
  readiness: {
    id: "readiness",
    hash: "#/readiness",
    panelId: "view-pri",
    title: "Placement Readiness Index (PRI)",
    requiresResume: true,
    group: "diagnose",
    loader: () => priModule.load(),
  },
  roadmap: {
    id: "roadmap",
    hash: "#/roadmap",
    panelId: "view-roadmap",
    title: "Adaptive Learning Roadmap",
    requiresResume: true,
    group: "prepare",
    loader: () => roadmapModule.load(),
  },
  planner: {
    id: "planner",
    hash: "#/planner",
    panelId: "view-planner",
    title: "Weekly Study Planner",
    requiresResume: false,
    group: "prepare",
    loader: () => {
      if (window.__careermatch?.planner?.render) {
        window.__careermatch.planner.render();
      }
    },
  },
  interview: {
    id: "interview",
    hash: "#/interview",
    panelId: "view-interview",
    title: "AI Mock Interview Simulator",
    requiresResume: true,
    group: "prepare",
    loader: () => interviewModule.load(),
  },
  skills: {
    id: "skills",
    hash: "#/skills",
    panelId: "view-assessment",
    title: "AI Skill Assessment Lab",
    requiresResume: false,
    group: "prepare",
    loader: () => assessmentModule.load(),
  },
  github: {
    id: "github",
    hash: "#/github",
    panelId: "view-github",
    title: "GitHub Skill Verification",
    requiresResume: false,
    group: "prove",
    loader: () => githubModule.load(),
  },
  report: {
    id: "report",
    hash: "#/report",
    panelId: "view-report",
    title: "Career Report & Evidence Ledger",
    requiresResume: true,
    group: "prove",
    loader: () => reportModule.load(),
  },
  market: {
    id: "market",
    hash: "#/market",
    panelId: "view-jobs",
    title: "Live Job Market Intelligence",
    requiresResume: false,
    group: "decide",
    loader: () => marketModule.load(),
  },
  compare: {
    id: "compare",
    hash: "#/compare",
    panelId: "view-career",
    title: "Role Benchmark & Salary Intelligence",
    requiresResume: false,
    group: "decide",
    loader: () => careerModule.load(),
  },
  tracker: {
    id: "tracker",
    hash: "#/tracker",
    panelId: "view-tracker",
    title: "Application Pipeline Tracker",
    requiresResume: false,
    group: "decide",
    loader: () => {
      if (window.__careermatch?.tracker?.render) {
        window.__careermatch.tracker.render();
      }
    },
  },
  profile: {
    id: "profile",
    hash: "#/profile",
    panelId: "view-profile",
    title: "Student Career Profile",
    requiresResume: false,
    group: "account",
    loader: () => {
      if (window.__careermatch?.profileManager?.populate) {
        window.__careermatch.profileManager.populate();
      }
    },
  },
  login: {
    id: "login",
    hash: "#/login",
    panelId: "view-login",
    title: "Sign In or Register",
    requiresResume: false,
    group: "auth",
    loader: null,
  },
  settings: {
    id: "settings",
    hash: "#/settings",
    panelId: "view-settings",
    title: "Settings & Data Privacy",
    requiresResume: false,
    group: "account",
    loader: null,
  },
  privacy: {
    id: "privacy",
    hash: "#/privacy",
    panelId: "view-privacy",
    title: "Privacy Policy",
    requiresResume: false,
    group: "legal",
    loader: null,
  },
  terms: {
    id: "terms",
    hash: "#/terms",
    panelId: "view-terms",
    title: "Terms of Service",
    requiresResume: false,
    group: "legal",
    loader: null,
  },
  cookies: {
    id: "cookies",
    hash: "#/cookies",
    panelId: "view-cookies",
    title: "Cookie & Storage Policy",
    requiresResume: false,
    group: "legal",
    loader: null,
  },
  "404": {
    id: "404",
    hash: "#/404",
    panelId: "view-404",
    title: "Page Not Found",
    requiresResume: false,
    group: "system",
    loader: null,
  },
};

export const ROUTE_ALIASES = {
  "": "landing",
  "/": "landing",
  signup: "login",
  auth: "login",
  jobs: "market",
  assessment: "skills",
  career: "compare",
  pri: "readiness",
  match: "analyzer",
  resume: "ats",
  practice: "interview",
  proof: "github",
  overview: "dashboard",
  account: "profile",
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderResumeRequiredCTA(panel, route) {
  let emptyState = panel.querySelector(".route-resume-required-card");
  if (!emptyState) {
    emptyState = document.createElement("div");
    emptyState.className = "route-resume-required-card card";
    emptyState.setAttribute("role", "region");
    emptyState.setAttribute("aria-label", "Resume required notice");
    emptyState.innerHTML = `
      <div class="empty-state-content" style="text-align: center; padding: clamp(24px, 4vw, 48px); max-width: 580px; margin: 0 auto;">
        <div class="empty-state-icon-circle" style="width: 56px; height: 56px; border-radius: 50%; background: var(--bg-sunken); display: inline-flex; align-items: center; justify-content: center; margin-bottom: var(--space-3); border: 1px solid var(--border-subtle); color: var(--brand-accent);">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <h3 style="font-family: var(--font-display); font-size: 1.35rem; margin: 0 0 8px; color: var(--text-primary);">
          Resume Required for ${escapeHtml(route.title)}
        </h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin: 0 0 var(--space-4);">
          This personalized module benchmarks your verified skills, experience, and target roles. Upload or paste your resume in the Analyzer to calculate your personalized score and recommendations.
        </p>
        <div style="display: flex; gap: var(--space-2); justify-content: center; flex-wrap: wrap;">
          <a href="#/analyzer" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <span>Upload Resume in Analyzer</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
          <a href="#/dashboard" class="btn btn-secondary">
            View Dashboard
          </a>
        </div>
      </div>
    `;
    panel.prepend(emptyState);
  }
  emptyState.style.display = "block";

  Array.from(panel.children).forEach((child) => {
    if (child !== emptyState && !child.classList.contains("panel-header-static")) {
      if (child.dataset.originalDisplay === undefined) {
        child.dataset.originalDisplay = child.style.display || "";
      }
      child.style.display = "none";
    }
  });
}

function clearResumeRequiredCTA(panel) {
  const emptyState = panel.querySelector(".route-resume-required-card");
  if (emptyState) {
    emptyState.style.display = "none";
  }
  Array.from(panel.children).forEach((child) => {
    if (child !== emptyState && child.dataset.originalDisplay !== undefined) {
      child.style.display = child.dataset.originalDisplay;
      delete child.dataset.originalDisplay;
    }
  });
}

export class Router {
  constructor() {
    this.currentRoute = "";
    this.registry = ROUTE_REGISTRY;
    this.aliases = ROUTE_ALIASES;
    window.addEventListener("hashchange", () => this.handleRoute());
    window.addEventListener("cm:resume-changed", () => {
      if (this.currentRoute) {
        this.handleRoute();
      }
    });
  }

  init() {
    // Intercept data-scroll-to anchors for in-page smooth navigation without 404 route drift
    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-scroll-to]");
      if (!trigger) return;
      const targetId = trigger.getAttribute("data-scroll-to");
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        e.preventDefault();
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        targetEl.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
        const focusable = targetEl.querySelector("h1, h2, h3, [tabindex]") || targetEl;
        if (focusable) {
          focusable.setAttribute("tabindex", "-1");
          focusable.focus({ preventScroll: true });
        }
      }
    });

    // Initialize all feature modules
    dashboardModule.init();
    analyzerModule.init();
    reportModule.init();
    atsModule.init();
    roadmapModule.init();
    interviewModule.init();
    assessmentModule.init();
    githubModule.init();
    marketModule.init();
    careerModule.init();
    priModule.init();

    if (!window.location.hash || window.location.hash === "#" || window.location.hash === "#/") {
      window.location.hash = "#/landing";
    }
    this.handleRoute();
  }

  navigate(viewName) {
    const raw = String(viewName || "").replace(/^#\/?/, "");
    window.location.hash = `#/${raw}`;
  }

  getRoute(viewName) {
    const clean = String(viewName || "").replace(/^#\/?/, "").split("/")[0].toLowerCase();
    const resolved = this.aliases[clean] || clean;
    return this.registry[resolved] || null;
  }

  handleRoute() {
    const rawHash = window.location.hash.replace(/^#\/?/, "");
    const requestedView = (rawHash.split("/")[0] || "landing").toLowerCase();

    // Resolve aliases (e.g. jobs -> market, pri -> readiness)
    const targetKey = this.aliases[requestedView] || requestedView;
    const isKnown = Boolean(this.registry[targetKey]);
    let activeRouteKey = isKnown ? targetKey : "404";

    // Gracefully handle in-page section anchors without dropping into 404
    if (!isKnown) {
      const inPageEl = document.getElementById(rawHash) || document.getElementById(requestedView);
      if (inPageEl) {
        activeRouteKey = this.currentRoute || "landing";
        setTimeout(() => {
          const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          inPageEl.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth" });
          const focusable = inPageEl.querySelector("h1, h2, h3, [tabindex]") || inPageEl;
          if (focusable) {
            focusable.setAttribute("tabindex", "-1");
            focusable.focus({ preventScroll: true });
          }
        }, 30);
      }
    }

    const route = this.registry[activeRouteKey];

    this.currentRoute = activeRouteKey;
    store.set("currentView", activeRouteKey);

    // Update shell view mode (landing, auth, workspace)
    const appShell = document.querySelector(".app-shell");
    if (appShell) {
      if (activeRouteKey === "landing") {
        appShell.classList.add("is-landing");
        appShell.classList.remove("is-auth");
      } else if (activeRouteKey === "login") {
        appShell.classList.add("is-auth");
        appShell.classList.remove("is-landing");
      } else {
        appShell.classList.remove("is-landing");
        appShell.classList.remove("is-auth");
      }
    }

    // Hide all view panels
    document.querySelectorAll(".view-panel").forEach((panel) => {
      panel.classList.remove("active");
      panel.hidden = true;
    });

    // Locate target panel
    const panel = document.getElementById(route.panelId);
    if (panel) {
      panel.classList.add("active");
      panel.hidden = false;

      // Check whether resume is required using store as single source of truth
      const hasResume = Boolean(store.get("activeResume"));
      if (route.requiresResume && !hasResume) {
        renderResumeRequiredCTA(panel, route);
      } else {
        clearResumeRequiredCTA(panel);
        // Execute route data loader directly from ES module
        if (typeof route.loader === "function") {
          try {
            route.loader();
          } catch (loaderErr) {
            console.warn(`[Router] Loader error on ${activeRouteKey}:`, loaderErr);
          }
        }
      }

      // Accessibility: move focus to heading or panel
      const heading = panel.querySelector("h1, h2, h3, [tabindex='-1']");
      if (heading) {
        heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    } else {
      console.warn(`[Router] View panel #${route.panelId} not found in DOM`);
    }

    // Auto-close mobile rail drawer if open
    const rail = document.getElementById("appRail");
    const railBackdrop = document.getElementById("railBackdrop");
    if (rail && window.innerWidth <= 768) {
      rail.classList.remove("open");
      railBackdrop?.classList.remove("open");
    }

    // Sync active state on navigation links across shell
    document.querySelectorAll(".topbar-nav-link, .more-module-item, .nav-link, .mobile-nav-item, .rail-nav-link").forEach((link) => {
      const linkView = link.getAttribute("data-view");
      const linkKey = this.aliases[linkView] || linkView;
      if (linkKey === activeRouteKey) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });

    // Update topbar breadcrumb / title
    const topbarTitle = document.getElementById("topbarViewTitle");
    if (topbarTitle) {
      topbarTitle.textContent = route.title || activeRouteKey;
    }

    // Update document title
    document.title = `${route.title || "Career Readiness"} — CareerMatch AI`;

    // Refresh scroll animations
    if (window.__careermatch?.scrollReveal) {
      window.__careermatch.scrollReveal.refresh();
    }

    // Notify other components
    window.dispatchEvent(new CustomEvent("cm:route-changed", { detail: { route: activeRouteKey, title: route.title } }));

    // Reset scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }
}

export const router = new Router();
