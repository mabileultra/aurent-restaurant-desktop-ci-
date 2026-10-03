/**
 * When peer hub URL + auto flag are set, periodically pull snapshot into local SQLite.
 */
import { useEffect } from 'react';
import {
  isRestaurantLocalFirstDesktop,
  rstOfflinePullHubSnapshot,
} from '../../../services/offline/restaurantOfflineBridge';
import { getPeerHubUrl, isPeerHubAutoSync } from '../../../services/offline/peerHubSettings';

const PEER_PULL_MS = 12_000;

export function usePeerHubAutoSync(enabled = true) {
  useEffect(() => {
    if (!enabled || !isRestaurantLocalFirstDesktop()) return undefined;

    const tick = () => {
      if (!isPeerHubAutoSync()) return;
      const url = getPeerHubUrl();
      if (!url) return;
      void rstOfflinePullHubSnapshot(url).catch(() => null);
    };

    tick();
    const timer = window.setInterval(tick, PEER_PULL_MS);
    return () => window.clearInterval(timer);
  }, [enabled]);
}
