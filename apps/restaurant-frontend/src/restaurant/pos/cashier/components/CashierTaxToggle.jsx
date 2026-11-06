import { useCashierTaxToggle } from '../hooks/useCashierTaxToggle';
import '../styles/cashier-tax-toggle.css';

export default function CashierTaxToggle({ storeId, t }) {
  const tax = useCashierTaxToggle(storeId);
  if (storeId == null) return null;

  const on = tax.enabled;
  return (
    <button
      type="button"
      className={`rst-cashier-tax${on ? ' is-on' : ''}`}
      role="switch"
      aria-checked={on}
      disabled={tax.loading || tax.pending}
      onClick={tax.toggle}
    >
      <span className="rst-cashier-tax__label">{t('rst.cashier.tax')}</span>
      <span className="rst-cashier-tax__state">
        {on ? t('rst.cashier.taxOn') : t('rst.cashier.taxOff')}
      </span>
      <span className="rst-cashier-tax__switch" aria-hidden>
        <span className="rst-cashier-tax__knob" />
      </span>
    </button>
  );
}
