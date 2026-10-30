import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { warehouseApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';
import { useRestaurantWorkspaceStore } from '../../../restaurant/shared/hooks/useRestaurantWorkspaceStore';

/** Operational transfers list from warehouse DB (not reporting facts). */
export function useStockTransfersReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const workspace = useRestaurantWorkspaceStore();
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: stores = [] } = useReportStores();

  useEffect(() => {
    if (workspace.storeId != null) setFromStoreId(String(workspace.storeId));
  }, [workspace.storeId]);

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      fromStoreId: fromStoreId === '' ? undefined : Number(fromStoreId),
      toStoreId: toStoreId === '' ? undefined : Number(toStoreId),
    }),
    [from, to, page, pageSize, fromStoreId, toStoreId],
  );

  const query = useQuery({
    queryKey: ['stock-transfers-list', params],
    queryFn: () => warehouseApi.listTransfers(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  return {
    from,
    to,
    setFrom,
    setTo,
    fromStoreId,
    toStoreId,
    stores,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    handleFromStoreChange: (value) => {
      setFromStoreId(value);
      resetPage();
    },
    handleToStoreChange: (value) => {
      setToStoreId(value);
      resetPage();
    },
    createOpen,
    openCreate: () => setCreateOpen(true),
    closeCreate: () => setCreateOpen(false),
    refetch: query.refetch,
  };
}
