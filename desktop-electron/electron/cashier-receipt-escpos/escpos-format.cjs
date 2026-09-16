/** Форматирование сумм/дат/QR для ESC/POS (без Vite env — branding в payload). */

/**
 * Деньги: 2 знака, пробелы тысяч.
 * @param {number|string} value
 * @returns {string}
 */
function fmtMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Сумма для узкой колонки tableCustom (без пробелов в тысячах).
 * С пробелами «24 000.00» не помещается в width 0.3 — дробная часть уезжает на новую строку как «00».
 * @param {number|string} value
 * @returns {string}
 */
function fmtMoneyTable(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

/**
 * Количество без лишних нулей.
 * @param {number|string} value
 * @returns {string}
 */
function fmtQty(value, saleType) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  if (saleType === 'WEIGHT') {
    const s = n.toFixed(3).replace(/\.?0+$/, '') || '0';
    return `${s} kg`;
  }
  if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 0.0005) {
    return String(Math.round(n));
  }
  return n.toFixed(3).replace(/\.?0+$/, '');
}

/**
 * Дата и время чека из ISO.
 * @param {string} iso
 * @returns {{ date: string, time: string }}
 */
function splitDateTime(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      date: `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    };
  } catch {
    return { date: '—', time: '—' };
  }
}

/**
 * Фискальный признак: сначала реальный Multikassa/ГНК, иначе локальный hash (тест/офлайн).
 * @param {object} sale
 * @returns {string}
 */
function buildFiscalSign(sale) {
  const fromModule = String(sale?.fiscalSign || '').trim();
  if (fromModule && !/^MK-/i.test(fromModule) && !/^LOCAL-/i.test(fromModule)) {
    return fromModule;
  }
  const base = `${sale?.receiptNumber}|${sale?.id}|${sale?.totalAmount}|${sale?.createdAt}`;
  let h = 0;
  for (let i = 0; i < base.length; i += 1) {
    h = (Math.imul(31, h) + base.charCodeAt(i)) >>> 0;
  }
  return String(h % 1_000_000_000_000).padStart(12, '0');
}

/**
 * Строка для QR на чеке.
 * Приоритет: официальный fiscalQrUrl от Multikassa → qrBase → синтетика.
 * @param {object} sale
 * @param {string} [qrBase] — опционально из payload.branding.qrBase
 * @returns {string}
 */
function buildQrPayload(sale, _qrBase) {
  const fromModule = String(sale?.fiscalQrUrl || '').trim();
  if (/ofd\.soliq\.uz\/(check|epi)\?/i.test(fromModule) && /[?&]t=/i.test(fromModule) && /[?&]s=/i.test(fromModule)) {
    return fromModule;
  }
  const t = String(sale?.fiscalTerminalId || '').trim();
  const r = String(sale?.fiscalReceiptSeq || '').trim();
  const s = String(sale?.fiscalSign || '').trim();
  if (!t || !r || !s || /^(MK-\d+|LOCAL-)/i.test(s)) return '';
  const rawTime = sale?.fiscalizedAt || sale?.createdAt || '';
  const digits = String(rawTime).replace(/\D/g, '');
  let c = digits.length >= 14 ? digits.slice(0, 14) : '';
  if (!c && rawTime) {
    const parsed = new Date(String(rawTime).includes('T') ? rawTime : String(rawTime).replace(' ', 'T'));
    if (!Number.isNaN(parsed.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      c =
        `${parsed.getFullYear()}${pad(parsed.getMonth() + 1)}${pad(parsed.getDate())}` +
        `${pad(parsed.getHours())}${pad(parsed.getMinutes())}${pad(parsed.getSeconds())}`;
    }
  }
  if (!c) return '';
  return `https://ofd.soliq.uz/check?t=${encodeURIComponent(t)}&r=${encodeURIComponent(r)}&c=${encodeURIComponent(c)}&s=${encodeURIComponent(s)}`;
}

/**
 * НДС по строке (если нет taxAmount в sale item).
 * @param {object} item
 * @returns {number}
 */
function lineVatAmount(item) {
  const stored = Number(item?.taxAmount);
  if (Number.isFinite(stored) && stored >= 0.001) return stored;
  const rate = item?.taxRatePercent != null ? Number(item.taxRatePercent) : 12;
  const lineTotal = Number(item?.lineTotal) || 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return (lineTotal * rate) / (100 + rate);
}

/**
 * dd.MM.yyyy HH:mm из ISO.
 * @param {string|Date|null|undefined} iso
 * @returns {string}
 */
/**
 * Подстановка {{key}} из i18n-шаблонов (main без i18n).
 * @param {string} template
 * @param {Record<string, string|number>} vars
 */
function interpolateLabel(template, vars = {}) {
  let s = String(template || '');
  for (const [key, val] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), String(val));
  }
  return s;
}

/**
 * Ставка НДС для итога чека (как FiscalReceiptBody).
 * @param {object} sale
 * @returns {string}
 */
function saleVatRateLabel(sale) {
  const rates = new Set(
    (sale?.items || [])
      .map((i) => (i.taxRatePercent != null ? Number(i.taxRatePercent) : 12))
      .filter((r) => Number.isFinite(r) && r > 0),
  );
  return rates.size === 1 ? String([...rates][0]) : '—';
}

function fmtAt(iso) {
  if (!iso) return '—';
  try {
    const d = iso instanceof Date ? iso : new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '—';
  }
}

module.exports = {
  fmtMoney,
  fmtMoneyTable,
  fmtQty,
  splitDateTime,
  buildFiscalSign,
  buildQrPayload,
  lineVatAmount,
  interpolateLabel,
  saleVatRateLabel,
  fmtAt,
};
