import { format as fmtDate } from 'date-fns';
import ReportProductNameCell from '../ReportProductNameCell';
import ReportTableCard from '../ReportTableCard';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { fmtMoney } from '../../../../utils/formatMoney';

export default function WriteOffsReportTable({
  t,
  rows,
  isPending,
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
      <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/80">
            <tr>
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3">{t('stockReports.colDate')}</th>
              <th className="px-4 py-3">{t('stockReports.colProduct')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colQty')}</th>
              <th className="px-4 py-3">{t('stockReports.writeOffReason')}</th>
              <th className="px-4 py-3 text-right">{t('stockReports.colLoss')}</th>
              <th className="px-4 py-3">{t('stockReports.colUser')}</th>
            </tr>
          </thead>
          <tbody>
            {isPending && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!isPending && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                <td className="px-4 py-3 whitespace-nowrap">
                  {row.createdAt ? fmtDate(new Date(row.createdAt), 'dd.MM.yyyy HH:mm') : '—'}
                </td>
                <ReportProductNameCell name={row.productName} sku={row.sku} />
                <td className="px-4 py-3 text-right font-medium text-red-700 dark:text-red-400">
                  −{row.quantity}
                </td>
                <td className="px-4 py-3">
                  {t(`stockReports.reasons.${row.reason}`, { defaultValue: row.reason })}
                </td>
                <td className="px-4 py-3 text-right">{fmtMoney(row.lossAmount)}</td>
                <td className="px-4 py-3 text-slate-600">{row.createdByName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
    </ReportTableCard>
  );
}
