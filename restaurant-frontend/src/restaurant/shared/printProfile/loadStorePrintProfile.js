import { rstKitchenApi } from '../../api/kitchen.api';
import { factoryPrintProfile } from './printProfileDefaults';

/** Short TTL: admin can save a logo while POS still has an empty profile in memory. */
const CACHE_TTL_MS = 5_000;
const BUST_KEY = 'rst-print-profile-bust';

/** @type {Map<string, { at: number, profile: object }>} */
const cache = new Map();

function bindBustListener() {
  if (typeof window === 'undefined' || bindBustListener.done) return;
  bindBustListener.done = true;
  window.addEventListener('storage', (event) => {
    if (event.key !== BUST_KEY || !event.newValue) return;
    try {
      const { storeId } = JSON.parse(event.newValue);
      if (storeId == null) cache.clear();
      else cache.delete(String(storeId));
    } catch {
      cache.clear();
    }
  });
}

export async function loadStorePrintProfile(storeId) {
  bindBustListener();
  if (storeId == null) return factoryPrintProfile();
  const key = String(storeId);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.profile;
  try {
    const res = await rstKitchenApi.getPrintProfile(storeId);
    const profile = res?.data?.profile || factoryPrintProfile();
    cache.set(key, { at: Date.now(), profile });
    return profile;
  } catch {
    // Do not cache failures — otherwise a transient error locks an empty logo forever.
    return factoryPrintProfile();
  }
}

export function invalidateStorePrintProfile(storeId) {
  if (storeId == null) cache.clear();
  else cache.delete(String(storeId));
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      BUST_KEY,
      JSON.stringify({ storeId: storeId ?? null, t: Date.now() }),
    );
  } catch {
    /* private mode / quota */
  }
}
