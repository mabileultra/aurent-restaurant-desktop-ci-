import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  readWaiterMobilePrefs,
  WAITER_MOBILE_PREFS_KEY,
  writeWaiterMobilePrefs,
} from '../../../../src/restaurant/pos/waiter-mobile/utils/waiterMobilePrefs';

function installMemoryLocalStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => { map.clear(); },
  };
}

describe('waiterMobilePrefs', () => {
  beforeAll(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    localStorage.removeItem(WAITER_MOBILE_PREFS_KEY);
  });

  it('defaults fullscreen on and forceMobile off', () => {
    expect(readWaiterMobilePrefs()).toEqual({ fullscreen: true, forceMobile: false });
  });

  it('persists fullscreen off', () => {
    expect(writeWaiterMobilePrefs({ fullscreen: false })).toEqual({
      fullscreen: false,
      forceMobile: false,
    });
    expect(readWaiterMobilePrefs().fullscreen).toBe(false);
  });

  it('persists forceMobile on', () => {
    expect(writeWaiterMobilePrefs({ forceMobile: true }).forceMobile).toBe(true);
    expect(readWaiterMobilePrefs().forceMobile).toBe(true);
  });

  it('ignores corrupt storage', () => {
    localStorage.setItem(WAITER_MOBILE_PREFS_KEY, '{not-json');
    expect(readWaiterMobilePrefs().fullscreen).toBe(true);
  });
});
