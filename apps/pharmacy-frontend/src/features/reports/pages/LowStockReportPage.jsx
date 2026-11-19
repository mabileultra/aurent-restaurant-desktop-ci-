import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ReportProductNameCell from '../components/ReportProductNameCell';
import ReportTableCard from '../components/ReportTableCard';
import { EmptyState, PageHeader, PageSearchField } from '../../../components/ui';
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
        <PageHeader title={t('stockReports.lowStockTitle')} subtitle={t('stockReports.lowStockSubtitle')} />
        <Link to={paths.stockDashboard} className="mt-2 inline-block text-sm font-medium text-primary-600 hover:underline">
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
        <table className="ui-table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('stockReports.colProduct')}</th>
              <th className="ui-th text-right">{t('stockReports.colStock')}</th>
              <th className="ui-th text-right">{t('stockReports.colMin')}</th>
              <th className="ui-th text-right">{t('stockReports.colDeficit')}</th>
              <th className="ui-th text-right">{t('stockReports.colStockValue')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && (
              <tr><td colSpan={7} className="ui-td py-8 text-center text-ink-muted">{t('common.loading')}</td></tr>
            )}
            {r.isError && (
              <tr><td colSpan={7} className="ui-td py-8 text-center text-danger-text">{r.error?.response?.data?.message ?? t('common.error')}</td></tr>
            )}
            {!r.isPending && !r.isError && r.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState icon={AlertTriangle} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr key={row.productId} className="ui-tr">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.productId} />
                <ReportProductNameCell name={row.productName} sku={row.sku} barcode={row.barcode} />
                <td className="ui-td-nowrap text-right">{row.stockQuantity}</td>
                <td className="ui-td-nowrap text-right text-ink-muted">{row.lowStockAlert}</td>
                <td className="ui-td-nowrap text-right">
                  <span className="ui-badge-danger">{row.deficit}</span>
                </td>
                <td className="ui-td-nowrap text-right font-semibold">{fmtMoney(row.stockValueEstimate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
