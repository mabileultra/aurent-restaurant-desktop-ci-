import { Delete } from 'lucide-react';
import { appendPayDigit, backspacePayValue, setPayExact } from '../utils/restaurantPayKeypad';
import '../styles/restaurant-pay-keypad.css';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Touch numeric keypad for restaurant pay modal.
 */
export default function RestaurantPayKeypad({
  value,
  onChange,
  exactAmount,
  disabled = false,
  t,
}) {
  const press = (digit) => {
    if (disabled) return;
    onChange(appendPayDigit(value, digit));
  };

  const backspace = () => {
    if (disabled) return;
    onChange(backspacePayValue(value));
  };

  const clear = () => {
    if (disabled) return;
    onChange('');
  };

  const exact = () => {
    if (disabled || exactAmount == null) return;
    onChange(setPayExact(exactAmount));
  };

  return (
    <div className="rst-pay-keypad">
      <div className="rst-pay-keypad__grid">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            type="button"
            className="rst-pay-keypad__key"
            disabled={disabled}
            onClick={() => press(digit)}
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          className="rst-pay-keypad__key rst-pay-keypad__key--action"
          disabled={disabled}
          onClick={clear}
        >
          C
        </button>
        <button
          type="button"
          className="rst-pay-keypad__key"
          disabled={disabled}
          onClick={() => press('0')}
        >
          0
        </button>
        <button
          type="button"
          className="rst-pay-keypad__key rst-pay-keypad__key--action"
          disabled={disabled}
          onClick={backspace}
          aria-label={t('common.backspace')}
        >
          <Delete size={18} />
        </button>
      </div>
      <button
        type="button"
        className="rst-pay-keypad__exact"
        disabled={disabled || exactAmount == null}
        onClick={exact}
      >
        {t('pos.keypadExact')}
      </button>
    </div>
  );
}
