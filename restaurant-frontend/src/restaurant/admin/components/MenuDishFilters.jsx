import { BaseInput, BaseSelect } from '../../../components/ui';
import RstFilterResetButton from '../../shared/components/RstFilterResetButton';

export default function MenuDishFilters({ p }) {
  const setFilter = (key, value) => p.setFilters({ ...p.filters, [key]: value });

  return (
    <div className="rst-admin-filters rst-menu__filters">
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{p.t('common.search')}</span>
        <BaseInput
          value={p.filters.search}
          placeholder={p.t('rst.admin.menuSearchPh')}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </label>
      <BaseSelect
        className="rst-admin-field"
        size="sm"
        searchable={false}
        label={p.t('rst.admin.dishCategory')}
        value={p.filters.category}
        onChange={(e) => setFilter('category', e.target.value)}
        options={[
          { value: '', label: p.t('rst.admin.filterAllCategories') },
          ...p.categories.map((category) => ({ value: category, label: category })),
        ]}
      />
      <BaseSelect
        className="rst-admin-field"
        size="sm"
        searchable={false}
        label={p.t('rst.admin.station')}
        value={p.filters.stationId}
        onChange={(e) => setFilter('stationId', e.target.value)}
        options={[
          { value: '', label: p.t('rst.admin.filterAllStations') },
          ...p.stations.map((station) => ({ value: station.id, label: station.name })),
        ]}
      />
      <BaseSelect
        className="rst-admin-field"
        size="sm"
        searchable={false}
        label={p.t('rst.admin.filterAvailability')}
        value={p.filters.availability}
        onChange={(e) => setFilter('availability', e.target.value)}
        options={[
          { value: 'all', label: p.t('rst.admin.filterAll') },
          { value: 'available', label: p.t('rst.admin.filterAvailable') },
          { value: 'unavailable', label: p.t('rst.admin.filterUnavailable') },
        ]}
      />
      <RstFilterResetButton t={p.t} onClick={p.resetFilters} />
    </div>
  );
}
