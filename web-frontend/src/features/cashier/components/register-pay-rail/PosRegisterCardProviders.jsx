import { useTranslation } from 'react-i18next';
import { REGISTER_CARD_PROVIDERS } from '../../constants/posRegisterPayConstants';

export default function PosRegisterCardProviders({ disabled, isPending, onSelectCard }) {
  const { t } = useTranslation();

  return (
    <div className="pos-register-card-providers">
      {REGISTER_CARD_PROVIDERS.map((provider) => {
        const isDisabled = disabled || isPending || !provider.enabled;
        const label = t(provider.labelKey);

        return (
          <button
            key={provider.id}
            type="button"
            className={`pos-register-card-providers__btn pos-register-card-providers__btn--${provider.tone}${
              !provider.enabled ? ' is-soon' : ''
            }`}
            disabled={isDisabled}
            title={!provider.enabled ? t('pos.cardProviderSoon') : label}
            aria-label={label}
            onClick={() => provider.cardType && onSelectCard(provider.cardType)}
          >
            <img
              src={provider.logoSrc}
              alt=""
              className="pos-register-card-providers__logo"
              loading="lazy"
              draggable={false}
            />
          </button>
        );
      })}
    </div>
  );
}
