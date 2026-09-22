import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import ReportDateBar from '../components/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import StockExpenseCreateModal from '../../stock/components/StockExpenseCreateModal';
import { useStockExpensesReportPage } from '../hooks/useStockExpensesReportPage';
import '../styles/stock-write-offs-report.css';

export default function StockExpensesReportPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useStockExpensesReportPage();

  return (
    <div className="rst-wo-report">
      <div className="rst-wo-report__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('rst.stock.expensesTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('rst.stock.expensesHint')}</p>
          </div>
        )}
        <BaseButton type="button" onClick={r.openCreate}>
          <Plus size={16} aria-hidden />
          {t('rst.stock.newExpense')}
        </BaseButton>
      </div>

      <div className="rst-wo-report__filters">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      </div>

      {r.isError ? (
        <div className="rst-notice">{t('rst.stock.expensesLoadFailed', { defaultValue: t('common.error') })}</div>
      ) : null}

      <ReportTableCard
        pagination={{
          page: r.page,
          pageSize: r.pageSize,
          total: r.total,
          totalPages: r.totalPages,
          onPageChange: r.setPage,
          onPageSizeChange: r.setPageSize,
        }}
      >
        <table className="rst-wo-report__table">
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('rst.stock.colExpenseNo')}</th>
              <th>{t('stockReports.colDate')}</th>
              <th>{t('stockReports.colStore')}</th>
              <th>{t('rst.stock.expenseReason')}</th>
              <th className="is-num">{t('stockReports.colQty')}</th>
              <th>{t('rst.stock.expenseRecipient')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending ? (
              <tr><td colSpan={7} className="is-center">{t('common.loading')}</td></tr>
            ) : null}
            {!r.isPending && r.rows.length === 0 ? (
              <tr><td colSpan={7} className="is-center">{t('common.noData')}</td></tr>
            ) : null}
            {r.rows.map((row, index) => (
              <tr key={row.id}>
                <td>{r.page * r.pageSize + index + 1}</td>
                <td className="is-mono">{row.expenseNumber}</td>
                <td>{row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                <td>{row.storeName || '—'}</td>
                <td>{t(`rst.stock.expenseReasons.${row.reason}`, { defaultValue: row.reason || '—' })}</td>
                <td className="is-num">{row.totalQuantity}</td>
                <td>{row.recipient || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>

      <StockExpenseCreateModal
        open={r.createOpen}
        onClose={r.closeCreate}
        onCreated={() => r.refetch()}
      />
    </div>
  );
}
