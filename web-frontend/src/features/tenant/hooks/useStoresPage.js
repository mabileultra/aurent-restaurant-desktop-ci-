import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { storeApi, platformBusinessTypeApi } from '../../../api';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { TENANT_PAGE_SIZE_DEFAULT } from '../constants';
import { useStoresPlatformStats } from './useStoresPlatformStats';
import { useStoresGroupedQuery } from './useStoresGroupedQuery';

export function useStoresPage({ showCompanySelect = false, companyIdFilter, companies = [] } = {}) {
  const { t } = useTranslation();
  const qc = useQueryClient();
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

  const isGroupedViewActive = Boolean(showCompanySelect && viewMode === 'grouped');

  const storesQuery = useQuery({
    queryKey: ['stores-manage', queryParams],
    queryFn: () => storeApi.getManaged(queryParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: !isGroupedViewActive,
  });

  const { data, error } = storesQuery;
  const tableFirstLoadBase = storesQuery.isPending && !data;
  const tableRefreshingBase = storesQuery.isFetching && !tableFirstLoadBase;
  const showRefreshingOverlay = useDelayedLoading(tableRefreshingBase, { delay: 250, minDuration: 400 });

  const { data: businessTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
    enabled: showCompanySelect,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editing?.id ? storeApi.update(editing.id, payload) : storeApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['stores-all'] });
      qc.invalidateQueries({ queryKey: ['stores-stats'] });
      qc.invalidateQueries({ queryKey: ['stores-by-company'] });
      qc.invalidateQueries({ queryKey: ['stores-company-branches'] });
      qc.invalidateQueries({ predicate: (q) => {
        const key = q.queryKey;
        return Array.isArray(key) && (key.includes('stores-user-form') || key.includes('platform-user-form'));
      }});
      toast.success(editing?.id ? t('stores.updated') : t('stores.created'));
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => storeApi.toggle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['stores-all'] });
      qc.invalidateQueries({ queryKey: ['stores-stats'] });
      qc.invalidateQueries({ queryKey: ['stores-by-company'] });
      qc.invalidateQueries({ queryKey: ['stores-company-branches'] });
      qc.invalidateQueries({ predicate: (q) => {
        const key = q.queryKey;
        return Array.isArray(key) && (key.includes('stores-user-form') || key.includes('platform-user-form'));
      }});
      toast.success(t('stores.updated'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.saveFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => storeApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stores-manage'] });
      qc.invalidateQueries({ queryKey: ['stores'] });
      qc.invalidateQueries({ queryKey: ['stores-all'] });
      qc.invalidateQueries({ queryKey: ['stores-stats'] });
      qc.invalidateQueries({ queryKey: ['stores-by-company'] });
      qc.invalidateQueries({ queryKey: ['stores-company-branches'] });
      qc.invalidateQueries({ predicate: (q) => {
        const key = q.queryKey;
        return Array.isArray(key) && (key.includes('stores-user-form') || key.includes('platform-user-form'));
      }});
      qc.invalidateQueries({ queryKey: ['companies'] });
      qc.invalidateQueries({ queryKey: ['companies-all'] });
      toast.success(t('stores.deleted'));
      setMenuId(null);
    },
    onError: (e) => toast.error(e.response?.data?.message ?? t('stores.deleteFailed')),
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

  const allStores = groupedQuery.allLoadedStores;
  const groupedGroups = groupedQuery.groups;
  const loadingBranchIds = groupedQuery.loadingBranchIds;

  const rawRows = data?.content ?? [];
  const rows = useMemo(() => {
    if (statusFilter === 'ACTIVE') return rawRows.filter((r) => r.active);
    if (statusFilter === 'INACTIVE') return rawRows.filter((r) => !r.active);
    return rawRows;
  }, [rawRows, statusFilter]);

  const total = data?.totalElements ?? rows.length;
  const totalPages = data?.totalPages ?? 0;
  const displayPage = typeof data?.number === 'number' ? data.number : page;

  const rawActive = rawRows.filter((s) => s.active).length;
  const rawInactive = rawRows.filter((s) => !s.active).length;

  let totalStores;
  let activeStores;
  let inactiveStores;
  let companiesCount;

  if (stats) {
    totalStores = stats.totalStores ?? 0;
    activeStores = stats.activeStores ?? 0;
    inactiveStores = stats.inactiveStores ?? 0;
    companiesCount = stats.companiesCount ?? 0;
  } else {
    totalStores = total;
    if (statusFilter === 'ACTIVE') {
      activeStores = total;
      inactiveStores = Math.max(0, totalStores - activeStores);
    } else if (statusFilter === 'INACTIVE') {
      inactiveStores = total;
      activeStores = Math.max(0, totalStores - inactiveStores);
    } else if (total <= rawRows.length) {
      activeStores = rawActive;
      inactiveStores = rawInactive;
    } else {
      inactiveStores = rawInactive;
      activeStores = Math.max(0, totalStores - inactiveStores);
    }
    companiesCount = resolvedCompanyId
      ? (totalStores > 0 ? 1 : 0)
      : (companies?.length || 0);
  }

  const pageFirstLoad = isGroupedViewActive ? groupedQuery.firstLoad : tableFirstLoadBase;
  const pageRefreshing = isGroupedViewActive ? groupedQuery.isRefreshing : tableRefreshingBase;
  const pageOverlay = isGroupedViewActive ? groupedQuery.showOverlay : showRefreshingOverlay;

  const handleStatusFilterChange = (nextFilter) => {
    setStatusFilter(nextFilter);
    setPage(0);
    setGroupedPage(0);
  };

  const openQuickDrawer = (store) => {
    setSelectedStore(store);
  };

  const closeQuickDrawer = () => {
    setSelectedStore(null);
  };

  const openCreate = (defaultValues = null) => {
    setEditing(defaultValues);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
    setMenuId(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
    setGroupedPage(0);
  };

  const handleCompanyChange = (value) => {
    setCompanyId(value || '');
    setPage(0);
    setGroupedPage(0);
  };

  const handleBusinessTypeChange = (code) => {
    setBusinessType(code || '');
    setPage(0);
    setGroupedPage(0);
  };

  const handleGeoChange = ({ regionCode: nextRegion = '', districtCode: nextDistrict = '' }) => {
    setRegionCode(nextRegion || '');
    setDistrictCode(nextDistrict || '');
    setPage(0);
    setGroupedPage(0);
  };

  const handlePageSizeChange = (nextSize) => {
    setPageSize(nextSize);
    setPage(0);
  };

  const openPharmacyIntegration = (row) => {
    setPharmacyIntegrationStore(row);
    setMenuId(null);
  };

  const closePharmacyIntegration = () => {
    setPharmacyIntegrationStore(null);
  };

  const tryDelete = (row) => {
    if (window.confirm(t('stores.deleteConfirm', { name: row.name }))) {
      deleteMutation.mutate(row.id);
    }
  };

  const errorMessage = error?.response?.data?.message ?? error?.message;

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
    setPageSize: handlePageSizeChange,
    modalOpen,
    editing,
    menuId,
    setMenuId,
    rows,
    total,
    totalPages,
    firstLoad: pageFirstLoad,
    isRefreshing: pageRefreshing,
    showRefreshingOverlay: pageOverlay,
    displayPage,
    isPending: pageFirstLoad,
    isError: isGroupedViewActive ? groupedQuery.isError : storesQuery.isError,
    error: isGroupedViewActive ? groupedQuery.error : error,
    refetch: isGroupedViewActive ? undefined : storesQuery.refetch,
    errorMessage: isGroupedViewActive
      ? (groupedQuery.error?.response?.data?.message ?? groupedQuery.error?.message)
      : errorMessage,
    showCompanySelect,
    companies,
    businessTypes,
    saveMutation,
    openCreate,
    openEdit,
    closeModal,
    handleSearchChange,
    handleCompanyChange,
    handleBusinessTypeChange,
    handleGeoChange,
    toggleMutation,
    tryDelete,
    statusFilter,
    setStatusFilter: handleStatusFilterChange,
    totalStores,
    activeStores,
    inactiveStores,
    companiesCount,
    selectedStore,
    openQuickDrawer,
    closeQuickDrawer,
    viewMode,
    setViewMode,
    allStores,
    groupedGroups,
    loadingBranchIds,
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
    openPharmacyIntegration,
    closePharmacyIntegration,
  };
}
