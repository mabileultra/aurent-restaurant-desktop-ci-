const { requestJson, localBase, cloudBase } = require('./edgeHttp');
const { getLiveCloudSession } = require('./edgeLiveSync');

/**
 * Hall → cloud product stock (S4). Soft LWW upsert; local DB stays.
 */
async function pushStockToCloud() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.companyId || !session.storeIds?.length) {
    return { skipped: true, reason: 'no-session' };
  }
  const results = [];
  for (const storeId of session.storeIds) {
    try {
      const q = new URLSearchParams({
        companyId: String(session.companyId),
        storeId: String(storeId),
      });
      const local = await requestJson(`${localBase()}/edge/stock-export?${q}`);
      const products = Array.isArray(local.data?.products) ? local.data.products : [];
      if (!products.length) {
        results.push({ storeId, ok: true, upserted: 0, empty: true });
        continue;
      }
      const cloud = await requestJson(`${cloudBase()}/products/edge-stock-ingest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: { storeId, products },
      });
      results.push({
        storeId,
        ok: true,
        upserted: Number(cloud.data?.upserted || 0),
        skipped: Number(cloud.data?.skipped || 0),
      });
    } catch (err) {
      results.push({ storeId, ok: false, error: err.message || String(err) });
      if (err.status === 401 || err.status === 403) {
        return { pushed: false, authFailed: true, results };
      }
    }
  }
  return { pushed: true, results };
}

module.exports = { pushStockToCloud };
