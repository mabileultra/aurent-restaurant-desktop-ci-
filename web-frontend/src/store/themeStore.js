/** Админка — всегда светлая. Сбрасывает следы тёмной кассы на <html>. */
export function syncRootTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'dark',
    'rst-theme',
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--public',
  );
  root.classList.add('app-theme--admin');
  root.style.colorScheme = 'light';
  root.style.backgroundColor = '';
  if (document.body) {
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#f1f5f9');
  }
}

/** Restaurant OS — тёмная оболочка + Tailwind dark: для встроенных Aurent UI. */
export function syncRestaurantTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--public',
    'app-theme--admin',
  );
  root.classList.add('dark', 'rst-theme');
  root.style.colorScheme = 'dark';
  root.style.backgroundColor = '#121418';
  if (document.body) {
    document.body.style.backgroundColor = '#121418';
    document.body.style.color = '#f3efe6';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#121418');
  }
}

/** Лендинг / login — светлая тема с зелёным акцентом. */
export function syncPublicTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'dark',
    'rst-theme',
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--admin',
  );
  root.classList.add('app-theme--public');
  root.style.colorScheme = 'light';
  root.style.backgroundColor = '#f2f7f4';
  if (document.body) {
    document.body.style.backgroundColor = '#f2f7f4';
    document.body.style.color = '#0f2419';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', '#f2f7f4');
  }
}
