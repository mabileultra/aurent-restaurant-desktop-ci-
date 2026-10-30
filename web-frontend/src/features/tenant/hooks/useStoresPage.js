import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { storeApi, companyApi, platformBusinessTypeApi } from '../../../api';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { resolveStoresKpi } from './resolveStoresKpi';
import { useStoresGroupedQuery } from './useStoresGroupedQuery';
import { useStoresPageMutations } from './useStoresPageMutations';
import { useStoresPlatformStats } from './useStoresPlatformStats';
import { useStoresPageFilters } from './useStoresPageFilters';

export function useStoresPage({
  showCompanySelect = false,
  companyIdFilter,
  companies: companiesProp = [],
} = {}) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [pharmacyIntegrationStore, setPharmacyIntegrationStore] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [expandedCompanyIds, setExpandedCompanyIds] = useState(() => new Set());
  const [hasUserToggledGrouped, setHasUserToggledGrouped] = useState(false);

  const filters = useStoresPageFilters({ showCompanySelect, companyIdFilter });

  // Auto-fetch companies for filter dropdown and grouped view when in platform view
  const { data: companiesData } = useQuery({
    queryKey: ['stores-page-companies'],
    queryFn: () => companyApi.getAll({ page: 0, size: 200, sort: 'name,asc' }).then((r) => r.data),
    staleTime: 120_000,
    enabled: showCompanySelect && (!companiesProp || companiesProp.length === 0),
  });

  const companies = (companiesProp && companiesProp.length > 0)
    ? companiesProp
    : (companiesData?.content ?? []);

  const storesQuery = useQuery({
    queryKey: ['stores-manage', filters.queryParams],
    queryFn: () => storeApi.getManaged(filters.queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: !filters.isGroupedViewActive,
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
    search: filters.debouncedSearch,
    statusFilter: filters.statusFilter,
    businessType: filters.businessType,
    regionCode: filters.regionCode,
    companyId: filters.resolvedCompanyId,
  });

  const groupedQuery = useStoresGroupedQuery({
    enabled: filters.isGroupedViewActive,
    page: filters.groupedPage,
    pageSize: filters.groupedPageSize,
    search: filters.debouncedSearch,
    statusFilter: filters.statusFilter,
    businessType: filters.businessType,
    regionCode: filters.regionCode,
    companyId: filters.resolvedCompanyId,
    companies,
    expandedIds: expandedCompanyIds,
  });

  const rawRows = data?.content ?? [];
  const rows = useMemo(() => {
    if (filters.statusFilter === 'ACTIVE') return rawRows.filter((r) => r.active);
    if (filters.statusFilter === 'INACTIVE') return rawRows.filter((r) => !r.active);
    return rawRows;
  }, [rawRows, filters.statusFilter]);

  const total = data?.totalElements ?? rows.length;
  const kpi = resolveStoresKpi({
    stats,
    total,
    rawRows,
    statusFilter: filters.statusFilter,
    resolvedCompanyId: filters.resolvedCompanyId,
    companiesCountFallback: companies?.length || 0,
  });

  const pageFirstLoad = filters.isGroupedViewActive ? groupedQuery.firstLoad : tableFirstLoad;
  const pageRefreshing = filters.isGroupedViewActive ? groupedQuery.isRefreshing : tableRefreshing;
  const pageOverlay = filters.isGroupedViewActive ? groupedQuery.showOverlay : showRefreshingOverlay;

  return {
    t,
    ...filters,
    setStatusFilter: filters.handleStatusFilterChange,
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
    displayPage: typeof data?.number === 'number' ? data.number : filters.page,
    isPending: pageFirstLoad,
    isError: filters.isGroupedViewActive ? groupedQuery.isError : storesQuery.isError,
    error: filters.isGroupedViewActive ? groupedQuery.error : error,
    refetch: filters.isGroupedViewActive ? undefined : storesQuery.refetch,
    errorMessage: filters.isGroupedViewActive
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
    toggleMutation,
    tryDelete,
    ...kpi,
    selectedStore,
    openQuickDrawer: setSelectedStore,
    closeQuickDrawer: () => setSelectedStore(null),
    allStores: groupedQuery.allLoadedStores,
    groupedGroups: groupedQuery.groups,
    loadingBranchIds: groupedQuery.loadingBranchIds,
    expandedCompanyIds,
    setExpandedCompanyIds,
    hasUserToggledGrouped,
    setHasUserToggledGrouped,
    totalGroups: groupedQuery.totalGroups,
    pharmacyIntegrationStore,
    openPharmacyIntegration: (row) => {
      setPharmacyIntegrationStore(row);
      setMenuId(null);
    },
    closePharmacyIntegration: () => setPharmacyIntegrationStore(null),
  };
}
