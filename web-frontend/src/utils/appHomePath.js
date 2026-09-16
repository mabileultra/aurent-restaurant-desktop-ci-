import { normalizeBusinessTypeCode } from '../features/platform/utils/moduleAccessByBusinessType';
import { PHARM_STOCK_PATHS } from '../pharmacy/app/pharmacyPaths';

/** Компания живёт в Restaurant OS, не в платформенном AppShell. */
export function isRestaurantWorldBusiness(code) {
  const type = normalizeBusinessTypeCode(code);
  return type === 'RESTAURANT' || type === 'CANTEEN';
}

export function isPharmacyWorldBusiness(code) {
  return normalizeBusinessTypeCode(code) === 'PHARMACY';
}

/**
 * Домашний маршрут после входа.
 * @param {string|undefined} role
 * @param {string|undefined} businessType — defaultTypeCode компании
 */
export function resolveAppHomePath(role, businessType) {
  if (role === 'SUPER_ADMIN') return '/platform';
  if (role === 'CASHIER') return '/cashier';
  if (role === 'WAITER') return '/rst/pos';
  if (role === 'COOK') return '/rst/kitchen';
  if (role === 'ACCOUNTANT') return '/finance/dashboard';
  if (isRestaurantWorldBusiness(businessType) && (role === 'ADMIN' || role === 'MANAGER')) {
    return '/rst/admin/dashboard';
  }
  if (isPharmacyWorldBusiness(businessType) && (role === 'ADMIN' || role === 'MANAGER')) {
    return PHARM_STOCK_PATHS.products;
  }
  return '/dashboard';
}
