import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { pharmacyWarehouseApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useStockTransfersReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

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

  const exportParams = useMemo(
    () => ({
      from,
      to,
      fromStoreId: fromStoreId === '' ? undefined : Number(fromStoreId),
      toStoreId: toStoreId === '' ? undefined : Number(toStoreId),
    }),
    [from, to, fromStoreId, toStoreId],
  );

  const query = useQuery({
    queryKey: ['pharmacy-stock-transfers-list', params],
    queryFn: () => pharmacyWarehouseApi.listTransfers(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const handleFromStoreChange = (value) => {
    setFromStoreId(value);
    resetPage();
  };

  const handleToStoreChange = (value) => {
    setToStoreId(value);
    resetPage();
  };

  const storeNameById = useMemo(() => {
    const map = new Map();
    for (const store of stores) {
      map.set(Number(store.id), store.name);
    }
    return map;
  }, [stores]);

  const rows = useMemo(() => {
    const raw = query.data?.content ?? [];
    return raw.map((row) => ({
      ...row,
      fromStoreName: row.fromStoreName || storeNameById.get(Number(row.fromStoreId)) || row.fromStoreId,
      toStoreName: row.toStoreName || storeNameById.get(Number(row.toStoreId)) || row.toStoreId,
    }));
  }, [query.data?.content, storeNameById]);

  return {
    from,
    to,
    setFrom,
    setTo,
    fromStoreId,
    toStoreId,
    stores,
    exportParams,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows,
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    isError: query.isError,
    handleFromStoreChange,
    handleToStoreChange,
  };
}
