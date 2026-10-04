import { useMemo } from 'react';
import FloorHallRail from './FloorHallRail';
import FloorTableCard, { useNowTick } from './FloorTableCard';
import FloorCanvas from './FloorCanvas';
import FloorStatusFilters from './FloorStatusFilters';
import FloorStatusLegend from './FloorStatusLegend';
import { TABLE_STATUSES } from '../utils/tableStatus';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/floor-table-grid.css';
import '../styles/floor-hall-rail.css';
import '../styles/floor-actions.css';
import '../styles/floor-phase2.css';
import '../styles/floor-section-tabs.css';

const WAITER_LEGEND_STATUSES = ['OCCUPIED', 'WAITING_PAYMENT', 'RESERVED'];

export default function FloorTableGrid({
  hallTables,
  halls,
  selectedHallId,
  onSelectHall,
  selectedTableId,
  onTableClick,
  onPrefetchOrder,
  /** Desktop waiter: schema board instead of cards / pick modal. */
  schemaHall = null,
  isSchemaTableSelectable,
  statusFilter,
  onStatusFilter,
  sectionSwitch = null,
  schemaFilters = false,
  mineMode = false,
  waiterNameById,
  t,
}) {
  const now = useNowTick();
  const tables = hallTables ?? [];
  const schemaMode = mineMode && schemaHall !== undefined;

  const counts = useMemo(() => {
    const map = Object.fromEntries(TABLE_STATUSES.map((s) => [s, 0]));
    const source = schemaMode ? (schemaHall?.tables ?? []) : tables;
    for (const table of source) {
      const key = TABLE_STATUSES.includes(table.status) ? table.status : 'FREE';
      map[key] += 1;
    }
    return map;
  }, [tables, schemaMode, schemaHall]);

  const occupied = (counts.OCCUPIED || 0) + (counts.WAITING_PAYMENT || 0);
  const occupancy = tables.length
    ? Math.round((occupied / tables.length) * 100)
    : 0;

  const avgCheck = useMemo(() => {
    const source = schemaMode ? (schemaHall?.tables ?? []) : tables;
    const open = source.filter((table) => table.activeOrder);
    if (!open.length) return 0;
    const sum = open.reduce((acc, table) => acc + Number(table.activeOrder.subtotal || 0), 0);
    return sum / open.length;
  }, [tables, schemaMode, schemaHall]);

  if (!halls?.length) {
    return (
      <div className="rst-floor-grid rst-floor-grid--empty">
        <p>{mineMode ? t('rst.floor.myTablesEmpty') : t('rst.floor.selectHall')}</p>
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
        {schemaMode ? (
          <div className="rst-floor-grid__toolbar rst-floor-grid__toolbar--compact">
            <div className="rst-floor-grid__toolbar-row rst-floor-grid__toolbar-row--filters">
              {sectionSwitch}
              {onStatusFilter ? (
                <FloorStatusFilters
                  value={statusFilter}
                  onChange={onStatusFilter}
                  schemaMode={schemaFilters}
                  t={t}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {schemaMode ? (
          <div className="rst-floor-grid__schema-board">
            <FloorCanvas
              variant="pick"
              hall={schemaHall}
              selectedTableId={selectedTableId}
              waiterNameById={waiterNameById}
              isTableSelectable={isSchemaTableSelectable}
              onTableClick={onTableClick}
              t={t}
            />
          </div>
        ) : tables.length === 0 ? (
          <div className="rst-floor-grid__empty-board">
            <p>{t('rst.floor.noTables')}</p>
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
                {t('rst.floor.myTablesCount', {
                  count: schemaMode ? (schemaHall?.tables?.length ?? 0) : tables.length,
                })}
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
