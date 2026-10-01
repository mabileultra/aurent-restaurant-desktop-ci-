import { tableStatusClass } from './tableStatus';

/** Filter/sort cashier table list: all / bill issued / occupied. */

function byCode(a, b) {
  return String(a.code || '').localeCompare(String(b.code || ''), undefined, { numeric: true });
}

export function sortCashierTables(tables, filterKey = 'WAITING_PAYMENT') {
  const list = Array.isArray(tables) ? [...tables] : [];
  let filtered = list;
  if (filterKey === 'WAITING_PAYMENT') {
    filtered = list.filter((table) => tableStatusClass(table.status) === 'WAITING_PAYMENT');
  } else if (filterKey === 'OCCUPIED') {
    filtered = list.filter((table) => tableStatusClass(table.status) === 'OCCUPIED');
  }
  return filtered.sort(byCode);
}
