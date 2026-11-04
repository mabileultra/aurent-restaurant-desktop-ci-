import { Navigate } from 'react-router-dom';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { isPharmacyBusinessType } from '../pharmacyStockPaths';
import CashierRouteLoading from '../../../components/layout/cashier/CashierRouteLoading';

/** Аптечные маршруты — только для компании PHARMACY. Grocery сюда не пускаем. */
export default function PharmacyTenantGuard({ children, fallback = '/stock/products' }) {
  const { businessType, isPharmacyCompany, isLoading } = useCompanyBusinessType();
  if (isLoading) {
    return <CashierRouteLoading />;
  }
  if (!(isPharmacyCompany || isPharmacyBusinessType(businessType))) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}
