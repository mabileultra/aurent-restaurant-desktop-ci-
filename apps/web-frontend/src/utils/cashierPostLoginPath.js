import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

/**
 * Куда вести кассу после PIN / из /cashier index на aurent.
 * Аптека — только новый pharmacy-desktop / p-aurent (на main SPA force-update).
 */
export function resolveCashierPostLoginPath(role, businessType) {
  if (role === 'WAITER' || role === 'COOK') return '/cashier';

  const type = normalizeBusinessTypeCode(businessType);
  if (type === 'PHARMACY') return '/cashier/pos';
  return '/cashier/pos';
}

export function isRestaurantCashierPath(path) {
  const p = String(path || '');
  return p === '/rst' || p.startsWith('/rst/');
}
