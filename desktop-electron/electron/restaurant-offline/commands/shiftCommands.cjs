/**
 * Local shift open/close — sync_state snapshot + outbox for server later.
 */
const { randomUUID } = require('node:crypto');
const { runInTransaction } = require('../db/tx.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { saveLocalShift, getLocalShift } = require('./localShiftCache.cjs');

function openShiftCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;
  const deviceId = String(input?.deviceId || '').trim();
  const storeId = Number(input?.storeId);
  if (!deviceId) throw new Error('device_id_required');
  if (!Number.isFinite(storeId)) throw new Error('store_id_required');

  return runInTransaction(db, () => {
    const existing = getLocalShift(db, storeId);
    if (existing?.id && existing?.status === 'OPEN') {
      return { shift: existing, already: true };
    }
    const at = clock();
    const shift = {
      id: input.shiftId ? String(input.shiftId) : idFactory(),
      storeId,
      status: 'OPEN',
      openingCash: Number(input.openingCash) || 0,
      openedAt: at,
      _local: true,
    };
    saveLocalShift(db, storeId, shift);
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });
    const event = outbox.enqueue({
      deviceId,
      eventType: 'SHIFT_OPEN',
      payload: {
        shiftId: shift.id,
        storeId,
        openingCash: shift.openingCash,
        openedAt: at,
      },
    });
    return { shift, outboxId: event.id, clientEventId: event.clientEventId };
  });
}

function closeShiftCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;
  const deviceId = String(input?.deviceId || '').trim();
  const storeId = Number(input?.storeId);
  if (!deviceId) throw new Error('device_id_required');
  if (!Number.isFinite(storeId)) throw new Error('store_id_required');

  return runInTransaction(db, () => {
    const existing = getLocalShift(db, storeId);
    if (!existing?.id) throw new Error('shift_not_open');
    const at = clock();
    const shift = {
      ...existing,
      status: 'CLOSED',
      closingCash: Number(input.closingCash) || 0,
      closedAt: at,
      _local: true,
    };
    saveLocalShift(db, storeId, null);
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });
    const event = outbox.enqueue({
      deviceId,
      eventType: 'SHIFT_CLOSE',
      payload: {
        shiftId: existing.id,
        storeId,
        closingCash: shift.closingCash,
        closedAt: at,
      },
    });
    return { shift, outboxId: event.id, clientEventId: event.clientEventId };
  });
}

module.exports = { openShiftCommand, closeShiftCommand };
