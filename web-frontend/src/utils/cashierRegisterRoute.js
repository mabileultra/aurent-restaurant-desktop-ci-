import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

/** Полноэкранный режим кассы (как /cashier/pos): без вторичной шапки и внешнего bottom-nav. */
export function isCashierRegisterScreen(pathname) {
  return (
    pathname.startsWith('/cashier/pos')
    || pathname.startsWith('/cashier/restaurant')
    || pathname.startsWith('/cashier/pharmacy')
  );
}

export function resolveCashierRegisterPath(businessType) {
  const type = normalizeBusinessTypeCode(businessType);
  if (type === 'RESTAURANT' || type === 'CANTEEN') return '/rst/pos';
  if (type === 'PHARMACY') return '/cashier/pharmacy';
  return '/cashier/pos';
}
