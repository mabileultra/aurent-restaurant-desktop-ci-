export const CASHIER_UI_SCALE_MIN = 0.7;
export const CASHIER_UI_SCALE_MAX = 1.4;
export const CASHIER_UI_SCALE_STEP = 0.1;
export const CASHIER_UI_SCALE_DEFAULT = 0.7;

export function clampCashierUiScale(value) {
  /* 0.05 — база монитора (70/75/…/100); ± в UI по-прежнему 0.1 */
  const n = Math.round(Number(value) * 20) / 20;
  if (!Number.isFinite(n)) return CASHIER_UI_SCALE_DEFAULT;
  return Math.min(CASHIER_UI_SCALE_MAX, Math.max(CASHIER_UI_SCALE_MIN, n));
}
