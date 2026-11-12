import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
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

  const { data: companyStats } = useQuery({
    queryKey: ['companies-stats-global'],
    queryFn: () => companyApi.getStats({}).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: storeCountData } = useQuery({
    queryKey: ['platform-stores-total-count'],
    queryFn: () => storeApi.getStats({}).then((r) => r.data?.totalStores ?? 0).catch(() => 0),
    staleTime: 60_000,
  });

  const rawRows = data?.content ?? data?.data?.content ?? [];
  const rows = useMemo(
    () =>
      [...rawRows].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'uz', { sensitivity: 'base' })
      ),
    [rawRows]
  );

  const total = data?.totalElements ?? data?.data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? data?.data?.totalPages ?? 0;
  const pageNum = typeof data?.number === 'number' ? data.number : (typeof data?.data?.number === 'number' ? data.data.number : filters.page);
  const displayPage = pageNum;
  const fromN = total === 0 ? 0 : displayPage * filters.pageSize + 1;
  const toN = Math.min((displayPage + 1) * filters.pageSize, total);

  const statsTotal = companyStats?.total ?? companyStats?.data?.total;
  const statsActive = companyStats?.active ?? companyStats?.data?.active;
  const statsInactive = companyStats?.inactive ?? companyStats?.data?.inactive;

  const kpi = resolveCompanyKpi({
    total: statsTotal ?? (filters.isFiltered ? (companyStats ? statsTotal : total) : total),
    rawRows,
    statusFilter: 'ALL',
    isFiltered: false,
    storeCountData,
    knownInactiveCount: statsInactive,
  });

  // Segmented sonlari — qidiruv va filtrga moslashadi
  const segmentedCounts = useMemo(() => {
    if (!filters.isFiltered) {
      return {
        total: kpi.totalCompanies,
        active: kpi.activeCompanies,
        inactive: kpi.inactiveCompanies,
      };
    }
    const rawActive = rawRows.filter((r) => r.active).length;
    const rawInactive = rawRows.filter((r) => !r.active).length;
    let segActive = rawActive;
    let segInactive = rawInactive;
    if (filters.statusFilter === 'ACTIVE') {
      segActive = total;
      segInactive = 0;
    } else if (filters.statusFilter === 'INACTIVE') {
      segActive = 0;
      segInactive = total;
    } else if (total > rawRows.length && rawRows.length > 0) {
      segInactive = rawInactive;
      segActive = Math.max(0, total - segInactive);
    }
    return {
      total,
      active: segActive,
      inactive: segInactive,
    };
  }, [filters.isFiltered, filters.statusFilter, total, rawRows, kpi]);

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
    segmentedTotalCompanies: segmentedCounts.total,
    segmentedActiveCompanies: segmentedCounts.active,
    segmentedInactiveCompanies: segmentedCounts.inactive,
    businessTypes: constructorTypes,
  };
}
