import { isPlatformUser } from './platformRoles';
import { isRestaurantWorldBusiness } from './appHomePath';

function normalize(code) {
  return String(code || '').trim().toUpperCase();
}

/** Company may use restaurant SPA if it has RESTAURANT/CANTEEN. */
export function companyFitsRestaurantApp(businessPayload) {
  const def = normalize(businessPayload?.defaultTypeCode);
  const codes = (businessPayload?.types || [])
    .map((item) => normalize(item?.code))
    .filter(Boolean);

  if (isRestaurantWorldBusiness(def)) return true;
  if (codes.some((code) => isRestaurantWorldBusiness(code))) return true;
  return false;
}

/**
 * @returns {{ ok: true } | { ok: false, reason: 'platform' | 'not_restaurant' }}
 */
export function evaluateRestaurantAppAccess({ role, businessPayload }) {
  if (isPlatformUser(role)) return { ok: false, reason: 'platform' };
  if (!companyFitsRestaurantApp(businessPayload)) {
    return { ok: false, reason: 'not_restaurant' };
  }
  return { ok: true };
}
