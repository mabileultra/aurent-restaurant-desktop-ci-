import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { PageSearchField } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import ReportDateBar from '../components/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import ReportFilterSelect from '../components/ReportFilterSelect';
import { useStockMovementsPage } from '../hooks/useStockMovementsPage';
import '../styles/stock-movements-report.css';

export default function StockMovementsPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useStockMovementsPage();

  return (
    <div className="rst-mv-report">
      <div className="rst-mv-report__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('stockReports.movementsTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('stockReports.movementsSubtitle')}</p>
          </div>
        )}
      </div>

      <div className="rst-mv-report__filters">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <PageSearchField
          value={r.search}
          onChange={r.handleSearchChange}
          placeholder={t('common.search')}
        />
        <ReportFilterSelect
          label={t('stockReports.colType')}
          value={r.movementType}
          onChange={r.handleMovementTypeChange}
          options={r.movementTypes.map((tp) => ({
            value: tp,
            label: t(`stockReports.movementTypes.${tp}`, { defaultValue: tp }),
          }))}
        />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      </div>

      {r.isError ? (
        <div className="rst-notice">{t('stockReports.loadFailed', { defaultValue: t('common.error') })}</div>
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
        <table className="rst-mv-report__table">
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('stockReports.colDate')}</th>
              <th>{t('stockReports.colType')}</th>
              <th>{t('stockReports.colProduct')}</th>
              <th className="is-num">{t('stockReports.colQty')}</th>
              <th>{t('stockReports.colDoc')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending ? (
              <tr><td colSpan={6} className="is-center">{t('common.loading')}</td></tr>
            ) : null}
            {!r.isPending && r.rows.length === 0 ? (
              <tr><td colSpan={6} className="is-center">{t('common.noData')}</td></tr>
            ) : null}
            {r.rows.map((row, index) => (
              <tr key={row.id}>
                <td>{r.page * r.pageSize + index + 1}</td>
                <td>{row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yy HH:mm') : '—'}</td>
                <td>
                  <span className="rst-mv-report__type">
                    {t(`stockReports.movementTypes.${row.movementType}`, { defaultValue: row.movementType })}
                  </span>
                </td>
                <td className="is-strong">{row.productName || '—'}</td>
                <td className={`is-num ${row.quantity >= 0 ? 'is-plus' : 'is-minus'}`}>
                  {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
                </td>
                <td className="is-mono">{row.receiptNumber || row.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
