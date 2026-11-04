import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';
import { isPharmPosPath, PHARM_POS_PATH } from '../pharmacy/app/pharmacyPaths';

/** Полноэкранный режим кассы (как /cashier/pos): без вторичной шапки и внешнего bottom-nav. */
export function isCashierRegisterScreen(pathname) {
  return (
    pathname.startsWith('/cashier/pos')
    || pathname.startsWith('/cashier/restaurant')
    || isPharmPosPath(pathname)
  );
}

export function resolveCashierRegisterPath(businessType) {
  const type = normalizeBusinessTypeCode(businessType);
  // Restaurant registers live on r-aurent; /rst on aurent is the opaque retired stub.
  if (type === 'RESTAURANT' || type === 'CANTEEN') return '/rst/pos';
  if (type === 'PHARMACY') return PHARM_POS_PATH;
  return '/cashier/pos';
}
