import { FLOOR_STATUS_FILTERS } from '../utils/floorStatusFilters';
import '../styles/floor-status-filters.css';

export default function FloorStatusFilters({ value, onChange, t }) {
  return (
    <div className="rst-floor-filters" role="group" aria-label={t('rst.floor.statusFilter')}>
      {FLOOR_STATUS_FILTERS.map((row) => (
        <button
          key={row.key}
          type="button"
          className={`rst-floor-filters__chip${value === row.key ? ' is-active' : ''}`}
          onClick={() => onChange(row.key)}
        >
          {t(`rst.floor.filter${row.key === 'ALL' ? 'All' : row.key}`)}
        </button>
      ))}
    </div>
  );
}
