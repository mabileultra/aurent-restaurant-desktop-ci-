import { normalizeBusinessTypeCode } from '../features/platform/utils/moduleAccessByBusinessType';

/** Компания живёт в Restaurant OS, не в платформенном AppShell. */
export function isRestaurantWorldBusiness(code) {
  const type = normalizeBusinessTypeCode(code);
  return type === 'RESTAURANT' || type === 'CANTEEN';
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
  return '/dashboard';
}
