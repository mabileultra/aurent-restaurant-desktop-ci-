import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import ReportDateBar from '../components/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import StockWriteOffCreateModal from '../../stock/components/StockWriteOffCreateModal';
import { useWriteOffsReportPage } from '../hooks/useWriteOffsReportPage';
import '../styles/stock-write-offs-report.css';

export default function StockWriteOffsReportPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useWriteOffsReportPage();

  return (
    <div className="rst-wo-report">
      <div className="rst-wo-report__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('stockReports.writeOffsTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('stockReports.writeOffsSubtitle')}</p>
          </div>
        )}
        <BaseButton type="button" onClick={r.openCreate}>
          <Plus size={16} aria-hidden />
          {t('stockReports.newWriteOff')}
        </BaseButton>
      </div>

      <div className="rst-wo-report__filters">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
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
        <table className="rst-wo-report__table">
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('stockReports.colDate')}</th>
              <th>{t('stockReports.colProduct')}</th>
              <th className="is-num">{t('stockReports.colQty')}</th>
              <th>{t('stockReports.writeOffReason')}</th>
              <th>{t('stockReports.writeOffNotes')}</th>
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
                <td>{row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                <td className="is-strong">{row.productName || '—'}</td>
                <td className="is-num">{row.quantity}</td>
                <td>{t(`stockReports.reasons.${row.reason}`, { defaultValue: row.reason || '—' })}</td>
                <td>{row.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>

      <StockWriteOffCreateModal
        open={r.createOpen}
        onClose={r.closeCreate}
        onCreated={() => r.refetch()}
      />
    </div>
  );
}
