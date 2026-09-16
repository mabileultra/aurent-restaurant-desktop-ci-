import { buildOfdCheckUrl, isOfdCheckUrl, isSyntheticFiscalSign, parseOfdCheckParams } from './ofdQrUrl';

/** Данные для QR / фискального признака на чеке. */
export { fmtMoney, fmtMoneyCompact, fmtQty } from './formatMoney';

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
  if (isOfdCheckUrl(fromModule)) {
    return fromModule;
  }
  const fromUrl = parseOfdCheckParams(fromModule);
  const terminalId =
    sale?.fiscalTerminalId ||
    sale?.terminalId ||
    fromUrl?.terminalId ||
    import.meta.env.VITE_FISCAL_CARD_ID ||
    import.meta.env.VITE_FISCAL_MODULE_NUMBER ||
    '';
  return (
    buildOfdCheckUrl({
      terminalId,
      receiptSeq: sale?.fiscalReceiptSeq || fromUrl?.receiptSeq,
      fiscalSign: sale?.fiscalSign || fromUrl?.fiscalSign,
      datetime: sale?.fiscalizedAt || sale?.createdAt || fromUrl?.datetime,
    }) || ''
  );
}

/**
 * Что реально рисуем на чеке: учитывает printFiscalQr с кассы.
 * Пустая строка = QR не печатать (офлайн / тумблер выкл / нет фискала).
 */
export function resolveReceiptQrValue(sale) {
  if (sale?.printFiscalQr === false) return '';
  return buildQrPayload(sale);
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
  if (rt === 'SALE') {
    return t('fiscalReceipt.receiptTypeSale');
  }
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
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
  } catch {
    return { date: '—', time: '—' };
  }
}
