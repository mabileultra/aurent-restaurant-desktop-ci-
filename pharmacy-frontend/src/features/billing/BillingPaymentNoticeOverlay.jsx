import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './BillingPaymentNoticeOverlay.css';

const SUPPORT_URL = 'https://t.me/aurent_support';

/**
 * Мягкое напоминание об оплате (~12 с). Не блокирует кассу.
 */
export default function BillingPaymentNoticeOverlay({
  open,
  onClose,
  isAdmin,
  billingPath = '/billing',
  noticeKind,
  graceDaysLeft,
}) {
  const { t } = useTranslation();
  if (!open) return null;

  const bodyKey = noticeKind === 'GRACE'
    ? 'billing.paymentNoticeGraceBody'
    : noticeKind === 'OVERDUE'
      ? 'billing.paymentNoticeOverdueBody'
      : 'billing.paymentNoticeDueBody';

  return (
    <div className="billing-payment-notice" role="dialog" aria-modal="false" aria-labelledby="billing-payment-notice-title">
      <div className="billing-payment-notice__card">
        <h2 id="billing-payment-notice-title" className="billing-payment-notice__title">
          {t('billing.paymentNoticeTitle')}
        </h2>
        <p className="billing-payment-notice__body">
          {t(bodyKey, { days: graceDaysLeft ?? 0 })}
        </p>
        <p className="billing-payment-notice__hint">
          {isAdmin
            ? t('billing.paymentNoticeAdminHint')
            : t('billing.paymentNoticeCashierHint')}
        </p>
        <div className="billing-payment-notice__actions">
          {isAdmin ? (
            <Link className="billing-payment-notice__btn billing-payment-notice__btn--primary" to={billingPath} onClick={onClose}>
              {t('billing.paymentNoticeGoBilling')}
            </Link>
          ) : (
            <a
              className="billing-payment-notice__btn billing-payment-notice__btn--primary"
              href={SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
            >
              {t('billing.paymentNoticeSupport')}
            </a>
          )}
          <button type="button" className="billing-payment-notice__btn" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
