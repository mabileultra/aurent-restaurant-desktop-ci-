/**
 * Быстрый ввод купюр аптечной оплаты — без экранного numpad 0–9.
 * Сумма с физклавиатуры ПК (usePharmacyPayKeyboard).
 */
import { parseTenderedInput } from '../../cashier/components/payment/posPaymentConstants';

export default function PharmacyPayQuickCash({
  value,
  onChange,
  exactAmount,
  onExact,
  onReset,
  quickActions = [],
  disabled = false,
  title,
  exactLabel,
  resetLabel,
}) {
  const applyQuick = (amount, mode = 'add') => {
    if (disabled || amount == null) return;
    const cur = parseTenderedInput(value);
    const next =
      mode === 'add'
        ? Math.round((cur + Number(amount)) * 100) / 100
        : Math.round(Number(amount) * 100) / 100;
    onChange(Number.isInteger(next) ? String(next) : next.toFixed(2));
  };

  return (
    <div className="pharmacy-pay-quick">
      <div className="pharmacy-pay-quick__head">
        <span className="pharmacy-pay-quick__title">{title}</span>
        <button
          type="button"
          className="pharmacy-pay-quick__exact"
          disabled={disabled || exactAmount == null || exactAmount <= 0}
          onClick={onExact}
          title="F5"
        >
          {exactLabel}
          <kbd>F5</kbd>
        </button>
      </div>

      <div className="pharmacy-pay-quick__grid">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="pharmacy-pay-quick__btn"
            disabled={disabled}
            onClick={() => applyQuick(action.amount, action.mode)}
          >
            {action.label}
          </button>
        ))}
        <button
          type="button"
          className="pharmacy-pay-quick__btn pharmacy-pay-quick__btn--reset"
          disabled={disabled || !value}
          onClick={onReset}
        >
          {resetLabel}
        </button>
      </div>
    </div>
  );
}
