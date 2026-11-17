import { useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { returnApi, storeApi, pharmacySalesApi } from '../../../api';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { RETURNS_DEFAULT_FILTERS, SALES_PAGE_SIZE_DEFAULT } from '../constants';
import {
  buildReturnsQueryParams,
  buildReturnsExportParams,
  enrichReturnsRowsWithStores,
  formatReturnDateTime,
  exportReturnsExcelFile,
} from '../utils/returnsPageHelpers';
import { useReturnMutations } from './useReturnMutations';

export function useReturnsPage() {
  const { t } = useTranslation();
  const { tenantKey, tenantReady } = useTenantScope();
  const { isPharmacyCompany, isLoading: businessTypeLoading } = useCompanyBusinessType();
  const catalogKind = isPharmacyCompany ? 'pharmacy' : 'grocery';
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(SALES_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(RETURNS_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(RETURNS_DEFAULT_FILTERS);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [detailReason, setDetailReason] = useState('');
  const [editRow, setEditRow] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [createReturnOpen, setCreateReturnOpen] = useState(false);
  const [continueReturnSaleId, setContinueReturnSaleId] = useState(null);
  const qc = useQueryClient();

  const invalidateReturnQueries = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['returns'] });
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['my-sales'] });
  }, [qc]);

  const { data: stores = [] } = useQuery({
    queryKey: tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const queryParams = useMemo(
    () => buildReturnsQueryParams(applied, { page, pageSize, search }),
    [applied, page, pageSize, search]
  );

  const exportParams = useMemo(
    () => buildReturnsExportParams(applied, search),
    [applied, search]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: tenantKey('returns', catalogKind, queryParams),
    queryFn: () => (
      catalogKind === 'pharmacy'
        ? pharmacySalesApi.getReturns(queryParams)
        : returnApi.getAll(queryParams)
    ).then((r) => r.data),
    enabled: tenantReady && !businessTypeLoading,
    placeholderData: keepPreviousData,
  });

  const { updateReasonMutation, cancelReturnMutation } = useReturnMutations({
    catalogKind,
    qc,
    t,
    setEditRow,
    setMenuOpenId,
  });

  const rows = useMemo(
    () => enrichReturnsRowsWithStores(data?.content, stores),
    [data?.content, stores]
  );
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;
  const showEmptyHint = !loading && !isError && rows.length === 0;

  const handleExportExcel = useCallback(
    () => exportReturnsExcelFile(exportParams, { applied, isPharmacy: catalogKind === 'pharmacy', t, returnApi, toast, setExporting }),
    [catalogKind, exportParams, applied, t]
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const resetFilters = () => {
    const f = { ...RETURNS_DEFAULT_FILTERS };
    setFilters(f);
    setApplied(f);
    setPage(0);
  };

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(0);
    setFiltersOpen(false);
  };

  const errorMessage =
    error?.response?.status === 403
      ? t('returnsModule.forbidden')
      : error?.response?.data?.message ?? error?.message ?? t('returnsModule.loadError');

  const openDetail = (row) => {
    setDetailId(row.id);
    setDetailReason(row.reason ?? '');
  };

  const closeDetail = () => {
    setDetailId(null);
    setDetailReason('');
  };

  const saveReason = (reason) => {
    updateReasonMutation.mutate({ id: editRow.id, reason });
  };

  const tryCancelReturn = (row) => {
    if (!window.confirm(t('returnsModule.deleteConfirm'))) return;
    cancelReturnMutation.mutate(row.id);
  };

  const startContinueReturn = (row) => {
    setContinueReturnSaleId(row.id);
    setMenuOpenId(null);
  };

  return {
    t,
    catalogKind,
    search,
    page,
    pageSize,
    setPage,
    setPageSize,
    filtersOpen,
    setFiltersOpen,
    filters,
    setFilters,
    stores,
    menuOpenId,
    setMenuOpenId,
    detailId,
    detailReason,
    editRow,
    setEditRow,
    exporting,
    createReturnOpen,
    setCreateReturnOpen,
    continueReturnSaleId,
    setContinueReturnSaleId,
    rows,
    total,
    totalPages,
    loading,
    isError,
    errorMessage,
    showEmptyHint,
    fmtAt: formatReturnDateTime,
    handleSearchChange,
    handleExportExcel,
    resetFilters,
    applyFilters,
    invalidateReturnQueries,
    openDetail,
    closeDetail,
    saveReason,
    tryCancelReturn,
    startContinueReturn,
    updateReasonSaving: updateReasonMutation.isPending,
  };
}
