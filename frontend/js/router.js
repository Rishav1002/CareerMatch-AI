/**
 * CareerMatch AI: Hash Router
 * Bookmarkable URLs, view switching, active navigation state
 */

import { store } from "./store.js";

const VIEW_TITLES = {
  landing: "Field Guide & Overview",
  dashboard: "Placement Readiness Dashboard",
  analyzer: "Resume & Job Match Analyzer",
  report: "Career Report & Evidence Ledger",
  ats: "ATS Resume Simulator & Optimizer",
  roadmap: "Adaptive Learning Roadmap",
  planner: "Weekly Study Planner & Milestone Tracker",
  interview: "AI Mock Interview Simulator",
  skills: "AI Skill Assessment Lab",
  github: "GitHub Skill Verification & Proof",
  market: "Live Job Market Intelligence",
  tracker: "Application Kanban Tracker",
  compare: "Career Path & Salary Benchmark",
  readiness: "Placement Readiness Index (PRI)",
  profile: "Student Career Profile",
};

export class Router {
  constructor() {
    this.currentRoute = "";
    window.addEventListener("hashchange", () => this.handleRoute());
  }

  init() {
    // If no hash present, default to landing
    if (!window.location.hash || window.location.hash === "#/") {
      window.location.hash = "#/landing";
    } else {
      this.handleRoute();
    }
  }

  navigate(viewName) {
    window.location.hash = `#/${viewName}`;
  }

  handleRoute() {
    const rawHash = window.location.hash.replace(/^#\/?/, "");
    const viewName = rawHash.split("/")[0] || "landing";

    // Validate view
    const validViews = Object.keys(VIEW_TITLES);
    const targetView = validViews.includes(viewName) ? viewName : "landing";

    this.currentRoute = targetView;
    store.set("currentView", targetView);

    // Update DOM panels
    document.querySelectorAll(".view-panel").forEach((panel) => {
      panel.classList.remove("active");
      panel.hidden = true;
    });

    const activePanel = document.getElementById(`view-${targetView}`);
    if (activePanel) {
      activePanel.classList.add("active");
      activePanel.hidden = false;
    }

    // Auto-close More Tools drawer when navigating
    const moreBackdrop = document.getElementById("moreToolsBackdrop");
    const moreBtn = document.getElementById("moreToolsBtn");
    if (moreBackdrop) moreBackdrop.style.display = "none";
    if (moreBtn) moreBtn.setAttribute("aria-expanded", "false");

    // Update active state on topbar links, more-drawer items, and mobile nav
    document.querySelectorAll(".topbar-nav-link, .more-module-item, .nav-link, .mobile-nav-item").forEach((link) => {
      const linkView = link.getAttribute("data-view");
      if (linkView === targetView) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Update current view breadcrumb / topbar title if element exists
    const topbarTitle = document.getElementById("topbarViewTitle");
    if (topbarTitle) {
      topbarTitle.textContent = VIEW_TITLES[targetView] || targetView;
    }

    // Update document title
    document.title = `CareerMatch AI | ${VIEW_TITLES[targetView] || "Field Guide"}`;

    // Refresh scroll animations
    if (window.__careermatch && window.__careermatch.scrollReveal) {
      window.__careermatch.scrollReveal.refresh();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

export const router = new Router();
