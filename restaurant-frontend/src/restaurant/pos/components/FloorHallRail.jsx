import { Fragment } from 'react';
import { ALL_HALLS_ID, collectHallTables, countHallTableStats } from '../utils/floorStatusFilters';
import '../styles/floor-hall-rail.css';

/** @param {'hall' | 'mine'} statsMode — mine = waiter my-tables (no free count). */
function HallStatsLine({ tables, t, statsMode = 'hall' }) {
  const stats = countHallTableStats(tables);
  const mine = statsMode === 'mine';

  if (!stats.total) {
    return (
      <span className="rst-floor-hall-rail__btn-stats">
        {t(mine ? 'rst.floor.myHallStatsEmpty' : 'rst.cashier.hallStatsEmpty')}
      </span>
    );
  }

  const parts = [];
  if (mine) {
    parts.push({
      key: 'occupied',
      tone: 'occupied',
      text: t('rst.floor.myHallStatsOpen', { count: stats.occupied }),
    });
  } else {
    parts.push(
      {
        key: 'occupied',
        tone: 'occupied',
        text: t('rst.cashier.hallStatsOccupied', { count: stats.occupied }),
      },
      {
        key: 'free',
        tone: 'free',
        text: t('rst.cashier.hallStatsFree', { count: stats.free }),
      },
    );
  }
  if (stats.waiting > 0) {
    parts.push({
      key: 'waiting',
      tone: 'waiting',
      text: t(mine ? 'rst.floor.myHallStatsWaiting' : 'rst.cashier.hallStatsWaiting', {
        count: stats.waiting,
      }),
    });
  }
  if (stats.reserved > 0) {
    parts.push({
      key: 'reserved',
      tone: 'reserved',
      text: t(mine ? 'rst.floor.myHallStatsReserved' : 'rst.cashier.hallStatsReserved', {
        count: stats.reserved,
      }),
    });
  }
  parts.push({
    key: 'total',
    tone: 'total',
    text: t(mine ? 'rst.floor.myHallStatsMine' : 'rst.cashier.hallStatsTotal', {
      count: stats.total,
    }),
  });

  return (
    <span className="rst-floor-hall-rail__btn-stats">
      {parts.map((part, index) => (
        <Fragment key={part.key}>
          {index > 0 ? <span className="rst-floor-hall-rail__btn-sep" aria-hidden>·</span> : null}
          <span className={`rst-floor-hall-rail__stat rst-floor-hall-rail__stat--${part.tone}`}>
            {part.text}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Left hall categories with status counts (desktop cashier / waiter).
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
  const allTables = collectHallTables(halls, ALL_HALLS_ID);
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
        className={`rst-floor-hall-rail__btn${selectedHallId === ALL_HALLS_ID ? ' is-active' : ''}`}
        onClick={() => onSelectHall(ALL_HALLS_ID)}
      >
        <span className="rst-floor-hall-rail__btn-main">
          <strong>{t('rst.floor.allHalls')}</strong>
          <HallStatsLine tables={allTables} t={t} statsMode={statsMode} />
        </span>
      </button>
      {halls.map((hall) => (
        <button
          key={hall.id}
          type="button"
          className={`rst-floor-hall-rail__btn${selectedHallId === hall.id ? ' is-active' : ''}`}
          onClick={() => onSelectHall(hall.id)}
        >
          <span className="rst-floor-hall-rail__btn-main">
            <strong>{hall.name}</strong>
            <HallStatsLine tables={hall.tables ?? []} t={t} statsMode={statsMode} />
          </span>
        </button>
      ))}
    </aside>
  );
}
