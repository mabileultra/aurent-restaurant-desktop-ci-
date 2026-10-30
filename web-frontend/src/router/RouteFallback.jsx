import AppBootPlaceholder from '../components/shared/AppBootPlaceholder';
import { isCashierPinLoginPath } from '../utils/isCashierPinLoginPath';

/**
 * Внешний Suspense: PIN — светлый boot; admin/platform обычно ловятся
 * ShellOutlet (сайдбар не гаснет). Сюда попадаем только если грузится сам layout-chunk.
 */
export default function RouteFallback() {
  if (isCashierPinLoginPath()) {
    return <AppBootPlaceholder label="" />;
  }
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (
    path.startsWith('/platform')
    || path.startsWith('/dashboard')
    || path.startsWith('/finance')
    || path.startsWith('/pharm')
    || path.startsWith('/products')
    || path.startsWith('/stock')
    || path.startsWith('/reports')
    || path.startsWith('/billing')
  ) {
    return <AppBootPlaceholder label="Aurent…" tone="light" />;
  }
  return null;
}
