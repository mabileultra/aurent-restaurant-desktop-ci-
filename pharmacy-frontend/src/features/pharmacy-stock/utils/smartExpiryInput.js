/**
 * Умный ввод срока годности (как в Oson Apteka).
 * Хранение — ISO yyyy-MM-dd, на экране — dd.MM.yyyy.
 */

const MONTHS = {
  янв: 1, январь: 1, января: 1,
  фев: 2, февраль: 2, февраля: 2,
  мар: 3, март: 3, марта: 3,
  апр: 4, апрель: 4, апреля: 4,
  май: 5, мая: 5,
  июн: 6, июнь: 6, июня: 6,
  июл: 7, июль: 7, июля: 7,
  авг: 8, август: 8, августа: 8,
  сен: 9, сент: 9, сентябрь: 9, сентября: 9,
  окт: 10, октябрь: 10, октября: 10,
  ноя: 11, ноябрь: 11, ноября: 11,
  дек: 12, декабрь: 12, декабря: 12,
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
  yan: 1, yanvar: 1,
  fev: 2, fevral: 2,
  aprel: 4,
  iyun: 6,
  iyul: 7,
  avgust: 8,
  sentabr: 9, sentyabr: 9,
  oktabr: 10,
  noyabr: 11,
  dekabr: 12, dek: 12,
};

export function parseSmartExpiryInput(raw, now = new Date()) {
  return interpretExpiry(raw, now)[0]?.iso ?? null;
}

/** Живые подсказки по тому, что уже ввели. */
export function suggestSmartExpiry(raw, now = new Date()) {
  const text = String(raw ?? '').trim();
  if (!text) return [];
  return uniqueByIso(interpretExpiry(text, now)).map((row) => toSuggest(row.sample, row.iso));
}

/** Справка форматов при пустом поле / клике на (i) — как в Oson. */
export function expiryFormatExamples(now = new Date()) {
  const month12 = monthToIso(12, now);
  const rows = [
    ['12', month12],
    ['21', toIso(2100, 1, 1)],
    ['2050', toIso(2050, 1, 1)],
    ['1250', toIso(2050, 12, 1)],
    ['311250', toIso(2050, 12, 31)],
    ['31122050', toIso(2050, 12, 31)],
    ['06.2050', toIso(2050, 6, 1)],
    ['12.50', toIso(2050, 12, 1)],
    ['2050/02/10', toIso(2050, 2, 10)],
    ['01.02.2050', toIso(2050, 2, 1)],
    ['01.02.50', toIso(2050, 2, 1)],
    ['фев 50', toIso(2050, 2, 1)],
    ['Октябрь 50', toIso(2050, 10, 1)],
  ];
  return rows
    .filter(([, iso]) => iso)
    .map(([sample, iso]) => toSuggest(sample, iso));
}

export function formatIsoToDisplay(iso) {
  if (!iso) return '';
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

function interpretExpiry(raw, now) {
  if (raw == null) return [];
  const text = String(raw).trim();
  if (!text) return [];

  const out = [];
  const push = (iso, sample = text) => {
    if (iso) out.push({ iso, sample });
  };

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    push(toIso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])));
    return out;
  }

  const ymd = text.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymd) {
    push(toIso(Number(ymd[1]), Number(ymd[2]), Number(ymd[3])));
  }

  const dmy = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmy) {
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    push(toIso(year, Number(dmy[2]), Number(dmy[1])));
  }

  const my = text.match(/^(\d{1,2})[./-](\d{2,4})$/);
  if (my) {
    let year = Number(my[2]);
    if (year < 100) year += 2000;
    push(toIso(year, Number(my[1]), 1));
  }

  const monthName = text.toLowerCase().replace(/\s+/g, ' ').match(/^([a-zа-яё.]+)\s+(\d{2,4})$/iu);
  if (monthName) {
    const month = MONTHS[monthName[1].replace(/\./g, '').toLowerCase()];
    if (month) {
      let year = Number(monthName[2]);
      if (year < 100) year += 2000;
      push(toIso(year, month, 1));
    }
  }

  const compact = text.replace(/\s/g, '');
  if (/^\d+$/.test(compact)) {
    interpretDigits(compact, now).forEach((iso) => push(iso));
  }

  return uniqueByIso(out);
}

function interpretDigits(digits, now) {
  const n = digits.length;
  const found = [];

  if (n === 1 || n === 2) {
    const value = Number(digits);
    if (value >= 1 && value <= 12) found.push(monthToIso(value, now));
  }

  if (n === 4) {
    const year = Number(digits);
    if (year >= 1900 && year <= 2199) found.push(toIso(year, 1, 1));
    const month = Number(digits.slice(0, 2));
    const yy = Number(digits.slice(2, 4));
    found.push(toIso(2000 + yy, month, 1));
  }

  if (n === 6) {
    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const yy = Number(digits.slice(4, 6));
    found.push(toIso(2000 + yy, month, day));
    found.push(toIso(Number(digits.slice(2, 6)), Number(digits.slice(0, 2)), 1));
  }

  if (n === 8) {
    found.push(toIso(
      Number(digits.slice(4, 8)),
      Number(digits.slice(2, 4)),
      Number(digits.slice(0, 2)),
    ));
  }

  return found.filter(Boolean);
}

function monthToIso(month, now) {
  const year = now.getFullYear();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const first = new Date(year, month - 1, 1);
  if (month === now.getMonth() + 1 || first >= today) {
    return toIso(year, month, 1);
  }
  return toIso(year + 1, month, 1);
}

function toSuggest(sample, iso) {
  return {
    sample,
    value: iso,
    display: formatIsoToDisplay(iso),
    label: `${sample} → ${formatIsoToDisplay(iso)}`,
  };
}

function uniqueByIso(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row?.iso || seen.has(row.iso)) return false;
    seen.add(row.iso);
    return true;
  });
}

function toIso(year, month, day) {
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (year < 1900 || year > 2199 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
