import { Printer } from 'lucide-react';

export default function PrintReceiptToggle({ checked, onChange, t, className = '', disabled = false }) {
  const fullLabel = t('pos.printReceiptAfterSale');
  const classes = ['pos-pay-print-toggle', className].filter(Boolean).join(' ');

  return (
    <label className={classes} title={fullLabel}>
      <input
        type="checkbox"
        className="pos-pay-print-toggle__input"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={fullLabel}
      />
      <span className="pos-pay-print-toggle__box" aria-hidden />
      <Printer size={18} strokeWidth={1.75} className="pos-pay-print-toggle__icon" aria-hidden />
      <span className="pos-pay-print-toggle__text">{t('pos.printReceiptShort')}</span>
    </label>
  );
}
