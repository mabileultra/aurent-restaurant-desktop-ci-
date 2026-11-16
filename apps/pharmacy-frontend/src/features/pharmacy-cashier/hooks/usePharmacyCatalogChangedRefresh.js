import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribePharmacyCatalogChanged } from '../../pharmacy-stock/utils/pharmacyCatalogChangedNotify';
import { refreshPharmacyCashierCatalog } from '../utils/refreshPharmacyCashierCatalog';

/**
 * После проведения прихода/инвентаризации в другой вкладке/окне —
 * сбросить кэш кассы и принудительно обновить desktop SQLite.
 */
export function usePharmacyCatalogChangedRefresh(storeId) {
  const qc = useQueryClient();
  const busyRef = useRef(false);

  useEffect(() => {
    if (storeId == null) return undefined;

    return subscribePharmacyCatalogChanged(async (detail) => {
      if (
        detail?.storeId != null
        && Number(detail.storeId) !== Number(storeId)
      ) {
        return;
      }
      if (busyRef.current) return;
      busyRef.current = true;
      try {
        await refreshPharmacyCashierCatalog(qc, storeId, { syncDesktop: true });
      } finally {
        busyRef.current = false;
      }
    });
  }, [qc, storeId]);
}
