/** Persist role POS mobile shell prefs (local only). */

const DEFAULTS = Object.freeze({
  fullscreen: true,
  forceMobile: false,
});

export function roleMobilePrefsKey(roleKey) {
  return `rst-${roleKey}-mobile-prefs`;
}

export function readRoleMobilePrefs(roleKey) {
  try {
    const raw = localStorage.getItem(roleMobilePrefsKey(roleKey));
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      fullscreen: typeof parsed?.fullscreen === 'boolean'
        ? parsed.fullscreen
        : DEFAULTS.fullscreen,
      forceMobile: typeof parsed?.forceMobile === 'boolean'
        ? parsed.forceMobile
        : DEFAULTS.forceMobile,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeRoleMobilePrefs(roleKey, patch) {
  const next = { ...readRoleMobilePrefs(roleKey), ...patch };
  try {
    localStorage.setItem(roleMobilePrefsKey(roleKey), JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
