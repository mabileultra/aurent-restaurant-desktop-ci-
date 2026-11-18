/**
 * @file appVersion.js
 * Application version resolution helper across Electron and Browser runtimes.
 *
 * Receipt version rows (AUR-6):
 * - Browser (1 row):
 *   - Versiya: 1.0.0 (2026-11-18)        <- UI version with last git commit date (%cs)
 * - Electron (2 rows):
 *   - Versiya: 1.0.0 (2026-11-18)        <- UI version with last git commit date (%cs)
 *   - Desktop versiyasi: 1.3.4           <- Electron app.getVersion()
 *
 * About dialog ("Dastur haqida"):
 * - UI version with commit date + short git hash: "1.0.0 (2026-11-18, a1b2c3d)"
 * - In Electron, also shows Desktop version: "1.3.4"
 */

const SHORT_HASH_LEN = 7;

/**
 * Extracts base version and any embedded date/hash from a pre-formatted version string.
 * @param {string} [rawVersion]
 * @returns {{ base: string, date: string, hash: string }}
 */
function parseVersionParts(rawVersion) {
  const raw = typeof rawVersion === 'string' ? rawVersion.trim() : '';
  if (!raw) return { base: '', date: '', hash: '' };

  const match = raw.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (!match) {
    return { base: raw, date: '', hash: '' };
  }

  const base = match[1].trim();
  const inside = match[2].trim();
  let date = '';
  let hash = '';

  for (const part of inside.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
      date = part;
    } else if (/^[0-9a-f]{6,40}$/i.test(part)) {
      hash = part.slice(0, SHORT_HASH_LEN);
    }
  }

  return { base: base || raw, date, hash };
}

/**
 * Formats base version with optional commit date for receipts: "1.0.0 (2026-11-18)".
 * If commitDate is empty (CI/archive without git), returns "1.0.0".
 * @param {string} [version]
 * @param {string} [commitDate]
 * @returns {string}
 */
export function formatVersionWithDate(version, commitDate) {
  const parsed = parseVersionParts(version);
  if (!parsed.base) return '';
  const rawDate = typeof commitDate === 'string' ? commitDate.trim() : '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : parsed.date;
  if (!date) return parsed.base;
  return `${parsed.base} (${date})`;
}

/**
 * Formats base version with commit date and/or short git hash for About dialog:
 * "1.0.0 (2026-11-18, a1b2c3d)".
 * @param {string} [version]
 * @param {string} [gitHash]
 * @param {string} [commitDate]
 * @returns {string}
 */
export function formatVersionWithHash(version, gitHash, commitDate) {
  const parsed = parseVersionParts(version);
  if (!parsed.base) return '';

  const rawDate = typeof commitDate === 'string' ? commitDate.trim() : '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : parsed.date;

  const rawHash = typeof gitHash === 'string' ? gitHash.trim() : '';
  const normalizedHash = /^[0-9a-f]{6,40}$/i.test(rawHash)
    ? rawHash.slice(0, SHORT_HASH_LEN)
    : rawHash || parsed.hash;

  const meta = [date, normalizedHash].filter(Boolean).join(', ');
  return meta ? `${parsed.base} (${meta})` : parsed.base;
}

function readRawBuildTokens() {
  let rawVersion = '';
  let rawDate = '';
  let rawHash = '';

  const hasGlobalVersion =
    typeof globalThis !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(globalThis, '__APP_VERSION__');
  const hasGlobalDate =
    typeof globalThis !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(globalThis, '__APP_COMMIT_DATE__');
  const hasGlobalHash =
    typeof globalThis !== 'undefined' &&
    Object.prototype.hasOwnProperty.call(globalThis, '__APP_GIT_HASH__');

  if (hasGlobalVersion) {
    rawVersion = String(globalThis.__APP_VERSION__ || '').trim();
  } else if (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) {
    rawVersion = String(__APP_VERSION__).trim();
  } else {
    try {
      if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_APP_VERSION) {
        rawVersion = String(import.meta.env.VITE_APP_VERSION).trim();
      }
    } catch {
      // ignore
    }
  }

  if (hasGlobalDate) {
    rawDate = String(globalThis.__APP_COMMIT_DATE__ || '').trim();
  } else if (typeof __APP_COMMIT_DATE__ !== 'undefined' && __APP_COMMIT_DATE__) {
    rawDate = String(__APP_COMMIT_DATE__).trim();
  } else {
    try {
      if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_APP_COMMIT_DATE) {
        rawDate = String(import.meta.env.VITE_APP_COMMIT_DATE).trim();
      }
    } catch {
      // ignore
    }
  }

  if (hasGlobalHash) {
    rawHash = String(globalThis.__APP_GIT_HASH__ || '').trim();
  } else if (typeof __APP_GIT_HASH__ !== 'undefined' && __APP_GIT_HASH__) {
    rawHash = String(__APP_GIT_HASH__).trim();
  } else {
    try {
      if (typeof import.meta !== 'undefined' && import.meta?.env?.VITE_APP_GIT_HASH) {
        rawHash = String(import.meta.env.VITE_APP_GIT_HASH).trim();
      }
    } catch {
      // ignore
    }
  }

  return { rawVersion, rawDate, rawHash, hasGlobalDate };
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
 * Resolves UI version for receipts: "1.0.0 (2026-11-18)" (or "1.0.0" if git date is absent).
 * @returns {string}
 */
export function getUiVersion() {
  const { rawVersion, rawDate, hasGlobalDate } = readRawBuildTokens();
  if (hasGlobalDate && !rawDate) {
    return parseVersionParts(rawVersion).base;
  }
  return formatVersionWithDate(rawVersion, rawDate);
}

/**
 * Resolves UI version for About dialog: "1.0.0 (2026-11-18, a1b2c3d)".
 * @returns {string}
 */
export function getUiAboutVersion() {
  const { rawVersion, rawDate, rawHash, hasGlobalDate } = readRawBuildTokens();
  const effectiveVersion = hasGlobalDate && !rawDate ? parseVersionParts(rawVersion).base : rawVersion;
  return formatVersionWithHash(effectiveVersion, rawHash, rawDate);
}

/**
 * Resolves both receipt version rows:
 * - `appVersion`: UI version with commit date ("1.0.0 (2026-11-18)") — shown in both browser and Electron
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
 * Returns primary UI receipt version string ("1.0.0 (2026-11-18)"),
 * falling back to desktop version if UI build define is absent.
 * @returns {string}
 */
export function getAppVersion() {
  return getUiVersion() || getDesktopVersion();
}

/**
 * Detailed version and platform info object for About dialog.
 * In Electron, exposes both `desktopVersion` ("1.3.4") and `uiVersion` ("1.0.0 (2026-11-18, a1b2c3d)").
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
  const uiVersion = getUiAboutVersion();
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
