const { bootstrapCatalogFromCloud } = require('./edgeBootstrapCatalog');
const {
  bootstrapCategoriesFromCloud,
  bootstrapCashRegistersFromCloud,
} = require('./edgeBootstrapAdmin');
const { getLiveCloudSession } = require('./edgeLiveSync');

/**
 * Quiet catalog reconcile while online (Phase E).
 * Menu/halls/stations/modifiers/recipes come via catalog-export → local bootstrap.
 * Categories + cash registers refreshed lightly for admin screens.
 * Does not wipe offline-only local edits that share cloud ids (upsert import).
 */
async function refreshCatalogFromCloud() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.storeIds?.length) {
    return { skipped: true, reason: 'no-session' };
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
    results,
    categories,
    cashRegisters,
  };
}

module.exports = { refreshCatalogFromCloud };
