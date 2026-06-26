/**
 * Конфигурация формы каталога на основе business-config (без legacy-шаблонов).
 */

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

export function resolveCatalogSectionVisible(section, { productType }) {
  switch (section) {
    case 'tasnif':
      return productType === 'RETAIL';
    case 'typeSelectors':
      return true;
    case 'construction':
    case 'clothing':
    case 'pharmacy':
    case 'advancedUnits':
      return false;
    case 'retailFlags':
      return productType === 'RETAIL';
    case 'ownerVat':
    case 'accounting':
    case 'storePrices':
    case 'barcodes':
      return true;
    default:
      return false;
  }
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
