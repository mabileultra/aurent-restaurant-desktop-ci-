/** Fallback estimates when DOM measure is unavailable (tests / first paint). */
export function estimatePosCatalogColumns(widthPx) {
  const w = Number(widthPx) || 0;
  if (w <= 0) return 1;
  // Align with pos-screen density defaults (≈96px min, gap 4).
  let minCol = 96;
  if (w >= 720) minCol = 100;
  else if (w >= 560) minCol = 96;
  else if (w >= 420) minCol = 92;
  const gap = 4;
  return Math.max(1, Math.floor((w + gap) / (minCol + gap)));
}

export const POS_CATALOG_GRID_ROW_HEIGHT = 64;
export const POS_CATALOG_LIST_ROW_HEIGHT = 48;
export const POS_CATALOG_VIRTUAL_OVERSCAN_ROWS = 4;

export function posCatalogRowHeight(viewMode) {
  return viewMode === 'list' ? POS_CATALOG_LIST_ROW_HEIGHT : POS_CATALOG_GRID_ROW_HEIGHT;
}

export function posCatalogColumnCount(viewMode, widthPx) {
  return viewMode === 'list' ? 1 : estimatePosCatalogColumns(widthPx);
}
