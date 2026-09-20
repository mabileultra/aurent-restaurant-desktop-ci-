import { BaseButton } from '../../../components/ui';
import { getMainAppUrl } from '../../../config/mainAppUrl';
import './restaurant-workspace-empty.css';

/**
 * Empty / pick state when POS or kitchen has no restaurant branch yet.
 */
export default function RestaurantWorkspaceEmpty({
  t,
  workspace,
  zoomStyle,
  onLogout,
}) {
  const mainApp = getMainAppUrl();
  const storesUrl = `${mainApp}/stores`;
  const usersUrl = `${mainApp}/users`;

  let title = t('rst.floor.noStore');
  let hint = t('rst.floor.noStoreHint');
  let actions = (
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
  } else if (workspace.staffStoresWrongType) {
    title = t('rst.floor.wrongStoreTypeTitle');
    hint = t('rst.floor.wrongStoreTypeHint');
  } else if (workspace.noStaffStores) {
    title = t('rst.floor.noStaffStoreTitle');
    hint = t('rst.floor.noStaffStoreHint');
    actions = (
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
