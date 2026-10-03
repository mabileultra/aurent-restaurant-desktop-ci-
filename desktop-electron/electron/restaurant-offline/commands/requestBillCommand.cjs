/**
 * Local request bill → status BILLING + optional GUEST_BILL print_job + outbox.
 */
const { randomUUID } = require('node:crypto');
const { ORDER_STATUS, isTerminalOrder } = require('../domain/orderStatus.cjs');
const { PRINT_JOB_KIND } = require('../domain/printJobPayload.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo, createOrderItemRepo } = require('../db/orderRepos.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');
const { createPrintJobRepo } = require('../db/printJobRepo.cjs');
const { toUiOrder } = require('./openOrderCommand.cjs');

function requestBillCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  const orderId = String(input?.orderId || '').trim();
  if (!deviceId) throw new Error('device_id_required');
  if (!orderId) throw new Error('order_id_required');

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const items = createOrderItemRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });
    const prints = createPrintJobRepo(db, { idFactory, clock });

    const order = orders.getById(orderId);
    if (!order) throw new Error(`order_not_found:${orderId}`);
    if (isTerminalOrder(order.status)) throw new Error(`order_terminal:${order.status}`);

    const lines = items.listByOrder(orderId);
    const billable = (lines || []).filter((i) => i.status !== 'CANCELLED');
    if (!billable.length) throw new Error('no_billable_items');

    if (order.status === ORDER_STATUS.BILLING) {
      return {
        orderId,
        already: true,
        status: ORDER_STATUS.BILLING,
        order: toUiOrder(db, orderId),
      };
    }

    if (order.status === ORDER_STATUS.OPEN) {
      orders.transitionStatus(orderId, ORDER_STATUS.ACTIVE);
    }
    orders.transitionStatus(orderId, ORDER_STATUS.BILLING);

    const printerName = String(input.printerName || '').trim();
    let meta = {};
    try {
      meta = JSON.parse(order.payload_json || '{}');
    } catch {
      meta = {};
    }
    const snapItems = billable.map((i) => {
      let modifiers = [];
      try {
        modifiers = JSON.parse(i.modifiers_json || '[]');
      } catch {
        modifiers = [];
      }
      return {
        name: i.name,
        qty: Number(i.quantity) || 0,
        unitPrice: Number(i.unit_price) || 0,
        portionText: i.portion_text || null,
        note: i.note || null,
        modifiers,
      };
    });
    const jobInput = {
      kind: PRINT_JOB_KIND.GUEST_BILL,
      orderId,
      printerName,
      tableLabel: input.tableLabel || meta.tableCode || '',
      items: snapItems,
    };
    const printOk = Boolean(printerName);
    const job = printOk
      ? prints.insertPending(jobInput)
      : prints.insertFailed(jobInput, 'bill_printer_not_configured');

    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_REQUEST_BILL',
      clientEventId: input.clientEventId || null,
      payload: { orderId, printJobId: job.id },
    });

    return {
      orderId,
      status: ORDER_STATUS.BILLING,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      printJobId: job.id,
      printOk,
      order: toUiOrder(db, orderId),
    };
  });
}

module.exports = { requestBillCommand };
