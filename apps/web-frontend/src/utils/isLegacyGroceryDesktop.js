import { isDesktopCashier } from './authLogin';

/** Старый grocery Electron (не pharmacy-desktop и не restaurant). */
export function isLegacyGroceryDesktop() {
  if (typeof window === 'undefined' || !isDesktopCashier()) return false;
  const product = String(window.desktopCashier?.product || '').toLowerCase();
  if (product === 'pharmacy' || product === 'restaurant') return false;
  if (window.aurentRestaurant) return false;
  return true;
}
