import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tenantBillingApi } from '../../api';
import { useAuthStore } from '../../store/authStore';

/**
 * Если биллинг компании BLOCKED — пускаем только на /billing (админ) или показываем стоп-экран.
 */
export default function BillingAccessGuard({ children }) {
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

  const onBillingPage = location.pathname.startsWith('/billing');
  if (user?.role === 'ADMIN' && onBillingPage) return children;
  if (user?.role === 'ADMIN') return <Navigate to="/billing" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Доступ приостановлен</h1>
        <p className="mt-2 text-sm text-slate-600">
          Месячная оплата Aurent не прошла. Попросите администратора компании пополнить счёт в разделе «Биллинг и подписка».
        </p>
      </div>
    </div>
  );
}
