import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  readRoleMobilePrefs,
  roleMobilePrefsKey,
  writeRoleMobilePrefs,
} from '../../../../src/restaurant/pos/pos-mobile/utils/roleMobilePrefs';

function installMemoryLocalStorage() {
  const map = new Map();
  globalThis.localStorage = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(k); },
    clear: () => { map.clear(); },
  };
}

describe('roleMobilePrefs', () => {
  beforeAll(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    localStorage.removeItem(roleMobilePrefsKey('cashier'));
    localStorage.removeItem(roleMobilePrefsKey('kitchen'));
  });

  it('keeps cashier and kitchen prefs separate', () => {
    writeRoleMobilePrefs('cashier', { forceMobile: true });
    expect(readRoleMobilePrefs('cashier').forceMobile).toBe(true);
    expect(readRoleMobilePrefs('kitchen').forceMobile).toBe(false);
  });

  it('persists forceMobile for kitchen', () => {
    expect(writeRoleMobilePrefs('kitchen', { forceMobile: true }).forceMobile).toBe(true);
    expect(readRoleMobilePrefs('kitchen').forceMobile).toBe(true);
  });
});
