import { useQuery } from '@tanstack/react-query';
import { productApi } from '../../../api';
import { useTenantScope } from '../../../hooks/useTenantScope';

/**
 * Same live stock totals as products page (catalog-totals, active only).
 */
export function useLiveStockRetailTotals(storeId) {
  const { tenantKey, tenantReady } = useTenantScope();
  const normalizedStoreId =
    storeId === '' || storeId == null ? undefined : Number(storeId);

  const { data, isLoading, isError } = useQuery({
    queryKey: tenantKey('live-stock-retail-totals', { storeId: normalizedStoreId ?? null }),
    queryFn: () =>
      productApi
        .getCatalogTotals({
          activeOnly: true,
          storeId: normalizedStoreId,
        })
        .then((r) => r.data),
    enabled: tenantReady,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    productCount: data?.productCount ?? null,
    stockQuantityTotal: data?.stockQuantityTotal ?? null,
    stockValueTotal: data?.stockValueTotal ?? null,
    stockCostTotal: data?.stockCostTotal ?? null,
    isLoading,
    isError,
  };
}
