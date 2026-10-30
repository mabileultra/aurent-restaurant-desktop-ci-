import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rstFloorApi } from '../../api/floor.api';

/** ~2k concurrent: 3s watermark still feels live, half the revision RPS of 2s. */
const REVISION_POLL_MS = 3_000;

/**
 * Stage B: poll a tiny floor-revision watermark and invalidate heavy queries
 * only when the floor revision changes (other cashier, booking, table).
 * Kitchen and the open check keep their own polls.
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
    // Skip order refetch while qty/remove mutations are in flight — otherwise a
    // stale GET can put deleted lines back on the waiter ticket for a beat.
    const lineMutating = activeOrderId != null
      && qc.isMutating({ mutationKey: ['rst-order-line', activeOrderId] }) > 0;
    if (!lineMutating) {
      if (activeOrderId) {
        qc.invalidateQueries({ queryKey: ['rst-order', activeOrderId] });
      } else {
        qc.invalidateQueries({ queryKey: ['rst-order'] });
      }
    }
    if (syncKitchen) {
      qc.invalidateQueries({ queryKey: ['rst-kitchen-tickets', storeId] });
    }
  }, [revision, storeId, activeOrderId, syncKitchen, qc]);

  return revisionQuery;
}
