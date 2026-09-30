import { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import FloorTableCard, { useNowTick } from './FloorTableCard';
import FloorStatusLegend from './FloorStatusLegend';
import FloorStatusFilters from './FloorStatusFilters';
import { TABLE_STATUSES } from '../utils/tableStatus';
import { ALL_HALLS_ID, filterTablesByStatus } from '../utils/floorStatusFilters';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/floor-table-grid.css';
import '../styles/floor-actions.css';
import '../styles/floor-phase2.css';

function matchesQuery(table, query, waiterNameById) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const waiter = table.activeOrder?.waiterUserId
    ? (waiterNameById?.get(String(table.activeOrder.waiterUserId)) || '')
    : '';
  const guest = table.reservation?.clientName || '';
  const hay = `${table.code || ''} ${table.label || ''} ${waiter} ${guest}`.toLowerCase();
  return hay.includes(q);
}

export default function FloorTableGrid({
  hallTables,
  halls,
  selectedHallId,
  onSelectHall,
  statusFilter,
  onStatusFilter,
  selectedTableId,
  onTableClick,
  onPrefetchOrder,
  onNewOrder,
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
      .filter((table) => matchesQuery(table, search, waiterNameById)),
    [tables, statusFilter, search, waiterNameById],
  );

  const counts = useMemo(() => {
    const map = Object.fromEntries(TABLE_STATUSES.map((s) => [s, 0]));
    for (const table of tables) {
      const key = TABLE_STATUSES.includes(table.status) ? table.status : 'FREE';
      map[key] += 1;
    }
    return map;
  }, [tables]);

  const occupied = (counts.OCCUPIED || 0) + (counts.WAITING_PAYMENT || 0);
  const occupancy = tables.length
    ? Math.round((occupied / tables.length) * 100)
    : 0;

  const avgCheck = useMemo(() => {
    const open = tables.filter((table) => table.activeOrder);
    if (!open.length) return 0;
    const sum = open.reduce((acc, table) => acc + Number(table.activeOrder.subtotal || 0), 0);
    return sum / open.length;
  }, [tables]);

  if (!halls?.length) {
    return (
      <div className="rst-floor-grid rst-floor-grid--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  return (
    <div className="rst-floor-grid">
      <div className="rst-floor-grid__toolbar">
        <div className="rst-floor-grid__toolbar-row">
          <div className="rst-floor-grid__halls" role="tablist" aria-label={t('rst.floor.allHalls')}>
            <button
              type="button"
              role="tab"
              aria-selected={selectedHallId === ALL_HALLS_ID}
              className={`rst-floor-grid__hall${selectedHallId === ALL_HALLS_ID ? ' is-active' : ''}`}
              onClick={() => onSelectHall(ALL_HALLS_ID)}
            >
              <span>{t('rst.floor.allHalls')}</span>
              <em>{halls.reduce((n, h) => n + (h.tables?.length ?? 0), 0)}</em>
            </button>
            {halls.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selectedHallId === item.id}
                className={`rst-floor-grid__hall${selectedHallId === item.id ? ' is-active' : ''}`}
                onClick={() => onSelectHall(item.id)}
              >
                <span>{item.name}</span>
                <em>{item.tables?.length ?? 0}</em>
              </button>
            ))}
          </div>
          <div className="rst-floor-grid__tools">
            <label className="rst-floor-grid__search">
              <span className="visually-hidden">{t('rst.floor.search')}</span>
              <Search className="rst-floor-grid__search-ico" size={16} strokeWidth={2.2} aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={t('rst.floor.searchPh')}
              />
            </label>
            {sectionSwitch}
            {onNewOrder ? (
              <div className="rst-floor-actions">
                <button
                  type="button"
                  className="rst-floor-actions__btn rst-floor-actions__btn--accent"
                  onClick={onNewOrder}
                >
                  <Plus size={16} strokeWidth={2.4} aria-hidden />
                  {t('rst.floor.newOrder')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="rst-floor-grid__toolbar-row rst-floor-grid__toolbar-row--filters">
          <FloorStatusFilters value={statusFilter} onChange={onStatusFilter} t={t} />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rst-floor-grid__empty-board">
          <p>{tables.length === 0 ? t('rst.floor.noTables') : t('rst.floor.searchEmpty')}</p>
        </div>
      ) : (
        <div className="rst-floor-grid__cards">
          {visible.map((table) => (
            <FloorTableCard
              key={table.id}
              table={table}
              halls={halls}
              selected={selectedTableId === table.id}
              onClick={onTableClick}
              onPrefetchOrder={onPrefetchOrder}
              t={t}
              now={now}
              waiterNameById={waiterNameById}
            />
          ))}
        </div>
      )}

      <footer className="rst-floor-grid__footer">
        <FloorStatusLegend t={t} counts={counts} />
        <div className="rst-floor-grid__stats">
          <div className="rst-floor-grid__occupancy">
            <span>{t('rst.floor.occupancy', { value: occupancy })}</span>
            <div className="rst-floor-grid__bar" aria-hidden>
              <i style={{ width: `${occupancy}%` }} />
            </div>
          </div>
          <div className="rst-floor-grid__avg">
            {t('rst.floor.avgCheck')}: <strong>{fmtMoneyCompact(avgCheck)}</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
