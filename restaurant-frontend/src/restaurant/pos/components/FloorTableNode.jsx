import { tableActiveOrders } from '../utils/floorStatusFilters';
import { tableStatusClass } from '../utils/tableStatus';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/floor-table.css';

export default function FloorTableNode({
  table,
  selected,
  onClick,
  onPointerDown,
  draggable = false,
  pickMode = false,
  waiterLabel = null,
  t,
}) {
  const status = tableStatusClass(table.status);
  const orders = tableActiveOrders(table);
  const order = orders[0] || null;
  const checksSum = orders.reduce((sum, row) => sum + Number(row.subtotal || 0), 0);
  const busy = status === 'OCCUPIED' || status === 'WAITING_PAYMENT' || status === 'RESERVED';
  const pickSelectable = pickMode && (status === 'FREE' || status === 'CLEANING');

  let meta;
  if (pickMode) {
    if (busy) {
      meta = waiterLabel || t(`rst.status.${status}`);
    } else {
      meta = t(`rst.status.${status}`);
    }
  } else if (order) {
    meta = (
      <>
        {fmtMoneyCompact(orders.length > 1 ? checksSum : order.subtotal)}
        {orders.length > 1
          ? ` · ${t('rst.order.checksCount', { count: orders.length })}`
          : ` · ${t('rst.order.guestsShort', { count: order.guestCount })}`}
      </>
    );
  } else {
    meta = t(`rst.status.${status}`);
  }

  return (
    <button
      type="button"
      className={[
        'rst-table',
        `rst-table--${status}`,
        selected ? 'is-selected' : '',
        draggable ? 'is-draggable' : '',
        pickMode && busy ? 'is-pick-busy' : '',
        pickMode && pickSelectable ? 'is-pick-free' : '',
        pickMode && !pickSelectable && !busy ? 'is-pick-locked' : '',
      ].filter(Boolean).join(' ')}
      style={{
        left: table.posX,
        top: table.posY,
        width: table.width,
        height: table.height,
        cursor: draggable ? 'grab' : (pickMode && !pickSelectable ? 'default' : undefined),
        touchAction: draggable ? 'none' : undefined,
      }}
      onPointerDown={onPointerDown}
      onClick={onClick && (!pickMode || pickSelectable) ? () => onClick(table) : undefined}
      disabled={pickMode && !pickSelectable}
    >
      <span className="rst-table__code">{table.code}</span>
      <span className="rst-table__meta">{meta}</span>
    </button>
  );
}
