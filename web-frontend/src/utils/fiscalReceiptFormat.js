/** Данные для QR / фискального признака на чеке. */
export { fmtMoney, fmtQty } from './formatMoney';

function isSyntheticFiscalSign(sign) {
  const s = String(sign || '').trim();
  if (!s) return true;
  if (/^MK-\d+$/i.test(s)) return true;
  if (/^LOCAL-/i.test(s)) return true;
  return false;
}

/** Настоящий фискальный признак Multikassa/ГНК — без локальных MK-/hash fallback. */
export function buildFiscalSign(sale) {
  if (sale?.fiscalSign && !isSyntheticFiscalSign(sale.fiscalSign)) {
    return String(sale.fiscalSign);
  }
  return '';
}

/** QR только из ответа Multikassa — самодельный ofd.soliq.uz с фейковым sign не строим. */
export function buildQrPayload(sale) {
  if (sale?.fiscalQrUrl) {
    const url = String(sale.fiscalQrUrl).trim();
    if (url) return url;
  }
  return '';
}

/** Отдельный документ возврата (печатается при оформлении возврата на кассе). */
export function isReturnReceipt(sale) {
  return sale?.receiptDocumentType === 'RETURN';
}

/**
 * Тип конкретного чека: что было оформлено в этой операции.
 * Не зависит от статуса продажи (REFUNDED) — при перепечати продажи остаётся «Продажа».
 */
export function resolveFiscalReceiptTypeLabel(sale, t) {
  if (isReturnReceipt(sale)) {
    return t('fiscalReceipt.receiptTypeReturn');
  }
  const rt = String(sale?.receiptType || 'SALE').toUpperCase();
  const key = `pos.receiptType.${rt}`;
  const translated = t(key);
  if (translated !== key) return translated;
  return t('fiscalReceipt.receiptTypeSale');
}

export function splitDateTime(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    };
  } catch {
    return { date: '—', time: '—' };
  }
}
