import { BaseButton, BaseInput } from '../../../components/ui';
import TablePagination from '../../../components/shared/TablePagination';
import UserFormModal from '../../../features/tenant/components/users/UserFormModal';
import { useStaffAdminPage, RST_STAFF_ROLES } from '../hooks/useStaffAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/stations-admin.css';
import '../styles/staff-admin.css';

export default function StaffAdminPage() {
  const p = useStaffAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
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

      <div className="rst-staff__hint">{p.t('rst.staff.ecosystemHint')}</div>

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

          <div className="rst-admin-filters rst-staff__filters">
            <label className="rst-admin-field">
              <span className="rst-admin-field__label">{p.t('common.search')}</span>
              <BaseInput
                value={p.search}
                onChange={(e) => p.setSearch(e.target.value)}
                placeholder={p.t('rst.staff.search')}
              />
            </label>
            <div className="rst-staff__roles">
              <button
                type="button"
                className={`rst-staff__role${!p.roleFilter ? ' is-active' : ''}`}
                onClick={() => p.setRoleFilter('')}
              >
                {p.t('rst.staff.allRoles')}
              </button>
              {RST_STAFF_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`rst-staff__role${p.roleFilter === role ? ' is-active' : ''}`}
                  onClick={() => p.setRoleFilter(role)}
                >
                  {p.t(`roles.${role}`)}
                </button>
              ))}
            </div>
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
                    <th className="rst-data-table__actions">{p.t('common.actions')}</th>
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
                            <div className="rst-staff__actions">
                              <BaseButton type="button" size="sm" variant="ghost" onClick={() => p.openEdit(user)}>
                                {p.t('common.edit')}
                              </BaseButton>
                              <BaseButton
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={p.toggleMutation.isPending}
                                onClick={() => p.toggleMutation.mutate(user.id)}
                              >
                                {user.active !== false ? p.t('rst.staff.deactivate') : p.t('rst.staff.activate')}
                              </BaseButton>
                            </div>
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
