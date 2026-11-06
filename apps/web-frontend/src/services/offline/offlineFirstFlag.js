/** Sync flag from Electron preload. Default false — current cashier behavior. */

export function isOfflineFirstDesktop() {
  const win = typeof globalThis !== 'undefined' ? globalThis.window : undefined;
  return Boolean(win?.desktopCashier?.offlineFirst === true);
}
