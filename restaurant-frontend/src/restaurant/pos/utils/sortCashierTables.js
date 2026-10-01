import { resolveTableChecksTotal } from './restaurantPayAmount';
import { tableStatusClass } from './tableStatus';

/** Filter/sort cashier tables: free/occupied/bill, or by amount. */

function byCode(a, b) {
  return String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true });
}

function tableAmount(table, halls) {
  const n = resolveTableChecksTotal(table, halls);
  return n == null ? null : Number(n);
}

export function sortCashierTables(tables, sortKey = 'FREE', halls = []) {
  const list = Array.isArray(tables) ? [...tables] : [];

  if (sortKey === 'FREE') {
    return list
      .filter((table) => {
        const status = tableStatusClass(table.status);
        return status === 'FREE' || status === 'CLEANING';
      })
      .sort(byCode);
  }
  if (sortKey === 'OCCUPIED') {
    return list
      .filter((table) => tableStatusClass(table.status) === 'OCCUPIED')
      .sort(byCode);
  }
  if (sortKey === 'WAITING_PAYMENT') {
    return list
      .filter((table) => tableStatusClass(table.status) === 'WAITING_PAYMENT')
      .sort(byCode);
  }
  if (sortKey === 'AMOUNT_DESC') {
    return list.sort((a, b) => {
      const aa = tableAmount(a, halls);
      const bb = tableAmount(b, halls);
      if (aa == null && bb == null) return byCode(a, b);
      if (aa == null) return 1;
      if (bb == null) return -1;
      return (bb - aa) || byCode(a, b);
    });
  }
  if (sortKey === 'AMOUNT_ASC') {
    return list.sort((a, b) => {
      const aa = tableAmount(a, halls);
      const bb = tableAmount(b, halls);
      if (aa == null && bb == null) return byCode(a, b);
      if (aa == null) return 1;
      if (bb == null) return -1;
      return (aa - bb) || byCode(a, b);
    });
  }
  return list.sort(byCode);
}
