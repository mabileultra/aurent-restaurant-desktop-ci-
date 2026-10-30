import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { tenantBillingApi } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useShouldUseOfflinePos } from '../../store/connectivityStore';
import BillingPaymentNoticeOverlay from '../../features/billing/BillingPaymentNoticeOverlay';
import { useBillingPaymentNotice } from '../../features/billing/useBillingPaymentNotice';

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
 * При GRACE / сроке оплаты — мягкое напоминание 3×/день (не блокирует работу).
 */
export default function BillingAccessGuard({ children }) {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const skipOnline = useShouldUseOfflinePos();

  const enabled = Boolean(
    isAuthenticated()
    && user
    && user.role !== 'SUPER_ADMIN'
    && user.role !== 'PLATFORM_ADMIN'
    && user.role !== 'PLATFORM_ANALYTICS'
    && !skipOnline,
  );

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-billing-access', user?.companyId || user?.id],
    queryFn: () => tenantBillingApi.access().then((r) => r.data),
    enabled,
    staleTime: 60_000,
    retry: skipOnline ? false : 1,
  });

  const companyId = user?.companyId ?? user?.id;
  const onBillingPage = isBillingPath(location.pathname);
  const noticeRequired = Boolean(
    enabled
    && !isLoading
    && data?.billingEnabled
    && data?.accessAllowed
    && data?.paymentNoticeRequired
    && !onBillingPage,
  );

  const { visible, dismiss } = useBillingPaymentNotice({
    enabled: noticeRequired,
    companyId,
    noticeRequired,
  });

  const noticeOverlay = (
    <BillingPaymentNoticeOverlay
      open={visible}
      onClose={dismiss}
      isAdmin={user?.role === 'ADMIN'}
      billingPath={billingHomeFor(location.pathname)}
      noticeKind={data?.noticeKind}
      graceDaysLeft={data?.graceDaysLeft}
    />
  );

  if (!enabled) return children;
  if (isLoading) return children;

  const blocked = data?.billingEnabled && data?.accessAllowed === false;
  if (!blocked) {
    return (
      <>
        {children}
        {noticeOverlay}
      </>
    );
  }

  if (user?.role === 'ADMIN' && onBillingPage) return children;
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
