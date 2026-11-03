import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../../api';

export function useStoresInactiveTab({
  isInactiveTab = false,
  filters,
  companies = [],
}) {
  const { data: allManagedStores = [] } = useQuery({
    queryKey: ['platform-stores-all-managed'],
    queryFn: () => storeApi.getManaged({ page: 0, size: 500 }).then((r) => r.data?.content || []).catch(() => []),
    enabled: isInactiveTab,
    staleTime: 60_000,
  });

  const inactiveFiltered = useMemo(() => {
    if (!isInactiveTab) return [];
    let list = (allManagedStores || []).filter((s) => !s.active);
    if (filters.debouncedSearch) {
      const q = filters.debouncedSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name?.toLowerCase().includes(q)
          || s.phone?.includes(q)
          || s.address?.toLowerCase().includes(q)
          || s.companyName?.toLowerCase().includes(q)
      );
    }
    if (filters.resolvedCompanyId) {
      list = list.filter((s) => Number(s.companyId) === Number(filters.resolvedCompanyId));
    }
    if (filters.businessType) {
      list = list.filter((s) => s.businessType === filters.businessType);
    }
    if (filters.regionCode) {
      list = list.filter((s) => s.regionCode === filters.regionCode);
    }
    if (filters.districtCode) {
      list = list.filter((s) => s.districtCode === filters.districtCode);
    }
    return list;
  }, [
    isInactiveTab,
    allManagedStores,
    filters.debouncedSearch,
    filters.resolvedCompanyId,
    filters.businessType,
    filters.regionCode,
    filters.districtCode,
  ]);

  const inactiveTotal = inactiveFiltered.length;
  const inactiveTotalPages = Math.max(1, Math.ceil(inactiveTotal / filters.pageSize));
  const inactiveRows = useMemo(() => {
    const start = filters.page * filters.pageSize;
    return inactiveFiltered.slice(start, start + filters.pageSize);
  }, [inactiveFiltered, filters.page, filters.pageSize]);

  const inactiveGroupedGroups = useMemo(() => {
    if (!isInactiveTab) return null;
    const map = new Map();
    inactiveFiltered.forEach((store) => {
      const compId = Number(store.companyId || 0);
      if (!map.has(compId)) {
        const comp = (companies || []).find((c) => Number(c.id) === compId);
        map.set(compId, {
          id: compId,
          company: {
            id: compId,
            name: comp?.name || store.companyName || `Company #${compId}`,
            loginCode: comp?.loginCode,
            businessType: comp?.businessType || store.businessType,
            regionCode: comp?.regionCode || store.regionCode,
            districtCode: comp?.districtCode || store.districtCode,
            active: comp?.active !== false,
            tin: comp?.tin,
            phone: comp?.phone,
            storeCount: 0,
            activeStoreCount: 0,
          },
          stores: [],
          branchesLoaded: true,
          total: 0,
          active: 0,
          inactive: 0,
        });
      }
      const g = map.get(compId);
      g.stores.push(store);
      g.total += 1;
      g.inactive += 1;
    });
    return Array.from(map.values());
  }, [isInactiveTab, inactiveFiltered, companies]);

  return {
    inactiveTotal,
    inactiveTotalPages,
    inactiveRows,
    inactiveGroupedGroups,
  };
}
