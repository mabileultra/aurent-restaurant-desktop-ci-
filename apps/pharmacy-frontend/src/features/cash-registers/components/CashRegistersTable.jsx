import { Monitor, Play, Pause } from 'lucide-react';
import { EmptyState } from '../../../components/ui';
import { AdminTableNoIdCells, AdminTableNoIdHeaders } from '../../../components/shared/AdminTableNoIdColumns';

const COL_COUNT = 8;

export default function CashRegistersTable({
  t,
  rows,
  loading,
  togglingId,
  onRowClick,
  onToggleStatus,
}) {
  return (
    <div className="admin-data-table-wrap overflow-x-auto">
      <table className="ui-table admin-data-table admin-data-table--wide">
        <thead>
          <tr>
            <AdminTableNoIdHeaders />
            <th className="ui-th">{t('cashRegisters.colStore')}</th>
            <th className="ui-th">{t('cashRegisters.colRegisterNo')}</th>
            <th className="ui-th">{t('cashRegisters.colModel')}</th>
            <th className="ui-th">{t('cashRegisters.colSerial')}</th>
            <th className="ui-th">{t('cashRegisters.colFiscal')}</th>
            <th className="ui-th w-28 text-center">{t('cashRegisters.colStatus')}</th>
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
                <EmptyState icon={Monitor} title={t('cashRegisters.empty')} />
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id}
                className="ui-tr cursor-pointer"
                onClick={() => onRowClick(row.id)}
              >
                <AdminTableNoIdCells page={0} pageSize={rows.length || 1} index={index} id={row.id} />
                <td className="ui-td font-medium">{row.storeName}</td>
                <td className="ui-td-nowrap">{row.registerNumber}</td>
                <td className="ui-td text-ink-muted">{row.equipmentModel ?? '—'}</td>
                <td className="ui-td-nowrap text-xs text-ink-muted">
                  {row.equipmentSerial ?? '—'}
                </td>
                <td className="ui-td-nowrap text-xs text-ink-muted">
                  {row.fiscalCardId ?? '—'}
                </td>
                <td className="ui-td text-center">
                  {row.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      disabled={togglingId === row.id}
                      title={t('cashRegisters.statusToggleActive')}
                      onClick={(e) => onToggleStatus(e, row)}
                      className="ui-badge-success cursor-pointer disabled:opacity-50"
                    >
                      <Play size={11} className="shrink-0" strokeWidth={2.25} aria-hidden />
                      {t('cashRegisters.statusActive')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={togglingId === row.id}
                      title={t('cashRegisters.statusToggleInactive')}
                      onClick={(e) => onToggleStatus(e, row)}
                      className="ui-badge-neutral cursor-pointer hover:border-line-strong disabled:opacity-50"
                    >
                      <Pause size={11} className="shrink-0" aria-hidden />
                      {t('cashRegisters.statusInactive')}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
