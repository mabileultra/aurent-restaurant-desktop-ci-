import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { stockReportApi } from '../../../api';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.inventoriesTitle')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.inventoriesSubtitle')}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <ReportExportButton
            fetchBlob={() => stockReportApi.exportInventories(r.exportParams)}
            filenamePrefix="stock_inventories"
            disabled={!r.from || !r.to}
          />
          <Link to={paths.inventoriesNew} className="admin-btn-primary px-4 py-2 text-sm">
            <Plus size={16} />
            {t('stockReports.newInventoryDoc')}
          </Link>
        </div>
      </div>
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
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase dark:bg-slate-800/80">
            <tr>
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3">{t('stockReports.colInventoryNo')}</th>
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colStore')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colLines')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colDiffSum')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={7} className="p-6 text-center">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center">{t('common.noData')}</td></tr>}
            {r.rows.map((row, index) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.id} />
                <td className="px-4 py-3 font-medium">{row.inventoryNumber}</td>
                <td className="px-4 py-3">{fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td className="px-4 py-3">{row.storeName ?? '—'}</td>
                <td className="px-4 py-3 text-right">{row.totalLines}</td>
                <td className="px-4 py-3 text-right">{row.totalDifference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
