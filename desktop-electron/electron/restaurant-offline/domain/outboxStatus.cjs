/** B0 — outbox / sync lifecycle. No I/O. SyncWorker never mutates orders or print_jobs. */

const OUTBOX_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  SYNCED: 'SYNCED',
  RETRY: 'RETRY',
});

/** @type {Readonly<Record<string, ReadonlySet<string>>>} */
const OUTBOX_TRANSITIONS = Object.freeze({
  [OUTBOX_STATUS.PENDING]: Object.freeze(new Set([OUTBOX_STATUS.SENDING])),
  [OUTBOX_STATUS.SENDING]: Object.freeze(new Set([OUTBOX_STATUS.SYNCED, OUTBOX_STATUS.RETRY])),
  [OUTBOX_STATUS.RETRY]: Object.freeze(new Set([OUTBOX_STATUS.SENDING])),
  [OUTBOX_STATUS.SYNCED]: Object.freeze(new Set()),
});

function canTransitionOutbox(from, to) {
  const next = OUTBOX_TRANSITIONS[from];
  return Boolean(next && next.has(to));
}

function assertOutboxTransition(from, to) {
  if (!canTransitionOutbox(from, to)) {
    throw new Error(`invalid_outbox_transition:${from}->${to}`);
  }
  return to;
}

function isOutboxClaimable(status) {
  return status === OUTBOX_STATUS.PENDING || status === OUTBOX_STATUS.RETRY;
}

module.exports = {
  OUTBOX_STATUS,
  OUTBOX_TRANSITIONS,
  canTransitionOutbox,
  assertOutboxTransition,
  isOutboxClaimable,
};
