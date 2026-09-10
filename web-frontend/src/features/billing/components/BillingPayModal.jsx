import { useMemo } from 'react';
import { QrCode, X } from 'lucide-react';
import { PAYMENT_PROVIDER_LOGOS } from '../../cashier/constants/paymentProviderLogos';
import ReceiptQrCode from '../../../components/receipt/ReceiptQrCode';
import { BaseButton, BaseModal } from '../../../components/ui';

const METHODS = [
  { id: 'HUMO', tone: 'humo', logo: PAYMENT_PROVIDER_LOGOS.HUMO, labelKey: 'billing.payHumo', available: false },
  { id: 'UZCARD', tone: 'uzcard', logo: PAYMENT_PROVIDER_LOGOS.UZCARD, labelKey: 'billing.payUzcard', available: false },
  { id: 'CLICK', tone: 'click', logo: PAYMENT_PROVIDER_LOGOS.CLICK, labelKey: 'billing.payClick', available: true },
  { id: 'PAYME', tone: 'payme', logo: PAYMENT_PROVIDER_LOGOS.PAYME, labelKey: 'billing.payPayme', available: false },
];

export default function BillingPayModal({
  open,
  onClose,
  t,
  money,
  amount,
  setAmount,
  amountValid,
  presets,
  method,
  setMethod,
  paying,
  onPay,
  clickPaymentUrl = '',
  clickPaid = false,
  onOpenClick,
}) {
  const selected = METHODS.find((item) => item.id === method) || METHODS.find((item) => item.available);
  const methodAvailable = !!selected?.available;
  const qrValue = useMemo(() => {
    if (method !== 'CLICK') return '';
    return clickPaymentUrl || '';
  }, [method, clickPaymentUrl]);

  const canPay = amountValid && methodAvailable && !clickPaid;

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      hideHeader
      size="lg"
      className="billing-pay-modal"
      bodyClassName="billing-pay-modal__body"
    >
      <div className="billing-pay-modal__head">
        <div>
          <p className="billing-pay-modal__kicker">{t('billing.payModalKicker')}</p>
          <h2 className="billing-pay-modal__title">{t('billing.payModalTitle')}</h2>
        </div>
        <BaseButton variant="ghost" size="sm" onClick={onClose} className="p-1" aria-label={t('common.close')}>
          <X size={20} />
        </BaseButton>
      </div>

      <div className="billing-presets billing-pay-modal__presets">
        {presets.map((value) => (
          <button
            key={value}
            type="button"
            className={`billing-preset ${String(amount) === String(value) ? 'billing-preset--active' : ''}`}
            onClick={() => setAmount(String(value))}
          >
            {money(value)}
          </button>
        ))}
      </div>
      <input
        className="billing-input"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder={t('billing.customAmount')}
      />

      <p className="billing-field-label">{t('billing.payMethod')}</p>
      <div className="billing-pay-methods">
        {METHODS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              'billing-pay-method',
              `billing-pay-method--${item.tone}`,
              method === item.id ? 'billing-pay-method--active' : '',
              item.available ? '' : 'billing-pay-method--soon',
            ].filter(Boolean).join(' ')}
            onClick={() => setMethod(item.id)}
          >
            <img src={item.logo} alt="" draggable={false} />
            <span>{t(item.labelKey)}</span>
            {!item.available ? (
              <span className="billing-pay-method__soon">{t('billing.payMethodSoon')}</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="billing-pay-stage">
        {methodAvailable ? (
          <div className={`billing-pay-app billing-pay-app--${method.toLowerCase()}`}>
            <img src={PAYMENT_PROVIDER_LOGOS.CLICK} alt="" />
            <p>
              {clickPaid
                ? t('billing.payClickPaid')
                : t('billing.payClickHint')}
            </p>
          </div>
        ) : (
          <div className="billing-pay-app billing-pay-app--soon">
            <img
              src={selected?.logo || PAYMENT_PROVIDER_LOGOS.PAYME}
              alt=""
            />
            <p>{t('billing.payComingSoon')}</p>
          </div>
        )}
        {qrValue ? (
          <div className="billing-pay-qr">
            <div className="billing-pay-qr__frame">
              <ReceiptQrCode value={qrValue} sizePx={148} />
            </div>
            <p className="billing-pay-qr__title">
              <QrCode size={14} /> {t('billing.payScanQr')}
            </p>
            <p className="billing-pay-qr__hint">{t('billing.payScanQrClickHint')}</p>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="billing-btn billing-btn--accent billing-pay-modal__cta"
        disabled={!canPay || paying}
        onClick={() => {
          if (!methodAvailable) return;
          if (method === 'CLICK' && clickPaymentUrl && onOpenClick) {
            onOpenClick();
            return;
          }
          onPay(method);
        }}
      >
        {!methodAvailable
          ? t('billing.payComingSoonCta')
          : paying
            ? t('billing.redirectingPay')
            : clickPaid
              ? t('billing.payClickPaid')
              : method === 'CLICK' && clickPaymentUrl
                ? t('billing.payOpenClick')
                : `${t('billing.payNow')} · ${money(amount)} ${t('billing.currency')}`}
      </button>
      <p className="billing-pay-modal__note">
        {methodAvailable
          ? t('billing.payClickNote')
          : t('billing.payComingSoonHint')}
      </p>
    </BaseModal>
  );
}
