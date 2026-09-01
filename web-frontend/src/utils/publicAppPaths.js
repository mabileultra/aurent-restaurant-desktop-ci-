/** Публичные маршруты без авторизации (лендинг, вход, установка). */
const PUBLIC_EXACT = new Set(['/', '/install', '/about', '/pricing', '/equipment', '/contacts']);

const PUBLIC_PREFIXES = ['/login', '/cashier/login'];

export function isPublicAppPath(pathname) {
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (PUBLIC_EXACT.has(path)) return true;
  return PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}
