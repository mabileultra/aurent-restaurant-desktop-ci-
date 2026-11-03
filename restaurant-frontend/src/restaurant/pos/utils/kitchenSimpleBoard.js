/** Simple kitchen + TV: 3 color phases, 2 taps (arrived → cooking → ready). */

export const SIMPLE_PHASES = ['ARRIVED', 'COOKING', 'READY'];

export const SIMPLE_PHASE_OF_STATUS = {
  NEW: 'ARRIVED',
  ACCEPTED: 'ARRIVED',
  PREPARING: 'COOKING',
  READY: 'READY',
};

/** Skip ACCEPTED column — cook taps twice to reach READY for TV. */
export const NEXT_SIMPLE_TICKET_STATUS = {
  NEW: 'PREPARING',
  ACCEPTED: 'PREPARING',
  PREPARING: 'READY',
  READY: 'SERVED',
};

export function simplePhaseOf(ticket) {
  return SIMPLE_PHASE_OF_STATUS[ticket?.status] ?? null;
}

export function groupTicketsBySimplePhase(tickets) {
  const groups = Object.fromEntries(SIMPLE_PHASES.map((phase) => [phase, []]));
  for (const ticket of tickets ?? []) {
    const phase = simplePhaseOf(ticket);
    if (phase && groups[phase]) groups[phase].push(ticket);
  }
  return groups;
}

export function nextSimpleStatus(ticket) {
  return NEXT_SIMPLE_TICKET_STATUS[ticket?.status] ?? null;
}
