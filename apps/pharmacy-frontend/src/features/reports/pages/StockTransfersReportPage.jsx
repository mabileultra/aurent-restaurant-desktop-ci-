import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { ArrowRightLeft, Plus } from 'lucide-react';
import { BaseSelect, EmptyState, PageHeader } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import { useStockTransfersReportPage } from '../hooks/useStockTransfersReportPage';

export default function StockTransfersReportPage() {
  const { t } = useTranslation();
  const r = useStockTransfersReportPage();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('stockReports.transfersTitle')}
        subtitle={t('stockReports.transfersSubtitle')}
        actions={(
          <Link to="/stock/transfers/new" className="ui-btn ui-btn-primary">
            <Plus size={16} strokeWidth={1.75} />
            {t('stockReports.newTransferDoc')}
          </Link>
        )}
      />
      <div className="flex flex-wrap gap-3">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <BaseSelect
          value={r.fromStoreId}
          onChange={(e) => r.handleFromStoreChange(e.target.value)}
          placeholder={t('stockReports.fromStore')}
          options={[
            { value: '', label: t('stockReports.fromStore') },
            ...r.stores.map((s) => ({ value: String(s.id), label: s.name })),
          ]}
        />
        <BaseSelect
          value={r.toStoreId}
          onChange={(e) => r.handleToStoreChange(e.target.value)}
          placeholder={t('stockReports.toStore')}
          options={[
            { value: '', label: t('stockReports.toStore') },
            ...r.stores.map((s) => ({ value: String(s.id), label: s.name })),
          ]}
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
              <th className="ui-th">{t('stockReports.colTransferNo')}</th>
              <th className="ui-th">{t('stockReports.colDate')}</th>
              <th className="ui-th">{t('stockReports.colRoute')}</th>
              <th className="ui-th text-right">{t('stockReports.colQty')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={6} className="ui-td p-6 text-center text-ink-muted">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState icon={ArrowRightLeft} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr key={row.id} className="ui-tr">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.id} />
                <td className="ui-td-nowrap font-semibold">{row.transferNumber}</td>
                <td className="ui-td-nowrap text-ink-muted">{fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm')}</td>
                <td className="ui-td">{row.fromStoreName} → {row.toStoreName}</td>
                <td className="ui-td-nowrap text-right font-medium">{row.totalQuantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
