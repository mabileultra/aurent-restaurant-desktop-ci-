import AppBootPlaceholder from '../components/shared/AppBootPlaceholder';
import { isCashierPinLoginPath } from '../utils/isCashierPinLoginPath';

/**
 * Suspense fallback during lazy route chunk loading.
 * Ensures no blank white screens or dark voids appear during navigation.
 */
export default function RouteFallback() {
  if (isCashierPinLoginPath()) {
    return <AppBootPlaceholder label="" tone="light" />;
  }
  return <AppBootPlaceholder label="Aurent…" />;
}
