import { Link } from 'react-router-dom';
import { BaseButton, BaseInput } from '../../../components/ui';
import UserFormModal from '../../../features/tenant/components/users/UserFormModal';
import { useStaffAdminPage, RST_STAFF_ROLES } from '../hooks/useStaffAdminPage';
import '../../shared/styles/rst-blocks.css';
import '../styles/halls-admin.css';
import '../styles/tech-card.css';
import '../styles/staff-admin.css';

export default function StaffAdminPage() {
  const p = useStaffAdminPage();

  if (p.workspace.noAssignment) {
    return <div className="rst-notice">{p.t('rst.floor.noStore')}</div>;
  }

  return (
    <section>
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
          <Link to="/users/list">
            <BaseButton type="button" variant="ghost">{p.t('rst.staff.toUsers')}</BaseButton>
          </Link>
        </div>
      </div>

      {p.workspace.canPickStore ? (
        <label className="rst-shell__store d-block mb-3">
          <span className="d-block mb-1 small">{p.t('rst.admin.selectStore')}</span>
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

          <div className="rst-staff__toolbar">
            <BaseInput
              className="rst-staff__search"
              value={p.search}
              onChange={(e) => p.setSearch(e.target.value)}
              placeholder={p.t('rst.staff.search')}
            />
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

          <table className="rst-tech__table">
            <thead>
              <tr>
                <th>{p.t('rst.staff.name')}</th>
                <th>{p.t('rst.staff.username')}</th>
                <th>{p.t('rst.staff.role')}</th>
                <th>{p.t('rst.staff.status')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {p.isLoading ? (
                <tr><td colSpan={5}>{p.t('common.loading')}</td></tr>
              ) : p.staff.length === 0 ? (
                <tr><td colSpan={5}>{p.t('rst.staff.empty')}</td></tr>
              ) : p.staff.map((user) => (
                <tr key={user.id}>
                  <td>{p.displayName(user)}</td>
                  <td>{user.username || '—'}</td>
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
                  <td>
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
              ))}
            </tbody>
          </table>
        </>
      )}

      <UserFormModal
        open={!!p.formMode}
        mode={p.formMode === 'edit' ? 'edit' : 'create'}
        editingUser={p.editingUser}
        onClose={p.closeForm}
        isPlatform={false}
      />
    </section>
  );
}
