import { useMemo } from 'react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import '../styles/cashier-orders-list.css';

/** Flat list of open dine-in orders for cashier. */
export default function CashierOrdersList({
  tables = [],
  onlyWaitingPayment = false,
  waiterNameById,
  onSelect,
  emptyText,
  t,
}) {
  const rows = useMemo(() => {
    return tables.filter((table) => {
      if (!table.activeOrder && table.status !== 'WAITING_PAYMENT') return false;
      if (onlyWaitingPayment) return table.status === 'WAITING_PAYMENT';
      return true;
    });
  }, [tables, onlyWaitingPayment]);

  if (!rows.length) {
    return <div className="rst-empty">{emptyText}</div>;
  }

  return (
    <ul className="rst-cashier-orders">
      {rows.map((table) => {
        const order = table.activeOrder;
        const waiter = order?.waiterUserId
          ? (waiterNameById?.get(String(order.waiterUserId)) || '—')
          : '—';
        return (
          <li key={table.id}>
            <button type="button" className="rst-cashier-orders__card" onClick={() => onSelect(table)}>
              <strong>{t('rst.floor.tableTitle', { code: table.code })}</strong>
              <span>{waiter}</span>
              <span>{t(`rst.status.${table.status || 'OCCUPIED'}`)}</span>
              <em>{fmtMoneyCompact(order?.subtotal ?? 0)}</em>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
