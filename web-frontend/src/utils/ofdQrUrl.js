/** Официальный QR фискального чека ГНК: https://ofd.soliq.uz/check?t=&r=&c=&s= */

const SYNTHETIC_SIGN = /^(MK-\d+|LOCAL-)/i;

export function isSyntheticFiscalSign(sign) {
  const s = String(sign || '').trim();
  if (!s) return true;
  return SYNTHETIC_SIGN.test(s);
}

export function toOfdCompactDateTime(value) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 14) return digits.slice(0, 14);

  const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T'));
  if (Number.isNaN(parsed.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${parsed.getFullYear()}${pad(parsed.getMonth() + 1)}${pad(parsed.getDate())}` +
    `${pad(parsed.getHours())}${pad(parsed.getMinutes())}${pad(parsed.getSeconds())}`
  );
}

/**
 * URL, который кодируется в QR чека (проверка на ofd.soliq.uz).
 * Строим только из настоящего фискального признака модуля — не из локального hash.
 */
export function buildOfdCheckUrl({ terminalId, receiptSeq, fiscalSign, datetime } = {}) {
  const t = String(terminalId || '').trim();
  const r = String(receiptSeq ?? '').trim();
  const s = String(fiscalSign || '').trim();
  const c = toOfdCompactDateTime(datetime);
  if (!t || !r || !s || !c) return '';
  if (isSyntheticFiscalSign(s)) return '';
  return `https://ofd.soliq.uz/check?t=${encodeURIComponent(t)}&r=${encodeURIComponent(r)}&c=${encodeURIComponent(c)}&s=${encodeURIComponent(s)}`;
}

export function isOfdCheckUrl(value) {
  const url = String(value || '').trim();
  if (!url) return false;
  return /ofd\.soliq\.uz\/(check|epi)\?/i.test(url) && /[?&]t=/i.test(url) && /[?&]s=/i.test(url);
}
