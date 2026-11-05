import { create } from 'zustand';

export const ADMIN_THEME_STORAGE_KEY = 'app-admin-theme';

/** @typedef {'light'} AdminThemePreference */
/** @typedef {'light'} EffectiveTheme */

/**
 * Admin shell is light-only (no dark/system toggle).
 * Clears legacy dark preference from storage.
 * @returns {AdminThemePreference}
 */
export function readAdminTheme() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage != null) {
      const val = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
      if (val === 'dark' || val === 'system') {
        localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'light');
      }
    }
  } catch {
    /* ignore */
  }
  return 'light';
}

/**
 * @param {string} [_pref]
 * @returns {EffectiveTheme}
 */
export function resolveEffectiveAdminTheme(_pref) {
  return 'light';
}

/**
 * Synchronizes document root for admin shell — always light.
 * @param {string} [_pref]
 */
export function syncRootTheme(_pref) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'light');
    }
  } catch {
    /* ignore */
  }

  root.classList.remove(
    'dark',
    'rst-theme',
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--public',
  );
  root.classList.add('app-theme--admin');
  root.style.colorScheme = 'light';
  root.style.backgroundColor = '#f1f5f9';
  if (document.body) {
    document.body.style.backgroundColor = '#f1f5f9';
    document.body.style.color = '#0f172a';
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#f1f5f9');
  }
}

/**
 * Kept for compatibility; admin theme is fixed to light.
 */
export const useAdminThemeStore = create((set) => ({
  theme: 'light',
  effectiveTheme: 'light',
  setTheme: () => {
    try {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, 'light');
    } catch {
      /* ignore */
    }
    set({ theme: 'light', effectiveTheme: 'light' });
    syncRootTheme('light');
  },
  toggleTheme: () => {
    /* no-op: admin is light-only */
  },
}));

/** Restaurant OS — тёмная оболочка + Tailwind dark: для встроенных Aurent UI. */
export function syncRestaurantTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--public',
    'app-theme--admin',
  );
  root.classList.add('dark', 'rst-theme');
  root.style.colorScheme = 'dark';
  root.style.backgroundColor = '#121418';
  if (document.body) {
    document.body.style.backgroundColor = '#121418';
    document.body.style.color = '#f3efe6';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#121418');
  }
}

/** Лендинг / login — светлая тема с зелёным акцентом. */
export function syncPublicTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'dark',
    'rst-theme',
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--admin',
  );
  root.classList.add('app-theme--public');
  root.style.colorScheme = 'light';
  root.style.backgroundColor = '#f2f7f4';
  if (document.body) {
    document.body.style.backgroundColor = '#f2f7f4';
    document.body.style.color = '#0f2419';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#f2f7f4');
  }
}
