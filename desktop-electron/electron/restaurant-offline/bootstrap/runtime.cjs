/**
 * Composition root: DB + PrintWorker + OutboxSender ticks when restaurantLocalFirst.
 */
const { getRestaurantOfflineDb } = require('../db/connection.cjs');
const { createPrintWorker } = require('../print/printWorker.cjs');
const { createOutboxSender } = require('../sync/outboxSender.cjs');
const { sendToKitchenCommand } = require('../commands/sendToKitchenCommand.cjs');
const { openOrderCommand, toUiOrder } = require('../commands/openOrderCommand.cjs');
const { addOrderItemCommand } = require('../commands/addOrderItemCommand.cjs');
const { updateOrderItemCommand } = require('../commands/updateOrderItemCommand.cjs');
const { cancelOrderItemCommand } = require('../commands/cancelOrderItemCommand.cjs');
const { cancelOrderCommand } = require('../commands/cancelOrderCommand.cjs');
const { payOrderCommand } = require('../commands/payOrderCommand.cjs');
const { requestBillCommand } = require('../commands/requestBillCommand.cjs');
const { patchOrderMetaCommand } = require('../commands/patchOrderMetaCommand.cjs');
const { openShiftCommand, closeShiftCommand } = require('../commands/shiftCommands.cjs');
const { saveLocalShift, getLocalShift } = require('../commands/localShiftCache.cjs');
const { saveLocalModifiers, getLocalModifiers } = require('../commands/localModifiersCache.cjs');
const { createLanHubServer } = require('../hub/lanHubServer.cjs');
const { applyHubEvent } = require('../hub/applyHubEvent.cjs');
const { buildHubSnapshot } = require('../hub/hubSnapshot.cjs');
const { mergeHubSnapshot } = require('../hub/mergeHubSnapshot.cjs');
const { createLocalMenuItemCommand } = require('../commands/createLocalMenuItemCommand.cjs');
const {
  listLocalMenuItems,
  listLocalMenuCategories,
  listLocalFloorSnapshot,
} = require('../commands/listLocalCatalog.cjs');
const {
  importRestaurantBootstrap,
  getRestaurantBootstrapStatus,
  getLocalRoster,
} = require('../db/bootstrap.cjs');
const {
  resolvePrintJobCommand,
  listUnresolvedPrintJobs,
} = require('../print/resolvePrintJob.cjs');
const { getOrCreateDeviceId } = require('../../identity/deviceIdentity');
const { logInfo, logWarn, logError } = require('../log.cjs');

const PRINT_TICK_MS = 300;
const OUTBOX_TICK_MS = 2_000;

let started = false;
let printTimer = null;
let outboxTimer = null;
let hubServer = null;
let session = {
  authToken: null,
  storeId: null,
  apiBaseUrl: null,
};
let getConfig = () => ({});

async function resolvePrintTicket() {
  try {
    const escpos = require('../../cashier-receipt-escpos/index.cjs');
    if (typeof escpos.printPlainTicketEscpos === 'function') {
      return (ticket) => escpos.printPlainTicketEscpos(ticket);
    }
  } catch (err) {
    console.warn('[rst-offline] escpos unavailable:', err?.message || err);
  }
  return async () => {
    throw new Error('Печать недоступна в этой сборке');
  };
}

async function defaultSendEvent(body) {
  const cfg = getConfig() || {};
  const storeId = session.storeId ?? cfg.storeId;
  const apiBase = String(session.apiBaseUrl || cfg.apiUrl || '').replace(/\/$/, '');
  if (!apiBase || storeId == null) {
    throw new Error('rst_offline_session_missing');
  }
  if (!session.authToken) {
    throw new Error('rst_offline_auth_missing');
  }
  const url = `${apiBase}/rst/stores/${storeId}/local-events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.authToken}`,
    },
    body: JSON.stringify({
      deviceId: body.deviceId,
      clientEventId: body.clientEventId,
      eventType: body.eventType,
      payload: body.payload ?? {},
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ingest_http_${res.status}:${text.slice(0, 200)}`);
  }
  const data = await res.json().catch(() => ({}));
  return { outcome: data.outcome || 'ACCEPTED' };
}

async function startRestaurantOfflineRuntime({ loadConfig } = {}) {
  if (started) return { ok: true, already: true };
  getConfig = typeof loadConfig === 'function' ? loadConfig : () => ({});
  const db = await getRestaurantOfflineDb();
  const printTicket = await resolvePrintTicket();

  const printWorker = createPrintWorker(db, {
    printTicket: async (ticket) => {
      try {
        const result = await printTicket(ticket);
        logInfo('Печать слипа OK', {
          printer: ticket.printerName,
          jobId: ticket.jobId,
          lines: Array.isArray(ticket.lines) ? ticket.lines.length : 0,
        });
        return result;
      } catch (err) {
        logError('Печать слипа failed', {
          printer: ticket.printerName,
          jobId: ticket.jobId,
          error: err?.message || String(err),
        });
        throw err;
      }
    },
  });
  const outboxSender = createOutboxSender(db, {
    sendEvent: async (body) => {
      try {
        const result = await defaultSendEvent(body);
        logInfo('Outbox sync', {
          eventType: body.eventType,
          clientEventId: body.clientEventId,
          outcome: result.outcome,
        });
        return result;
      } catch (err) {
        logWarn('Outbox sync retry', {
          eventType: body.eventType,
          clientEventId: body.clientEventId,
          error: err?.message || String(err),
        });
        throw err;
      }
    },
  });

  const recoveredPrint = printWorker.recover();
  const recoveredOutbox = outboxSender.recover();
  if (recoveredPrint?.promoted?.length) {
    logWarn('Recover PRINTING→UNKNOWN', { ids: recoveredPrint.promoted });
  }
  if (recoveredOutbox?.promoted?.length) {
    logWarn('Recover SENDING→RETRY', { ids: recoveredOutbox.promoted });
  }

  printTimer = setInterval(() => {
    printWorker.tick().catch((err) => {
      logError('print tick', { error: err?.message || String(err) });
    });
  }, PRINT_TICK_MS);
  if (typeof printTimer.unref === 'function') printTimer.unref();

  outboxTimer = setInterval(() => {
    if (!session.authToken || session.storeId == null) return;
    outboxSender.tick().catch((err) => {
      logError('outbox tick', { error: err?.message || String(err) });
    });
  }, OUTBOX_TICK_MS);
  if (typeof outboxTimer.unref === 'function') outboxTimer.unref();

  // LAN hub for waiter phones when cloud is unreachable.
  try {
    hubServer = createLanHubServer({
      port: Number(getConfig()?.restaurantHubPort) || undefined,
      getMeta: () => ({
        storeId: session.storeId,
        deviceId: getOrCreateDeviceId(),
      }),
      getSnapshot: async () => {
        const database = await getRestaurantOfflineDb();
        return buildHubSnapshot(database, session.storeId);
      },
      applyEvent: async (evt) => {
        const database = await getRestaurantOfflineDb();
        const cfg = getConfig() || {};
        const stationMap = cfg.stationPrinters || {};
        const kitchenPrinter = Object.values(stationMap).find((n) => String(n || '').trim())
          || cfg.billPrinterName
          || cfg.receiptPrinterName
          || '';
        const payload = { ...(evt.payload || {}) };
        if (evt.eventType === 'ORDER_SEND_KITCHEN' && !payload.printerName) {
          payload.printerName = String(kitchenPrinter || '').trim();
        }
        const result = applyHubEvent(database, {
          ...evt,
          payload,
          storeId: session.storeId,
          kitchenPrinterName: kitchenPrinter,
          billPrinterName: cfg.billPrinterName || cfg.receiptPrinterName || '',
        });
        // Spool waiter kitchen tickets immediately (don't wait for the 300ms tick).
        if (evt.eventType === 'ORDER_SEND_KITCHEN') {
          void printWorker.tick().catch((err) => {
            logError('print tick after hub SEND', { error: err?.message || String(err) });
          });
        }
        return result;
      },
    });
    const hubInfo = await hubServer.start();
    logInfo('LAN hub started', hubInfo);
  } catch (err) {
    logWarn('LAN hub not started', { error: err?.message || String(err) });
    hubServer = null;
  }

  started = true;
  logInfo('Runtime started', {
    deviceId: getOrCreateDeviceId(),
    storeId: session.storeId,
  });
  return { ok: true };
}

function stopRestaurantOfflineRuntime() {
  if (printTimer) clearInterval(printTimer);
  if (outboxTimer) clearInterval(outboxTimer);
  printTimer = null;
  outboxTimer = null;
  if (hubServer) {
    void hubServer.stop().catch(() => null);
    hubServer = null;
  }
  if (started) logInfo('Runtime stopped');
  started = false;
}

function setRestaurantOfflineSession(patch = {}) {
  if (patch.authToken !== undefined) session.authToken = patch.authToken || null;
  if (patch.storeId !== undefined) {
    session.storeId = patch.storeId == null ? null : Number(patch.storeId);
  }
  if (patch.apiBaseUrl !== undefined) {
    session.apiBaseUrl = patch.apiBaseUrl ? String(patch.apiBaseUrl).replace(/\/$/, '') : null;
  }
  logInfo('Session updated', {
    storeId: session.storeId,
    hasAuth: Boolean(session.authToken),
    apiBaseUrl: session.apiBaseUrl || null,
  });
  return { ...session, authToken: session.authToken ? '***' : null };
}

async function restaurantSendToKitchen(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = sendToKitchenCommand(db, { ...input, deviceId });
    logInfo('Send to kitchen (local)', {
      orderId: result.orderId,
      printJobId: result.printJobId,
      outboxId: result.outboxId,
      printer: input.printerName,
      printOk: result.printOk !== false,
      printError: result.printError || null,
      online: Boolean(session.authToken),
    });
    return result;
  } catch (err) {
    logError('Send to kitchen failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantOpenOrder(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = openOrderCommand(db, { ...input, deviceId });
    logInfo('Open order (local)', {
      orderId: result.orderId,
      tableId: result.tableId,
      outboxId: result.outboxId,
      online: Boolean(session.authToken),
    });
    return { ...result, order: toUiOrder(db, result.orderId) };
  } catch (err) {
    logError('Open order failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantAddOrderItem(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = addOrderItemCommand(db, { ...input, deviceId });
    logInfo('Add item (local)', {
      orderId: result.orderId,
      itemId: result.itemId,
      name: input.name,
      qty: input.quantity ?? input.qty,
      online: Boolean(session.authToken),
    });
    return result;
  } catch (err) {
    logError('Add item failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantUpdateOrderItem(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = updateOrderItemCommand(db, { ...input, deviceId });
    logInfo('Update item (local)', {
      orderId: result.orderId,
      itemId: result.itemId,
      quantity: input.quantity,
      online: Boolean(session.authToken),
    });
    return result;
  } catch (err) {
    logError('Update item failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantCancelOrderItem(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = cancelOrderItemCommand(db, { ...input, deviceId });
    logInfo('Cancel item (local)', {
      orderId: result.orderId,
      itemId: result.itemId,
      deleted: result.deleted,
      online: Boolean(session.authToken),
    });
    return result;
  } catch (err) {
    logError('Cancel item failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantCancelOrder(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = cancelOrderCommand(db, { ...input, deviceId });
    logInfo('Cancel order (local)', {
      orderId: result.orderId,
      status: result.status,
      online: Boolean(session.authToken),
    });
    return result;
  } catch (err) {
    logError('Cancel order failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantPayOrder(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = payOrderCommand(db, { ...input, deviceId });
    logInfo('Pay order (local)', {
      orderId: result.orderId,
      status: result.status,
      amount: input.amount,
      method: input.method,
      online: Boolean(session.authToken),
    });
    return result;
  } catch (err) {
    logError('Pay order failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantGetOrder(orderId) {
  const db = await getRestaurantOfflineDb();
  return toUiOrder(db, String(orderId || ''));
}

async function restaurantRequestBill(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = requestBillCommand(db, { ...input, deviceId });
    logInfo('Request bill (local)', {
      orderId: result.orderId,
      status: result.status,
      outboxId: result.outboxId,
      online: Boolean(session.authToken),
    });
    return result;
  } catch (err) {
    logError('Request bill failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantListMenu(storeId) {
  const db = await getRestaurantOfflineDb();
  return listLocalMenuItems(db, storeId ?? session.storeId);
}

async function restaurantListCategories(storeId) {
  const db = await getRestaurantOfflineDb();
  return listLocalMenuCategories(db, storeId ?? session.storeId);
}

async function restaurantGetFloor(storeId) {
  const db = await getRestaurantOfflineDb();
  return listLocalFloorSnapshot(db, storeId ?? session.storeId);
}

async function restaurantPatchOrderMeta(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  try {
    const result = patchOrderMetaCommand(db, { ...input, deviceId });
    logInfo('Patch order meta (local)', {
      orderId: result.orderId,
      patch: result.patch,
      outboxId: result.outboxId,
    });
    return result;
  } catch (err) {
    logError('Patch order meta failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantSaveShift(input = {}) {
  const db = await getRestaurantOfflineDb();
  return saveLocalShift(db, input.storeId ?? session.storeId, input.shift ?? null);
}

async function restaurantGetShift(storeId) {
  const db = await getRestaurantOfflineDb();
  return getLocalShift(db, storeId ?? session.storeId);
}

async function restaurantOpenShift(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  const result = openShiftCommand(db, {
    ...input,
    deviceId,
    storeId: input.storeId ?? session.storeId,
  });
  logInfo('Open shift (local)', { shiftId: result.shift?.id, already: result.already });
  return result;
}

async function restaurantCloseShift(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  const result = closeShiftCommand(db, {
    ...input,
    deviceId,
    storeId: input.storeId ?? session.storeId,
  });
  logInfo('Close shift (local)', { shiftId: result.shift?.id });
  return result;
}

async function restaurantListRoster(storeId) {
  const db = await getRestaurantOfflineDb();
  return getLocalRoster(db, storeId ?? session.storeId);
}

async function restaurantSaveModifiers(input = {}) {
  const db = await getRestaurantOfflineDb();
  return saveLocalModifiers(db, input.menuItemId, input.groups || []);
}

async function restaurantGetModifiers(menuItemId) {
  const db = await getRestaurantOfflineDb();
  return getLocalModifiers(db, menuItemId);
}

function restaurantGetHubInfo() {
  return hubServer ? hubServer.getInfo() : { listening: false, url: null };
}

async function restaurantCreateMenuItem(input = {}) {
  const db = await getRestaurantOfflineDb();
  const deviceId = String(input.deviceId || getOrCreateDeviceId()).trim();
  const result = createLocalMenuItemCommand(db, {
    ...input,
    deviceId,
    storeId: input.storeId ?? session.storeId,
  });
  logInfo('Local menu item created', { id: result.id, name: result.name });
  return result;
}

async function restaurantPullHubSnapshot(hubUrl) {
  const base = String(hubUrl || '').replace(/\/$/, '');
  if (!base) throw new Error('hub_url_required');
  const res = await fetch(`${base}/hub/snapshot`);
  if (!res.ok) throw new Error(`hub_snapshot_http_${res.status}`);
  const snapshot = await res.json();
  const db = await getRestaurantOfflineDb();
  const result = mergeHubSnapshot(db, snapshot);
  logInfo('Hub snapshot merged', result);
  return { ...result, storeId: snapshot.storeId ?? null };
}

async function restaurantImportBootstrap(payload) {
  const db = await getRestaurantOfflineDb();
  try {
    const result = importRestaurantBootstrap(db, payload);
    logInfo('Bootstrap imported', {
      storeId: result.storeId,
      categories: result.categories,
      menuItems: result.menuItems,
      tables: result.tables,
    });
    return result;
  } catch (err) {
    logError('Bootstrap failed', { error: err?.message || String(err) });
    throw err;
  }
}

async function restaurantGetStatus() {
  const db = await getRestaurantOfflineDb();
  const bootstrap = getRestaurantBootstrapStatus(db);
  const unresolvedPrintJobs = listUnresolvedPrintJobs(db, 30);
  return {
    ...bootstrap,
    runtimeStarted: started,
    hasAuthSession: Boolean(session.authToken && session.storeId != null),
    deviceId: getOrCreateDeviceId(),
    unresolvedPrintJobs,
    hub: restaurantGetHubInfo(),
  };
}

async function restaurantResolvePrintJob(input = {}) {
  const db = await getRestaurantOfflineDb();
  try {
    const result = resolvePrintJobCommand(db, input);
    logWarn('Print job resolved', {
      jobId: result.id,
      action: result.action,
      status: result.status,
      previousStatus: result.previousStatus,
    });
    return result;
  } catch (err) {
    logError('Print resolve failed', { error: err?.message || String(err) });
    throw err;
  }
}

function isRestaurantOfflineRuntimeStarted() {
  return started;
}

module.exports = {
  startRestaurantOfflineRuntime,
  stopRestaurantOfflineRuntime,
  setRestaurantOfflineSession,
  restaurantSendToKitchen,
  restaurantOpenOrder,
  restaurantAddOrderItem,
  restaurantUpdateOrderItem,
  restaurantCancelOrderItem,
  restaurantCancelOrder,
  restaurantPayOrder,
  restaurantGetOrder,
  restaurantRequestBill,
  restaurantListMenu,
  restaurantListCategories,
  restaurantGetFloor,
  restaurantListRoster,
  restaurantSaveModifiers,
  restaurantGetModifiers,
  restaurantPatchOrderMeta,
  restaurantSaveShift,
  restaurantGetShift,
  restaurantOpenShift,
  restaurantCloseShift,
  restaurantGetHubInfo,
  restaurantCreateMenuItem,
  restaurantPullHubSnapshot,
  restaurantImportBootstrap,
  restaurantGetStatus,
  restaurantResolvePrintJob,
  isRestaurantOfflineRuntimeStarted,
};
