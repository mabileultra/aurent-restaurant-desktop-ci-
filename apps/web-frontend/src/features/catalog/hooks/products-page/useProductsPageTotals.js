import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { productApi } from '../../../../api';
import { useTenantScope } from '../../../../hooks/useTenantScope';

/** Catalog totals for the same filters as the products list (no page). */
export function useProductsPageTotals(queryParams, enabled = true) {
  const { tenantKey, tenantReady } = useTenantScope();

  const totalsParams = useMemo(() => {
    if (!queryParams) return null;
    const { page, size, ...rest } = queryParams;
    return rest;
  }, [queryParams]);

  const { data } = useQuery({
    queryKey: tenantKey('products-catalog-totals', totalsParams),
    queryFn: () => productApi.getCatalogTotals(totalsParams).then((r) => r.data),
    placeholderData: keepPreviousData,
    enabled: Boolean(enabled && tenantReady && totalsParams),
  });

  return {
    productCount: data?.productCount ?? 0,
    stockQuantityTotal: data?.stockQuantityTotal ?? 0,
    stockValueTotal: data?.stockValueTotal ?? 0,
  };
}
