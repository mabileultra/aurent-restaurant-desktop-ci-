/**
 * C3 — send-to-kitchen local command.
 * ONE SQLite TX: order ACTIVE + items + print_job(snapshot) + outbox.
 * Does not print or sync — workers run after COMMIT.
 *
 * Waiter hub path: ADD already inserted OPEN lines — SEND must mark them SENT,
 * not insert another copy (that caused endless duplicate dishes on desktop).
 */

const { randomUUID } = require('node:crypto');
const { ORDER_STATUS } = require('../domain/orderStatus.cjs');
const { PRINT_JOB_KIND } = require('../domain/printJobPayload.cjs');
const { runInTransaction } = require('../db/tx.cjs');
const { createOrderRepo, createOrderItemRepo } = require('../db/orderRepos.cjs');
const { createPrintJobRepo } = require('../db/printJobRepo.cjs');
const { createOutboxRepo } = require('../db/outboxRepo.cjs');

function snapKey(row) {
  const name = String(row?.name || '').trim();
  const menu = row?.menuItemId != null ? String(row.menuItemId) : String(row?.menu_item_id || '');
  const qty = Number(row?.qty ?? row?.quantity) || 0;
  return `${menu}|${name}|${qty}`;
}

function rowKey(row) {
  const name = String(row?.name || '').trim();
  const menu = String(row?.menu_item_id || row?.menuItemId || '');
  const qty = Number(row?.quantity) || 0;
  return `${menu}|${name}|${qty}`;
}

/**
 * @param {object} db
 * @param {object} input
 * @param {string} input.deviceId
 * @param {number} input.storeId
 * @param {string} input.tableId
 * @param {string} input.printerName
 * @param {{ name: string, qty: number, unitPrice?: number, portionText?: string, note?: string, menuItemId?: string, id?: string }[]} input.items
 * @param {string[]} [input.itemIds]
 * @param {string} [input.tableLabel]
 * @param {string} [input.orderId] — reuse existing OPEN/ACTIVE order
 * @param {object} [deps]
 */
function sendToKitchenCommand(db, input, deps = {}) {
  const {
    idFactory = randomUUID,
    clock = () => new Date().toISOString(),
    uuid = randomUUID,
  } = deps;

  const deviceId = String(input?.deviceId || '').trim();
  const printerName = String(input?.printerName || '').trim();
  const items = Array.isArray(input?.items) ? input.items : [];
  const itemIds = Array.isArray(input?.itemIds)
    ? input.itemIds.map((id) => String(id)).filter(Boolean)
    : [];
  if (!deviceId) throw new Error('device_id_required');
  if (!items.length) throw new Error('items_required');
  if (input?.storeId == null) throw new Error('store_id_required');

  return runInTransaction(db, () => {
    const orders = createOrderRepo(db, { idFactory, clock });
    const orderItems = createOrderItemRepo(db, { idFactory, clock });
    const prints = createPrintJobRepo(db, { idFactory, clock });
    const outbox = createOutboxRepo(db, { idFactory, clock, uuid });

    let orderId = String(input.orderId || '').trim();
    if (orderId) {
      const existing = orders.getById(orderId);
      if (!existing) {
        // Server order id — materialize locally for offline print/outbox.
        db.prepare(
          `INSERT INTO orders(id, store_id, table_id, status, guest_count, waiter_id, waiter_name, opened_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          orderId,
          input.storeId,
          input.tableId || null,
          ORDER_STATUS.OPEN,
          1,
          input.waiterId || null,
          input.waiterName || null,
          clock(),
          clock(),
        );
        orders.transitionStatus(orderId, ORDER_STATUS.ACTIVE);
      } else if (existing.status === ORDER_STATUS.OPEN) {
        orders.transitionStatus(orderId, ORDER_STATUS.ACTIVE);
      } else if (existing.status !== ORDER_STATUS.ACTIVE) {
        throw new Error(`order_not_active:${existing.status}`);
      }
    } else {
      const created = orders.insertOpen({
        storeId: input.storeId,
        tableId: input.tableId || null,
        waiterId: input.waiterId || null,
        waiterName: input.waiterName || null,
      });
      orderId = created.id;
      orders.transitionStatus(orderId, ORDER_STATUS.ACTIVE);
    }

    const existingRows = orderItems.listByOrder(orderId);
    const used = new Set();
    const savedItems = [];

    const take = (row) => {
      if (!row || used.has(row.id)) return null;
      used.add(row.id);
      if (row.status === 'OPEN') {
        return orderItems.markSent(row.id);
      }
      return row;
    };

    for (const id of itemIds) {
      const row = existingRows.find((r) => String(r.id) === id && r.status !== 'CANCELLED');
      const taken = take(row);
      if (taken) savedItems.push(taken);
    }

    for (const snap of items) {
      const snapId = snap.id != null ? String(snap.id) : '';
      // Already marked via itemIds — do not insert a second copy with the same id.
      if (snapId && used.has(snapId)) continue;
      if (snapId) {
        const byId = existingRows.find((r) => String(r.id) === snapId && r.status !== 'CANCELLED');
        const taken = take(byId);
        if (taken) {
          savedItems.push(taken);
          continue;
        }
      }

      const key = snapKey(snap);
      const openMatch = existingRows.find(
        (r) => !used.has(r.id) && r.status === 'OPEN' && rowKey(r) === key,
      );
      if (openMatch) {
        savedItems.push(take(openMatch));
        continue;
      }

      const sentMatch = existingRows.find(
        (r) => !used.has(r.id) && r.status === 'SENT' && rowKey(r) === key,
      );
      if (sentMatch) {
        savedItems.push(take(sentMatch));
        continue;
      }

      // Name-only fallback (qty may differ after merge on station).
      const name = String(snap.name || '').trim();
      const openByName = existingRows.find(
        (r) => !used.has(r.id) && r.status === 'OPEN' && String(r.name || '').trim() === name,
      );
      if (openByName) {
        savedItems.push(take(openByName));
        continue;
      }

      const inserted = orderItems.insert({
        orderId,
        name: snap.name,
        quantity: snap.qty ?? snap.quantity,
        unitPrice: snap.unitPrice ?? 0,
        menuItemId: snap.menuItemId || null,
        portionText: snap.portionText || null,
        note: snap.note || null,
        status: 'SENT',
        id: snapId || null,
      });
      used.add(inserted.id);
      savedItems.push(inserted);
    }

    const snapItems = items.map((row) => ({
      name: row.name,
      qty: Number(row.qty ?? row.quantity),
      portionText: row.portionText,
      note: row.note,
      modifiers: row.modifiers,
    }));
    const jobInput = {
      kind: input.kind || PRINT_JOB_KIND.KITCHEN_SEND,
      orderId,
      printerName,
      station: input.station,
      categoryName: input.categoryName,
      tableLabel: input.tableLabel,
      items: snapItems,
    };

    // Satellite POS (no Windows printer here): mark sent + outbox; server/hub creates
    // classic print jobs for the PC that actually has Shashlik/Oshxona/…
    const printOnServer = input.printOnServer === true;
    let job = null;
    let printOk = true;
    let printError = null;
    if (printOnServer) {
      printOk = true;
    } else if (printerName) {
      job = prints.insertPending(jobInput);
    } else {
      // Soft-fail: missing printer still commits order + outbox; print_job = FAILED.
      job = prints.insertFailed(jobInput, 'kitchen_printer_not_configured');
      printOk = false;
      printError = 'kitchen_printer_not_configured';
    }

    const event = outbox.enqueue({
      deviceId,
      eventType: 'ORDER_SEND_KITCHEN',
      clientEventId: input.clientEventId || null,
      payload: {
        orderId,
        printJobId: job?.id || null,
        itemIds: savedItems.map((i) => i.id),
        storeId: input.storeId,
        tableId: input.tableId || null,
        tableLabel: input.tableLabel || null,
        printerName: printerName || null,
        station: input.station || null,
        categoryName: input.categoryName || null,
        items: snapItems,
        printOnServer: printOnServer || undefined,
      },
    });

    return {
      orderId,
      itemIds: savedItems.map((i) => i.id),
      printJobId: job?.id || null,
      outboxId: event.id,
      clientEventId: event.clientEventId,
      printOk,
      printError,
      printOnServer,
    };
  });
}

module.exports = { sendToKitchenCommand };
