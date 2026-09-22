import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isRestaurantAppSplitEnabled } from '../../config/restaurantAppUrl';
import { redirectToRestaurantApp } from '../../utils/restaurantAppRedirect';

/**
 * When VITE_RESTAURANT_APP_URL is set, any /rst/* hit on aurent must leave
 * for r-aurent (token handoff). Legacy /rst UI is local-dev fallback only.
 */
export default function RestaurantSpaHandoff({ children }) {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const split = isRestaurantAppSplitEnabled();

  useEffect(() => {
    if (!split || !token) return;
    const next = `${location.pathname}${location.search || ''}`;
    redirectToRestaurantApp(next, { token, user });
  }, [split, token, user, location.pathname, location.search]);

  if (split) return null;
  return children;
}
