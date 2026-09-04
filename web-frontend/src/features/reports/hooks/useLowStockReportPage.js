import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportPagination } from './useReportPagination';

export function useLowStockReportPage() {
  const { tenantKey, tenantReady } = useTenantScope();
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: tenantKey('reports-low-stock', page, pageSize),
    queryFn: () => stockReportApi.lowStock({ page, size: pageSize }).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: tenantReady,
  });

  const allRows = query.data?.content ?? [];
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) => {
      const hay = `${row.productName ?? ''} ${row.sku ?? ''} ${row.barcode ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allRows, search]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    handleSearchChange: (value) => {
      setSearch(value);
      resetPage();
    },
    rows,
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
}
