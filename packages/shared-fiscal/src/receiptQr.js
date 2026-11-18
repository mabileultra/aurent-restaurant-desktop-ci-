/**
 * @file receiptQr.js
 * Qoidalar:
 * Avans va kredit cheklarida (receiptType ADVANCE / CREDIT / AVANCE) QR-kod chiqmasligi shart (false).
 * Oddiy sotuv (SALE), qaytarish (RETURN) yoki ko'rsatilmagan holatlarda QR odatdagidek chiqadi (true).
 */

export const FISCAL_QR_SUPPRESSED_RECEIPT_TYPES = Object.freeze(new Set([
  'ADVANCE',
  'AVANCE',
  'CREDIT',
]));

/**
 * Chek turidan kelib chiqib fiskal QR-kod bosilishi kerakmi yoki yo'qligini aniqlaydi.
 * @param {string|object} [receiptTypeOrSale]
 * @returns {boolean}
 */
export function shouldPrintFiscalQr(receiptTypeOrSale) {
  const raw =
    typeof receiptTypeOrSale === 'object' && receiptTypeOrSale !== null
      ? (receiptTypeOrSale.receiptType ?? receiptTypeOrSale.type ?? 'SALE')
      : (receiptTypeOrSale ?? 'SALE');
  const normalized = String(raw).trim().toUpperCase();
  if (!normalized) return true;
  return !FISCAL_QR_SUPPRESSED_RECEIPT_TYPES.has(normalized);
}

/**
 * Chek avans yoki kredit ekanligini tekshiradi.
 * @param {string|object} [receiptTypeOrSale]
 * @returns {boolean}
 */
export function isAdvanceOrCreditReceipt(receiptTypeOrSale) {
  return !shouldPrintFiscalQr(receiptTypeOrSale);
}
