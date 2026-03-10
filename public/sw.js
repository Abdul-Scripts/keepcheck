const CACHE_NAME = "keepcheck-v3";
const scopeUrl = new URL(self.registration.scope);
const basePath = scopeUrl.pathname === "/" ? "" : scopeUrl.pathname.replace(/\/$/, "");
const APP_ROUTES = [
  `${basePath}/`,
  `${basePath}/home/`,
  `${basePath}/checks/`,
  `${basePath}/checks/new/`,
  `${basePath}/profile/`,
];

const STATIC_ASSETS = [
  `${basePath}/`,
  `${basePath}/manifest.webmanifest`,
  `${basePath}/logo-kc-simple.svg`,
  `${basePath}/logo.svg`,
];

const APP_SHELL = Array.from(new Set([...APP_ROUTES, ...STATIC_ASSETS]));

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) {
              await cache.put(url, response.clone());
            }
          } catch {
            // Ignore failed precache entries; runtime cache/fallback handles them.
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key.startsWith("keepcheck-") && key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (!["http:", "https:"].includes(requestUrl.protocol)) {
    return;
  }
  // Navigation requests: network-first, fall back to the matching cached
  // route shell (or the root shell if no closer match exists).
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const isHomeRequest =
          requestUrl.pathname === `${basePath}/` ||
          requestUrl.pathname === `${basePath}/home/`;

        // For home routes, use cache-first so offline never tries network if cached.
        if (isHomeRequest) {
          const cachedHome =
            (await caches.match(event.request, { ignoreSearch: true })) ||
            (await caches.match(`${basePath}/home/`)) ||
            (await caches.match(`${basePath}/`));
          if (cachedHome) return cachedHome;
        }

        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        } catch {
          return (
            (await caches.match(event.request, { ignoreSearch: true })) ||
            (await caches.match(`${basePath}/home/`)) ||
            (await caches.match(`${basePath}/`))
          );
        }
      })()
    );
    return;
  }


  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match(`${basePath}/home/`));
    })
  );
});
