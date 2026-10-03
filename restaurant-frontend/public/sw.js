/* Cache app shell for waiter PWA; API stays network-only (local-first outbox handles POS). */
const SHELL = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('rst-shell-v1').then((cache) => cache.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') {
    event.respondWith(fetch(req));
    return;
  }
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/rst/')) {
    event.respondWith(fetch(req));
    return;
  }
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        void caches.open('rst-shell-v1').then((c) => c.put(req, copy)).catch(() => undefined);
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        return cached || caches.match('/index.html');
      }),
  );
});
