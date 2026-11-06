import { afterEach, describe, expect, it } from 'vitest';
import { isOfflineFirstDesktop } from './offlineFirstFlag';
import {
  resolveOfflineCheckoutTimeoutMs,
  resolveOnlineCatalogTimeoutMs,
  resolveOnlineSaleTimeoutMs,
  OFFLINE_FIRST_ONLINE_SALE_TIMEOUT_MS,
  OFFLINE_FIRST_CHECKOUT_TIMEOUT_MS,
  DEFAULT_OFFLINE_CHECKOUT_TIMEOUT_MS,
} from '../pos/posCheckoutTimeouts';
import { POS_CATALOG_ONLINE_TIMEOUT_MS } from './posCatalogConstants';

function desktopWindow() {
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {};
  }
  return globalThis.window;
}

describe('offlineFirst desktop timeouts', () => {
  afterEach(() => {
    const win = globalThis.window;
    if (win) delete win.desktopCashier;
  });

  it('is off without desktop flag', () => {
    expect(isOfflineFirstDesktop()).toBe(false);
    expect(resolveOnlineSaleTimeoutMs()).toBeUndefined();
    expect(resolveOnlineCatalogTimeoutMs()).toBe(POS_CATALOG_ONLINE_TIMEOUT_MS);
    expect(resolveOfflineCheckoutTimeoutMs()).toBe(DEFAULT_OFFLINE_CHECKOUT_TIMEOUT_MS);
  });

  it('shortens sale timeout when Electron offlineFirst is on', () => {
    desktopWindow().desktopCashier = {
      isDesktop: true,
      offlineFirst: true,
      offlineGetStatus: () => Promise.resolve({}),
    };
    expect(isOfflineFirstDesktop()).toBe(true);
    expect(resolveOnlineSaleTimeoutMs()).toBe(OFFLINE_FIRST_ONLINE_SALE_TIMEOUT_MS);
    expect(resolveOnlineCatalogTimeoutMs()).toBe(OFFLINE_FIRST_ONLINE_SALE_TIMEOUT_MS);
    expect(resolveOfflineCheckoutTimeoutMs()).toBe(OFFLINE_FIRST_CHECKOUT_TIMEOUT_MS);
  });
});
