const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_STATUS,
  canTransitionOrder,
  assertOrderTransition,
  isTerminalOrder,
  PRINT_JOB_STATUS,
  canTransitionPrintJob,
  assertPrintJobTransition,
  resolveStalePrinting,
  allowsAutoPrintRetry,
  OUTBOX_STATUS,
  canTransitionOutbox,
  isOutboxClaimable,
  sendToKitchenTxPlan,
  workerMayWrite,
  createClientEventId,
  idempotencyKey,
  PRINT_JOB_KIND,
  buildPrintJobPayload,
} = require('../electron/restaurant-offline/domain/index.cjs');

describe('B0 order status', () => {
  it('allows OPEN → ACTIVE → PAID', () => {
    assert.equal(canTransitionOrder(ORDER_STATUS.OPEN, ORDER_STATUS.ACTIVE), true);
    assert.equal(canTransitionOrder(ORDER_STATUS.ACTIVE, ORDER_STATUS.PAID), true);
    assert.equal(isTerminalOrder(ORDER_STATUS.PAID), true);
  });

  it('forbids PAID → ACTIVE', () => {
    assert.equal(canTransitionOrder(ORDER_STATUS.PAID, ORDER_STATUS.ACTIVE), false);
    assert.throws(() => assertOrderTransition(ORDER_STATUS.PAID, ORDER_STATUS.ACTIVE));
  });
});

describe('B0 print job status', () => {
  it('PENDING → PRINTING → PRINTED|FAILED|UNKNOWN', () => {
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.PENDING, PRINT_JOB_STATUS.PRINTING), true);
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.PRINTING, PRINT_JOB_STATUS.PRINTED), true);
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.PRINTING, PRINT_JOB_STATUS.FAILED), true);
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.PRINTING, PRINT_JOB_STATUS.UNKNOWN), true);
  });

  it('forbids PENDING → PRINTED and UNKNOWN → PRINTING', () => {
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.PENDING, PRINT_JOB_STATUS.PRINTED), false);
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.UNKNOWN, PRINT_JOB_STATUS.PRINTING), false);
    assert.throws(() => assertPrintJobTransition(PRINT_JOB_STATUS.UNKNOWN, PRINT_JOB_STATUS.PRINTING));
  });

  it('stale PRINTING becomes UNKNOWN, not PENDING', () => {
    assert.equal(
      resolveStalePrinting(PRINT_JOB_STATUS.PRINTING, 0, 10_000, 5_000),
      PRINT_JOB_STATUS.UNKNOWN,
    );
    assert.equal(
      resolveStalePrinting(PRINT_JOB_STATUS.PRINTING, 8_000, 10_000, 5_000),
      PRINT_JOB_STATUS.PRINTING,
    );
  });

  it('auto-retry only for PENDING', () => {
    assert.equal(allowsAutoPrintRetry(PRINT_JOB_STATUS.PENDING), true);
    assert.equal(allowsAutoPrintRetry(PRINT_JOB_STATUS.UNKNOWN), false);
    assert.equal(allowsAutoPrintRetry(PRINT_JOB_STATUS.FAILED), false);
  });

  it('explicit resolve: UNKNOWN → PENDING|PRINTED|FAILED; FAILED → PENDING', () => {
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.UNKNOWN, PRINT_JOB_STATUS.PENDING), true);
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.UNKNOWN, PRINT_JOB_STATUS.PRINTED), true);
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.UNKNOWN, PRINT_JOB_STATUS.FAILED), true);
    assert.equal(canTransitionPrintJob(PRINT_JOB_STATUS.FAILED, PRINT_JOB_STATUS.PENDING), true);
  });
});

describe('B0 outbox status', () => {
  it('PENDING → SENDING → SYNCED|RETRY → SENDING', () => {
    assert.equal(canTransitionOutbox(OUTBOX_STATUS.PENDING, OUTBOX_STATUS.SENDING), true);
    assert.equal(canTransitionOutbox(OUTBOX_STATUS.SENDING, OUTBOX_STATUS.SYNCED), true);
    assert.equal(canTransitionOutbox(OUTBOX_STATUS.SENDING, OUTBOX_STATUS.RETRY), true);
    assert.equal(canTransitionOutbox(OUTBOX_STATUS.RETRY, OUTBOX_STATUS.SENDING), true);
    assert.equal(isOutboxClaimable(OUTBOX_STATUS.PENDING), true);
    assert.equal(isOutboxClaimable(OUTBOX_STATUS.RETRY), true);
    assert.equal(isOutboxClaimable(OUTBOX_STATUS.SENDING), false);
  });
});

describe('B0 tx boundary', () => {
  it('send-to-kitchen TX includes order + print_job + outbox', () => {
    const plan = sendToKitchenTxPlan();
    assert.ok(plan.tables.includes('print_jobs'));
    assert.ok(plan.tables.includes('outbox'));
    assert.ok(plan.tables.includes('orders') || plan.tables.includes('order_items'));
  });

  it('workers cannot write orders', () => {
    assert.equal(workerMayWrite('print', 'orders'), false);
    assert.equal(workerMayWrite('print', 'print_jobs'), true);
    assert.equal(workerMayWrite('sync', 'orders'), false);
    assert.equal(workerMayWrite('sync', 'outbox'), true);
  });
});

describe('B0 clientEventId', () => {
  it('requires deviceId and builds idempotency key', () => {
    assert.throws(() => createClientEventId({ deviceId: '' }));
    const ev = createClientEventId({ deviceId: 'POS-01', uuid: () => 'evt-1' });
    assert.deepEqual(ev, { deviceId: 'POS-01', clientEventId: 'evt-1' });
    assert.equal(idempotencyKey(ev), 'POS-01:evt-1');
  });
});

describe('B0 print payload snapshot', () => {
  it('freezes kitchen snapshot and rejects empty items', () => {
    const payload = buildPrintJobPayload({
      kind: PRINT_JOB_KIND.KITCHEN_SEND,
      orderId: 'ord-1',
      printerName: 'Oshxona',
      tableLabel: 'T1',
      items: [{ name: 'Кола', qty: 2 }],
      createdAt: '2026-10-03T00:00:00.000Z',
    });
    assert.equal(payload.items[0].qty, 2);
    assert.throws(() => {
      payload.items.push({ name: 'x', qty: 1 });
    });
    assert.throws(() => buildPrintJobPayload({
      kind: PRINT_JOB_KIND.KITCHEN_SEND,
      orderId: 'ord-1',
      printerName: 'Oshxona',
      items: [],
    }));
  });

  it('does not change when order would later differ (snapshot identity)', () => {
    const snap = buildPrintJobPayload({
      kind: PRINT_JOB_KIND.CATEGORY_SLIP,
      orderId: 'ord-1',
      printerName: 'Salat',
      items: [{ name: 'Бургер', qty: 1 }],
      createdAt: '2026-10-03T00:00:00.000Z',
    });
    assert.equal(snap.items[0].qty, 1);
    // Later order becomes qty 2 — existing job payload stays 1.
    assert.equal(JSON.parse(JSON.stringify(snap)).items[0].qty, 1);
  });
});
