/**
 * CareerMatch AI: Hash Router
 * Bookmarkable URLs, view switching, active navigation state
 */

import { store } from "./store.js";

const VIEW_TITLES = {
  landing: "Explainable Career-Readiness Field Guide",
  dashboard: "Placement Readiness Dashboard",
  analyzer: "Resume & Job Match Analyzer",
  report: "Explainable Career Report & Evidence Ledger",
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

    // Toggle landing vs app shell styling if needed
    const appSidebar = document.querySelector(".app-sidebar");
    const mobileNav = document.querySelector(".mobile-bottom-nav");
    if (targetView === "landing") {
      if (appSidebar) appSidebar.style.display = "none";
      if (mobileNav) mobileNav.style.display = "none";
    } else {
      if (appSidebar && window.innerWidth > 768) appSidebar.style.display = "flex";
      if (mobileNav && window.innerWidth <= 768) mobileNav.style.display = "flex";
    }

    // Update active nav links (desktop rail + mobile bottom bar)
    document.querySelectorAll(".nav-link, .mobile-nav-item").forEach((link) => {
      const linkView = link.getAttribute("data-view");
      if (linkView === targetView) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Update current view breadcrumb / topbar title
    const topbarTitle = document.getElementById("topbarViewTitle");
    if (topbarTitle) {
      topbarTitle.textContent = VIEW_TITLES[targetView] || targetView;
    }

    // Update document title
    document.title = `CareerMatch AI | ${VIEW_TITLES[targetView] || "Field Guide"}`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "instant" });
  }
}

export const router = new Router();
