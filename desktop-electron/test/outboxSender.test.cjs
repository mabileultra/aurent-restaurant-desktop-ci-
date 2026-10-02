const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema, createOutboxRepo } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const {
  createOutboxSender,
  outboxBackoffMs,
  recoverStaleSending,
} = require('../electron/restaurant-offline/sync/index.cjs');
const { OUTBOX_STATUS } = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run(
    'POS-01',
    't',
    '2026-10-03T04:00:00.000Z',
  );
  return db;
}

test('D1 backoff grows and caps', () => {
  assert.equal(outboxBackoffMs(1), 1000);
  assert.equal(outboxBackoffMs(2), 2000);
  assert.equal(outboxBackoffMs(3), 4000);
  assert.ok(outboxBackoffMs(20) <= 5 * 60_000);
});

test('D1 sender PENDING → SYNCED on ACCEPTED', async () => {
  const db = await readyDb();
  const clock = () => '2026-10-03T04:00:00.000Z';
  const outbox = createOutboxRepo(db, { idFactory: () => 'ob-1', clock, uuid: () => 'evt-1' });
  outbox.enqueue({
    deviceId: 'POS-01',
    eventType: 'ORDER_SEND_KITCHEN',
    payload: { orderId: 'o1' },
  });

  const calls = [];
  const sender = createOutboxSender(db, {
    clock,
    sendEvent: async (body) => {
      calls.push(body);
      return { outcome: 'ACCEPTED' };
    },
  });

  const { results } = await sender.tick();
  assert.equal(results[0].status, OUTBOX_STATUS.SYNCED);
  assert.equal(calls[0].clientEventId, 'evt-1');
  assert.equal(db.prepare(`SELECT status FROM outbox WHERE id = ?`).get('ob-1').status, OUTBOX_STATUS.SYNCED);
  db.close();
});

test('D1 ALREADY_PROCESSED also marks SYNCED (idempotent retry)', async () => {
  const db = await readyDb();
  const clock = () => '2026-10-03T04:00:00.000Z';
  createOutboxRepo(db, { idFactory: () => 'ob-2', clock, uuid: () => 'evt-2' }).enqueue({
    deviceId: 'POS-01',
    eventType: 'ORDER_SEND_KITCHEN',
    payload: {},
  });

  const sender = createOutboxSender(db, {
    clock,
    sendEvent: async () => ({ outcome: 'ALREADY_PROCESSED' }),
  });
  const { results } = await sender.tick();
  assert.equal(results[0].status, OUTBOX_STATUS.SYNCED);
  assert.equal(results[0].outcome, 'ALREADY_PROCESSED');
  db.close();
});

test('D1 network error → RETRY with next_retry_at; later tick after backoff', async () => {
  const db = await readyDb();
  let now = '2026-10-03T04:00:00.000Z';
  createOutboxRepo(db, {
    idFactory: () => 'ob-3',
    clock: () => now,
    uuid: () => 'evt-3',
  }).enqueue({
    deviceId: 'POS-01',
    eventType: 'ORDER_SEND_KITCHEN',
    payload: {},
  });

  let fails = 1;
  const sender = createOutboxSender(db, {
    clock: () => now,
    sendEvent: async () => {
      if (fails > 0) {
        fails -= 1;
        throw new Error('network down');
      }
      return { outcome: 'ACCEPTED' };
    },
  });

  const first = await sender.tick();
  assert.equal(first.results[0].status, OUTBOX_STATUS.RETRY);
  const row = db.prepare(`SELECT * FROM outbox WHERE id = ?`).get('ob-3');
  assert.equal(row.status, OUTBOX_STATUS.RETRY);
  assert.ok(row.next_retry_at);

  // Too early — should not claim
  now = '2026-10-03T04:00:00.500Z';
  const early = await sender.tick();
  assert.equal(early.results.length, 0);

  // After backoff window
  now = row.next_retry_at;
  const second = await sender.tick();
  assert.equal(second.results[0].status, OUTBOX_STATUS.SYNCED);
  db.close();
});

test('D1 stale SENDING → RETRY on recover', async () => {
  const db = await readyDb();
  const clock = () => '2026-10-03T04:05:00.000Z';
  createOutboxRepo(db, { idFactory: () => 'ob-4', clock: () => '2026-10-03T04:00:00.000Z', uuid: () => 'evt-4' })
    .enqueue({ deviceId: 'POS-01', eventType: 'X', payload: {} });
  db.prepare(`UPDATE outbox SET status = ?, sent_at = ?, attempt_count = 1 WHERE id = ?`).run(
    OUTBOX_STATUS.SENDING,
    '2026-10-03T04:00:00.000Z',
    'ob-4',
  );

  const { promoted } = recoverStaleSending(db, {
    nowMs: Date.parse('2026-10-03T04:05:00.000Z'),
    staleAfterMs: 45_000,
    clock,
  });
  assert.deepEqual(promoted, ['ob-4']);
  assert.equal(db.prepare(`SELECT status FROM outbox WHERE id = ?`).get('ob-4').status, OUTBOX_STATUS.RETRY);
  db.close();
});
