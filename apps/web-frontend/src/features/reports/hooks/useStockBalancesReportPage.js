import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { stockReportApi } from '../../../api';
import { REPORT_PAGE_SIZE_DEFAULT } from '../constants';
import { useReportCategories } from './useReportCategories';
import { useReportPagination } from './useReportPagination';
import { useReportStores } from './useReportStores';

export function useStockBalancesReportPage() {
  const { page, setPage, pageSize, setPageSize, resetPage } = useReportPagination(REPORT_PAGE_SIZE_DEFAULT);
  const [search, setSearch] = useState('');
  const [storeId, setStoreId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [onlyWithStock, setOnlyWithStock] = useState(false);
  const { data: categories = [] } = useReportCategories();
  const { data: stores = [] } = useReportStores();

  const params = useMemo(
    () => ({
      page,
      size: pageSize,
      onlyWithStock,
      storeId: storeId === '' ? undefined : Number(storeId),
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [page, pageSize, onlyWithStock, storeId, categoryId, search]
  );

  const exportParams = useMemo(
    () => ({
      onlyWithStock,
      storeId: storeId === '' ? undefined : Number(storeId),
      categoryId: categoryId === '' ? undefined : Number(categoryId),
      search: search.trim() || undefined,
    }),
    [onlyWithStock, storeId, categoryId, search]
  );

  const query = useQuery({
    queryKey: ['stock-balances', params],
    queryFn: () => stockReportApi.balances(params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const handleSearchChange = (value) => {
    setSearch(value);
    resetPage();
  };

  const handleStoreChange = (value) => {
    setStoreId(value);
    resetPage();
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value);
    resetPage();
  };

  const handleOnlyWithStockChange = (checked) => {
    setOnlyWithStock(checked);
    resetPage();
  };

  return {
    search,
    storeId,
    categoryId,
    onlyWithStock,
    categories,
    stores,
    exportParams,
    page,
    setPage,
    pageSize,
    setPageSize,
    rows: query.data?.content ?? [],
    total: query.data?.totalElements ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    isPending: query.isPending,
    handleSearchChange,
    handleStoreChange,
    handleCategoryChange,
    handleOnlyWithStockChange,
  };
}
