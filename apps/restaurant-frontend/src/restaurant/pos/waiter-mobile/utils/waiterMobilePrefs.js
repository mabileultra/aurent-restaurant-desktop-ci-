/** Persist waiter mobile shell preferences (local only). */

export const WAITER_MOBILE_PREFS_KEY = 'rst-waiter-mobile-prefs';

const DEFAULTS = Object.freeze({
  /** Prefer browser fullscreen / app-like chrome when available. */
  fullscreen: true,
  /** Manual switch to phone shell (also used on wide screens). */
  forceMobile: false,
});

/**
 * @returns {{ fullscreen: boolean, forceMobile: boolean }}
 */
export function readWaiterMobilePrefs() {
  try {
    const raw = localStorage.getItem(WAITER_MOBILE_PREFS_KEY);
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

/**
 * @param {Partial<{ fullscreen: boolean, forceMobile: boolean }>} patch
 * @returns {{ fullscreen: boolean, forceMobile: boolean }}
 */
export function writeWaiterMobilePrefs(patch) {
  const next = { ...readWaiterMobilePrefs(), ...patch };
  try {
    localStorage.setItem(WAITER_MOBILE_PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
  return next;
}
