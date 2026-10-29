const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');

/** In-memory cloud session for quiet live floor re-pull while desktop is online. */
let liveCloudSession = null;
let liveRefreshInFlight = false;
let livePushInFlight = false;

function rememberLiveCloudSession({
  token,
  companyId,
  companyLoginCode,
  storeIds,
  bootstrapSecret: secret,
} = {}) {
  const ids = Array.isArray(storeIds)
    ? storeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
    : [];
  if (!token || !ids.length) return;
  liveCloudSession = {
    token,
    companyId: companyId == null ? null : Number(companyId),
    companyLoginCode: companyLoginCode || null,
    storeIds: [...new Set(ids)].slice(0, 5),
    bootstrapSecret: bootstrapSecret(secret),
    savedAt: Date.now(),
  };
}

function getLiveCloudSession() {
  return liveCloudSession;
}

/** Re-pull live floor from cloud into local edge DB. Best-effort. */
async function refreshLiveFromCloud() {
  const session = liveCloudSession;
  if (!session?.token || !session.storeIds?.length) {
    return { skipped: true, reason: 'no-session' };
  }
  if (liveRefreshInFlight) {
    return { skipped: true, reason: 'in-flight' };
  }
  liveRefreshInFlight = true;
  const results = [];
  const secret = bootstrapSecret(session.bootstrapSecret);
  try {
    for (const storeId of session.storeIds) {
      try {
        const q = new URLSearchParams({ storeId: String(storeId) });
        if (session.companyLoginCode) q.set('companyLoginCode', session.companyLoginCode);
        const exported = await requestJson(`${cloudBase()}/rst/edge/live-export?${q}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
        const snapshot = exported.data;
        if (!snapshot?.companyId || !snapshot?.storeId) {
          results.push({ storeId, ok: false, error: 'empty-cloud-live' });
          continue;
        }
        const local = await requestJson(`${localBase()}/edge/live-import`, {
          method: 'POST',
          body: { bootstrapSecret: secret, snapshot },
        });
        results.push({
          storeId,
          ok: true,
          openOrders: Number(local.data?.openOrders || 0),
          kitchenTickets: Number(local.data?.kitchenTickets || 0),
        });
      } catch (err) {
        results.push({ storeId, ok: false, error: err.message || String(err) });
        if (err.status === 401 || err.status === 403) {
          liveCloudSession = null;
          break;
        }
      }
    }
    return { refreshed: true, results };
  } finally {
    liveRefreshInFlight = false;
  }
}

/** Push local OPEN/BILLING floor to cloud for phone clients. */
async function pushLiveToCloud() {
  const session = liveCloudSession;
  if (!session?.token || !session.storeIds?.length || !session.companyId) {
    return { skipped: true, reason: 'no-session' };
  }
  if (livePushInFlight) {
    return { skipped: true, reason: 'in-flight' };
  }
  livePushInFlight = true;
  const results = [];
  const secret = bootstrapSecret(session.bootstrapSecret);
  try {
    for (const storeId of session.storeIds) {
      try {
        const q = new URLSearchParams({
          storeId: String(storeId),
          companyId: String(session.companyId),
          bootstrapSecret: secret,
        });
        if (session.companyLoginCode) q.set('companyLoginCode', session.companyLoginCode);
        const local = await requestJson(`${localBase()}/edge/live-export?${q}`);
        const snapshot = local.data;
        if (!snapshot?.companyId || !snapshot?.storeId) {
          results.push({ storeId, ok: false, error: 'empty-local-live' });
          continue;
        }
        const cloud = await requestJson(`${cloudBase()}/rst/edge/live-ingest`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
          body: snapshot,
        });
        results.push({
          storeId,
          ok: true,
          openOrders: Number(cloud.data?.openOrders || 0),
          kitchenTickets: Number(cloud.data?.kitchenTickets || 0),
        });
      } catch (err) {
        results.push({ storeId, ok: false, error: err.message || String(err) });
        if (err.status === 401 || err.status === 403) {
          liveCloudSession = null;
          break;
        }
      }
    }
    return { pushed: true, results };
  } finally {
    livePushInFlight = false;
  }
}

module.exports = {
  rememberLiveCloudSession,
  getLiveCloudSession,
  refreshLiveFromCloud,
  pushLiveToCloud,
};
