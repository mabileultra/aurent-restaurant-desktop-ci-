/** Единый источник breakpoint-ов. Эталон POS: 1024×768. Синхрон с styles/tokens/breakpoints.css */

export const VIEWPORT_BP = {
  COMPACT_MAX: 799,
  COMPACT: 800,
  DESKTOP: 1024,
  LG: 1280,
  XL: 1600,
  XXL: 1920,
};

export const VIEWPORT_CANONICAL = {
  WIDTH_MIN: 1024,
  WIDTH_MAX: 1280,
  HEIGHT_MAX: 820,
};

/** Short landscape POS panels (e.g. ~1000×500 / 1024×540) — desktop waiter, not phone shell. */
export const VIEWPORT_POS_TERMINAL = {
  WIDTH_MIN: 900,
  HEIGHT_MAX: 620,
};

export const VIEWPORT_MEDIA = {
  compact: `(max-width: ${VIEWPORT_BP.COMPACT_MAX}px)`,
  desktop: `(min-width: ${VIEWPORT_BP.DESKTOP}px)`,
  lg: `(min-width: ${VIEWPORT_BP.LG}px)`,
  canonical: `(min-width: ${VIEWPORT_CANONICAL.WIDTH_MIN}px) and (max-width: ${VIEWPORT_CANONICAL.WIDTH_MAX}px) and (max-height: ${VIEWPORT_CANONICAL.HEIGHT_MAX}px)`,
  posTerminal: `(min-width: ${VIEWPORT_POS_TERMINAL.WIDTH_MIN}px) and (max-height: ${VIEWPORT_POS_TERMINAL.HEIGHT_MAX}px)`,
};

export function resolveViewportProfile(width, height) {
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  const compact = w > 0 && w <= VIEWPORT_BP.COMPACT_MAX;
  const desktop = w >= VIEWPORT_BP.DESKTOP;
  const canonical = (
    w >= VIEWPORT_CANONICAL.WIDTH_MIN
    && w <= VIEWPORT_CANONICAL.WIDTH_MAX
    && h > 0
    && h <= VIEWPORT_CANONICAL.HEIGHT_MAX
  );
  const posTerminal = (
    w >= VIEWPORT_POS_TERMINAL.WIDTH_MIN
    && h > 0
    && h <= VIEWPORT_POS_TERMINAL.HEIGHT_MAX
  );
  return { compact, desktop, canonical, posTerminal };
}

export const VIEWPORT_HTML_CLASSES = [
  'app-viewport--compact',
  'app-viewport--desktop',
  'app-viewport--canonical',
];
