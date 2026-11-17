/**
 * @file appVersion.js
 * Application version resolution helper across Electron and Browser runtimes.
 *
 * Source priority:
 * 1. Electron runtime: window.desktopCashier.appVersion (synced from app.getVersion() via preload)
 * 2. Browser build-time: __APP_VERSION__ (Vite `define` from package.json + short git commit hash)
 * 3. Fallback environment: import.meta.env.VITE_APP_VERSION
 */

/**
 * Formats base version with optional short git commit hash: "1.0.0 (a1b2c3d)".
 * If gitHash is empty or already included, returns base version without modification.
 * @param {string} [version]
 * @param {string} [gitHash]
 * @returns {string}
 */
export function formatVersionWithHash(version, gitHash) {
  const ver = typeof version === 'string' ? version.trim() : '';
  if (!ver) return '';
  const hash = typeof gitHash === 'string' ? gitHash.trim() : '';
  if (!hash || ver.includes(`(${hash})`) || /\([0-9a-f]{6,40}\)/i.test(ver)) {
    return ver;
  }
  return `${ver} (${hash})`;
}

/**
 * Resolves Electron desktop shell version (app.getVersion() via preload), or empty string in browser.
 * @returns {string}
 */
export function getDesktopVersion() {
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
  return '';
}

/**
 * Resolves web/UI bundle version (with short git commit hash when available at build time).
 * @returns {string}
 */
export function getUiVersion() {
  let rawVersion = '';
  let rawHash = '';
  const hasGlobalVersionOverride =
    typeof globalThis !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(globalThis, '__APP_VERSION__');
  const hasGlobalHashOverride =
    typeof globalThis !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(globalThis, '__APP_GIT_HASH__');

  if (hasGlobalVersionOverride) {
    rawVersion = String(globalThis.__APP_VERSION__ || '').trim();
  } else if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
    rawVersion = String(__APP_VERSION__).trim();
  } else {
    try {
      if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_APP_VERSION) {
        rawVersion = String(import.meta.env.VITE_APP_VERSION).trim();
      }
    } catch {
      // ignore runtime unsupported import.meta environments
    }
  }

  if (hasGlobalHashOverride) {
    rawHash = String(globalThis.__APP_GIT_HASH__ || '').trim();
  } else if (typeof __APP_GIT_HASH__ !== 'undefined' && __APP_GIT_HASH__) {
    rawHash = String(__APP_GIT_HASH__).trim();
  } else {
    try {
      if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_APP_GIT_HASH) {
        rawHash = String(import.meta.env.VITE_APP_GIT_HASH).trim();
      }
    } catch {
      // ignore runtime unsupported import.meta environments
    }
  }

  return formatVersionWithHash(rawVersion, rawHash);
}

/**
 * Returns resolved application version string for receipts:
 * - In Electron: desktop version (app.getVersion(), e.g. "1.3.4")
 * - In Browser: UI version with short git hash (e.g. "1.0.0 (a1b2c3d)")
 * @returns {string}
 */
export function getAppVersion() {
  return getDesktopVersion() || getUiVersion();
}

/**
 * Detailed version and platform info object for About dialog.
 * In Electron, exposes both `desktopVersion` and `uiVersion` (with hash).
 * @returns {{
 *   version: string,
 *   desktopVersion: string,
 *   uiVersion: string,
 *   formatted: string,
 *   isDesktop: boolean,
 *   platform: 'desktop' | 'web'
 * }}
 */
export function getAppVersionInfo() {
  const desktopVersion = getDesktopVersion();
  const uiVersion = getUiVersion();
  const version = desktopVersion || uiVersion;
  const isDesktop = Boolean(
    (typeof window !== 'undefined' && window.desktopCashier?.isDesktop) || desktopVersion,
  );

  return {
    version,
    desktopVersion,
    uiVersion,
    formatted: version ? `v${version}` : '',
    isDesktop,
    platform: isDesktop ? 'desktop' : 'web',
  };
}
