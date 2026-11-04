const KEY_PREFIX = 'rst-menu-favorites';

function storageKey(storeId) {
  return storeId != null ? `${KEY_PREFIX}:${storeId}` : KEY_PREFIX;
}

export function readMenuFavorites(storeId) {
  try {
    const raw = localStorage.getItem(storageKey(storeId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeMenuFavorites(storeId, keys) {
  try {
    localStorage.setItem(storageKey(storeId), JSON.stringify([...new Set(keys.map(String))]));
  } catch {
    // ignore quota / private mode
  }
}

export function isMenuFavorite(storeId, familyKey) {
  if (familyKey == null) return false;
  return readMenuFavorites(storeId).includes(String(familyKey));
}

export function toggleMenuFavorite(storeId, familyKey) {
  const key = String(familyKey || '');
  if (!key) return false;
  const current = readMenuFavorites(storeId);
  const next = current.includes(key)
    ? current.filter((item) => item !== key)
    : [...current, key];
  writeMenuFavorites(storeId, next);
  return next.includes(key);
}
