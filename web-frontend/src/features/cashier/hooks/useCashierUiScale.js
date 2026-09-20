import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  CASHIER_UI_SCALE_DEFAULT,
  CASHIER_UI_SCALE_MAX,
  CASHIER_UI_SCALE_MIN,
  CASHIER_UI_SCALE_STEP,
  clampCashierUiScale,
} from '../utils/cashierUiScale';
import { resolveCashierZoomBox } from '../utils/resolveCashierZoomBox';
import { useViewportInnerSize } from './useViewportInnerSize';

const STORAGE_KEY = 'cashier-pos-ui-scale';

function readStoredScale() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return CASHIER_UI_SCALE_DEFAULT;
    return clampCashierUiScale(raw);
  } catch {
    return CASHIER_UI_SCALE_DEFAULT;
  }
}

function persistScale(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    /* ignore quota / private mode */
  }
}

let currentScale = readStoredScale();
const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return currentScale;
}

function setScale(next) {
  const value = clampCashierUiScale(typeof next === 'function' ? next(currentScale) : next);
  if (value === currentScale) return;
  currentScale = value;
  persistScale(value);
  listeners.forEach((listener) => listener());
}

/**
 * Shared UI scale for cashier shell + bottom-dock controls.
 * Must be a singleton — two useState instances previously desynced zoom.
 */
export function useCashierUiScale() {
  const scale = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const viewport = useViewportInnerSize();
  const zoomBox = useMemo(
    () => resolveCashierZoomBox(scale, viewport.width, viewport.height),
    [scale, viewport.height, viewport.width]
  );

  const zoomIn = useCallback(() => setScale((s) => s + CASHIER_UI_SCALE_STEP), []);
  const zoomOut = useCallback(() => setScale((s) => s - CASHIER_UI_SCALE_STEP), []);
  const reset = useCallback(() => setScale(CASHIER_UI_SCALE_DEFAULT), []);

  return {
    scale,
    percent: Math.round(scale * 100),
    canZoomIn: scale < CASHIER_UI_SCALE_MAX - 1e-9,
    canZoomOut: scale > CASHIER_UI_SCALE_MIN + 1e-9,
    zoomIn,
    zoomOut,
    reset,
    rootStyle: zoomBox.style,
  };
}
