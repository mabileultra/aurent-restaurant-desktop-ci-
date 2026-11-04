/**
 * Поля формы «Добавить товар» для конструктора бизнеса.
 * ruleKey совпадает с BusinessFormFieldCatalog на бэкенде.
 */

export const CATALOG_FORM_FIELD_PREFIX = 'catalog.form.';

/** @typedef {{ ruleKey: string, section: string, labelKey: string, group: string }} CatalogFormFieldDef */

export const CATALOG_FORM_FIELD_GROUPS = [
  { id: 'tasnif', titleKey: 'platform.businessTypes.formGroupTasnif' },
  { id: 'general', titleKey: 'platform.businessTypes.formGroupGeneral' },
  { id: 'owner', titleKey: 'platform.businessTypes.formGroupOwner' },
  { id: 'accounting', titleKey: 'platform.businessTypes.formGroupAccounting' },
  { id: 'prices', titleKey: 'platform.businessTypes.formGroupPrices' },
  { id: 'barcodes', titleKey: 'platform.businessTypes.formGroupBarcodes' },
  { id: 'extra', titleKey: 'platform.businessTypes.formGroupExtra' },
];

/** @type {CatalogFormFieldDef[]} */
export const CATALOG_FORM_FIELD_DEFS = [
  // Tasnif / фискал
  { ruleKey: 'catalog.form.tasnifSearch', section: 'tasnifSearch', labelKey: 'platform.businessTypes.formFieldTasnifSearch', group: 'tasnif' },
  { ruleKey: 'catalog.form.fiscalExternalId', section: 'fiscalExternalId', labelKey: 'platform.businessTypes.formFieldFiscalExternalId', group: 'tasnif' },
  { ruleKey: 'catalog.form.fiscalIkpu', section: 'fiscalIkpu', labelKey: 'platform.businessTypes.formFieldFiscalIkpu', group: 'tasnif' },
  { ruleKey: 'catalog.form.fiscalUnitMeasure', section: 'fiscalUnitMeasure', labelKey: 'platform.businessTypes.formFieldFiscalUnitMeasure', group: 'tasnif' },
  { ruleKey: 'catalog.form.fiscalPackageCode', section: 'fiscalPackageCode', labelKey: 'platform.businessTypes.formFieldFiscalPackageCode', group: 'tasnif' },

  // Основные
  { ruleKey: 'catalog.form.skuField', section: 'skuField', labelKey: 'platform.businessTypes.formFieldSku', group: 'general' },
  { ruleKey: 'catalog.form.categoryField', section: 'categoryField', labelKey: 'platform.businessTypes.formFieldCategory', group: 'general' },
  { ruleKey: 'catalog.form.descriptionField', section: 'descriptionField', labelKey: 'platform.businessTypes.formFieldDescription', group: 'general' },
  { ruleKey: 'catalog.form.typeSelectors', section: 'typeSelectors', labelKey: 'platform.businessTypes.formFieldTypeSelectors', group: 'general' },
  { ruleKey: 'catalog.form.productTypeField', section: 'productTypeField', labelKey: 'platform.businessTypes.formFieldProductType', group: 'general' },
  { ruleKey: 'catalog.form.retailFlags', section: 'retailFlags', labelKey: 'platform.businessTypes.formFieldRetailFlags', group: 'general' },
  { ruleKey: 'catalog.form.activeField', section: 'activeField', labelKey: 'platform.businessTypes.formFieldActive', group: 'general' },

  // Владелец / налоги
  { ruleKey: 'catalog.form.ownerType', section: 'ownerType', labelKey: 'platform.businessTypes.formFieldOwnerType', group: 'owner' },
  { ruleKey: 'catalog.form.vatField', section: 'vatField', labelKey: 'platform.businessTypes.formFieldVat', group: 'owner' },
  { ruleKey: 'catalog.form.commissionTin', section: 'commissionTin', labelKey: 'platform.businessTypes.formFieldCommissionTin', group: 'owner' },
  { ruleKey: 'catalog.form.commissionPinfl', section: 'commissionPinfl', labelKey: 'platform.businessTypes.formFieldCommissionPinfl', group: 'owner' },

  // Учёт
  { ruleKey: 'catalog.form.accounting', section: 'accounting', labelKey: 'platform.businessTypes.formFieldAccounting', group: 'accounting' },
  { ruleKey: 'catalog.form.accountingCost', section: 'accountingCost', labelKey: 'platform.businessTypes.formFieldAccountingCost', group: 'accounting' },
  { ruleKey: 'catalog.form.accountingSell', section: 'accountingSell', labelKey: 'platform.businessTypes.formFieldAccountingSell', group: 'accounting' },
  { ruleKey: 'catalog.form.accountingDiscount', section: 'accountingDiscount', labelKey: 'platform.businessTypes.formFieldAccountingDiscount', group: 'accounting' },
  { ruleKey: 'catalog.form.accountingStock', section: 'accountingStock', labelKey: 'platform.businessTypes.formFieldAccountingStock', group: 'accounting' },
  { ruleKey: 'catalog.form.accountingLowStock', section: 'accountingLowStock', labelKey: 'platform.businessTypes.formFieldAccountingLowStock', group: 'accounting' },
  { ruleKey: 'catalog.form.accountingLocation', section: 'accountingLocation', labelKey: 'platform.businessTypes.formFieldAccountingLocation', group: 'accounting' },

  // Цены по магазинам
  { ruleKey: 'catalog.form.storePrices', section: 'storePrices', labelKey: 'platform.businessTypes.formFieldStorePrices', group: 'prices' },

  // Штрихкоды
  { ruleKey: 'catalog.form.barcodes', section: 'barcodes', labelKey: 'platform.businessTypes.formFieldBarcodeMain', group: 'barcodes' },
  { ruleKey: 'catalog.form.pluField', section: 'pluField', labelKey: 'platform.businessTypes.formFieldPlu', group: 'barcodes' },
  { ruleKey: 'catalog.form.extraBarcodes', section: 'extraBarcodes', labelKey: 'platform.businessTypes.formFieldExtraBarcodes', group: 'barcodes' },

  // Доп.
  { ruleKey: 'catalog.form.dynamicFields', section: 'dynamicFields', labelKey: 'platform.businessTypes.formFieldDynamic', group: 'extra' },
];

/** Legacy keys → новые (чтобы старые сохранения не ломали форму) */
const LEGACY_SECTION_EXPAND = {
  tasnif: ['tasnifSearch', 'fiscalExternalId', 'fiscalIkpu', 'fiscalUnitMeasure', 'fiscalPackageCode'],
  ownerVat: ['ownerType', 'vatField', 'commissionTin', 'commissionPinfl'],
};

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
    const enabled = row.enabled !== false;

    if (LEGACY_SECTION_EXPAND[section]) {
      for (const child of LEGACY_SECTION_EXPAND[section]) {
        map[child] = enabled;
      }
      continue;
    }
    map[section] = enabled;
  }
  return map;
}

export function isCatalogFormSectionEnabled(sectionMap, section) {
  if (!sectionMap || typeof sectionMap !== 'object') return true;
  if (!(section in sectionMap)) return true;
  return sectionMap[section] !== false;
}

export function anyCatalogFormSectionEnabled(sectionMap, sections) {
  return sections.some((section) => isCatalogFormSectionEnabled(sectionMap, section));
}

export function defsForGroup(groupId) {
  return CATALOG_FORM_FIELD_DEFS.filter((def) => def.group === groupId);
}
