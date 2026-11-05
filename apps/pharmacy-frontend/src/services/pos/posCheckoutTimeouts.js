import { POS_CATALOG_ONLINE_TIMEOUT_MS } from '../offline/posCatalogConstants';
import { isDesktopOfflineBridge } from '../offline/desktopOfflineBridge';
import { isOfflineFirstDesktop } from '../offline/offlineFirstFlag';

export const OFFLINE_FIRST_ONLINE_SALE_TIMEOUT_MS = 2_500;
export const DEFAULT_OFFLINE_CHECKOUT_TIMEOUT_MS = 10_000;
export const OFFLINE_FIRST_CHECKOUT_TIMEOUT_MS = 4_000;

export function resolveOnlineCatalogTimeoutMs() {
  if (isOfflineFirstDesktop()) return OFFLINE_FIRST_ONLINE_SALE_TIMEOUT_MS;
  return POS_CATALOG_ONLINE_TIMEOUT_MS;
}

export function resolveOnlineSaleTimeoutMs() {
  if (!isDesktopOfflineBridge()) return undefined;
  if (isOfflineFirstDesktop()) return OFFLINE_FIRST_ONLINE_SALE_TIMEOUT_MS;
  return POS_CATALOG_ONLINE_TIMEOUT_MS + 2_000;
}

export function resolveOfflineCheckoutTimeoutMs() {
  if (isOfflineFirstDesktop()) return OFFLINE_FIRST_CHECKOUT_TIMEOUT_MS;
  return DEFAULT_OFFLINE_CHECKOUT_TIMEOUT_MS;
}
