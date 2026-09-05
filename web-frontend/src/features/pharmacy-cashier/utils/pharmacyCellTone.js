/**
 * Подсветка ячеек аптечной таблицы (не всей строки).
 * ok — норма, warn — внимание, danger — критично, info — полка/навигация (teal).
 */

import {
  PHARMACY_EXPIRY_WARN_DAYS,
  PHARMACY_LOW_STOCK_THRESHOLD,
  daysUntilExpiry,
  productExpiry,
  productStorageLocation,
} from './pharmacyProductMeta';

export const PHARMACY_EXPIRY_DANGER_DAYS = 30;
export const PHARMACY_CRITICAL_STOCK = 2;

/**
 * @returns {'ok' | 'warn' | 'danger' | null}
 */
export function pharmacyStockTone(productOrLine, { stockKey = 'stockQuantity' } = {}) {
  const saleType = productOrLine?.saleType || 'PIECE';
  if (saleType === 'SERVICE') return null;

  const stock = Number(productOrLine?.[stockKey] ?? productOrLine?.maxStock ?? 0);
  if (!Number.isFinite(stock) || stock <= 0) return 'danger';
  if (stock <= PHARMACY_CRITICAL_STOCK) return 'danger';
  if (stock <= PHARMACY_LOW_STOCK_THRESHOLD) return 'warn';
  return 'ok';
}

/**
 * @returns {'ok' | 'warn' | 'danger' | null}
 */
export function pharmacyExpiryTone(productOrLine) {
  const daysLeft = daysUntilExpiry(productExpiry(productOrLine));
  if (daysLeft == null) return null;
  if (daysLeft <= PHARMACY_EXPIRY_DANGER_DAYS) return 'danger';
  if (daysLeft <= PHARMACY_EXPIRY_WARN_DAYS) return 'warn';
  return 'ok';
}

/**
 * Полка — teal/info маркер, чтобы быстро найти товар.
 * @returns {'info' | null}
 */
export function pharmacyShelfTone(productOrLine) {
  return productStorageLocation(productOrLine) ? 'info' : null;
}

export function pharmacyCellToneClass(tone, prefix) {
  if (tone === 'ok') return `${prefix}--ok`;
  if (tone === 'warn') return `${prefix}--warn`;
  if (tone === 'danger') return `${prefix}--danger`;
  if (tone === 'info') return `${prefix}--info`;
  return '';
}
