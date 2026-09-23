/** Нормализация кода маркировки (DataMatrix / КМ). */
export function normalizePharmacyMarkingCode(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/^\uFEFF/, '')
    .trim()
    // AIM prefix ]d2 / ]C1 …
    .replace(/^\][A-Za-z0-9]{2}/, '')
    // GS / FNC1: сканеры часто отдают как \u001d, либо как € / ¦ на раскладке
    .replace(/\u001d/g, '')
    .replace(/\u001e/g, '')
    .replace(/\u0000/g, '')
    .replace(/€/g, '')
    .replace(/¦/g, '')
    .replace(/\u00a4/g, '') // ¤
    .trim();
}

/**
 * Эвристика: код маркировки ASL Belgisi (DataMatrix / QR КМ), а не EAN и не ИКПУ/МХИК.
 * В ASL уходит именно этот КМ (`codes`), никогда поле ikpu карточки.
 */
export function isPharmacyMarkingCode(raw) {
  const code = normalizePharmacyMarkingCode(raw);
  if (!code) return false;

  const lower = code.toLowerCase().replace(/ё/g, 'е');
  // Флаг Didox на фактуре — не DataMatrix
  if (lower.includes('маркировкаланган') || lower.includes('markirovkalangan')) {
    return false;
  }

  // ИКПУ/МХИК: ровно 14–17 цифр без серии/криптохвоста
  if (/^\d{14,17}$/.test(code)) return false;

  const source = String(raw);
  // GS1 separator в сыром скане (или € вместо GS) — типичный DataMatrix
  if (source.includes('\u001d') || source.includes('€')) return true;

  // Типичный EAN-8/13 — не маркировка (14 уже отсекли выше как возможный GTIN/ИКПУ)
  if (/^\d{8}$/.test(code) || /^\d{12,13}$/.test(code)) return false;

  // GS1 КМ: AI 01 + GTIN14 + AI 21 (серия). Одних «01+14 цифр» мало — так выглядит и МХИК.
  if (/01\d{14}21/.test(code) || /\(01\)\d{14}\(21\)/.test(code)) return true;

  // Длинный криптокод КМ (латиница + цифры)
  if (code.length >= 20 && /[A-Za-z]/.test(code) && /\d/.test(code)) return true;
  if (code.length >= 25 && /[A-Za-z0-9]/.test(code)) return true;

  return false;
}

/** Код достаточно полный, чтобы автоматом отправить в чек (без Enter). */
export function isCompletePharmacyMarkingScan(raw) {
  if (!isPharmacyMarkingCode(raw)) return false;
  const code = normalizePharmacyMarkingCode(raw);
  if (code.length >= 25) return true;
  // 01 + GTIN14 + 21 + serial (≥4)
  if (/01\d{14}21[0-9A-Za-z]{4,}/.test(code)) return true;
  if (/\(01\)\d{14}\(21\)[^()]{4,}/.test(code)) return true;
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

export function barcodeLookupVariants(gtin) {
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
    barcodeLookupVariants(gtin).forEach((item) => variants.add(item));
  }
  return [...variants];
}
