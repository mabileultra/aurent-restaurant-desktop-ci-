import { CARD_CATEGORY, OFD_CARD_TYPE_CODE } from '@aurent/shared-types';

const CATEGORY_BY_CODE = Object.freeze({
  1: CARD_CATEGORY.CORPORATE,
  2: CARD_CATEGORY.PERSONAL,
  3: CARD_CATEGORY.SOCIAL,
});

const MASK_MIDDLE = '********';

/**
 * Приводит категорию карты (строку или числовой код ОФД 1/2/3) к CARD_CATEGORY.
 * @param {unknown} value
 * @returns {'CORPORATE' | 'PERSONAL' | 'SOCIAL' | null}
 */
export function normalizeCardCategory(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && CATEGORY_BY_CODE[value]) {
    return CATEGORY_BY_CODE[value];
  }
  const key = String(value).trim().toUpperCase();
  if (key === '1' || key === '2' || key === '3') {
    return CATEGORY_BY_CODE[Number(key)] || null;
  }
  if (
    key === CARD_CATEGORY.CORPORATE ||
    key === CARD_CATEGORY.PERSONAL ||
    key === CARD_CATEGORY.SOCIAL
  ) {
    return key;
  }
  return null;
}

/**
 * Преобразует категорию карты в числовой код ОФД (1 = Корпоративная, 2 = Личная, 3 = Социальная).
 * @param {unknown} value
 * @returns {1 | 2 | 3 | null}
 */
export function toOfdCardTypeCode(value) {
  const category = normalizeCardCategory(value);
  return category ? OFD_CARD_TYPE_CODE[category] ?? null : null;
}

/**
 * Очищает RRN (Reference Retrieval Number): убирает пробелы и дефисы.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeRrn(value) {
  if (value == null) return null;
  const cleaned = String(value)
    .trim()
    .replace(/[\s-]+/g, '');
  return cleaned || null;
}

/**
 * Проверяет, состоит ли RRN ровно из 12 цифр (после очистки пробелов и дефисов).
 * Значения с буквами, спецсимволами или длиной != 12 отклоняются.
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidRrn(value) {
  if (value == null) return false;
  const cleaned = normalizeRrn(value);
  return cleaned !== null && /^\d{12}$/.test(cleaned);
}

function stripTerminalPanSuffix(raw) {
  // На слип-чеках HUMO/UZCARD встречается хвост последовательности карты, напр. «986003******8031:01».
  return String(raw).trim().replace(/:\d{1,2}$/, '');
}

/**
 * Маскирует номер социальной карты, оставляя видимыми первые 4 и последние 4 цифры.
 * Поддерживает как полный номер (16+ цифр), так и уже маскированный со слип-чека терминала.
 * @param {unknown} value
 * @returns {string | null}
 */
export function maskSocialCardNumber(value) {
  if (value == null) return null;
  const cleaned = stripTerminalPanSuffix(value).replace(/[\s-]+/g, '');
  if (!cleaned) return null;

  const maskMatch = cleaned.match(/^(\d+)[^0-9]+(\d+)$/);
  if (maskMatch) {
    const head = maskMatch[1];
    const tail = maskMatch[2];
    if (head.length < 4 || tail.length < 4) return null;
    return `${head.slice(0, 4)}${MASK_MIDDLE}${tail.slice(-4)}`;
  }

  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 8) return null;
  return `${digits.slice(0, 4)}${MASK_MIDDLE}${digits.slice(-4)}`;
}

/**
 * Проверяет корректность введённого номера социальной карты (достаточно для маски 4+4).
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidSocialCardInput(value) {
  return maskSocialCardNumber(value) !== null;
}

/**
 * Извлекает нормализованные платёжные реквизиты карты из объекта payment или sale.
 * @param {object | null | undefined} source
 */
export function extractCardReceiptDetails(source) {
  if (!source || typeof source !== 'object') {
    return {
      cardCategory: null,
      cardTypeCode: null,
      rrn: null,
      socialCardNumber: null,
    };
  }

  const cardCategory = normalizeCardCategory(
    source.cardCategory ?? source.cardKind ?? source.ofdCardType ?? source.cardType,
  );
  const rrn = normalizeRrn(source.rrn ?? source.pptId ?? source.PPTID ?? source.cardRrn);
  const socialCardNumber = maskSocialCardNumber(
    source.socialCardNumber ?? source.socialCardMasked ?? source.cardNumber ?? source.CardNumber,
  );

  return {
    cardCategory,
    cardTypeCode: toOfdCardTypeCode(cardCategory),
    rrn,
    socialCardNumber,
  };
}

/**
 * Обогащает объект продажи реквизитами карты с клиента (для немедленной печати, пока бэк их не возвращает).
 * @param {object | null | undefined} sale
 * @param {object | null | undefined} payment
 */
export function withCardReceiptDetails(sale, payment) {
  if (!sale || typeof sale !== 'object') return sale;
  const fromSale = extractCardReceiptDetails(sale);
  const fromPayment = extractCardReceiptDetails(payment);

  const cardCategory = fromSale.cardCategory || fromPayment.cardCategory || null;
  const rrn = fromSale.rrn || fromPayment.rrn || null;
  const socialCardNumber = fromSale.socialCardNumber || fromPayment.socialCardNumber || null;

  if (!cardCategory && !rrn && !socialCardNumber) return sale;
  return {
    ...sale,
    ...(cardCategory ? { cardCategory } : {}),
    ...(rrn ? { rrn } : {}),
    ...(socialCardNumber ? { socialCardNumber } : {}),
  };
}

/**
 * Формирует поля банковской/социальной карты для запроса Multikassa (POST /api/v1/operations).
 * TODO(teamlead): подтвердить точные имена ключей агента Multikassa (card_type, ppt_id, card_number).
 * @param {object | null | undefined} payment
 * @param {number} receivedCard
 * @returns {Record<string, string | number>}
 */
export function buildMultikassaCardFields(payment, receivedCard = 0) {
  const { cardTypeCode, rrn, socialCardNumber } = extractCardReceiptDetails(payment);
  if (Number(receivedCard) <= 0 && !cardTypeCode && !rrn && !socialCardNumber) {
    return {};
  }
  const fields = {};
  if (cardTypeCode != null) fields.card_type = cardTypeCode;
  if (rrn) fields.ppt_id = rrn;
  if (socialCardNumber) fields.card_number = socialCardNumber;
  return fields;
}

/**
 * Формирует поля банковской/социальной карты по стандарту ОФД ГНК / FiscalDriveService.
 * @param {object | null | undefined} payment
 * @param {number} receivedCard
 * @returns {Record<string, string | number>}
 */
export function buildFiscalDriveCardFields(payment, receivedCard = 0) {
  const { cardTypeCode, rrn, socialCardNumber } = extractCardReceiptDetails(payment);
  if (Number(receivedCard) <= 0 && !cardTypeCode && !rrn && !socialCardNumber) {
    return {};
  }
  const fields = {};
  if (cardTypeCode != null) fields.CardType = cardTypeCode;
  if (rrn) fields.PPTID = rrn;
  if (socialCardNumber) fields.CardNumber = socialCardNumber;
  return fields;
}
