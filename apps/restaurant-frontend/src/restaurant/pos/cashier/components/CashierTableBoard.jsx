import { useMemo, useState } from 'react';
import { useNowTick } from '../../components/FloorTableCard';
import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { sortCashierTables } from '../../utils/sortCashierTables';
import CashierCheckRow from './CashierCheckRow';
import CashierTableTile from './CashierTableTile';
import '../styles/cashier-table-board.css';

const FILTER_KEYS = [
  { key: 'OCCUPIED', labelKey: 'rst.cashier.filterOccupied' },
  { key: 'WAITING_PAYMENT', labelKey: 'rst.cashier.filterBillIssued' },
  { key: 'FREE', labelKey: 'rst.cashier.filterFree' },
];

const ORDER_KEYS = [
  { key: 'AMOUNT_DESC', labelKey: 'rst.cashier.sortSeatsDesc', symbol: '↓' },
  { key: 'AMOUNT_ASC', labelKey: 'rst.cashier.sortSeatsAsc', symbol: '↑' },
];

function buildBoardRows(tables, sortKey, halls) {
  const sorted = sortCashierTables(tables, sortKey, halls);
  const rows = [];
  for (const table of sorted) {
    const orders = tableActiveOrders(table);
    if (orders.length > 0) {
      for (const check of orders) {
        rows.push({ key: `check-${check.id}`, kind: 'check', table, check });
      }
    } else {
      rows.push({ key: `table-${table.id}`, kind: 'table', table });
    }
  }
  if (sortKey === 'AMOUNT_DESC' || sortKey === 'AMOUNT_ASC') {
    const dir = sortKey === 'AMOUNT_DESC' ? -1 : 1;
    rows.sort((a, b) => {
      const aa = a.kind === 'check' ? Number(a.check?.subtotal || 0) : -1;
      const bb = b.kind === 'check' ? Number(b.check?.subtotal || 0) : -1;
      if (aa < 0 && bb < 0) {
        return String(a.table.code || '').localeCompare(String(b.table.code || ''), undefined, { numeric: true });
      }
      if (aa < 0) return 1;
      if (bb < 0) return -1;
      return (aa - bb) * dir
        || String(a.table.code || '').localeCompare(String(b.table.code || ''), undefined, { numeric: true });
    });
  }
  return rows;
}

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

  const rows = useMemo(
    () => buildBoardRows(tables, sortKey, halls),
    [tables, sortKey, halls],
  );

  return (
    <section className="rst-cashier-tables" aria-label={t('rst.cashier.tables')}>
      <div className="rst-cashier-tables__head">
        <div className="rst-cashier-tables__title-row">
          <h2>{t('rst.cashier.tables')}</h2>
          <span>{rows.length}</span>
        </div>
        <div className="rst-cashier-tables__sort" role="group" aria-label={t('rst.cashier.sortLabel')}>
          <div className="rst-cashier-tables__filters">
            {FILTER_KEYS.map((row) => (
              <button
                key={row.key}
                type="button"
                className={[
                  'rst-cashier-tables__sort-btn',
                  sortKey === row.key ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
                aria-pressed={sortKey === row.key}
                title={t(row.labelKey)}
                onClick={() => setSortKey(row.key)}
              >
                {t(row.labelKey)}
              </button>
            ))}
          </div>
          <div className="rst-cashier-tables__order" role="group" aria-label={t('rst.cashier.sortSeatsDesc')}>
            {ORDER_KEYS.map((row) => (
              <button
                key={row.key}
                type="button"
                className={[
                  'rst-cashier-tables__sort-btn',
                  'rst-cashier-tables__sort-btn--icon',
                  sortKey === row.key ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
                aria-label={t(row.labelKey)}
                aria-pressed={sortKey === row.key}
                title={t(row.labelKey)}
                onClick={() => setSortKey(row.key)}
              >
                {row.symbol}
              </button>
            ))}
          </div>
        </div>
      </div>
      {!rows.length ? (
        <div className="rst-empty">{t('rst.floor.noTables')}</div>
      ) : (
        <div className="rst-cashier-tables__list">
          {rows.map((row) => {
            if (row.kind === 'check') {
              const selected = row.check?.id != null
                && String(row.check.id) === String(activeOrderId);
              return (
                <CashierCheckRow
                  key={row.key}
                  table={row.table}
                  check={row.check}
                  halls={halls}
                  selected={selected}
                  onSelect={onSelectCheck}
                  onPrefetchOrder={onPrefetchOrder}
                  t={t}
                />
              );
            }
            return (
              <CashierTableTile
                key={row.key}
                table={row.table}
                halls={halls}
                selected={row.table.id === selectedTableId}
                now={now}
                onClick={onTableClick}
                onPrefetchOrder={onPrefetchOrder}
                t={t}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
