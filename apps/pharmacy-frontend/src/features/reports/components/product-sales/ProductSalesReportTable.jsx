import { BarChart3 } from 'lucide-react';
import { EmptyState } from '../../../../components/ui';
import ReportTableCard from '../ReportTableCard';
import ReportProductNameCell from '../ReportProductNameCell';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../../utils/formatMoney';

export default function ProductSalesReportTable({
  t,
  rows,
  isPending,
  isError,
  error,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <ReportTableCard
      pagination={{
        page,
        pageSize,
        total,
        totalPages,
        onPageChange,
        onPageSizeChange,
      }}
    >
      <table className="ui-table">
        <thead>
          <tr>
            <AdminTableNoIdHeaders />
            <th className="ui-th">{t('stockReports.colProduct')}</th>
            <th className="ui-th">{t('stockReports.colCategory')}</th>
            <th className="ui-th text-right">{t('stockReports.colSold')}</th>
            <th className="ui-th text-right">{t('stockReports.colReturned')}</th>
            <th className="ui-th text-right">{t('stockReports.colNet')}</th>
            <th className="ui-th text-right">{t('stockReports.colRevenue')}</th>
            <th className="ui-th text-right">{t('stockReports.colMargin')}</th>
          </tr>
        </thead>
        <tbody>
          {isPending && (
            <tr>
              <td colSpan={9} className="ui-td py-8 text-center text-ink-muted">{t('common.loading')}</td>
            </tr>
          )}
          {isError && (
            <tr>
              <td colSpan={9} className="ui-td py-8 text-center text-danger-text">
                {error?.response?.data?.message ?? t('common.error')}
              </td>
            </tr>
          )}
          {!isPending && !isError && rows.length === 0 && (
            <tr>
              <td colSpan={9} className="p-0">
                <EmptyState icon={BarChart3} title={t('common.noData')} />
              </td>
            </tr>
          )}
          {rows.map((row, index) => (
            <tr key={row.productId} className="ui-tr">
              <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.productId} />
              <ReportProductNameCell name={row.productName} sku={row.sku} barcode={row.barcode} />
              <td className="ui-td text-ink-muted">{row.categoryName || '—'}</td>
              <td className="ui-td-nowrap text-right">{row.quantitySold}</td>
              <td className="ui-td-nowrap text-right">{row.quantityReturned}</td>
              <td className="ui-td-nowrap text-right font-semibold">{row.netQuantity}</td>
              <td className="ui-td-nowrap text-right">{fmtMoney(row.revenue)}</td>
              <td className="ui-td-nowrap text-right font-semibold text-success-text">{fmtMoney(row.margin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ReportTableCard>
  );
}
