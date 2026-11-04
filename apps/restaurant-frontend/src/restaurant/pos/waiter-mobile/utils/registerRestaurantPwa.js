/** Register restaurant PWA service worker once (HTTPS / localhost). */

export function registerRestaurantPwa() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const secure = window.isSecureContext || window.location.hostname === 'localhost';
  if (!secure) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore — private mode / blocked SW */
    });
  });
}
