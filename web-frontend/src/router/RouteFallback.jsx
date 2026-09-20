import AppBootPlaceholder from '../components/shared/AppBootPlaceholder';
import { isCashierPinLoginPath } from '../utils/isCashierPinLoginPath';

/** Suspense fallback — light paint on PIN login; invisible elsewhere (no route-flash). */
export default function RouteFallback() {
  if (isCashierPinLoginPath()) {
    return <AppBootPlaceholder label="" />;
  }
  return null;
}
