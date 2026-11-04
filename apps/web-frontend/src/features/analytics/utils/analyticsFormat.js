const BILLION = 1e9;
const MILLION = 1e6;
const THOUSAND = 1e3;
const TRILLION = 1e12;

export function fmtNum(val) {
  if (val == null || Number.isNaN(Number(val))) return '—';
  return Number(val).toLocaleString('ru-RU');
}

export function fmtMoney(val, options = {}) {
  if (val == null || Number.isNaN(Number(val))) return '—';
  const num = Number(val);
  const abs = Math.abs(num);
  const { showCurrency = true, compact = true } = options;
  const suffix = showCurrency ? ' so‘m' : '';

  if (compact) {
    if (abs >= TRILLION) {
      return `${(num / TRILLION).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} trln${suffix}`;
    }
    if (abs >= BILLION) {
      return `${(num / BILLION).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} mlrd${suffix}`;
    }
    if (abs >= MILLION) {
      return `${(num / MILLION).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} mln${suffix}`;
    }
  }

  return `${num.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}${suffix}`;
}

export function fmtPercent(val, includePlus = false) {
  if (val == null || Number.isNaN(Number(val))) return '—';
  const num = Number(val);
  const prefix = includePlus && num > 0 ? '+' : '';
  return `${prefix}${num.toLocaleString('ru-RU', { maximumFractionDigits: 1 })}%`;
}

export function fmtQty(val) {
  if (val == null || Number.isNaN(Number(val))) return '—';
  return Number(val).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

const MONTH_NAMES_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

const WEEKDAY_NAMES_UZ = [
  'yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba',
];

export function fmtDayFull(iso) {
  if (!iso || typeof iso !== 'string') return '—';
  const parts = iso.split('-').map(Number);
  if (parts.length < 3 || Number.isNaN(parts[0])) return iso;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = parts[2];
  const month = MONTH_NAMES_UZ[parts[1] - 1] || '';
  const weekday = WEEKDAY_NAMES_UZ[d.getDay()] || '';
  return `${day}-${month}, ${weekday}`;
}

export function fmtDayShort(iso) {
  if (!iso || typeof iso !== 'string') return '—';
  const parts = iso.split('-').map(Number);
  if (parts.length < 3 || Number.isNaN(parts[0])) return iso;
  const day = parts[2];
  const month = (MONTH_NAMES_UZ[parts[1] - 1] || '').slice(0, 3);
  return `${day}-${month}`;
}
