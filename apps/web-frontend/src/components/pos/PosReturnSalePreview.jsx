import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../utils/formatMoney';
import SaleReturnLinesEditor from '../sale-return/SaleReturnLinesEditor';
import { paymentLabel } from './posReturnHelpers';

export default function PosReturnSalePreview({
  sale,
  qtyByItemId,
  setQty,
  selectAllMax,
  totalSelected,
}) {
  const { t } = useTranslation();

  return (
    <section className="pos-return-modal__preview" aria-live="polite">
      <div className="pos-return-modal__preview-head">
        <span className="pos-return-modal__preview-badge">
          <CheckCircle2 size={14} aria-hidden />
          {t('pos.returnFoundLabel')}
        </span>
        <span className="pos-return-modal__preview-receipt">{sale.receiptNumber}</span>
      </div>
      <p className="pos-return-modal__preview-total">
        {fmt(sale.totalAmount)}
        <span className="pos-return-modal__preview-currency">сум</span>
      </p>
      <div className="pos-return-modal__preview-meta">
        <span>{sale.cashierName ?? '—'}</span>
        <span className="pos-return-modal__preview-dot" aria-hidden>
          ·
        </span>
        <span>{paymentLabel(sale.paymentMethod, t)}</span>
      </div>
      <p className="pos-return-modal__preview-total">
        {t('pos.returnSelectedTotal')}: <strong>{fmt(totalSelected)}</strong>
      </p>
      <div className="pos-return-modal__select-all-wrap">
        <button type="button" className="pos-return-modal__select-all" onClick={selectAllMax}>
          {t('pos.returnSelectAll')}
        </button>
      </div>
      <SaleReturnLinesEditor sale={sale} qtyByItemId={qtyByItemId} onQtyChange={setQty} />
    </section>
  );
}
