import { BaseTable } from '../../../../components/ui';
import { formatMoney } from '../../utils/shared/formatMoney';

export default function FinanceDailyRevenueTable({ t, rows, isLoading, isError }) {
  return (
    <BaseTable
      className="finance-panel"
      isLoading={isLoading}
      isEmpty={!isLoading && rows.length === 0}
      emptyMessage={t('finance.incomes.revenueEmpty')}
      colSpan={5}
    >
      <table className="finance-table">
        <thead>
          <tr>
            <th>{t('finance.common.date')}</th>
            <th>{t('finance.incomes.revenueTotal')}</th>
            <th>{t('finance.payment.cash')}</th>
            <th>{t('finance.payment.card')}</th>
            <th>{t('finance.incomes.zReportCount')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.date}-${row.storeId ?? 'all'}`}>
              <td>{row.date}</td>
              <td className="finance-amount--income">{formatMoney(row.totalAmount, 'UZS')}</td>
              <td>{formatMoney(row.cashAmount, 'UZS')}</td>
              <td>{formatMoney(row.cardAmount, 'UZS')}</td>
              <td>{row.zReportCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {isError ? <p className="finance-form__hint finance-form__hint--error">{t('common.loadError')}</p> : null}
    </BaseTable>
  );
}
