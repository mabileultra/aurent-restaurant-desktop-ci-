const { bootstrapCatalogFromCloud } = require('./edgeBootstrapCatalog');
const {
  bootstrapCategoriesFromCloud,
  bootstrapCashRegistersFromCloud,
} = require('./edgeBootstrapAdmin');
const { getLiveCloudSession } = require('./edgeLiveSync');
const { pushCatalogToCloud } = require('./edgeCatalogCloudPush');

/**
 * Quiet catalog reconcile while online (Phase E + S2).
 * 1) Push local structure → cloud (LWW)
 * 2) Pull cloud → local (LWW) so both sides converge
 */
async function refreshCatalogFromCloud() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.storeIds?.length) {
    return { skipped: true, reason: 'no-session' };
  }
  const pushed = await pushCatalogToCloud();
  if (pushed?.authFailed) {
    return { refreshed: false, authFailed: true, pushed };
  }
  const secret = session.bootstrapSecret;
  const results = [];
  for (const storeId of session.storeIds) {
    try {
      const data = await bootstrapCatalogFromCloud({
        token: session.token,
        storeId,
        companyLoginCode: session.companyLoginCode,
        bootstrapSecret: secret,
      });
      results.push({
        storeId,
        ok: true,
        halls: Number(data?.halls || 0),
        items: Number(data?.items || 0),
      });
    } catch (err) {
      results.push({ storeId, ok: false, error: err.message || String(err) });
      if (err.status === 401 || err.status === 403) {
        return { refreshed: false, authFailed: true, results };
      }
    }
  }

  let categories = null;
  let cashRegisters = null;
  if (session.companyId) {
    try {
      categories = await bootstrapCategoriesFromCloud({
        token: session.token,
        companyId: session.companyId,
        bootstrapSecret: secret,
      });
    } catch {
      /* next tick */
    }
    try {
      cashRegisters = await bootstrapCashRegistersFromCloud({
        token: session.token,
        companyId: session.companyId,
        storeIds: session.storeIds,
        bootstrapSecret: secret,
      });
    } catch {
      /* next tick */
    }
  }

  return {
    refreshed: true,
    pushed,
    results,
    categories,
    cashRegisters,
  };
}

module.exports = { refreshCatalogFromCloud, pushCatalogToCloud };
