import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

/**
 * Куда вести кассу после PIN / из /cashier index.
 * WAITER всегда зал. CASHIER — по типу магазина/компании.
 */
export function resolveCashierPostLoginPath(role, businessType) {
  if (role === 'WAITER') return '/rst/pos';
  if (role === 'COOK') return '/rst/kitchen';

  const type = normalizeBusinessTypeCode(businessType);
  if (type === 'RESTAURANT' || type === 'CANTEEN') return '/rst/pos';
  if (type === 'PHARMACY') return '/pharm/pos';
  return '/cashier/pos';
}

export function isRestaurantCashierPath(path) {
  const p = String(path || '');
  return p === '/rst' || p.startsWith('/rst/');
}
