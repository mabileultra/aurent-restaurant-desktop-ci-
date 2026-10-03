/** Sync flags from Electron preload. Default false — remote r-aurent behavior. */

export function isOfflineFirstDesktop() {
  const win = typeof globalThis !== 'undefined' ? globalThis.window : undefined;
  const d = win?.desktopCashier;
  if (typeof d?.offlineFirstFlag === 'function') return Boolean(d.offlineFirstFlag());
  return Boolean(d?.offlineFirst === true);
}
