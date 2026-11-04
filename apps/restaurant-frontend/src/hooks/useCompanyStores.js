import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../api';
import { useTenantScope } from './useTenantScope';
import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';
import { useRestaurantStores } from './useRestaurantStores';

/**
 * Stores for stock ops. Prefers restaurant/canteen branches when available.
 */
export function useCompanyStores() {
  const { companyId, tenantKey, tenantReady } = useTenantScope();
  const { restaurantStores, isLoading: rstLoading } = useRestaurantStores();

  const { data: allStores = [], isPending, isError } = useQuery({
    queryKey: tenantKey('stores'),
    queryFn: () => storeApi.getAll().then((r) => r.data),
    staleTime: 60_000,
    enabled: tenantReady && restaurantStores.length === 0 && !rstLoading,
  });

  const stores = useMemo(() => {
    if (restaurantStores.length) return restaurantStores;
    return allStores.filter((s) => {
      const type = normalizeBusinessTypeCode(s.businessType);
      return type === 'RESTAURANT' || type === 'CANTEEN';
    });
  }, [restaurantStores, allStores]);

  const onlyStore = useMemo(() => (stores.length === 1 ? stores[0] : null), [stores]);
  const needsStorePick = stores.length > 1;

  const resolveStoreId = (selected) => {
    if (selected != null && selected !== '') return Number(selected);
    if (onlyStore) return onlyStore.id;
    return null;
  };

  return {
    stores,
    onlyStore,
    needsStorePick,
    resolveStoreId,
    isPending: rstLoading || isPending,
    isError,
    companyId,
  };
}
