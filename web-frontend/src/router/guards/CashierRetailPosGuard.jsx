import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../services/api';
import { useCashierStore } from '../../hooks/useCashierStore';
import { normalizeBusinessTypeCode } from '../../config/productCatalogConfig';

/** Розничная касса — только для магазинов не-RESTAURANT. */
export default function CashierRetailPosGuard({ children }) {
  const { storeId } = useCashierStore();

  const { data: store, isPending } = useQuery({
    queryKey: ['cashier-store', storeId],
    queryFn: () => storeApi.getById(storeId).then((r) => r.data),
    enabled: storeId != null,
    staleTime: 60_000,
  });

  if (storeId == null) {
    return children;
  }

  if (isPending) {
    return null;
  }

  const type = normalizeBusinessTypeCode(store?.businessType);
  if (type === 'RESTAURANT') {
    return <Navigate to="/cashier/restaurant" replace />;
  }
  if (type === 'PHARMACY') {
    return <Navigate to="/cashier/pharmacy" replace />;
  }

  return children;
}
