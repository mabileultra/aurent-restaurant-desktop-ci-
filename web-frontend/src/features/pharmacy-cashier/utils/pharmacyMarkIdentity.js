import {
  extractGtinFromMarkingCode,
  markingScanKey,
  normalizePharmacyMarkingCode,
} from './pharmacyMarkingCode';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Ключи одной упаковки (полный код + GTIN|serial).
 * Разные пачки одного товара → разные ключи.
 * Одна пачка с разным хвостом криптокода → общий GTIN|serial.
 */
export function markingIdentityKeys(raw) {
  const mark = preserveMarkingCodeForFiscal(raw) || normalizePharmacyMarkingCode(raw);
  if (!mark) return [];

  const keys = new Set();
  const full = markingScanKey(mark);
  if (full) keys.add(`full:${full}`);

  const identification = markingIdentificationCode(mark);
  if (identification.length >= 20) keys.add(`id:${identification.toLowerCase()}`);

  const gtin = extractGtinFromMarkingCode(mark);
  const serial = extractSerialFromMarkingCode(mark);
  // serial слишком короткий/длинный — ненадёжен, не схлопываем разные пачки
  if (gtin && serial && serial.length >= 4 && serial.length <= 30) {
    keys.add(`gs1:01${gtin}|21${serial}`.toLowerCase());
  }
  return [...keys];
}

/** Главный ключ для pending-set (полный код, иначе gs1). */
export function markingIdentityKey(raw) {
  const keys = markingIdentityKeys(raw);
  return keys[0] || '';
}

const CRYPTO_TAIL = /(91|92|93).{1,64}$/;

/** Код идентификации без криптохвоста 91/92/93. */
export function markingIdentificationCode(raw) {
  const code = normalizePharmacyMarkingCode(raw);
  if (!code) return '';
  if (code.length > 18 && code.startsWith('01') && code.slice(16, 18) === '21') {
    const serialAndTail = code.slice(18);
    const crypto = serialAndTail.match(CRYPTO_TAIL);
    if (crypto && crypto.index >= 4) {
      return code.slice(0, 18 + crypto.index);
    }
  }
  return code;
}

/** Серия упаковки (AI 21) из DataMatrix. */
export function extractSerialFromMarkingCode(raw) {
  const code = normalizePharmacyMarkingCode(raw);
  if (!code) return null;

  const paren = code.match(/\(21\)([^()]+)/);
  if (paren?.[1]) {
    const serial = paren[1].replace(/\s+/g, '');
    return serial || null;
  }

  const identification = markingIdentificationCode(code);
  const serial = identification.match(/^01\d{14}21(.+)$/)?.[1];
  if (serial && serial.length >= 4 && serial.length <= 30) return serial;

  return null;
}

export function lineMarkIdentityKeys(line) {
  const marks = Array.isArray(line?.productMarks) ? line.productMarks : [];
  const keys = new Set();
  for (const mark of marks) {
    markingIdentityKeys(mark).forEach((k) => keys.add(k));
  }
  const single = line?.productMark || line?.markCode;
  if (single) {
    markingIdentityKeys(single).forEach((k) => keys.add(k));
  }
  return [...keys];
}

export function marksShareIdentity(rawA, rawB) {
  const a = new Set(markingIdentityKeys(rawA));
  if (a.size === 0) return false;
  return markingIdentityKeys(rawB).some((k) => a.has(k));
}

export function cartHasMark(items, rawMark) {
  const scanKeys = markingIdentityKeys(rawMark);
  if (scanKeys.length === 0 || !Array.isArray(items)) return false;
  return items.some((line) => {
    const lineKeys = lineMarkIdentityKeys(line);
    return scanKeys.some((k) => lineKeys.includes(k));
  });
}
