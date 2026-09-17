import {
  extractGtinFromMarkingCode,
  markingScanKey,
  normalizePharmacyMarkingCode,
} from './pharmacyMarkingCode';
import { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';

/**
 * Стабильный ключ КМ для жизненного цикла:
 * предпочитаем GTIN + серийный (AI 21) — хвост криптокода у сканеров часто пляшет.
 */
export function markingIdentityKey(raw) {
  const mark = preserveMarkingCodeForFiscal(raw) || normalizePharmacyMarkingCode(raw);
  if (!mark) return '';

  const gtin = extractGtinFromMarkingCode(mark);
  const serial = extractSerialFromMarkingCode(mark);
  if (gtin && serial) {
    return `01${gtin}|21${serial}`.toLowerCase();
  }
  return markingScanKey(mark);
}

/** Серия упаковки (AI 21) из DataMatrix. */
export function extractSerialFromMarkingCode(raw) {
  const code = normalizePharmacyMarkingCode(raw);
  if (!code) return null;

  const paren = code.match(/\(21\)([^(]+)/);
  if (paren?.[1]) return paren[1].replace(/\s+/g, '');

  // 01 + GTIN14 + 21 + serial до crypto AI 91/92/93 или конца
  const m = code.match(/01\d{14}21(.+?)(?:91|92|93|$)/);
  if (m?.[1]) return m[1].replace(/\s+/g, '');

  return null;
}

export function lineMarkIdentityKeys(line) {
  const marks = Array.isArray(line?.productMarks) ? line.productMarks : [];
  const keys = marks.map((mark) => markingIdentityKey(mark)).filter(Boolean);
  const single = line?.productMark || line?.markCode;
  if (single) {
    const key = markingIdentityKey(single);
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

export function cartHasMark(items, rawMark) {
  const key = markingIdentityKey(rawMark);
  if (!key || !Array.isArray(items)) return false;
  return items.some((line) => lineMarkIdentityKeys(line).includes(key));
}
