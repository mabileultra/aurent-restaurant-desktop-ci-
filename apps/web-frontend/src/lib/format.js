/**
 * Aurent Admin — formatlash funksiyalari.
 * Talablar:
 * - Bo‘shliq: U+00A0 (bo‘linmas bo‘shliq / NBSP)
 * - So‘m: U+2018 belgisi («so‘m»)
 * - Bo‘sh/noto‘g‘ri qiymatlar: «—»
 */

const NBSP = '\u00A0';
const SO_M = `so\u2018m`;
const DASH = '—';
const TIMEZONE = 'Asia/Tashkent';

const MONTH_NAMES = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

const MONTH_NAMES_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

const tashkentDtf = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function parseValidNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' && val.trim() === '') return null;
  const num = Number(val);
  if (Number.isNaN(num)) return null;
  return num;
}

function groupThousands(numStr) {
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

function cleanDecimals(valStr) {
  return valStr.replace(/0+$/, '').replace(/,$/, '');
}

/**
 * formatSum(n) — 512400 -> "512 400 so‘m"
 */
export function formatSum(n) {
  const num = parseValidNumber(n);
  if (num === null) return DASH;

  const isNeg = num < 0;
  const abs = Math.abs(num);
  const rounded = Math.round(abs);
  const grouped = groupThousands(String(rounded));
  const sign = isNeg ? '-' : '';

  return `${sign}${grouped}${NBSP}${SO_M}`;
}

/**
 * formatShort(n) — qisqartirilgan summalar:
 * - ≥1e12      -> "1,5 trln so‘m"
 * - 4705580191 -> "4,71 mlrd so‘m"
 * - 512439000  -> "512,4 mln so‘m"
 * - 25749      -> "26 ming so‘m"
 * - 1500       -> "1,5 ming so‘m" (10 mingdan kichik bo'lsa 1 o'nlik)
 * - 850        -> "850 so‘m"
 */
export function formatShort(n) {
  const num = parseValidNumber(n);
  if (num === null) return DASH;

  const isNeg = num < 0;
  const abs = Math.abs(num);
  const sign = isNeg ? '-' : '';

  if (abs >= 999_950_000_000) {
    const val = abs / 1e12;
    const decimals = val < 10 ? 2 : 1;
    const str = cleanDecimals(val.toFixed(decimals).replace('.', ','));
    return `${sign}${str}${NBSP}trln${NBSP}${SO_M}`;
  }

  if (abs >= 999_950_000) {
    const val = abs / 1e9;
    const decimals = val < 10 ? 2 : 1;
    const str = cleanDecimals(val.toFixed(decimals).replace('.', ','));
    return `${sign}${str}${NBSP}mlrd${NBSP}${SO_M}`;
  }

  if (abs >= 999_950) {
    const val = abs / 1e6;
    const decimals = val < 10 ? 2 : 1;
    const str = cleanDecimals(val.toFixed(decimals).replace('.', ','));
    return `${sign}${str}${NBSP}mln${NBSP}${SO_M}`;
  }

  if (abs >= 999.5) {
    if (abs < 9950) {
      const val = abs / 1e3;
      const str = cleanDecimals(val.toFixed(1).replace('.', ','));
      return `${sign}${str}${NBSP}ming${NBSP}${SO_M}`;
    }
    const val = Math.round(abs / 1e3);
    return `${sign}${val}${NBSP}ming${NBSP}${SO_M}`;
  }

  return `${sign}${Math.round(abs)}${NBSP}${SO_M}`;
}

/**
 * formatPercent(n) — 24.31 -> "24,3%"
 */
export function formatPercent(n) {
  const num = parseValidNumber(n);
  if (num === null) return DASH;

  const str = num.toFixed(1).replace('.', ',');
  return `${str}%`;
}

/**
 * formatDate(d, variant) — "9-noyabr, 2026" yoki "9-noy"
 * - Sof sana ("YYYY-MM-DD") kelsa o'zgarishsiz olinadi.
 * - Vaqt bilan kelsa (ISO string, timestamp, Date) Asia/Tashkent bo'yicha hisoblanadi.
 */
export function formatDate(d, variant = 'full') {
  if (d === null || d === undefined || d === '') return DASH;

  let day;
  let monthIdx;
  let year;

  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
    const parts = d.trim().split('-');
    year = Number(parts[0]);
    monthIdx = Number(parts[1]) - 1;
    day = Number(parts[2]);
  } else {
    const dateObj = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dateObj.getTime())) return DASH;

    const parts = tashkentDtf.formatToParts(dateObj);
    for (const p of parts) {
      if (p.type === 'year') year = Number(p.value);
      if (p.type === 'month') monthIdx = Number(p.value) - 1;
      if (p.type === 'day') day = Number(p.value);
    }
  }

  if (monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) {
    return DASH;
  }

  if (variant === 'short') {
    const shortMonth = MONTH_NAMES_SHORT[monthIdx];
    return `${day}-${shortMonth}`;
  }

  const fullMonth = MONTH_NAMES[monthIdx];
  return `${day}-${fullMonth},${NBSP}${year}`;
}

/**
 * formatAny(val) — null/undefined/NaN -> "—"
 */
export function formatAny(val) {
  if (val === null || val === undefined || Number.isNaN(val) || val === '') {
    return DASH;
  }
  return String(val);
}
