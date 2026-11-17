/**
 * Атрибуты товара для аптечной кассы (срок / серия / фасовка).
 * Цвета ячеек — см. pharmacyCellTone.js
 */

import { lineRequiresPrescription } from '@aurent/shared-fiscal';
import { productAttr } from './pharmacyProductAttr';

export const PHARMACY_LOW_STOCK_THRESHOLD = 5;

export function productBatch(productOrLine) {
  return productAttr(
    productOrLine,
    'lotBatch',
    'batch',
    'series',
    'batch_number',
    'batchNumber',
    'серия',
  );
}

export function productDosageForm(productOrLine) {
  const fromAttr = productAttr(
    productOrLine,
    'dosage_form',
    'dosageForm',
    'form',
    'pharmacyDosageForm',
    'pharmacy_dosage_form',
  );
  if (fromAttr) return fromAttr;
  const extras = productOrLine?.retailExtras;
  if (extras?.pharmacyDosageForm) return String(extras.pharmacyDosageForm).trim();
  return '';
}

export function productCountry(productOrLine) {
  return productAttr(
    productOrLine,
    'country',
    'country_of_origin',
    'countryOfOrigin',
    'origin_country',
    'originCountry',
    'страна',
    'manufacturer_country',
    'manufacturerCountry',
  );
}

export function productUnitsInPack(productOrLine) {
  const raw = productAttr(productOrLine, 'units_in_pack', 'unitsInPack', 'pack_size', 'packSize');
  if (!raw) return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
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
  const direct = productOrLine?.storageLocation;
  if (direct != null && String(direct).trim()) return String(direct).trim();
  return productAttr(
    productOrLine,
    'storageLocation',
    'storage_location',
    'shelf',
    'полка',
    'location',
  );
}

/** Нужен рецепт (подсветка строки, тег РЕЦЕПТ, обязательный номер рецепта). */
export function productRequiresPrescription(productOrLine) {
  return lineRequiresPrescription(productOrLine);
}

/**
 * Можно продавать поштучно из упаковки.
 * Явный sell_by_piece / sellByPiece важнее; soldIndividually=false без атрибута
 * не блокирует (часто устаревший флаг после sync фасовки с фактуры).
 */
export function productSellByPiece(productOrLine) {
  const pack = productUnitsInPack(productOrLine);
  if (pack == null || pack <= 1) return false;
  const raw = productAttr(productOrLine, 'sell_by_piece', 'sellByPiece');
  if (raw) {
    const normalized = String(raw).trim().toLowerCase();
    if (['0', 'false', 'no', 'нет', 'off'].includes(normalized)) return false;
    return true;
  }
  if (productOrLine?.sellByPiece === false) return false;
  return true;
}

/** Шаг штучной продажи (10 → 10, 20, 30…). 1 = любая целая штука. */
export function productPieceStep(productOrLine) {
  const pack = productUnitsInPack(productOrLine) || 0;
  const raw = productAttr(productOrLine, 'piece_step', 'pieceStep')
    || productOrLine?.pieceStep;
  const n = Number(String(raw ?? '').replace(',', '.'));
  if (!Number.isFinite(n) || n <= 1) return 1;
  const step = Math.round(n);
  if (pack > 1 && step >= pack) return 1;
  return step;
}

/** Можно продавать дробно / по 1 из пачки (лента). */
export function productSellByUnitHint(productOrLine) {
  return productSellByPiece(productOrLine);
}

export { productAttr } from './pharmacyProductAttr';

export {
  PHARMACY_EXPIRY_WARN_DAYS,
  productExpiry,
  productShelfLifeDays,
  parseExpiryDate,
  formatExpiryDisplay,
  daysUntilExpiry,
  formatExpiryRemainingParts,
  formatExpiryRemaining,
} from './pharmacyExpiryFormat';
