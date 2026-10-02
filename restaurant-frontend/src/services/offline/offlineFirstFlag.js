/** Sync flags from Electron preload. Default false — remote r-aurent behavior. */

export function isOfflineFirstDesktop() {
  const win = typeof globalThis !== 'undefined' ? globalThis.window : undefined;
  return Boolean(win?.desktopCashier?.offlineFirst === true);
}

/** Restaurant local-first dark flag (bundled UI + local SQLite path). */
export function isRestaurantLocalFirstDesktop() {
  const win = typeof globalThis !== 'undefined' ? globalThis.window : undefined;
  return Boolean(win?.desktopCashier?.restaurantLocalFirst === true);
}
