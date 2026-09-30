import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { tableStatusClass } from '../../utils/tableStatus';
import { formatElapsed } from '../../utils/formatElapsed';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';

/**
 * Large touch tile for waiter phone floor — status color, amount, guests, timer.
 */
export default function WaiterMobileTableTile({
  table,
  selected,
  now,
  waiterNameById,
  onClick,
  onPrefetchOrder,
  t,
}) {
  const status = tableStatusClass(table.status);
  const orders = tableActiveOrders(table);
  const order = orders[0] || null;
  const elapsed = order?.openedAt ? formatElapsed(order.openedAt, now) : null;
  const amount = orders.length
    ? orders.reduce((sum, row) => sum + Number(row.subtotal || 0), 0)
    : null;
  const waiter = order?.waiterUserId
    ? (waiterNameById?.get(String(order.waiterUserId)) || null)
    : null;
  const guests = order?.guestCount ?? table.reservation?.guestCount ?? null;

  const warm = () => {
    if (!onPrefetchOrder) return;
    for (const row of orders) {
      if (row?.id) onPrefetchOrder(row.id);
    }
  };

  return (
    <button
      type="button"
      className={`rst-waiter-tile rst-waiter-tile--${status}${selected ? ' is-selected' : ''}`}
      onClick={() => onClick(table)}
      onPointerEnter={warm}
      onFocus={warm}
    >
      <span className="rst-waiter-tile__top">
        <span className="rst-waiter-tile__code">{table.code}</span>
        <span className="rst-waiter-tile__status">{t(`rst.status.${status}`)}</span>
      </span>

      <span className="rst-waiter-tile__mid">
        {amount != null ? (
          <strong className="rst-waiter-tile__amount">{fmtMoneyCompact(amount)}</strong>
        ) : (
          <span className="rst-waiter-tile__seats">
            {t('rst.floor.seats', { count: table.seatCount ?? 0 })}
          </span>
        )}
        {guests != null ? (
          <span className="rst-waiter-tile__guests">
            {t('rst.order.guestsShort', { count: guests })}
          </span>
        ) : null}
      </span>

      <span className="rst-waiter-tile__meta">
        {orders.length > 1 ? (
          <span>{t('rst.order.checksCount', { count: orders.length })}</span>
        ) : elapsed ? <span>{elapsed}</span> : null}
        {waiter ? <span className="rst-waiter-tile__waiter">{waiter}</span> : null}
        {table.reservation?.clientName && status === 'RESERVED' ? (
          <span>{table.reservation.clientName}</span>
        ) : null}
      </span>
    </button>
  );
}
