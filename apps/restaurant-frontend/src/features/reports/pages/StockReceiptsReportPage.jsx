import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format as fmtDate } from 'date-fns';
import { Plus } from 'lucide-react';
import { stockReportApi } from '../../../api';
import { BaseButton } from '../../../components/ui';
import ReportTableCard from '../components/ReportTableCard';
import ReportDateBar from '../components/ReportDateBar';
import ReportStoreSelect from '../components/ReportStoreSelect';
import ReportExportButton from '../components/ReportExportButton';
import ReportColumnPicker from '../components/ReportColumnPicker';
import { useStockReceiptsReportPage } from '../hooks/useStockReceiptsReportPage';
import { useReceiptReportColumns } from '../hooks/useReceiptReportColumns';
import { useStockFlowPaths } from '../../stock/stockFlowPaths';
import { fmtMoney } from '../../../utils/formatMoney';
import '../styles/stock-receipts-report.css';

function cellValue(colId, row, ctx) {
  switch (colId) {
    case 'no':
      return ctx.page * ctx.pageSize + ctx.index + 1;
    case 'receiptNo':
      return <span className="is-mono">{row.receiptNumber}</span>;
    case 'date':
      return row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—';
    case 'supplier':
      return row.supplierName || '—';
    case 'qty':
      return row.totalQuantity;
    case 'amount':
      return fmtMoney(row.totalCost);
    default:
      return '—';
  }
}

export default function StockReceiptsReportPage({ hideTitle = false } = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const paths = useStockFlowPaths();
  const r = useStockReceiptsReportPage();
  const cols = useReceiptReportColumns();

  return (
    <div className="rst-rec-report">
      <div className="rst-rec-report__toolbar">
        {hideTitle ? <div /> : (
          <div>
            <h1 className="rst-coming__title">{t('stockReports.receiptsTitle')}</h1>
            <p className="rst-coming__text mb-0">{t('stockReports.receiptsSubtitle')}</p>
          </div>
        )}
        <div className="rst-rec-report__actions">
          <ReportColumnPicker
            t={t}
            columnDefs={cols.columnDefs}
            visible={cols.visible}
            onToggle={cols.toggleColumn}
          />
          <ReportExportButton
            fetchBlob={() => stockReportApi.exportReceipts(r.exportParams)}
            filenamePrefix="stock_receipts"
            disabled={!r.from || !r.to}
          />
          <BaseButton type="button" onClick={() => navigate(paths.receiptNew)}>
            <Plus size={16} aria-hidden />
            {t('stockReports.newReceiptDoc')}
          </BaseButton>
        </div>
      </div>

      <div className="rst-rec-report__filters">
        <ReportDateBar from={r.from} to={r.to} onFrom={r.setFrom} onTo={r.setTo} />
        <ReportStoreSelect stores={r.stores} value={r.storeId} onChange={r.handleStoreChange} />
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
        <table className="rst-rec-report__table">
          <thead>
            <tr>
              {cols.visibleDefs.map((col) => (
                <th key={col.id} className={col.numeric ? 'is-num' : undefined}>
                  {t(col.labelKey)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.isPending ? (
              <tr>
                <td colSpan={cols.visibleDefs.length || 1} className="is-center">
                  {t('common.loading')}
                </td>
              </tr>
            ) : null}
            {!r.isPending && r.rows.length === 0 ? (
              <tr>
                <td colSpan={cols.visibleDefs.length || 1} className="is-center">
                  {t('common.noData')}
                </td>
              </tr>
            ) : null}
            {r.rows.map((row, index) => (
              <tr
                key={row.id}
                className="rst-rec-report__row is-clickable"
                onClick={() => navigate(paths.receipt(row.id))}
              >
                {cols.visibleDefs.map((col) => (
                  <td key={col.id} className={col.numeric ? 'is-num' : undefined}>
                    {cellValue(col.id, row, { page: r.page, pageSize: r.pageSize, index })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableCard>
    </div>
  );
}
