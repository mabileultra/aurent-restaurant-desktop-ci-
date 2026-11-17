/**
 * @file appVersion.js
 * Application version resolution helper across Electron and Browser runtimes.
 *
 * Source priority:
 * 1. Electron runtime: window.desktopCashier.appVersion (synced from app.getVersion() via preload)
 * 2. Browser build-time: __APP_VERSION__ (Vite `define` from package.json)
 * 3. Fallback environment: import.meta.env.VITE_APP_VERSION
 */

/**
 * Returns raw resolved application version string or empty string.
 * @returns {string}
 */
export function getAppVersion() {
  // 1. Electron environment
  if (typeof window !== 'undefined' && window.desktopCashier) {
    const desktopVer = window.desktopCashier.appVersion;
    if (typeof desktopVer === 'string' && desktopVer.trim()) {
      return desktopVer.trim();
    }
    if (typeof window.desktopCashier.getAppVersionSync === 'function') {
      const syncVer = window.desktopCashier.getAppVersionSync();
      if (typeof syncVer === 'string' && syncVer.trim()) {
        return syncVer.trim();
      }
    }
  }

  // 2. Vite compile-time define
  if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
    return String(__APP_VERSION__).trim();
  }

  // 3. Optional Vite environment variable fallback
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_APP_VERSION) {
      return String(import.meta.env.VITE_APP_VERSION).trim();
    }
  } catch {
    // ignore runtime unsupported import.meta environments
  }

  return '';
}

/**
 * Detailed version and platform info object.
 * @returns {{ version: string, formatted: string, isDesktop: boolean, platform: 'desktop' | 'web' }}
 */
export function getAppVersionInfo() {
  const version = getAppVersion();
  const isDesktop = typeof window !== 'undefined' && Boolean(window.desktopCashier?.isDesktop);

  return {
    version,
    formatted: version ? `v${version}` : '',
    isDesktop,
    platform: isDesktop ? 'desktop' : 'web',
  };
}
