import { useMemo } from 'react';
import { CreditCard, QrCode, X } from 'lucide-react';
import { PAYMENT_PROVIDER_LOGOS } from '../../cashier/constants/paymentProviderLogos';
import ReceiptQrCode from '../../../components/receipt/ReceiptQrCode';
import { BaseButton, BaseModal } from '../../../components/ui';
import {
  cardFormComplete,
  detectUzCardBrand,
  digitsOnly,
  formatCardExpiry,
  formatCardNumber,
  maskedPan,
} from '../utils/cardInput';

const METHODS = [
  { id: 'HUMO', tone: 'humo', logo: PAYMENT_PROVIDER_LOGOS.HUMO, labelKey: 'billing.payHumo' },
  { id: 'UZCARD', tone: 'uzcard', logo: PAYMENT_PROVIDER_LOGOS.UZCARD, labelKey: 'billing.payUzcard' },
  { id: 'CLICK', tone: 'click', logo: PAYMENT_PROVIDER_LOGOS.CLICK, labelKey: 'billing.payClick' },
  { id: 'PAYME', tone: 'payme', logo: PAYMENT_PROVIDER_LOGOS.PAYME, labelKey: 'billing.payPayme' },
];

function PlasticCard({ method, card, holderFallback, amountLabel }) {
  const brand = method === 'UZCARD' ? 'uzcard' : 'humo';
  return (
    <div className={`billing-plastic billing-plastic--${brand}`}>
      <div className="billing-plastic__top">
        <span className="billing-plastic__chip" aria-hidden />
        <img
          src={brand === 'uzcard' ? PAYMENT_PROVIDER_LOGOS.UZCARD : PAYMENT_PROVIDER_LOGOS.HUMO}
          alt=""
          className="billing-plastic__logo"
        />
      </div>
      <p className="billing-plastic__pan">{maskedPan(card.pan)}</p>
      <div className="billing-plastic__meta">
        <div>
          <span>VALID THRU</span>
          <strong>{digitsOnly(card.exp, 4).length >= 4 ? card.exp : 'MM/YY'}</strong>
        </div>
        <div>
          <span>CVV</span>
          <strong>{card.cvv ? '•'.repeat(card.cvv.length) : '•••'}</strong>
        </div>
        <div className="billing-plastic__holder">
          <span>CARDHOLDER</span>
          <strong>{card.holder || holderFallback}</strong>
        </div>
      </div>
      <p className="billing-plastic__amount">{amountLabel}</p>
    </div>
  );
}

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
  card,
  setCard,
  paying,
  onPay,
  clickPaymentUrl = '',
  clickPaid = false,
  onOpenClick,
}) {
  const panDigits = digitsOnly(card.pan, 16);
  const cardMethods = method === 'HUMO' || method === 'UZCARD';
  const qrValue = useMemo(() => {
    if (method === 'CLICK') return clickPaymentUrl || '';
    if (method === 'PAYME') return '';
    const payload = new URLSearchParams({
      method,
      amount: String(amount || ''),
      source: 'aurent-billing',
    });
    return `https://aurent.uz/billing/pay?${payload.toString()}`;
  }, [amount, method, clickPaymentUrl]);

  const updateCard = (patch) => setCard((prev) => ({ ...prev, ...patch }));

  const onPanChange = (value) => {
    const pan = formatCardNumber(value);
    const brand = detectUzCardBrand(digitsOnly(pan, 16));
    updateCard({ pan });
    if (brand && (method === 'HUMO' || method === 'UZCARD')) {
      setMethod(brand);
    }
  };

  const canPay = amountValid && (cardMethods ? cardFormComplete(card) : true);

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
            className={`billing-pay-method billing-pay-method--${item.tone} ${method === item.id ? 'billing-pay-method--active' : ''}`}
            onClick={() => setMethod(item.id)}
          >
            <img src={item.logo} alt="" draggable={false} />
            <span>{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      <div className="billing-pay-stage">
        {cardMethods ? (
          <PlasticCard
            method={method}
            card={card}
            holderFallback={t('billing.payCardHolderFallback')}
            amountLabel={`${money(amount)} ${t('billing.currency')}`}
          />
        ) : (
          <div className={`billing-pay-app billing-pay-app--${method.toLowerCase()}`}>
            <img
              src={method === 'CLICK' ? PAYMENT_PROVIDER_LOGOS.CLICK : PAYMENT_PROVIDER_LOGOS.PAYME}
              alt=""
            />
            <p>
              {clickPaid
                ? t('billing.payClickPaid')
                : t(method === 'CLICK' ? 'billing.payClickHint' : 'billing.payPaymeHint')}
            </p>
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
            <p className="billing-pay-qr__hint">
              {method === 'CLICK' ? t('billing.payScanQrClickHint') : t('billing.payScanQrHint')}
            </p>
          </div>
        ) : null}
      </div>

      {cardMethods ? (
        <div className="billing-pay-form">
          <label className="billing-field-label" htmlFor="billing-card-pan">
            <CreditCard size={13} /> {t('billing.payCardNumber')}
          </label>
          <input
            id="billing-card-pan"
            className="billing-input billing-input--mono"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="9860 00•• •••• ••••"
            value={card.pan}
            onChange={(e) => onPanChange(e.target.value)}
          />
          <div className="billing-pay-form__row">
            <div>
              <label className="billing-field-label" htmlFor="billing-card-exp">{t('billing.payCardExpiry')}</label>
              <input
                id="billing-card-exp"
                className="billing-input billing-input--mono"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                value={card.exp}
                onChange={(e) => updateCard({ exp: formatCardExpiry(e.target.value) })}
              />
            </div>
            <div>
              <label className="billing-field-label" htmlFor="billing-card-cvv">{t('billing.payCardCvv')}</label>
              <input
                id="billing-card-cvv"
                className="billing-input billing-input--mono"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="•••"
                value={card.cvv}
                onChange={(e) => updateCard({ cvv: digitsOnly(e.target.value, 3) })}
              />
            </div>
          </div>
          <label className="billing-field-label" htmlFor="billing-card-holder">{t('billing.payCardHolder')}</label>
          <input
            id="billing-card-holder"
            className="billing-input"
            autoComplete="cc-name"
            placeholder={t('billing.payCardHolderPlaceholder')}
            value={card.holder}
            onChange={(e) => updateCard({ holder: e.target.value.toUpperCase() })}
          />
        </div>
      ) : null}

      <button
        type="button"
        className="billing-btn billing-btn--accent billing-pay-modal__cta"
        disabled={!canPay || paying || clickPaid}
        onClick={() => {
          if (method === 'CLICK' && clickPaymentUrl && onOpenClick) {
            onOpenClick();
            return;
          }
          onPay(method);
        }}
      >
        {paying
          ? t('billing.redirectingPay')
          : clickPaid
            ? t('billing.payClickPaid')
            : method === 'CLICK' && clickPaymentUrl
              ? t('billing.payOpenClick')
              : `${t('billing.payNow')} · ${money(amount)} ${t('billing.currency')}`}
      </button>
      {panDigits.length > 0 && cardMethods && !cardFormComplete(card) ? (
        <p className="billing-pay-modal__note">{t('billing.payCardIncomplete')}</p>
      ) : (
        <p className="billing-pay-modal__note">
          {method === 'CLICK' ? t('billing.payClickNote') : t('billing.payIntegrationNote')}
        </p>
      )}
    </BaseModal>
  );
}
