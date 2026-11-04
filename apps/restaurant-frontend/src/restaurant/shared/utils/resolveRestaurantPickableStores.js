/**
 * Build the store list admin/POS can pick from.
 * Offline edge often has JWT storeIds before /stores is populated — do not block the UI.
 */
export function resolveRestaurantPickableStores({
  restaurantStores = [],
  assignedIds = [],
  staffUsesAssignment = false,
  staffPool = [],
}) {
  if (staffUsesAssignment) return staffPool;

  if (restaurantStores.length) return restaurantStores;

  // Admin/manager: synthesize from JWT when local /stores is empty after bootstrap glitch.
  return (assignedIds || [])
    .filter((id) => Number.isFinite(Number(id)) && Number(id) > 0)
    .map((id) => ({
      id: Number(id),
      name: `Точка #${id}`,
      businessType: 'RESTAURANT',
      active: true,
    }));
}
