import {
  CASHIER_UI_SCALE_MAX,
  CASHIER_UI_SCALE_MIN,
  CASHIER_UI_SCALE_STEP,
  clampCashierUiScale,
} from './cashierUiScale';
import { recommendCashierUiScale } from './cashierUiScaleByMonitor';

/** Множитель поверх базы монитора: 1 = «100%» в UI */
export const CASHIER_UI_FACTOR_DEFAULT = 1;
export const CASHIER_UI_FACTOR_MIN = 0.7;
export const CASHIER_UI_FACTOR_MAX = 1.4;
export const CASHIER_UI_FACTOR_STEP = CASHIER_UI_SCALE_STEP;

export function clampCashierUiFactor(value) {
  const n = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(n)) return CASHIER_UI_FACTOR_DEFAULT;
  return Math.min(CASHIER_UI_FACTOR_MAX, Math.max(CASHIER_UI_FACTOR_MIN, n));
}

export function resolveCashierEffectiveScale(factor, viewportHeight, viewportWidth) {
  const base = recommendCashierUiScale(viewportHeight, viewportWidth);
  const nextFactor = clampCashierUiFactor(factor);
  return {
    base,
    factor: nextFactor,
    scale: clampCashierUiScale(base * nextFactor),
    percent: Math.round(nextFactor * 100),
    canZoomIn:
      nextFactor < CASHIER_UI_FACTOR_MAX - 1e-9 &&
      base * (nextFactor + CASHIER_UI_FACTOR_STEP) <= CASHIER_UI_SCALE_MAX + 1e-9,
    canZoomOut:
      nextFactor > CASHIER_UI_FACTOR_MIN + 1e-9 &&
      base * (nextFactor - CASHIER_UI_FACTOR_STEP) >= CASHIER_UI_SCALE_MIN - 1e-9,
  };
}
