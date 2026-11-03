/**
 * CareerMatch AI: Service Worker for Shell Caching
 */

const CACHE_NAME = "careermatch-shell-v3";
const SHELL_ASSETS = [
  "/",
  "/frontend/index.html",
  "/frontend/manifest.json",
  "/frontend/css/tokens.css",
  "/frontend/css/base.css",
  "/frontend/css/layout.css",
  "/frontend/css/components.css",
  "/frontend/css/views.css",
  "/frontend/css/styles.css",
  "/frontend/js/main.js",
  "/frontend/js/store.js",
  "/frontend/js/api.js",
  "/frontend/js/router.js",
  "/frontend/js/i18n.js",
  "/frontend/js/app.js",
  "/frontend/js/components/cmdPalette.js",
  "/frontend/js/components/guidedFix.js",
  "/frontend/js/components/notifications.js",
  "/frontend/js/components/tracker.js",
  "/frontend/js/components/planner.js",
  "/frontend/js/components/historyDiff.js",
  "/frontend/js/components/shareScorecard.js",
  "/frontend/js/components/scrollReveal.js",
  "/frontend/assets/icon-192.svg",
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch((err) => console.warn("SW precache error:", err));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evt) => {
  if (evt.request.method !== "GET") return;

  const url = new URL(evt.request.url);

  // Network-first for dynamic API routes
  if (url.pathname.startsWith("/api/")) {
    evt.respondWith(
      fetch(evt.request).catch(() => {
        return new Response(JSON.stringify({ error: "Offline mode: network unavailable" }), {
          headers: { "Content-Type": "application/json" },
          status: 503,
        });
      })
    );
    return;
  }

  // Cache-first for static shell assets
  evt.respondWith(
    caches.match(evt.request).then((cached) => {
      if (cached) return cached;
      return fetch(evt.request).then((resp) => {
        if (!resp || resp.status !== 200 || resp.type !== "basic") {
          return resp;
        }
        const toCache = resp.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evt.request, toCache);
        });
        return resp;
      });
    })
  );
});
