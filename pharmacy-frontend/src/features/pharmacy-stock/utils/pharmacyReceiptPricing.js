import {
  productCountry,
  productDosageForm,
  productUnitsInPack,
  productAttr,
} from '../../pharmacy-cashier/utils/pharmacyProductMeta';

export function productManufacturer(product) {
  return productAttr(product, 'manufacturer', 'производитель', 'producer');
}

export { productCountry, productDosageForm, productUnitsInPack };

export function calcPurchaseWithVat(purchase, vatPercent) {
  const p = Number(purchase) || 0;
  const vat = Number(vatPercent) || 0;
  return round2(p * (1 + vat / 100));
}

export function calcRetailFromMarkup(purchaseWithVat, markupPercent) {
  const base = Number(purchaseWithVat) || 0;
  const markup = Number(markupPercent) || 0;
  return round2(base * (1 + markup / 100));
}

export function calcMarkupFromRetail(purchaseWithVat, retail) {
  const base = Number(purchaseWithVat) || 0;
  const r = Number(retail) || 0;
  if (base <= 0) return 0;
  return round2(((r - base) / base) * 100);
}

export function calcUnitRetail(retail, unitsInPack) {
  const pack = Number(unitsInPack) || 0;
  const r = Number(retail) || 0;
  if (pack <= 0) return r;
  return round2(r / pack);
}

export function calcRetailFromUnit(unitRetail, unitsInPack) {
  const pack = Number(unitsInPack) || 0;
  const u = Number(unitRetail) || 0;
  if (pack <= 0) return u;
  return round2(u * pack);
}

export function packsAndUnitsToQty(packs, units, unitsInPack) {
  const packSize = Number(unitsInPack) > 0 ? Number(unitsInPack) : 1;
  const p = Number(packs) || 0;
  const u = Number(units) || 0;
  return round3(p + u / packSize);
}

export function qtyToPacksAndUnits(quantity, unitsInPack) {
  const packSize = Number(unitsInPack) > 0 ? Number(unitsInPack) : 1;
  const q = Number(quantity) || 0;
  const packs = Math.floor(q);
  const units = round3((q - packs) * packSize);
  return { packs, units };
}

export function toLinePayload(form) {
  const unitsInPack = Number(form.unitsInPack) > 0 ? Number(form.unitsInPack) : 1;
  const quantity = packsAndUnitsToQty(form.packs, form.units, unitsInPack);
  const purchasePrice = Number(form.purchasePrice) || 0;
  const vatPercent = Number(form.vatPercent) || 0;
  const purchasePriceWithVat = form.purchasePriceWithVat != null && form.purchasePriceWithVat !== ''
    ? Number(form.purchasePriceWithVat)
    : calcPurchaseWithVat(purchasePrice, vatPercent);
  const markupPercent = Number(form.markupPercent) || 0;
  const retailPrice = form.retailPrice != null && form.retailPrice !== ''
    ? Number(form.retailPrice)
    : calcRetailFromMarkup(purchasePriceWithVat, markupPercent);
  const unitRetailPrice = form.unitRetailPrice != null && form.unitRetailPrice !== ''
    ? Number(form.unitRetailPrice)
    : calcUnitRetail(retailPrice, unitsInPack);

  return {
    productId: form.productId,
    quantity,
    purchasePrice,
    unitSellingPrice: retailPrice,
    vatPercent,
    markupPercent,
    unitsInPack,
    purchasePriceWithVat,
    retailPrice,
    unitRetailPrice,
    batchNumber: form.batchNumber?.trim() || null,
    expiryDate: form.expiryDate || null,
  };
}

export function validateLineForm(form, t) {
  const qty = packsAndUnitsToQty(form.packs, form.units, form.unitsInPack);
  if (!(qty > 0)) return t('pharmacyStock.errQty');
  if (!(Number(form.purchasePrice) >= 0)) return t('pharmacyStock.errPurchase');
  if (!(Number(form.retailPrice) >= 0) && !(Number(form.markupPercent) >= 0)) {
    return t('pharmacyStock.errRetail');
  }
  return null;
}

export function emptyLineForm(product, defaultMarkup = 20) {
  const unitsInPack = productUnitsInPack(product) || 1;
  return {
    productId: product?.id || '',
    productName: product?.name || '',
    packs: '',
    units: '',
    unitsInPack,
    purchasePrice: product?.costPrice != null ? String(product.costPrice) : '',
    vatPercent: product?.taxRate != null ? String(product.taxRate) : '0',
    purchasePriceWithVat: '',
    markupPercent: String(defaultMarkup ?? 20),
    retailPrice: '',
    unitRetailPrice: '',
    batchNumber: '',
    expiryDate: '',
    expiryInput: '',
  };
}

/** Заполнить форму из существующей строки документа. */
export function lineToForm(line, defaultMarkup = 20) {
  const unitsInPack = Number(line?.unitsInPack) > 0 ? Number(line.unitsInPack) : 1;
  const { packs, units } = qtyToPacksAndUnits(line?.quantity, unitsInPack);
  const expiry = line?.expiryDate ? String(line.expiryDate).slice(0, 10) : '';
  return {
    productId: line?.productId || '',
    productName: line?.productName || '',
    packs: packs ? String(packs) : '',
    units: units ? String(units) : '',
    unitsInPack,
    purchasePrice: line?.purchasePrice != null ? String(line.purchasePrice) : '',
    vatPercent: line?.vatPercent != null ? String(line.vatPercent) : '0',
    purchasePriceWithVat: line?.purchasePriceWithVat != null ? String(line.purchasePriceWithVat) : '',
    markupPercent: line?.markupPercent != null
      ? String(line.markupPercent)
      : String(defaultMarkup ?? 20),
    retailPrice: line?.retailPrice != null
      ? String(line.retailPrice)
      : (line?.unitSellingPrice != null ? String(line.unitSellingPrice) : ''),
    unitRetailPrice: line?.unitRetailPrice != null ? String(line.unitRetailPrice) : '',
    batchNumber: line?.batchNumber || '',
    expiryDate: expiry,
    expiryInput: expiry,
  };
}

export function linesReadyForActivate(lines = []) {
  return lines.length > 0;
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function round3(n) {
  return Math.round((Number(n) || 0) * 1000) / 1000;
}

export function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function statusLabel(status, t) {
  if (status === 'DRAFT') return t('pharmacyStock.statusDraft');
  if (status === 'POSTED') return t('pharmacyStock.statusPosted');
  return status || '—';
}
