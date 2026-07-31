/**
 * Атрибуты товара для аптечной кассы (срок / серия / фасовка) и световая гамма строк.
 */

export const PHARMACY_EXPIRY_WARN_DAYS = 90;
export const PHARMACY_LOW_STOCK_THRESHOLD = 5;

export function productAttr(productOrLine, ...keys) {
  const attrs = productOrLine?.attributes;
  if (!attrs || typeof attrs !== 'object') return '';
  for (const key of keys) {
    const value = attrs[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  for (const key of keys) {
    const direct = productOrLine?.[key];
    if (direct != null && String(direct).trim()) {
      return String(direct).trim();
    }
  }
  return '';
}

export function productExpiry(productOrLine) {
  return productAttr(
    productOrLine,
    'expiry_date',
    'expiryDate',
    'expiration_date',
    'expirationDate',
    'срок',
    'срок_годности',
  );
}

export function productBatch(productOrLine) {
  return productAttr(
    productOrLine,
    'batch',
    'series',
    'batch_number',
    'batchNumber',
    'серия',
  );
}

export function productDosageForm(productOrLine) {
  const fromAttr = productAttr(productOrLine, 'dosage_form', 'dosageForm', 'form');
  if (fromAttr) return fromAttr;
  const extras = productOrLine?.retailExtras;
  if (extras?.pharmacyDosageForm) return String(extras.pharmacyDosageForm).trim();
  return '';
}

export function productUnitsInPack(productOrLine) {
  const raw = productAttr(productOrLine, 'units_in_pack', 'unitsInPack', 'pack_size', 'packSize');
  if (!raw) return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function productShelfLifeDays(productOrLine) {
  const raw = productAttr(productOrLine, 'shelf_life_days', 'shelfLifeDays', 'storage_days');
  if (!raw) return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function productArrivalDate(productOrLine) {
  return productAttr(productOrLine, 'arrival_date', 'arrivalDate', 'received_date', 'receivedDate');
}

export function productUnitLabel(productOrLine) {
  const measure = productOrLine?.unitOfMeasure;
  if (measure != null && String(measure).trim()) return String(measure).trim();
  const code = productOrLine?.unitCode;
  if (code != null && String(code).trim()) return String(code).trim();
  return '';
}

/** Полка / место хранения (из карточки товара). */
export function productStorageLocation(productOrLine) {
  return productAttr(
    productOrLine,
    'storageLocation',
    'storage_location',
    'shelf',
  );
}

/** Можно продавать дробно / по 1 из пачки (лента). */
export function productSellByUnitHint(productOrLine) {
  if (productOrLine?.allowFraction) return true;
  if (productOrLine?.soldIndividually) return true;
  const pack = productUnitsInPack(productOrLine);
  return pack != null && pack > 1;
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
 * Срок + оставшиеся дни: `01.06.2026 · 280 дн.` или `280 / 365 дн.`
 */
export function formatExpiryRemaining(productOrLine, daysLabel = 'дн.') {
  const expiryRaw = productExpiry(productOrLine);
  const dateStr = formatExpiryDisplay(expiryRaw);
  const left = daysUntilExpiry(expiryRaw);
  const shelf = productShelfLifeDays(productOrLine);

  if (dateStr && left != null && shelf != null) {
    return `${dateStr} · ${left} / ${shelf} ${daysLabel}`;
  }
  if (dateStr && left != null) {
    return `${dateStr} · ${left} ${daysLabel}`;
  }
  if (dateStr) return dateStr;
  if (left != null && shelf != null) {
    return `${left} / ${shelf} ${daysLabel}`;
  }
  if (left != null) return `${left} ${daysLabel}`;
  return '';
}

/**
 * @returns {'danger' | 'ok' | null}
 * danger — срок ≤ 90 дней или остаток ≤ 5
 * ok — остальное (есть остаток)
 * null — нет подсветки (нет остатка / услуга без оценки)
 */
export function pharmacyRowStatus(productOrLine, { stockKey = 'stockQuantity' } = {}) {
  const saleType = productOrLine?.saleType || 'PIECE';
  const stockRaw = productOrLine?.[stockKey] ?? productOrLine?.maxStock ?? 0;
  const stock = Number(stockRaw);
  const isService = saleType === 'SERVICE';

  if (!isService && Number.isFinite(stock) && stock <= 0) {
    return null;
  }

  const expiryRaw = productExpiry(productOrLine);
  const daysLeft = daysUntilExpiry(expiryRaw);
  const nearExpiry = daysLeft != null && daysLeft <= PHARMACY_EXPIRY_WARN_DAYS;
  const lowStock =
    !isService
    && Number.isFinite(stock)
    && stock > 0
    && stock <= PHARMACY_LOW_STOCK_THRESHOLD;

  if (nearExpiry || lowStock) return 'danger';
  return 'ok';
}

export function pharmacyRowStatusClass(status, prefix) {
  if (status === 'danger') return `${prefix}--danger`;
  if (status === 'ok') return `${prefix}--ok`;
  return '';
}
