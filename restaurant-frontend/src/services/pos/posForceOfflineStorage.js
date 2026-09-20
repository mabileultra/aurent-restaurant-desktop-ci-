const STORAGE_KEY = 'pos-force-offline-mode';

export function readForceOfflineMode() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeForceOfflineMode(enabled) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(STORAGE_KEY, '1');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
