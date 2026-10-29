import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { warehouseApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';
import { useWorkspaceBoundStoreFilter } from './useWorkspaceBoundStoreFilter';

export function useStockExpensesReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const { storeId, handleStoreChange } = useWorkspaceBoundStoreFilter(resetPage);
  const [createOpen, setCreateOpen] = useState(false);
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, storeId],
  );

  const query = useQuery({
    queryKey: ['stock-expenses', params],
    queryFn: () => warehouseApi.listExpenses(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  return {
    from,
    to,
    setFrom,
    setTo,
    storeId,
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
    handleStoreChange,
    createOpen,
    openCreate: () => setCreateOpen(true),
    closeCreate: () => setCreateOpen(false),
    refetch: query.refetch,
  };
}
