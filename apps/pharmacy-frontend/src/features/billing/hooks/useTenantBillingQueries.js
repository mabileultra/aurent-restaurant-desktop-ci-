import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tenantBillingApi } from '../../../api';

export function useTenantBillingQueries({
  ledgerType,
  ledgerPage,
  ledgerPageSize,
  onlineIntentId,
  payOpen,
}) {
  const qc = useQueryClient();

  const meQ = useQuery({
    queryKey: ['tenant-billing-me'],
    queryFn: () => tenantBillingApi.me().then((r) => r.data),
  });

  const ledgerQ = useQuery({
    queryKey: ['tenant-billing-ledger', ledgerType, ledgerPage, ledgerPageSize],
    queryFn: () =>
      tenantBillingApi
        .ledger({
          type: ledgerType || undefined,
          page: ledgerPage,
          size: ledgerPageSize,
          sort: 'createdAt,desc',
        })
        .then((r) => r.data),
  });

  const topUpsQ = useQuery({
    queryKey: ['tenant-billing-topups'],
    queryFn: () => tenantBillingApi.topUps({ size: 10 }).then((r) => r.data),
  });

  const paymentsQ = useQuery({
    queryKey: ['tenant-billing-payments'],
    queryFn: () => tenantBillingApi.payments({ size: 20, sort: 'createdAt,desc' }).then((r) => r.data),
  });

  const onlinePayQ = useQuery({
    queryKey: ['tenant-billing-payment', onlineIntentId],
    queryFn: () => tenantBillingApi.payment(onlineIntentId).then((r) => r.data),
    enabled: Boolean(onlineIntentId) && payOpen,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'PAID' || status === 'CANCELLED' || status === 'FAILED') return false;
      return 3000;
    },
  });

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['tenant-billing-me'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-topups'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-ledger'] });
    qc.invalidateQueries({ queryKey: ['tenant-billing-payments'] });
  }, [qc]);

  return {
    qc,
    meQ,
    ledgerQ,
    topUpsQ,
    paymentsQ,
    onlinePayQ,
    refresh,
  };
}
