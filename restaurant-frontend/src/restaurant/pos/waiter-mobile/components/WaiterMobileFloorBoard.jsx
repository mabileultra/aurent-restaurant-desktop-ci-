import { useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNowTick } from '../../components/FloorTableCard';
import FloorStatusFilters from '../../components/FloorStatusFilters';
import { ALL_HALLS_ID, filterTablesByStatus } from '../../utils/floorStatusFilters';
import { matchTableQuery } from '../utils/matchTableQuery';
import WaiterMobileTableTile from './WaiterMobileTableTile';
import '../styles/waiter-mobile-floor.css';

/**
 * Phone floor board for waiter — my tables + take table (same idea as desktop).
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
  onPrefetchOrder,
  sectionSwitch,
  search,
  onSearchChange,
  waiterNameById,
  mineMode = false,
  onAddTable,
  t,
}) {
  const now = useNowTick();
  const tables = hallTables ?? [];
  const mineTotal = useMemo(() => {
    if (!mineMode) return tables.length;
    const fromHalls = (halls ?? []).reduce((n, hall) => n + (hall.tables?.length || 0), 0);
    return fromHalls || tables.length;
  }, [mineMode, halls, tables.length]);
  const visible = useMemo(
    () => filterTablesByStatus(tables, statusFilter)
      .filter((table) => matchTableQuery(table, search, waiterNameById)),
    [tables, statusFilter, search, waiterNameById],
  );

  if (!halls?.length && !mineMode) {
    return (
      <div className="rst-waiter-floor rst-waiter-floor--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  return (
    <div className={`rst-waiter-floor${mineMode ? ' rst-waiter-floor--mine' : ''}`}>
      <div className="rst-waiter-floor__toolbar">
        {sectionSwitch}

        {onAddTable ? (
          <button
            type="button"
            className="rst-waiter-floor__take"
            onClick={onAddTable}
          >
            <Plus size={20} strokeWidth={2.4} aria-hidden />
            {t('rst.floor.addMyTable')}
          </button>
        ) : null}

        {(halls?.length > 0) ? (
          <div className="rst-waiter-floor__halls" role="tablist" aria-label={t('rst.floor.allHalls')}>
            <button
              type="button"
              role="tab"
              aria-selected={selectedHallId === ALL_HALLS_ID}
              className={`rst-waiter-floor__hall${selectedHallId === ALL_HALLS_ID ? ' is-active' : ''}`}
              onClick={() => onSelectHall(ALL_HALLS_ID)}
            >
              {t('rst.floor.allHalls')}
              {mineMode ? (
                <em>{t('rst.floor.myTablesCount', { count: mineTotal })}</em>
              ) : null}
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
        ) : null}

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

        <div className="rst-waiter-floor__filters">
          <FloorStatusFilters value={statusFilter} onChange={onStatusFilter} t={t} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rst-waiter-floor__empty">
          <p>
            {tables.length === 0
              ? (onAddTable ? t('rst.floor.myTablesEmpty') : t('rst.floor.noTables'))
              : t('rst.floor.searchEmpty')}
          </p>
          {onAddTable && tables.length === 0 ? (
            <button
              type="button"
              className="rst-waiter-floor__take rst-waiter-floor__take--inline"
              onClick={onAddTable}
            >
              <Plus size={20} strokeWidth={2.4} aria-hidden />
              {t('rst.floor.addMyTable')}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="rst-waiter-floor__list" role="list">
          {visible.map((table) => (
            <WaiterMobileTableTile
              key={table.id}
              table={table}
              halls={halls}
              selected={selectedTableId === table.id}
              now={now}
              waiterNameById={waiterNameById}
              onClick={onTableClick}
              onPrefetchOrder={onPrefetchOrder}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}
