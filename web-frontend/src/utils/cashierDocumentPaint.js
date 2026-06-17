/** Фон html/body до загрузки React — без белой вспышки при reload в Electron. */

export const CASHIER_PAINT = {
  dark: {
    bg: '#0c1018',
    scheme: 'dark',
    themeColor: '#0c1018',
  },
  light: {
    bg: '#e9eef4',
    scheme: 'light',
    themeColor: '#e9eef4',
  },
};

/** @param {'dark' | 'light'} theme */
export function syncCashierDocumentPaint(theme) {
  if (typeof document === 'undefined') return;
  const paint = CASHIER_PAINT[theme] || CASHIER_PAINT.dark;
  const root = document.documentElement;
  root.style.backgroundColor = paint.bg;
  root.style.colorScheme = paint.scheme;
  if (document.body) {
    document.body.style.backgroundColor = paint.bg;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', paint.themeColor);
  }
}
