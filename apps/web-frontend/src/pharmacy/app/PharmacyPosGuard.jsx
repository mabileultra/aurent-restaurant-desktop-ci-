import { Navigate } from 'react-router-dom';
import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierStoreTypeQuery } from '../../hooks/useCashierStoreTypeQuery';
import { normalizeBusinessTypeCode } from '../../config/productCatalogConfig';
import { resolveCashierRegisterPath } from '../../utils/cashierRegisterRoute';
import CashierRouteLoading from '../../components/layout/cashier/CashierRouteLoading';

/** Аптечная касса — только для магазинов PHARMACY. */
export default function PharmacyPosGuard({ children }) {
  const { storeId } = useCashierStore();
  const { store, isPending, skipOnline } = useCashierStoreTypeQuery(storeId);

  if (storeId == null) {
    return children;
  }

  if (skipOnline) {
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
