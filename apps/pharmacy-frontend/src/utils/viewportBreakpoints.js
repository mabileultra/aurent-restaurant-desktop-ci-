/** Единый источник breakpoint-ов для всего приложения. Эталон: 1024×768 POS. */

export const VIEWPORT_BP = {
  /** Мобильная касса / compact shell */
  COMPACT_MAX: 799,
  COMPACT: 800,
  /** Десктоп / POS / admin sidebar */
  DESKTOP: 1024,
  /** Средний десктоп */
  LG: 1280,
  /** Широкий десктоп */
  XL: 1600,
  /** Full HD+ */
  XXL: 1920,
};

/** Классический POS-терминал 1024×768 (и близкие 4:3). */
export const VIEWPORT_CANONICAL = {
  WIDTH_MIN: 1024,
  WIDTH_MAX: 1280,
  HEIGHT_MAX: 820,
};

export const VIEWPORT_MEDIA = {
  compact: `(max-width: ${VIEWPORT_BP.COMPACT_MAX}px)`,
  desktop: `(min-width: ${VIEWPORT_BP.DESKTOP}px)`,
  lg: `(min-width: ${VIEWPORT_BP.LG}px)`,
  canonical: `(min-width: ${VIEWPORT_CANONICAL.WIDTH_MIN}px) and (max-width: ${VIEWPORT_CANONICAL.WIDTH_MAX}px) and (max-height: ${VIEWPORT_CANONICAL.HEIGHT_MAX}px)`,
  /** Касса: POS desktop (ширина) */
  posDesktop: `(min-width: ${VIEWPORT_BP.DESKTOP}px)`,
};

/** @deprecated use VIEWPORT_BP */
export const CASHIER_LAYOUT_MIN_WIDTH = VIEWPORT_BP.COMPACT;
/** @deprecated use VIEWPORT_MEDIA */
export const CASHIER_COMPACT_MEDIA = VIEWPORT_MEDIA.compact;
/** @deprecated use VIEWPORT_BP */
export const CASHIER_POS_DESKTOP_MIN_WIDTH = VIEWPORT_BP.DESKTOP;
/** @deprecated use VIEWPORT_MEDIA */
export const CASHIER_POS_DESKTOP_MEDIA = VIEWPORT_MEDIA.posDesktop;
