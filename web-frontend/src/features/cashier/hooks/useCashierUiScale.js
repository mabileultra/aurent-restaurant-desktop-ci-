import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'cashier-pos-ui-scale';
const MIN = 0.8;
const MAX = 1.4;
const STEP = 0.1;
const DEFAULT = 1;

function clampScale(value) {
  const n = Math.round(Number(value) * 10) / 10;
  if (!Number.isFinite(n)) return DEFAULT;
  return Math.min(MAX, Math.max(MIN, n));
}

function readStoredScale() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT;
    return clampScale(raw);
  } catch {
    return DEFAULT;
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
  const value = clampScale(typeof next === 'function' ? next(currentScale) : next);
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

  const zoomIn = useCallback(() => setScale((s) => s + STEP), []);
  const zoomOut = useCallback(() => setScale((s) => s - STEP), []);
  const reset = useCallback(() => setScale(DEFAULT), []);

  return {
    scale,
    percent: Math.round(scale * 100),
    canZoomIn: scale < MAX - 1e-9,
    canZoomOut: scale > MIN + 1e-9,
    zoomIn,
    zoomOut,
    reset,
    rootStyle: { '--pos-ui-scale': String(scale) },
  };
}
