import { Info } from 'lucide-react';
import TablePagination from '../../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../../components/shared/AdminTableNoIdColumns';
import { formatSupplierAccount } from '../../../../utils/supplierAccountUz';
import SuppliersRowActionsCell from './SuppliersRowActionsCell';

const COL_COUNT = 8;

export default function SuppliersTable({
  t,
  loading,
  rows,
  fmtDate,
  showEmptyHint,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  manage,
  menuOpenId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  deletingId,
}) {
  return (
    <div className="admin-table-shell">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
              <AdminTableNoIdHeaders />
              <th className="px-4 py-3">{t('suppliersModule.colDate')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colName')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colTax')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colAccount')}</th>
              <th className="px-4 py-3">{t('suppliersModule.colPhone')}</th>
              {manage ? <th className="px-4 py-3 text-right">{t('common.actions')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={COL_COUNT} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row, index) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/80">
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(row.createdAt)}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{row.taxId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {row.accountNumber ? formatSupplierAccount(row.accountNumber) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.phone ?? '—'}</td>
                  {manage ? (
                    <SuppliersRowActionsCell
                      t={t}
                      row={row}
                      open={menuOpenId === row.id}
                      onOpenChange={(open) => onMenuOpenChange(open ? row.id : null)}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      deleting={deletingId === row.id}
                    />
                  ) : null}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {showEmptyHint && (
        <div className="flex items-start gap-3 border-t border-sky-100 bg-sky-50 px-4 py-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-100">
          <Info size={18} className="mt-0.5 shrink-0 text-sky-600 dark:text-sky-400" />
          <span>{t('suppliersModule.empty')}</span>
        </div>
      )}

      <TablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
