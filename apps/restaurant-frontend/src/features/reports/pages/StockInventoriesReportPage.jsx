import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { stockReportApi } from '../../../api';
import { BaseButton } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import ReportDateBar from '../components/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import ReportStoreSelect from '../components/ReportStoreSelect';
import StockInventoryCreateModal from '../../stock/components/StockInventoryCreateModal';
import { useStockInventoriesReportPage } from '../hooks/useStockInventoriesReportPage';
import '../styles/stock-inventories-report.css';

export default function StockInventoriesReportPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useStockInventoriesReportPage();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="rst-inv-report">
      <div className="rst-inv-report__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('stockReports.inventoriesTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('stockReports.inventoriesSubtitle')}</p>
          </div>
        )}
        <div className="rst-inv-report__actions">
          <ReportExportButton
            fetchBlob={() => stockReportApi.exportInventories(r.exportParams)}
            filenamePrefix="stock_inventories"
            disabled={!r.from || !r.to}
          />
          <BaseButton type="button" onClick={() => setCreateOpen(true)}>
            <Plus size={16} aria-hidden />
            {t('stockReports.newInventoryDoc')}
          </BaseButton>
        </div>
      </div>

      <div className="rst-inv-report__filters">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      </div>

      {r.isError ? (
        <div className="rst-notice">{t('stockReports.inventoriesLoadFailed', { defaultValue: t('common.error') })}</div>
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
        <table className="rst-inv-report__table">
          <thead>
            <tr>
              <th>{t('common.colNo')}</th>
              <th>{t('stockReports.colInventoryNo')}</th>
              <th>{t('stockReports.colDate')}</th>
              <th>{t('stockReports.colStore')}</th>
              <th className="is-num">{t('stockReports.colLines')}</th>
              <th className="is-num">{t('stockReports.colDiffSum')}</th>
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
                <td className="is-muted">{r.page * r.pageSize + index + 1}</td>
                <td className="is-strong">{row.inventoryNumber}</td>
                <td>{fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td>{row.storeName ?? '—'}</td>
                <td className="is-num">{row.totalLines}</td>
                <td className="is-num">{row.totalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>

      <StockInventoryCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => r.refetch?.()}
      />
    </div>
  );
}
