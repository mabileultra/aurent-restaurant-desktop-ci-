/**
 * Apply a hub-ingested event into local SQLite (station).
 * Commands enqueue their own outbox for later cloud sync.
 */
const { openOrderCommand } = require('../commands/openOrderCommand.cjs');
const { addOrderItemCommand } = require('../commands/addOrderItemCommand.cjs');
const { updateOrderItemCommand } = require('../commands/updateOrderItemCommand.cjs');
const { cancelOrderItemCommand } = require('../commands/cancelOrderItemCommand.cjs');
const { cancelOrderCommand } = require('../commands/cancelOrderCommand.cjs');
const { sendToKitchenCommand } = require('../commands/sendToKitchenCommand.cjs');
const { requestBillCommand } = require('../commands/requestBillCommand.cjs');
const { payOrderCommand } = require('../commands/payOrderCommand.cjs');
const { patchOrderMetaCommand } = require('../commands/patchOrderMetaCommand.cjs');
const { createLocalMenuItemCommand } = require('../commands/createLocalMenuItemCommand.cjs');

function alreadyProcessed(db, deviceId, clientEventId) {
  if (!clientEventId) return false;
  const row = db.prepare(
    `SELECT id FROM outbox WHERE device_id = ? AND client_event_id = ? LIMIT 1`,
  ).get(String(deviceId), String(clientEventId));
  return Boolean(row);
}

/** Waiter phone sends empty printerName + printOnServer — resolve category printer on station. */
function resolveHubKitchenPrinter(db, storeId, payload = {}) {
  const fromPayload = String(payload.printerName || '').trim();
  if (fromPayload) return fromPayload;
  const sid = Number(storeId);
  if (!Number.isFinite(sid)) return '';
  try {
    const row = db.prepare(
      `SELECT print_printer_name AS n FROM menu_categories
       WHERE store_id = ? AND active = 1
         AND print_printer_name IS NOT NULL AND TRIM(print_printer_name) != ''
       ORDER BY sort_order ASC LIMIT 1`,
    ).get(sid);
    return String(row?.n || '').trim();
  } catch {
    return '';
  }
}

function applyHubEvent(db, { eventType, payload = {}, deviceId, clientEventId, storeId, billPrinterName }) {
  const type = String(eventType || '').trim();
  const dev = String(deviceId || 'hub').trim();
  if (clientEventId && alreadyProcessed(db, dev, clientEventId)) {
    return { outcome: 'ALREADY_PROCESSED' };
  }

  switch (type) {
    case 'ORDER_OPEN':
      openOrderCommand(db, {
        deviceId: dev,
        storeId: payload.storeId ?? storeId,
        tableId: payload.tableId,
        tableLabel: payload.tableLabel,
        orderId: payload.orderId,
        guestCount: payload.guestCount,
        adultCount: payload.adultCount,
        childrenCount: payload.childrenCount,
        waiterId: payload.waiterId,
        channel: payload.channel,
        comment: payload.comment,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_ADD_ITEM':
      addOrderItemCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        storeId: payload.storeId ?? storeId,
        menuItemId: payload.menuItemId,
        name: payload.name,
        quantity: payload.quantity,
        unitPrice: payload.unitPrice,
        note: payload.note,
        modifiers: payload.modifiers,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_UPDATE_ITEM':
      updateOrderItemCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        itemId: payload.itemId,
        quantity: payload.quantity,
        note: payload.note,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_CANCEL_ITEM':
      cancelOrderItemCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        itemId: payload.itemId,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_CANCEL':
      cancelOrderCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_SEND_KITCHEN': {
      const items = Array.isArray(payload.items) ? payload.items : [];
      if (!items.length) {
        return { outcome: 'IGNORED', reason: 'no_items' };
      }
      const sid = payload.storeId ?? storeId;
      // Waiter phone: printOnServer → cloud creates classic jobs, cashier relay prints
      // (do not invent a FAILED empty-name job on hub). If no printOnServer flag,
      // resolve category printer and print on this station.
      const printOnServer = payload.printOnServer === true;
      const printerName = printOnServer
        ? String(payload.printerName || '').trim()
        : resolveHubKitchenPrinter(db, sid, payload);
      sendToKitchenCommand(db, {
        deviceId: dev,
        storeId: sid,
        tableId: payload.tableId,
        tableLabel: payload.tableLabel,
        orderId: payload.orderId,
        printerName,
        station: payload.station,
        categoryName: payload.categoryName,
        items,
        waiterId: payload.waiterId,
        clientEventId: clientEventId || null,
        printOnServer,
      });
      break;
    }
    case 'ORDER_REQUEST_BILL':
      requestBillCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        printerName: billPrinterName || payload.printerName || '',
        tableLabel: payload.tableLabel,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_PAY':
      payOrderCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        method: payload.method,
        amount: payload.amount,
        cashAmount: payload.cashAmount,
        cardAmount: payload.cardAmount,
        amountTendered: payload.amountTendered,
        changeGiven: payload.changeGiven,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_UPDATE_GUESTS':
      patchOrderMetaCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        patch: 'GUESTS',
        guestCount: payload.guestCount,
        childrenCount: payload.childrenCount,
        adultCount: payload.adultCount,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_UPDATE_DISCOUNT':
      patchOrderMetaCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        patch: 'DISCOUNT',
        discountAmount: payload.discountAmount,
        clientEventId: clientEventId || null,
      });
      break;
    case 'ORDER_ASSIGN_WAITER':
      patchOrderMetaCommand(db, {
        deviceId: dev,
        orderId: payload.orderId,
        patch: 'WAITER',
        waiterId: payload.waiterId,
        waiterName: payload.waiterName,
        clientEventId: clientEventId || null,
      });
      break;
    case 'MENU_ITEM_UPSERT':
      createLocalMenuItemCommand(db, {
        deviceId: dev,
        storeId: payload.storeId ?? storeId,
        id: payload.id,
        name: payload.name,
        price: payload.price,
        categoryId: payload.categoryId,
        clientEventId: clientEventId || null,
      });
      break;
    default:
      return { outcome: 'IGNORED', eventType: type };
  }
  return { outcome: 'ACCEPTED', eventType: type };
}

module.exports = { applyHubEvent };
