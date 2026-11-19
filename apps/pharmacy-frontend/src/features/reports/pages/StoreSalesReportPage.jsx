import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api';
import { EmptyState, PageHeader } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import { useStoreSalesReportPage } from '../hooks/useStoreSalesReportPage';

export default function StoreSalesReportPage() {
  const { t } = useTranslation();
  const r = useStoreSalesReportPage();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stockReports.salesByStoresTitle')}
        subtitle={t('stockReports.salesByStoresSubtitle')}
        actions={(
          <ReportExportButton
            fetchBlob={() => reportApi.exportSalesByStores(r.exportParams)}
            filenamePrefix="sales_by_stores"
            disabled={!r.rangeEnabled}
          />
        )}
      />
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
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
              <th className="ui-th">{t('stockReports.colStore')}</th>
              <th className="ui-th text-right">{t('stockReports.colReceipts')}</th>
              <th className="ui-th text-right">{t('stockReports.colNet')}</th>
              <th className="ui-th text-right">{t('stockReports.colRevenue')}</th>
              <th className="ui-th text-right">{t('stockReports.colMargin')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={7} className="ui-td py-8 text-center text-ink-muted">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState icon={Building2} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr key={row.storeId} className="ui-tr">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.storeId} />
                <td className="ui-td font-medium">{row.storeName}</td>
                <td className="ui-td-nowrap text-right">{row.receiptCount}</td>
                <td className="ui-td-nowrap text-right">{row.netQuantity}</td>
                <td className="ui-td-nowrap text-right font-semibold">{fmtMoney(row.revenue)}</td>
                <td className="ui-td-nowrap text-right font-semibold text-success-text">{fmtMoney(row.margin)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
