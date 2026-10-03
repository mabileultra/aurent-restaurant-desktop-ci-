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
  setPeerHubUrl,
  isPeerHubAutoSync,
  HUB_DIRTY_EVENT,
  emitHubFloorDirty,
} from '../../../services/offline/peerHubSettings';
import { discoverLanHubs } from '../../../services/offline/discoverLanHubs';

const PEER_PULL_MS = 4_000;
const DISCOVER_EVERY_MS = 30_000;
let lastDiscoverAt = 0;

function sameHubUrl(a, b) {
  return String(a || '').replace(/\/$/, '') === String(b || '').replace(/\/$/, '');
}

async function resolvePeerHubUrl() {
  let url = getPeerHubUrl();
  if (url) return url;
  const now = Date.now();
  if (now - lastDiscoverAt < DISCOVER_EVERY_MS) return '';
  lastDiscoverAt = now;
  try {
    const hits = await discoverLanHubs({ timeoutMs: 280 });
    const best = hits[0];
    if (best?.url) {
      setPeerHubUrl(best.url);
      return best.url;
    }
  } catch {
    /* LAN probe failed */
  }
  return '';
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
      // Auto-discover monoblock when peer URL was never set (main PC otherwise stays blind).
      const url = await resolvePeerHubUrl();
      if (!url) return;
      if (!isPeerHubAutoSync()) return;
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
        void qc.invalidateQueries({ queryKey: ['rst-order'] });
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
