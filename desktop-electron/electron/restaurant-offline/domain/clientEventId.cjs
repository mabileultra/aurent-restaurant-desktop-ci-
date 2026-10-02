/** B0 — idempotency key for outbox / server ingest. No I/O. */

const { randomUUID } = require('node:crypto');

/**
 * @param {{ deviceId: string, uuid?: () => string }} opts
 * @returns {{ deviceId: string, clientEventId: string }}
 */
function createClientEventId({ deviceId, uuid = randomUUID } = {}) {
  const id = String(deviceId || '').trim();
  if (!id) throw new Error('device_id_required');
  return { deviceId: id, clientEventId: uuid() };
}

/**
 * Server / local unique key for at-most-once business effect.
 * @param {{ deviceId: string, clientEventId: string }} parts
 */
function idempotencyKey({ deviceId, clientEventId }) {
  const d = String(deviceId || '').trim();
  const e = String(clientEventId || '').trim();
  if (!d || !e) throw new Error('idempotency_parts_required');
  return `${d}:${e}`;
}

module.exports = {
  createClientEventId,
  idempotencyKey,
};
