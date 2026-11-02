import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';

/**
 * After Electron quiet catalog/stock pull, refresh React Query caches
 * (edge DB already updated — UI was still showing stale pages).
 */
export default function useRestaurantDesktopCatalogSyncedInvalidate(enabled) {
  const qc = useQueryClient();
  const lastCatalogAtRef = useRef(0);
  const lastStockAtRef = useRef(0);

  useEffect(() => {
    if (!enabled || !isRestaurantDesktop()) return undefined;
    if (typeof window.aurentRestaurant?.onStatus !== 'function') return undefined;

    const unsub = window.aurentRestaurant.onStatus((status) => {
      const catalogAt = Number(status?.catalogRefreshedAt || 0);
      if (catalogAt && catalogAt > lastCatalogAtRef.current) {
        lastCatalogAtRef.current = catalogAt;
        qc.invalidateQueries({ queryKey: ['rst-menu-pos'] });
        qc.invalidateQueries({ queryKey: ['rst-menu-admin'] });
        qc.invalidateQueries({ queryKey: ['rst-menu-categories'] });
        qc.invalidateQueries({ queryKey: ['rst-menu-categories-admin'] });
        qc.invalidateQueries({ queryKey: ['rst-stations'] });
        qc.invalidateQueries({ queryKey: ['rst-stations-admin'] });
        qc.invalidateQueries({ queryKey: ['rst-modifiers'] });
        qc.invalidateQueries({ queryKey: ['rst-floor'] });
        qc.invalidateQueries({ queryKey: ['rst-dashboard'] });
        qc.invalidateQueries({ queryKey: ['rst-dashboard-halls'] });
      }

      const stockAt = Number(status?.stockRefreshedAt || 0);
      if (stockAt && stockAt > lastStockAtRef.current) {
        lastStockAtRef.current = stockAt;
        qc.invalidateQueries({ queryKey: ['rst-stock-search'] });
        qc.invalidateQueries({ queryKey: ['rst-dashboard-low-stock'] });
        qc.invalidateQueries({ queryKey: ['rst-stores-manage'] });
        qc.invalidateQueries({ queryKey: ['products'] });
        qc.invalidateQueries({ queryKey: ['stores'] });
      }
    });
    return typeof unsub === 'function' ? unsub : undefined;
  }, [enabled, qc]);
}
