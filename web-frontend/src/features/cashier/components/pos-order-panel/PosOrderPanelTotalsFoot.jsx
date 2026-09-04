import { Clock, XCircle } from 'lucide-react';
import { fmtMoney as fmt } from '../../../../utils/formatMoney';

export default function PosOrderPanelTotalsFoot({
  t,
  positionsCount,
  totalQty,
  taxTotal,
  taxRateLabel,
  onHold,
  onClear,
  holdDisabled = false,
  clearDisabled = false,
  holdIsRestore = false,
}) {
  return (
    <footer className="pos-order-panel__totals-foot">
      <div className="pos-order-panel__totals-stats">
        <div className="pos-order-panel__totals-stat">
          <span className="pos-order-panel__totals-stat-label">{t('pos.totalPositions')}</span>
          <span className="pos-order-panel__totals-stat-box">{positionsCount}</span>
        </div>
        <div className="pos-order-panel__totals-stat">
          <span className="pos-order-panel__totals-stat-label">{t('pos.totalQty')}</span>
          <span className="pos-order-panel__totals-stat-box">
            {totalQty}
            <span className="pos-order-panel__totals-stat-unit">{t('pos.unitPcsShort')}</span>
          </span>
        </div>
        <div className="pos-order-panel__totals-stat pos-order-panel__totals-stat--tax">
          <span className="pos-order-panel__totals-stat-label">
            {t('pos.taxLine', { rate: taxRateLabel })}:
          </span>
          <strong className="pos-order-panel__totals-stat-tax">{fmt(taxTotal)}</strong>
        </div>
      </div>

      <div className="pos-order-panel__totals-actions">
        <button
          type="button"
          className="pos-order-panel__foot-btn pos-order-panel__foot-btn--hold"
          onClick={onHold}
          disabled={holdDisabled}
        >
          <span className="pos-order-panel__foot-btn-icon pos-order-panel__foot-btn-icon--hold" aria-hidden>
            <Clock size={16} strokeWidth={2.25} />
          </span>
          <span className="pos-order-panel__foot-btn-label">
            {holdIsRestore ? t('pos.restoreReceiptF6') : t('pos.holdReceiptF6')}
          </span>
        </button>
        <button
          type="button"
          className="pos-order-panel__foot-btn pos-order-panel__foot-btn--clear"
          onClick={onClear}
          disabled={clearDisabled}
        >
          <span className="pos-order-panel__foot-btn-icon pos-order-panel__foot-btn-icon--clear" aria-hidden>
            <XCircle size={16} strokeWidth={2.25} />
          </span>
          <span className="pos-order-panel__foot-btn-label">{t('pos.clearOrder')}</span>
        </button>
      </div>
    </footer>
  );
}
