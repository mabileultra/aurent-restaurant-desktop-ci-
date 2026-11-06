import { isDesktopOfflineBridge } from '../services/offline/desktopOfflineBridge';
import { isApiNetworkError } from '@aurent/shared-api';

export {
  isApiNetworkError,
  notifyNetworkOffline,
  notifyNetworkOnline,
  AURENT_NETWORK_OFFLINE_EVENT,
  AURENT_NETWORK_ONLINE_EVENT,
} from '@aurent/shared-api';

/** Desktop: сеть/прокси недоступны — можно перейти на офлайн-продажу. */
export function isApiUnreachableError(error) {
  if (isApiNetworkError(error)) return true;
  if (!isDesktopOfflineBridge()) return false;
  const status = error?.response?.status;
  return status === 502 || status === 503 || status === 504;
}
