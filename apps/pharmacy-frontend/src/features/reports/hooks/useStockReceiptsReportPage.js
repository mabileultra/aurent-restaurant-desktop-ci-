import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { pharmacyWarehouseApi, supplierApi } from '../../../api';
import { resolveStoreName, resolveSupplierName } from '../../pharmacy-stock/utils/pharmacyReceiptDisplayMeta';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useStockReceiptsReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [storeId, setStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.getAll({ page: 0, size: 200 }).then((r) => r.data),
  });

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
    queryFn: () => pharmacyWarehouseApi.listReceipts(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const suppliers = suppliersQuery.data?.content ?? [];
  const rows = useMemo(() => {
    const raw = query.data?.content ?? [];
    return raw.map((row) => ({
      ...row,
      createdAt: row.createdAt || row.documentDate || null,
      storeName: resolveStoreName(row, stores),
      supplierName: resolveSupplierName(row, suppliers),
    }));
  }, [query.data?.content, stores, suppliers]);

  const handleStoreChange = (value) => {
    setStoreId(value);
    resetPage();
  };

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
    rows,
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    handleStoreChange,
  };
}
