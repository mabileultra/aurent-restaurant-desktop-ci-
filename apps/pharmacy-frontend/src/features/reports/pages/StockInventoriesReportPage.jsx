import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { ClipboardList, Plus } from 'lucide-react';
import { EmptyState, PageHeader } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { useStockInventoriesReportPage } from '../hooks/useStockInventoriesReportPage';
import { useStockFlowPaths } from '../../stock/stockFlowPaths';

export default function StockInventoriesReportPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useStockInventoriesReportPage();
  const paths = useStockFlowPaths();

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <ReportExportButton
        fetchBlob={r.fetchExportBlob}
        filenamePrefix="stock_inventories"
        disabled={!r.from || !r.to}
      />
      <Link to={paths.inventoriesNew} className="ui-btn ui-btn-primary">
        <Plus size={16} strokeWidth={1.75} />
        {t('stockReports.newInventoryDoc')}
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {hideTitle ? (
        <div className="flex flex-wrap items-start justify-end gap-3">{actions}</div>
      ) : (
        <PageHeader
          title={t('stockReports.inventoriesTitle')}
          subtitle={t('stockReports.inventoriesSubtitle')}
          actions={actions}
        />
      )}
      <div className="flex flex-wrap gap-3">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
      </div>
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
        <table className="ui-table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('stockReports.colInventoryNo')}</th>
              <th className="ui-th">{t('stockReports.colDate')}</th>
              <th className="ui-th">{t('stockReports.colStore')}</th>
              <th className="ui-th text-right">{t('stockReports.colLines')}</th>
              <th className="ui-th text-right">{t('stockReports.colDiffSum')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={7} className="ui-td p-6 text-center text-ink-muted">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState icon={ClipboardList} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr key={row.id} className="ui-tr">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.id} />
                <td className="ui-td-nowrap font-semibold">{row.inventoryNumber}</td>
                <td className="ui-td-nowrap text-ink-muted">{fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td className="ui-td">{row.storeName ?? '—'}</td>
                <td className="ui-td-nowrap text-right">{row.totalLines}</td>
                <td className="ui-td-nowrap text-right font-semibold">{row.totalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
