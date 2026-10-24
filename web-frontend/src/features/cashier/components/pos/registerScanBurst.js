import { isMarkingCode } from '../../../marking';

/** Same gap as the barcode wedge: faster than a person types. */
export const REGISTER_SCAN_GAP_MS = 80;

/**
 * Ввод похож на скан (штрихкод / КМ), а не на поиск по имени.
 * Нужен на POS-мониторах: BT-сканер часто > 80 ms между символами.
 */
export function looksLikeRegisterScanInput(value) {
  const t = String(value ?? '').trim();
  if (!t) return false;
  if (isMarkingCode(t)) return true;
  if (t.includes('\u001d') || t.includes('€')) return true;
  // GS1 КМ в процессе набора: 01… без кириллицы
  if (/^01\d/.test(t) && !/[а-яёА-ЯЁ]/.test(t)) return true;
  // Только цифры — штрихкод/PLU (имя товара набирают буквами)
  if (/^\d+$/.test(t)) return true;
  // Длинный латиница+цифры — тело DataMatrix
  if (t.length >= 16 && /^[0-9A-Za-z]+$/.test(t)) return true;
  return false;
}

/**
 * A USB scanner dumps the code as one fast burst into the check search field.
 * That burst must not open the product list over the receipt.
 * Slow POS scanners: keep hiding while the value still looks like a scan code.
 */
export function nextRegisterScanBurst(prev, value, now = Date.now()) {
  const text = String(value ?? '');
  const trimmed = text.trim();
  const prevLen = prev?.len ?? 0;
  const gap = now - (prev?.at ?? 0);
  const grew = text.length > prevLen;
  const delta = text.length - prevLen;
  const fastChars = prevLen > 0 && gap >= 0 && gap <= REGISTER_SCAN_GAP_MS;
  const pastedCode = delta >= 6;
  const continueBurst = Boolean(prev?.burst && grew && trimmed);
  const scanShaped = looksLikeRegisterScanInput(text);
  const burst = Boolean(
    trimmed && grew && (fastChars || pastedCode || continueBurst || scanShaped),
  );
  return { at: now, len: text.length, burst };
}
