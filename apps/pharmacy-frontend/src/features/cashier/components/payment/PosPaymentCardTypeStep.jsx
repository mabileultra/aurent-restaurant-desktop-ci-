import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../constants/paymentCardProviders';
import PharmacyCardFields, {
  createInitialCardDetails,
  validateAndNormalizeCardDetails,
} from '../../../pharmacy-cashier/components/PharmacyCardFields';

export default function PosPaymentCardTypeStep({ t, isPending, submitCard }) {
  const { t: translate } = useTranslation();
  const tr = t ?? translate;
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [cardForm, setCardForm] = useState(createInitialCardDetails);
  const [error, setError] = useState(null);

  const handleConfirm = (e) => {
    e?.preventDefault?.();
    if (!selectedProvider || isPending) return;
    const result = validateAndNormalizeCardDetails(cardForm, tr);
    if (!result.ok) {
      setError(result);
      return;
    }
    setError(null);
    submitCard(selectedProvider, result.data);
  };

  return (
    <form className="pos-pay-panel__step pos-pay-panel__step--card-type" onSubmit={handleConfirm}>
      <p className="pos-pay-card-type-step__lead">{tr('pos.cardTypeLead')}</p>
      <div className="pos-pay-card-providers pos-pay-card-providers--flow-stack">
        {ENABLED_PAYMENT_CARD_PROVIDERS.map((provider) => {
          const label = tr(provider.labelKey);
          const active = selectedProvider === provider.cardType;
          return (
            <button
              key={provider.id}
              type="button"
              className={`pos-pay-card-providers__btn pos-pay-card-providers__btn--${provider.tone}${active ? ' is-active' : ''}`}
              disabled={isPending}
              title={label}
              aria-label={label}
              aria-pressed={active}
              onClick={() => {
                setSelectedProvider(provider.cardType);
                setError(null);
              }}
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

      {selectedProvider ? (
        <div className="pharmacy-card-fields__flow-wrap">
          <PharmacyCardFields
            value={cardForm}
            onChange={(next) => {
              setCardForm(next);
              if (error) setError(null);
            }}
            error={error}
            disabled={isPending}
            autoFocusRrn
            t={tr}
          />
          <button
            type="submit"
            className="pharmacy-card-modal__btn pharmacy-card-modal__btn--primary"
            disabled={isPending}
          >
            {tr('pos.cardConfirmPay', { defaultValue: 'Подтвердить и пробить' })}
          </button>
        </div>
      ) : null}
    </form>
  );
}
