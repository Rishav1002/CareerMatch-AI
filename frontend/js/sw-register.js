/**
 * CareerMatch AI: Progressive Web App Service Worker Registration
 * Handles registration, update discovery, and user notification for new releases.
 */
(function () {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      // One-time cleanup of legacy shell caches
      if (!localStorage.getItem("cm_sw_cleaned_v2")) {
        if ("caches" in window) {
          caches.keys().then(function (names) {
            names.forEach(function (name) {
              if (
                name.includes("shell-v") ||
                (name.includes("careermatch-shell-") && !name.includes("2026-11-08-v4.0.1"))
              ) {
                caches.delete(name);
              }
            });
          });
        }
        localStorage.setItem("cm_sw_cleaned_v2", "true");
      }

      navigator.serviceWorker
        .register("/frontend/sw.js")
        .then(function (reg) {
          reg.addEventListener("updatefound", function () {
            var newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", function () {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  showUpdateToast(newWorker);
                }
              });
            }
          });
        })
        .catch(function (err) {
          console.warn("[SW] Registration skipped or failed:", err);
        });
    });
  }

  function showUpdateToast(worker) {
    if (document.getElementById("cmUpdateToast")) return;
    var toast = document.createElement("div");
    toast.id = "cmUpdateToast";
    toast.className = "update-toast glass-panel";
    toast.innerHTML =
      '<span>New version available.</span><button type="button" class="btn btn-primary" id="cmRefreshUpdateBtn">Refresh</button>';
    document.body.appendChild(toast);
    var refreshBtn = document.getElementById("cmRefreshUpdateBtn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", function () {
        worker.postMessage({ type: "SKIP_WAITING" });
        window.location.reload();
      });
    }
  }
})();
