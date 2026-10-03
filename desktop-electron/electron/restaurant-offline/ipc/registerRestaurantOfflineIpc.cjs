const { ipcMain } = require('electron');
const {
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
} = require('../bootstrap/runtime.cjs');

const IPC_TIMEOUT_MS = 16_000;

async function safe(fn, fallback, timeoutMs = IPC_TIMEOUT_MS) {
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('rst_offline_ipc_timeout')), timeoutMs);
      }),
    ]);
  } catch (err) {
    console.error('[rst-offline ipc]', err?.message || err);
    if (fallback === undefined) throw err;
    return typeof fallback === 'function' ? fallback(err) : fallback;
  }
}

function registerRestaurantOfflineIpc({ loadConfig } = {}) {
  ipcMain.handle('rst-offline:get-status', async () =>
    safe(() => restaurantGetStatus(), {
      bootstrapReady: false,
      runtimeStarted: false,
      hasAuthSession: false,
      unresolvedPrintJobs: [],
    }),
  );

  ipcMain.handle('rst-offline:set-session', async (_e, patch) =>
    setRestaurantOfflineSession(patch || {}),
  );

  ipcMain.handle('rst-offline:import-bootstrap', async (_e, payload) =>
    safe(() => restaurantImportBootstrap(payload || {}), { ok: false, error: 'rst_offline_db_unavailable' }, 60_000),
  );

  ipcMain.handle('rst-offline:send-to-kitchen', async (_e, payload) =>
    safe(() => restaurantSendToKitchen(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:open-order', async (_e, payload) =>
    safe(() => restaurantOpenOrder(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:add-item', async (_e, payload) =>
    safe(() => restaurantAddOrderItem(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:update-item', async (_e, payload) =>
    safe(() => restaurantUpdateOrderItem(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:cancel-item', async (_e, payload) =>
    safe(() => restaurantCancelOrderItem(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:cancel-order', async (_e, payload) =>
    safe(() => restaurantCancelOrder(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:pay-order', async (_e, payload) =>
    safe(() => restaurantPayOrder(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:request-bill', async (_e, payload) =>
    safe(() => restaurantRequestBill(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:list-menu', async (_e, storeId) =>
    safe(() => restaurantListMenu(storeId), []),
  );

  ipcMain.handle('rst-offline:list-categories', async (_e, storeId) =>
    safe(() => restaurantListCategories(storeId), []),
  );

  ipcMain.handle('rst-offline:list-roster', async (_e, storeId) =>
    safe(() => restaurantListRoster(storeId), []),
  );

  ipcMain.handle('rst-offline:save-modifiers', async (_e, payload) =>
    safe(() => restaurantSaveModifiers(payload || {}), { ok: false }),
  );

  ipcMain.handle('rst-offline:get-modifiers', async (_e, menuItemId) =>
    safe(() => restaurantGetModifiers(menuItemId), []),
  );

  ipcMain.handle('rst-offline:get-floor', async (_e, storeId) =>
    safe(() => restaurantGetFloor(storeId), { storeId: null, halls: [] }),
  );

  ipcMain.handle('rst-offline:patch-order-meta', async (_e, payload) =>
    safe(() => restaurantPatchOrderMeta(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:save-shift', async (_e, payload) =>
    safe(() => restaurantSaveShift(payload || {}), { ok: false }),
  );

  ipcMain.handle('rst-offline:get-shift', async (_e, storeId) =>
    safe(() => restaurantGetShift(storeId), null),
  );

  ipcMain.handle('rst-offline:open-shift', async (_e, payload) =>
    safe(() => restaurantOpenShift(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:close-shift', async (_e, payload) =>
    safe(() => restaurantCloseShift(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:hub-info', async () =>
    restaurantGetHubInfo(),
  );

  ipcMain.handle('rst-offline:create-menu-item', async (_e, payload) =>
    safe(() => restaurantCreateMenuItem(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:pull-hub-snapshot', async (_e, hubUrl) =>
    safe(() => restaurantPullHubSnapshot(hubUrl), undefined),
  );

  ipcMain.handle('rst-offline:resolve-print-job', async (_e, payload) =>
    safe(() => restaurantResolvePrintJob(payload || {}), undefined),
  );

  ipcMain.handle('rst-offline:get-order', async (_e, orderId) =>
    safe(() => restaurantGetOrder(orderId), null),
  );

  ipcMain.handle('rst-offline:start-runtime', async () =>
    safe(() => startRestaurantOfflineRuntime({ loadConfig }), { ok: false }),
  );

  ipcMain.handle('rst-offline:stop-runtime', async () => {
    stopRestaurantOfflineRuntime();
    return { ok: true };
  });
}

module.exports = {
  registerRestaurantOfflineIpc,
  startRestaurantOfflineRuntime,
  stopRestaurantOfflineRuntime,
};
