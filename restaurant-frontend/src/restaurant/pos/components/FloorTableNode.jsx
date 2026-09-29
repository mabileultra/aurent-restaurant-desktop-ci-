import { tableActiveOrders } from '../utils/floorStatusFilters';
import { tableStatusClass } from '../utils/tableStatus';
import { fmtMoneyCompact } from '../../../utils/formatMoney';
import '../styles/floor-table.css';

export default function FloorTableNode({ table, selected, onClick, t }) {
  const status = tableStatusClass(table.status);
  const orders = tableActiveOrders(table);
  const order = orders[0] || null;
  const checksSum = orders.reduce((sum, row) => sum + Number(row.subtotal || 0), 0);

  return (
    <button
      type="button"
      className={`rst-table rst-table--${status}${selected ? ' is-selected' : ''}`}
      style={{
        left: table.posX,
        top: table.posY,
        width: table.width,
        height: table.height,
      }}
      onClick={() => onClick(table)}
    >
      <span className="rst-table__code">{table.code}</span>
      {order ? (
        <span className="rst-table__meta">
          {fmtMoneyCompact(orders.length > 1 ? checksSum : order.subtotal)}
          {orders.length > 1 ? ` · ${t('rst.order.checksCount', { count: orders.length })}` : ` · ${t('rst.order.guestsShort', { count: order.guestCount })}`}
        </span>
      ) : (
        <span className="rst-table__meta">{t(`rst.status.${status}`)}</span>
      )}
    </button>
  );
}
