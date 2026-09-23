import { isPlatformUser } from './platformRoles';
import { normalizeBusinessTypeCode } from '../features/platform/utils/moduleAccessByBusinessType';
import { PHARM_POS_PATH, PHARM_STOCK_PATHS } from '../pharmacy/app/pharmacyPaths';

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
 * Restaurant-only / floor roles are denied by evaluateMainAppAccess before navigate;
 * this helper must not emit retired /rst paths.
 * @param {string|undefined} role
 * @param {string|undefined} businessType — defaultTypeCode компании
 */
export function resolveAppHomePath(role, businessType) {
  if (isPlatformUser(role)) return '/platform';
  if (role === 'CASHIER') {
    // /cashier без хвоста конфликтует с public/cashier/ в nginx (403 на директории).
    if (isPharmacyWorldBusiness(businessType)) return PHARM_POS_PATH;
    return '/cashier/pos';
  }
  if (role === 'WAITER' || role === 'COOK') return '/dashboard';
  if (role === 'ACCOUNTANT') return '/finance/dashboard';
  if (isPharmacyWorldBusiness(businessType) && (role === 'ADMIN' || role === 'MANAGER')) {
    return PHARM_STOCK_PATHS.products;
  }
  return '/dashboard';
}
