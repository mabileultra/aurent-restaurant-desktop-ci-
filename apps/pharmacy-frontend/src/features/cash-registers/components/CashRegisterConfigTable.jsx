import { Lock, Settings, Trash2 } from 'lucide-react';
import { EmptyState } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';
import { fmtConfigCount } from '../utils/cashRegisterDisplayUtils';

const COL_COUNT = 7;

export default function CashRegisterConfigTable({
  t,
  rows,
  loading,
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  onDelete,
}) {
  return (
    <div className="ui-table-wrap">
      <div className="overflow-x-auto">
        <table className="ui-table min-w-[720px]">
          <thead>
            <tr>
              <AdminTableNoIdHeaders />
              <th className="ui-th">{t('cashRegisters.configColName')}</th>
              <th className="ui-th">{t('cashRegisters.configColStores')}</th>
              <th className="ui-th">{t('cashRegisters.configColRegisters')}</th>
              <th className="ui-th">{t('cashRegisters.configColCategories')}</th>
              <th className="ui-th w-16" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={COL_COUNT} className="ui-td py-10 text-center text-ink-muted">
                  {t('common.loading')}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={COL_COUNT} className="p-0">
                  <EmptyState icon={Settings} title={t('cashRegisters.configEmpty')} />
                </td>
              </tr>
            ) : (
              rows.map((r, index) => (
                <tr key={r.id} className="ui-tr">
                  <AdminTableNoIdCells page={page} pageSize={pageSize} index={index} id={r.id} />
                  <td className="ui-td font-medium">
                    <span className="inline-flex items-center gap-2">
                      {r.lockedDefault && <Lock size={14} strokeWidth={1.75} className="shrink-0 text-ink-muted" aria-hidden />}
                      {r.name}
                    </span>
                    {r.lockedDefault && (
                      <div className="mt-0.5 text-xs font-normal text-ink-muted">{t('cashRegisters.configDefaultLocked')}</div>
                    )}
                  </td>
                  <td className="ui-td-nowrap">{fmtConfigCount(r.storeCount)}</td>
                  <td className="ui-td-nowrap">{fmtConfigCount(r.registerCount)}</td>
                  <td className="ui-td-nowrap">{fmtConfigCount(r.categoryCount)}</td>
                  <td className="ui-td text-right">
                    {!r.lockedDefault && (
                      <button
                        type="button"
                        onClick={() => onDelete(r)}
                        className="ui-btn-icon h-8 w-8 hover:bg-danger-soft hover:text-danger-text"
                        title={t('cashRegisters.configDelete')}
                      >
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
