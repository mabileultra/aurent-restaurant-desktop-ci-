const {
  getLiveCloudSession,
  getLastPushedOrigins,
  getLastSeenCloudOrigins,
  markCloudOriginsSeen,
  refreshLiveFromCloud,
  pushLiveToCloud,
  clearLiveCloudSessionMemory,
} = require('./edgeLiveSync');
const { probeLocalOrigins, originsNeedPush } = require('./edgeLiveOriginProbe');
const { probeCloudOrigins, cloudOriginsAhead } = require('./edgeCloudOriginProbe');

/**
 * Online live round: behave like web when server moved; otherwise push local then pull.
 * Offline callers never reach here (loop gates on liveSession + online).
 */
async function runDirectedLiveRound() {
  const session = getLiveCloudSession();
  if (!session?.token || !session.storeIds?.length) {
    return { skipped: true, reason: 'no-session' };
  }

  let cloudOrigins;
  try {
    cloudOrigins = await probeCloudOrigins(session);
  } catch (err) {
    if (err?.status === 401 || err?.status === 403) {
      clearLiveCloudSessionMemory();
    }
    // Fall back to push→pull if probe failed (non-auth).
    await pushLiveToCloud();
    const pulled = await refreshLiveFromCloud();
    markCloudOriginsSeen(cloudOriginsFromPull(pulled));
    return { ok: true, direction: 'push-pull-fallback' };
  }

  const serverAhead = cloudOriginsAhead(cloudOrigins, getLastSeenCloudOrigins());
  if (serverAhead) {
    // Server changed (e.g. closed tables/shift on site) — adopt first, do not reopen via stale push.
    const pulled = await refreshLiveFromCloud();
    markCloudOriginsSeen(mergeOriginMaps(cloudOrigins, cloudOriginsFromPull(pulled)));
    const localOrigins = await probeLocalOrigins(session);
    if (originsNeedPush(localOrigins, getLastPushedOrigins())) {
      await pushLiveToCloud();
      const again = await refreshLiveFromCloud();
      markCloudOriginsSeen(cloudOriginsFromPull(again));
    }
    return { ok: true, direction: 'pull-first' };
  }

  await pushLiveToCloud();
  const pulled = await refreshLiveFromCloud();
  markCloudOriginsSeen(mergeOriginMaps(cloudOrigins, cloudOriginsFromPull(pulled)));
  return { ok: true, direction: 'push-pull' };
}

function cloudOriginsFromPull(pulled) {
  const out = new Map();
  if (!pulled?.results) return out;
  for (const row of pulled.results) {
    if (!row?.ok || row.cloudOrigin == null) continue;
    const origin = Number(row.cloudOrigin);
    if (Number.isFinite(origin) && origin > 0) out.set(Number(row.storeId), origin);
  }
  return out;
}

function mergeOriginMaps(a, b) {
  const out = new Map(a instanceof Map ? a : []);
  if (b instanceof Map) {
    for (const [k, v] of b) out.set(k, v);
  }
  return out;
}

module.exports = {
  runDirectedLiveRound,
};
