import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../services/api';
import { useCashierStore } from './useCashierStore';
import { resolveCashierRegisterPath } from '../utils/cashierRegisterRoute';
import { useShouldUseOfflinePos } from '../store/connectivityStore';

export function useCashierStoreProfile() {
  const { storeId } = useCashierStore();
  const skipOnline = useShouldUseOfflinePos();
  const query = useQuery({
    queryKey: ['cashier-store', storeId],
    queryFn: () => storeApi.getById(storeId).then((r) => r.data),
    enabled: storeId != null && !skipOnline,
    staleTime: 60_000,
    retry: skipOnline ? false : 1,
  });

  // This app is pharmacy-only — ignore grocery/restaurant store types for chrome/routing.
  const businessType = 'PHARMACY';
  const isRestaurant = false;
  const isPharmacy = true;
  const registerPath = resolveCashierRegisterPath('PHARMACY');

  return {
    storeId,
    store: query.data,
    businessType,
    isRestaurant,
    isPharmacy,
    registerPath,
    isLoading: !skipOnline && query.isLoading,
    isFetched: skipOnline || query.isFetched,
  };
}
