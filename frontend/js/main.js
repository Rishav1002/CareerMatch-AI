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
import { FloatingAskAiManager } from "./components/floatingAskAi.js";
import { LandingCarousel } from "./components/landingCarousel.js";
import { profileManager } from "./components/profileManager.js";
import { authManager } from "./components/authManager.js";
import { attachSpecularHighlight } from "./motion.js";

export function bindOnce(el, event, handler) {
  if (!el) return;
  const key = `__cm_bound_${event}`;
  if (el[key]) return;
  el[key] = true;
  el.addEventListener(event, handler);
}

function initApp() {
  // 1. Initialize Theme from store or system
  const savedTheme = store.get("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  document.documentElement.style.colorScheme = savedTheme;

  // 2. Initialize Components safely with per-component try/catch
  const components = [
    ["router", () => router.init()],
    ["commandPalette", () => commandPalette.init()],
    ["guidedFix", () => guidedFix.init()],
    ["notifications", () => notifications.init()],
    ["tracker", () => tracker.init()],
    ["planner", () => planner.init()],
    ["historyDiff", () => historyDiff.init()],
    ["scorecardShare", () => scorecardShare.init()],
    ["scrollReveal", () => scrollReveal.init()],
    ["askAiAdvisor", () => askAiAdvisor.init()],
    ["profileManager", () => profileManager.init()],
    ["authManager", () => authManager.init()],
    ["floatingAskAi", () => {
      const floatingAi = new FloatingAskAiManager();
      floatingAi.init();
    }],
    ["landingCarousel", () => {
      const carouselEl = document.getElementById("landingCarouselBg");
      if (carouselEl) {
        const carousel = new LandingCarousel(carouselEl);
        carousel.init();
        window.__careermatch_carousel = carousel;
      }
    }]
  ];

  for (const [name, initFn] of components) {
    try {
      initFn();
    } catch (err) {
      console.error(`[Boot] Component "${name}" failed to initialize:`, err);
      if (typeof window.showToast === "function") {
        window.showToast(`Warning: ${name} component failed to initialize`, "warning");
      }
    }
  }

  // Specular Highlight on primary buttons
  try {
    document.querySelectorAll(".btn-primary").forEach(attachSpecularHighlight);
  } catch (err) {
    console.error("[Boot] Specular highlight failed:", err);
  }

  // 3. Initialize Language
  try {
    applyTranslations();
  } catch (err) {
    console.error("[Boot] i18n applyTranslations failed:", err);
  }

  // 4. Attach Shell Listeners
  try {
    attachShellListeners();
  } catch (err) {
    console.error("[Boot] Shell listeners failed:", err);
  }

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
    profileManager,
    authManager,
  };

  // Mark boot complete for the watchdog safety net
  window.__cmBooted = true;
  window.dispatchEvent(new CustomEvent("careermatch:booted"));
  console.info("CareerMatch AI: application successfully booted (__cmBooted = true).");

  // Populate build SHA from health endpoint
  try {
    fetch("/api/health").then(r => r.json()).then(data => {
      if (data && data.build_sha) {
        const el = document.getElementById("appBuildSha");
        if (el) el.textContent = data.build_sha;
      }
    }).catch(() => {});
  } catch (e) {}
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

  // Unified Theme Toggle Helper
  function toggleAppTheme() {
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
  }

  // Theme Toggle Buttons (guarded with bindOnce to prevent double-toggling)
  bindOnce(document.getElementById("themeToggleBtn"), "click", toggleAppTheme);
  bindOnce(document.getElementById("landingThemeToggleBtn"), "click", toggleAppTheme);
  bindOnce(document.getElementById("settingsThemeToggleBtn"), "click", toggleAppTheme);

  // Settings Actions: Export JSON
  document.getElementById("settingsExportJsonBtn")?.addEventListener("click", () => {
    const exportData = {
      profile: store.get("profile"),
      user: store.get("user"),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `careermatch-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast("Exported workspace data as JSON");
  });

  // Settings Actions: Purge Data
  document.getElementById("settingsPurgeDataBtn")?.addEventListener("click", () => {
    if (confirm("Are you sure you want to purge all local workspace data? This cannot be undone.")) {
      try {
        localStorage.clear();
      } catch (e) {}
      if (window.showToast) window.showToast("Local workspace data purged.");
      setTimeout(() => window.location.reload(), 1000);
    }
  });

  // Cold Start Detection for Render & Neon Server
  const banner = document.getElementById("serverColdStartBanner");
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const urlStr = String(args[0] || "");
    const isApi = urlStr.includes("/api/");
    let timer = null;

    if (isApi && banner) {
      timer = setTimeout(() => {
        banner.style.display = "flex";
      }, 2500);
    }

    try {
      const resp = await origFetch.apply(this, args);
      if (timer) clearTimeout(timer);
      if (banner) banner.style.display = "none";
      return resp;
    } catch (err) {
      if (timer) clearTimeout(timer);
      if (isApi && banner) {
        banner.style.display = "flex";
      }
      throw err;
    }
  };

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
