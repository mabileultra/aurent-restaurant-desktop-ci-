/** Нормализация кода маркировки (DataMatrix / КМ). */
export function normalizePharmacyMarkingCode(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/^\][A-Za-z0-9]{2}/, '')
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

  // GS1 AI «01» + GTIN 14 цифр (в начале или после скобок)
  if (/01\d{14}/.test(code) || /\(01\)\d{14}/.test(code)) return true;

  // Длинный криптокод КМ
  if (code.length >= 20 && /[A-Za-z]/.test(code) && /\d/.test(code)) return true;
  if (code.length >= 24 && /[A-Za-z0-9]/.test(code)) return true;

  return false;
}

/** Ключ для сравнения сканов (один КМ = один ключ). */
export function markingScanKey(raw) {
  return normalizePharmacyMarkingCode(raw)
    .replace(/\s+/g, '')
    .toLowerCase();
}

/** Извлечь GTIN из GS1-строки маркировки. */
export function extractGtinFromMarkingCode(raw) {
  const code = normalizePharmacyMarkingCode(raw);
  if (!code) return null;

  const paren = code.match(/\(01\)(\d{14})/);
  if (paren) return paren[1];

  // AI 01 + 14 цифр — в начале или после мусора сканера
  const aiMatch = code.match(/(?:^|[^0-9])01(\d{14})/);
  if (aiMatch) return aiMatch[1];

  const leading = code.match(/^01(\d{14})/);
  if (leading) return leading[1];

  const digits = code.replace(/\D/g, '');
  if (digits.length >= 8 && digits.length <= 14) {
    return digits;
  }
  // Сканер иногда отдаёт 01+GTIN+хвост только цифрами
  if (digits.length >= 16 && digits.startsWith('01')) {
    return digits.slice(2, 16);
  }
  // Хвост после серии всё ещё цифровой — ищем 01+GTIN внутри digit-only строки
  const embedded = digits.match(/01(\d{14})/);
  if (embedded) return embedded[1];

  return null;
}

function gtinLookupVariants(gtin) {
  const digits = String(gtin ?? '').replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 14) return [];
  const variants = [digits];
  if (digits.length === 14 && digits.startsWith('0')) variants.push(digits.slice(1));
  if (digits.length === 14 && digits.startsWith('00')) variants.push(digits.slice(2));
  if (digits.length === 13) variants.push(`0${digits}`);
  if (digits.length === 12) variants.push(`0${digits}`);
  return variants;
}

/** Короткие штрихкоды, которыми код маркировки может лежать в каталоге. */
export function markingBarcodeCandidates(raw, extraGtins = []) {
  const variants = new Set();
  for (const gtin of [extractGtinFromMarkingCode(raw), ...extraGtins]) {
    gtinLookupVariants(gtin).forEach((item) => variants.add(item));
  }
  return [...variants];
}
