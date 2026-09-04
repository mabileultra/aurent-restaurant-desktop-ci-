import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ReportProductNameCell from '../components/ReportProductNameCell';
import ReportTableCard from '../components/ReportTableCard';
import { PageSearchField } from '../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../utils/formatMoney';
import { useLowStockReportPage } from '../hooks/useLowStockReportPage';
import { useStockFlowPaths } from '../../stock/stockFlowPaths';

export default function LowStockReportPage() {
  const { t } = useTranslation();
  const r = useLowStockReportPage();
  const paths = useStockFlowPaths();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('stockReports.lowStockTitle')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('stockReports.lowStockSubtitle')}</p>
        <Link to={paths.stockDashboard} className="mt-2 inline-block text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← {t('stockReports.backDashboard')}
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <PageSearchField
          value={r.search}
          onChange={r.handleSearchChange}
          placeholder={t('stockModule.searchPh')}
          className="min-w-[12rem] flex-1"
        />
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
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80">
              <tr>
                <AdminTableNoIdHeaders />
                <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colStock')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colMin')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colDeficit')}</th>
                <th className="px-4 py-3 text-right">{t('stockReports.colStockValue')}</th>
              </tr>
            </thead>
            <tbody>
              {r.isPending && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('common.loading')}</td></tr>
              )}
              {r.isError && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-red-600">{r.error?.response?.data?.message ?? t('common.error')}</td></tr>
              )}
              {!r.isPending && !r.isError && r.rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">{t('common.noData')}</td></tr>
              )}
              {r.rows.map((row, index) => (
                <tr key={row.productId} className="border-b border-slate-100 dark:border-slate-800">
                  <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.productId} />
                  <ReportProductNameCell name={row.productName} sku={row.sku} barcode={row.barcode} />
                  <td className="px-4 py-3 text-right">{row.currentStock}</td>
                  <td className="px-4 py-3 text-right">{row.minStock}</td>
                  <td className="px-4 py-3 text-right text-red-600">{row.deficit}</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(row.stockValue)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
