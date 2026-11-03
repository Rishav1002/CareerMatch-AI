/**
 * CareerMatch AI: Main Application Entry Point
 * Orchestrates Router, Store, i18n, and Components
 */

import { store } from "./store.js";
import { api } from "./api.js";
import { router } from "./router.js";
import { setLanguage, applyTranslations } from "./i18n.js";
import { commandPalette } from "./components/cmdPalette.js";
import { guidedFix } from "./components/guidedFix.js";
import { notifications } from "./components/notifications.js";
import { tracker } from "./components/tracker.js";
import { planner } from "./components/planner.js";
import { historyDiff } from "./components/historyDiff.js";
import { scorecardShare } from "./components/shareScorecard.js";

function initApp() {
  // 1. Initialize Theme from store
  const savedTheme = store.get("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  // 2. Initialize Components
  router.init();
  commandPalette.init();
  guidedFix.init();
  notifications.init();
  tracker.init();
  planner.init();
  historyDiff.init();
  scorecardShare.init();

  // 3. Initialize Language
  applyTranslations();

  // 4. Attach Shell Listeners
  attachShellListeners();

  // 5. Expose globals for app.js interoperability
  window.__careermatch = {
    store,
    api,
    router,
    commandPalette,
    guidedFix,
    notifications,
    tracker,
    planner,
    historyDiff,
    scorecardShare,
  };
}

function attachShellListeners() {
  // Sidebar Collapse Toggle
  const collapseBtn = document.getElementById("sidebarCollapseBtn");
  const sidebar = document.getElementById("appSidebar");
  if (collapseBtn && sidebar) {
    collapseBtn.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      store.set("sidebarCollapsed", sidebar.classList.contains("collapsed"));
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      store.set("theme", next);
    });
  }

  // Language Switcher Toggle (EN/HI)
  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const current = store.get("lang") || "en";
      const next = current === "en" ? "hi" : "en";
      setLanguage(next);
    });
  }

  // Landing Page Demo CTA button
  const landingDemoBtn = document.getElementById("landingTryDemoBtn");
  if (landingDemoBtn) {
    landingDemoBtn.addEventListener("click", () => {
      if (typeof window.selectDemoResume === "function") {
        window.selectDemoResume(0, true);
        router.navigate("report");
      } else {
        router.navigate("analyzer");
      }
    });
  }

  // Analyzer Demo Pill
  const demoAaravBtn = document.getElementById("demoAaravBtn");
  if (demoAaravBtn) {
    demoAaravBtn.addEventListener("click", () => {
      if (typeof window.selectDemoResume === "function") {
        window.selectDemoResume(0, false);
      }
    });
  }

  // Mobile More Navigation Trigger
  const mobileMoreTrigger = document.getElementById("mobileMoreTrigger");
  if (mobileMoreTrigger) {
    mobileMoreTrigger.addEventListener("click", () => {
      commandPalette.open();
    });
  }

  // Report Sub-tabs Switching
  document.querySelectorAll("[data-report-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-report-tab");

      document.querySelectorAll("[data-report-tab]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".report-tab-panel").forEach((p) => {
        p.hidden = true;
      });

      const panel = document.getElementById(targetId);
      if (panel) panel.hidden = false;
    });
  });

  // Track Job Button Click Delegation from Job Market
  document.addEventListener("click", (e) => {
    const trackBtn = e.target.closest("[data-track-job]");
    if (trackBtn) {
      try {
        const jobRaw = trackBtn.getAttribute("data-track-job");
        const jobData = JSON.parse(decodeURIComponent(jobRaw));
        tracker.addJob(jobData);
        trackBtn.textContent = "✓ Tracked in Pipeline";
        trackBtn.disabled = true;
      } catch (err) {
        console.warn("Could not track job:", err);
      }
    }
  });
}

// Bootstrap on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
