const STORAGE_PREFIX = 'pharmacy-draft-receipt:';

function storageKey(storeId) {
  return `${STORAGE_PREFIX}${storeId || 'default'}`;
}

/** Локальный номер черновика чека (сессия кассы), не фискальный. */
export function readPharmacyDraftReceiptNo(storeId) {
  try {
    const raw = sessionStorage.getItem(storageKey(storeId));
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  } catch {
    /* ignore */
  }
  return 1000;
}

export function writePharmacyDraftReceiptNo(storeId, value) {
  const n = Math.max(1, Math.floor(Number(value) || 1));
  try {
    sessionStorage.setItem(storageKey(storeId), String(n));
  } catch {
    /* ignore */
  }
  return n;
}

export function bumpPharmacyDraftReceiptNo(storeId) {
  return writePharmacyDraftReceiptNo(storeId, readPharmacyDraftReceiptNo(storeId) + 1);
}
