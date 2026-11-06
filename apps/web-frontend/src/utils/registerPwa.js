/**
 * Safe registration for Aurent web Service Worker (HTTPS / localhost / 127.0.0.1).
 * Caches app shell to provide seamless offline awareness when network drops.
 */
export function registerPwa() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Never register Service Worker in development mode.
  // It caches Vite dev chunks and causes dual-React module instances (?v=... mismatch) and broken HMR.
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    if (typeof navigator.serviceWorker?.getRegistrations === 'function') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      }).catch(() => {});
    }
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then((keys) => {
        keys.filter((k) => k.includes('aurent-shell')).forEach((k) => caches.delete(k));
      }).catch(() => {});
    }
    return;
  }

  const isSecure =
    window.isSecureContext ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  if (!isSecure) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore private/incognito mode or environments where SW is disabled
    });
  });
}
