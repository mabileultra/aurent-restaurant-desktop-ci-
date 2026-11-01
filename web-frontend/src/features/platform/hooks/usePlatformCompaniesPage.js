import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { companyApi } from '../../../api/company.api';
import { storeApi } from '../../../api/store.api';
import { platformBusinessTypeApi } from '../../../api';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { usePlatformCompaniesFilters } from './usePlatformCompaniesFilters';
import { usePlatformCompanyForm } from './usePlatformCompanyForm';
import { resolveCompanyKpi } from '../utils/resolveCompanyKpi';

export function usePlatformCompaniesPage() {
  const { t } = useTranslation();
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [menuId, setMenuId] = useState(null);

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

  const rawRows = data?.content ?? [];
  const rows = useMemo(() => {
    if (filters.statusFilter === 'ACTIVE') {
      return rawRows.filter((r) => r.active);
    }
    if (filters.statusFilter === 'INACTIVE') {
      return rawRows.filter((r) => !r.active);
    }
    return rawRows;
  }, [rawRows, filters.statusFilter]);

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const displayPage = typeof data?.number === 'number' ? data.number : filters.page;
  const fromN = total === 0 ? 0 : displayPage * filters.pageSize + 1;
  const toN = Math.min((displayPage + 1) * filters.pageSize, total);

  const kpi = resolveCompanyKpi({
    total,
    rawRows,
    statusFilter: filters.statusFilter,
    isFiltered: filters.isFiltered,
    storeCountData,
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
    selectedCompany,
    setSelectedCompany,
    ...kpi,
    businessTypes: constructorTypes,
  };
}
