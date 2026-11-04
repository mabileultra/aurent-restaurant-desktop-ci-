import { productUnitsInPack } from './pharmacyProductMeta';

/** МХИК / ИКПУ из карточки товара. */
export function productIkpu(productOrLine) {
  const raw = productOrLine?.ikpu ?? productOrLine?.mxik ?? productOrLine?.attributes?.ikpu;
  const text = raw != null ? String(raw).trim() : '';
  return text || '';
}

/** Код упаковки (часто рядом с ИКПУ в фискале). */
export function productPackageCode(productOrLine) {
  const raw = productOrLine?.packageCode
    ?? productOrLine?.attributes?.package_code
    ?? productOrLine?.attributes?.packageCode;
  const text = raw != null ? String(raw).trim() : '';
  return text || '';
}

export function productIsMarked(productOrLine) {
  if (productOrLine?.markedProduct === true) return true;
  if (productOrLine?.markedProduct === false) return false;
  const raw = productOrLine?.attributes?.marked
    ?? productOrLine?.attributes?.marked_product
    ?? productOrLine?.attributes?.markedProduct;
  if (raw == null) return false;
  const n = String(raw).trim().toLowerCase();
  return n === '1' || n === 'true' || n === 'yes' || n === 'да';
}

export function formatMarkedLabel(productOrLine, yesLabel, noLabel) {
  return productIsMarked(productOrLine) ? yesLabel : noLabel;
}

export function formatUnitsInPackCell(productOrLine) {
  const units = productUnitsInPack(productOrLine);
  return units != null ? String(units) : '';
}
