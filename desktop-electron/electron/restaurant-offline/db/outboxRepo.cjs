const { randomUUID } = require('node:crypto');
const { OUTBOX_STATUS, assertOutboxTransition, isOutboxClaimable } = require('../domain/outboxStatus.cjs');
const { createClientEventId } = require('../domain/clientEventId.cjs');

function createOutboxRepo(db, {
  idFactory = randomUUID,
  clock = () => new Date().toISOString(),
  uuid = randomUUID,
} = {}) {
  return {
    /**
     * Enqueue event with deviceId + clientEventId (idempotent unique key).
     */
    enqueue({ deviceId, eventType, payload, clientEventId = null }) {
      const ids = clientEventId
        ? { deviceId, clientEventId }
        : createClientEventId({ deviceId, uuid });
      const id = idFactory();
      const at = clock();
      db.prepare(
        `INSERT INTO outbox(
           id, device_id, client_event_id, event_type, status, payload_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        ids.deviceId,
        ids.clientEventId,
        eventType,
        OUTBOX_STATUS.PENDING,
        JSON.stringify(payload ?? {}),
        at,
      );
      return {
        id,
        deviceId: ids.deviceId,
        clientEventId: ids.clientEventId,
        status: OUTBOX_STATUS.PENDING,
      };
    },

    getById(id) {
      return db.prepare(`SELECT * FROM outbox WHERE id = ?`).get(id) || null;
    },

    transition(id, toStatus, { error = null, nextRetryAt = null } = {}) {
      const row = this.getById(id);
      if (!row) throw new Error(`outbox_not_found:${id}`);
      assertOutboxTransition(row.status, toStatus);
      const at = clock();
      if (toStatus === OUTBOX_STATUS.SENDING) {
        db.prepare(
          `UPDATE outbox SET status = ?, sent_at = ?, attempt_count = attempt_count + 1, last_error = NULL WHERE id = ?`,
        ).run(toStatus, at, id);
      } else if (toStatus === OUTBOX_STATUS.SYNCED) {
        db.prepare(
          `UPDATE outbox SET status = ?, synced_at = ?, last_error = NULL, next_retry_at = NULL WHERE id = ?`,
        ).run(toStatus, at, id);
      } else if (toStatus === OUTBOX_STATUS.RETRY) {
        db.prepare(
          `UPDATE outbox SET status = ?, last_error = ?, next_retry_at = ? WHERE id = ?`,
        ).run(toStatus, error != null ? String(error) : null, nextRetryAt, id);
      } else {
        db.prepare(`UPDATE outbox SET status = ? WHERE id = ?`).run(toStatus, id);
      }
      return { id, status: toStatus };
    },

    listClaimable(limit = 50, now = clock()) {
      return db.prepare(
        `SELECT * FROM outbox
         WHERE status IN (?, ?)
           AND (next_retry_at IS NULL OR next_retry_at <= ?)
         ORDER BY created_at ASC
         LIMIT ?`,
      ).all(OUTBOX_STATUS.PENDING, OUTBOX_STATUS.RETRY, now, limit)
        .filter((row) => isOutboxClaimable(row.status));
    },
  };
}

module.exports = { createOutboxRepo };
