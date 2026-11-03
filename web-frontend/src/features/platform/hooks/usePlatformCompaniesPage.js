import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';
import { platformBusinessTypeApi } from '../../../api';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { usePlatformCompaniesFilters } from './usePlatformCompaniesFilters';
import { usePlatformCompanyForm } from './usePlatformCompanyForm';
import { resolveCompanyKpi } from '../utils/resolveCompanyKpi';

export function usePlatformCompaniesPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [menuId, setMenuId] = useState(null);

  const urlCompanyId = searchParams.get('companyId');

  const { data: directCompany, isFetched: isDirectCompanyFetched } = useQuery({
    queryKey: ['company-direct', urlCompanyId],
    queryFn: () => companyApi.getById(urlCompanyId).then((r) => r.data).catch(() => null),
    enabled: Boolean(urlCompanyId),
  });

  useEffect(() => {
    if (urlCompanyId && isDirectCompanyFetched && !directCompany) {
      toast.error(t('platform.companyNotFound', { defaultValue: 'Kompaniya topilmadi' }));
      const next = new URLSearchParams(searchParams);
      next.delete('companyId');
      setSearchParams(next, { replace: true });
    }
  }, [urlCompanyId, isDirectCompanyFetched, directCompany, searchParams, setSearchParams, t]);

  const activeSelectedCompany = selectedCompany || (urlCompanyId ? directCompany : null);

  const closeQuickDrawer = () => {
    setSelectedCompany(null);
    if (searchParams.has('companyId')) {
      const next = new URLSearchParams(searchParams);
      next.delete('companyId');
      setSearchParams(next, { replace: true });
    }
  };

  const filters = usePlatformCompaniesFilters();

  const { data: constructorTypes = [] } = useQuery({
    queryKey: ['platform-business-types-options'],
    queryFn: () => platformBusinessTypeApi.list().then((r) => r.data),
    staleTime: 300_000,
  });

  const formManager = usePlatformCompanyForm({
    t,
    constructorTypes,
    setMenuId,
  });

  const companiesQuery = useQuery({
    queryKey: ['companies', filters.params],
    queryFn: () => companyApi.getAll(filters.params).then((r) => r.data),
    placeholderData: keepPreviousData,
  });

  const { data, error } = companiesQuery;
  const firstLoad = companiesQuery.isPending && !data;
  const isRefreshing = companiesQuery.isFetching && !firstLoad;
  const showRefreshingOverlay = useDelayedLoading(isRefreshing, { delay: 250, minDuration: 400 });

  const { data: storeCountData } = useQuery({
    queryKey: ['platform-stores-total-count'],
    queryFn: () => storeApi.getStats({}).then((r) => r.data?.totalStores ?? 0).catch(() => 0),
    staleTime: 60_000,
  });

  const isInactiveTab = filters.statusFilter === 'INACTIVE';
  const qc = useQueryClient();

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['platform-companies-all'],
    queryFn: () => companyApi.listAll().then((r) => r.data).catch(() => []),
    enabled: isInactiveTab,
    staleTime: 60_000,
  });

  const [lastKnownInactiveCount, setLastKnownInactiveCount] = useState(null);

  useEffect(() => {
    if (isInactiveTab && allCompanies?.length > 0) {
      setLastKnownInactiveCount(allCompanies.filter((c) => !c.active).length);
    }
  }, [isInactiveTab, allCompanies]);

  const cachedAll = qc.getQueryData(['platform-companies-all']);
  const cachedInactiveCount = useMemo(() => {
    if (cachedAll && Array.isArray(cachedAll)) {
      return cachedAll.filter((c) => !c.active).length;
    }
    return null;
  }, [cachedAll]);

  const inactiveFiltered = useMemo(() => {
    const source = isInactiveTab ? allCompanies : (cachedAll || []);
    let list = (source || []).filter((c) => !c.active);
    if (filters.debouncedSearch?.trim()) {
      const q = filters.debouncedSearch.toLowerCase().trim();
      list = list.filter((c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.loginCode && c.loginCode.toLowerCase().includes(q)) ||
        (c.tin && c.tin.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
      );
    }
    if (filters.businessType) {
      list = list.filter((c) => c.businessType === filters.businessType);
    }
    if (filters.regionCode) {
      list = list.filter((c) => c.regionCode === filters.regionCode);
    }
    if (filters.districtCode) {
      list = list.filter((c) => c.districtCode === filters.districtCode);
    }
    return list;
  }, [isInactiveTab, allCompanies, cachedAll, filters.debouncedSearch, filters.businessType, filters.regionCode, filters.districtCode]);

  const inactiveTotal = inactiveFiltered.length;
  const inactiveTotalPages = Math.max(1, Math.ceil(inactiveTotal / filters.pageSize));
  const inactiveRows = useMemo(() => {
    const start = filters.page * filters.pageSize;
    return inactiveFiltered.slice(start, start + filters.pageSize);
  }, [inactiveFiltered, filters.page, filters.pageSize]);

  const rawRows = isInactiveTab ? inactiveRows : (data?.content ?? []);
  const rows = useMemo(() => {
    const base = isInactiveTab
      ? inactiveRows
      : (filters.statusFilter === 'ACTIVE'
          ? rawRows.filter((r) => r.active)
          : rawRows);
    return [...base].sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'uz', { sensitivity: 'base' })
    );
  }, [isInactiveTab, inactiveRows, rawRows, filters.statusFilter]);

  const total = isInactiveTab ? inactiveTotal : (data?.totalElements ?? 0);
  const totalPages = isInactiveTab ? inactiveTotalPages : (data?.totalPages ?? 0);
  const displayPage = typeof data?.number === 'number' && !isInactiveTab ? data.number : filters.page;
  const fromN = total === 0 ? 0 : displayPage * filters.pageSize + 1;
  const toN = Math.min((displayPage + 1) * filters.pageSize, total);

  const effectiveKnownInactive = isInactiveTab
    ? inactiveTotal
    : (filters.isFiltered
        ? (inactiveFiltered.length > 0 ? inactiveFiltered.length : undefined)
        : (lastKnownInactiveCount ?? cachedInactiveCount ?? undefined));

  const kpi = resolveCompanyKpi({
    total: isInactiveTab ? (data?.totalElements ?? total) : total,
    rawRows,
    statusFilter: filters.statusFilter,
    isFiltered: filters.isFiltered,
    storeCountData,
    knownInactiveCount: effectiveKnownInactive,
  });

  return {
    t,
    ...filters,
    ...formManager,
    menuId,
    setMenuId,
    rows,
    firstLoad,
    isRefreshing,
    showRefreshingOverlay,
    isPending: firstLoad,
    isError: companiesQuery.isError,
    error,
    refetch: companiesQuery.refetch,
    errorMessage: error?.response?.data?.message ?? t('common.loadError'),
    total,
    totalPages,
    displayPage,
    fromN,
    toN,
    selectedCompany: activeSelectedCompany,
    setSelectedCompany,
    closeQuickDrawer,
    ...kpi,
    businessTypes: constructorTypes,
  };
}
