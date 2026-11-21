/**
 * CareerMatch AI: Pre-paint Theme Initializer
 * Supports "auto" (default, follows browser/OS prefers-color-scheme), "light", and "dark".
 */
(function () {
  try {
    var pref = localStorage.getItem("cm_theme_pref") || localStorage.getItem("cm_theme") || "auto";
    if (pref !== "light" && pref !== "dark" && pref !== "auto") pref = "auto";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = pref === "auto" ? (prefersDark ? "dark" : "light") : pref;
    document.documentElement.setAttribute("data-theme", resolved);
    document.documentElement.setAttribute("data-theme-pref", pref);
    document.documentElement.style.colorScheme = resolved;
  } catch (e) {}
})();
