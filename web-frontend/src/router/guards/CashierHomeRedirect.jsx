import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../services/api';
import { useCashierStore } from '../../hooks/useCashierStore';
import { useAuthStore } from '../../store/authStore';
import { normalizeBusinessTypeCode } from '../../config/productCatalogConfig';
import CashierRouteLoading from '../../components/layout/cashier/CashierRouteLoading';

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
    return <CashierRouteLoading />;
  }

  const type = normalizeBusinessTypeCode(store?.businessType);
  if (type === 'RESTAURANT') {
    return <Navigate to="/cashier/restaurant" replace />;
  }
  if (type === 'PHARMACY') {
    return <Navigate to="/cashier/pharmacy" replace />;
  }
  return <Navigate to="/cashier/pos" replace />;
}
