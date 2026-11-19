import { Truck } from 'lucide-react';
import { EmptyState } from '../../../../components/ui';
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
    <div className="ui-table-wrap">
      <div className="overflow-x-auto">
        <table className="ui-table">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('suppliersModule.colDate')}</th>
              <th className="ui-th">{t('suppliersModule.colName')}</th>
              <th className="ui-th">{t('suppliersModule.colTax')}</th>
              <th className="ui-th">{t('suppliersModule.colAccount')}</th>
              <th className="ui-th">{t('suppliersModule.colPhone')}</th>
              {manage ? <th className="ui-th text-right">{t('common.actions')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={COL_COUNT} className="ui-td py-8 text-center text-ink-muted">
                  {t('common.loading')}
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row, index) => (
                <tr key={row.id} className="ui-tr">
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={row.id} />
                  <td className="ui-td-nowrap text-ink-muted">{fmtDate(row.createdAt)}</td>
                  <td className="ui-td font-medium">{row.name}</td>
                  <td className="ui-td-nowrap text-ink-muted">{row.taxId}</td>
                  <td className="ui-td-nowrap text-ink-muted">
                    {row.accountNumber ? formatSupplierAccount(row.accountNumber) : '—'}
                  </td>
                  <td className="ui-td-nowrap text-ink-muted">{row.phone ?? '—'}</td>
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
        <div className="border-t border-line">
          <EmptyState icon={Truck} title={t('suppliersModule.empty')} />
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
