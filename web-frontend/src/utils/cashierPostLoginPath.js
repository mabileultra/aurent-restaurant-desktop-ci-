import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

/**
 * Куда вести кассу после PIN / из /cashier index на aurent.
 * Restaurant floor belongs on r-aurent — main SPA stays on /cashier|pharm.
 */
export function resolveCashierPostLoginPath(role, businessType) {
  if (role === 'WAITER' || role === 'COOK') return '/cashier';

  const type = normalizeBusinessTypeCode(businessType);
  if (type === 'PHARMACY') return '/pharm/pos';
  return '/cashier/pos';
}

export function isRestaurantCashierPath(path) {
  const p = String(path || '');
  return p === '/rst' || p.startsWith('/rst/');
}
