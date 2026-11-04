import { isPlatformUser } from './platformRoles';
import { normalizeBusinessTypeCode } from '../features/platform/utils/moduleAccessByBusinessType';

/** Компания живёт в Restaurant OS, не в платформенном AppShell. */
export function isRestaurantWorldBusiness(code) {
  const type = normalizeBusinessTypeCode(code);
  return type === 'RESTAURANT' || type === 'CANTEEN';
}

export function isPharmacyWorldBusiness(code) {
  return normalizeBusinessTypeCode(code) === 'PHARMACY';
}

/**
 * Домашний маршрут после входа на aurent (main SPA).
 * Аптека: /cashier/pos + force-update на старом desktop (UI аптеки — p-aurent).
 */
export function resolveAppHomePath(role, businessType) {
  if (isPlatformUser(role)) return '/platform';
  if (role === 'CASHIER') return '/cashier/pos';
  if (role === 'WAITER' || role === 'COOK') return '/dashboard';
  if (role === 'ACCOUNTANT') return '/finance/dashboard';
  return '/dashboard';
}
