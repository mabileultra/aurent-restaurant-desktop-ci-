import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storeApi, platformBusinessTypeApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { TENANT_PAGE_SIZE_DEFAULT } from '../constants';
import { resolveStoresKpi } from './resolveStoresKpi';
import { useStoresGroupedQuery } from './useStoresGroupedQuery';
import { useStoresPageMutations } from './useStoresPageMutations';
import { useStoresPlatformStats } from './useStoresPlatformStats';

export function useStoresPage({ showCompanySelect = false, companyIdFilter, companies = [] } = {}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [companyId, setCompanyId] = useState(
    companyIdFilter != null && companyIdFilter !== '' ? String(companyIdFilter) : ''
  );
  const [businessType, setBusinessType] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(TENANT_PAGE_SIZE_DEFAULT);
  const [groupedPage, setGroupedPage] = useState(0);
  const [groupedPageSize, setGroupedPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [pharmacyIntegrationStore, setPharmacyIntegrationStore] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState(null);
  const [expandedCompanyIds, setExpandedCompanyIds] = useState(() => new Set());
  const [hasUserToggledGrouped, setHasUserToggledGrouped] = useState(false);
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.has('focusCompany') || sp.has('company') || window.location.hash?.startsWith('#company-')) {
        return 'grouped';
      }
      return localStorage.getItem('stores-view-mode') || (showCompanySelect ? 'grouped' : 'table');
    }
    return showCompanySelect ? 'grouped' : 'table';
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stores-view-mode', mode);
    }
  };

  const resolvedCompanyId = showCompanySelect
    ? (companyId ? Number(companyId) : undefined)
    : companyIdFilter;
  const debouncedSearch = useDebouncedValue(search, 300);
  const isGroupedViewActive = Boolean(showCompanySelect && viewMode === 'grouped');

  const queryParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: debouncedSearch.trim() || undefined,
      companyId: resolvedCompanyId,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
      districtCode: districtCode || undefined,
    }),
    [debouncedSearch, page, pageSize, resolvedCompanyId, businessType, regionCode, districtCode]
  );

  const storesQuery = useQuery({
    queryKey: ['stores-manage', queryParams],
    queryFn: () => storeApi.getManaged(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: !isGroupedViewActive,
  });

  const { data, error } = storesQuery;
  const tableFirstLoad = storesQuery.isPending && !data;
  const tableRefreshing = storesQuery.isFetching && !tableFirstLoad;
  const showRefreshingOverlay = useDelayedLoading(tableRefreshing, { delay: 250, minDuration: 400 });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
    enabled: showCompanySelect,
  });

  const { saveMutation, toggleMutation, tryDelete } = useStoresPageMutations({
    t,
    editing,
    setModalOpen,
    setEditing,
    setMenuId,
  });

  const { stats } = useStoresPlatformStats({
    enabled: showCompanySelect,
    search: debouncedSearch,
    statusFilter,
    businessType,
    regionCode,
    companyId: resolvedCompanyId,
  });

  const groupedQuery = useStoresGroupedQuery({
    enabled: isGroupedViewActive,
    page: groupedPage,
    pageSize: groupedPageSize,
    search: debouncedSearch,
    statusFilter,
    businessType,
    regionCode,
    companyId: resolvedCompanyId,
    companies,
    expandedIds: expandedCompanyIds,
  });

  const rawRows = data?.content ?? [];
  const rows = useMemo(() => {
    if (statusFilter === 'ACTIVE') return rawRows.filter((r) => r.active);
    if (statusFilter === 'INACTIVE') return rawRows.filter((r) => !r.active);
    return rawRows;
  }, [rawRows, statusFilter]);

  const total = data?.totalElements ?? rows.length;
  const kpi = resolveStoresKpi({
    stats,
    total,
    rawRows,
    statusFilter,
    resolvedCompanyId,
    companiesCountFallback: companies?.length || 0,
  });

  const resetPages = () => {
    setPage(0);
    setGroupedPage(0);
  };

  const pageFirstLoad = isGroupedViewActive ? groupedQuery.firstLoad : tableFirstLoad;
  const pageRefreshing = isGroupedViewActive ? groupedQuery.isRefreshing : tableRefreshing;
  const pageOverlay = isGroupedViewActive ? groupedQuery.showOverlay : showRefreshingOverlay;

  return {
    t,
    search,
    companyId,
    businessType,
    regionCode,
    districtCode,
    page,
    pageSize,
    setPage,
    setPageSize: (nextSize) => {
      setPageSize(nextSize);
      setPage(0);
    },
    modalOpen,
    editing,
    menuId,
    setMenuId,
    rows,
    total,
    totalPages: data?.totalPages ?? 0,
    firstLoad: pageFirstLoad,
    isRefreshing: pageRefreshing,
    showRefreshingOverlay: pageOverlay,
    displayPage: typeof data?.number === 'number' ? data.number : page,
    isPending: pageFirstLoad,
    isError: isGroupedViewActive ? groupedQuery.isError : storesQuery.isError,
    error: isGroupedViewActive ? groupedQuery.error : error,
    refetch: isGroupedViewActive ? undefined : storesQuery.refetch,
    errorMessage: isGroupedViewActive
      ? (groupedQuery.error?.response?.data?.message ?? groupedQuery.error?.message)
      : (error?.response?.data?.message ?? error?.message),
    showCompanySelect,
    companies,
    businessTypes,
    saveMutation,
    openCreate: (defaults = null) => {
      setEditing(defaults);
      setModalOpen(true);
    },
    openEdit: (row) => {
      setEditing(row);
      setModalOpen(true);
      setMenuId(null);
    },
    closeModal: () => {
      setModalOpen(false);
      setEditing(null);
    },
    handleSearchChange: (value) => {
      setSearch(value);
      resetPages();
    },
    handleCompanyChange: (value) => {
      setCompanyId(value || '');
      resetPages();
    },
    handleBusinessTypeChange: (code) => {
      setBusinessType(code || '');
      resetPages();
    },
    handleGeoChange: ({ regionCode: nextRegion = '', districtCode: nextDistrict = '' }) => {
      setRegionCode(nextRegion || '');
      setDistrictCode(nextDistrict || '');
      resetPages();
    },
    toggleMutation,
    tryDelete,
    statusFilter,
    setStatusFilter: (next) => {
      setStatusFilter(next);
      resetPages();
    },
    ...kpi,
    selectedStore,
    openQuickDrawer: setSelectedStore,
    closeQuickDrawer: () => setSelectedStore(null),
    viewMode,
    setViewMode,
    allStores: groupedQuery.allLoadedStores,
    groupedGroups: groupedQuery.groups,
    loadingBranchIds: groupedQuery.loadingBranchIds,
    expandedCompanyIds,
    setExpandedCompanyIds,
    hasUserToggledGrouped,
    setHasUserToggledGrouped,
    groupedPage,
    setGroupedPage,
    groupedPageSize,
    setGroupedPageSize,
    totalGroups: groupedQuery.totalGroups,
    pharmacyIntegrationStore,
    openPharmacyIntegration: (row) => {
      setPharmacyIntegrationStore(row);
      setMenuId(null);
    },
    closePharmacyIntegration: () => setPharmacyIntegrationStore(null),
  };
}
