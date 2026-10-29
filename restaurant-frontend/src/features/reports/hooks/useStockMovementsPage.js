import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { REPORT_PAGE_SIZE_COMPACT, STOCK_MOVEMENT_TYPES } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';
import { useWorkspaceBoundStoreFilter } from './useWorkspaceBoundStoreFilter';

export function useStockMovementsPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange();
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_COMPACT);
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('ALL');
  const { storeId, handleStoreChange } = useWorkspaceBoundStoreFilter(resetPage);
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      from,
      to,
      page,
      size: pageSize,
      search: search.trim() || undefined,
      movementType: movementType === 'ALL' ? undefined : movementType,
      storeId: storeId === '' ? undefined : Number(storeId),
    }),
    [from, to, page, pageSize, search, movementType, storeId],
  );

  const query = useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => stockReportApi.movements(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  return {
    from,
    to,
    setFrom,
    setTo,
    search,
    movementType,
    storeId,
    stores,
    movementTypes: STOCK_MOVEMENT_TYPES,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    handleSearchChange: (value) => {
      setSearch(value);
      resetPage();
    },
    handleMovementTypeChange: (value) => {
      setMovementType(value);
      resetPage();
    },
    handleStoreChange,
  };
}
