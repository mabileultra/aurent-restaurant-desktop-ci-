import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tenantBillingApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

const RETAIL_BILLING = '/billing';
const RESTAURANT_BILLING = '/rst/admin/billing';

function isBillingPath(pathname) {
  return pathname.startsWith(RETAIL_BILLING) || pathname.startsWith(RESTAURANT_BILLING);
}

function billingHomeFor(pathname) {
  return pathname.startsWith('/rst') ? RESTAURANT_BILLING : RETAIL_BILLING;
}

/**
 * Если оплата компании заблокирована — пускаем только на billing (админ) или показываем стоп-экран.
 */
export default function BillingAccessGuard({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  const enabled = Boolean(isAuthenticated() && user && user.role !== 'SUPER_ADMIN');

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-billing-access', user?.companyId || user?.id],
    queryFn: () => tenantBillingApi.access().then((r) => r.data),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });

  if (!enabled) return children;
  if (isLoading) return children;

  const blocked = data?.billingEnabled && data?.accessAllowed === false;
  if (!blocked) return children;

  if (user?.role === 'ADMIN' && isBillingPath(location.pathname)) return children;
  if (user?.role === 'ADMIN') {
    return <Navigate to={billingHomeFor(location.pathname)} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">{t('billing.accessBlockedTitle')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('billing.accessBlockedBody')}</p>
      </div>
    </div>
  );
}
