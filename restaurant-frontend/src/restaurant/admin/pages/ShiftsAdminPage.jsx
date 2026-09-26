import { BaseInput, BaseSelect } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import RstFilterResetButton from '../../shared/components/RstFilterResetButton';
import { useShiftsAdminPage } from '../hooks/useShiftsAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/staff-admin.css';

export default function ShiftsAdminPage() {
  const p = useShiftsAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-shifts">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.shiftsTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.shiftsSubtitle')}</p>
        </div>
      </div>

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-staff__stats">
            <div className="rst-staff__stat">
              <strong>{p.stats.total}</strong>
              <span>{p.t('rst.admin.shiftsStatTotal')}</span>
            </div>
            <div className="rst-staff__stat">
              <strong>{p.stats.open}</strong>
              <span>{p.t('rst.shift.openLabel')}</span>
            </div>
            <div className="rst-staff__stat">
              <strong>{p.stats.closed}</strong>
              <span>{p.t('rst.shift.closedLabel')}</span>
            </div>
          </div>

          <div className="rst-admin-filters">
            <BaseSelect
              className="rst-admin-field"
              size="sm"
              searchable={false}
              label={p.t('rst.admin.shiftStatus')}
              value={p.filters.status}
              onChange={(e) => p.setFilters({ ...p.filters, status: e.target.value })}
              options={[
                { value: 'all', label: p.t('rst.admin.filterAll') },
                { value: 'open', label: p.t('rst.shift.openLabel') },
                { value: 'closed', label: p.t('rst.shift.closedLabel') },
              ]}
            />
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.shiftsFrom')}</span>
              <BaseInput
                type="date"
                value={p.filters.fromDate}
                onChange={(e) => p.setFilters({ ...p.filters, fromDate: e.target.value })}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.admin.shiftsTo')}</span>
              <BaseInput
                type="date"
                value={p.filters.toDate}
                onChange={(e) => p.setFilters({ ...p.filters, toDate: e.target.value })}
              />
            </label>
            <RstFilterResetButton t={p.t} onClick={p.resetFilters} />
          </div>

          {p.isError ? <div className="rst-notice">{p.t('rst.admin.shiftsLoadFailed')}</div> : null}

          <div className="rst-data-card">
            <div className="rst-data-card__head">
              <strong>{p.t('rst.admin.shiftsList')}</strong>
              <span>{p.total}</span>
            </div>
            <div className="rst-data-card__table-wrap">
              <table className="rst-data-table">
                <thead>
                  <tr>
                    <th className="rst-data-table__num">#</th>
                    <th>{p.t('rst.admin.shiftStatus')}</th>
                    <th>{p.t('rst.admin.shiftOpened')}</th>
                    <th>{p.t('rst.admin.shiftClosed')}</th>
                    <th>{p.t('rst.shift.sales')}</th>
                    <th>{p.t('rst.shift.cash')}</th>
                    <th>{p.t('rst.shift.card')}</th>
                    <th>{p.t('rst.shift.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.isLoading ? (
                    <tr>
                      <td colSpan={8} className="rst-data-table__empty">{p.t('common.loading')}</td>
                    </tr>
                  ) : p.rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="rst-data-table__empty">{p.t('rst.admin.shiftsEmpty')}</td>
                    </tr>
                  ) : (
                    p.rows.map((shift, index) => (
                      <tr key={shift.id}>
                        <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                        <td>
                          <span className={`rst-badge ${shift.status === 'OPEN' ? 'rst-badge--ok' : 'rst-badge--off'}`}>
                            {shift.status === 'OPEN' ? p.t('rst.shift.openLabel') : p.t('rst.shift.closedLabel')}
                          </span>
                        </td>
                        <td>{shift.openedAt ? new Date(shift.openedAt).toLocaleString() : '—'}</td>
                        <td>{shift.closedAt ? new Date(shift.closedAt).toLocaleString() : '—'}</td>
                        <td>{shift.saleCount ?? 0}</td>
                        <td>{fmtMoneyCompact(shift.cashAmount)}</td>
                        <td>{fmtMoneyCompact(shift.cardAmount)}</td>
                        <td><strong>{fmtMoneyCompact(shift.totalAmount)}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {p.total > 0 ? (
              <TablePagination
                className="rst-data-card__pagination"
                page={p.page}
                pageSize={p.pageSize}
                total={p.total}
                totalPages={p.totalPages}
                pageSizeOptions={p.pageSizeOptions}
                onPageChange={p.setPage}
                onPageSizeChange={p.setPageSize}
              />
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
