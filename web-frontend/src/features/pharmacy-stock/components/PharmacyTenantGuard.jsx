import { Navigate } from 'react-router-dom';
import { useCompanyBusinessType } from '../../../hooks/useCompanyBusinessType';
import { isPharmacyBusinessType } from '../pharmacyStockPaths';

/** Аптечные маршруты — только для компании PHARMACY. Grocery сюда не пускаем. */
export default function PharmacyTenantGuard({ children, fallback = '/stock/products' }) {
  const { businessType, isLoading } = useCompanyBusinessType();
  if (isLoading) return null;
  if (!isPharmacyBusinessType(businessType)) {
    return <Navigate to={fallback} replace />;
  }
  return children;
}
