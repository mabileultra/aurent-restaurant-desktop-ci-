import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { FilePlus2, Plus } from 'lucide-react';
import { EmptyState, PageHeader } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import StockReceiptsActionsCell from '../components/StockReceiptsActionsCell';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../utils/formatMoney';
import ReportDateBar from '../../../components/shared/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import { useStockReceiptsReportPage } from '../hooks/useStockReceiptsReportPage';
import { useStockReceiptsActions } from '../hooks/useStockReceiptsActions';
import { useStockFlowPaths } from '../../stock/stockFlowPaths';

export default function StockReceiptsReportPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const r = useStockReceiptsReportPage();
  const actions = useStockReceiptsActions();
  const paths = useStockFlowPaths();
  const [menuOpenId, setMenuOpenId] = useState(null);
  const colSpan = 8;

  const createAction = (
    <Link to={paths.receiptsNew} className="ui-btn ui-btn-primary">
      <Plus size={16} strokeWidth={1.75} />
      {t('stockReports.newReceiptDoc')}
    </Link>
  );

  return (
    <div className="space-y-6">
      {hideTitle ? (
        <div className="flex flex-wrap items-start justify-end gap-3">{createAction}</div>
      ) : (
        <PageHeader
          title={t('stockReports.receiptsTitle')}
          subtitle={t('stockReports.receiptsSubtitle')}
          actions={createAction}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
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
              <th className="ui-th">{t('stockReports.colReceiptNo')}</th>
              <th className="ui-th">{t('stockReports.colDate')}</th>
              <th className="ui-th">{t('stockReports.colSupplier')}</th>
              <th className="ui-th text-right">{t('stockReports.colQty')}</th>
              <th className="ui-th text-right">{t('stockReports.colAmount')}</th>
              <th className="ui-th text-right">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {r.isPending && <tr><td colSpan={colSpan} className="ui-td p-6 text-center text-ink-muted">{t('common.loading')}</td></tr>}
            {!r.isPending && r.rows.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="p-0">
                  <EmptyState icon={FilePlus2} title={t('common.noData')} />
                </td>
              </tr>
            )}
            {r.rows.map((row, index) => (
              <tr key={row.id} className="ui-tr">
                <AdminTableNoIdCells page={r.page} pageSize={r.pageSize} index={index} id={row.id} />
                <td className="ui-td-nowrap font-semibold text-primary-700">{row.receiptNumber}</td>
                <td className="ui-td-nowrap text-ink-muted">{row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}</td>
                <td className="ui-td">{row.supplierName || '—'}</td>
                <td className="ui-td-nowrap text-right">{row.totalQuantity}</td>
                <td className="ui-td-nowrap text-right font-semibold">{fmtMoney(row.totalCost)}</td>
                <StockReceiptsActionsCell
                  t={t}
                  editTo={paths.receiptEdit(row.id)}
                  open={menuOpenId === row.id}
                  onOpenChange={(open) => setMenuOpenId(open ? row.id : null)}
                  deleting={actions.deletingId === row.id}
                  onDelete={() => actions.confirmDelete(row)}
                />
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
