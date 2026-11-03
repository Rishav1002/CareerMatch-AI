/**
 * CareerMatch AI: Main Application Entry Point
 * Orchestrates Router, Store, i18n, ScrollReveal, and Components
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
import { scrollReveal } from "./components/scrollReveal.js";

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
  scrollReveal.init();

  // 3. Initialize Language
  applyTranslations();

  // 4. Attach Shell Listeners
  attachShellListeners();

  // 5. Expose globals for app.js and router interoperability
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
    scrollReveal,
  };
}

function attachShellListeners() {
  // Three-line "More Tools" Expandable Drawer Toggle
  const moreBtn = document.getElementById("moreToolsBtn");
  const moreBackdrop = document.getElementById("moreToolsBackdrop");
  const closeMoreBtn = document.getElementById("closeMoreToolsBtn");

  function openMoreTools() {
    if (moreBackdrop) {
      moreBackdrop.style.display = "flex";
      moreBtn?.setAttribute("aria-expanded", "true");
    }
  }

  function closeMoreTools() {
    if (moreBackdrop) {
      moreBackdrop.style.display = "none";
      moreBtn?.setAttribute("aria-expanded", "false");
    }
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => {
      const isExpanded = moreBtn.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        closeMoreTools();
      } else {
        openMoreTools();
      }
    });
  }

  if (closeMoreBtn) {
    closeMoreBtn.addEventListener("click", closeMoreTools);
  }

  if (moreBackdrop) {
    moreBackdrop.addEventListener("click", (e) => {
      if (e.target === moreBackdrop) {
        closeMoreTools();
      }
    });
  }

  // Close drawer on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMoreTools();
      const authBackdrop = document.getElementById("authModalBackdrop");
      if (authBackdrop && authBackdrop.style.display !== "none") {
        authBackdrop.style.display = "none";
        authBackdrop.classList.add("hidden");
      }
    }
  });

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
      openMoreTools();
    });
  }

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
