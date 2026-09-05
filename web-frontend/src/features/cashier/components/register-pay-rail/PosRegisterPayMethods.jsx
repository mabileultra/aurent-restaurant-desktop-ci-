import { useTranslation } from 'react-i18next';
import { REGISTER_PAY_METHODS } from '../../constants/posRegisterPayConstants';

export default function PosRegisterPayMethods({
  disabled,
  onCashless,
  onCredit,
  onAdvance,
  activeMethod = 'cashless',
}) {
  const { t } = useTranslation();

  const handlers = {
    cashless: onCashless,
    credit: onCredit,
    advance: onAdvance,
  };

  return (
    <div className="pos-register-pay-methods" role="group" aria-label={t('pos.paymentTitle')}>
      <div className="pos-register-pay-methods__grid">
        {REGISTER_PAY_METHODS.map(({ id, labelKey, action, icon: Icon }) => {
          const isActive = activeMethod === id;
          return (
            <button
              key={id}
              type="button"
              className={[
                'pos-register-pay-methods__tile',
                `pos-register-pay-methods__tile--${id}`,
                isActive ? 'is-active' : '',
              ].filter(Boolean).join(' ')}
              disabled={disabled}
              aria-pressed={isActive}
              onClick={handlers[action]}
            >
              <span className="pos-register-pay-methods__tile-icon" aria-hidden>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="pos-register-pay-methods__tile-label">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
