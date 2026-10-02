/**
 * D1 — OutboxSender: PENDING|RETRY → SENDING → SYNCED | RETRY(backoff).
 * Inject `sendEvent`. Never mutates orders / print_jobs.
 * Server must be idempotent on (deviceId, clientEventId).
 */

const { OUTBOX_STATUS } = require('../domain/outboxStatus.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { nextRetryAtIso } = require('./outboxBackoff.cjs');

const STALE_SENDING_MS = 45_000;

/**
 * Crash mid-SENDING → RETRY (safe: server is idempotent).
 */
function recoverStaleSending(db, { nowMs = Date.now(), staleAfterMs = STALE_SENDING_MS, clock } = {}) {
  const outbox = createOutboxRepo(db, { clock });
  const rows = db.prepare(
    `SELECT * FROM outbox WHERE status = ?`,
  ).all(OUTBOX_STATUS.SENDING);
  const promoted = [];
  for (const row of rows) {
    const sentAt = row.sent_at ? Date.parse(row.sent_at) : null;
    if (sentAt != null && nowMs - sentAt < staleAfterMs) continue;
    // SENDING → RETRY is allowed by state machine
    const nextRetryAt = nextRetryAtIso(clock ? clock() : new Date().toISOString(), row.attempt_count || 1);
    outbox.transition(row.id, OUTBOX_STATUS.RETRY, {
      error: 'stale_sending_after_restart',
      nextRetryAt,
    });
    promoted.push(row.id);
  }
  return { promoted };
}

function createOutboxSender(db, {
  sendEvent,
  clock = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  staleAfterMs = STALE_SENDING_MS,
} = {}) {
  if (typeof sendEvent !== 'function') {
    throw new Error('send_event_fn_required');
  }

  const outbox = createOutboxRepo(db, { clock });
  let running = false;

  async function processRow(row) {
    outbox.transition(row.id, OUTBOX_STATUS.SENDING);
    const fresh = outbox.getById(row.id);
    const body = {
      deviceId: fresh.device_id,
      clientEventId: fresh.client_event_id,
      eventType: fresh.event_type,
      payload: JSON.parse(fresh.payload_json || '{}'),
      createdAt: fresh.created_at,
    };
    try {
      const result = await sendEvent(body);
      // ACCEPTED or ALREADY_PROCESSED → SYNCED
      const outcome = String(result?.outcome || result?.status || 'ACCEPTED').toUpperCase();
      if (outcome !== 'ACCEPTED' && outcome !== 'ALREADY_PROCESSED' && outcome !== 'OK') {
        throw new Error(`unexpected_ingest_outcome:${outcome}`);
      }
      outbox.transition(row.id, OUTBOX_STATUS.SYNCED);
      return { id: row.id, status: OUTBOX_STATUS.SYNCED, outcome };
    } catch (err) {
      const msg = String(err?.message || err);
      const attemptCount = (outbox.getById(row.id)?.attempt_count) || 1;
      const nextRetryAt = nextRetryAtIso(clock(), attemptCount);
      outbox.transition(row.id, OUTBOX_STATUS.RETRY, { error: msg, nextRetryAt });
      return { id: row.id, status: OUTBOX_STATUS.RETRY, error: msg, nextRetryAt };
    }
  }

  async function tick({ limit = 20 } = {}) {
    if (running) return { busy: true, results: [] };
    running = true;
    try {
      recoverStaleSending(db, { nowMs: nowMs(), staleAfterMs, clock });
      const claimable = outbox.listClaimable(limit, clock());
      const results = [];
      for (const row of claimable) {
        const fresh = outbox.getById(row.id);
        if (!fresh || (fresh.status !== OUTBOX_STATUS.PENDING && fresh.status !== OUTBOX_STATUS.RETRY)) {
          continue;
        }
        results.push(await processRow(fresh));
      }
      return { busy: false, results };
    } finally {
      running = false;
    }
  }

  return { tick, recover: () => recoverStaleSending(db, { nowMs: nowMs(), staleAfterMs, clock }) };
}

module.exports = {
  createOutboxSender,
  recoverStaleSending,
  STALE_SENDING_MS,
  ...require('./outboxBackoff.cjs'),
};
