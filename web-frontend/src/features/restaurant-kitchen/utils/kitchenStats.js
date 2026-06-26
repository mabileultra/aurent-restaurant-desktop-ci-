export function computeKitchenStats(tickets = []) {
  return {
    pending: tickets.filter((t) => t.status === 'PENDING').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    ready: tickets.filter((t) => t.status === 'READY').length,
    total: tickets.length,
  };
}
