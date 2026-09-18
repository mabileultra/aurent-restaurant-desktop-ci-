/**
 * Stable bottom-dock online/offline chip.
 * Ignores catalog sync / pending sales so the POS does not flash on probe ticks.
 */
export function resolveOfflineDockBadge({
  hasBridge,
  isDesktopShell,
  offlineAllowed,
  forceOfflineMode,
  networkOffline,
  hasCatalog,
}) {
  const notAllowed = !offlineAllowed && (networkOffline || forceOfflineMode);
  if (notAllowed || (isDesktopShell && !hasBridge)) {
    return { tone: 'warn', labelKey: 'offline.topbarDenied' };
  }
  if ((forceOfflineMode || networkOffline) && !hasCatalog) {
    return { tone: 'warn', labelKey: 'offline.topbarNoCatalog' };
  }
  if (forceOfflineMode || networkOffline) {
    return { tone: 'offline', labelKey: 'offline.topbarOffline' };
  }
  return { tone: 'ok', labelKey: 'offline.topbarOnline' };
}
