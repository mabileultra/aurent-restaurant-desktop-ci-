import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { storeApi } from '../../services/api';
import { useCashierStore } from '../../hooks/useCashierStore';
import { normalizeBusinessTypeCode } from '../../config/productCatalogConfig';
import { resolveCashierRegisterPath } from '../../utils/cashierRegisterRoute';
import CashierRouteLoading from '../../components/layout/cashier/CashierRouteLoading';

/** Аптечная касса — только для магазинов PHARMACY. */
export default function CashierPharmacyPosGuard({ children }) {
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
    return <CashierRouteLoading />;
  }

  const type = normalizeBusinessTypeCode(store?.businessType);
  if (type !== 'PHARMACY') {
    return <Navigate to={resolveCashierRegisterPath(type)} replace />;
  }

  return children;
}
