import { Navigate } from 'react-router-dom';
import { useCashierStore } from '../../hooks/useCashierStore';
import { useCashierStoreTypeQuery } from '../../hooks/useCashierStoreTypeQuery';
import { normalizeBusinessTypeCode } from '../../config/productCatalogConfig';

/** Розничная касса — только для магазинов не-RESTAURANT. */
export default function CashierRetailPosGuard({ children }) {
  const { storeId } = useCashierStore();
  const { store, isPending, skipOnline, isError } = useCashierStoreTypeQuery(storeId);

  if (storeId == null) {
    return children;
  }

  // Offline / сеть упала: не держим пустой (чёрный) экран на GET /stores/:id
  if (skipOnline || isError) {
    return children;
  }

  if (isPending) {
    return children;
  }

  const type = normalizeBusinessTypeCode(store?.businessType);
  if (type === 'RESTAURANT' || type === 'CANTEEN') {
    return <Navigate to="/rst/pos" replace />;
  }
  if (type === 'PHARMACY') {
    return <Navigate to="/pharm/pos" replace />;
  }

  return children;
}
