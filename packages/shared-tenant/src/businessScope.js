import {
  BUSINESS_TYPE,
  isPharmacyBusinessType,
  isRestaurantBusinessType,
  normalizeBusinessType,
} from '@aurent/shared-types';

export {
  BUSINESS_TYPE,
  isPharmacyBusinessType,
  isRestaurantBusinessType,
  normalizeBusinessType,
};

/** True when company default / store profile is pharmacy vertical. */
export function isPharmacyTenant(profileOrCode) {
  if (profileOrCode && typeof profileOrCode === 'object') {
    return isPharmacyBusinessType(
      profileOrCode.businessTypeCode
        || profileOrCode.defaultTypeCode
        || profileOrCode.businessType
        || profileOrCode.typeCode,
    );
  }
  return isPharmacyBusinessType(profileOrCode);
}
