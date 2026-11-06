import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { rstOrderApi } from '../../../api/order.api';
import { rstPaymentApi } from '../../../api/payment.api';

const COUNTER_CHANNELS = ['TAKEAWAY', 'DELIVERY'];

/**
 * Warm Sales-tab queries while cashier is on hall / other tabs.
 */
export function usePrefetchCashierSales(storeId, enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || storeId == null) return;

    COUNTER_CHANNELS.forEach((channel) => {
      qc.prefetchQuery({
        queryKey: ['rst-counter-orders', storeId, channel],
        queryFn: () => rstOrderApi.listActive(storeId, channel).then((r) => r.data),
      });
    });

    qc.prefetchQuery({
      queryKey: ['rst-recent-paid', storeId, false],
      queryFn: () =>
        rstPaymentApi.listRecentPaid(storeId, { refunded: false, limit: 100 }).then((r) => r.data ?? []),
    });
  }, [enabled, storeId, qc]);
}
