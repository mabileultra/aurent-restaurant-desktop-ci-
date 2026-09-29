import { useMemo } from 'react';
import { Search } from 'lucide-react';
import { useNowTick } from '../../components/FloorTableCard';
import FloorStatusFilters from '../../components/FloorStatusFilters';
import { ALL_HALLS_ID, filterTablesByStatus } from '../../utils/floorStatusFilters';
import { matchTableQuery } from '../utils/matchTableQuery';
import WaiterMobileTableTile from './WaiterMobileTableTile';
import '../styles/waiter-mobile-floor.css';

/**
 * Phone floor board for waiter — hall chips, status chips, tall table list.
 * Same callbacks as FloorTableGrid; presentation only.
 */
export default function WaiterMobileFloorBoard({
  hallTables,
  halls,
  selectedHallId,
  onSelectHall,
  statusFilter,
  onStatusFilter,
  selectedTableId,
  onTableClick,
  sectionSwitch,
  search,
  onSearchChange,
  waiterNameById,
  t,
}) {
  const now = useNowTick();
  const tables = hallTables ?? [];
  const visible = useMemo(
    () => filterTablesByStatus(tables, statusFilter)
      .filter((table) => matchTableQuery(table, search, waiterNameById)),
    [tables, statusFilter, search, waiterNameById],
  );

  if (!halls?.length) {
    return (
      <div className="rst-waiter-floor rst-waiter-floor--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  return (
    <div className="rst-waiter-floor">
      <div className="rst-waiter-floor__toolbar">
        {sectionSwitch}
        <div className="rst-waiter-floor__halls" role="tablist" aria-label={t('rst.floor.allHalls')}>
          <button
            type="button"
            role="tab"
            aria-selected={selectedHallId === ALL_HALLS_ID}
            className={`rst-waiter-floor__hall${selectedHallId === ALL_HALLS_ID ? ' is-active' : ''}`}
            onClick={() => onSelectHall(ALL_HALLS_ID)}
          >
            {t('rst.floor.allHalls')}
          </button>
          {halls.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selectedHallId === item.id}
              className={`rst-waiter-floor__hall${selectedHallId === item.id ? ' is-active' : ''}`}
              onClick={() => onSelectHall(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <label className="rst-waiter-floor__search">
          <span className="visually-hidden">{t('rst.floor.search')}</span>
          <Search size={16} strokeWidth={2.2} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('rst.floor.searchPh')}
            enterKeyHint="search"
          />
        </label>

        <FloorStatusFilters value={statusFilter} onChange={onStatusFilter} t={t} />
      </div>

      {visible.length === 0 ? (
        <div className="rst-waiter-floor__empty">
          <p>{tables.length === 0 ? t('rst.floor.noTables') : t('rst.floor.searchEmpty')}</p>
        </div>
      ) : (
        <div className="rst-waiter-floor__list" role="list">
          {visible.map((table) => (
            <WaiterMobileTableTile
              key={table.id}
              table={table}
              selected={selectedTableId === table.id}
              now={now}
              waiterNameById={waiterNameById}
              onClick={onTableClick}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
