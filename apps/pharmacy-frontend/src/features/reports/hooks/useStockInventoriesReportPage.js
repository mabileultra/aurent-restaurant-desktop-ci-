import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { pharmacyWarehouseApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportDateRange } from './useReportDateRange';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useStockInventoriesReportPage() {
  const { from, to, setFrom, setTo, rangeEnabled } = useReportDateRange(29);
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [storeId, setStoreId] = useState('');
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({ from, to, page, size: pageSize, storeId: storeId === '' ? undefined : Number(storeId) }),
    [from, to, page, pageSize, storeId],
  );

  const exportParams = useMemo(
    () => ({ from, to, storeId: storeId === '' ? undefined : Number(storeId) }),
    [from, to, storeId],
  );

  const query = useQuery({
    queryKey: ['pharmacy-inventories-list', params],
    queryFn: () => pharmacyWarehouseApi.listInventories(params).then((r) => r.data),
    enabled: rangeEnabled,
    placeholderData: keepPreviousData,
  });

  const handleStoreChange = (value) => {
    setStoreId(value);
    resetPage();
  };

  const fetchExportBlob = async () => {
    const data = await pharmacyWarehouseApi.listInventories({
      ...exportParams,
      page: 0,
      size: 500,
    }).then((r) => r.data);
    const list = data?.content ?? [];
    const header = ['inventoryNumber', 'createdAt', 'storeName', 'totalLines', 'totalDifference'];
    const lines = [
      header.join(','),
      ...list.map((row) => [
        JSON.stringify(row.inventoryNumber ?? ''),
        JSON.stringify(row.createdAt ?? ''),
        JSON.stringify(row.storeName ?? ''),
        row.totalLines ?? 0,
        row.totalDifference ?? 0,
      ].join(',')),
    ];
    return { data: new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }) };
  };

  return {
    from,
    to,
    setFrom,
    setTo,
    storeId,
    stores,
    exportParams,
    fetchExportBlob,
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
    refetch: query.refetch,
  };
}
