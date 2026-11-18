/**
 * Номер электронного рецепта для чеков с рецептурными препаратами (AUR-3).
 * Чистые функции: корзина и оплата передаются аргументами.
 */

export const PRESCRIPTION_NUMBER_MIN_LENGTH = 4;
export const PRESCRIPTION_NUMBER_MAX_LENGTH = 64;

/** Код ошибки продажи без номера рецепта (последний рубеж перед фискализацией). */
export const PRESCRIPTION_NUMBER_REQUIRED_CODE = 'PRESCRIPTION_NUMBER_REQUIRED';

/** Причины, по которым номер не принят. */
export const PRESCRIPTION_NUMBER_ISSUE = Object.freeze({
  MISSING: 'missing',
  INVALID: 'invalid',
});

/** Буквы (любой алфавит), цифры, «-» и «/». */
const PRESCRIPTION_NUMBER_PATTERN = new RegExp(
  `^[\\p{L}\\p{N}/-]{${PRESCRIPTION_NUMBER_MIN_LENGTH},${PRESCRIPTION_NUMBER_MAX_LENGTH}}$`,
  'u',
);

/** Типы чека, для которых номер рецепта не запрашивается (возврат). */
const PRESCRIPTION_EXEMPT_RECEIPT_TYPES = Object.freeze(['RETURN', 'REFUND']);

const PRESCRIPTION_ATTRIBUTE_KEYS = Object.freeze([
  'requires_prescription',
  'requiresPrescription',
  'prescription_required',
  'prescriptionRequired',
  'rx_required',
  'rxRequired',
  'рецепт',
]);

const PRESCRIPTION_TRUE_VALUES = Object.freeze(['1', 'true', 'yes', 'да', 'rx', 'рецепт']);

/**
 * @param {unknown} value
 * @returns {string} номер без пробелов по краям; пустая строка, если номера нет
 */
export function normalizePrescriptionNumber(value) {
  if (value == null) return '';
  return String(value).trim();
}

/**
 * @param {unknown} value
 * @returns {{ ok: true, value: string } | { ok: false, issue: 'missing' | 'invalid' }}
 */
export function validatePrescriptionNumber(value) {
  const normalized = normalizePrescriptionNumber(value);
  if (!normalized) return { ok: false, issue: PRESCRIPTION_NUMBER_ISSUE.MISSING };
  if (!PRESCRIPTION_NUMBER_PATTERN.test(normalized)) {
    return { ok: false, issue: PRESCRIPTION_NUMBER_ISSUE.INVALID };
  }
  return { ok: true, value: normalized };
}

/** i18n-ключ текста ошибки для причины отказа (тексты есть в uz и ru). */
export function prescriptionIssueMessageKey(issue) {
  return issue === PRESCRIPTION_NUMBER_ISSUE.INVALID
    ? 'pos.prescriptionInvalidFormat'
    : 'pos.prescriptionRequiredBeforePay';
}

export function isValidPrescriptionNumber(value) {
  return validatePrescriptionNumber(value).ok;
}

function isTruthyFlag(value) {
  if (value === true || value === 1) return true;
  if (value == null || value === false) return false;
  return PRESCRIPTION_TRUE_VALUES.includes(String(value).trim().toLowerCase());
}

/**
 * Товар или строка чека — рецептурный препарат.
 * Источники флага: строка корзины, атрибуты карточки, retailExtras (pharmacy-service).
 */
export function lineRequiresPrescription(productOrLine) {
  if (!productOrLine) return false;
  const attributes = productOrLine.attributes;
  if (attributes && typeof attributes === 'object') {
    const attributeKey = PRESCRIPTION_ATTRIBUTE_KEYS.find(
      (key) => attributes[key] != null && String(attributes[key]).trim() !== '',
    );
    if (attributeKey) return isTruthyFlag(attributes[attributeKey]);
  }
  const directKey = PRESCRIPTION_ATTRIBUTE_KEYS.find(
    (key) => productOrLine[key] != null && String(productOrLine[key]).trim() !== '',
  );
  if (directKey) return isTruthyFlag(productOrLine[directKey]);
  const extras = productOrLine.retailExtras;
  return isTruthyFlag(extras?.pharmacyPrescriptionRequired ?? extras?.requiresPrescription);
}

export function cartPrescriptionLines(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(lineRequiresPrescription);
}

export function cartHasPrescriptionRequiredItems(items) {
  return cartPrescriptionLines(items).length > 0;
}

/**
 * Перед оплатой: чек с рецептурными препаратами обязан иметь корректный номер рецепта.
 * @returns {{ ok: true } | { ok: false, issue: 'missing' | 'invalid', count: number }}
 */
export function assertCartPrescriptionReady(items, prescriptionNumber) {
  const prescriptionLines = cartPrescriptionLines(items);
  if (prescriptionLines.length === 0) return { ok: true };
  const validation = validatePrescriptionNumber(prescriptionNumber);
  if (validation.ok) return { ok: true };
  return { ok: false, issue: validation.issue, count: prescriptionLines.length };
}

/**
 * Номер, который должен попасть на чек. Без рецептурных позиций номер не передаётся,
 * даже если остался в корзине от удалённой строки.
 * @returns {string | null}
 */
export function resolveCartPrescriptionNumber(items, prescriptionNumber) {
  if (!cartHasPrescriptionRequiredItems(items)) return null;
  const validation = validatePrescriptionNumber(prescriptionNumber);
  return validation.ok ? validation.value : null;
}

/** Возврат не требует номера рецепта. */
export function isPrescriptionExemptPayment(payment) {
  const receiptType = String(payment?.receiptType || '').trim().toUpperCase();
  return PRESCRIPTION_EXEMPT_RECEIPT_TYPES.includes(receiptType);
}

/**
 * Последний рубеж перед продажей (онлайн и офлайн, любой способ оплаты, включая долг и аванс):
 * рецептурный препарат без номера рецепта не пробивается.
 * @throws {Error & { code: 'PRESCRIPTION_NUMBER_REQUIRED' }}
 */
export function assertSalePrescriptionNumber(items, payment) {
  if (isPrescriptionExemptPayment(payment)) return;
  if (assertCartPrescriptionReady(items, payment?.prescriptionNumber).ok) return;
  const error = new Error(PRESCRIPTION_NUMBER_REQUIRED_CODE);
  error.code = PRESCRIPTION_NUMBER_REQUIRED_CODE;
  throw error;
}

/** Номер рецепта продажи для чека (значение, прикреплённое фронтендом к ответу продажи). */
export function resolveSalePrescriptionNumber(sale) {
  return normalizePrescriptionNumber(sale?.prescriptionNumber) || null;
}

/**
 * Прикрепляет номер рецепта из оплаты к ответу продажи — чек печатается из этого объекта.
 * В запрос к backend номер пока не уходит (поле появится отдельной задачей).
 */
export function withSalePrescriptionNumber(sale, payment) {
  if (!sale) return sale;
  const prescriptionNumber = normalizePrescriptionNumber(payment?.prescriptionNumber);
  if (!prescriptionNumber) return sale;
  return { ...sale, prescriptionNumber };
}
