import { beforeEach, describe, expect, it, vi } from 'vitest';

// Setup node-compatible mocks for document and localStorage
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
    it('returns light by default when localStorage is empty', () => {
      expect(readAdminTheme()).toBe('light');
    });

    it('returns saved value from localStorage', () => {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'dark');
      expect(readAdminTheme()).toBe('dark');

      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'system');
      expect(readAdminTheme()).toBe('system');
    });

    it('ignores invalid values and falls back to light', () => {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'invalid-theme');
      expect(readAdminTheme()).toBe('light');
    });
  });

  describe('resolveEffectiveAdminTheme', () => {
    it('resolves light and dark directly', () => {
      expect(resolveEffectiveAdminTheme('light')).toBe('light');
      expect(resolveEffectiveAdminTheme('dark')).toBe('dark');
    });

    it('resolves system theme based on matchMedia', () => {
      // Mock matchMedia returning false for dark
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark') ? false : true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      expect(resolveEffectiveAdminTheme('system')).toBe('light');

      // Mock matchMedia returning true for dark
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark') ? true : false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      expect(resolveEffectiveAdminTheme('system')).toBe('dark');
    });
  });

  describe('syncRootTheme', () => {
    it('applies light theme to documentElement', () => {
      syncRootTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('app-theme--admin')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('applies dark theme to documentElement', () => {
      syncRootTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('app-theme--admin')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });
  });

  describe('useAdminThemeStore', () => {
    it('updates theme in store and localStorage', () => {
      useAdminThemeStore.getState().setTheme('dark');
      expect(useAdminThemeStore.getState().theme).toBe('dark');
      expect(useAdminThemeStore.getState().effectiveTheme).toBe('dark');
      expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      useAdminThemeStore.getState().setTheme('light');
      expect(useAdminThemeStore.getState().theme).toBe('light');
      expect(useAdminThemeStore.getState().effectiveTheme).toBe('light');
      expect(localStorage.getItem(ADMIN_THEME_STORAGE_KEY)).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('toggles theme between light and dark', () => {
      useAdminThemeStore.getState().setTheme('light');
      useAdminThemeStore.getState().toggleTheme();
      expect(useAdminThemeStore.getState().theme).toBe('dark');

      useAdminThemeStore.getState().toggleTheme();
      expect(useAdminThemeStore.getState().theme).toBe('light');
    });
  });

  describe('syncRestaurantTheme & syncPublicTheme', () => {
    it('syncRestaurantTheme applies rst-theme and dark', () => {
      syncRestaurantTheme();
      expect(document.documentElement.classList.contains('rst-theme')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('syncPublicTheme applies app-theme--public and light', () => {
      syncPublicTheme();
      expect(document.documentElement.classList.contains('app-theme--public')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });
  });
});
