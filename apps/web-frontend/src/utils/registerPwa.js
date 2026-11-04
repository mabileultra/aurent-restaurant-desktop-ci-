/**
 * Safe registration for Aurent web Service Worker (HTTPS / localhost / 127.0.0.1).
 * Caches app shell to provide seamless offline awareness when network drops.
 */
export function registerPwa() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
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
