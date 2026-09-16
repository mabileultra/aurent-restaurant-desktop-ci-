import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { storeApi } from '../services/api';
import { useCashierStore } from './useCashierStore';
import { normalizeBusinessTypeCode } from '../config/productCatalogConfig';
import { resolveCashierRegisterPath } from '../utils/cashierRegisterRoute';
import { isPharmPosPath } from '../pharmacy/app/pharmacyPaths';

export function useCashierStoreProfile() {
  const location = useLocation();
  const { storeId } = useCashierStore();
  const onRestaurantRoute = location.pathname.startsWith('/rst/pos');
  const query = useQuery({
    queryKey: ['cashier-store', storeId],
    queryFn: () => storeApi.getById(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 60_000,
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
    isLoading: query.isLoading,
    isFetched: query.isFetched,
  };
}
