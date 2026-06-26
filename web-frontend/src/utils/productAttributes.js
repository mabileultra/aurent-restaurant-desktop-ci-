/**
 * Чтение dynamic attributes товара (business-config fields).
 */

export function getProductAttribute(product, key) {
  const attrs = product?.attributes;
  if (!attrs || key == null) return null;
  const val = attrs[key];
  if (val == null || val === '') return null;
  return val;
}

/** Стандартная длина бухты/отрезка в метрах (поле length_m). */
export function getProductLengthM(product) {
  const raw = getProductAttribute(product, 'length_m');
  if (raw == null) return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}
