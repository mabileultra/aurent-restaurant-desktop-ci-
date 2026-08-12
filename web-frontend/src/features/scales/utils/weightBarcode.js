/**
 * Весовой EAN-13: 20 + PLU(5) + граммы(5) + check.
 * Независимо от модели весов — общий формат этикетки.
 */

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

export function normalizePlu(raw) {
  const digits = digitsOnly(raw);
  if (!digits || digits.length > 5) return null;
  const normalized = digits.replace(/^0+(?!$)/, '');
  return normalized || null;
}

export function ean13CheckDigit(twelveDigits) {
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    const d = Number(twelveDigits[i]);
    sum += i % 2 === 0 ? d : d * 3;
  }
  return String((10 - (sum % 10)) % 10);
}

export function encodeWeightBarcode(plu, weightKg) {
  const normalized = normalizePlu(plu);
  if (!normalized) {
    throw new Error('Invalid PLU');
  }
  const kg = Number(weightKg);
  if (!Number.isFinite(kg) || kg <= 0) {
    throw new Error('Invalid weight');
  }
  const grams = Math.round(kg * 1000);
  if (grams < 1 || grams > 99999) {
    throw new Error('Weight out of range');
  }
  const body = `20${normalized.padStart(5, '0')}${String(grams).padStart(5, '0')}`;
  return `${body}${ean13CheckDigit(body)}`;
}

/**
 * @returns {{ plu: string, weightKg: number, barcode: string } | null}
 */
export function decodeWeightBarcode(raw) {
  const digits = digitsOnly(raw);
  if (digits.length !== 13 || digits[0] !== '2') return null;
  const body = digits.slice(0, 12);
  if (ean13CheckDigit(body) !== digits[12]) return null;
  const plu = normalizePlu(digits.slice(2, 7));
  const grams = Number(digits.slice(7, 12));
  if (!plu || grams < 1) return null;
  return {
    plu,
    weightKg: Math.round(grams) / 1000,
    barcode: digits,
  };
}

export function isWeightBarcode(raw) {
  return decodeWeightBarcode(raw) != null;
}
