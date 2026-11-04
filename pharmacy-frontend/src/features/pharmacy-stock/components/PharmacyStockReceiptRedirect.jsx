import { Navigate } from 'react-router-dom';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { isPharmacyBusinessType, PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';
import CashierRouteLoading from '../../../components/layout/cashier/CashierRouteLoading';

/** Grocery склад/товары → аптечные маршруты, если компания PHARMACY. */
export default function PharmacyStockReceiptRedirect({
  children,
  to = PHARMACY_STOCK_PATHS.receipts,
}) {
  const { businessType, isPharmacyCompany, isLoading } = useCompanyBusinessType();
  if (isLoading) {
    return <CashierRouteLoading />;
  }
  if (isPharmacyCompany || isPharmacyBusinessType(businessType)) {
    return <Navigate to={to} replace />;
  }
  return children;
}
