/** Session barcode → product hits (same store). Survives rapid re-scans without API. */
const hits = new Map();

function key(storeId, code) {
  return `${storeId}:${String(code || '').trim()}`;
}

export function getPosBarcodeHit(storeId, code) {
  if (storeId == null || !code) return null;
  return hits.get(key(storeId, code)) ?? null;
}

export function setPosBarcodeHit(storeId, code, product) {
  if (storeId == null || !code || !product) return;
  hits.set(key(storeId, code), product);
}

/** Remember every candidate form that resolved to this card. */
export function rememberPosBarcodeHit(storeId, codes, product) {
  if (!product) return;
  for (const code of codes) {
    if (code) setPosBarcodeHit(storeId, code, product);
  }
}

export function clearPosBarcodeHitCache() {
  hits.clear();
}
