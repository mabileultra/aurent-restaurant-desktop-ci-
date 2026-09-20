import { useMemo } from 'react';
import FloorTableCard, { useNowTick } from './FloorTableCard';
import FloorStatusLegend from './FloorStatusLegend';
import { TABLE_STATUSES } from '../utils/tableStatus';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/floor-table-grid.css';

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
  hall,
  halls,
  selectedHallId,
  onSelectHall,
  selectedTableId,
  onTableClick,
  onNewOrder,
  search,
  onSearchChange,
  waiterNameById,
  t,
}) {
  const now = useNowTick();
  const tables = hall?.tables ?? [];
  const visible = useMemo(
    () => tables.filter((table) => matchesQuery(table, search, waiterNameById)),
    [tables, search, waiterNameById],
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

  if (!hall) {
    return (
      <div className="rst-floor-grid rst-floor-grid--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  return (
    <div className="rst-floor-grid">
      <div className="rst-floor-grid__toolbar">
        <div className="rst-floor-grid__halls">
          {(halls ?? []).map((item) => (
            <button
              key={item.id}
              type="button"
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
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t('rst.floor.searchPh')}
            />
          </label>
          {onNewOrder ? (
            <button type="button" className="rst-floor-grid__new" onClick={onNewOrder}>
              {t('rst.floor.newOrder')}
            </button>
          ) : null}
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
              selected={selectedTableId === table.id}
              onClick={onTableClick}
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
