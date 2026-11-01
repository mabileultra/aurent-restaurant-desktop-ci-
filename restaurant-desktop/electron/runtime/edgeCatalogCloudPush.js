const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');
const { getLiveCloudSession } = require('./edgeLiveSync');

/**
 * Hall → cloud catalog structure (S2). LWW on server; local DB stays.
 */
async function pushCatalogToCloud() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.companyId || !session.storeIds?.length) {
    return { skipped: true, reason: 'no-session' };
  }
  const secret = bootstrapSecret(session.bootstrapSecret);
  const results = [];
  for (const storeId of session.storeIds) {
    try {
      const q = new URLSearchParams({
        storeId: String(storeId),
        companyId: String(session.companyId),
        bootstrapSecret: secret,
      });
      if (session.companyLoginCode) q.set('companyLoginCode', session.companyLoginCode);
      const local = await requestJson(`${localBase()}/edge/catalog-structure-export?${q}`);
      const snapshot = local.data;
      if (!snapshot?.companyId || !snapshot?.storeId) {
        results.push({ storeId, ok: false, error: 'empty-local-catalog' });
        continue;
      }
      const cloud = await requestJson(`${cloudBase()}/rst/edge/catalog-ingest`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
        body: snapshot,
      });
      results.push({
        storeId,
        ok: true,
        halls: Number(cloud.data?.halls || 0),
        items: Number(cloud.data?.items || 0),
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

module.exports = { pushCatalogToCloud };
