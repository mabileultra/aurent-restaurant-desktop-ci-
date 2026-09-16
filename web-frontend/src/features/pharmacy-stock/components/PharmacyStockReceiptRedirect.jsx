import { Navigate } from 'react-router-dom';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { isPharmacyBusinessType, PHARMACY_STOCK_PATHS } from '../pharmacyStockPaths';

/** Grocery склад → аптечные маршруты, если компания PHARMACY. */
export default function PharmacyStockReceiptRedirect({
  children,
  to = PHARMACY_STOCK_PATHS.receipts,
}) {
  const { businessType, isLoading } = useCompanyBusinessType();
  if (isLoading) return null;
  if (isPharmacyBusinessType(businessType)) {
    return <Navigate to={to} replace />;
  }
  return children;
}
