import { create } from 'zustand';

export const ADMIN_THEME_STORAGE_KEY = 'app-admin-theme';

/** @typedef {'light' | 'dark' | 'system'} AdminThemePreference */
/** @typedef {'light' | 'dark'} EffectiveTheme */

/**
 * Reads admin theme preference from localStorage.
 * @returns {AdminThemePreference}
 */
export function readAdminTheme() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage != null) {
      const val = localStorage.getItem(ADMIN_THEME_STORAGE_KEY);
      if (val === 'light' || val === 'dark' || val === 'system') return val;
    }
  } catch {
    /* ignore */
  }
  return 'light';
}

/**
 * Resolves effective theme ('light' | 'dark') based on preference and system OS setting.
 * @param {AdminThemePreference} [pref]
 * @returns {EffectiveTheme}
 */
export function resolveEffectiveAdminTheme(pref) {
  const p = pref || readAdminTheme();
  if (p === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return p === 'dark' ? 'dark' : 'light';
}

/**
 * Synchronizes document root (<html> and <body>) with the chosen admin theme.
 * @param {AdminThemePreference} [pref]
 */
export function syncRootTheme(pref) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const effective = resolveEffectiveAdminTheme(pref);

  root.classList.remove(
    'rst-theme',
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--public',
  );
  root.classList.add('app-theme--admin');

  if (effective === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
    root.style.backgroundColor = '#0b1210';
    if (document.body) {
      document.body.style.backgroundColor = '#0b1210';
      document.body.style.color = '#f1f5f9';
    }
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
    root.style.backgroundColor = '#f1f5f9';
    if (document.body) {
      document.body.style.backgroundColor = '#f1f5f9';
      document.body.style.color = '#0f172a';
    }
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', effective === 'dark' ? '#0b1210' : '#f1f5f9');
  }
}

/**
 * Reactive Zustand store for Admin Theme preference.
 */
export const useAdminThemeStore = create((set, get) => ({
  theme: readAdminTheme(),
  effectiveTheme: resolveEffectiveAdminTheme(readAdminTheme()),
  setTheme: (nextTheme) => {
    if (nextTheme !== 'light' && nextTheme !== 'dark' && nextTheme !== 'system') return;
    try {
      localStorage.setItem(ADMIN_THEME_STORAGE_KEY, nextTheme);
    } catch {
      /* ignore */
    }
    const effective = resolveEffectiveAdminTheme(nextTheme);
    set({ theme: nextTheme, effectiveTheme: effective });
    syncRootTheme(nextTheme);
  },
  toggleTheme: () => {
    const current = get().theme;
    const effective = resolveEffectiveAdminTheme(current);
    const next = effective === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));

// Setup system media query listener once in browser
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    const current = useAdminThemeStore.getState().theme;
    if (current === 'system') {
      const effective = resolveEffectiveAdminTheme('system');
      useAdminThemeStore.setState({ effectiveTheme: effective });
      syncRootTheme('system');
    }
  };
  mql.addEventListener?.('change', handleSystemChange);
}

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
