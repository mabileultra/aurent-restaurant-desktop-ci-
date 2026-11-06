import { clampCashierUiScale, CASHIER_UI_SCALE_DEFAULT } from './cashierUiScale';

/**
 * Базовый zoom «идеал монитора» от ~600px вверх.
 * В UI всегда 100%; реальный zoom сильнее на низких/средних окнах.
 */
export function recommendCashierUiScale(viewportHeight, viewportWidth) {
  const h = Number(viewportHeight);
  const w = Number(viewportWidth);
  if (!Number.isFinite(h) || h <= 0) return CASHIER_UI_SCALE_DEFAULT;

  let base;
  if (h < 600) base = 0.7;
  else if (h < 720) base = 0.75;
  else if (h < 840) base = 0.8;
  else if (h < 960) base = 0.85;
  else if (h < 1080) base = 0.9;
  else if (h < 1240) base = 0.95;
  else base = 1;

  if (Number.isFinite(w) && w > 0 && w < 1366 && base > 0.7) {
    base = Math.max(0.7, Math.round((base - 0.05) * 20) / 20);
  }

  return clampCashierUiScale(base);
}
