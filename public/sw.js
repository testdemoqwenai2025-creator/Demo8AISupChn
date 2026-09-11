// ====================================================================
// Service Worker — PWA offline support (Phase 3C)
// ====================================================================
// Caches the SPA shell + data files for offline access.
// Uses a cache-first strategy for static assets and network-first for data.
// ====================================================================

const CACHE_VERSION = "v3c-2026-09-12";
const CACHE_NAME = `aisupplychain-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  "/Demo8AISupChn/spa/command-center",
  "/Demo8AISupChn/spa/login",
  "/Demo8AISupChn/spa/manifest.json",
  "/Demo8AISupChn/spa/data/orders.json",
  "/Demo8AISupChn/spa/data/tenders.json",
  "/Demo8AISupChn/spa/data/suppliers.json",
  "/Demo8AISupChn/spa/data/stats.json",
  "/Demo8AISupChn/spa/data/audit.json",
  "/Demo8AISupChn/spa/data/clients.json",
];

// Install: cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for data
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Network-first for data files (always get fresh data)
  if (url.pathname.includes("/data/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for everything else (static assets)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

// Push notifications (Phase 4)
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || "New update available",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2310b981'/%3E%3Cpath d='M50 20L80 80H20L50 20z' fill='white'/%3E%3C/svg%3E",
    badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2310b981'/%3E%3C/svg%3E",
    vibrate: [100, 50, 100],
    data: { url: data.url || "/Demo8AISupChn/spa/command-center" },
  };
  event.waitUntil(self.registration.showNotification(data.title || "AI Supply Chain", options));
});

// Notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
