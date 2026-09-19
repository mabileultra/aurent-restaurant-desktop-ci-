/**
 * Секции формы «Добавить товар», управляемые конструктором бизнеса.
 * Ключи ruleKey совпадают с бэкенд BusinessFormFieldCatalog.
 */

export const CATALOG_FORM_FIELD_PREFIX = 'catalog.form.';

export const CATALOG_FORM_FIELD_DEFS = [
  { ruleKey: 'catalog.form.tasnif', section: 'tasnif', labelKey: 'platform.businessTypes.formFieldTasnif' },
  { ruleKey: 'catalog.form.skuField', section: 'skuField', labelKey: 'platform.businessTypes.formFieldSku' },
  { ruleKey: 'catalog.form.categoryField', section: 'categoryField', labelKey: 'platform.businessTypes.formFieldCategory' },
  { ruleKey: 'catalog.form.typeSelectors', section: 'typeSelectors', labelKey: 'platform.businessTypes.formFieldTypeSelectors' },
  { ruleKey: 'catalog.form.productTypeField', section: 'productTypeField', labelKey: 'platform.businessTypes.formFieldProductType' },
  { ruleKey: 'catalog.form.retailFlags', section: 'retailFlags', labelKey: 'platform.businessTypes.formFieldRetailFlags' },
  { ruleKey: 'catalog.form.ownerVat', section: 'ownerVat', labelKey: 'platform.businessTypes.formFieldOwnerVat' },
  { ruleKey: 'catalog.form.accounting', section: 'accounting', labelKey: 'platform.businessTypes.formFieldAccounting' },
  { ruleKey: 'catalog.form.accountingCost', section: 'accountingCost', labelKey: 'platform.businessTypes.formFieldAccountingCost' },
  { ruleKey: 'catalog.form.accountingSell', section: 'accountingSell', labelKey: 'platform.businessTypes.formFieldAccountingSell' },
  { ruleKey: 'catalog.form.accountingDiscount', section: 'accountingDiscount', labelKey: 'platform.businessTypes.formFieldAccountingDiscount' },
  { ruleKey: 'catalog.form.accountingStock', section: 'accountingStock', labelKey: 'platform.businessTypes.formFieldAccountingStock' },
  { ruleKey: 'catalog.form.storePrices', section: 'storePrices', labelKey: 'platform.businessTypes.formFieldStorePrices' },
  { ruleKey: 'catalog.form.barcodes', section: 'barcodes', labelKey: 'platform.businessTypes.formFieldBarcodes' },
  { ruleKey: 'catalog.form.dynamicFields', section: 'dynamicFields', labelKey: 'platform.businessTypes.formFieldDynamic' },
];

/** @returns {Record<string, boolean>} section -> enabled */
export function formFieldsToSectionMap(formFields) {
  const map = {};
  for (const def of CATALOG_FORM_FIELD_DEFS) {
    map[def.section] = true;
  }
  if (!Array.isArray(formFields)) return map;
  for (const row of formFields) {
    const key = row?.ruleKey;
    if (!key || !key.startsWith(CATALOG_FORM_FIELD_PREFIX)) continue;
    const section = key.slice(CATALOG_FORM_FIELD_PREFIX.length);
    map[section] = row.enabled !== false;
  }
  return map;
}

export function isCatalogFormSectionEnabled(sectionMap, section) {
  if (!sectionMap || typeof sectionMap !== 'object') return true;
  if (!(section in sectionMap)) return true;
  return sectionMap[section] !== false;
}
