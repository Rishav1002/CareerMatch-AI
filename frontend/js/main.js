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
    const nextMap = { auto: "Light", light: "Dark", dark: "Device" };
    const labelMap = { auto: "Device", light: "Light", dark: "Dark" };
    document.querySelectorAll("[data-theme-cycle]").forEach((btn) => {
      btn.setAttribute("data-theme-mode", normalized);
      const titleText = `Theme: ${labelMap[normalized]} (click for ${nextMap[normalized]})`;
      btn.setAttribute("title", titleText);
      btn.setAttribute("aria-label", titleText);
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
    ["bootSplash", () => { document.documentElement.removeAttribute("data-boot-route"); document.documentElement.setAttribute("data-booting", "false"); }],
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

  // Mobile rail slide-out drawer (slides in from the right on <= 1024px)
  function openMobileRail() {
    rail?.classList.add("open");
    railBackdrop?.classList.add("open");
  }

  function closeMobileRail() {
    rail?.classList.remove("open");
    railBackdrop?.classList.remove("open");
  }

  // Collapsed sidebar floating hover tooltip (fixed-position, never clipped by scroll)
  let railTooltip = document.getElementById("railHoverTooltip");
  if (!railTooltip) {
    railTooltip = document.createElement("div");
    railTooltip.id = "railHoverTooltip";
    railTooltip.className = "rail-hover-tooltip";
    railTooltip.setAttribute("role", "tooltip");
    railTooltip.setAttribute("aria-hidden", "true");
    document.body.appendChild(railTooltip);
  }

  function isRailVisuallyCollapsed() {
    if (!rail || window.innerWidth <= 1024) return false;
    if (window.innerWidth <= 1280) {
      return !rail.classList.contains("expanded");
    }
    return rail.classList.contains("collapsed");
  }

  function hideRailTooltip() {
    if (!railTooltip) return;
    railTooltip.classList.remove("visible");
    railTooltip.setAttribute("aria-hidden", "true");
  }

  function showRailTooltip(targetEl, label) {
    if (!railTooltip || !targetEl || !label || !isRailVisuallyCollapsed()) {
      hideRailTooltip();
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    railTooltip.textContent = label;
    railTooltip.style.left = `${Math.round(rect.right + 12)}px`;
    railTooltip.style.top = `${Math.round(rect.top + rect.height / 2)}px`;
    railTooltip.classList.add("visible");
    railTooltip.setAttribute("aria-hidden", "false");
  }

  // Desktop & tablet rail collapse / expand toggles
  const collapseRailBtn = document.getElementById("collapseRailBtn");
  const expandRailLogoBtn = document.getElementById("expandRailLogoBtn");

  function syncRailAria() {
    const collapsed = isRailVisuallyCollapsed();
    collapseRailBtn?.setAttribute("aria-expanded", String(!collapsed));
    expandRailLogoBtn?.setAttribute("aria-expanded", String(!collapsed));
  }

  if (collapseRailBtn && rail) {
    collapseRailBtn.addEventListener("click", () => {
      hideRailTooltip();
      if (window.innerWidth <= 1024) {
        closeMobileRail();
        return;
      }
      if (window.innerWidth <= 1280) {
        rail.classList.remove("expanded");
        rail.classList.add("collapsed");
      } else {
        rail.classList.toggle("collapsed");
        rail.classList.remove("expanded");
      }
      syncRailAria();
    });
  }

  if (expandRailLogoBtn && rail) {
    expandRailLogoBtn.addEventListener("click", () => {
      hideRailTooltip();
      rail.classList.remove("collapsed");
      if (window.innerWidth > 1024 && window.innerWidth <= 1280) {
        rail.classList.add("expanded");
      }
      syncRailAria();
    });
  }

  // Attach hover/focus tooltips to all collapsed sidebar symbols
  function bindRailTooltip(el, getLabel) {
    if (!el) return;
    el.addEventListener("mouseenter", () => showRailTooltip(el, getLabel()));
    el.addEventListener("focusin", () => showRailTooltip(el, getLabel()));
    el.addEventListener("mouseleave", hideRailTooltip);
    el.addEventListener("focusout", hideRailTooltip);
    el.addEventListener("click", hideRailTooltip);
  }

  bindRailTooltip(expandRailLogoBtn, () => expandRailLogoBtn?.dataset?.railTooltip || "Open sidebar");

  document.querySelectorAll(".rail-nav-link").forEach((link) => {
    bindRailTooltip(link, () => {
      const span = link.querySelector(".rail-link-text");
      return (span?.textContent || link.getAttribute("aria-label") || "").trim();
    });
  });

  const sidebarUserCard = document.getElementById("sidebarUserCard");
  bindRailTooltip(sidebarUserCard, () => {
    const nameEl = document.getElementById("sidebarUserName");
    const name = nameEl?.textContent?.trim();
    return name && name !== "Guest Student" ? `${name} · Profile` : "Profile";
  });

  rail?.addEventListener("scroll", hideRailTooltip, { passive: true });
  document.querySelector(".rail-nav")?.addEventListener("scroll", hideRailTooltip, { passive: true });
  window.addEventListener("resize", () => {
    hideRailTooltip();
    syncRailAria();
  });

  document.getElementById("mobileRailTriggerBtn")?.addEventListener("click", openMobileRail);
  document.getElementById("mobileMoreBtn")?.addEventListener("click", openMobileRail);
  railBackdrop?.addEventListener("click", closeMobileRail);

  // Close mobile/tablet slide-out rail when clicking any navigation link or profile card
  document.querySelectorAll(".rail-nav-link, #sidebarUserCard").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 1024) {
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

  // Delegated single-icon theme cycle button (Landing & Profile dropdown: auto -> light -> dark -> auto)
  document.addEventListener("click", (evt) => {
    const btn = evt.target.closest("[data-theme-cycle]");
    if (!btn) return;
    evt.preventDefault();
    evt.stopPropagation();
    const currentPref = store.get("theme") || document.documentElement.getAttribute("data-theme-pref") || "auto";
    const order = ["auto", "light", "dark"];
    const nextPref = order[(order.indexOf(currentPref) + 1) % order.length];
    store.set("theme", nextPref);
    applyThemePreference(nextPref);
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
