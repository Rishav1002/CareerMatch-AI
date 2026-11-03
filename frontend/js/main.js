/**
 * CareerMatch AI: Main Application Entry Point
 * Orchestrates Router, Store, i18n, ScrollReveal, Left Rail, and Components
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
import { askAiAdvisor } from "./components/askAi.js";

function initApp() {
  // 1. Initialize Theme from store or system
  const savedTheme = store.get("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.documentElement.style.colorScheme = savedTheme;

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
  askAiAdvisor.init();

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
    askAiAdvisor,
  };
}

function attachShellListeners() {
  const rail = document.getElementById("appRail");
  const railBackdrop = document.getElementById("railBackdrop");

  // Desktop rail collapse toggle
  const collapseRailBtn = document.getElementById("collapseRailBtn");
  if (collapseRailBtn && rail) {
    collapseRailBtn.addEventListener("click", () => {
      rail.classList.toggle("collapsed");
      const isCollapsed = rail.classList.contains("collapsed");
      collapseRailBtn.setAttribute("aria-expanded", String(!isCollapsed));
      collapseRailBtn.title = isCollapsed ? "Expand Sidebar" : "Collapse Sidebar";
    });
  }

  // Mobile rail slide-out drawer
  function openMobileRail() {
    rail?.classList.add("open");
    railBackdrop?.classList.add("open");
  }

  function closeMobileRail() {
    rail?.classList.remove("open");
    railBackdrop?.classList.remove("open");
  }

  document.getElementById("mobileRailTriggerBtn")?.addEventListener("click", openMobileRail);
  document.getElementById("mobileMoreBtn")?.addEventListener("click", openMobileRail);
  railBackdrop?.addEventListener("click", closeMobileRail);

  // Close mobile rail when clicking any navigation link
  document.querySelectorAll(".rail-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 768) {
        closeMobileRail();
      }
    });
  });

  // User Avatar Dropdown Menu
  const avatarBtn = document.getElementById("userAvatarMenuBtn");
  const avatarDropdown = document.getElementById("userAvatarDropdown");
  if (avatarBtn && avatarDropdown) {
    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      avatarDropdown.classList.toggle("open");
      avatarBtn.setAttribute("aria-expanded", String(avatarDropdown.classList.contains("open")));
    });

    document.addEventListener("click", (e) => {
      if (!avatarDropdown.contains(e.target) && e.target !== avatarBtn) {
        avatarDropdown.classList.remove("open");
        avatarBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Theme Toggle Button
  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      document.documentElement.style.colorScheme = next;
      store.set("theme", next);
      try {
        localStorage.setItem("cm_theme", next);
        localStorage.setItem("theme", next);
      } catch (e) {}
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute("content", next === "dark" ? "#121417" : "#FBF9F5");
      }
    });
  }

  // Language Switcher Toggle (EN/HI)
  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const current = store.get("lang") || "en";
      const next = current === "en" ? "hi" : "en";
      setLanguage(next);
      langBtn.textContent = next === "en" ? "HI" : "EN";
    });
  }

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileRail();
      if (avatarDropdown) avatarDropdown.classList.remove("open");
      const authBackdrop = document.getElementById("authModalBackdrop");
      if (authBackdrop && authBackdrop.style.display !== "none") {
        authBackdrop.style.display = "none";
        authBackdrop.classList.add("hidden");
      }
    }
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
