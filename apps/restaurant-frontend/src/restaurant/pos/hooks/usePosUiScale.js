import { useState } from 'react';

const STORAGE_KEY = 'rst-pos-ui-scale';
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

export function usePosUiScale() {
  const [scale, setScaleState] = useState(readStoredScale);

  const setScale = (next) => {
    setScaleState((prev) => {
      const value = clampScale(typeof next === 'function' ? next(prev) : next);
      persistScale(value);
      return value;
    });
  };

  return {
    scale,
    percent: Math.round(scale * 100),
    canZoomIn: scale < MAX - 1e-9,
    canZoomOut: scale > MIN + 1e-9,
    zoomIn: () => setScale((s) => s + STEP),
    zoomOut: () => setScale((s) => s - STEP),
    reset: () => setScale(DEFAULT),
    rootStyle: { '--rst-ui-scale': String(scale) },
  };
}
