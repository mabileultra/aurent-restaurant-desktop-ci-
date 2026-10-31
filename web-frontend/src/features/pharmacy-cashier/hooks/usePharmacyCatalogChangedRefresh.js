import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribePharmacyCatalogChanged } from '../../pharmacy-stock/utils/pharmacyCatalogChangedNotify';
import { refreshCatalogBootstrap } from '../../../services/offline/offlineSyncService';
import { isDesktopOfflineBridge } from '../../../services/offline/desktopOfflineBridge';

/**
 * После проведения прихода в другой вкладке/окне — сбросить кэш кассы
 * и принудительно обновить desktop SQLite (иначе «товара нет»).
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
        qc.invalidateQueries({ queryKey: ['pos-products'] });
        qc.invalidateQueries({ queryKey: ['pharmacy-fefo-hints'] });
        qc.invalidateQueries({ queryKey: ['pharmacy-lots'] });
        if (isDesktopOfflineBridge()) {
          await refreshCatalogBootstrap(storeId, {
            force: true,
            catalogKind: 'pharmacy',
          });
          qc.invalidateQueries({ queryKey: ['pos-products'] });
        }
      } catch {
        /* сеть/офлайн — список всё равно инвалидирован */
      } finally {
        busyRef.current = false;
      }
    });
  }, [qc, storeId]);
}
