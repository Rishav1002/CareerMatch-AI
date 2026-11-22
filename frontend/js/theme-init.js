/**
 * CareerMatch AI: Pre-paint Theme & Route Initializer
 * Prevents FOUC, prevents sidebar flash on landing/login, and manages the boot splash.
 */
(function () {
  try {
    var pref = localStorage.getItem("cm_theme_pref") || localStorage.getItem("cm_theme") || "auto";
    if (pref !== "light" && pref !== "dark" && pref !== "auto") pref = "auto";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved = pref === "auto" ? (prefersDark ? "dark" : "light") : pref;
    var root = document.documentElement;
    root.setAttribute("data-theme", resolved);
    root.setAttribute("data-theme-pref", pref);
    root.style.colorScheme = resolved;

    var rawHash = (window.location.hash || "").toLowerCase();
    var bootRoute = "app";
    if (!rawHash || rawHash === "#" || rawHash === "#/" || rawHash.indexOf("#/landing") === 0) {
      bootRoute = "landing";
    } else if (rawHash.indexOf("#/login") === 0) {
      bootRoute = "auth";
    }
    root.setAttribute("data-boot-route", bootRoute);
    root.setAttribute("data-booting", "true");

    // Failsafe: never trap the user on the splash screen if JS is slow
    window.setTimeout(function () {
      root.setAttribute("data-booting", "false");
    }, 1800);
  } catch (e) {}
})();
