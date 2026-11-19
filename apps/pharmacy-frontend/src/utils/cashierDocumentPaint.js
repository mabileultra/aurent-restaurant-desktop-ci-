/** Document background before React hydration — light-only Pharma Green. */

export const CASHIER_PAINT = {
  light: {
    bg: '#F6FAF7',
  },
  pinLogin: {
    bg: '#F6FAF7',
  },
};

/** @param {'light' | 'pinLogin'} [mode] */
export function syncCashierDocumentPaint(mode = 'light') {
  if (typeof document === 'undefined') return;
  const paint = CASHIER_PAINT[mode] || CASHIER_PAINT.light;
  const root = document.documentElement;
  root.style.colorScheme = 'light';
  root.style.backgroundColor = paint.bg;
  if (document.body) {
    document.body.style.backgroundColor = paint.bg;
  }
}
