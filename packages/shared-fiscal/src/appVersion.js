/**
 * @file appVersion.js
 * Application version resolution helper across Electron and Browser runtimes.
 *
 * Receipt version rows (AUR-6):
 * - Browser (1 row):
 *   - Dastur versiyasi: 1.0.0 (a1b2c3d)  <- UI version with 7-char short git hash
 * - Electron (2 rows):
 *   - Dastur versiyasi: 1.0.0 (a1b2c3d)  <- UI version with 7-char short git hash
 *   - Desktop versiyasi: 1.3.4           <- Electron app.getVersion()
 */

const SHORT_HASH_LEN = 7;

/**
 * Formats base version with optional short git commit hash: "1.0.0 (a1b2c3d)".
 * Uses 7-char hash so "Dastur versiyasi" (16) + " " (1) + "1.0.0 (a1b2c3d)" (15) = 32 chars (fits 58mm paper).
 * If gitHash is empty or already included, returns base version without duplicate hash.
 * @param {string} [version]
 * @param {string} [gitHash]
 * @returns {string}
 */
export function formatVersionWithHash(version, gitHash) {
  const rawVer = typeof version === 'string' ? version.trim() : '';
  if (!rawVer) return '';

  const embeddedMatch = rawVer.match(/^(.*?)\s*\(([0-9a-f]{6,40})\)$/i);
  if (embeddedMatch) {
    const base = embeddedMatch[1].trim();
    const shortEmbedded = embeddedMatch[2].slice(0, SHORT_HASH_LEN);
    return `${base} (${shortEmbedded})`;
  }

  const hash = typeof gitHash === 'string' ? gitHash.trim() : '';
  if (!hash) {
    return rawVer;
  }
  const shortHash = /^[0-9a-f]{6,40}$/i.test(hash) ? hash.slice(0, SHORT_HASH_LEN) : hash;
  return `${rawVer} (${shortHash})`;
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
 * Resolves both receipt version rows:
 * - `appVersion`: UI version with short hash ("1.0.0 (a1b2c3d)") — shown in both browser and Electron
 * - `desktopVersion`: Electron app.getVersion() ("1.3.4") — shown only in Electron (empty in browser)
 * @param {{ appVersion?: string, desktopVersion?: string }} [overrides]
 * @returns {{ appVersion: string, desktopVersion: string }}
 */
export function getReceiptVersionRows(overrides = {}) {
  const customApp = typeof overrides?.appVersion === 'string' ? overrides.appVersion.trim() : '';
  const customDesktop =
    typeof overrides?.desktopVersion === 'string' ? overrides.desktopVersion.trim() : '';

  return {
    appVersion: customApp || getUiVersion(),
    desktopVersion: customDesktop || getDesktopVersion(),
  };
}

/**
 * Returns primary UI application version string (with short git hash when available),
 * falling back to desktop version if UI build define is absent.
 * @returns {string}
 */
export function getAppVersion() {
  return getUiVersion() || getDesktopVersion();
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
