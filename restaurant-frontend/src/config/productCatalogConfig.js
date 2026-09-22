/**
 * Конфигурация формы каталога на основе business-config (без legacy-шаблонов).
 */

import { isCatalogFormSectionEnabled } from './productCatalogFormFields';

export const UNIVERSAL_BUSINESS_TYPE = 'UNIVERSAL';

export function normalizeBusinessTypeCode(code) {
  if (!code || typeof code !== 'string') return UNIVERSAL_BUSINESS_TYPE;
  const normalized = code.trim().toUpperCase();
  if (normalized === 'RETAIL') return UNIVERSAL_BUSINESS_TYPE;
  return normalized || UNIVERSAL_BUSINESS_TYPE;
}

export function resolveBusinessTypeForTemplates(code) {
  return normalizeBusinessTypeCode(code);
}

export function isUniversalBusinessType(code) {
  const normalized = normalizeBusinessTypeCode(code);
  return normalized === UNIVERSAL_BUSINESS_TYPE || normalized === 'OTHER';
}

export function defaultProductTypeForBusinessType(code) {
  const type = normalizeBusinessTypeCode(code);
  if (type === 'CONSTRUCTION') return 'MATERIAL';
  if (type === 'CANTEEN' || type === 'RESTAURANT') return 'DISH';
  return 'RETAIL';
}

export function applyBusinessConfigDefaults(businessConfig) {
  if (!businessConfig) return {};
  const defaultUnit = businessConfig.units?.find((unit) => unit.defaultUnit)?.code ?? 'PCS';
  const rules = Object.fromEntries(
    (businessConfig.rules ?? []).map((rule) => [rule.ruleKey, rule.enabled])
  );
  return {
    productType: defaultProductTypeForBusinessType(businessConfig.businessTypeCode),
    saleType: rules['product.defaultWeightSale'] ? 'WEIGHT' : 'PIECE',
    unitCode: defaultUnit,
    allowFraction: Boolean(rules['product.allowFraction']),
  };
}

/** Короткая форма ингредиента в ресторанном складе (техкарты). */
export const CATALOG_PROFILE_RESTAURANT_INGREDIENT = 'restaurantIngredient';

export function resolveCatalogSectionVisible(section, { productType, catalogProfile, formSectionMap } = {}) {
  if (catalogProfile === CATALOG_PROFILE_RESTAURANT_INGREDIENT) {
    switch (section) {
      case 'typeSelectors':
      case 'accounting':
      case 'accountingCost':
      case 'accountingStock':
      case 'activeField':
      case 'tasnif':
      case 'tasnifSearch':
      case 'fiscalIkpu':
      case 'fiscalPackageCode':
      case 'barcodes':
        return true;
      default:
        return false;
    }
  }

  const fiscalOrTasnif = productType === 'RETAIL' || productType === 'MATERIAL';

  let base;
  switch (section) {
    case 'tasnif':
    case 'tasnifSearch':
    case 'fiscalExternalId':
    case 'fiscalIkpu':
    case 'fiscalUnitMeasure':
    case 'fiscalPackageCode':
      base = fiscalOrTasnif;
      break;
    case 'typeSelectors':
    case 'productTypeField':
    case 'skuField':
    case 'categoryField':
    case 'activeField':
    case 'ownerType':
    case 'vatField':
    case 'commissionTin':
    case 'commissionPinfl':
    case 'ownerVat':
    case 'accounting':
    case 'accountingCost':
    case 'accountingSell':
    case 'accountingDiscount':
    case 'accountingStock':
    case 'accountingLowStock':
    case 'accountingLocation':
    case 'descriptionField':
    case 'storePrices':
    case 'barcodes':
    case 'pluField':
    case 'extraBarcodes':
    case 'dynamicFields':
      base = true;
      break;
    case 'construction':
    case 'clothing':
    case 'pharmacy':
    case 'advancedUnits':
      base = false;
      break;
    case 'retailFlags':
      base = productType === 'RETAIL';
      break;
    default:
      base = false;
  }

  if (!base) return false;
  return isCatalogFormSectionEnabled(formSectionMap, section);
}

export function businessTypeLabelKey(code) {
  return `productTemplates.businessTypes.${normalizeBusinessTypeCode(code)}`;
}

/** pos.mode из business-config rules: RETAIL | TABLE */
export function posModeFromBusinessConfig(businessConfig) {
  const rules = Object.fromEntries(
    (businessConfig?.rules ?? []).map((rule) => [rule.ruleKey, rule.ruleValue])
  );
  return rules['pos.mode'] === 'TABLE' ? 'TABLE' : 'RETAIL';
}

export function productBusinessTypeLabel(t, product) {
  const code = product?.businessTypeCode;
  if (!code) return null;
  return t(businessTypeLabelKey(code), { defaultValue: code });
}
