import { Minus, Plus } from 'lucide-react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { getReturnableLines, returnableQty } from '../utils/rstReturnLines';
import '../styles/cashier-paid-return-lines.css';

export default function CashierPaidReturnLines({ sale, qtyByItemId, onQtyChange, t }) {
  const returnable = getReturnableLines(sale);

  if (!sale) return null;

  if (returnable.length === 0) {
    return <p className="rst-paid-return__empty">{t('pos.returnNoItems')}</p>;
  }

  return (
    <ul className="rst-paid-return__lines">
      {returnable.map((line) => {
        const max = returnableQty(line);
        const qty = qtyByItemId[line.id] ?? 0;
        const unit = Number(line.unitPrice) || 0;
        const lineSum = unit * qty;

        return (
          <li key={line.id} className="rst-paid-return__line">
            <div className="rst-paid-return__line-top">
              <div className="rst-paid-return__line-info">
                <span className="rst-paid-return__line-name">
                  {line.productName || '—'}
                </span>
                <span className="rst-paid-return__line-meta">
                  {t('pos.returnSold')}: {line.quantity}
                  {(Number(line.returnedQuantity) || 0) > 0 ? (
                    <span>
                      {' '}
                      · {t('pos.returnAlready')}: {line.returnedQuantity}
                    </span>
                  ) : null}
                </span>
              </div>
              <span className="rst-paid-return__line-sum">
                {qty > 0 ? fmtMoneyCompact(lineSum) : '—'}
              </span>
            </div>
            <div className="rst-paid-return__line-actions">
              <div className="rst-paid-return__stepper" role="group" aria-label={line.productName}>
                <button
                  type="button"
                  className="rst-paid-return__step-btn"
                  disabled={qty <= 0}
                  onClick={() => onQtyChange(line.id, Math.max(0, qty - 1))}
                  aria-label={t('pos.returnDecrease')}
                >
                  <Minus size={20} strokeWidth={2.5} aria-hidden />
                </button>
                <span className="rst-paid-return__step-value" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  className="rst-paid-return__step-btn"
                  disabled={qty >= max}
                  onClick={() => onQtyChange(line.id, Math.min(max, qty + 1))}
                  aria-label={t('pos.returnIncrease')}
                >
                  <Plus size={20} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
              <button
                type="button"
                className="rst-paid-return__max"
                disabled={qty >= max}
                onClick={() => onQtyChange(line.id, max)}
              >
                {t('pos.returnMax')}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
