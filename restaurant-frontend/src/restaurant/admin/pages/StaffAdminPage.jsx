import { Link } from 'react-router-dom';
import { BaseButton, BaseInput, BaseSelect } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import UserFormModal from '../../../features/tenant/components/users/UserFormModal';
import RstRowActions from '../../shared/components/RstRowActions';
import { useStaffAdminPage, RST_STAFF_ROLES } from '../hooks/useStaffAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/staff-admin.css';

export default function StaffAdminPage() {
  const p = useStaffAdminPage();
  const waiters = p.waitersForCommission ?? [];

  if (p.workspace.noAssignment) {
    return (
      <div className="rst-notice">
        {p.t('rst.floor.noStore')}
        {' '}
        <Link to="/rst/admin/stores">{p.t('rst.admin.storesTitle')}</Link>
      </div>
    );
  }

  return (
    <section className="rst-staff">
      <div className="rst-halls__toolbar">
        <div>
          <h1 className="rst-coming__title">{p.t('rst.admin.staffTitle')}</h1>
          <p className="rst-coming__text mb-0">{p.t('rst.admin.staffSubtitle')}</p>
        </div>
        <div className="rst-halls__actions">
          {p.canManage ? (
            <BaseButton type="button" onClick={p.openCreate} disabled={!p.workspace.storeId}>
              {p.t('rst.staff.add')}
            </BaseButton>
          ) : null}
        </div>
      </div>

      <div className="rst-staff__hint">
        {p.t('rst.staff.ecosystemHint')}
        {' '}
        <Link to="/rst/admin/stores">{p.t('rst.nav.stores')}</Link>
      </div>

      {!p.canManage ? (
        <div className="rst-staff__hint">{p.t('rst.staff.managerHint')}</div>
      ) : null}

      {!p.workspace.storeId ? (
        <div className="rst-notice">{p.t('rst.admin.selectStore')}</div>
      ) : (
        <>
          <div className="rst-staff__stats">
            <div className="rst-staff__stat"><strong>{p.stats.total}</strong><span>{p.t('rst.staff.statTotal')}</span></div>
            <div className="rst-staff__stat"><strong>{p.stats.waiters}</strong><span>{p.t('roles.WAITER')}</span></div>
            <div className="rst-staff__stat"><strong>{p.stats.cooks}</strong><span>{p.t('roles.COOK')}</span></div>
            <div className="rst-staff__stat"><strong>{p.stats.cashiers}</strong><span>{p.t('roles.CASHIER')}</span></div>
            <div className="rst-staff__stat"><strong>{p.stats.active}</strong><span>{p.t('rst.staff.statActive')}</span></div>
          </div>

          <div className="rst-staff__commission">
            <div className="rst-staff__commission-top">
              <div>
                <strong>{p.t('rst.staff.commissionTitle')}</strong>
                <p className="rst-staff__commission-hint mb-0">{p.t('rst.staff.commissionHint')}</p>
              </div>
              <div className="rst-staff__commission-controls">
                <label className="rst-admin-field">
                  <span className="rst-admin-field__label">{p.t('rst.staff.commissionDefault')}</span>
                  <BaseInput
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={p.draftDefault}
                    disabled={!p.canEditCommission || p.commissionBusy || p.commissionLoading}
                    onChange={(e) => p.setDefaultPercentDraft(e.target.value)}
                  />
                </label>
                {p.canEditCommission ? (
                  <div className="rst-staff__commission-actions">
                    <BaseButton type="button" size="sm" variant="ghost" disabled={p.commissionBusy} onClick={p.saveDefault}>
                      {p.t('rst.staff.commissionSaveDefault')}
                    </BaseButton>
                    <BaseButton type="button" size="sm" disabled={p.commissionBusy} onClick={p.applyAll}>
                      {p.t('rst.staff.commissionApplyAll')}
                    </BaseButton>
                  </div>
                ) : null}
              </div>
            </div>

            {waiters.length > 0 ? (
              <div className="rst-staff__waiter-rates">
                <div className="rst-staff__waiter-rates-head">{p.t('rst.staff.commissionPersonalTitle')}</div>
                <div className="rst-staff__waiter-rates-list">
                  {waiters.map((user) => {
                    const rate = p.waiterRate(user.id);
                    return (
                      <div key={user.id} className="rst-staff__waiter-rate">
                        <span className="rst-staff__waiter-name">{p.displayName(user)}</span>
                        <BaseInput
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={p.waiterDraft(user.id)}
                          disabled={!p.canEditCommission || p.commissionBusy}
                          onChange={(e) => p.setWaiterDraft(user.id, e.target.value)}
                        />
                        <span className="rst-staff__rate-meta">
                          {rate.custom
                            ? p.t('rst.staff.commissionCustom')
                            : p.t('rst.staff.commissionInherited')}
                        </span>
                        {p.canEditCommission ? (
                          <div className="rst-staff__rate-actions">
                            <BaseButton
                              type="button"
                              size="sm"
                              variant="ghost"
                              disabled={p.commissionBusy}
                              onClick={() => p.saveWaiterPercent(user.id)}
                            >
                              {p.t('common.save')}
                            </BaseButton>
                            {rate.custom ? (
                              <BaseButton
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={p.commissionBusy}
                                onClick={() => p.clearWaiterPercent(user.id)}
                              >
                                {p.t('rst.staff.commissionUseDefault')}
                              </BaseButton>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rst-admin-filters rst-staff__filters">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('common.search')}</span>
              <BaseInput
                value={p.search}
                onChange={(e) => p.setSearch(e.target.value)}
                placeholder={p.t('rst.staff.search')}
              />
            </label>
            <BaseSelect
              className="rst-admin-field"
              size="sm"
              searchable={false}
              label={p.t('rst.staff.role')}
              value={p.roleFilter}
              onChange={(e) => p.setRoleFilter(e.target.value)}
              options={[
                { value: '', label: p.t('rst.staff.allRoles') },
                ...RST_STAFF_ROLES.map((role) => ({
                  value: role,
                  label: p.t(`roles.${role}`, { defaultValue: role }),
                })),
              ]}
            />
          </div>

          {p.isError ? <div className="rst-notice">{p.t('rst.staff.loadFailed')}</div> : null}

          <div className="rst-data-card">
            <div className="rst-data-card__head">
              <strong>{p.t('rst.staff.listTitle')}</strong>
              <span>{p.total}</span>
            </div>
            <div className="rst-data-card__table-wrap">
              <table className="rst-data-table">
                <thead>
                  <tr>
                    <th className="rst-data-table__num">#</th>
                    <th>{p.t('rst.staff.name')}</th>
                    <th>{p.t('rst.staff.username')}</th>
                    <th>{p.t('rst.staff.role')}</th>
                    <th>{p.t('rst.staff.status')}</th>
                    <th className="rst-data-table__actions" aria-label={p.t('common.actions')} />
                  </tr>
                </thead>
                <tbody>
                  {p.isLoading ? (
                    <tr>
                      <td colSpan={6} className="rst-data-table__empty">{p.t('common.loading')}</td>
                    </tr>
                  ) : p.rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="rst-data-table__empty">{p.t('rst.staff.empty')}</td>
                    </tr>
                  ) : (
                    p.rows.map((user, index) => (
                      <tr key={user.id}>
                        <td className="rst-data-table__num">{p.page * p.pageSize + index + 1}</td>
                        <td className="rst-data-table__wrap">{p.displayName(user)}</td>
                        <td><code>{user.username || '—'}</code></td>
                        <td>
                          <span className={`rst-staff__badge rst-staff__badge--${user.role}`}>
                            {p.t(`roles.${user.role}`, { defaultValue: user.role })}
                          </span>
                        </td>
                        <td>
                          <span className={`rst-staff__status${user.active !== false ? ' is-on' : ' is-off'}`}>
                            {user.active !== false ? p.t('rst.staff.active') : p.t('rst.staff.inactive')}
                          </span>
                        </td>
                        <td className="rst-data-table__actions">
                          {p.canManage ? (
                            <RstRowActions
                              t={p.t}
                              items={[
                                {
                                  key: 'edit',
                                  label: p.t('common.edit'),
                                  onClick: () => p.openEdit(user),
                                },
                                {
                                  key: 'toggle',
                                  label: user.active !== false
                                    ? p.t('rst.staff.deactivate')
                                    : p.t('rst.staff.activate'),
                                  onClick: () => p.toggleMutation.mutate(user.id),
                                },
                              ]}
                            />
                          ) : null}
                        </td>
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

      <UserFormModal
        open={!!p.formMode}
        mode={p.formMode === 'edit' ? 'edit' : 'create'}
        editingUser={p.editingUser}
        onClose={p.closeForm}
        isPlatform={false}
        allowedRoles={RST_STAFF_ROLES}
        defaultStoreIds={p.workspace.storeId != null ? [p.workspace.storeId] : []}
      />
    </section>
  );
}
