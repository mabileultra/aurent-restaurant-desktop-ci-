import { lineDiscountAmount, lineGross } from '../../../../store/cartStore';
import { toTiyin } from '../../shared/fiscalMoney';
import { toOfdMarkingLabel } from '../../shared/ofdMarkingLabel';
import { resolveLinePackageCode } from '../../shared/resolveLinePackageCode';
import { FD_AMOUNT_SCALE, FD_DEFAULT_VAT_PERCENT, FD_LIMITS } from './fiscalDriveConstants';

const digitsOnly = (value) => String(value ?? '').replace(/\D/g, '');

function lineLabels(line) {
  const raw = Array.isArray(line.productMarks) && line.productMarks.length > 0
    ? line.productMarks
    : [line.productMark || line.markCode || line.productLabel].filter(Boolean);
  const labels = raw.map(toOfdMarkingLabel).filter(Boolean);
  return [...new Set(labels)].slice(0, FD_LIMITS.LABELS_PER_ITEM);
}

function lineVatPercent(line) {
  if (line.productWithoutVat) return 0;
  const rate = Number(line.taxRate ?? FD_DEFAULT_VAT_PERCENT);
  return Number.isFinite(rate) && rate > 0 ? Math.round(rate) : 0;
}

/** НДС внутри суммы (НДС включён в цену): net * rate / (100 + rate). */
function inclusiveVatTiyin(amountTiyin, vatPercent) {
  if (amountTiyin <= 0 || vatPercent <= 0) return 0;
  return Math.round((amountTiyin * vatPercent) / (100 + vatPercent));
}

function commissionInfo(line) {
  const id = digitsOnly(line.commissionTin || line.commitentTin);
  if (id.length === 9) return { TIN: id };
  if (id.length === 14) return { PINFL: id };
  return null;
}

/**
 * Строка корзины → позиция JSON-чека 0400.
 * Price — сумма строки (цена × кол-во) в тийинах; extraDiscountTiyin — доля скидки на заказ.
 */
export function buildFiscalDriveItem(line, { extraDiscountTiyin = 0 } = {}) {
  const price = toTiyin(lineGross(line));
  const discount = Math.min(price, toTiyin(lineDiscountAmount(line)) + Math.max(0, extraDiscountTiyin));
  const other = Math.min(price - discount, Math.max(0, toTiyin(line.other || 0)));
  const vatPercent = lineVatPercent(line);

  const item = {
    Name: String(line.name || 'Товар').trim().slice(0, FD_LIMITS.NAME) || 'Товар',
    SPIC: digitsOnly(line.ikpu).slice(0, FD_LIMITS.SPIC),
    PackageCode: digitsOnly(resolveLinePackageCode(line)).slice(0, FD_LIMITS.PACKAGE_CODE),
    Amount: Math.round((Number(line.quantity) || 0) * FD_AMOUNT_SCALE),
    Price: price,
    Discount: discount,
    Other: other,
    VATPercent: vatPercent,
    VAT: inclusiveVatTiyin(price - discount - other, vatPercent),
  };

  const barcode = digitsOnly(line.barcode);
  if (barcode) item.Barcode = barcode.slice(0, FD_LIMITS.BARCODE);

  const labels = lineLabels(line);
  if (labels.length > 0) item.Labels = labels;

  const units = Number(line.unitsCode);
  if (Number.isInteger(units) && units > 0) item.Units = units;

  const ownerType = Number(line.ownerType);
  item.OwnerType = Number.isInteger(ownerType) && ownerType >= 0 ? ownerType : 0;

  const commission = commissionInfo(line);
  if (commission) item.CommissionInfo = commission;

  return item;
}
