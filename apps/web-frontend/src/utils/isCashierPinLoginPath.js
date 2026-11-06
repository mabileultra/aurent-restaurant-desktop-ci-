/** PIN-экран кассы — всегда светлый paint, не POS dark. */
export function isCashierPinLoginPath(pathname) {
  const path =
    pathname ||
    (typeof window !== 'undefined' ? window.location.pathname : '');
  return path.startsWith('/cashier/login');
}
