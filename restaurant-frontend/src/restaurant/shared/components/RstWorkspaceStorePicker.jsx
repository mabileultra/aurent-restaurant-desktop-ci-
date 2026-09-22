import { useRestaurantWorkspaceStore } from '../hooks/useRestaurantWorkspaceStore';
import '../styles/rst-workspace-store-picker.css';

/**
 * Global restaurant branch switcher for admin shell (and reusable elsewhere).
 */
export default function RstWorkspaceStorePicker({ t, className = '' }) {
  const workspace = useRestaurantWorkspaceStore();

  if (workspace.isLoading) {
    return (
      <div className={`rst-store-picker ${className}`.trim()}>
        <span className="rst-store-picker__label">{t('common.loading')}</span>
      </div>
    );
  }

  if (!workspace.restaurantStores?.length) {
    return (
      <div className={`rst-store-picker ${className}`.trim()}>
        <span className="rst-store-picker__label">{t('rst.admin.noRestaurantsYet')}</span>
      </div>
    );
  }

  if (!workspace.canPickStore) {
    return (
      <div className={`rst-store-picker ${className}`.trim()} title={workspace.storeName || ''}>
        <span className="rst-store-picker__label">{t('rst.admin.currentRestaurant')}</span>
        <strong className="rst-store-picker__value">{workspace.storeName || '—'}</strong>
      </div>
    );
  }

  return (
    <label className={`rst-store-picker ${className}`.trim()}>
      <span className="rst-store-picker__label">{t('rst.admin.selectStore')}</span>
      <select
        className="rst-store-picker__select"
        value={workspace.pickedStoreId}
        onChange={(e) => workspace.setPickedStoreId(e.target.value)}
        aria-label={t('rst.admin.selectStore')}
      >
        <option value="">{t('rst.admin.selectStore')}</option>
        {workspace.restaurantStores.map((store) => (
          <option key={store.id} value={store.id}>{store.name}</option>
        ))}
      </select>
    </label>
  );
}
