/**
 * Phase E — Failure & recovery matrix (vertical slice gate).
 * Local TX never depends on WAN; print ≠ sync; no auto-reprint UNKNOWN; idempotent sync.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { sendToKitchenCommand } = require('../electron/restaurant-offline/commands/index.cjs');
const { createPrintWorker, recoverStalePrintingJobs } = require('../electron/restaurant-offline/print/index.cjs');
const { createOutboxSender, recoverStaleSending } = require('../electron/restaurant-offline/sync/index.cjs');
const {
  ORDER_STATUS,
  PRINT_JOB_STATUS,
  OUTBOX_STATUS,
  allowsAutoPrintRetry,
} = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T05:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-01', 't', now);
  db.prepare(`INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`).run(
    'tbl-1',
    1,
    'T1',
    now,
  );
  return db;
}

function ids(prefix) {
  let n = 0;
  return {
    idFactory: () => `${prefix}-${++n}`,
    clock: () => '2026-10-03T05:00:00.000Z',
    uuid: () => `${prefix}-evt`,
  };
}

function sendKitchen(db, deps, extra = {}) {
  return sendToKitchenCommand(
    db,
    {
      deviceId: 'POS-01',
      storeId: 1,
      tableId: 'tbl-1',
      tableLabel: 'T1',
      printerName: 'Oshxona',
      items: [{ name: 'Кола', qty: 2 }],
      ...extra,
    },
    deps,
  );
}

test('E1: WAN down before op — local TX still commits order+print+outbox', async () => {
  const db = await readyDb();
  const result = sendKitchen(db, ids('e1'));
  assert.ok(result.orderId);
  assert.equal(db.prepare(`SELECT status FROM orders WHERE id = ?`).get(result.orderId).status, ORDER_STATUS.ACTIVE);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(result.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(result.outboxId).status,
    OUTBOX_STATUS.PENDING,
  );
  db.close();
});

test('E2: flap during sync — fail then ACCEPTED; no duplicate business on ALREADY_PROCESSED', async () => {
  const db = await readyDb();
  let now = '2026-10-03T05:00:00.000Z';
  const sent = sendKitchen(db, {
    idFactory: (() => {
      let n = 0;
      return () => `e2-${++n}`;
    })(),
    clock: () => now,
    uuid: () => 'e2-evt',
  });

  const serverSeen = new Set();
  let failOnce = true;
  const sender = createOutboxSender(db, {
    clock: () => now,
    sendEvent: async (body) => {
      if (failOnce) {
        failOnce = false;
        throw new Error('API timeout');
      }
      const key = `${body.deviceId}:${body.clientEventId}`;
      if (serverSeen.has(key)) return { outcome: 'ALREADY_PROCESSED' };
      serverSeen.add(key);
      return { outcome: 'ACCEPTED' };
    },
  });

  const first = await sender.tick();
  assert.equal(first.results[0].status, OUTBOX_STATUS.RETRY);
  const retryAt = db.prepare(`SELECT next_retry_at FROM outbox WHERE id = ?`).get(sent.outboxId).next_retry_at;
  now = retryAt;

  const second = await sender.tick();
  assert.equal(second.results[0].status, OUTBOX_STATUS.SYNCED);
  assert.equal(serverSeen.size, 1);

  // Lost response: client requeues same row (raw — simulates unsure client) and retries.
  db.prepare(
    `UPDATE outbox SET status = ?, synced_at = NULL, next_retry_at = NULL WHERE id = ?`,
  ).run(OUTBOX_STATUS.PENDING, sent.outboxId);

  const third = await sender.tick();
  assert.equal(third.results[0].status, OUTBOX_STATUS.SYNCED);
  assert.equal(third.results[0].outcome, 'ALREADY_PROCESSED');
  assert.equal(serverSeen.size, 1);
  db.close();
});

test('E3: kill Electron mid-print — recover to UNKNOWN, no auto second slip', async () => {
  const db = await readyDb();
  const sent = sendKitchen(db, ids('e3'));
  db.prepare(`UPDATE print_jobs SET status = ?, started_at = ? WHERE id = ?`).run(
    PRINT_JOB_STATUS.PRINTING,
    '2026-10-03T05:00:00.000Z',
    sent.printJobId,
  );

  const prints = [];
  const worker = createPrintWorker(db, {
    clock: () => '2026-10-03T05:01:00.000Z',
    nowMs: () => Date.parse('2026-10-03T05:01:00.000Z'),
    staleAfterMs: 30_000,
    printTicket: async (t) => {
      prints.push(t);
    },
  });

  await worker.tick();
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.UNKNOWN,
  );
  assert.equal(prints.length, 0);
  assert.equal(allowsAutoPrintRetry(PRINT_JOB_STATUS.UNKNOWN), false);

  const again = await worker.tick();
  assert.equal(again.results.length, 0);
  assert.equal(prints.length, 0);
  db.close();
});

test('E4: Windows reboot simulation — PENDING print + outbox survive reopen', async () => {
  const db = await readyDb();
  const sent = sendKitchen(db, ids('e4'));
  // "reboot": only SQLite state matters — re-open queries
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM print_jobs WHERE status = ?`).get(PRINT_JOB_STATUS.PENDING).c, 1);
  assert.equal(db.prepare(`SELECT COUNT(*) AS c FROM outbox WHERE status = ?`).get(OUTBOX_STATUS.PENDING).c, 1);
  assert.equal(db.prepare(`SELECT status FROM orders WHERE id = ?`).get(sent.orderId).status, ORDER_STATUS.ACTIVE);

  const prints = [];
  const worker = createPrintWorker(db, {
    clock: () => '2026-10-03T05:00:01.000Z',
    printTicket: async (t) => {
      prints.push(t);
    },
  });
  await worker.tick();
  assert.equal(prints.length, 1);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );
  db.close();
});

test('E5: printer off / USB loss → FAILED; job not lost; no auto-retry', async () => {
  const db = await readyDb();
  const sent = sendKitchen(db, ids('e5'));
  const worker = createPrintWorker(db, {
    clock: () => '2026-10-03T05:00:01.000Z',
    printTicket: async () => {
      throw new Error('USB printer disconnected');
    },
  });
  await worker.tick();
  const row = db.prepare(`SELECT status, last_error FROM print_jobs WHERE id = ?`).get(sent.printJobId);
  assert.equal(row.status, PRINT_JOB_STATUS.FAILED);
  assert.match(row.last_error, /USB|disconnected/i);
  const again = await worker.tick();
  assert.equal(again.results.length, 0);
  // Explicit reprint path only
  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(PRINT_JOB_STATUS.PENDING, sent.printJobId);
  let ok = false;
  const worker2 = createPrintWorker(db, {
    clock: () => '2026-10-03T05:00:02.000Z',
    printTicket: async () => {
      ok = true;
    },
  });
  await worker2.tick();
  assert.equal(ok, true);
  db.close();
});

test('E6: API 500 then success — outbox retries safely', async () => {
  const db = await readyDb();
  let now = '2026-10-03T05:00:00.000Z';
  const sent = sendKitchen(db, {
    idFactory: (() => {
      let n = 0;
      return () => `e6-${++n}`;
    })(),
    clock: () => now,
    uuid: () => 'e6-evt',
  });

  let calls = 0;
  const sender = createOutboxSender(db, {
    clock: () => now,
    sendEvent: async () => {
      calls += 1;
      if (calls === 1) throw new Error('API 500');
      return { outcome: 'ACCEPTED' };
    },
  });
  await sender.tick();
  now = db.prepare(`SELECT next_retry_at FROM outbox WHERE id = ?`).get(sent.outboxId).next_retry_at;
  await sender.tick();
  assert.equal(calls, 2);
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(sent.outboxId).status,
    OUTBOX_STATUS.SYNCED,
  );
  db.close();
});

test('E7: double sendEvent same clientEventId — one business accept', async () => {
  const db = await readyDb();
  sendKitchen(db, ids('e7a'));
  // Second outbox row with SAME client event id is blocked by UNIQUE — insert different id but same key fails:
  assert.throws(() => {
    db.prepare(
      `INSERT INTO outbox(id, device_id, client_event_id, event_type, status, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      'e7-dup',
      'POS-01',
      'e7a-evt',
      'ORDER_SEND_KITCHEN',
      OUTBOX_STATUS.PENDING,
      '{}',
      '2026-10-03T05:00:00.000Z',
    );
  });

  const accepted = new Set();
  const sender = createOutboxSender(db, {
    clock: () => '2026-10-03T05:00:00.000Z',
    sendEvent: async (body) => {
      const key = `${body.deviceId}:${body.clientEventId}`;
      if (accepted.has(key)) return { outcome: 'ALREADY_PROCESSED' };
      accepted.add(key);
      return { outcome: 'ACCEPTED' };
    },
  });
  await sender.tick();
  await sender.tick();
  assert.equal(accepted.size, 1);
  db.close();
});

test('E8: end-to-end happy path print + sync independent', async () => {
  const db = await readyDb();
  const sent = sendKitchen(db, ids('e8'));

  const worker = createPrintWorker(db, {
    clock: () => '2026-10-03T05:00:01.000Z',
    printTicket: async () => {},
  });
  await worker.tick();

  const sender = createOutboxSender(db, {
    clock: () => '2026-10-03T05:00:02.000Z',
    sendEvent: async () => ({ outcome: 'ACCEPTED' }),
  });
  await sender.tick();

  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(sent.outboxId).status,
    OUTBOX_STATUS.SYNCED,
  );
  // Print succeeded even if we imagine sync failed earlier — statuses independent
  assert.notEqual(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(sent.outboxId).status,
  );
  db.close();
});

test('E9: mid-SENDING crash → RETRY then SYNCED without losing event', async () => {
  const db = await readyDb();
  const sent = sendKitchen(db, ids('e9'));
  db.prepare(`UPDATE outbox SET status = ?, sent_at = ?, attempt_count = 1 WHERE id = ?`).run(
    OUTBOX_STATUS.SENDING,
    '2026-10-03T05:00:00.000Z',
    sent.outboxId,
  );

  recoverStaleSending(db, {
    nowMs: Date.parse('2026-10-03T05:02:00.000Z'),
    staleAfterMs: 45_000,
    clock: () => '2026-10-03T05:02:00.000Z',
  });
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(sent.outboxId).status,
    OUTBOX_STATUS.RETRY,
  );

  let now = db.prepare(`SELECT next_retry_at FROM outbox WHERE id = ?`).get(sent.outboxId).next_retry_at;
  const sender = createOutboxSender(db, {
    clock: () => now,
    sendEvent: async () => ({ outcome: 'ACCEPTED' }),
  });
  await sender.tick();
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(sent.outboxId).status,
    OUTBOX_STATUS.SYNCED,
  );
  db.close();
});

test('E10: recoverStalePrinting does not touch PENDING jobs', async () => {
  const db = await readyDb();
  const sent = sendKitchen(db, ids('e10'));
  const { promoted } = recoverStalePrintingJobs(db, {
    nowMs: Date.now() + 120_000,
    staleAfterMs: 30_000,
    clock: () => '2026-10-03T05:05:00.000Z',
  });
  assert.equal(promoted.length, 0);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );
  db.close();
});

test('E11: UNKNOWN manual ACK does not auto-reprint; REQUEUE is explicit', async () => {
  const db = await readyDb();
  const sent = sendKitchen(db, ids('e11'));
  const {
    resolvePrintJobCommand,
    ACTIONS,
  } = require('../electron/restaurant-offline/print/resolvePrintJob.cjs');

  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(
    PRINT_JOB_STATUS.UNKNOWN,
    sent.printJobId,
  );
  resolvePrintJobCommand(db, { jobId: sent.printJobId, action: ACTIONS.ACK_PRINTED });
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS c FROM print_jobs WHERE order_id = ?`).get(
      db.prepare(`SELECT order_id FROM print_jobs WHERE id = ?`).get(sent.printJobId).order_id,
    ).c,
    1,
  );

  const sent2 = sendKitchen(db, ids('e11b'), { orderId: 'e11b-order' });
  db.prepare(`UPDATE print_jobs SET status = ? WHERE id = ?`).run(
    PRINT_JOB_STATUS.UNKNOWN,
    sent2.printJobId,
  );
  resolvePrintJobCommand(db, { jobId: sent2.printJobId, action: ACTIONS.REQUEUE });
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent2.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );
  db.close();
});
