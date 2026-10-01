import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import FloorHallRail from './FloorHallRail';
import FloorTableCard, { useNowTick } from './FloorTableCard';
import FloorStatusLegend from './FloorStatusLegend';
import { TABLE_STATUSES } from '../utils/tableStatus';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/floor-table-grid.css';
import '../styles/floor-hall-rail.css';
import '../styles/floor-actions.css';
import '../styles/floor-phase2.css';

const WAITER_LEGEND_STATUSES = ['OCCUPIED', 'WAITING_PAYMENT', 'RESERVED'];

export default function FloorTableGrid({
  hallTables,
  halls,
  selectedHallId,
  onSelectHall,
  selectedTableId,
  onTableClick,
  onPrefetchOrder,
  onAddTable,
  waiterNameById,
  t,
}) {
  const now = useNowTick();
  const tables = hallTables ?? [];
  const mineMode = !!onAddTable;

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
    if (onAddTable) {
      return (
        <div className="rst-floor-grid rst-floor-grid--empty">
          <p>{t('rst.floor.myTablesEmpty')}</p>
          <button
            type="button"
            className="rst-floor-actions__btn rst-floor-actions__btn--accent"
            onClick={onAddTable}
          >
            <Plus size={18} strokeWidth={2.4} aria-hidden />
            {t('rst.floor.addMyTable')}
          </button>
        </div>
      );
    }
    return (
      <div className="rst-floor-grid rst-floor-grid--empty">
        <p>{t('rst.floor.selectHall')}</p>
      </div>
    );
  }

  return (
    <div className="rst-floor-grid rst-floor-grid--rail">
      <FloorHallRail
        halls={halls}
        selectedHallId={selectedHallId}
        onSelectHall={onSelectHall}
        className="rst-floor-grid__rail"
        statsMode={mineMode ? 'mine' : 'hall'}
        t={t}
      />

      <div className="rst-floor-grid__main">
        {onAddTable ? (
          <div className="rst-floor-grid__toolbar">
            <div className="rst-floor-grid__toolbar-row">
              <div className="rst-floor-grid__tools">
                <div className="rst-floor-actions">
                  <button
                    type="button"
                    className="rst-floor-actions__btn rst-floor-actions__btn--accent"
                    onClick={onAddTable}
                  >
                    <Plus size={18} strokeWidth={2.4} aria-hidden />
                    {t('rst.floor.addMyTable')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {tables.length === 0 ? (
          <div className="rst-floor-grid__empty-board">
            <p>{onAddTable ? t('rst.floor.myTablesEmpty') : t('rst.floor.noTables')}</p>
            {onAddTable ? (
              <button
                type="button"
                className="rst-floor-actions__btn rst-floor-actions__btn--accent"
                onClick={onAddTable}
              >
                <Plus size={18} strokeWidth={2.4} aria-hidden />
                {t('rst.floor.addMyTable')}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="rst-floor-grid__cards">
            {tables.map((table) => (
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
          <FloorStatusLegend
            t={t}
            counts={counts}
            statuses={mineMode ? WAITER_LEGEND_STATUSES : undefined}
          />
          <div className="rst-floor-grid__stats">
            {mineMode ? (
              <div className="rst-floor-grid__avg">
                {t('rst.floor.myTablesCount', { count: tables.length })}
                {' · '}
                {t('rst.floor.avgCheck')}: <strong>{fmtMoneyCompact(avgCheck)}</strong>
              </div>
            ) : (
              <>
                <div className="rst-floor-grid__occupancy">
                  <span>{t('rst.floor.occupancy', { value: occupancy })}</span>
                  <div className="rst-floor-grid__bar" aria-hidden>
                    <i style={{ width: `${occupancy}%` }} />
                  </div>
                </div>
                <div className="rst-floor-grid__avg">
                  {t('rst.floor.avgCheck')}: <strong>{fmtMoneyCompact(avgCheck)}</strong>
                </div>
              </>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
