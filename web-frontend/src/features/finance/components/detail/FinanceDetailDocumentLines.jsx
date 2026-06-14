import { BaseTable } from '../../../../components/ui';
import { formatMoney } from '../../utils/shared/formatMoney';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function FinanceDetailDocumentLines({
  t,
  isLoading,
  receipt,
  sale,
}) {
  if (receipt) {
    return (
      <section className="finance-detail-modal__section">
        <h3 className="finance-detail-modal__section-title">
          {t('finance.debts.detailReceipt', { no: receipt.receiptNumber ?? '…' })}
        </h3>
        <p className="finance-detail-modal__sub">
          {receipt.supplierName || '—'}
          {receipt.storeName ? ` · ${receipt.storeName}` : ''}
          {' · '}
          {formatDateTime(receipt.createdAt)}
        </p>
        <div className="finance-detail-modal__lines-wrap">
          <BaseTable
            isLoading={isLoading}
            isEmpty={!receipt.lines?.length}
            emptyMessage={t('finance.debts.detailLinesEmpty')}
            colSpan={4}
            className="!border-0 !shadow-none !rounded-none"
          >
            <table className="finance-table">
              <thead>
                <tr>
                  <th>{t('finance.debts.colProduct')}</th>
                  <th>{t('finance.debts.colSku')}</th>
                  <th>{t('finance.debts.colQty')}</th>
                  <th>{t('finance.debts.colSum')}</th>
                </tr>
              </thead>
              <tbody>
                {(receipt.lines ?? []).map((line) => (
                  <tr key={line.id}>
                    <td>{line.productName}</td>
                    <td>{line.sku || '—'}</td>
                    <td>{line.quantity}</td>
                    <td>{formatMoney(line.lineCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BaseTable>
        </div>
      </section>
    );
  }

  if (sale) {
    return (
      <section className="finance-detail-modal__section">
        <h3 className="finance-detail-modal__section-title">
          {t('finance.debts.detailSale', { no: sale.receiptNumber ?? '…' })}
        </h3>
        <p className="finance-detail-modal__sub">
          {sale.customerName || '—'}
          {sale.storeName ? ` · ${sale.storeName}` : ''}
          {' · '}
          {formatDateTime(sale.createdAt)}
        </p>
        <div className="finance-detail-modal__lines-wrap">
          <BaseTable
            isLoading={isLoading}
            isEmpty={!sale.items?.length}
            emptyMessage={t('finance.debts.detailLinesEmpty')}
            colSpan={4}
            className="!border-0 !shadow-none !rounded-none"
          >
            <table className="finance-table">
              <thead>
                <tr>
                  <th>{t('finance.debts.colProduct')}</th>
                  <th>{t('finance.debts.colSku')}</th>
                  <th>{t('finance.debts.colQty')}</th>
                  <th>{t('finance.debts.colSum')}</th>
                </tr>
              </thead>
              <tbody>
                {(sale.items ?? []).map((line) => (
                  <tr key={line.id}>
                    <td>{line.productName}</td>
                    <td>{line.productSku || '—'}</td>
                    <td>{line.quantity}</td>
                    <td>{formatMoney(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </BaseTable>
        </div>
      </section>
    );
  }

  return null;
}
