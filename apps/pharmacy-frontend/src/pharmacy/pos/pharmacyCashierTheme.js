import { writeCashierTheme } from '../../utils/cashierTheme';

/** Separate from grocery `pos-cashier-theme` so dark grocery does not paint pharmacy table. */
export const PHARMACY_CASHIER_THEME_KEY = 'pos-pharmacy-cashier-theme';

/** @typedef {'dark' | 'light'} CashierTheme */

/** Pharmacy TZ milk layout — light by default. */
export function readPharmacyCashierTheme() {
  try {
    const v = localStorage.getItem(PHARMACY_CASHIER_THEME_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return 'light';
}

/** @param {CashierTheme} theme */
export function writePharmacyCashierTheme(theme) {
  try {
    localStorage.setItem(PHARMACY_CASHIER_THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  writeCashierTheme(theme);
}
