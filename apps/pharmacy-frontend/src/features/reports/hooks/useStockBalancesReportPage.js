import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { pharmacyWarehouseApi } from '../../../api';
import { productManufacturer } from '../../pharmacy-stock/utils/pharmacyReceiptPricing';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

function mapProductRow(p) {
  const qty = Number(p?.stockQuantity ?? 0);
  const cost = Number(p?.costPrice ?? 0);
  return {
    productId: p.id,
    productName: p.name,
    sku: p.sku,
    barcode: p.barcode,
    manufacturer: productManufacturer(p) || '',
    stockQuantity: qty,
    lowStockAlert: p?.lowStockAlert ?? 0,
    stockValue: Number.isFinite(cost) && Number.isFinite(qty) ? cost * Math.max(qty, 0) : 0,
  };
}

/** Pharmacy balances — live catalog stock, not grocery /warehouse/reports. */
export function useStockBalancesReportPage() {
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const [onlyWithStock, setOnlyWithStock] = useState(false);
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      storeId: storeId === '' ? undefined : Number(storeId),
      activeOnly: true,
      scope: 'ACTIVE',
      fromReceipts: false,
    }),
    [page, pageSize, storeId, search],
  );

  const query = useQuery({
    queryKey: ['pharmacy-stock-balances', params],
    queryFn: () => pharmacyWarehouseApi.listProducts(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => {
    const mapped = (query.data?.content ?? []).map(mapProductRow);
    if (!onlyWithStock) return mapped;
    return mapped.filter((row) => Number(row.stockQuantity) > 0);
  }, [query.data, onlyWithStock]);

  const handleSearchChange = (value) => {
    setSearch(value);
    resetPage();
  };

  const handleStoreChange = (value) => {
    setStoreId(value);
    resetPage();
  };

  const handleOnlyWithStockChange = (checked) => {
    setOnlyWithStock(checked);
    resetPage();
  };

  const fetchExportBlob = async () => {
    const data = await pharmacyWarehouseApi.listProducts({
      ...params,
      page: 0,
      size: 500,
    }).then((r) => r.data);
    let list = (data?.content ?? []).map(mapProductRow);
    if (onlyWithStock) list = list.filter((row) => Number(row.stockQuantity) > 0);
    const header = ['name', 'sku', 'barcode', 'manufacturer', 'qty', 'min', 'stockValue'];
    const lines = [
      header.join(','),
      ...list.map((row) => [
        JSON.stringify(row.productName ?? ''),
        JSON.stringify(row.sku ?? ''),
        JSON.stringify(row.barcode ?? ''),
        JSON.stringify(row.manufacturer ?? ''),
        row.stockQuantity,
        row.lowStockAlert,
        row.stockValue,
      ].join(',')),
    ];
    return { data: new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }) };
  };

  return {
    search,
    storeId,
    onlyWithStock,
    stores,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows,
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    handleSearchChange,
    handleStoreChange,
    handleOnlyWithStockChange,
    fetchExportBlob,
  };
}
