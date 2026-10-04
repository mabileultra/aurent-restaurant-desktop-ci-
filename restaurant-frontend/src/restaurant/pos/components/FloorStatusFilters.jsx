import { FLOOR_STATUS_FILTERS } from '../utils/floorStatusFilters';
import '../styles/floor-status-filters.css';

/** Waiter schema: Мои столы first, then hall status chips. */
const SCHEMA_FILTERS = [
  { key: 'MINE', labelKey: 'rst.floor.myTables' },
  ...FLOOR_STATUS_FILTERS.map((row) => ({
    key: row.key,
    labelKey: `rst.floor.filter${row.key === 'ALL' ? 'All' : row.key}`,
  })),
];

export default function FloorStatusFilters({
  value,
  onChange,
  t,
  schemaMode = false,
}) {
  const rows = schemaMode
    ? SCHEMA_FILTERS
    : FLOOR_STATUS_FILTERS.map((row) => ({
      key: row.key,
      labelKey: `rst.floor.filter${row.key === 'ALL' ? 'All' : row.key}`,
    }));

  return (
    <div
      className={`rst-floor-filters${schemaMode ? ' rst-floor-filters--schema' : ''}`}
      role="group"
      aria-label={t('rst.floor.statusFilter')}
    >
      {rows.map((row) => (
        <button
          key={row.key}
          type="button"
          className={`rst-floor-filters__chip${value === row.key ? ' is-active' : ''}`}
          onClick={() => onChange(row.key)}
        >
          {t(row.labelKey)}
        </button>
      ))}
    </div>
  );
}
