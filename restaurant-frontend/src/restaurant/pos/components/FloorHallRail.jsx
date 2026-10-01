import { ALL_HALLS_ID } from '../utils/floorStatusFilters';
import '../styles/floor-hall-rail.css';

const HALL_TONE_COUNT = 8;

/**
 * Left hall categories (desktop cashier / waiter).
 */
export default function FloorHallRail({
  halls = [],
  selectedHallId,
  onSelectHall,
  header = null,
  className = '',
  statsMode = 'hall',
  t,
}) {
  const title = statsMode === 'mine' ? t('rst.floor.myTables') : t('rst.cashier.halls');

  return (
    <aside
      className={`rst-floor-hall-rail${className ? ` ${className}` : ''}`}
      aria-label={title}
    >
      {header}
      <h2 className="rst-floor-hall-rail__title">{title}</h2>
      <button
        type="button"
        className={[
          'rst-floor-hall-rail__btn',
          'rst-floor-hall-rail__btn--all',
          selectedHallId === ALL_HALLS_ID ? 'is-active' : '',
        ].filter(Boolean).join(' ')}
        onClick={() => onSelectHall(ALL_HALLS_ID)}
      >
        <strong>{t('rst.floor.allHalls')}</strong>
      </button>
      {halls.map((hall, index) => (
        <button
          key={hall.id}
          type="button"
          className={[
            'rst-floor-hall-rail__btn',
            `rst-floor-hall-rail__btn--tone-${index % HALL_TONE_COUNT}`,
            selectedHallId === hall.id ? 'is-active' : '',
          ].filter(Boolean).join(' ')}
          onClick={() => onSelectHall(hall.id)}
        >
          <strong>{hall.name}</strong>
        </button>
      ))}
    </aside>
  );
}
