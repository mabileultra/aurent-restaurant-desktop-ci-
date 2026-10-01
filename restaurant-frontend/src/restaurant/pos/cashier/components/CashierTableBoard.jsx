import { useMemo, useState } from 'react';
import { useNowTick } from '../../components/FloorTableCard';
import { sortCashierTables } from '../../utils/sortCashierTables';
import CashierTableTile from './CashierTableTile';
import '../styles/cashier-table-board.css';

const FILTER_KEYS = [
  { key: 'WAITING_PAYMENT', labelKey: 'rst.cashier.filterBillIssued' },
  { key: 'OCCUPIED', labelKey: 'rst.cashier.filterOccupied' },
];

export default function CashierTableBoard({
  tables = [],
  halls = [],
  selectedTableId,
  activeOrderId,
  onTableClick,
  onPrefetchOrder,
  t,
}) {
  const now = useNowTick();
  const [filterKey, setFilterKey] = useState('WAITING_PAYMENT');

  const visible = useMemo(
    () => sortCashierTables(tables, filterKey),
    [tables, filterKey],
  );

  const selectedId = selectedTableId
    ?? tables.find((row) => (row.activeOrder?.id ?? row.activeOrderId) === activeOrderId)?.id
    ?? null;

  return (
    <section className="rst-cashier-tables" aria-label={t('rst.cashier.tables')}>
      <div className="rst-cashier-tables__head">
        <div className="rst-cashier-tables__title-row">
          <h2>{t('rst.cashier.tables')}</h2>
          <span>{visible.length}</span>
        </div>
        <div className="rst-cashier-tables__sort" role="group" aria-label={t('rst.cashier.sortLabel')}>
          {FILTER_KEYS.map((row) => (
            <button
              key={row.key}
              type="button"
              className={`rst-cashier-tables__sort-btn${filterKey === row.key ? ' is-active' : ''}`}
              onClick={() => setFilterKey((prev) => (prev === row.key ? 'ALL' : row.key))}
            >
              {t(row.labelKey)}
            </button>
          ))}
        </div>
      </div>
      {!visible.length ? (
        <div className="rst-empty">{t('rst.floor.noTables')}</div>
      ) : (
        <div className="rst-cashier-tables__list">
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
