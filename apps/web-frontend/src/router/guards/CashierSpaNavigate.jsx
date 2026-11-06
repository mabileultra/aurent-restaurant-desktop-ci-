import { Navigate } from 'react-router-dom';

/**
 * In-app navigate only — no silent cross-origin hop to r-aurent.
 * Legacy /rst* targets land on RestaurantSpaHandoff (opaque deny).
 */
export default function CashierSpaNavigate({ to, replace = true }) {
  return <Navigate to={to} replace={replace} />;
}
