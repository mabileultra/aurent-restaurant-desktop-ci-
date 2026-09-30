import { useMemo } from 'react';
import { useNowTick } from '../../components/FloorTableCard';
import { filterTablesByStatus } from '../../utils/floorStatusFilters';
import CashierTableTile from './CashierTableTile';
import '../styles/cashier-table-board.css';

export default function CashierTableBoard({
  tables = [],
  halls = [],
  statusFilter = 'ALL',
  selectedTableId,
  activeOrderId,
  onTableClick,
  onPrefetchOrder,
  t,
}) {
  const now = useNowTick();
  const visible = useMemo(
    () => filterTablesByStatus(tables, statusFilter),
    [tables, statusFilter],
  );

  const selectedId = selectedTableId
    ?? tables.find((row) => (row.activeOrder?.id ?? row.activeOrderId) === activeOrderId)?.id
    ?? null;

  return (
    <section className="rst-cashier-tables" aria-label={t('rst.cashier.tables')}>
      <div className="rst-cashier-tables__head">
        <h2>{t('rst.cashier.tables')}</h2>
        <span>{visible.length}</span>
      </div>
      {!visible.length ? (
        <div className="rst-empty">{t('rst.floor.noTables')}</div>
      ) : (
        <div className="rst-cashier-tables__grid">
          {visible.map((table) => (
            <CashierTableTile
              key={table.id}
              table={table}
              halls={halls}
              selected={table.id === selectedId}
              now={now}
              onClick={onTableClick}
              onPrefetchOrder={onPrefetchOrder}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}
