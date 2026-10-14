
const CACHE_NAME = "gs-academy-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png"
];

// Install the new service worker and prepare the app cache.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate the new version and remove older app caches.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key.startsWith("gs-academy-") && key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Prefer the network so updated pages can load.
// Use the cache when the device is offline.
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: "no-store" });

      if (response && response.ok) {
        const cache = await caches.open(CACHE_NAME);

        // Save successful responses for offline use.
        event.waitUntil(
          cache.put(request, response.clone()).catch(() => {})
        );
      }

      return response;
    } catch (error) {
      const cached = await caches.match(request);

      if (cached) return cached;

      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");
        if (home) return home;
      }

      return new Response(
        "Offline: यह पेज अभी उपलब्ध नहीं है। इंटरनेट चालू करके दोबारा कोशिश करें।",
        {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        }
      );
    }
  })());
});
