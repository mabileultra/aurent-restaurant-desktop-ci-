import { round2 } from '../../../../utils/taxAmounts';

export const STEPS_WITH_PRINT_TOGGLE = new Set([
  'cash',
  'cardType',
  'creditCustomer',
  'advanceAmount',
]);

export function buildPaymentFlowState(openOptions = null) {
  return {
    step: openOptions?.step ?? 'creditCustomer',
    receiptType: openOptions?.receiptType ?? 'SALE',
    payMethod: openOptions?.payMethod ?? null,
  };
}

export const amountStr = (n) => {
  const v = round2(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
};

export const parseTenderedInput = (raw) => {
  const s = String(raw ?? '').replace(/\s/g, '').replace(',', '.').trim();
  if (!s) return 0;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return round2(Math.min(n, 999_999_999.99));
};
