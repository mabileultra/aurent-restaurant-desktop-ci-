/** Sync flags from Electron preload. Default false — remote r-aurent behavior. */

import { isRestaurantLocalFirstKilled } from './restaurantLocalFirstKillSwitch';

export function isOfflineFirstDesktop() {
  const win = typeof globalThis !== 'undefined' ? globalThis.window : undefined;
  const d = win?.desktopCashier;
  if (typeof d?.offlineFirstFlag === 'function') return Boolean(d.offlineFirstFlag());
  return Boolean(d?.offlineFirst === true);
}

/** Restaurant local-first dark flag (bundled UI + local SQLite path). */
export function isRestaurantLocalFirstDesktop() {
  if (isRestaurantLocalFirstKilled()) return false;
  const win = typeof globalThis !== 'undefined' ? globalThis.window : undefined;
  const d = win?.desktopCashier;
  if (typeof d?.restaurantLocalFirstFlag === 'function') {
    return Boolean(d.restaurantLocalFirstFlag());
  }
  return Boolean(d?.restaurantLocalFirst === true);
}
