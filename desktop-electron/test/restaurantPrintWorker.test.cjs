const test = require('node:test');
const assert = require('node:assert/strict');

const { applyRestaurantOfflineSchema } = require('../electron/restaurant-offline/db/index.cjs');
const { openSqlJsMemoryDb } = require('../electron/restaurant-offline/db/sqlJsMemoryDb.cjs');
const { sendToKitchenCommand } = require('../electron/restaurant-offline/commands/index.cjs');
const {
  createPrintWorker,
  recoverStalePrintingJobs,
  payloadToTicketLines,
} = require('../electron/restaurant-offline/print/index.cjs');
const {
  PRINT_JOB_STATUS,
  ORDER_STATUS,
  allowsAutoPrintRetry,
} = require('../electron/restaurant-offline/domain/index.cjs');

async function seedSend(db, deps) {
  return sendToKitchenCommand(
    db,
    {
      deviceId: 'POS-01',
      storeId: 1,
      tableId: 'tbl-1',
      tableLabel: 'T1',
      printerName: 'Oshxona',
      items: [{ name: 'Кола', qty: 2 }],
    },
    deps,
  );
}

async function readyDb() {
  const db = await openSqlJsMemoryDb();
  applyRestaurantOfflineSchema(db);
  const now = '2026-10-03T03:00:00.000Z';
  db.prepare(`INSERT INTO devices(device_id, label, created_at) VALUES (?, ?, ?)`).run('POS-01', 't', now);
  db.prepare(`INSERT INTO floor_tables(id, store_id, name, updated_at) VALUES (?, ?, ?, ?)`).run(
    'tbl-1',
    1,
    'T1',
    now,
  );
  return db;
}

test('C4 PrintWorker PENDING → PRINTING → PRINTED', async () => {
  const db = await readyDb();
  let n = 0;
  const sent = await seedSend(db, {
    idFactory: () => `pw-${++n}`,
    clock: () => '2026-10-03T03:00:00.000Z',
    uuid: () => 'evt-pw-1',
  });

  const printed = [];
  const worker = createPrintWorker(db, {
    clock: () => '2026-10-03T03:00:01.000Z',
    printTicket: async (ticket) => {
      printed.push(ticket);
    },
  });

  const { results } = await worker.tick();
  assert.equal(results.length, 1);
  assert.equal(results[0].status, PRINT_JOB_STATUS.PRINTED);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.PRINTED,
  );
  assert.equal(printed[0].printerName, 'Oshxona');
  assert.ok(printed[0].lines.some((l) => l.includes('Кола')));
  // Worker must not touch orders
  assert.equal(
    db.prepare(`SELECT status FROM orders WHERE id = ?`).get(sent.orderId).status,
    ORDER_STATUS.ACTIVE,
  );
  db.close();
});

test('C4 printer error → FAILED (manual reprint only)', async () => {
  const db = await readyDb();
  let n = 0;
  const sent = await seedSend(db, {
    idFactory: () => `fl-${++n}`,
    clock: () => '2026-10-03T03:00:00.000Z',
    uuid: () => 'evt-fl-1',
  });

  const worker = createPrintWorker(db, {
    clock: () => '2026-10-03T03:00:01.000Z',
    printTicket: async () => {
      throw new Error('Принтер не найден');
    },
  });

  const { results } = await worker.tick();
  assert.equal(results[0].status, PRINT_JOB_STATUS.FAILED);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.FAILED,
  );
  assert.equal(allowsAutoPrintRetry(PRINT_JOB_STATUS.FAILED), false);

  // Second tick must not auto-retry FAILED
  const again = await worker.tick();
  assert.equal(again.results.length, 0);
  db.close();
});

test('C4 timeout mid-print → UNKNOWN, no auto-retry', async () => {
  const db = await readyDb();
  let n = 0;
  const sent = await seedSend(db, {
    idFactory: () => `un-${++n}`,
    clock: () => '2026-10-03T03:00:00.000Z',
    uuid: () => 'evt-un-1',
  });

  const worker = createPrintWorker(db, {
    clock: () => '2026-10-03T03:00:01.000Z',
    printTicket: async () => {
      throw new Error('Таймаут печать (12с)');
    },
  });

  const { results } = await worker.tick();
  assert.equal(results[0].status, PRINT_JOB_STATUS.UNKNOWN);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.UNKNOWN,
  );
  const again = await worker.tick();
  assert.equal(again.results.length, 0);
  db.close();
});

test('C5 recoverStalePrinting: PRINTING → UNKNOWN, never PENDING', async () => {
  const db = await readyDb();
  let n = 0;
  const sent = await seedSend(db, {
    idFactory: () => `st-${++n}`,
    clock: () => '2026-10-03T03:00:00.000Z',
    uuid: () => 'evt-st-1',
  });

  // Simulate crash mid-print: stuck in PRINTING
  db.prepare(
    `UPDATE print_jobs SET status = ?, started_at = ? WHERE id = ?`,
  ).run(PRINT_JOB_STATUS.PRINTING, '2026-10-03T03:00:00.000Z', sent.printJobId);

  const startedMs = Date.parse('2026-10-03T03:00:00.000Z');
  const { promoted } = recoverStalePrintingJobs(db, {
    nowMs: startedMs + 60_000,
    staleAfterMs: 30_000,
    clock: () => '2026-10-03T03:01:00.000Z',
  });
  assert.deepEqual(promoted, [sent.printJobId]);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent.printJobId).status,
    PRINT_JOB_STATUS.UNKNOWN,
  );

  // Fresh PRINTING within window stays PRINTING
  let m = 0;
  const sent2 = await seedSend(db, {
    idFactory: () => `st2-${++m}`,
    clock: () => '2026-10-03T03:02:00.000Z',
    uuid: () => 'evt-st-2',
  });
  db.prepare(
    `UPDATE print_jobs SET status = ?, started_at = ? WHERE id = ?`,
  ).run(PRINT_JOB_STATUS.PRINTING, '2026-10-03T03:02:00.000Z', sent2.printJobId);
  const fresh = recoverStalePrintingJobs(db, {
    nowMs: Date.parse('2026-10-03T03:02:00.000Z') + 5_000,
    staleAfterMs: 30_000,
    clock: () => '2026-10-03T03:02:05.000Z',
  });
  assert.equal(fresh.promoted.length, 0);
  assert.equal(
    db.prepare(`SELECT status FROM print_jobs WHERE id = ?`).get(sent2.printJobId).status,
    PRINT_JOB_STATUS.PRINTING,
  );
  db.close();
});

test('C4 payloadToTicketLines uses snapshot only', () => {
  const ticket = payloadToTicketLines({
    kind: 'KITCHEN_SEND',
    orderId: 'o1',
    printerName: 'Oshxona',
    tableLabel: 'T1',
    items: [{ name: 'Бургер', qty: 1 }],
  });
  assert.equal(ticket.printerName, 'Oshxona');
  assert.ok(ticket.lines.some((l) => l.includes('Бургер')));
});
