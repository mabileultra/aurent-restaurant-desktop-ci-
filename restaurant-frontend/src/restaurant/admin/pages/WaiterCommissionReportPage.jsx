import { Fragment } from 'react';
import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import WaiterCommissionOrdersTable from '../components/commission/WaiterCommissionOrdersTable';
import { useWaiterCommissionReportPage } from '../hooks/useWaiterCommissionReportPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/staff-admin.css';

export default function WaiterCommissionReportPage() {
  const p = useWaiterCommissionReportPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-commission-report">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.reportsCommissionCard')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.reportsCommissionHint')}</p>
        </div>
      </div>

      <div className="rst-admin-filters">
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.reports.from')}</span>
          <BaseInput
            type="date"
            value={p.fromDate}
            max={p.toDate}
            onChange={(e) => p.onFromDate(e.target.value)}
          />
        </label>
        <label className="rst-admin-field">
          <span className="rst-admin-field__label">{p.t('rst.reports.to')}</span>
          <BaseInput
            type="date"
            value={p.toDate}
            min={p.fromDate}
            onChange={(e) => p.onToDate(e.target.value)}
          />
        </label>
      </div>

      {p.reportQuery.isError ? (
        <div className="rst-notice">{p.t('rst.admin.reportsLoadFailed')}</div>
      ) : null}

      <div className="rst-staff__stats">
        <div className="rst-staff__stat">
          <strong>{p.report?.orderCount ?? 0}</strong>
          <span>{p.t('rst.commission.orders')}</span>
        </div>
        <div className="rst-staff__stat">
          <strong>{fmtMoneyCompact(p.report?.salesTotal ?? 0)}</strong>
          <span>{p.t('rst.commission.sales')}</span>
        </div>
        <div className="rst-staff__stat">
          <strong>{fmtMoneyCompact(p.report?.commissionTotal ?? 0)}</strong>
          <span>{p.t('rst.commission.total')}</span>
        </div>
      </div>

      <div className="rst-data-card">
        <div className="rst-data-card__head">
          <strong>{p.t('rst.commission.byWaiter')}</strong>
          <span>{p.total}</span>
        </div>
        <div className="rst-data-card__table-wrap">
          <table className="rst-data-table">
            <thead>
              <tr>
                <th>{p.t('rst.commission.waiter')}</th>
                <th>{p.t('rst.commission.orders')}</th>
                <th>{p.t('rst.commission.sales')}</th>
                <th>{p.t('rst.commission.total')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.reportQuery.isLoading ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{p.t('common.loading')}</td>
                </tr>
              ) : p.rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="rst-data-table__empty">{p.t('rst.commission.empty')}</td>
                </tr>
              ) : (
                p.rows.map((row) => {
                  const id = String(row.waiterUserId);
                  const open = p.expanded === id;
                  return (
                    <Fragment key={id}>
                      <tr>
                        <td className="rst-data-table__wrap">{p.resolveWaiterName(row)}</td>
                        <td>{row.orderCount}</td>
                        <td>{fmtMoneyCompact(row.salesTotal)}</td>
                        <td><strong>{fmtMoneyCompact(row.commissionTotal)}</strong></td>
                        <td>
                          <BaseButton
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => p.setExpanded((prev) => (prev === id ? null : id))}
                          >
                            {open ? p.t('rst.commission.hideOrders') : p.t('rst.commission.showOrders')}
                          </BaseButton>
                        </td>
                      </tr>
                      {open ? (
                        <tr>
                          <td colSpan={5} className="rst-data-table__nested">
                            <WaiterCommissionOrdersTable
                              storeId={p.workspace.storeId}
                              waiterUserId={id}
                              params={p.params}
                              t={p.t}
                            />
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
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
    </section>
  );
}
