import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rstFloorApi } from '../../api/floor.api';

const REVISION_POLL_MS = 2_000;

/**
 * Stage B: poll a tiny floor-revision watermark and invalidate heavy queries
 * only when something actually changed (phone / other POS / kitchen).
 */
export function useStoreFloorSync(storeId, { activeOrderId = null, syncKitchen = false } = {}) {
  const qc = useQueryClient();
  const prevRevRef = useRef(null);

  const revisionQuery = useQuery({
    queryKey: ['rst-floor-revision', storeId],
    queryFn: () => rstFloorApi.getFloorRevision(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 0,
    refetchInterval: REVISION_POLL_MS,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
  });

  const revision = revisionQuery.data?.revision;

  useEffect(() => {
    if (revision == null || storeId == null) return;
    const prev = prevRevRef.current;
    prevRevRef.current = revision;
    if (prev == null || prev === revision) return;

    qc.invalidateQueries({ queryKey: ['rst-floor', storeId] });
    qc.invalidateQueries({ queryKey: ['rst-counter-orders', storeId] });
    if (activeOrderId) {
      qc.invalidateQueries({ queryKey: ['rst-order', activeOrderId] });
    } else {
      qc.invalidateQueries({ queryKey: ['rst-order'] });
    }
    if (syncKitchen) {
      qc.invalidateQueries({ queryKey: ['rst-kitchen-tickets', storeId] });
    }
  }, [revision, storeId, activeOrderId, syncKitchen, qc]);

  return revisionQuery;
}
