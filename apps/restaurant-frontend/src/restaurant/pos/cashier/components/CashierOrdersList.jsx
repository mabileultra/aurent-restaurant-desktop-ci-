import { useMemo } from 'react';
import { fmtMoneyCompact } from '../../../../utils/formatMoney';
import { tableActiveOrders } from '../../utils/floorStatusFilters';
import { resolveOrderHallName } from '../../utils/floorPosDerivations';
import '../styles/cashier-orders-list.css';

/** Flat list of open dine-in checks for cashier (one row per check). */
export default function CashierOrdersList({
  tables = [],
  halls = [],
  onlyWaitingPayment = false,
  waiterNameById,
  onSelect,
  emptyText,
  t,
}) {
  const rows = useMemo(() => {
    const out = [];
    for (const table of tables) {
      const orders = tableActiveOrders(table);
      if (!orders.length && table.status !== 'WAITING_PAYMENT') continue;
      for (const check of (orders.length ? orders : [null])) {
        const billing = String(check?.status || '').toUpperCase() === 'BILLING'
          || table.status === 'WAITING_PAYMENT';
        if (onlyWaitingPayment && !billing) continue;
        if (!check && !onlyWaitingPayment) continue;
        out.push({ table, check });
      }
    }
    return out;
  }, [tables, onlyWaitingPayment]);

  if (!rows.length) {
    return <div className="rst-empty">{emptyText}</div>;
  }

  return (
    <ul className="rst-cashier-orders">
      {rows.map(({ table, check }) => {
        const waiter = check?.waiterUserId
          ? (waiterNameById?.get(String(check.waiterUserId)) || '—')
          : '—';
        const hallName = resolveOrderHallName(halls, { tableId: table.id }, table.hallName);
        const billing = String(check?.status || '').toUpperCase() === 'BILLING';
        const statusKey = billing ? 'WAITING_PAYMENT' : (table.status || 'OCCUPIED');
        const key = check?.id != null ? `c-${check.id}` : `t-${table.id}`;
        return (
          <li key={key}>
            <button
              type="button"
              className="rst-cashier-orders__card"
              onClick={() => onSelect(table, check?.id)}
            >
              <strong>
                {hallName ? `${hallName} · ` : ''}
                {t('rst.floor.tableTitle', { code: table.code })}
              </strong>
              <span>
                {check?.orderNo != null
                  ? t('rst.floor.checkNo', { no: check.orderNo })
                  : '—'}
                {' · '}
                {waiter}
              </span>
              <span>{t(`rst.status.${statusKey}`)}</span>
              <em>{fmtMoneyCompact(check?.subtotal ?? 0)}</em>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
