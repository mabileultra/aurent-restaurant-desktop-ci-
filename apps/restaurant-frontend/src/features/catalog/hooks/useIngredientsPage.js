import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { productApi, categoryApi } from '../../../api';
import { useAuthStore } from '../../../store/authStore';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { invalidateProductCaches } from '../../../utils/productCache';
import { useCompanyStores } from '../../../hooks/useCompanyStores';
import {
  canManageCatalog,
  PRODUCT_TABLE_PAGE_SIZE_DEFAULT,
  PRODUCT_TABLE_PAGE_SIZE_OPTIONS,
} from '../constants';
import { filterRowsByNomenclatureType } from '../utils/nomenclatureTypes';
import { getApiErrorMessage, toastApiError } from '../../../utils/apiError';
import { useIngredientsSelection } from './useIngredientsSelection';
import { useIngredientsTableColumns } from './useIngredientsTableColumns';

export function useIngredientsPage({ preferredStoreId = null } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { tenantKey, tenantReady } = useTenantScope();
  const manage = canManageCatalog(user?.role);
  const { stores, onlyStore, resolveStoreId } = useCompanyStores();

  const [search, setSearch] = useState('');
  const [typeTab, setTypeTab] = useState('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PRODUCT_TABLE_PAGE_SIZE_DEFAULT);
  const [rowMenu, setRowMenu] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDefaultType, setCreateDefaultType] = useState('MATERIAL');
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const columns = useIngredientsTableColumns();

  const storeId = useMemo(() => {
    if (preferredStoreId != null && preferredStoreId !== '') return Number(preferredStoreId);
    return resolveStoreId(onlyStore?.id);
  }, [preferredStoreId, onlyStore, resolveStoreId]);

  const createStore = useMemo(() => {
    if (storeId == null) return stores[0] ?? null;
    return stores.find((s) => Number(s.id) === Number(storeId)) ?? stores[0] ?? null;
  }, [stores, storeId]);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      page,
      size: pageSize,
      activeOnly: true,
      storeId: storeId ?? undefined,
    }),
    [search, page, pageSize, storeId],
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: tenantKey('products', queryParams),
    queryFn: () => productApi.getAll(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: tenantReady,
  });

  const { data: categories = [] } = useQuery({
    queryKey: tenantKey('categories'),
    queryFn: () => categoryApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const rawRows = data?.content ?? [];
  const rows = useMemo(
    () => filterRowsByNomenclatureType(rawRows, typeTab),
    [rawRows, typeTab],
  );
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;

  const selection = useIngredientsSelection({ rows, page, search, typeTab });

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) setPage(totalPages - 1);
  }, [totalPages, page]);

  useEffect(() => {
    setRowMenu(null);
  }, [page, search, typeTab]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    if (!createStore) return;
    setEditProduct(null);
    setShowCreate(true);
    const next = new URLSearchParams(searchParams);
    next.delete('create');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, createStore]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const handleTypeTab = (key) => {
    setTypeTab(key);
    setPage(0);
    if (key === 'PRODUCT') setCreateDefaultType('RETAIL');
    else if (key === 'INGREDIENT') setCreateDefaultType('MATERIAL');
  };

  const handleAdd = () => {
    if (!createStore) {
      toast.error(t('stockModal.storeRequired'));
      return;
    }
    setEditProduct(null);
    setShowCreate(true);
  };

  const closeModal = () => {
    setShowCreate(false);
    setEditProduct(null);
  };

  const invalidate = useCallback(() => invalidateProductCaches(qc), [qc]);

  const confirmDelete = async () => {
    if (!deleteProduct) return;
    try {
      await productApi.deactivate(deleteProduct.id);
      toast.success(t('products.deactivated'));
      invalidate();
      setDeleteProduct(null);
    } catch (e) {
      toastApiError(e, t('productModal.saveFailed'));
    }
  };

  return {
    t,
    manage,
    search,
    handleSearchChange,
    typeTab,
    handleTypeTab,
    createDefaultType,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageSizeOptions: PRODUCT_TABLE_PAGE_SIZE_OPTIONS,
    rows,
    total,
    totalPages,
    isLoading: isPending,
    isError,
    errorMessage: getApiErrorMessage(error, t('stockModule.loadError')),
    categories,
    stores,
    createStore,
    storeId,
    rowMenu,
    openRowMenu: (product, rect) => {
      setRowMenu((cur) => (cur?.product?.id === product.id ? null : { product, rect }));
    },
    closeRowMenu: () => setRowMenu(null),
    showCreate,
    editProduct,
    handleAdd,
    setEditProduct: (product) => {
      setShowCreate(false);
      setEditProduct(product);
    },
    closeModal,
    deleteProduct,
    setDeleteProduct,
    confirmDelete,
    invalidate,
    columnDefs: columns.columnDefs,
    visibleColumns: columns.visible,
    visibleDefs: columns.visibleDefs,
    toggleColumn: columns.toggleColumn,
    selectedIds: selection.selectedIds,
    selectAllRef: selection.selectAllRef,
    allPageSelected: selection.allPageSelected,
    toggleSelect: selection.toggleSelect,
    toggleSelectAllPage: selection.toggleSelectAllPage,
    clearSelection: selection.clearSelection,
    importOpen,
    setImportOpen,
    exportOpen,
    setExportOpen,
    bulkDeleteOpen,
    setBulkDeleteOpen,
  };
}
