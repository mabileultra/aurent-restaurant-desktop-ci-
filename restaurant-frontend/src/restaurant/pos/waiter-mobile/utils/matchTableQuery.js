/** Shared table search for waiter mobile board (code, label, waiter, guest). */

export function matchTableQuery(table, query, waiterNameById) {
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  if (!q) return true;
  const waiter = table.activeOrder?.waiterUserId
    ? (waiterNameById?.get(String(table.activeOrder.waiterUserId)) || '')
    : '';
  const guest = table.reservation?.clientName || '';
  const hay = `${table.code || ''} ${table.label || ''} ${waiter} ${guest}`.toLowerCase();
  return hay.includes(q);
}
