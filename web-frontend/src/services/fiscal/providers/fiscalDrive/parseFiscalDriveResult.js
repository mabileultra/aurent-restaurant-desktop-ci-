import { buildOfdCheckUrl, isOfdCheckUrl } from '../../../../utils/ofdQrUrl';
import { FISCAL_STATUS } from '../../fiscalStatus';
import { toSaleFiscalPayload } from '../../shared/toSaleFiscalPayload';

const WRAPPER_KEYS = new Set([
  'result',
  'data',
  'payload',
  'response',
  'value',
  'body',
  'content',
]);

/** Case-insensitive lookup; first matching key wins. */
function pickCI(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  const map = new Map(Object.keys(obj).map((k) => [k.toLowerCase(), k]));
  for (const key of keys) {
    const real = map.get(String(key).toLowerCase());
    if (real == null) continue;
    const value = obj[real];
    if (value != null && value !== '') return value;
  }
  return null;
}

/** Снять типичные обёртки { Code, Result|Data: { FiscalSign… } }. */
function unwrapRegisterPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw;
  const hasFiscal = pickCI(raw, 'FiscalSign', 'ReceiptSeq', 'QRCodeURL', 'TerminalID');
  if (hasFiscal != null) return raw;
  for (const key of Object.keys(raw)) {
    if (!WRAPPER_KEYS.has(key.toLowerCase())) continue;
    const inner = raw[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      return unwrapRegisterPayload(inner);
    }
  }
  return raw;
}

/**
 * Ответ RegisterTXID → нейтральный фискальный блок продажи.
 * @param {object} raw
 * @param {{ terminalId?: string|null, datetime?: string|null }} [fallbacks]
 */
export function parseFiscalDriveRegisterResult(raw, fallbacks = {}) {
  const info = unwrapRegisterPayload(raw && typeof raw === 'object' ? raw : {}) || {};
  const fiscalSign = pickCI(info, 'FiscalSign', 'fiscalSign');
  const receiptSeq = pickCI(info, 'ReceiptSeq', 'receiptSeq');
  const terminalId =
    pickCI(info, 'TerminalID', 'TerminalId', 'terminalId', 'terminalID') ||
    (fallbacks.terminalId != null && String(fallbacks.terminalId).trim()
      ? String(fallbacks.terminalId).trim()
      : null);
  const datetime =
    pickCI(info, 'DateTime', 'Time', 'dateTime', 'time') ||
    (fallbacks.datetime != null && String(fallbacks.datetime).trim()
      ? String(fallbacks.datetime).trim()
      : null) ||
    new Date().toISOString();

  let fiscalQrUrl = pickCI(info, 'QRCodeURL', 'QRCodeUrl', 'qrCodeUrl', 'QrCodeUrl', 'qrCodeURL');
  if (fiscalQrUrl != null) fiscalQrUrl = String(fiscalQrUrl).trim();
  if (!fiscalQrUrl || !isOfdCheckUrl(fiscalQrUrl)) {
    fiscalQrUrl =
      buildOfdCheckUrl({
        terminalId,
        receiptSeq,
        fiscalSign,
        datetime,
      }) ||
      fiscalQrUrl ||
      null;
  }

  const hasProof = Boolean(fiscalSign && receiptSeq != null && String(receiptSeq).trim() !== '');
  return {
    fiscalStatus: hasProof ? FISCAL_STATUS.FISCALIZED : FISCAL_STATUS.PENDING,
    fiscalSign: fiscalSign != null ? String(fiscalSign) : null,
    fiscalReceiptSeq: receiptSeq != null ? String(receiptSeq) : null,
    fiscalQrUrl: fiscalQrUrl || null,
    fiscalTerminalId: terminalId != null ? String(terminalId).trim().toUpperCase() : null,
    fiscalDateTime: datetime != null ? String(datetime) : null,
    fiscalError: hasProof ? null : 'FiscalDrive не вернул фискальный признак',
    raw: info,
  };
}

export function toFiscalDriveSalePayload(parsed, { txid = null, receipt = null } = {}) {
  return {
    ...toSaleFiscalPayload({
      ...parsed,
      terminalId: parsed.fiscalTerminalId,
    }),
    fiscalProvider: 'FISCAL_DRIVE',
    fiscalDriveTxid: txid,
    fiscalDriveRetry: txid
      ? { txid, receipt, dateTime: parsed.fiscalDateTime || receipt?.Time || null }
      : null,
  };
}
