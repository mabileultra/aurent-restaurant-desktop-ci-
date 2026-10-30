const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');
const {
  readLiveCloudSession,
  writeLiveCloudSession,
  clearLiveCloudSession,
} = require('./edgeLiveSessionStore');

/** Cloud session for quiet live floor sync — memory + userData (survives restart). */
let liveCloudSession = null;
let liveRefreshInFlight = false;
let livePushInFlight = false;
let sessionHydrated = false;
/** Skip hall→cloud push while local origin watermark unchanged (still pull). */
const lastPushedOriginByStore = new Map();

function hydrateSessionOnce() {
  if (sessionHydrated) return;
  sessionHydrated = true;
  if (!liveCloudSession) {
    liveCloudSession = readLiveCloudSession();
  }
}

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
  sessionHydrated = true;
  liveCloudSession = {
    token,
    companyId: companyId == null ? null : Number(companyId),
    companyLoginCode: companyLoginCode || null,
    storeIds: [...new Set(ids)].slice(0, 5),
    bootstrapSecret: bootstrapSecret(secret),
    savedAt: Date.now(),
  };
  writeLiveCloudSession(liveCloudSession);
}

function clearSession() {
  liveCloudSession = null;
  lastPushedOriginByStore.clear();
  clearLiveCloudSession();
}

function getLiveCloudSession() {
  hydrateSessionOnce();
  return liveCloudSession;
}

/** Re-pull live floor from cloud into local edge DB. Best-effort. */
async function refreshLiveFromCloud() {
  const session = getLiveCloudSession();
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
          openShift: Number(local.data?.openShift || 0),
          kitchenTickets: Number(local.data?.kitchenTickets || 0),
        });
      } catch (err) {
        results.push({ storeId, ok: false, error: err.message || String(err) });
        if (err.status === 401 || err.status === 403) {
          clearSession();
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
  const session = getLiveCloudSession();
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
        const origin = Number(snapshot.floorRevision || 0);
        const prevOrigin = lastPushedOriginByStore.get(storeId);
        // Origin > 0 and unchanged → cloud already has this floor slice.
        if (origin > 0 && prevOrigin === origin) {
          results.push({ storeId, ok: true, skipped: true, reason: 'origin-unchanged' });
          continue;
        }
        const cloud = await requestJson(`${cloudBase()}/rst/edge/live-ingest`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
          body: snapshot,
        });
        lastPushedOriginByStore.set(storeId, origin);
        results.push({
          storeId,
          ok: true,
          openOrders: Number(cloud.data?.openOrders || 0),
          kitchenTickets: Number(cloud.data?.kitchenTickets || 0),
        });
      } catch (err) {
        results.push({ storeId, ok: false, error: err.message || String(err) });
        if (err.status === 401 || err.status === 403) {
          clearSession();
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
