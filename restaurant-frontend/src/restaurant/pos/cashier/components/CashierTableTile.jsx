import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { tableStatusClass } from '../../utils/tableStatus';
import { formatElapsed } from '../../utils/formatElapsed';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import '../styles/cashier-table-tile.css';

/**
 * Compact table tile for cashier 3-column board — number, status, amount only.
 */
export default function CashierTableTile({
  table,
  selected,
  now,
  onClick,
  t,
}) {
  const status = tableStatusClass(table.status);
  const orders = tableActiveOrders(table);
  const order = orders[0] || null;
  const elapsed = order?.openedAt ? formatElapsed(order.openedAt, now) : null;
  const amount = orders.length
    ? orders.reduce((sum, row) => sum + Number(row.subtotal || 0), 0)
    : null;

  return (
    <button
      type="button"
      className={`rst-cashier-tile rst-cashier-tile--${status}${selected ? ' is-selected' : ''}`}
      onClick={() => onClick(table)}
    >
      <span className="rst-cashier-tile__code">{table.code}</span>
      <span className="rst-cashier-tile__status">{t(`rst.status.${status}`)}</span>
      {amount != null ? (
        <strong className="rst-cashier-tile__amount">{fmtMoneyCompact(amount)}</strong>
      ) : (
        <span className="rst-cashier-tile__seats">
          {t('rst.floor.seats', { count: table.seatCount ?? 0 })}
        </span>
      )}
      {orders.length > 1 ? (
        <span className="rst-cashier-tile__time">{t('rst.order.checksCount', { count: orders.length })}</span>
      ) : elapsed ? <span className="rst-cashier-tile__time">{elapsed}</span> : null}
    </button>
  );
}
