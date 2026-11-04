/**
 * Скрытая секция формы каталога не участвует в API-payload.
 * Обязательные для бэкенда поля → безопасные дефолты, не «мусор» из hidden input.
 */

export function isCatalogSectionOn(showSection, section) {
  if (typeof showSection !== 'function') return true;
  return showSection(section) !== false;
}

function positiveOr(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * @returns {Record<string, unknown>} поля values с учётом видимости секций
 */
export function pickVisibleCatalogFormValues(values, showSection) {
  const on = (section) => isCatalogSectionOn(showSection, section);
  const v = values || {};

  const accountingOn = on('accounting');
  const costOn = accountingOn && on('accountingCost');
  const sellOn = accountingOn && on('accountingSell');
  const discountOn = accountingOn && on('accountingDiscount');
  const stockOn = accountingOn && on('accountingStock');
  const lowStockOn = accountingOn && on('accountingLowStock');
  const locationOn = accountingOn && on('accountingLocation');

  const costPrice = costOn ? Number(v.costPrice) || 0 : 0;
  let sellingPrice;
  if (sellOn) {
    sellingPrice = positiveOr(v.sellingPrice, 0.01);
  } else {
    // Розничная скрыта — не тянем скрытое значение; минимум для API
    sellingPrice = costPrice > 0 ? costPrice : 0.01;
  }

  return {
    name: v.name,
    sku: v.sku,
    description: on('descriptionField') ? (v.description || undefined) : undefined,
    categoryId: on('categoryField') && v.categoryId ? Number(v.categoryId) : null,
    costPrice,
    sellingPrice,
    defaultDiscountPercent: discountOn ? (v.defaultDiscountPercent ?? 0) : 0,
    taxRate: on('vatField') ? (v.taxRate ?? 0) : 0,
    lowStockAlert: lowStockOn ? v.lowStockAlert : undefined,
    storageLocation: locationOn ? (v.storageLocation?.trim() || null) : null,
    initialStock: stockOn ? (v.initialStock ?? 0) : 0,
    barcode: on('barcodes') ? (v.barcode || undefined) : undefined,
    plu: on('pluField') ? (v.plu?.trim() || undefined) : undefined,
    externalProductId: on('fiscalExternalId') ? (v.externalProductId || undefined) : undefined,
    ikpu: on('fiscalIkpu') ? (v.ikpu || undefined) : undefined,
    unitMeasureCode: on('fiscalUnitMeasure') ? (v.unitMeasureCode || undefined) : undefined,
    packageCode: on('fiscalPackageCode') ? (v.packageCode || undefined) : undefined,
    productType: v.productType,
    saleType: v.saleType,
    unitCode: v.unitCode,
    quantityScale: v.quantityScale,
    allowFraction: v.allowFraction,
    unitOfMeasure: v.unitOfMeasure,
    soldIndividually: on('retailFlags') && v.productType === 'RETAIL' ? v.soldIndividually : undefined,
    markedProduct: on('retailFlags') && v.productType === 'RETAIL' ? v.markedProduct : undefined,
    ownerType: on('ownerType') ? (v.ownerType || 'OWN') : 'OWN',
    commissionTin: on('commissionTin') ? (v.commissionTin || undefined) : undefined,
    commissionPinfl: on('commissionPinfl') ? (v.commissionPinfl || undefined) : undefined,
    active: on('activeField') ? v.active !== false : true,
  };
}
