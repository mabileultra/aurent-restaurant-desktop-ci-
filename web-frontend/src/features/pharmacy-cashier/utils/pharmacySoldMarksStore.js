import { markingIdentityKeys } from './pharmacyMarkIdentity';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

const STORAGE_PREFIX = 'pharmacy-sold-marks:v1';
const memoryFallback = new Map();

function storageKey(storeId) {
  return `${STORAGE_PREFIX}:${storeId == null || storeId === '' ? 'unknown' : String(storeId)}`;
}

function canUseLocalStorage() {
  try {
    return typeof localStorage !== 'undefined' && localStorage != null;
  } catch {
    return false;
  }
}

function readSet(storeId) {
  const key = storageKey(storeId);
  if (canUseLocalStorage()) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr.filter(Boolean) : []);
    } catch {
      return new Set(memoryFallback.get(key) || []);
    }
  }
  return new Set(memoryFallback.get(key) || []);
}

function writeSet(storeId, set) {
  const key = storageKey(storeId);
  const arr = [...set];
  memoryFallback.set(key, arr);
  if (!canUseLocalStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // quota / private mode — касса всё равно проверит на сервере
  }
}

/** КМ уже продавали на этой кассе (после успешного чека). */
export function isPharmacyMarkSoldLocally(storeId, rawMark) {
  const keys = markingIdentityKeys(preserveMarkingCodeForFiscal(rawMark));
  if (keys.length === 0) return false;
  const sold = readSet(storeId);
  return keys.some((k) => sold.has(k));
}

/** Запомнить КМ после успешной продажи — повторный скан сразу блокируется. */
export function rememberPharmacySoldMarks(storeId, rawMarks) {
  const list = Array.isArray(rawMarks) ? rawMarks : [];
  if (!storeId || list.length === 0) return;
  const sold = readSet(storeId);
  for (const raw of list) {
    markingIdentityKeys(preserveMarkingCodeForFiscal(raw)).forEach((k) => sold.add(k));
  }
  writeSet(storeId, sold);
}

export function collectMarksFromCartItems(items) {
  const out = [];
  for (const line of items || []) {
    if (Array.isArray(line?.productMarks) && line.productMarks.some(Boolean)) {
      line.productMarks.filter(Boolean).forEach((m) => out.push(m));
    } else if (line?.productMark || line?.markCode) {
      out.push(line.productMark || line.markCode);
    }
  }
  return out;
}

/** Сбросить локальный sold-кэш магазина (после возврата). */
export function clearPharmacySoldMarks(storeId) {
  const key = storageKey(storeId);
  memoryFallback.delete(key);
  if (canUseLocalStorage()) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

/** @deprecated use clearPharmacySoldMarks */
export function clearPharmacySoldMarksForTests(storeId) {
  clearPharmacySoldMarks(storeId);
}
