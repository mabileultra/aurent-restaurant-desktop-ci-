import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isRestaurantAppSplitEnabled } from '../../config/restaurantAppUrl';
import { redirectToRestaurantApp } from '../../utils/restaurantAppRedirect';
import { isRestaurantCashierPath } from '../../utils/cashierPostLoginPath';

/**
 * If restaurant SPA split is on and path is /rst*, leave aurent origin.
 * Otherwise render React Router Navigate.
 */
export default function CashierSpaNavigate({ to, replace = true }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const crossOrigin = isRestaurantAppSplitEnabled() && isRestaurantCashierPath(to);

  useEffect(() => {
    if (!crossOrigin || !token) return;
    redirectToRestaurantApp(to, { token, user });
  }, [crossOrigin, to, token, user]);

  if (crossOrigin) {
    return null;
  }

  return <Navigate to={to} replace={replace} />;
}
