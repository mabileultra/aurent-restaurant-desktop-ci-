import { normalizeBusinessTypeCode } from './moduleAccessByBusinessType';

/** Все роли, которые может выдать суперадмин компании (не platform-staff). */
export const PLATFORM_COMPANY_ROLES = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'WAITER',
  'COURIER',
  'COOK',
  'ACCOUNTANT',
];

/** Роли мира ресторана / столовой. */
export const RESTAURANT_WORLD_ROLES = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'WAITER',
  'COOK',
];

/** Розница / grocery / universal без зала. */
export const RETAIL_WORLD_ROLES = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'COURIER',
  'ACCOUNTANT',
];

/** Аптека — без официанта / повара / курьера зала. */
export const PHARMACY_WORLD_ROLES = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'ACCOUNTANT',
];

const RESTAURANT_TYPES = new Set(['RESTAURANT', 'CANTEEN']);

/**
 * Список ролей для типа бизнеса. Пустой / UNIVERSAL / OTHER — полный список.
 */
export function rolesForBusinessType(businessTypeCode) {
  const type = normalizeBusinessTypeCode(businessTypeCode);
  if (!type || type === 'UNIVERSAL' || type === 'OTHER') {
    return [...PLATFORM_COMPANY_ROLES];
  }
  if (RESTAURANT_TYPES.has(type)) {
    return [...RESTAURANT_WORLD_ROLES];
  }
  if (type === 'PHARMACY') {
    return [...PHARMACY_WORLD_ROLES];
  }
  return [...RETAIL_WORLD_ROLES];
}

export function isRoleAllowedForBusinessType(role, businessTypeCode) {
  if (!role) return false;
  const type = normalizeBusinessTypeCode(businessTypeCode);
  if (!type || type === 'UNIVERSAL' || type === 'OTHER') return true;
  return rolesForBusinessType(type).includes(String(role).toUpperCase());
}

/**
 * Роли для формы: явный allow-list → тип выбранной компании → фильтр чипа → дефолт платформы/тенанта.
 */
export function resolveUserFormRoles({
  allowedRoles,
  isPlatform,
  companyBusinessType,
  filterBusinessType,
} = {}) {
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    return allowedRoles.map((r) => String(r).toUpperCase());
  }
  if (!isPlatform) {
    return ['MANAGER', 'CASHIER', 'WAITER', 'COURIER', 'COOK', 'ACCOUNTANT'];
  }
  const fromCompany = normalizeBusinessTypeCode(companyBusinessType);
  if (fromCompany && fromCompany !== 'UNIVERSAL' && fromCompany !== 'OTHER') {
    return rolesForBusinessType(fromCompany);
  }
  const fromFilter = normalizeBusinessTypeCode(filterBusinessType);
  if (fromFilter && fromFilter !== 'UNIVERSAL' && fromFilter !== 'OTHER') {
    return rolesForBusinessType(fromFilter);
  }
  return [...PLATFORM_COMPANY_ROLES];
}
