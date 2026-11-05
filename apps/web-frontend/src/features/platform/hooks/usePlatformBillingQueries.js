import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companyApi, platformBillingApi } from '../../../api';
import {
  BILLING_COLLECTIONS_ENRICH_SIZE,
  unwrapBillingCollectionsPage,
} from '../utils/unwrapBillingCollectionsPage';
import { COLLECTIONS_QUERY_KEY } from './useBillingCollections';

export function usePlatformBillingQueries({ selectedCompanyId, paymentModalOpen }) {
  const qc = useQueryClient();

  const plansQ = useQuery({
    queryKey: ['platform-billing-plans'],
    queryFn: () => platformBillingApi.plans({ activeOnly: false }).then((r) => r.data),
  });

  const topUpsQ = useQuery({
    queryKey: ['platform-billing-topups'],
    queryFn: () => platformBillingApi.topUps({ status: 'PENDING', size: 30 }).then((r) => r.data),
    enabled: true,
  });

  const companyDetailQ = useQuery({
    queryKey: ['platform-company-detail', selectedCompanyId],
    queryFn: () => companyApi.getById(selectedCompanyId).then((r) => r.data),
    enabled: selectedCompanyId != null,
    staleTime: 60_000,
  });

  const ledgerQ = useQuery({
    queryKey: ['platform-billing-ledger', selectedCompanyId],
    queryFn: () => platformBillingApi
      .ledger(selectedCompanyId, { size: 20, sort: 'createdAt,desc' })
      .then((r) => r.data),
    enabled: selectedCompanyId != null,
  });

  const companyPaymentsQ = useQuery({
    queryKey: ['platform-billing-payments', selectedCompanyId],
    queryFn: () => platformBillingApi
      .payments({ companyId: selectedCompanyId, size: 20, sort: 'createdAt,desc' })
      .then((r) => r.data),
    enabled: selectedCompanyId != null,
  });

  const allCompaniesQ = useQuery({
    queryKey: [COLLECTIONS_QUERY_KEY, 'companies', 'all'],
    queryFn: () => platformBillingApi
      .collectionsCompanies({ page: 0, size: BILLING_COLLECTIONS_ENRICH_SIZE })
      .then((r) => unwrapBillingCollectionsPage(r.data).content),
    enabled: paymentModalOpen,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [COLLECTIONS_QUERY_KEY] });
    qc.invalidateQueries({ queryKey: ['platform-billing-topups'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-payments'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-ledger'] });
    qc.invalidateQueries({ queryKey: ['platform-billing-plans'] });
    qc.invalidateQueries({ queryKey: ['platform-company-detail'] });
  };

  return {
    plans: plansQ.data || [],
    topUps: topUpsQ.data?.content || [],
    companyDetail: companyDetailQ.data || null,
    ledger: ledgerQ.data?.content || [],
    ledgerLoading: ledgerQ.isLoading,
    companyPayments: companyPaymentsQ.data?.content || [],
    companyPaymentsLoading: companyPaymentsQ.isLoading,
    allCompanies: allCompaniesQ.data || [],
    invalidate,
  };
}
