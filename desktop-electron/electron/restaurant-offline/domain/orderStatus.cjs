/** B0 — order lifecycle. No I/O. */

const ORDER_STATUS = Object.freeze({
  OPEN: 'OPEN',
  ACTIVE: 'ACTIVE',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
});

/** @type {Readonly<Record<string, ReadonlySet<string>>>} */
const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.OPEN]: Object.freeze(new Set([ORDER_STATUS.ACTIVE, ORDER_STATUS.CANCELLED])),
  [ORDER_STATUS.ACTIVE]: Object.freeze(new Set([ORDER_STATUS.PAID, ORDER_STATUS.CANCELLED])),
  [ORDER_STATUS.PAID]: Object.freeze(new Set()),
  [ORDER_STATUS.CANCELLED]: Object.freeze(new Set()),
});

function canTransitionOrder(from, to) {
  const next = ORDER_TRANSITIONS[from];
  return Boolean(next && next.has(to));
}

function assertOrderTransition(from, to) {
  if (!canTransitionOrder(from, to)) {
    throw new Error(`invalid_order_transition:${from}->${to}`);
  }
  return to;
}

function isTerminalOrder(status) {
  return status === ORDER_STATUS.PAID || status === ORDER_STATUS.CANCELLED;
}

module.exports = {
  ORDER_STATUS,
  ORDER_TRANSITIONS,
  canTransitionOrder,
  assertOrderTransition,
  isTerminalOrder,
};
