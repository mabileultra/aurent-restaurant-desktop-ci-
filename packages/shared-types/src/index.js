/**
 * @aurent/shared-types — cross-app constants / DTO-ish enums.
 * Vertical-only enums stay in the owning app.
 */
export {
  BUSINESS_TYPE,
  CATALOG_KIND,
  normalizeBusinessType,
  isPharmacyBusinessType,
  isRestaurantBusinessType,
} from './business.js';
export {
  FISCAL_PROVIDER,
  DEFAULT_FISCAL_PROVIDER,
  CARD_CATEGORY,
  OFD_CARD_TYPE_CODE,
  isFiscalDriveProvider,
} from './fiscal.js';
