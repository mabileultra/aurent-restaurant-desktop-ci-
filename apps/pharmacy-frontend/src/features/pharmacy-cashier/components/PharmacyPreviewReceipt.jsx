import { useTranslation } from 'react-i18next';
import { fmtMoney as fmt } from '../../../utils/formatMoney';
import { lineSubtotal } from '../../../store/cartStore';
import { formatQty } from '../../../utils/quantityFormat';
import '../styles/pharmacy-preview-receipt.css';

/**
 * Предварительный (нефискальный) чек в средней зоне кассы.
 */
export default function PharmacyPreviewReceipt({
  receiptNo,
  items = [],
  total = 0,
  onPrint,
}) {
  const { t } = useTranslation();

  return (
    <div className="pharmacy-preview-receipt" id="pharmacy-preview-receipt">
      <header className="pharmacy-preview-receipt__head">
        <h3>{t('pharmacyCashier.pay.previewCheck')}</h3>
        <p>{t('pharmacyCashier.receiptNo', { n: receiptNo || '—' })}</p>
        <p className="pharmacy-preview-receipt__badge">{t('pharmacyCashier.pay.previewNonFiscal')}</p>
      </header>
      <table className="pharmacy-preview-receipt__table">
        <thead>
          <tr>
            <th>№</th>
            <th>{t('pharmacyCashier.colName')}</th>
            <th>{t('pharmacyCashier.colQty')}</th>
            <th>{t('pharmacyCashier.colSum')}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.lineId}>
              <td>{index + 1}</td>
              <td>{item.name}</td>
              <td>{formatQty(item.quantity, item.saleType, item.unitCode)}</td>
              <td>{fmt(lineSubtotal(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="pharmacy-preview-receipt__foot">
        <span>{t('pharmacyCashier.receiptItems', { count: items.length })}</span>
        <strong>{fmt(total)}</strong>
      </footer>
      {onPrint ? (
        <button type="button" className="pharmacy-preview-receipt__print" onClick={onPrint}>
          {t('pharmacyCashier.pay.previewPrint')}
        </button>
      ) : null}
    </div>
  );
}
