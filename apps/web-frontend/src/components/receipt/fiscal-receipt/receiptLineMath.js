import { extractVatFromInclusive } from '../../../utils/taxAmounts';

/** Ставка НДС по умолчанию, если backend не прислал её в строке чека. */
export const DEFAULT_VAT_RATE_PERCENT = 12;

/** Ниже этого значения сохранённый НДС строки считается отсутствующим. */
const MIN_STORED_VAT_AMOUNT = 0.001;

const MIXED_VAT_RATE_LABEL = '—';

function rawLineVatRate(item) {
  return item?.taxRatePercent != null ? Number(item.taxRatePercent) : DEFAULT_VAT_RATE_PERCENT;
}

export function lineVatRatePercent(item) {
  const rate = rawLineVatRate(item);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

export function lineVatAmount(item) {
  const stored = Number(item?.taxAmount);
  if (Number.isFinite(stored) && stored >= MIN_STORED_VAT_AMOUNT) return stored;
  const lineTotal = Number(item?.lineTotal) || 0;
  return extractVatFromInclusive(lineTotal, lineVatRatePercent(item));
}

export function itemUnitPrice(item) {
  const direct = Number(item?.unitPrice ?? item?.price ?? item?.sellingPrice);
  if (Number.isFinite(direct) && direct > 0) return direct;
  const quantity = Number(item?.quantity) || 0;
  const lineTotal = Number(item?.lineTotal) || 0;
  return quantity > 0 ? lineTotal / quantity : lineTotal;
}

/** Ставка для итоговой строки НДС: одна на весь чек или прочерк при разных ставках. */
export function resolveVatRateLabel(items) {
  const rates = new Set((items ?? []).map(rawLineVatRate).filter((rate) => rate > 0));
  return rates.size === 1 ? `${[...rates][0].toFixed(0)}` : MIXED_VAT_RATE_LABEL;
}
