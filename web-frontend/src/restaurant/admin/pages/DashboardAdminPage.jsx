import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/authStore';
import { isRestaurantAppSplitEnabled } from '../../../config/restaurantAppUrl';
import { redirectToRestaurantApp } from '../../../utils/restaurantAppRedirect';

/**
 * Legacy web-frontend dashboard: when restaurant SPA is split, hand off to r-aurent.
 * Local without VITE_RESTAURANT_APP_URL keeps a stub (source of truth is restaurant-frontend).
 */
export default function DashboardAdminPage() {
  const { t } = useTranslation();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!isRestaurantAppSplitEnabled()) return;
    redirectToRestaurantApp('/rst/admin/dashboard', { token, user });
  }, [token, user]);

  return (
    <section className="p-4">
      <h1>{t('rst.admin.dashboardTitle')}</h1>
      <p className="text-muted">
        {isRestaurantAppSplitEnabled()
          ? t('rst.admin.dashboardMovedRedirect')
          : t('rst.admin.dashboardMovedLocal')}
      </p>
    </section>
  );
}
