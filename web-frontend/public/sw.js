/* Service Worker for Aurent Web Platform & POS */
const CACHE_NAME = 'aurent-shell-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/favicon.svg',
  '/favicon.png',
  '/manifest.webmanifest',
  '/brand/apple-touch-icon.png',
  '/brand/app-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  const url = new URL(req.url);

  // Dynamic API calls are strictly network-only (never serve stale financial/auth data from SW cache)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests (HTML page loads, reload, URL entries e.g. /platform/users, /cashier)
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cachedIndex = await cache.match('/index.html');
          if (cachedIndex) {
            return cachedIndex;
          }
          const cachedOffline = await cache.match('/offline.html');
          if (cachedOffline) {
            return cachedOffline;
          }
          return new Response(
            'Internet bilan aloqa uzildi. Iltimos, Wi-Fi yoki internet tarmog‘ini tekshiring.',
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            }
          );
        })
    );
    return;
  }

  // Same-origin static assets (JS, CSS, images, fonts)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache immediately, optionally revalidate in background
          fetch(req)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                const copy = networkResponse.clone();
                caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
            }
            return networkResponse;
          })
          .catch(() => {
            // If asset fails and it's an image, or not found, let it fail gracefully
            return caches.match(req);
          });
      })
    );
  }
});
