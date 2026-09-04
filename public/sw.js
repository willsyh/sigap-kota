// Service Worker for caching OpenStreetMap tiles & app shell
const CACHE_NAME = "sigapkota-map-v2";

// Cache tile domains (OSM & CDN)
const TILE_DOMAINS = [
  "tile.openstreetmap.org",
  "a.tile.openstreetmap.org",
  "b.tile.openstreetmap.org",
  "c.tile.openstreetmap.org",
  "unpkg.com",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Check if requesting map tiles
  const isTile = TILE_DOMAINS.some((domain) => url.hostname.includes(domain));

  if (isTile) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        // Try Cache First for tiles
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network and cache
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If offline and exact tile missing, fallback to any cached tile from previous zoom
          throw err;
        }
      })
    );
  }
});
