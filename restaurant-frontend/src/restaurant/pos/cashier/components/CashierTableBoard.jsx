import { useMemo, useState } from 'react';
import { useNowTick } from '../../components/FloorTableCard';
import { sortCashierTables } from '../../utils/sortCashierTables';
import CashierTableTile from './CashierTableTile';
import '../styles/cashier-table-board.css';

const SORT_KEYS = [
  { key: 'DEFAULT', labelKey: 'rst.cashier.sortDefault' },
  { key: 'AMOUNT_DESC', labelKey: 'rst.cashier.sortSeatsDesc' },
  { key: 'AMOUNT_ASC', labelKey: 'rst.cashier.sortSeatsAsc' },
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
  const [sortKey, setSortKey] = useState('DEFAULT');

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
        <div className="rst-cashier-tables__sort" role="group" aria-label={t('rst.cashier.sortLabel', { defaultValue: 'Сортировка' })}>
          {SORT_KEYS.map((row) => (
            <button
              key={row.key}
              type="button"
              className={`rst-cashier-tables__sort-btn${sortKey === row.key ? ' is-active' : ''}`}
              onClick={() => setSortKey(row.key)}
            >
              {t(row.labelKey, {
                defaultValue: row.key === 'AMOUNT_DESC'
                  ? 'Крупные'
                  : row.key === 'AMOUNT_ASC'
                    ? 'Мелкие'
                    : 'По порядку',
              })}
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
