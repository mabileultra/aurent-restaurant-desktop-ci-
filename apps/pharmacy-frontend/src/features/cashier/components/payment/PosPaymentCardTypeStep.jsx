import { useTranslation } from 'react-i18next';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../constants/paymentCardProviders';

export default function PosPaymentCardTypeStep({ t, isPending, submitCard }) {
  const { t: translate } = useTranslation();
  const tr = t ?? translate;

  return (
    <div className="pos-pay-panel__step pos-pay-panel__step--card-type">
      <p className="pos-pay-card-type-step__lead">{tr('pos.cardTypeLead')}</p>
      <div className="pos-pay-card-providers pos-pay-card-providers--flow-stack">
        {ENABLED_PAYMENT_CARD_PROVIDERS.map((provider) => {
          const label = tr(provider.labelKey);
          return (
            <button
              key={provider.id}
              type="button"
              className={`pos-pay-card-providers__btn pos-pay-card-providers__btn--${provider.tone}`}
              disabled={isPending}
              title={label}
              aria-label={label}
              onClick={() => submitCard(provider.cardType)}
            >
              <img
                src={provider.logoSrc}
                alt=""
                className="pos-pay-card-providers__logo"
                loading="lazy"
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
