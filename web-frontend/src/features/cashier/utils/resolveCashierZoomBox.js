import { clampCashierUiScale } from './cashierUiScale';

/**
 * Layout box for CSS zoom: shrink/grow the shell by 1/scale so after zoom
 * it still covers the window. Percent heights + zoom in Chromium leave
 * gaps on minus and clip the dock on plus.
 */
export function resolveCashierZoomBox(scale, viewportWidth, viewportHeight) {
  const nextScale = clampCashierUiScale(scale);
  // Electron can report 0×0 before the window is shown — never shrink the shell to 1px.
  const rawW = Number(viewportWidth);
  const rawH = Number(viewportHeight);
  const widthPx = rawW >= 320 ? rawW : 1024;
  const heightPx = rawH >= 240 ? rawH : 768;
  const width = widthPx / nextScale;
  const height = heightPx / nextScale;

  return {
    scale: nextScale,
    width,
    height,
    style: {
      '--pos-ui-scale': String(nextScale),
      '--cashier-vh': `${height}px`,
      width: `${width}px`,
      height: `${height}px`,
      minHeight: `${height}px`,
      maxHeight: `${height}px`,
    },
  };
}
