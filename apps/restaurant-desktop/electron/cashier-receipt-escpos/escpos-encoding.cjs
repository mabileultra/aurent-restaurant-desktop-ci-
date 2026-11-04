/**
 * Кодировка ESC/POS по языку кассы (ru / uz с фронта).
 * Xprinter/POS-80: выход из китайского двухбайтового режима перед печатью.
 */
const { CharacterSet } = require('node-thermal-printer');
const { hasCyrillic, transliterateCyrillicToLatin } = require('./escpos-transliterate.cjs');

/** FS . — отмена китайского (GBK) режима на многих Xprinter. */
const EXIT_CHINESE_MODE = Buffer.from([0x1c, 0x2e]);
/** ESC t 17 — PC866 (Cyrillic #2) на Epson-совместимых. */
const SELECT_PC866 = Buffer.from([0x1b, 0x74, 0x11]);
/** ESC t 16 — WPC1252. */
const SELECT_WPC1252 = Buffer.from([0x1b, 0x74, 0x10]);

const APOSTROPHE_LIKE = /[\u02BB\u02BC\u2018\u2019\u02BF\u0060]/g;

/**
 * @param {string|undefined} raw — i18n.language: ru, uz, ru-RU…
 * @returns {'ru'|'uz'}
 */
function normalizeLocale(raw) {
  const lang = String(raw || 'ru').toLowerCase().split('-')[0];
  return lang === 'uz' ? 'uz' : 'ru';
}

/**
 * Таблица символов принтера по языку интерфейса.
 * ru → PC866; uz без кириллицы → WPC1252; uz с кириллицей в payload → PC866.
 * @param {'ru'|'uz'} locale
 * @param {boolean} [payloadHasCyrillic]
 */
function resolveCharacterSet(locale, payloadHasCyrillic = false) {
  if (locale === 'uz' && !payloadHasCyrillic) {
    return CharacterSet.WPC1252;
  }
  return CharacterSet.PC866_CYRILLIC2;
}

/**
 * Нормализует строку под выбранную code page принтера.
 * На uz + кириллица: транслит в латиницу (Xprinter иначе печатает «китайские» глифы).
 * @param {unknown} text
 * @param {'ru'|'uz'} locale
 */
function normalizePrintText(text, locale) {
  if (text == null) return '';
  let s = String(text);
  if (locale === 'uz') {
    s = transliterateCyrillicToLatin(s);
    s = s
      .replace(APOSTROPHE_LIKE, "'")
      .replace(/\u2013|\u2014/g, '-')
      .replace(/\u2026/g, '...');
  }
  return s;
}

/**
 * @param {unknown} value
 * @param {'ru'|'uz'} locale
 */
function sanitizeValue(value, locale) {
  if (typeof value === 'string') {
    return normalizePrintText(value, locale);
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, locale));
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = sanitizeValue(nested, locale);
    }
    return out;
  }
  return value;
}

function payloadContainsCyrillic(payload) {
  try {
    return hasCyrillic(JSON.stringify(payload || {}));
  } catch {
    return false;
  }
}

/**
 * Подготавливает payload: locale + безопасные строки для принтера.
 * @param {object} payload
 */
function sanitizePayloadForPrint(payload) {
  const locale = normalizeLocale(payload?.locale);
  return {
    ...payload,
    locale,
    sale: sanitizeValue(payload?.sale, locale),
    branding: sanitizeValue(payload?.branding, locale),
    labels: sanitizeValue(payload?.labels, locale),
    receiptFields: payload?.receiptFields,
  };
}

/**
 * Команды в начале чека после clear().
 * @param {import('node-thermal-printer').printer} printer
 * @param {'ru'|'uz'} [locale]
 */
function preparePrinterEncoding(printer, locale = 'ru') {
  printer.append(EXIT_CHINESE_MODE);
  printer.append(locale === 'uz' ? SELECT_WPC1252 : SELECT_PC866);
}

module.exports = {
  normalizeLocale,
  resolveCharacterSet,
  normalizePrintText,
  sanitizePayloadForPrint,
  preparePrinterEncoding,
  payloadContainsCyrillic,
  EXIT_CHINESE_MODE,
};
