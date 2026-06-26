import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

/** Полноэкранный режим кассы (как /cashier/pos): без вторичной шапки и внешнего bottom-nav. */
export function isCashierRegisterScreen(pathname) {
  return pathname.startsWith('/cashier/pos') || pathname.startsWith('/cashier/restaurant');
}

export function resolveCashierRegisterPath(businessType) {
  return normalizeBusinessTypeCode(businessType) === 'RESTAURANT'
    ? '/cashier/restaurant'
    : '/cashier/pos';
}
