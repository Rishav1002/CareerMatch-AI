/**
 * CareerMatch AI: Pre-paint Theme Initializer
 * Runs synchronously in <head> to prevent FOUC (flash of unstyled content)
 * Reads localStorage and prefers-color-scheme, applying data-theme immediately.
 */
(function () {
  try {
    var saved = localStorage.getItem("cm_theme") || localStorage.getItem("theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = saved ? saved : (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    // Graceful degradation if localStorage is inaccessible
  }
})();
