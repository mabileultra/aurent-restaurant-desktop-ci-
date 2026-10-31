const { bootstrapStockFromCloud } = require('./edgeBootstrapStock');
const { bootstrapSuppliersFromCloud } = require('./edgeBootstrapSuppliers');
const { bootstrapStoresFromCloud } = require('./edgeBootstrapStores');
const { getLiveCloudSession } = require('./edgeLiveSync');
const { pushStockToCloud } = require('./edgeStockCloudPush');

/**
 * Quiet stock + refs reconcile while online (Phase F + S4).
 * 1) Push local stock → cloud (LWW)
 * 2) Pull cloud → local (LWW)
 * Local STOCK_* document outbox stays separate (applied locally; flush policy unchanged).
 */
async function refreshStockFromCloud() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.companyId || !session.storeIds?.length) {
    return { skipped: true, reason: 'no-session' };
  }
  const secret = session.bootstrapSecret;
  const results = [];

  let pushed = null;
  try {
    pushed = await pushStockToCloud();
    if (pushed?.authFailed) {
      return { refreshed: false, authFailed: true, pushed };
    }
  } catch {
    /* still try pull */
  }

  try {
    await bootstrapStoresFromCloud({
      token: session.token,
      companyId: session.companyId,
      bootstrapSecret: secret,
    });
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      return { refreshed: false, authFailed: true, results, pushed };
    }
  }

  try {
    await bootstrapSuppliersFromCloud({
      token: session.token,
      companyId: session.companyId,
      bootstrapSecret: secret,
    });
  } catch {
    /* next tick */
  }

  for (const storeId of session.storeIds) {
    try {
      const data = await bootstrapStockFromCloud({
        token: session.token,
        companyId: session.companyId,
        storeId,
        bootstrapSecret: secret,
      });
      results.push({
        storeId,
        ok: true,
        saved: Number(data?.saved || data?.products || 0),
      });
    } catch (err) {
      results.push({ storeId, ok: false, error: err.message || String(err) });
      if (err.status === 401 || err.status === 403) {
        return { refreshed: false, authFailed: true, results };
      }
    }
  }

  return { refreshed: true, pushed, results };
}

module.exports = { refreshStockFromCloud, pushStockToCloud };
