import { normalizeBusinessTypeCode } from '../features/platform/utils/moduleAccessByBusinessType';
import { isPharmacyBusinessType } from './isPharmacyBusinessType';

/** Компания целиком аптечная — бэк-офис только на p-aurent. */
export function isPharmacyOnlyCompany(businessPayload) {
  if (!businessPayload) return false;
  const def = normalizeBusinessTypeCode(businessPayload.defaultTypeCode);
  const codes = (businessPayload.types || [])
    .map((item) => normalizeBusinessTypeCode(item?.code))
    .filter(Boolean);
  if (codes.length > 0) {
    return codes.every((code) => isPharmacyBusinessType(code));
  }
  return isPharmacyBusinessType(def);
}

/** Офис аптеки на p-aurent: дефолт PHARMACY или в компании только аптека. */
export function companyUsesPharmacyOffice(businessPayload) {
  if (!businessPayload) return false;
  const def = normalizeBusinessTypeCode(businessPayload.defaultTypeCode);
  const codes = (businessPayload.types || [])
    .map((item) => normalizeBusinessTypeCode(item?.code))
    .filter(Boolean);
  if (isPharmacyBusinessType(def)) return true;
  return codes.length === 1 && isPharmacyBusinessType(codes[0]);
}
