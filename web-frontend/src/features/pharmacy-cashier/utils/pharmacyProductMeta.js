/**
 * Атрибуты товара для аптечной кассы (срок / серия).
 */
export function productAttr(productOrLine, ...keys) {
  const attrs = productOrLine?.attributes;
  if (!attrs || typeof attrs !== 'object') return '';
  for (const key of keys) {
    const value = attrs[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return '';
}

export function productExpiry(productOrLine) {
  return productAttr(productOrLine, 'expiry_date', 'expiryDate', 'expiration_date');
}

export function productBatch(productOrLine) {
  return productAttr(productOrLine, 'batch', 'series', 'batch_number');
}
