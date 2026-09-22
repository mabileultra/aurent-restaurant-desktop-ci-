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

export function freeTablesForTransfer(halls, excludeTableId) {
  return collectHallTables(halls, ALL_HALLS_ID)
    .filter((table) => table.id !== excludeTableId)
    .filter((table) => table.status === 'FREE' || table.status === 'CLEANING');
}

export function occupiedTablesForMerge(halls, excludeTableId) {
  return collectHallTables(halls, ALL_HALLS_ID)
    .filter((table) => table.id !== excludeTableId)
    .filter((table) => table.status === 'OCCUPIED' && table.activeOrder?.id);
}
