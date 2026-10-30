import { useMemo } from 'react';
import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { storeApi } from '../../../api';
import { useDelayedLoading } from '../../../hooks/useDelayedLoading';
import { buildStoresGroupedGroups } from '../utils/buildStoresGroupedGroups';

/**
 * Server-paged companies (/stores/by-company) + lazy branches on accordion open.
 */
export function useStoresGroupedQuery({
  enabled = false,
  page = 0,
  pageSize = 10,
  search = '',
  statusFilter = 'ALL',
  businessType = '',
  regionCode = '',
  companyId,
  companies = [],
  expandedIds = new Set(),
} = {}) {
  const byCompanyParams = useMemo(
    () => ({
      page,
      size: pageSize,
      search: search.trim() || undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
      businessType: businessType || undefined,
      regionCode: regionCode || undefined,
    }),
    [page, pageSize, search, statusFilter, businessType, regionCode]
  );

  const singleCompanyMode = companyId != null && companyId !== '';

  const byCompanyQuery = useQuery({
    queryKey: ['stores-by-company', byCompanyParams],
    queryFn: () => storeApi.getByCompany(byCompanyParams).then((r) => r.data),
    enabled: enabled && !singleCompanyMode,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const companyRows = useMemo(() => {
    if (!enabled) return [];
    if (singleCompanyMode) {
      const id = Number(companyId);
      const fromList = (companies || []).find((c) => Number(c.id) === id);
      const fromPage = (byCompanyQuery.data?.content || []).find(
        (c) => Number(c.companyId) === id
      );
      return [
        {
          companyId: id,
          companyName: fromList?.name || fromPage?.companyName || `Company #${id}`,
          loginCode: fromList?.loginCode || fromPage?.loginCode,
          businessType: fromList?.businessType || fromPage?.businessType || businessType,
          regionCode: fromList?.regionCode || fromPage?.regionCode || regionCode,
          districtCode: fromList?.districtCode || fromPage?.districtCode,
          active: fromList?.active !== false,
          tin: fromList?.tin,
          phone: fromList?.phone,
          storeCount: fromPage?.storeCount ?? 0,
          activeStoreCount: fromPage?.activeStoreCount ?? 0,
        },
      ];
    }
    return byCompanyQuery.data?.content ?? [];
  }, [
    enabled,
    singleCompanyMode,
    companyId,
    companies,
    byCompanyQuery.data,
    businessType,
    regionCode,
  ]);

  const expandedList = useMemo(() => {
    const ids = [...(expandedIds || [])]
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (singleCompanyMode) {
      const id = Number(companyId);
      if (Number.isFinite(id) && id > 0 && !ids.includes(id)) {
        // Always load the filtered company branches once visible in grouped mode
        return [id];
      }
    }
    return ids;
  }, [expandedIds, singleCompanyMode, companyId]);

  const branchQueries = useQueries({
    queries: expandedList.map((id) => ({
      queryKey: ['stores-company-branches', id],
      queryFn: () => storeApi.getAll({ companyId: id }).then((r) => r.data || []),
      enabled: enabled && expandedList.length > 0,
      staleTime: 60_000,
    })),
  });

  const branchesByCompanyId = useMemo(() => {
    const map = {};
    expandedList.forEach((id, index) => {
      const q = branchQueries[index];
      if (q?.data) {
        map[id] = q.data;
      }
    });
    return map;
  }, [expandedList, branchQueries]);

  const loadingBranchIds = useMemo(() => {
    const set = new Set();
    expandedList.forEach((id, index) => {
      const q = branchQueries[index];
      if (q?.isPending && !q?.data) {
        set.add(id);
      }
    });
    return set;
  }, [expandedList, branchQueries]);

  const groups = useMemo(
    () => buildStoresGroupedGroups(companyRows, branchesByCompanyId, statusFilter),
    [companyRows, branchesByCompanyId, statusFilter]
  );

  const firstLoad = enabled
    && (singleCompanyMode ? false : byCompanyQuery.isPending && !byCompanyQuery.data);
  const isRefreshing = enabled
    && !firstLoad
    && (byCompanyQuery.isFetching || branchQueries.some((q) => q.isFetching));
  const showOverlay = useDelayedLoading(isRefreshing, { delay: 250, minDuration: 400 });

  const allLoadedStores = useMemo(
    () => Object.values(branchesByCompanyId).flat(),
    [branchesByCompanyId]
  );

  return {
    groups,
    totalGroups: singleCompanyMode
      ? groups.length
      : (byCompanyQuery.data?.totalElements ?? 0),
    totalGroupPages: singleCompanyMode
      ? 1
      : (byCompanyQuery.data?.totalPages ?? 0),
    firstLoad,
    isRefreshing,
    showOverlay,
    loadingBranchIds,
    allLoadedStores,
    isError: byCompanyQuery.isError,
    error: byCompanyQuery.error,
  };
}
