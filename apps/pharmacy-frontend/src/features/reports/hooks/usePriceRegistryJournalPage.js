import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { pharmacyWarehouseApi } from '../../../api';
import { resolvePharmacyApiError } from '../../../pharmacy/errors/resolvePharmacyApiError';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportPagination } from './useReportPagination';

export function usePriceRegistryJournalPage(t) {
  const qc = useQueryClient();
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [status, setStatus] = useState('PENDING');

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      status: status || undefined,
    }),
    [page, pageSize, status],
  );

  const journalQuery = useQuery({
    queryKey: ['pharmacy-price-registry-journal', params],
    queryFn: () => pharmacyWarehouseApi.priceRegistryJournal(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const latestQuery = useQuery({
    queryKey: ['pharmacy-price-registry-latest'],
    queryFn: () => pharmacyWarehouseApi.priceRegistryLatest().then((r) => r.data),
    retry: false,
  });

  const syncMutation = useMutation({
    mutationFn: () => pharmacyWarehouseApi.priceRegistrySync().then((r) => r.data),
    onSuccess: (data) => {
      toast.success(
        t('priceRegistry.syncDone', {
          pending: data?.pendingOverLimit ?? 0,
          rows: data?.registryRows ?? 0,
        }),
      );
      qc.invalidateQueries({ queryKey: ['pharmacy-price-registry-journal'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-price-registry-latest'] });
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const applyMutation = useMutation({
    mutationFn: () => pharmacyWarehouseApi.priceRegistryApply({
      snapshotId: latestQuery.data?.id,
    }).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(t('priceRegistry.applyDone', { count: data?.applied ?? 0 }));
      qc.invalidateQueries({ queryKey: ['pharmacy-price-registry-journal'] });
      qc.invalidateQueries({ queryKey: ['pharmacy-products'] });
    },
    onError: (e) => toast.error(resolvePharmacyApiError(e, t)),
  });

  const handleStatusChange = (value) => {
    setStatus(value);
    resetPage();
  };

  return {
    status,
    handleStatusChange,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: journalQuery.data?.content ?? [],
    total: journalQuery.data?.totalElements ?? 0,
    totalPages: journalQuery.data?.totalPages ?? 0,
    isPending: journalQuery.isPending,
    latest: latestQuery.data,
    sync: syncMutation.mutate,
    syncing: syncMutation.isPending,
    apply: applyMutation.mutate,
    applying: applyMutation.isPending,
  };
}
