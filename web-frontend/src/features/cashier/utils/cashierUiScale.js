export const CASHIER_UI_SCALE_MIN = 0.8;
export const CASHIER_UI_SCALE_MAX = 1.4;
export const CASHIER_UI_SCALE_STEP = 0.1;
export const CASHIER_UI_SCALE_DEFAULT = 1;

export function clampCashierUiScale(value) {
  const n = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(n)) return CASHIER_UI_SCALE_DEFAULT;
  return Math.min(CASHIER_UI_SCALE_MAX, Math.max(CASHIER_UI_SCALE_MIN, n));
}
