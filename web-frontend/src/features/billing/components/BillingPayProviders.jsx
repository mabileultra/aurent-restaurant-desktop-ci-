import { PAYMENT_PROVIDER_LOGOS } from '../../cashier/constants/paymentProviderLogos';

const PROVIDERS = [
  {
    id: 'CLICK',
    tone: 'click',
    logoSrc: PAYMENT_PROVIDER_LOGOS.CLICK,
    labelKey: 'billing.payClick',
  },
  {
    id: 'PAYME',
    tone: 'payme',
    logoSrc: PAYMENT_PROVIDER_LOGOS.PAYME,
    labelKey: 'billing.payPayme',
  },
];

/** Кнопки Click / Payme — те же логотипы, что на кассе. */
export default function BillingPayProviders({ t, disabled, paying, onPay }) {
  return (
    <div className="billing-pay-providers" role="group" aria-label={t('billing.quickTopUp')}>
      {PROVIDERS.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className={`billing-pay-providers__btn billing-pay-providers__btn--${provider.tone}`}
          disabled={disabled || paying}
          title={t(provider.labelKey)}
          aria-label={t(provider.labelKey)}
          onClick={() => onPay(provider.id)}
        >
          <img
            src={provider.logoSrc}
            alt=""
            className="billing-pay-providers__logo"
            loading="lazy"
            draggable={false}
          />
          <span className="billing-pay-providers__label">{t(provider.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
