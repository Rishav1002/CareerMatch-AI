/**
 * CareerMatch AI: Progressive Web App Service Worker
 * Network-First for HTML/JS/CSS, Stale-While-Revalidate for Fonts & Static Media,
 * Bypass completely for /api/*, Build-Hash Versioned Cache.
 */

const BUILD_SHA = "2026-11-04-v2.75";
const CACHE_NAME = `careermatch-shell-${BUILD_SHA}`;

const PRECACHE_ASSETS = [
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
  "/frontend/js/storage.js",
  "/frontend/js/motion.js",
  "/frontend/js/formatters.js",
  "/frontend/js/app.js",
  "/frontend/js/components/cmdPalette.js",
  "/frontend/js/components/guidedFix.js",
  "/frontend/js/components/notifications.js",
  "/frontend/js/components/tracker.js",
  "/frontend/js/components/planner.js",
  "/frontend/js/components/historyDiff.js",
  "/frontend/js/components/shareScorecard.js",
  "/frontend/js/components/scrollReveal.js",
  "/frontend/js/components/askAi.js",
  "/frontend/js/components/landingCarousel.js",
  "/frontend/js/components/profileManager.js",
  "/frontend/js/components/authManager.js",
  "/frontend/assets/favicon.svg",
  "/frontend/assets/icon-192.svg",
  "/frontend/assets/icon-512.svg"
];

self.addEventListener("install", (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn("[SW] Precache warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.info(`[SW] Deleting legacy cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (evt) => {
  if (evt.request.method !== "GET") return;

  const url = new URL(evt.request.url);

  // 1. NEVER cache /api/*
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Static icons & external fonts: Stale-While-Revalidate
  const isFontOrIcon =
    url.pathname.includes("/assets/") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com");

  if (isFontOrIcon) {
    evt.respondWith(
      caches.match(evt.request).then((cached) => {
        const fetchPromise = fetch(evt.request).then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, clone));
          }
          return resp;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 3. Network-First (fallback to cache) for HTML, JS, CSS
  evt.respondWith(
    fetch(evt.request)
      .then((networkResp) => {
        if (networkResp && networkResp.status === 200 && networkResp.type === "basic") {
          const clone = networkResp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(evt.request, clone));
        }
        return networkResp;
      })
      .catch(() => {
        return caches.match(evt.request).then((cached) => {
          if (cached) return cached;
          if (evt.request.mode === "navigate") {
            return caches.match("/frontend/index.html") || caches.match("/");
          }
          return new Response("Network unavailable and asset not cached", { status: 503 });
        });
      })
  );
});
