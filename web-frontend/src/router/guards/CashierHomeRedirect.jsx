import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../services/api';
import { useCashierStore } from '../../hooks/useCashierStore';
import { useAuthStore } from '../../store/authStore';
import { normalizeBusinessTypeCode } from '../../config/productCatalogConfig';

export default function CashierHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  const { storeId } = useCashierStore();

  const { data: store, isPending } = useQuery({
    queryKey: ['cashier-store', storeId],
    queryFn: () => storeApi.getById(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 60_000,
  });

  if (user?.role === 'WAITER') {
    return <Navigate to="/cashier/restaurant" replace />;
  }

  if (storeId == null) {
    return <Navigate to="/cashier/pos" replace />;
  }

  if (isPending) {
    return null;
  }

  const isRestaurant = normalizeBusinessTypeCode(store?.businessType) === 'RESTAURANT';
  return <Navigate to={isRestaurant ? '/cashier/restaurant' : '/cashier/pos'} replace />;
}
