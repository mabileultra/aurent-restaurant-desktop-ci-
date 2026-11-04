export const RESTAURANT_THEME_STORAGE_KEY = 'pos-restaurant-theme';

/** @typedef {'dark' | 'light'} RestaurantTheme */

const restaurantThemeListeners = new Set();
/** @type {RestaurantTheme | null} */
let restaurantThemeSnapshot = null;

/** @returns {RestaurantTheme} */
export function readRestaurantTheme() {
  if (restaurantThemeSnapshot === 'light' || restaurantThemeSnapshot === 'dark') {
    return restaurantThemeSnapshot;
  }
  try {
    const v = localStorage.getItem(RESTAURANT_THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark') {
      restaurantThemeSnapshot = v;
      return v;
    }
  } catch {
    /* ignore */
  }
  restaurantThemeSnapshot = 'dark';
  return 'dark';
}

/** @param {() => void} listener */
export function subscribeRestaurantTheme(listener) {
  restaurantThemeListeners.add(listener);
  return () => restaurantThemeListeners.delete(listener);
}

/** @param {RestaurantTheme} theme */
export function setRestaurantTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  restaurantThemeSnapshot = next;
  try {
    localStorage.setItem(RESTAURANT_THEME_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  syncRestaurantTheme(next);
  restaurantThemeListeners.forEach((listener) => listener());
}

/** Админка — всегда светлая. Сбрасывает следы тёмной кассы на <html>. */
export function syncRootTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'dark',
    'rst-theme',
    'rst-theme--light',
    'rst-theme--dark',
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

/** Restaurant OS — тёмная или светлая оболочка. Кнопки и акценты не меняются. */
export function syncRestaurantTheme(theme = readRestaurantTheme()) {
  if (typeof document === 'undefined') return;
  const light = theme === 'light';
  restaurantThemeSnapshot = light ? 'light' : 'dark';
  const root = document.documentElement;
  root.classList.remove(
    'cashier-theme--light',
    'cashier-theme--dark',
    'app-theme--cashier',
    'app-theme--public',
    'app-theme--admin',
    'rst-theme--light',
    'rst-theme--dark',
  );
  root.classList.add('rst-theme', light ? 'rst-theme--light' : 'rst-theme--dark');
  root.classList.toggle('dark', !light);
  const bg = light ? '#f4f6f8' : '#121418';
  const ink = light ? '#12151c' : '#f3efe6';
  root.style.colorScheme = light ? 'light' : 'dark';
  root.style.backgroundColor = bg;
  if (document.body) {
    document.body.style.backgroundColor = bg;
    document.body.style.color = ink;
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', bg);
  }
}

/** Лендинг / login — светлая тема с зелёным акцентом. */
export function syncPublicTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove(
    'dark',
    'rst-theme',
    'rst-theme--light',
    'rst-theme--dark',
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
