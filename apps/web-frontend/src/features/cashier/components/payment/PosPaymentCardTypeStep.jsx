import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENABLED_PAYMENT_CARD_PROVIDERS } from '../../constants/paymentCardProviders';
import CardPaymentFields, {
  createInitialCardDetails,
  validateAndNormalizeCardDetails,
} from './CardPaymentFields';

export default function PosPaymentCardTypeStep({ t, isPending, submitCard }) {
  const { t: translate } = useTranslation();
  const tr = t ?? translate;
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [form, setForm] = useState(createInitialCardDetails);
  const [error, setError] = useState(null);

  const handleSelectProvider = (cardType) => {
    setSelectedProvider(cardType);
    setError(null);
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!selectedProvider || isPending) return;
    const result = validateAndNormalizeCardDetails(form, tr);
    if (!result.ok) {
      setError(result);
      return;
    }
    setError(null);
    submitCard(selectedProvider, result.data);
  };

  return (
    <form className="pos-pay-panel__step pos-pay-panel__step--card-type" onSubmit={handleSubmit}>
      <p className="pos-pay-card-type-step__lead">{tr('pos.cardTypeLead')}</p>
      <div className="pos-pay-card-providers pos-pay-card-providers--flow-stack">
        {ENABLED_PAYMENT_CARD_PROVIDERS.map((provider) => {
          const label = tr(provider.labelKey);
          const isSelected = selectedProvider === provider.cardType;
          return (
            <button
              key={provider.id}
              type="button"
              className={`pos-pay-card-providers__btn pos-pay-card-providers__btn--${provider.tone}${
                isSelected ? ' is-selected' : ''
              }`}
              disabled={isPending}
              title={label}
              aria-label={label}
              aria-pressed={isSelected}
              onClick={() => handleSelectProvider(provider.cardType)}
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
        <div className="pos-card-fields__flow-wrap">
          <CardPaymentFields
            value={form}
            onChange={(next) => {
              setForm(next);
              if (error) setError(null);
            }}
            error={error}
            disabled={isPending}
            autoFocusRrn
            idPrefix="pos-flow-card"
            t={tr}
          />
          <div className="pos-card-fields__flow-actions">
            <button
              type="submit"
              className="pos-pay-panel__primary pos-card-fields__flow-submit"
              disabled={isPending}
            >
              {tr('pos.cardConfirmPay', { defaultValue: 'Подтвердить и пробить' })}
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
