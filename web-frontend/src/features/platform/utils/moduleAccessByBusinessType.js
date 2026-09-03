/**
 * Какие модули доступа показывать для типа бизнеса компании.
 * Ресторанные модули — только для RESTAURANT / CANTEEN (и UNIVERSAL/OTHER).
 */
const RESTAURANT_MODULE_IDS = new Set([
  'restaurantFloor',
  'restaurantBooking',
  'restaurantDelivery',
  'restaurantKitchen',
  'restaurantPos',
]);

const RESTAURANT_BUSINESS_TYPES = new Set(['RESTAURANT', 'CANTEEN']);

export function normalizeBusinessTypeCode(code) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw || raw === 'RETAIL') return 'UNIVERSAL';
  return raw;
}

export function companyHasBusinessType(company, typeCode) {
  if (!typeCode) return true;
  if (!company) return false;
  const wanted = normalizeBusinessTypeCode(typeCode);
  const primary = normalizeBusinessTypeCode(company.businessType);
  if (primary === wanted) return true;
  const list = company.businessTypeCodes || company.businessTypes || [];
  if (Array.isArray(list)) {
    return list.some((item) => {
      const code = typeof item === 'string' ? item : item?.code;
      return normalizeBusinessTypeCode(code) === wanted;
    });
  }
  return false;
}

export function isModuleVisibleForBusinessType(moduleId, businessTypeCode) {
  const type = normalizeBusinessTypeCode(businessTypeCode);
  if (type === 'UNIVERSAL' || type === 'OTHER') return true;
  if (RESTAURANT_MODULE_IDS.has(moduleId)) {
    return RESTAURANT_BUSINESS_TYPES.has(type);
  }
  return true;
}

export function filterModulesForBusinessType(modules, businessTypeCode) {
  if (!Array.isArray(modules)) return [];
  return modules.filter((row) => isModuleVisibleForBusinessType(row?.id, businessTypeCode));
}
