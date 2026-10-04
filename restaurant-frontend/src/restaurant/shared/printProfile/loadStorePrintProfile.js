import { rstKitchenApi } from '../../api/kitchen.api';
import { factoryPrintProfile } from './printProfileDefaults';

const cache = new Map();

export async function loadStorePrintProfile(storeId) {
  if (storeId == null) return factoryPrintProfile();
  const key = String(storeId);
  if (cache.has(key)) return cache.get(key);
  try {
    const res = await rstKitchenApi.getPrintProfile(storeId);
    const profile = res?.data?.profile || factoryPrintProfile();
    cache.set(key, profile);
    return profile;
  } catch {
    const fallback = factoryPrintProfile();
    cache.set(key, fallback);
    return fallback;
  }
}

export function invalidateStorePrintProfile(storeId) {
  if (storeId == null) cache.clear();
  else cache.delete(String(storeId));
}
