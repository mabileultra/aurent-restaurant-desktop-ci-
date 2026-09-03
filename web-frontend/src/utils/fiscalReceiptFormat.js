import { buildOfdCheckUrl, isOfdCheckUrl, isSyntheticFiscalSign } from './ofdQrUrl';

/** Данные для QR / фискального признака на чеке. */
export { fmtMoney, fmtQty } from './formatMoney';

/** Настоящий фискальный признак Multikassa/ГНК — без локальных MK-/hash fallback. */
export function buildFiscalSign(sale) {
  if (sale?.fiscalSign && !isSyntheticFiscalSign(sale.fiscalSign)) {
    return String(sale.fiscalSign);
  }
  return '';
}

/**
 * QR чека = официальная ссылка ГНК (ofd.soliq.uz/check?t&r&c&s).
 * Берём URL из ответа модуля; если его нет — собираем из фискальных полей.
 */
export function buildQrPayload(sale) {
  const fromModule = String(sale?.fiscalQrUrl || '').trim();
  if (fromModule && (isOfdCheckUrl(fromModule) || /^https?:\/\//i.test(fromModule))) {
    return fromModule;
  }
  return (
    buildOfdCheckUrl({
      terminalId: sale?.fiscalTerminalId || sale?.terminalId,
      receiptSeq: sale?.fiscalReceiptSeq,
      fiscalSign: sale?.fiscalSign,
      datetime: sale?.fiscalizedAt || sale?.createdAt,
    }) || ''
  );
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
