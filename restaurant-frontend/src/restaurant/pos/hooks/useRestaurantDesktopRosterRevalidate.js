import { useEffect } from 'react';
import axios from 'axios';
import { isRestaurantDesktop } from '../../../utils/restaurantDesktop';
import { useAuthStore } from '../../../store/authStore';
import { forceAuthReLogin } from '../../../utils/authSessionExpiry';
import api from '../../../api/client';

/**
 * After Electron quietly refreshes edge_staff from cloud, re-issue local JWT.
 * Deactivated / password-changed users get kicked without network chrome.
 */
export default function useRestaurantDesktopRosterRevalidate(enabled) {
  useEffect(() => {
    if (!enabled || !isRestaurantDesktop()) return undefined;
    if (typeof window.aurentRestaurant?.onStatus !== 'function') return undefined;

    let lastAt = 0;
    const unsub = window.aurentRestaurant.onStatus(async (status) => {
      const at = Number(status?.rosterRefreshedAt || 0);
      if (!at || at <= lastAt) return;
      lastAt = at;
      const token = useAuthStore.getState().token;
      if (!token) return;
      try {
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: api.defaults.timeout ?? 15_000,
        });
        const { token: newToken, ...profile } = res.data || {};
        if (!newToken) {
          forceAuthReLogin();
          return;
        }
        useAuthStore.getState().setAuth(newToken, {
          ...useAuthStore.getState().user,
          ...profile,
        });
      } catch {
        forceAuthReLogin();
      }
    });
    return typeof unsub === 'function' ? unsub : undefined;
  }, [enabled]);
}
