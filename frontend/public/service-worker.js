const CACHE_NAME = "storyweaver-v1";
const STATIC_ASSETS = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

// Install Event - Pre-cache core shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching Core Shell");
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    }),
  );
  self.clients.claim();
});

// Fetch Event - Handle API and media offline fallbacks
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Strategy for API Story Calls: Try Network -> Fallback to Cache
  if (request.url.includes("/api/stories")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Strategy for Images & Static Assets: Try Cache -> Fallback to Network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
          const clonedResponse = networkResponse.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, clonedResponse));
        }
        return networkResponse;
      });
    }),
  );
});
