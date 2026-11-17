import { buildFallbackProductSku } from './buildFallbackProductSku';

/**
 * Normalizes form submit values according to catalog profile and visibility rules.
 */
export function prepareProductCatalogSubmitValues(values, { isRestaurantIngredient, showSection }) {
  const submitValues = { ...values };
  if (isRestaurantIngredient) {
    submitValues.productType = 'DISH';
    submitValues.ownerType = 'OWN';
    submitValues.taxRate = 0;
    submitValues.defaultDiscountPercent = 0;
    submitValues.soldIndividually = true;
    submitValues.markedProduct = false;
    if (!String(submitValues.sku || '').trim()) {
      submitValues.sku = buildFallbackProductSku(submitValues.name).replace(/^AUTO-/, 'ING-');
    }
    const cost = Number(submitValues.costPrice) || 0;
    submitValues.sellingPrice = submitValues.sellingPrice > 0
      ? submitValues.sellingPrice
      : (cost > 0 ? cost : 0.01);
  } else if (!showSection('skuField') && !String(submitValues.sku || '').trim()) {
    submitValues.sku = buildFallbackProductSku(submitValues.name);
  }

  return submitValues;
}

/**
 * Validates discount against price rules.
 */
export function isDiscountExceeded(submitValues, { isRestaurantIngredient, showSection, maxDiscountPercent }) {
  if (isRestaurantIngredient) return false;
  if (!showSection('accountingDiscount')) return false;
  if (maxDiscountPercent == null) return false;
  return Number(submitValues.defaultDiscountPercent) > Number(maxDiscountPercent);
}
