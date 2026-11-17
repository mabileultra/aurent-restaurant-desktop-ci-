import { isOfdCheckUrl, buildOfdCheckUrl } from '../../utils/ofdQrUrl';
import { isPlainObject, maybeParseJson } from './multikassaResultPrimitives';

export const QR_KEYS = [
  'QRCodeURL',
  'QrCodeUrl',
  'qrCodeUrl',
  'qr_url',
  'QRCodeUrl',
  'qrCodeURL',
  'qr_code_url',
  'qrcode_url',
  'QRCODEURL',
  'QR',
  'QrCode',
  'QRCode',
  'qrCode',
  'qr_code',
  'FiscalQR',
  'fiscalQrUrl',
  'CheckUrl',
  'checkUrl',
  'OfdUrl',
  'ofdUrl',
  'OfdQRCodeURL',
  'ofd_qr_url',
  'QrUrl',
  'qrUrl',
];

export function coerceQrUrl(value) {
  if (value == null) return null;
  if (typeof value === 'number') return null;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s || s === '[object Object]') return null;
    if (isOfdCheckUrl(s)) return s.startsWith('http') ? s : `https://${s.replace(/^\/+/, '')}`;
    if (/^https?:\/\/ofd\.soliq\.uz/i.test(s)) return s;
    if (/ofd\.soliq\.uz/i.test(s)) return s.startsWith('http') ? s : `https://${s.replace(/^\/+/, '')}`;
    if (/^[?]?t=.+&r=.+&c=.+&s=/.test(s)) {
      return `https://ofd.soliq.uz/check?${s.replace(/^\?/, '')}`;
    }
    // Любая http(s) ссылка от модуля — кодируем в QR как есть.
    if (/^https?:\/\//i.test(s)) return s;
    return null;
  }
  if (isPlainObject(value)) {
    for (const key of QR_KEYS) {
      const nested = coerceQrUrl(value[key]);
      if (nested) return nested;
    }
    return coerceQrUrl(value.url || value.URL || value.href || value.Href || null);
  }
  return null;
}

/** Вытащить t/r/c/s из готового ofd.soliq.uz URL (если модуль отдал только QR). */
export function parseOfdUrlParts(url) {
  const raw = String(url || '').trim();
  if (!raw || !/ofd\.soliq\.uz/i.test(raw)) return null;
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw.replace(/^\/+/, '')}`);
    const t = u.searchParams.get('t');
    const r = u.searchParams.get('r');
    const c = u.searchParams.get('c');
    const s = u.searchParams.get('s');
    if (!t || !r || !s) return null;
    return { terminalId: t, receiptSeq: r, datetime: c || null, fiscalSign: s };
  } catch {
    return null;
  }
}

export function deepPickQr(node, depth = 0) {
  if (!node || depth > 6) return null;
  const parsed = maybeParseJson(node);
  if (typeof parsed === 'string') return coerceQrUrl(parsed);
  if (Array.isArray(parsed)) {
    for (let i = parsed.length - 1; i >= 0; i -= 1) {
      const found = deepPickQr(parsed[i], depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  for (const key of QR_KEYS) {
    const found = coerceQrUrl(parsed[key]);
    if (found) return found;
  }
  for (const value of Object.values(parsed)) {
    const found = deepPickQr(value, depth + 1);
    if (found) return found;
  }
  return null;
}

/** Дособрать QR из полей + hints (terminal из настроек кассы). */
export function ensureFiscalQrUrl(parsed, hints = {}) {
  if (!parsed) return parsed;
  const existing = coerceQrUrl(parsed.fiscalQrUrl);
  if (existing) {
    return { ...parsed, fiscalQrUrl: existing };
  }
  const fiscalQrUrl =
    buildOfdCheckUrl({
      terminalId: hints.terminalId || parsed.terminalId,
      receiptSeq: parsed.fiscalReceiptSeq,
      fiscalSign: parsed.fiscalSign,
      datetime: hints.datetime || parsed.datetime || hints.receiptTime,
    }) || null;
  return { ...parsed, fiscalQrUrl };
}

export function applyQrHints(fields, hints = {}) {
  const fiscalQrUrl =
    coerceQrUrl(fields.fiscalQrUrl) ||
    buildOfdCheckUrl({
      terminalId: fields.terminalId || hints.terminalId,
      receiptSeq: fields.fiscalReceiptSeq,
      fiscalSign: fields.fiscalSign,
      datetime: fields.datetime || hints.datetime,
    }) ||
    null;
  return { ...fields, fiscalQrUrl };
}
