/**
 * CareerMatch AI: Boot Watchdog Safety Net
 * Checks if ES module graph and application initialized within 5 seconds.
 * If boot fails, surfaces recovery banner and enables clean-slate reload.
 */
(function () {
  setTimeout(function () {
    if (!window.__cmBooted) {
      console.error("Boot Watchdog: CareerMatch AI failed to boot within 5 seconds.");
      var banner = document.getElementById("cmBootFailureBanner");
      if (banner) {
        banner.style.display = "flex";
        banner.classList.remove("hidden");
      }
    }
  }, 5000);

  // Self-healing reload and cache wipe on recovery action
  document.addEventListener("DOMContentLoaded", function () {
    var banner = document.getElementById("cmBootFailureBanner");
    if (banner) {
      var reloadBtn = banner.querySelector(".btn-reload");
      if (reloadBtn) {
        reloadBtn.addEventListener("click", function () {
          if ("caches" in window) {
            caches.keys().then(function (keys) {
              return Promise.all(
                keys.map(function (k) {
                  return caches.delete(k);
                })
              );
            }).finally(function () {
              window.location.reload();
            });
          } else {
            window.location.reload();
          }
        });
      }
    }
  });
})();
