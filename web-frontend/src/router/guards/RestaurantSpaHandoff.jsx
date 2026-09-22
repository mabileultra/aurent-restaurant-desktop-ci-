import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isRestaurantAppSplitEnabled } from '../../config/restaurantAppUrl';
import { redirectToRestaurantApp } from '../../utils/restaurantAppRedirect';

/**
 * When VITE_RESTAURANT_APP_URL is set, any /rst/* hit on aurent must leave
 * for r-aurent (token handoff). Without the URL, show nothing — local restaurant
 * UI was removed; run restaurant-frontend on :5174 instead.
 */
export default function RestaurantSpaHandoff() {
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const split = isRestaurantAppSplitEnabled();

  useEffect(() => {
    if (!token) return;
    if (!split) {
      console.warn(
        '[aurent] VITE_RESTAURANT_APP_URL is empty — set it to https://r-aurent.uz (or http://localhost:5174 in dev)'
      );
      return;
    }
    const next = `${location.pathname}${location.search || ''}`;
    redirectToRestaurantApp(next || '/rst/pos', { token, user });
  }, [split, token, user, location.pathname, location.search]);

  return null;
}
