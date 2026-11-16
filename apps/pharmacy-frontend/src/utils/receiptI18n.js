import i18n from '../i18n/config';
import uzDictionary from '../locales/uz.json';

export const RECEIPT_LOCALE = 'uz';

/**
 * Kalit bo'yicha uzDictionary dan qiymatni qidirish (masalan: 'fiscalReceipt.cash').
 */
function lookupUzKey(key) {
  if (!key) return null;
  const parts = String(key).split('.');
  let curr = uzDictionary;
  for (const part of parts) {
    if (curr && typeof curr === 'object' && part in curr) {
      curr = curr[part];
    } else {
      return null;
    }
  }
  return typeof curr === 'string' ? curr : null;
}

/**
 * Cheklar uchun majburiy Davlat tili (o'zbek tili) tarjima funksiyasi.
 * Interfeys tili qanday bo'lishidan qat'i nazar, cheklar doimo o'zbek tilida chiqadi.
 *
 * @param {string} key
 * @param {object} [opts]
 * @returns {string}
 */
export function translateReceiptUz(key, opts = {}) {
  // 1. Agar i18n ning o'zbekcha tarjimoni tayyor bo'lsa, undan tekshiramiz
  if (typeof i18n?.getFixedT === 'function') {
    const fixedT = i18n.getFixedT(RECEIPT_LOCALE);
    const val = fixedT(key, opts);
    if (val && val !== key) {
      return val;
    }
  }

  // 2. Kafolatlangan sinxron lug'atdan qidirish
  let raw = lookupUzKey(key);
  if (!raw && opts?.defaultValue) {
    raw = opts.defaultValue;
  }
  if (!raw) {
    return key;
  }

  if (opts && typeof opts === 'object') {
    for (const [k, v] of Object.entries(opts)) {
      raw = raw.replaceAll(`{{${k}}}`, String(v));
    }
  }
  return raw;
}

/**
 * Cheklar uchun tarjimonni qaytaradi.
 * @returns {Function}
 */
export function getReceiptTranslator() {
  return translateReceiptUz;
}
