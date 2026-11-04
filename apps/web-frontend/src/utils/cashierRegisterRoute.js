import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

/** Полноэкранный режим кассы (как /cashier/pos): без вторичной шапки и внешнего bottom-nav. */
export function isCashierRegisterScreen(pathname) {
  return (
    pathname.startsWith('/cashier/pos')
    || pathname.startsWith('/cashier/restaurant')
  );
}

export function resolveCashierRegisterPath(businessType) {
  const type = normalizeBusinessTypeCode(businessType);
  // Restaurant registers live on r-aurent; /rst on aurent is the opaque retired stub.
  if (type === 'RESTAURANT' || type === 'CANTEEN') return '/rst/pos';
  return '/cashier/pos';
}
