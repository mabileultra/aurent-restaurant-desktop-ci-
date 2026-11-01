import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';

/**
 * After Electron live push/pull, bump React Query floor/kitchen caches
 * even if local floor-revision poll has not ticked yet (Stage 3).
 */
export default function useRestaurantDesktopFloorSyncedInvalidate(enabled) {
  const qc = useQueryClient();
  const lastAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || !isRestaurantDesktop()) return undefined;
    if (typeof window.aurentRestaurant?.onStatus !== 'function') return undefined;

    const unsub = window.aurentRestaurant.onStatus((status) => {
      const at = Number(status?.floorSyncedAt || 0);
      if (!at || at <= lastAtRef.current) return;
      lastAtRef.current = at;
      qc.invalidateQueries({ queryKey: ['rst-floor-revision'] });
      qc.invalidateQueries({ queryKey: ['rst-floor'] });
      qc.invalidateQueries({ queryKey: ['rst-counter-orders'] });
      qc.invalidateQueries({ queryKey: ['rst-order'] });
      qc.invalidateQueries({ queryKey: ['rst-kitchen-tickets'] });
    });
    return typeof unsub === 'function' ? unsub : undefined;
  }, [enabled, qc]);
}
