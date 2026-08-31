/** Админка — всегда светлая. Сбрасывает следы тёмной кассы на <html>. */
export function syncRootTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'dark',
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
  );
  root.classList.add('app-theme--admin');
  root.style.colorScheme = 'light';
  root.style.backgroundColor = '';
  if (document.body) {
    document.body.style.backgroundColor = '';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#f1f5f9');
  }
}
