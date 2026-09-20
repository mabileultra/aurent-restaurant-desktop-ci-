import { Navigate } from 'react-router-dom';
import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierStoreTypeQuery } from '../../hooks/useCashierStoreTypeQuery';
import { useAuthStore } from '../../store/authStore';
import { normalizeBusinessTypeCode } from '../../config/productCatalogConfig';

export default function CashierHomeRedirect() {
  const user = useAuthStore((s) => s.user);
  const { storeId } = useCashierStore();
  const { store, isPending, skipOnline, isError } = useCashierStoreTypeQuery(storeId);

  if (user?.role === 'WAITER') {
    return <Navigate to="/rst/pos" replace />;
  }

  if (storeId == null || skipOnline || isError || isPending) {
    return <Navigate to="/cashier/pos" replace />;
  }

  const type = normalizeBusinessTypeCode(store?.businessType);
  if (type === 'RESTAURANT' || type === 'CANTEEN') {
    return <Navigate to="/rst/pos" replace />;
  }
  if (type === 'PHARMACY') {
    return <Navigate to="/pharm/pos" replace />;
  }
  return <Navigate to="/cashier/pos" replace />;
}
