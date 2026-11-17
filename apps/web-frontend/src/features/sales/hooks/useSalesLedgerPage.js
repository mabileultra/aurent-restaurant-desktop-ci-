import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { saleApi, storeApi, pharmacySalesApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { salePaymentLabel } from '../../../utils/salePaymentLabel';
import { SALES_LEDGER_DEFAULT_FILTERS, SALES_PAGE_SIZE_DEFAULT } from '../constants';
import {
  buildSalesQueryParams,
  buildSalesExportParams,
  enrichSalesRowsWithStores,
  formatSaleDateTime,
  exportSalesExcelFile,
} from '../utils/salesLedgerHelpers';

export function useSalesLedgerPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { tenantKey, tenantReady } = useTenantScope();
  const { isPharmacyCompany, isLoading: businessTypeLoading } = useCompanyBusinessType();
  const catalogKind = isPharmacyCompany ? 'pharmacy' : 'grocery';
  const salesClient = catalogKind === 'pharmacy' ? pharmacySalesApi : saleApi;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(SALES_PAGE_SIZE_DEFAULT);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(SALES_LEDGER_DEFAULT_FILTERS);
  const [applied, setApplied] = useState(SALES_LEDGER_DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [rowMenu, setRowMenu] = useState(null);
  const [printSaleId, setPrintSaleId] = useState(null);
  const [returnSaleId, setReturnSaleId] = useState(null);
  const [createReturnOpen, setCreateReturnOpen] = useState(false);
  const selectAllRef = useRef(null);

  const { data: stores = [] } = useQuery({
    queryKey: tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    enabled: tenantReady,
  });

  const queryParams = useMemo(
    () => buildSalesQueryParams(applied, { page, pageSize, search }),
    [applied, page, pageSize, search]
  );

  const exportParams = useMemo(
    () => buildSalesExportParams(applied, search),
    [applied, search]
  );

  const { data, isPending, isError, error } = useQuery({
    queryKey: tenantKey('sales-ledger', catalogKind, queryParams),
    queryFn: () => salesClient.getAll(queryParams).then((r) => r.data),
    enabled: tenantReady && !businessTypeLoading,
  });

  const rows = useMemo(
    () => enrichSalesRowsWithStores(data?.content, stores),
    [data?.content, stores]
  );
  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const loading = isPending;

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = somePageSelected && !allPageSelected;
    }
  }, [somePageSelected, allPageSelected]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const paymentLabel = useCallback((row) => salePaymentLabel(row, t), [t]);

  const paymentIconMethod = useCallback(
    (row) =>
      row.receiptType === 'CREDIT' || row.receiptType === 'ADVANCE' ? row.receiptType : row.paymentMethod,
    []
  );

  const handleExportSalesExcel = useCallback(
    () => exportSalesExcelFile(exportParams, { isPharmacy: catalogKind === 'pharmacy', t, saleApi, toast }),
    [catalogKind, exportParams, t]
  );

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  const resetFilters = () => {
    const f = { ...SALES_LEDGER_DEFAULT_FILTERS };
    setFilters(f);
    setApplied(f);
    setPage(0);
  };

  const applyFilters = () => {
    setApplied({ ...filters });
    setPage(0);
    setFiltersOpen(false);
  };

  const openRowMenu = (row, rect) => {
    setRowMenu((cur) => (cur?.row?.id === row.id ? null : { row, rect }));
  };

  const closeRowMenu = () => setRowMenu(null);

  const invalidateSalesQueries = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['sales-ledger'] });
    qc.invalidateQueries({ queryKey: ['returns'] });
  }, [qc]);

  const errorMessage =
    error?.response?.data?.message ?? error?.message ?? t('salesLedger.loadError');

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
    selectedIds,
    rowMenu,
    printSaleId,
    setPrintSaleId,
    returnSaleId,
    setReturnSaleId,
    createReturnOpen,
    setCreateReturnOpen,
    selectAllRef,
    rows,
    total,
    totalPages,
    loading,
    isError,
    errorMessage,
    allPageSelected,
    toggleSelect,
    toggleSelectAllPage,
    paymentLabel,
    paymentIconMethod,
    fmtAt: formatSaleDateTime,
    handleSearchChange,
    handleExportSalesExcel,
    resetFilters,
    applyFilters,
    openRowMenu,
    closeRowMenu,
    invalidateSalesQueries,
  };
}
