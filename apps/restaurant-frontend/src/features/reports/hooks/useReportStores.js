import { useMemo } from 'react';
import { useRestaurantStores } from '../../../hooks/useRestaurantStores';

/** Restaurant/canteen stores for stock reports. */
export function useReportStores() {
  const { restaurantStores, isLoading } = useRestaurantStores();
  return useMemo(
    () => ({ data: restaurantStores, isPending: isLoading, isLoading }),
    [restaurantStores, isLoading],
  );
}
