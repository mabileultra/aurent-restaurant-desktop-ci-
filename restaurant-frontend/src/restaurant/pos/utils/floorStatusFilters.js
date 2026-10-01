/** Hall / status filters for floor schema. */

export const ALL_HALLS_ID = 'all';

export const FLOOR_STATUS_FILTERS = [
  { key: 'ALL', statuses: null },
  { key: 'FREE', statuses: ['FREE'] },
  { key: 'OCCUPIED', statuses: ['OCCUPIED'] },
  { key: 'WAITING_PAYMENT', statuses: ['WAITING_PAYMENT'] },
  { key: 'RESERVED', statuses: ['RESERVED'] },
];

export function filterTablesByStatus(tables, statusFilter) {
  const rule = FLOOR_STATUS_FILTERS.find((row) => row.key === statusFilter)
    ?? FLOOR_STATUS_FILTERS[0];
  if (!rule.statuses) return tables ?? [];
  return (tables ?? []).filter((table) => rule.statuses.includes(table.status));
}

export function collectHallTables(halls, selectedHallId) {
  if (!halls?.length) return [];
  if (selectedHallId == null || selectedHallId === ALL_HALLS_ID) {
    return halls.flatMap((hall) => hall.tables ?? []);
  }
  const hall = halls.find((row) => row.id === selectedHallId);
  return hall?.tables ?? [];
}

/** Counts for cashier hall rail badges. */
export function countHallTableStats(tables = []) {
  let free = 0;
  let occupied = 0;
  let waiting = 0;
  let reserved = 0;
  for (const table of tables) {
    const status = String(table?.status || '').toUpperCase();
    if (status === 'OCCUPIED') occupied += 1;
    else if (status === 'WAITING_PAYMENT') waiting += 1;
    else if (status === 'RESERVED') reserved += 1;
    else if (status === 'FREE' || status === 'CLEANING') free += 1;
  }
  return {
    total: tables.length,
    free,
    occupied,
    waiting,
    reserved,
  };
}

export function freeTablesForTransfer(halls, excludeTableId) {
  return collectHallTables(halls, ALL_HALLS_ID)
    .filter((table) => table.id !== excludeTableId)
    .filter((table) => table.status === 'FREE' || table.status === 'CLEANING');
}

export function tableActiveOrders(table) {
  if (Array.isArray(table?.activeOrders) && table.activeOrders.length) return table.activeOrders;
  if (table?.activeOrder) return [table.activeOrder];
  return [];
}

/** Tables this waiter is serving (open checks assigned to them). */
export function filterTablesByWaiter(tables = [], waiterUserId) {
  if (waiterUserId == null || waiterUserId === '') return [];
  const mine = String(waiterUserId);
  return (tables ?? []).filter((table) =>
    tableActiveOrders(table).some((order) => order?.waiterUserId != null && String(order.waiterUserId) === mine),
  );
}

export function filterHallsByWaiterTables(halls = [], waiterUserId) {
  return (halls ?? []).map((hall) => ({
    ...hall,
    tables: filterTablesByWaiter(hall.tables ?? [], waiterUserId),
  }));
}

export function occupiedTablesForMerge(halls, excludeTableId) {
  return collectHallTables(halls, ALL_HALLS_ID)
    .filter((table) => table.id !== excludeTableId)
    .filter((table) => table.status === 'OCCUPIED' && table.activeOrder?.id);
}
