import { useTranslation } from 'react-i18next';
import { REGISTER_PAY_METHODS } from '../../constants/posRegisterPayConstants';

/**
 * Action tiles (cashless / credit / advance) — not a persistent tab selection.
 */
export default function PosRegisterPayMethods({
  disabled,
  cardPayBlocked = false,
  onCashless,
  onCredit,
  onAdvance,
  onCorporate,
}) {
  const { t } = useTranslation();

  const handlers = {
    cashless: onCashless,
    credit: onCredit,
    advance: onAdvance,
    corporate: onCorporate,
  };

  return (
    <div className="pos-register-pay-methods" role="group" aria-label={t('pos.paymentTitle')}>
      <div className="pos-register-pay-methods__grid">
        {REGISTER_PAY_METHODS.map(({ id, labelKey, action, icon: Icon }) => {
          const label = t(labelKey);
          const blocked = action === 'corporate' && cardPayBlocked;

          return (
            <button
              key={id}
              type="button"
              className={`pos-register-pay-methods__tile pos-register-pay-methods__tile--${id}`}
              disabled={disabled || blocked}
              title={label}
              onClick={handlers[action]}
            >
              <span className="pos-register-pay-methods__tile-icon" aria-hidden>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="pos-register-pay-methods__tile-label">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
