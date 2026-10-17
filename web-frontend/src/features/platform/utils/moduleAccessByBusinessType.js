/**
 * Какие модули суперадмин видит при выборе типа бизнеса.
 * UNIVERSAL / OTHER — полный список. Остальные типы не смешивают чужие миры.
 */
const RESTAURANT_MODULE_IDS = new Set([
  'restaurantFloor',
  'restaurantBooking',
  'restaurantDelivery',
  'restaurantKitchen',
  'restaurantPos',
  'restaurantRequestBill',
]);

const GROCERY_CATALOG_MODULE_IDS = new Set([
  'products',
  'categories',
  'scalesStation',
  'scalesPlu',
]);

const GROCERY_POS_MODULE_IDS = new Set(['cashierPos']);

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
  const id = String(moduleId || '');
  if (!type || type === 'UNIVERSAL' || type === 'OTHER') return true;

  if (type === 'PHARMACY') {
    return !RESTAURANT_MODULE_IDS.has(id) && !GROCERY_CATALOG_MODULE_IDS.has(id);
  }
  if (RESTAURANT_BUSINESS_TYPES.has(type)) {
    if (id === 'categories') return true;
    return !GROCERY_CATALOG_MODULE_IDS.has(id) && !GROCERY_POS_MODULE_IDS.has(id);
  }
  return !RESTAURANT_MODULE_IDS.has(id);
}

export function filterModulesForBusinessType(modules, businessTypeCode) {
  if (!Array.isArray(modules)) return [];
  return modules.filter((row) => isModuleVisibleForBusinessType(row?.id, businessTypeCode));
}
