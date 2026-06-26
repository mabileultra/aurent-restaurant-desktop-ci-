export function computeDeliveryStats(rows = []) {
  return {
    total: rows.length,
    newOrders: rows.filter((r) => r.status === 'NEW').length,
    delivered: rows.filter((r) => r.status === 'DELIVERED').length,
    completed: rows.filter((r) => r.status === 'COMPLETED').length,
  };
}
