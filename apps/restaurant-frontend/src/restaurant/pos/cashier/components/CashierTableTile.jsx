import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { tableStatusClass } from '../../utils/tableStatus';
import { formatElapsed } from '../../utils/formatElapsed';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { resolveTableChecksTotal } from '../../utils/restaurantPayAmount';
import { resolveOrderHallName } from '../../utils/floorPosDerivations';
import '../styles/cashier-table-tile.css';

/**
 * Compact table tile for cashier board — hall, number, status (no nested checks).
 */
export default function CashierTableTile({
  table,
  halls = [],
  selected,
  now,
  onClick,
  onPrefetchOrder,
  t,
}) {
  const status = tableStatusClass(table.status);
  const orders = tableActiveOrders(table);
  const order = orders[0] || null;
  const elapsed = order?.openedAt ? formatElapsed(order.openedAt, now) : null;
  const amount = resolveTableChecksTotal(table, halls);
  const hallName = resolveOrderHallName(halls, { tableId: table.id }, table.hallName);

  const warm = () => {
    if (!onPrefetchOrder) return;
    for (const row of orders) {
      if (row?.id) onPrefetchOrder(row.id);
    }
  };

  const openTable = () => onClick?.(table);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`rst-cashier-tile rst-cashier-tile--${status}${selected ? ' is-selected' : ''}`}
      onClick={openTable}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openTable();
        }
      }}
      onPointerEnter={warm}
      onFocus={warm}
    >
      <span className="rst-cashier-tile__head">
        {hallName ? <span className="rst-cashier-tile__hall">{hallName}</span> : null}
        <span className="rst-cashier-tile__code">{table.code}</span>
      </span>
      <span className="rst-cashier-tile__status">{t(`rst.status.${status}`)}</span>
      {amount != null ? (
        <strong className="rst-cashier-tile__amount">{fmtMoneyCompact(amount)}</strong>
      ) : (
        <span className="rst-cashier-tile__seats">
          {t('rst.floor.seats', { count: table.seatCount ?? 0 })}
        </span>
      )}
      {elapsed ? <span className="rst-cashier-tile__time">{elapsed}</span> : null}
    </div>
  );
}
