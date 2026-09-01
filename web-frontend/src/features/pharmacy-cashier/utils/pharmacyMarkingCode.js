/** Нормализация кода маркировки (DataMatrix / КМ). */
export function normalizePharmacyMarkingCode(raw) {
  if (!raw) return '';
  return String(raw)
    .trim()
    .replace(/\u001d/g, '')
    .replace(/\u0000/g, '');
}

/**
 * Эвристика: код маркировки ASL Belgisi (DataMatrix), а не обычный штрихкод EAN.
 */
export function isPharmacyMarkingCode(raw) {
  const code = normalizePharmacyMarkingCode(raw);
  if (!code) return false;

  // GS1 separator в сыром скане
  if (String(raw).includes('\u001d')) return true;

  // Типичный EAN-8/13/14 — не маркировка
  if (/^\d{8}$/.test(code) || /^\d{12,14}$/.test(code)) return false;

  // GS1 AI «01» + GTIN 14 цифр
  if (/^01\d{14}/.test(code)) return true;

  // Длинный криптокод КМ
  if (code.length >= 24 && /[A-Za-z0-9]/.test(code)) return true;

  return false;
}

/** Извлечь GTIN из GS1-строки маркировки. */
export function extractGtinFromMarkingCode(raw) {
  const code = normalizePharmacyMarkingCode(raw);
  const aiMatch = code.match(/^01(\d{14})/);
  if (aiMatch) return aiMatch[1];

  const digits = code.replace(/\D/g, '');
  if (digits.length >= 14) {
    return digits.slice(0, 14);
  }
  return null;
}
