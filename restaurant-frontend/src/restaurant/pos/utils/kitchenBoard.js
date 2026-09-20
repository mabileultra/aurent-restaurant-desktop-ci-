export const KDS_COLUMNS = ['NEW', 'ACCEPTED', 'PREPARING', 'READY'];

export const NEXT_TICKET_STATUS = {
  NEW: 'ACCEPTED',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

export function groupTicketsByStatus(tickets) {
  const groups = Object.fromEntries(KDS_COLUMNS.map((status) => [status, []]));
  for (const ticket of tickets) {
    if (groups[ticket.status]) {
      groups[ticket.status].push(ticket);
    }
  }
  return groups;
}
