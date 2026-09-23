import { BaseButton, BaseInput } from '../../../components/ui';

export default function MenuDishFilters({ p }) {
  return (
    <div className="rst-admin-filters rst-menu__filters">
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{p.t('common.search')}</span>
        <BaseInput
          value={p.filters.search}
          placeholder={p.t('rst.admin.menuSearchPh')}
          onChange={(e) => p.setFilters({ ...p.filters, search: e.target.value })}
        />
      </label>
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{p.t('rst.admin.dishCategory')}</span>
        <select
          className="form-select"
          value={p.filters.category}
          onChange={(e) => p.setFilters({ ...p.filters, category: e.target.value })}
        >
          <option value="">{p.t('rst.admin.filterAllCategories')}</option>
          {p.categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </label>
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{p.t('rst.admin.station')}</span>
        <select
          className="form-select"
          value={p.filters.stationId}
          onChange={(e) => p.setFilters({ ...p.filters, stationId: e.target.value })}
        >
          <option value="">{p.t('rst.admin.filterAllStations')}</option>
          {p.stations.map((station) => (
            <option key={station.id} value={station.id}>{station.name}</option>
          ))}
        </select>
      </label>
      <label className="rst-admin-field">
        <span className="rst-admin-field__label">{p.t('rst.admin.filterAvailability')}</span>
        <select
          className="form-select"
          value={p.filters.availability}
          onChange={(e) => p.setFilters({ ...p.filters, availability: e.target.value })}
        >
          <option value="all">{p.t('rst.admin.filterAll')}</option>
          <option value="available">{p.t('rst.admin.filterAvailable')}</option>
          <option value="unavailable">{p.t('rst.admin.filterUnavailable')}</option>
        </select>
      </label>
      <BaseButton type="button" variant="ghost" className="rst-admin-filters__reset" onClick={p.resetFilters}>
        {p.t('rst.admin.filterReset')}
      </BaseButton>
    </div>
  );
}
