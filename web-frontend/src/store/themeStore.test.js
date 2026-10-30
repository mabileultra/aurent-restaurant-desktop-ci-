import { beforeEach, describe, expect, it, vi } from 'vitest';

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

globalThis.localStorage = new LocalStorageMock();

if (!globalThis.document) {
  const classListSet = new Set();
  globalThis.document = {
    documentElement: {
      classList: {
        add: (...classes) => classes.forEach((c) => classListSet.add(c)),
        remove: (...classes) => classes.forEach((c) => classListSet.delete(c)),
        contains: (c) => classListSet.has(c),
      },
      style: {},
    },
    body: {
      style: {},
    },
    querySelector: () => ({
      setAttribute: vi.fn(),
    }),
  };
}

if (!globalThis.window) {
  globalThis.window = globalThis;
}

import {
  ADMIN_THEME_STORAGE_KEY,
  readAdminTheme,
  resolveEffectiveAdminTheme,
  syncPublicTheme,
  syncRestaurantTheme,
  syncRootTheme,
  useAdminThemeStore,
} from './themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove(
      'dark',
      'app-theme--admin',
      'rst-theme',
      'app-theme--public',
      'cashier-theme--light',
      'cashier-theme--dark',
      'app-theme--cashier'
    );
    document.documentElement.style.cssText = '';
  });

  describe('readAdminTheme', () => {
    it('returns light by default', () => {
      expect(readAdminTheme()).toBe('light');
    });

    it('migrates legacy dark/system to light', () => {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'dark');
      expect(readAdminTheme()).toBe('light');
      expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('light');
    });
  });

  describe('resolveEffectiveAdminTheme', () => {
    it('always resolves light', () => {
      expect(resolveEffectiveAdminTheme('light')).toBe('light');
      expect(resolveEffectiveAdminTheme('dark')).toBe('light');
      expect(resolveEffectiveAdminTheme('system')).toBe('light');
    });
  });

  describe('syncRootTheme', () => {
    it('applies light admin theme even if dark requested', () => {
      syncRootTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('app-theme--admin')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('light');
      expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('light');
    });
  });

  describe('useAdminThemeStore', () => {
    it('keeps light and ignores dark setTheme', () => {
      useAdminThemeStore.getState().setTheme('dark');
      expect(useAdminThemeStore.getState().theme).toBe('light');
      expect(useAdminThemeStore.getState().effectiveTheme).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('toggleTheme is no-op', () => {
      useAdminThemeStore.getState().setTheme('light');
      useAdminThemeStore.getState().toggleTheme();
      expect(useAdminThemeStore.getState().theme).toBe('light');
    });
  });

  describe('syncRestaurantTheme & syncPublicTheme', () => {
    it('syncRestaurantTheme applies rst-theme and dark', () => {
      syncRestaurantTheme();
      expect(document.documentElement.classList.contains('rst-theme')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('syncPublicTheme applies light public theme', () => {
      syncPublicTheme();
      expect(document.documentElement.classList.contains('app-theme--public')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });
});
