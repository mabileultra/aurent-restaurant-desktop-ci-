/** Local daily punch counters — yesterday ranks POS menu; today only accumulates. */

const KEY_PREFIX = 'rst-menu-punch';
/** Min punches yesterday to float above catalog order. */
export const POPULAR_THRESHOLD = 5;
/** Keep a few recent day buckets; drop older. */
const KEEP_DAYS = 14;

function storageKey(storeId) {
  return storeId != null ? `${KEY_PREFIX}:${storeId}` : KEY_PREFIX;
}

/** Local calendar day YYYY-MM-DD. */
export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function previousLocalDayKey(date = new Date()) {
  const prev = new Date(date);
  prev.setDate(prev.getDate() - 1);
  return localDayKey(prev);
}

function isDayBucketMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (!keys.length) return true;
  return keys.every((key) => /^\d{4}-\d{2}-\d{2}$/.test(key)
    && value[key]
    && typeof value[key] === 'object'
    && !Array.isArray(value[key]));
}

/** Migrate legacy flat `{ id: count }` into today's bucket once. */
function normalizeStore(raw) {
  if (!raw || typeof raw !== 'object') return {};
  if (isDayBucketMap(raw)) return { ...raw };
  const today = localDayKey();
  const flat = {};
  for (const [key, value] of Object.entries(raw)) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) flat[key] = n;
  }
  return Object.keys(flat).length ? { [today]: flat } : {};
}

function pruneDays(store, keepDays = KEEP_DAYS) {
  const keys = Object.keys(store).filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort();
  if (keys.length <= keepDays) return store;
  const drop = new Set(keys.slice(0, keys.length - keepDays));
  const next = {};
  for (const [key, value] of Object.entries(store)) {
    if (!drop.has(key)) next[key] = value;
  }
  return next;
}

export function readMenuPunchStore(storeId) {
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (!raw) return {};
    return normalizeStore(JSON.parse(raw));
  } catch {
    return {};
  }
}

function writeMenuPunchStore(storeId, store) {
  try {
    localStorage.setItem(storageKey(storeId), JSON.stringify(pruneDays(store)));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Flat map used for ranking: punches from the previous local calendar day only.
 * Today's clicks never appear here until tomorrow.
 */
export function readMenuPunchMap(storeId, now = new Date()) {
  const store = readMenuPunchStore(storeId);
  const yesterday = store[previousLocalDayKey(now)];
  if (!yesterday || typeof yesterday !== 'object') return {};
  return { ...yesterday };
}

export function familyPunchScore(family, punchMap, threshold = POPULAR_THRESHOLD) {
  if (!family) return 0;
  let score = Number(punchMap?.[String(family.key)]) || 0;
  for (const variant of family.variants ?? []) {
    score += Number(punchMap?.[String(variant.id)]) || 0;
  }
  return score >= threshold ? score : 0;
}

export function recordMenuPunch(storeId, familyOrItemKey, qty = 1, now = new Date()) {
  if (familyOrItemKey == null) return;
  const key = String(familyOrItemKey);
  const bump = Math.max(1, Number(qty) || 1);
  const day = localDayKey(now);
  const store = readMenuPunchStore(storeId);
  const dayMap = { ...(store[day] || {}) };
  dayMap[key] = (Number(dayMap[key]) || 0) + bump;
  store[day] = dayMap;
  writeMenuPunchStore(storeId, store);
}
