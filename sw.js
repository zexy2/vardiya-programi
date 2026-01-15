/**
 * Service Worker for Vardiya Programı PWA
 * Provides offline caching and background sync capabilities
 *
 * @version 2.0.0
 */

const CACHE_NAME = "vardiya-v2";

// Files to cache for offline use
const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/styles.css",
    "./js/app.js",
    "./assets/icons/icon-192x192.png",
    "./assets/icons/icon-512x512.png",
];

/**
 * Install Event
 * Cache all static assets
 */
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate Event
 * Clean up old caches
 */
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch Event
 * Serve from cache first, fall back to network
 * (Cache-first strategy for better offline experience)
 */
self.addEventListener("fetch", (event) => {
    // Skip non-GET requests
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version
                return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(event.request)
                .then((networkResponse) => {
                    // Don't cache if not a valid response
                    if (
                        !networkResponse ||
                        networkResponse.status !== 200 ||
                        networkResponse.type !== "basic"
                    ) {
                        return networkResponse;
                    }

                    // Clone the response (can only be consumed once)
                    const responseToCache = networkResponse.clone();

                    // Cache the new resource
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                })
                .catch(() => {
                    // Network failed, return offline fallback
                    return caches.match("./index.html");
                });
        })
    );
});

/**
 * Message Event
 * Handle messages from the main app
 */
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        self.skipWaiting();
    }
});
