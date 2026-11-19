export const ADMIN_THEME_STORAGE_KEY = 'app-admin-theme';

/**
 * Synchronizes document root for light-only Pharma Green UI.
 */
export function syncRootTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ADMIN_THEME_STORAGE_KEY);
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
  root.style.backgroundColor = '#F6FAF7';
  if (document.body) {
    document.body.style.backgroundColor = '#F6FAF7';
    document.body.style.color = '#14291D';
  }
}

/**
 * Light-only public / login theme sync.
 */
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
  root.style.backgroundColor = '#F6FAF7';
  if (document.body) {
    document.body.style.backgroundColor = '#F6FAF7';
    document.body.style.color = '#14291D';
  }
}
