/** Фон html/body до загрузки React — без белой вспышки при reload в Electron. */

export const CASHIER_PAINT = {
  dark: {
    bg: '#0c1018',
    themeColor: '#0c1018',
  },
  light: {
    bg: '#e9eef4',
    themeColor: '#e9eef4',
  },
  /** Фон PIN-логина — совпадает с .cashier-pin-login */
  pinLogin: {
    bg: '#f8fafc',
    themeColor: '#f8fafc',
  },
};

/** @param {'dark' | 'light' | 'pinLogin'} theme */
export function syncCashierDocumentPaint(theme) {
  if (typeof document === 'undefined') return;
  const paint = CASHIER_PAINT[theme] || CASHIER_PAINT.dark;
  const root = document.documentElement;
  root.style.backgroundColor = paint.bg;
  /* color-scheme только на .cashier-app — не на <html>, иначе админ-инпуты чёрные в Electron */
  if (document.body) {
    document.body.style.backgroundColor = paint.bg;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', paint.themeColor);
  }
}
