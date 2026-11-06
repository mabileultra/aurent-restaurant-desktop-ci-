import { Link } from 'react-router-dom';
import { BaseButton } from '../../../components/ui';
import { getMainAppUrl } from '../../../config/mainAppUrl';
import { useAuthStore } from '../../../store/authStore';
import { isDesktopPrinter } from '../../pos/utils/desktopPrinters';
import './restaurant-workspace-empty.css';

/**
 * Empty / pick state when POS or kitchen has no restaurant branch yet.
 * On hall desktop stay local — do not send cashiers to the cloud main app.
 */
export default function RestaurantWorkspaceEmpty({
  t,
  workspace,
  zoomStyle,
  onLogout,
}) {
  const role = useAuthStore((s) => s.user?.role);
  const canManageStores = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const canManageStaff = canManageStores || role === 'MANAGER';
  const desktop = isDesktopPrinter();
  const mainApp = getMainAppUrl();
  const storesUrl = desktop ? '/rst/admin/stores' : `${mainApp}/stores`;
  const usersUrl = desktop ? '/rst/admin/staff' : `${mainApp}/users`;

  let title = t('rst.floor.noStore');
  let hint = t('rst.floor.noStoreHint');
  let actions = canManageStores ? (
    <Link className="rst-workspace-empty__link" to="/rst/admin/stores">
      {t('rst.admin.storesTitle')}
    </Link>
  ) : desktop ? (
    <p className="rst-workspace-empty__hint mb-0">
      {t('rst.floor.askAdminOffline', {
        defaultValue: 'Обратитесь к администратору — точка настраивается на этом ПК.',
      })}
    </p>
  ) : (
    <a className="rst-workspace-empty__link" href={storesUrl} target="_blank" rel="noreferrer">
      {t('rst.floor.openStoresOnMain')}
    </a>
  );

  if (workspace.multipleAssignment && workspace.restaurantStores?.length > 1) {
    title = t('rst.floor.pickStoreTitle');
    hint = t('rst.floor.pickStoreHint');
    actions = (
      <select
        className="rst-workspace-empty__select"
        value={workspace.pickedStoreId || ''}
        onChange={(e) => workspace.setPickedStoreId(e.target.value)}
        aria-label={t('rst.floor.pickStoreTitle')}
      >
        <option value="">{t('rst.floor.pickStorePlaceholder')}</option>
        {workspace.restaurantStores.map((store) => (
          <option key={store.id} value={String(store.id)}>
            {store.name || `#${store.id}`}
          </option>
        ))}
      </select>
    );
  } else if (workspace.noCompanyRestaurants) {
    title = t('rst.floor.noRestaurantStoresTitle');
    hint = t('rst.floor.noRestaurantStoresHint');
    actions = canManageStores ? (
      <Link className="rst-workspace-empty__link" to="/rst/admin/stores">
        {t('rst.admin.addRestaurant')}
      </Link>
    ) : actions;
  } else if (workspace.staffStoresWrongType) {
    title = t('rst.floor.wrongStoreTypeTitle');
    hint = t('rst.floor.wrongStoreTypeHint');
  } else if (workspace.noStaffStores) {
    title = t('rst.floor.noStaffStoreTitle');
    hint = t('rst.floor.noStaffStoreHint');
    actions = canManageStaff && desktop ? (
      <Link className="rst-workspace-empty__link" to="/rst/admin/staff">
        {t('rst.nav.staff')}
      </Link>
    ) : desktop ? (
      <p className="rst-workspace-empty__hint mb-0">
        {t('rst.floor.askAdminOffline', {
          defaultValue: 'Обратитесь к администратору — точка настраивается на этом ПК.',
        })}
      </p>
    ) : (
      <a className="rst-workspace-empty__link" href={usersUrl} target="_blank" rel="noreferrer">
        {t('rst.floor.openUsersOnMain')}
      </a>
    );
  }

  return (
    <div className="rst-app rst-pos" style={zoomStyle}>
      <div className="rst-workspace-empty">
        <h1 className="rst-workspace-empty__title">{title}</h1>
        <p className="rst-workspace-empty__hint">{hint}</p>
        <div className="rst-workspace-empty__actions">{actions}</div>
        {typeof onLogout === 'function' ? (
          <BaseButton type="button" variant="ghost" onClick={onLogout}>
            {t('common.logout', { defaultValue: 'Выйти' })}
          </BaseButton>
        ) : null}
      </div>
    </div>
  );
}
