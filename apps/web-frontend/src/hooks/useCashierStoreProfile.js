import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { storeApi } from '../services/api';
import { useCashierStore } from './useCashierStore';
import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';
import { resolveCashierRegisterPath } from '../utils/cashierRegisterRoute';
import { isPharmPosPath } from '../pharmacy/app/pharmacyPaths';
import { useShouldUseOfflinePos } from '../store/connectivityStore';

export function useCashierStoreProfile() {
  const location = useLocation();
  const { storeId } = useCashierStore();
  const skipOnline = useShouldUseOfflinePos();
  const onRestaurantRoute = location.pathname.startsWith('/rst/pos');
  const query = useQuery({
    queryKey: ['cashier-store', storeId],
    queryFn: () => storeApi.getById(storeId).then((r) => r.data),
    enabled: storeId != null && !skipOnline,
    staleTime: 60_000,
    retry: skipOnline ? false : 1,
  });

  const businessType = normalizeBusinessTypeCode(query.data?.businessType);
  const isRestaurant = businessType === 'RESTAURANT' || businessType === 'CANTEEN' || onRestaurantRoute;
  const isPharmacy = businessType === 'PHARMACY' || isPharmPosPath(location.pathname);
  const registerPath = resolveCashierRegisterPath(query.data?.businessType);

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
