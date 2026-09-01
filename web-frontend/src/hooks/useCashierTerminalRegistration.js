import { useEffect } from 'react';
import { cashierTerminalApi } from '../api/cashierTerminal.api';
import { resolvePosRoute } from '../services/pos/posRouteResolver';
import { useConnectivityStore, useShouldUseOfflinePos } from '../store/connectivityStore';
import { buildTerminalRequest, resolveCashierTerminalIdentity } from '../utils/cashierTerminalIdentity';

export function useCashierTerminalRegistration(storeId) {
  const offlineShift = useShouldUseOfflinePos();

  useEffect(() => {
    if (!storeId || offlineShift) return undefined;

    const route = resolvePosRoute(storeId, useConnectivityStore.getState()).route;
    if (route === 'local') return undefined;

    let cancelled = false;

    (async () => {
      try {
        const identity = await resolveCashierTerminalIdentity();
        const terminal = buildTerminalRequest(identity);
        if (!terminal || cancelled) return;
        await cashierTerminalApi.register(storeId, terminal);
      } catch {
        /* best-effort heartbeat */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeId, offlineShift]);
}
