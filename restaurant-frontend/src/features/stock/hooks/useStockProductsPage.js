import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { warehouseApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import {
  STOCK_PAGE_SIZE_DEFAULT,
  STOCK_PRODUCT_DEFAULT_FILTERS,
  canManageStock,
} from '../constants';
import { getApiErrorMessage } from '../../../utils/apiError';

export function useStockProductsPage({ preferredStoreId = null } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const manage = canManageStock(user?.role);
  const { stores, onlyStore, needsStorePick, resolveStoreId } = useCompanyStores();

  const [storeId, setStoreId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(STOCK_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [filters, setFilters] = useState(STOCK_PRODUCT_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(STOCK_PRODUCT_DEFAULT_FILTERS);
  const [rowMenu, setRowMenu] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [receiveProduct, setReceiveProduct] = useState(null);

  useEffect(() => {
    if (preferredStoreId != null && preferredStoreId !== '') {
      setStoreId(String(preferredStoreId));
      return;
    }
    if (onlyStore) setStoreId(String(onlyStore.id));
  }, [preferredStoreId, onlyStore]);

  const effectiveStoreId = resolveStoreId(storeId);

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      barcode: applied.barcode.trim() || undefined,
      markedProduct:
        applied.markedProduct === '' ? undefined : applied.markedProduct === 'true',
      storeId: effectiveStoreId ?? undefined,
    }),
    [search, page, pageSize, applied, effectiveStoreId],
  );

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['warehouse-products', queryParams],
    queryFn: () => warehouseApi.getProducts(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: !needsStorePick || effectiveStoreId != null,
  });

  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;
  const showEmptyHint = !loading && !isFetching && !isError && total === 0 && effectiveStoreId != null;

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) setPage(totalPages - 1);
  }, [totalPages, page]);

  useEffect(() => {
    setRowMenu(null);
  }, [page, search, applied.barcode, applied.markedProduct, effectiveStoreId]);

  const displayBarcode = useCallback((p) => {
    if (p.barcodes?.length) return p.barcodes[0];
    return p.barcode || '—';
  }, []);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleStoreChange = (value) => {
    setStoreId(value);
    setPage(0);
  };

  const resetFilters = () => {
    setFilters(STOCK_PRODUCT_DEFAULT_FILTERS);
    setApplied(STOCK_PRODUCT_DEFAULT_FILTERS);
    setPage(0);
    setFiltersOpen(false);
  };

  const applyFilters = () => {
    setApplied(filters);
    setPage(0);
    setFiltersOpen(false);
  };

  const openRowMenu = (product, rect) => {
    setRowMenu((cur) => (cur?.product?.id === product.id ? null : { product, rect }));
  };

  const invalidateCaches = useCallback(() => invalidateProductCaches(qc), [qc]);

  const errorMessage = getApiErrorMessage(error, t('stockModule.loadError'));

  return {
    t,
    manage,
    stores,
    needsStorePick,
    storeId,
    effectiveStoreId,
    handleStoreChange,
    search,
    page,
    pageSize,
    setPage,
    setPageSize,
    filtersOpen,
    setFiltersOpen,
    receiveOpen,
    setReceiveOpen,
    filters,
    setFilters,
    rowMenu,
    stockProduct,
    setStockProduct,
    receiveProduct,
    setReceiveProduct,
    rows,
    total,
    totalPages,
    loading,
    isError,
    errorMessage,
    showEmptyHint,
    displayBarcode,
    handleSearchChange,
    resetFilters,
    applyFilters,
    openRowMenu,
    closeRowMenu: () => setRowMenu(null),
    invalidateCaches,
  };
}
