import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { warehouseApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';
import { useWorkspaceBoundStoreFilter } from './useWorkspaceBoundStoreFilter';

/**
 * Operational receipts list from warehouse DB (not reporting facts / Kafka).
 */
export function useStockReceiptsReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const { storeId, handleStoreChange } = useWorkspaceBoundStoreFilter(resetPage);
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
    queryKey: ['stock-receipts-list', params],
    queryFn: () => warehouseApi.listReceipts(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const exportParams = useMemo(
    () => ({
      from,
      to,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, storeId],
  );

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
    exportParams,
    refetch: query.refetch,
  };
}
