import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { BaseButton } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import ReportDateBar from '../components/ReportDateBar';
import ReportFilterSelect from '../components/ReportFilterSelect';
import StockTransferCreateModal from '../../stock/components/StockTransferCreateModal';
import { useStockTransfersReportPage } from '../hooks/useStockTransfersReportPage';
import '../styles/stock-transfers-report.css';

export default function StockTransfersReportPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useStockTransfersReportPage();

  const storeOptions = r.stores.map((s) => ({ value: String(s.id), label: s.name }));

  return (
    <div className="rst-tr-report">
      <div className="rst-tr-report__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('stockReports.transfersTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('stockReports.transfersSubtitle')}</p>
          </div>
        )}
        <BaseButton type="button" onClick={r.openCreate}>
          <Plus size={16} aria-hidden />
          {t('stockReports.newTransferDoc')}
        </BaseButton>
      </div>

      <div className="rst-tr-report__filters">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <ReportFilterSelect
          label={t('stockReports.fromStore')}
          value={r.fromStoreId}
          onChange={r.handleFromStoreChange}
          emptyLabel={t('stockReports.allStores')}
          options={storeOptions}
        />
        <ReportFilterSelect
          label={t('stockReports.toStore')}
          value={r.toStoreId}
          onChange={r.handleToStoreChange}
          emptyLabel={t('stockReports.allStores')}
          options={storeOptions}
        />
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
        <table className="rst-tr-report__table">
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('stockReports.colTransferNo')}</th>
              <th>{t('stockReports.colDate')}</th>
              <th>{t('stockReports.colRoute')}</th>
              <th className="is-num">{t('stockReports.colQty')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending ? (
              <tr><td colSpan={5} className="is-center">{t('common.loading')}</td></tr>
            ) : null}
            {!r.isPending && r.rows.length === 0 ? (
              <tr><td colSpan={5} className="is-center">{t('common.noData')}</td></tr>
            ) : null}
            {r.rows.map((row, index) => (
              <tr key={row.id}>
                <td>{r.page * r.pageSize + index + 1}</td>
                <td className="is-mono">{row.transferNumber}</td>
                <td>{row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                <td>{row.fromStoreName} → {row.toStoreName}</td>
                <td className="is-num">{row.totalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>

      <StockTransferCreateModal
        open={r.createOpen}
        onClose={r.closeCreate}
        onCreated={() => r.refetch()}
      />
    </div>
  );
}
