import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { reportApi } from '../../../api';
import { EmptyState, PageHeader } from '../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportExportButton from '../components/ReportExportButton';
import { useCashierPerformanceReportPage } from '../hooks/useCashierPerformanceReportPage';

export default function CashierPerformanceReportPage() {
  const { t } = useTranslation();
  const r = useCashierPerformanceReportPage();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stockReports.cashierPerfTitle')}
        subtitle={t('stockReports.cashierPerfSubtitle')}
        actions={(
          <ReportExportButton
            fetchBlob={() => reportApi.exportCashierPerf(r.from, r.to)}
            filenamePrefix="cashier_performance"
            disabled={!r.rangeEnabled}
          />
        )}
      />
      <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('stockReports.colCashier')}</th>
              <th className="ui-th text-right">{t('stockReports.colReceipts')}</th>
              <th className="ui-th text-right">{t('stockReports.colRevenue')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={5} className="ui-td py-8 text-center text-ink-muted">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState icon={Users} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr key={row.cashierId ?? row.id ?? index} className="ui-tr">
                <AdminTableNoIdCells
                  page={0}
                  pageSize={r.rows.length || 1}
                  index={index}
                  id={row.cashierId ?? row.id}
                />
                <td className="ui-td font-medium">{row.cashierName ?? row.name}</td>
                <td className="ui-td-nowrap text-right">{row.transactionCount ?? '—'}</td>
                <td className="ui-td-nowrap text-right font-semibold">{fmtMoney(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
