/** Local punch counters — popular dishes float to the top of POS menu. */

const KEY_PREFIX = 'rst-menu-punch';

function storageKey(storeId) {
  return storeId != null ? `${KEY_PREFIX}:${storeId}` : KEY_PREFIX;
}

export function readMenuPunchMap(storeId) {
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function familyPunchScore(family, punchMap) {
  if (!family) return 0;
  let score = Number(punchMap?.[String(family.key)]) || 0;
  for (const variant of family.variants ?? []) {
    score += Number(punchMap?.[String(variant.id)]) || 0;
  }
  return score;
}

export function recordMenuPunch(storeId, familyOrItemKey, qty = 1) {
  if (familyOrItemKey == null) return;
  const key = String(familyOrItemKey);
  const bump = Math.max(1, Number(qty) || 1);
  try {
    const map = readMenuPunchMap(storeId);
    map[key] = (Number(map[key]) || 0) + bump;
    localStorage.setItem(storageKey(storeId), JSON.stringify(map));
  } catch {
    // ignore quota / private mode
  }
}
