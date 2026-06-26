import { computeKitchenStats } from './kitchenStats';

const ACTIVE_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'READY']);

export function filterActiveTickets(tickets = []) {
  return tickets.filter((ticket) => ACTIVE_STATUSES.has(ticket.status));
}

export function groupTicketsByDepartment(tickets = []) {
  const groups = new Map();
  filterActiveTickets(tickets).forEach((ticket) => {
    const department = ticket.kitchenDepartment || 'GENERAL';
    const bucket = groups.get(department) ?? [];
    bucket.push(ticket);
    groups.set(department, bucket);
  });
  return groups;
}

export function buildDepartmentCardStats(tickets = []) {
  return computeKitchenStats(filterActiveTickets(tickets));
}

export function countUnseenPendingTickets(tickets = [], lastSeenAt) {
  if (!lastSeenAt) {
    return tickets.filter((ticket) => ticket.status === 'PENDING').length;
  }
  return tickets.filter(
    (ticket) => ticket.status === 'PENDING' && ticket.createdAt && ticket.createdAt > lastSeenAt,
  ).length;
}

export function resolveLatestTicketTimestamp(tickets = []) {
  return tickets.reduce((latest, ticket) => {
    const stamp = ticket.updatedAt || ticket.createdAt;
    if (!stamp) return latest;
    return !latest || stamp > latest ? stamp : latest;
  }, null);
}
