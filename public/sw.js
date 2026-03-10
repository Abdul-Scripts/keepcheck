const CACHE_NAME = "keepcheck-v5";
const scopeUrl = new URL(self.registration.scope);
const basePath = scopeUrl.pathname === "/" ? "" : scopeUrl.pathname.replace(/\/$/, "");
const LEGACY_NEW_CHECK_ROUTE = `${basePath}/checks/new/`;
const APP_ROUTES = [
  `${basePath}/`,
  `${basePath}/home/`,
  `${basePath}/install/`,
  `${basePath}/new-check/`,
  LEGACY_NEW_CHECK_ROUTE,
  `${basePath}/checks/`,
  `${basePath}/profile/`,
];

const STATIC_ASSETS = [
  `${basePath}/manifest.webmanifest`,
  `${basePath}/logo-kc-simple.svg`,
  `${basePath}/logo.svg`,
  `${basePath}/cash.png`,
  `${basePath}/web-app-manifest-192x192.png`,
  `${basePath}/web-app-manifest-512x512.png`,
  `${basePath}/apple-touch-icon.png`,
  `${basePath}/favicon.ico`,
];

const APP_SHELL = Array.from(new Set([...APP_ROUTES, ...STATIC_ASSETS]));
const APP_ROUTE_SET = new Set(APP_ROUTES);

function normalizePath(pathname) {
  if (!pathname.startsWith(basePath || "/")) return pathname;
  if (pathname === basePath || pathname === `${basePath}`) {
    return `${basePath}/`;
  }
  if (pathname.endsWith("/")) return pathname;
  const lastSegment = pathname.split("/").pop() || "";
  if (lastSegment.includes(".")) return pathname;
  return `${pathname}/`;
}

function routeFallbackForPath(pathname) {
  const normalized = normalizePath(pathname);
  if (
    normalized === `${basePath}/new-check/` ||
    normalized === LEGACY_NEW_CHECK_ROUTE
  ) {
    return `${basePath}/new-check/`;
  }
  if (normalized.startsWith(`${basePath}/checks/`)) {
    return `${basePath}/checks/`;
  }
  if (normalized.startsWith(`${basePath}/profile/`)) {
    return `${basePath}/profile/`;
  }
  if (normalized.startsWith(`${basePath}/install/`)) {
    return `${basePath}/install/`;
  }
  if (normalized.startsWith(`${basePath}/home/`)) {
    return `${basePath}/home/`;
  }
  return `${basePath}/`;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "reload" });
            if (response.ok) {
              await cache.put(url, response.clone());
              if (APP_ROUTE_SET.has(url) && url.endsWith("/") && url !== `${basePath}/`) {
                await cache.put(url.slice(0, -1), response.clone());
              }
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
  if (requestUrl.origin !== self.location.origin) return;
  // Navigation requests: cache-first by default.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const requestUrl = new URL(event.request.url);
        const normalizedPath = normalizePath(requestUrl.pathname);
        const normalizedUrl = `${requestUrl.origin}${normalizedPath}${requestUrl.search}`;
        const routeFallback = routeFallbackForPath(requestUrl.pathname);
        const cachedRoute =
          (await caches.match(event.request, { ignoreSearch: true })) ||
          (await caches.match(normalizedUrl, { ignoreSearch: true })) ||
          (await caches.match(normalizedPath, { ignoreSearch: true })) ||
          (await caches.match(routeFallback, { ignoreSearch: true }));
        if (cachedRoute) {
          // Refresh in background when online, but do not block navigation.
          event.waitUntil(
            fetch(normalizedUrl)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  const clone = networkResponse.clone();
                  return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(normalizedUrl, clone.clone());
                    cache.put(normalizedPath, clone.clone());
                    return cache.put(routeFallback, clone);
                  });
                }
                return undefined;
              })
              .catch(() => undefined)
          );
          return cachedRoute;
        }

        try {
          const networkResponse = await fetch(normalizedUrl);
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(normalizedUrl, clone.clone());
              cache.put(normalizedPath, clone.clone());
              cache.put(routeFallback, clone);
            });
          }
          return networkResponse;
        } catch {
          return (
            (await caches.match(normalizedUrl, { ignoreSearch: true })) ||
            (await caches.match(normalizedPath, { ignoreSearch: true })) ||
            (await caches.match(routeFallback, { ignoreSearch: true })) ||
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
        // Refresh static/data assets in background when online.
        event.waitUntil(
          fetch(event.request)
            .then((networkResponse) => {
              if (
                networkResponse &&
                networkResponse.status === 200 &&
                networkResponse.type === "basic"
              ) {
                const responseToCache = networkResponse.clone();
                return caches.open(CACHE_NAME).then((cache) => {
                  return cache.put(event.request, responseToCache);
                });
              }
              return undefined;
            })
            .catch(() => undefined)
        );
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
        .catch(() => caches.match(event.request));
    })
  );
});
