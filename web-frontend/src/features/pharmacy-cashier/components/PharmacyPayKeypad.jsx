import { Delete } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { appendKeypadDigit } from '../../cashier/components/NumericKeypad';

/**
 * Клавиатура оплаты аптеки — разметка и стили только под pharmacy-pay-rail.
 */
export default function PharmacyPayKeypad({
  value,
  onChange,
  quickActions = [],
  disabled = false,
}) {
  const { t } = useTranslation();

  const press = (digit) => {
    if (disabled) return;
    onChange(appendKeypadDigit(value, digit));
  };

  const backspace = () => {
    if (disabled || !value) return;
    onChange(value.slice(0, -1));
  };

  const clear = () => {
    if (disabled) return;
    onChange('');
  };

  const applyQuick = (amount, mode = 'add') => {
    if (disabled || amount == null) return;
    const cur = Number(String(value).replace(',', '.')) || 0;
    const next =
      mode === 'add'
        ? Math.round((cur + Number(amount)) * 100) / 100
        : Math.round(Number(amount) * 100) / 100;
    onChange(Number.isInteger(next) ? String(next) : next.toFixed(2));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <div className="pharmacy-pay-keys">
      {quickActions.length > 0 ? (
        <div className="pharmacy-pay-keys__quick">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="pharmacy-pay-keys__quick-btn"
              disabled={disabled}
              onClick={() => applyQuick(action.amount, action.mode)}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="pharmacy-pay-keys__grid">
        {keys.map((digit) => (
          <button
            key={digit}
            type="button"
            className="pharmacy-pay-keys__key"
            disabled={disabled}
            onClick={() => press(digit)}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="pharmacy-pay-keys__key pharmacy-pay-keys__key--clear"
          disabled={disabled}
          onClick={clear}
        >
          {t('pos.keypadClear')}
        </button>
        <button
          type="button"
          className="pharmacy-pay-keys__key"
          disabled={disabled}
          onClick={() => press('0')}
        >
          0
        </button>
        <button
          type="button"
          className="pharmacy-pay-keys__key pharmacy-pay-keys__key--icon"
          disabled={disabled}
          onClick={backspace}
          aria-label={t('pos.keypadBackspace')}
        >
          <Delete size={20} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
