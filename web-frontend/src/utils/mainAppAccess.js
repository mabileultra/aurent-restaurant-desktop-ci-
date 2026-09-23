import { normalizeBusinessTypeCode } from '../features/platform/utils/moduleAccessByBusinessType';
import { isPlatformUser } from './platformRoles';
import { isRestaurantWorldBusiness } from './appHomePath';

/** Pure restaurant companies belong on r-aurent — not on aurent.uz. */
export function companyFitsMainApp(businessPayload) {
  // Fail closed when types are unknown (API error / missing payload).
  if (businessPayload == null) return false;

  const def = normalizeBusinessTypeCode(businessPayload?.defaultTypeCode);
  const codes = (businessPayload?.types || [])
    .map((item) => normalizeBusinessTypeCode(item?.code))
    .filter(Boolean);

  if (codes.length > 0) {
    return !codes.every((code) => isRestaurantWorldBusiness(code));
  }
  return !isRestaurantWorldBusiness(def);
}

/** Floor roles always belong on the restaurant SPA. */
export function roleRequiresRestaurantApp(role) {
  const r = String(role || '').toUpperCase();
  return r === 'WAITER' || r === 'COOK';
}

/**
 * @returns {{ ok: true } | { ok: false, reason: 'restaurant_only' | 'restaurant_role' }}
 */
export function evaluateMainAppAccess({ role, businessPayload }) {
  if (isPlatformUser(role)) return { ok: true };
  if (roleRequiresRestaurantApp(role)) return { ok: false, reason: 'restaurant_role' };
  if (!companyFitsMainApp(businessPayload)) return { ok: false, reason: 'restaurant_only' };
  return { ok: true };
}
