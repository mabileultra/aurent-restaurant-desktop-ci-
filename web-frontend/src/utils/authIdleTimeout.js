import { forceAuthReLogin } from './authSessionExpiry';
import { useAuthStore } from '../store/authStore';
import { isAuthPage } from './authLogin';
import { isPublicAppPath } from './publicAppPaths';

/** Shared POS tablet: auto logout after this much idle time. */
export const AUTH_IDLE_MS = 15 * 60 * 1000;

const LAST_ACTIVITY_KEY = 'pos.auth.lastActivity';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'click'];

function readLastActivity() {
  try {
    const raw = sessionStorage.getItem(LAST_ACTIVITY_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

function writeLastActivity(at = Date.now()) {
  try {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {
    /* private mode */
  }
}

function clearLastActivity() {
  try {
    sessionStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
}

function hasLiveSession() {
  return Boolean(useAuthStore.getState().token);
}

function shouldWatchIdle() {
  if (!hasLiveSession()) return false;
  if (typeof window === 'undefined') return false;
  const { pathname } = window.location;
  if (isAuthPage(pathname) || isPublicAppPath(pathname)) return false;
  return true;
}

/**
 * Start idle watch for the current SPA. Returns cleanup.
 * Persists last activity in sessionStorage so a refresh after idle still logs out.
 */
export function startAuthIdleWatch({
  idleMs = AUTH_IDLE_MS,
  onIdle = forceAuthReLogin,
} = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let timerId = null;
  let lastBump = 0;
  const now = Date.now();
  const stored = readLastActivity();
  let lastActivity = stored && stored <= now ? stored : now;
  writeLastActivity(lastActivity);

  const logoutIfIdle = () => {
    if (!shouldWatchIdle()) return false;
    if (Date.now() - lastActivity < idleMs) return false;
    clearLastActivity();
    onIdle();
    return true;
  };

  // Refresh after long background / closed tab.
  if (logoutIfIdle()) {
    return () => {};
  }

  const schedule = () => {
    if (timerId != null) window.clearTimeout(timerId);
    if (!shouldWatchIdle()) return;
    const remaining = Math.max(0, idleMs - (Date.now() - lastActivity));
    timerId = window.setTimeout(() => {
      if (logoutIfIdle()) return;
      schedule();
    }, remaining || idleMs);
  };

  const bump = () => {
    if (!hasLiveSession()) return;
    const t = Date.now();
    // Throttle storage + timer resets (POS taps are frequent).
    if (t - lastBump < 1000) return;
    lastBump = t;
    lastActivity = t;
    writeLastActivity(t);
    schedule();
  };

  const onVisibility = () => {
    if (document.visibilityState !== 'visible') return;
    if (logoutIfIdle()) return;
    schedule();
  };

  for (const event of ACTIVITY_EVENTS) {
    window.addEventListener(event, bump, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', onVisibility);
  schedule();

  return () => {
    if (timerId != null) window.clearTimeout(timerId);
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, bump, { capture: true });
    }
    document.removeEventListener('visibilitychange', onVisibility);
  };
}

/** Clear idle marker on explicit logout. */
export function resetAuthIdleMarker() {
  clearLastActivity();
}
