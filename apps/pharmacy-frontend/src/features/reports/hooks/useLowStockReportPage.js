import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { pharmacyWarehouseApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportPagination } from './useReportPagination';

function asLowStockList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function normalizeLowStockRow(p) {
  const qty = Number(p?.stockQuantity ?? 0);
  const min = Number(p?.lowStockAlert ?? 0);
  const cost = Number(p?.costPrice ?? p?.purchasePrice ?? 0);
  const deficit = p?.deficit != null ? Number(p.deficit) : Math.max(0, min - qty);
  const stockValueEstimate =
    p?.stockValueEstimate != null
      ? Number(p.stockValueEstimate)
      : Number.isFinite(cost) && Number.isFinite(qty)
        ? cost * Math.max(qty, 0)
        : 0;
  return {
    ...p,
    productId: p?.productId ?? p?.id,
    productName: p?.productName ?? p?.name ?? '',
    sku: p?.sku ?? '',
    barcode: p?.barcode ?? '',
    stockQuantity: qty,
    lowStockAlert: min,
    deficit,
    stockValueEstimate,
  };
}

export function useLowStockReportPage() {
  const { tenantKey, tenantReady } = useTenantScope();
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: tenantKey('reports-low-stock', 'pharmacy'),
    queryFn: () => pharmacyWarehouseApi.getLowStock({ limit: 500 }).then((r) => asLowStockList(r.data)),
    placeholderData: keepPreviousData,
    enabled: tenantReady,
  });

  const filtered = useMemo(() => {
    const allRows = (query.data ?? []).map(normalizeLowStockRow);
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) => {
      const hay = `${row.productName ?? ''} ${row.sku ?? ''} ${row.barcode ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query.data, search]);

  const rows = useMemo(
    () => filtered.slice(page * pageSize, (page + 1) * pageSize),
    [filtered, page, pageSize],
  );

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
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  };
}
