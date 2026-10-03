/**
 * Peer desktop (main PC) pulls monoblock hub snapshot into local SQLite.
 * Also listens for hub-dirty on the hub station itself to refresh UI instantly.
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  isRestaurantLocalFirstDesktop,
  rstOfflineGetStatus,
  rstOfflinePullHubSnapshot,
} from '../../../services/offline/restaurantOfflineBridge';
import {
  getPeerHubUrl,
  isPeerHubAutoSync,
  HUB_DIRTY_EVENT,
  emitHubFloorDirty,
} from '../../../services/offline/peerHubSettings';

const PEER_PULL_MS = 4_000;

function sameHubUrl(a, b) {
  return String(a || '').replace(/\/$/, '') === String(b || '').replace(/\/$/, '');
}

export function usePeerHubAutoSync(enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || !isRestaurantLocalFirstDesktop()) return undefined;

    const desk = typeof window !== 'undefined' ? window.desktopCashier : null;
    let offHubDirty = null;
    if (typeof desk?.onRstOfflineHubDirty === 'function') {
      offHubDirty = desk.onRstOfflineHubDirty((payload) => {
        emitHubFloorDirty(payload || {});
        void qc.invalidateQueries({ queryKey: ['rst-floor'] });
        void qc.invalidateQueries({ queryKey: ['rst-order'] });
        void qc.invalidateQueries({ queryKey: ['rst-counter-orders'] });
      });
    }

    const onDomDirty = () => {
      void qc.invalidateQueries({ queryKey: ['rst-floor'] });
      void qc.invalidateQueries({ queryKey: ['rst-order'] });
    };
    window.addEventListener(HUB_DIRTY_EVENT, onDomDirty);

    const tick = async () => {
      if (!isPeerHubAutoSync()) return;
      const url = getPeerHubUrl();
      if (!url) return;
      try {
        const status = await rstOfflineGetStatus();
        // Monoblock that hosts the hub already has the data — don't pull yourself.
        if (status?.hub?.listening && sameHubUrl(status?.hub?.url, url)) return;
      } catch {
        /* pull anyway */
      }
      try {
        await rstOfflinePullHubSnapshot(url);
        void qc.invalidateQueries({ queryKey: ['rst-floor'] });
      } catch {
        /* offline peer */
      }
    };

    void tick();
    const timer = window.setInterval(() => { void tick(); }, PEER_PULL_MS);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(HUB_DIRTY_EVENT, onDomDirty);
      if (typeof offHubDirty === 'function') offHubDirty();
    };
  }, [enabled, qc]);
}
