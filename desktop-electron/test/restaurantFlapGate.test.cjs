/**
 * Flap gate: print must not wait on WAN (the 30–40s classic claim symptom).
 * F1 offline print then sync; F2 kill/restart pending print; F3 print while API dead.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { sendToKitchenCommand } = require('../electron/restaurant-offline/commands/index.cjs');
const { createPrintWorker } = require('../electron/restaurant-offline/print/index.cjs');
const { createOutboxSender } = require('../electron/restaurant-offline/sync/index.cjs');
const {
  PRINT_JOB_STATUS,
  OUTBOX_STATUS,
} = require('../electron/restaurant-offline/domain/index.cjs');

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T06:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-F', 't', now);
  db.prepare(`INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`).run(
    'tbl-f',
    1,
    'T1',
    now,
  );
  return db;
}

function send(db, prefix, clock, extra = {}) {
  let n = 0;
  return sendToKitchenCommand(
    db,
    {
      deviceId: 'POS-F',
      storeId: 1,
      tableId: 'tbl-f',
      tableLabel: 'T1',
      printerName: 'Oshxona',
      items: [{ name: 'Плов', qty: 1 }],
      ...extra,
    },
    {
      idFactory: () => `${prefix}-${++n}`,
      clock,
      uuid: () => `${prefix}-evt`,
    },
  );
}

test('F1: Send → OFFLINE print locally → ONLINE sync (print ≠ WAN)', async () => {
  const db = await readyDb();
  let now = '2026-10-03T06:00:00.000Z';
  const clock = () => now;
  const sent = send(db, 'f1', clock);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );

  const prints = [];
  const printWorker = createPrintWorker(db, {
    printTicket: async (t) => {
      prints.push(t);
    },
    clock,
  });
  await printWorker.tick();
  assert.equal(prints.length, 1);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );

  let failOnce = true;
  const sender = createOutboxSender(db, {
    clock,
    sendEvent: async () => {
      if (failOnce) {
        failOnce = false;
        throw new Error('ENOTFOUND');
      }
      return { outcome: 'ACCEPTED' };
    },
  });

  // First tick: WAN down → RETRY
  const first = await sender.tick();
  assert.equal(first.results[0].status, OUTBOX_STATUS.RETRY);
  now = db.prepare(`SELECT next_retry_at FROM outbox WHERE id = ?`).get(sent.outboxId).next_retry_at;

  const second = await sender.tick();
  assert.equal(second.results[0].status, OUTBOX_STATUS.SYNCED);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );
  db.close();
});

test('F2: Send → OFFLINE → kill Electron → restart → print pending → ONLINE sync', async () => {
  const db = await readyDb();
  let now = '2026-10-03T06:00:00.000Z';
  const clock = () => now;
  const sent = send(db, 'f2', clock);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PENDING,
  );

  // Restart: new worker claims PENDING from same DB.
  const prints = [];
  const printWorker = createPrintWorker(db, {
    printTicket: async (t) => {
      prints.push(t);
    },
    clock,
  });
  await printWorker.tick();
  assert.equal(prints.length, 1);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );

  const sender = createOutboxSender(db, {
    clock,
    sendEvent: async () => ({ outcome: 'ACCEPTED' }),
  });
  await sender.tick();
  assert.equal(
    db.prepare(`SELECT status FROM outbox WHERE id = ?`).get(sent.outboxId).status,
    OUTBOX_STATUS.SYNCED,
  );
  db.close();
});

test('F3: COMMIT → API unavailable → printer still prints → internet returns → outbox sync', async () => {
  const db = await readyDb();
  let now = '2026-10-03T06:00:00.000Z';
  const clock = () => now;
  const sent = send(db, 'f3', clock);
  assert.equal(sent.printOk, true);

  let apiCalls = 0;
  const sender = createOutboxSender(db, {
    clock,
    sendEvent: async () => {
      apiCalls += 1;
      if (apiCalls === 1) throw new Error('API unavailable');
      return { outcome: 'ACCEPTED' };
    },
  });

  const prints = [];
  const printWorker = createPrintWorker(db, {
    printTicket: async (t) => {
      prints.push(t);
    },
    clock,
  });

  await printWorker.tick();
  assert.equal(prints.length, 1);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );

  const first = await sender.tick();
  assert.equal(first.results[0].status, OUTBOX_STATUS.RETRY);
  now = db.prepare(`SELECT next_retry_at FROM outbox WHERE id = ?`).get(sent.outboxId).next_retry_at;

  const second = await sender.tick();
  assert.equal(second.results[0].status, OUTBOX_STATUS.SYNCED);
  assert.equal(apiCalls, 2);
  assert.equal(prints.length, 1);
  db.close();
});
