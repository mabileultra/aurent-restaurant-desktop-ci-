import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { AUDIT_TYPE_FILTERS, useAuditAdminPage } from '../hooks/useAuditAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/analytics-admin.css';

export default function AuditAdminPage() {
  const p = useAuditAdminPage();
  const locale = p.t('common.locale', { defaultValue: 'ru-RU' });

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section className="rst-audit">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.auditTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.auditSubtitle')}</p>
        </div>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-admin-field rst-admin-field--full mb-3">
          <span className="rst-admin-field__label">{p.t('rst.admin.selectStore')}</span>
          <select
            className="form-select"
            value={p.workspace.pickedStoreId}
            onChange={(e) => p.workspace.setPickedStoreId(e.target.value)}
          >
            <option value="">{p.t('rst.admin.selectStore')}</option>
            {p.workspace.restaurantStores.map((store) => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </label>
      ) : null}

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-admin-filters">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('common.search')}</span>
              <BaseInput
                value={p.filters.search}
                onChange={(e) => p.setFilters({ ...p.filters, search: e.target.value })}
                placeholder={p.t('rst.audit.searchPh')}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.audit.type')}</span>
              <select
                className="form-select"
                value={p.filters.type}
                onChange={(e) => p.setFilters({ ...p.filters, type: e.target.value })}
              >
                {AUDIT_TYPE_FILTERS.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all'
                      ? p.t('rst.admin.filterAll')
                      : p.t(`rst.audit.type_${type}`, { defaultValue: type })}
                  </option>
                ))}
              </select>
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.reports.from')}</span>
              <BaseInput
                type="date"
                value={p.filters.fromDate}
                onChange={(e) => p.setFilters({ ...p.filters, fromDate: e.target.value })}
              />
            </label>
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('rst.reports.to')}</span>
              <BaseInput
                type="date"
                value={p.filters.toDate}
                onChange={(e) => p.setFilters({ ...p.filters, toDate: e.target.value })}
              />
            </label>
            <BaseButton type="button" variant="ghost" onClick={p.refetch}>
              {p.t('common.refresh')}
            </BaseButton>
            <BaseButton type="button" variant="ghost" className="rst-admin-filters__reset" onClick={p.resetFilters}>
              {p.t('rst.admin.filterReset')}
            </BaseButton>
          </div>

          {p.isError ? <div className="rst-notice">{p.t('rst.admin.auditLoadFailed')}</div> : null}

          <div className="rst-data-card">
            <div className="rst-data-card__head">
              <strong>{p.t('rst.audit.listTitle')}</strong>
              <span>{p.total}</span>
            </div>
            <div className="rst-data-card__table-wrap">
              <table className="rst-data-table">
                <thead>
                  <tr>
                    <th className="rst-data-table__num">#</th>
                    <th>{p.t('rst.audit.colTime')}</th>
                    <th>{p.t('rst.audit.type')}</th>
                    <th>{p.t('rst.audit.colDetail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.isLoading ? (
                    <tr>
                      <td colSpan={4} className="rst-data-table__empty">{p.t('common.loading')}</td>
                    </tr>
                  ) : p.rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="rst-data-table__empty">{p.t('rst.audit.empty')}</td>
                    </tr>
                  ) : (
                    p.rows.map((event, index) => (
                      <tr key={`${event.type}-${event.entityId}-${event.at}-${index}`}>
                        <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                        <td>{event.at ? new Date(event.at).toLocaleString(locale) : '—'}</td>
                        <td>
                          <span className={`rst-audit__badge rst-audit__badge--${event.type}`}>
                            {p.t(`rst.audit.type_${event.type}`, { defaultValue: event.type })}
                          </span>
                        </td>
                        <td className="rst-data-table__wrap">{p.formatActivity(event)}</td>
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
