import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  CASHIER_UI_FACTOR_DEFAULT,
  CASHIER_UI_FACTOR_STEP,
  clampCashierUiFactor,
  resolveCashierEffectiveScale,
} from '../utils/cashierUiScaleFactor';
import { resolveCashierZoomBox } from '../utils/resolveCashierZoomBox';
import { useViewportInnerSize } from './useViewportInnerSize';

/* v4: UI 100% = идеал монитора; ± крутит factor поверх базы */
const STORAGE_KEY = 'cashier-pos-ui-scale-v4';

function readStoredFactor() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return CASHIER_UI_FACTOR_DEFAULT;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.factor != null) {
      return clampCashierUiFactor(parsed.factor);
    }
    return clampCashierUiFactor(raw);
  } catch {
    return CASHIER_UI_FACTOR_DEFAULT;
  }
}

function persistFactor(factor) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ factor }));
  } catch {
    /* ignore */
  }
}

let currentFactor = readStoredFactor();
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentFactor;
}

function setFactor(next) {
  const value = clampCashierUiFactor(
    typeof next === 'function' ? next(currentFactor) : next
  );
  if (value === currentFactor) return;
  currentFactor = value;
  persistFactor(currentFactor);
  listeners.forEach((listener) => listener());
}

/**
 * Shared UI scale: monitor base × user factor.
 * Percent in dock is always relative (100% = ideal for this screen).
 */
export function useCashierUiScale() {
  const factor = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const viewport = useViewportInnerSize();

  const resolved = useMemo(
    () => resolveCashierEffectiveScale(factor, viewport.height, viewport.width),
    [factor, viewport.height, viewport.width]
  );

  const zoomBox = useMemo(
    () => resolveCashierZoomBox(resolved.scale, viewport.width, viewport.height),
    [resolved.scale, viewport.height, viewport.width]
  );

  const zoomIn = useCallback(() => setFactor((f) => f + CASHIER_UI_FACTOR_STEP), []);
  const zoomOut = useCallback(() => setFactor((f) => f - CASHIER_UI_FACTOR_STEP), []);
  const reset = useCallback(() => setFactor(CASHIER_UI_FACTOR_DEFAULT), []);

  return {
    scale: resolved.scale,
    percent: resolved.percent,
    canZoomIn: resolved.canZoomIn,
    canZoomOut: resolved.canZoomOut,
    zoomIn,
    zoomOut,
    reset,
    rootStyle: zoomBox.style,
  };
}
