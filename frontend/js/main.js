/**
 * CareerMatch AI: Main Application Entry Point
 * Orchestrates Router, Store, i18n, ScrollReveal, Left Rail, and Components
 */

import { store } from "./store.js";
import { api } from "./api.js";
import { router } from "./router.js";
import { commandPalette } from "./components/cmdPalette.js";
import { guidedFix } from "./components/guidedFix.js";
import { notifications } from "./components/notifications.js";
import { tracker } from "./components/tracker.js";
import { planner } from "./components/planner.js";
import { historyDiff } from "./components/historyDiff.js";
import { scorecardShare } from "./components/shareScorecard.js";
import { scrollReveal } from "./components/scrollReveal.js";
import { askAiAdvisor } from "./components/askAi.js";
import { LandingCarousel } from "./components/landingCarousel.js";
import { profileManager } from "./components/profileManager.js";
import { authManager } from "./components/authManager.js";
import { builderModule } from "./modules/builder.js";
import { attachSpecularHighlight } from "./motion.js";

export function bindOnce(el, event, handler) {
  if (!el) return;
  const key = `__cm_bound_${event}`;
  if (el[key]) return;
  el[key] = true;
  el.addEventListener(event, handler);
}

function initApp() {
  // 1. Initialize Theme (Auto default adapts to browser/OS theme)
  function applyThemePreference(pref) {
    const normalized = (pref === "light" || pref === "dark" || pref === "auto") ? pref : "auto";
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = normalized === "auto" ? (prefersDark ? "dark" : "light") : normalized;
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-pref", normalized);
    document.documentElement.style.colorScheme = resolved;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", resolved === "dark" ? "#121417" : "#FBF9F5");
    document.querySelectorAll("[data-theme-choice]").forEach((btn) => {
      const active = btn.getAttribute("data-theme-choice") === normalized;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }
  const initialThemePref = store.get("theme") || "auto";
  applyThemePreference(initialThemePref);
  store.subscribe("theme", (pref) => applyThemePreference(pref));
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onSysThemeChange = () => {
      if ((store.get("theme") || "auto") === "auto") applyThemePreference("auto");
    };
    if (mq.addEventListener) mq.addEventListener("change", onSysThemeChange);
  }

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
    ["builderModule", () => builderModule.init()],
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
    avatarDropdown.querySelectorAll("a.avatar-menu-item, button.avatar-menu-item").forEach((item) => {
      item.addEventListener("click", () => {
        avatarDropdown.classList.remove("open");
        avatarBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Unified Theme Toggle Helper (Auto / Light / Dark)
  function toggleAppTheme(evt) {
    if (evt && evt.currentTarget && typeof evt.currentTarget.blur === "function") {
      evt.currentTarget.blur();
    }
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    store.set("theme", next);
    applyThemePreference(next);
  }

  // Delegated theme selector across Landing, Profile dropdown, and Settings
  document.addEventListener("click", (evt) => {
    const btn = evt.target.closest("[data-theme-choice]");
    if (!btn) return;
    evt.preventDefault();
    evt.stopPropagation();
    const choice = btn.getAttribute("data-theme-choice") || "auto";
    store.set("theme", choice);
    applyThemePreference(choice);
    if (avatarDropdown && avatarDropdown.contains(btn)) {
      avatarDropdown.classList.remove("open");
      avatarBtn?.setAttribute("aria-expanded", "false");
    }
  });

  // Auth page Back button
  const authBackBtn = document.getElementById("authBackBtn");
  if (authBackBtn) {
    bindOnce(authBackBtn, "click", () => {
      if (window.history.length > 1 && document.referrer) {
        window.history.back();
      } else {
        window.location.hash = "#/landing";
      }
    });
  }

  // Topbar mobile/compact search trigger opens Command Palette
  const topbarSearchBtn = document.getElementById("topbarSearchTriggerBtn");
  if (topbarSearchBtn) {
    bindOnce(topbarSearchBtn, "click", () => {
      document.getElementById("cmdPaletteTrigger")?.click();
    });
  }

  // Theme Toggle Buttons (guarded with bindOnce to prevent double-toggling)
  bindOnce(document.getElementById("topbarThemeToggleBtn"), "click", toggleAppTheme);
  bindOnce(document.getElementById("themeToggleBtn"), "click", toggleAppTheme);
  bindOnce(document.getElementById("landingThemeToggleBtn"), "click", toggleAppTheme);
  bindOnce(document.getElementById("settingsThemeToggleBtn"), "click", toggleAppTheme);

  // CareerMatch AI is English-only. Remove any legacy language preference.
  try { localStorage.removeItem("cm_pref_lang"); localStorage.removeItem("lang"); } catch (_) {}
  document.documentElement.setAttribute("lang", "en");

  // Settings Actions: Export JSON
  document.getElementById("settingsExportJsonBtn")?.addEventListener("click", async () => {
    try {
      if (window.showToast) window.showToast("Preparing full data export...");
      const res = await fetch("/api/profile/export", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Failed to export data from server");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `careermatch-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (window.showToast) window.showToast("Exported all personal data as JSON");
    } catch (e) {
      if (window.showToast) window.showToast("Export failed: " + e.message, "error");
    }
  });

  // Settings Actions: Purge Data
  document.getElementById("settingsPurgeDataBtn")?.addEventListener("click", async () => {
    const confirmed = confirm(
      "Are you sure you want to permanently erase your account, resumes, analyses, and activity data?\n\nThis will purge all records from the server and reset local browser storage. This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await fetch("/api/profile/delete", { method: "DELETE", credentials: "same-origin" });
      try {
        localStorage.clear();
      } catch (e) {}
      if (window.showToast) window.showToast("All personal data permanently erased.");
      setTimeout(() => {
        window.location.hash = "#/landing";
        window.location.reload();
      }, 1000);
    } catch (e) {
      if (window.showToast) window.showToast("Deletion failed: " + e.message, "error");
    }
  });

  // Storage notice banner
  const storageNoticeEl = document.getElementById("cmStorageNotice");
  if (storageNoticeEl) {
    if (!localStorage.getItem("cm_storage_noticed")) {
      storageNoticeEl.hidden = false;
      document.getElementById("cmStorageNoticeDismissBtn")?.addEventListener("click", () => {
        try {
          localStorage.setItem("cm_storage_noticed", "true");
        } catch (e) {}
        storageNoticeEl.hidden = true;
      });
    }
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
