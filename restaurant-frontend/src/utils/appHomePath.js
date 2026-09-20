/**
 * Home routes for restaurant SPA only (RESTAURANT / CANTEEN).
 * Pharmacy, retail cashier, finance, platform live on main app.
 */

export function isRestaurantWorldBusiness(code) {
  const type = String(code || '').trim().toUpperCase();
  return type === 'RESTAURANT' || type === 'CANTEEN';
}

/**
 * @param {string|undefined} role
 * @param {string|undefined} businessType — defaultTypeCode компании
 */
export function resolveAppHomePath(role, businessType) {
  if (role === 'COOK') return '/rst/kitchen';
  if (role === 'WAITER' || role === 'CASHIER') return '/rst/pos';
  if (role === 'ADMIN' || role === 'MANAGER') {
    return isRestaurantWorldBusiness(businessType) || !businessType
      ? '/rst/admin/dashboard'
      : '/rst/pos';
  }
  return '/rst/pos';
}
