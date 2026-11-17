import { syncCashierDocumentPaint } from './cashierDocumentPaint';

export const CASHIER_THEME_STORAGE_KEY = 'pos-cashier-theme';

/** @returns {'light'} */
export function readCashierTheme() {
  try {
    localStorage.removeItem(CASHIER_THEME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return 'light';
}

export function cashierThemeClassName() {
  return 'cashier-app--light';
}

/** Light-only document classes for cashier portals. */
export function syncCashierThemeDocument() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('dark', 'cashier-theme--dark', 'app-theme--admin');
  root.classList.add('cashier-theme--light', 'app-theme--cashier');
  syncCashierDocumentPaint('light');
}

/** Clear cashier document classes when leaving /pos. */
export function clearCashierThemeDocument() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.remove(
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
  );
}
