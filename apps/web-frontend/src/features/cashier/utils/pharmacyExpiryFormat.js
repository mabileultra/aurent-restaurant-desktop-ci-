import { productAttr } from './pharmacyProductAttr';

export const PHARMACY_EXPIRY_WARN_DAYS = 90;

export function productExpiry(productOrLine) {
  return productAttr(
    productOrLine,
    'lotExpiry',
    'expiry_date',
    'expiryDate',
    'expiration_date',
    'expirationDate',
    'срок',
    'срок_годности',
  );
}

export function productShelfLifeDays(productOrLine) {
  const raw = productAttr(productOrLine, 'shelf_life_days', 'shelfLifeDays', 'storage_days');
  if (!raw) return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

/**
 * Парсит срок в Date (локальная полночь). Поддерживает ДД.ММ.ГГГГ и ISO.
 */
export function parseExpiryDate(raw) {
  if (raw == null) return null;
  const text = String(raw).trim();
  if (!text) return null;

  const dmy = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    let year = Number(dmy[3]);
    if (year < 100) year += 2000;
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const iso = Date.parse(text);
  if (!Number.isNaN(iso)) {
    const date = new Date(iso);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  return null;
}

export function formatExpiryDisplay(raw) {
  const date = parseExpiryDate(raw);
  if (!date) {
    const text = raw != null ? String(raw).trim() : '';
    return text || '';
  }
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

export function daysUntilExpiry(raw, now = new Date()) {
  const date = parseExpiryDate(raw);
  if (!date) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((date.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Срок и дни отдельно — в таблице кассы две строки, чтобы не наезжать на «серию».
 * В ячейке без «дн.» (есть в заголовке): `767/730`. В title — полная строка.
 */
export function formatExpiryRemainingParts(productOrLine, daysLabel = 'дн.') {
  const expiryRaw = productExpiry(productOrLine);
  const date = formatExpiryDisplay(expiryRaw);
  const left = daysUntilExpiry(expiryRaw);
  const shelf = productShelfLifeDays(productOrLine);

  let days = '';
  if (left != null && shelf != null) {
    days = `${left}/${shelf}`;
  } else if (left != null) {
    days = String(left);
  }

  let titleDays = '';
  if (left != null && shelf != null) {
    titleDays = `${left} / ${shelf} ${daysLabel}`;
  } else if (left != null) {
    titleDays = `${left} ${daysLabel}`;
  }

  return { date, days, titleDays };
}

/**
 * Срок + оставшиеся дни: `01.06.2026 · 280 дн.` или `280 / 365 дн.`
 */
export function formatExpiryRemaining(productOrLine, daysLabel = 'дн.') {
  const { date, titleDays } = formatExpiryRemainingParts(productOrLine, daysLabel);
  if (date && titleDays) return `${date} · ${titleDays}`;
  return date || titleDays || '';
}
