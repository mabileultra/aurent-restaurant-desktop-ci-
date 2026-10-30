import { useTranslation } from 'react-i18next';
import { BaseInput, BaseSelect } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import { AUDIT_TYPE_FILTERS, useAuditAdminPage } from '../hooks/useAuditAdminPage';
import AdminWorkspaceGate from '../components/AdminWorkspaceGate';
import RstFilterResetButton from '../../shared/components/RstFilterResetButton';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/analytics-admin.css';

export default function AuditAdminPage() {
  const p = useAuditAdminPage();
  const { i18n } = useTranslation();
  const locale = i18n.language || 'ru';

  return (
    <AdminWorkspaceGate
      t={p.t}
      workspace={p.workspace}
      isLoading={p.isLoading && !p.rows.length}
      isError={p.isError}
      onRetry={p.refetch}
    >
      <section className="rst-audit">
        <div className="rst-halls__toolbar">
          <div>
            <h1 className="rst-coming__title">{p.t('rst.admin.auditTitle')}</h1>
            <p className="rst-coming__text mb-0">{p.t('rst.admin.auditSubtitle')}</p>
          </div>
        </div>

        <div className="rst-admin-filters">
          <label className="rst-admin-field">
            <span className="rst-admin-field__label">{p.t('common.search')}</span>
            <BaseInput
              value={p.filters.search}
              onChange={(e) => p.setFilters({ ...p.filters, search: e.target.value })}
              placeholder={p.t('rst.audit.searchPh')}
            />
          </label>
          <BaseSelect
            label={p.t('rst.audit.type')}
            value={p.filters.type}
            onChange={(e) => p.setFilters({ ...p.filters, type: e.target.value })}
            options={AUDIT_TYPE_FILTERS.map((type) => ({
              value: type,
              label: type === 'all'
                ? p.t('rst.admin.filterAll')
                : p.t(`rst.audit.type_${type}`, { defaultValue: type }),
            }))}
          />
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
          <RstFilterResetButton t={p.t} onClick={p.refetch}>
            {p.t('common.refresh')}
          </RstFilterResetButton>
          <RstFilterResetButton t={p.t} onClick={p.resetFilters} />
        </div>

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
      </section>
    </AdminWorkspaceGate>
  );
}
