import { isMarkingOnlyProduct } from '../../marking/isMarkingOnlyProduct';

/** Строка чека с хотя бы одним КМ. */
export function lineHasProductMark(line) {
  if (!line) return false;
  if (line.productMark || line.markCode) return true;
  return Array.isArray(line.productMarks) && line.productMarks.some(Boolean);
}

/** Маркированный товар без КМ — в ОФД уйдёт без product_mark. */
export function isMarkedLineMissingKm(line) {
  return isMarkingOnlyProduct(line) && !lineHasProductMark(line);
}

/** Строки корзины, где markedProduct есть, а КМ нет. */
export function cartMarkedLinesMissingKm(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(isMarkedLineMissingKm);
}

/**
 * Перед оплатой: маркированные позиции обязаны иметь КМ.
 * @returns {{ ok: true } | { ok: false, count: number }}
 */
export function assertCartMarkedKmReady(items) {
  const missing = cartMarkedLinesMissingKm(items);
  if (missing.length === 0) return { ok: true };
  return { ok: false, count: missing.length };
}
