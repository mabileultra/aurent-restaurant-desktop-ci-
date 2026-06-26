import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../api';
import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';

export function useRestaurantStores() {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => storeApi.getAll().then((r) => r.data),
  });

  const restaurantStores = useMemo(
    () => stores.filter((s) => normalizeBusinessTypeCode(s.businessType) === 'RESTAURANT'),
    [stores]
  );

  return { stores, restaurantStores, isLoading };
}
