import { resolveTableChecksTotal } from './restaurantPayAmount';

/** Sort cashier tables by check total (крупные / мелкие) or table code. */

function byCode(a, b) {
  return String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true });
}

function tableAmount(table, halls) {
  const n = resolveTableChecksTotal(table, halls);
  return n == null ? null : Number(n);
}

export function sortCashierTables(tables, sortKey = 'DEFAULT', halls = []) {
  const list = Array.isArray(tables) ? [...tables] : [];
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
