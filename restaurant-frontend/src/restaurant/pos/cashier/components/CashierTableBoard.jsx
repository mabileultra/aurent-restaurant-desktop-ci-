import { useMemo, useState } from 'react';
import { useNowTick } from '../../components/FloorTableCard';
import { sortCashierTables } from '../../utils/sortCashierTables';
import CashierTableTile from './CashierTableTile';
import '../styles/cashier-table-board.css';

const SORT_KEYS = [
  { key: 'FREE', labelKey: 'rst.cashier.filterFree' },
  { key: 'OCCUPIED', labelKey: 'rst.cashier.filterOccupied' },
  { key: 'WAITING_PAYMENT', labelKey: 'rst.cashier.filterBillIssued' },
  { key: 'AMOUNT_DESC', labelKey: 'rst.cashier.sortSeatsDesc', symbol: '↓' },
  { key: 'AMOUNT_ASC', labelKey: 'rst.cashier.sortSeatsAsc', symbol: '↑' },
];

export default function CashierTableBoard({
  tables = [],
  halls = [],
  selectedTableId,
  activeOrderId,
  onTableClick,
  onSelectCheck,
  onPrefetchOrder,
  t,
}) {
  const now = useNowTick();
  const [sortKey, setSortKey] = useState('FREE');

  const visible = useMemo(
    () => sortCashierTables(tables, sortKey, halls),
    [tables, sortKey, halls],
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
          {SORT_KEYS.map((row) => (
            <button
              key={row.key}
              type="button"
              className={[
                'rst-cashier-tables__sort-btn',
                row.symbol ? 'rst-cashier-tables__sort-btn--icon' : '',
                sortKey === row.key ? 'is-active' : '',
              ].filter(Boolean).join(' ')}
              aria-label={t(row.labelKey)}
              title={t(row.labelKey)}
              onClick={() => setSortKey(row.key)}
            >
              {row.symbol ?? t(row.labelKey)}
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
              activeOrderId={activeOrderId}
              now={now}
              onClick={onTableClick}
              onSelectCheck={onSelectCheck}
              onPrefetchOrder={onPrefetchOrder}
              t={t}
            />
          ))}
        </div>
      )}
    </section>
  );
}
