const { requestJson, cloudBase } = require('./edgeHttp');
const { getLiveCloudSession } = require('./edgeLiveSync');

const PRESENCE_MIN_MS = 15_000;

let lastPushAt = 0;
let inFlight = false;

/**
 * Tell cloud (and thus phones) whether this hall PC can reach the internet.
 * While online: heartbeat + LAN URLs. On drop: best-effort cloudOnline:false.
 */
async function pushHallPresence({ online, getLastStatus, force = false } = {}) {
  const session = getLiveCloudSession();
  if (!session?.token || !session.storeIds?.length || !session.companyId) {
    return { skipped: true, reason: 'no-session' };
  }
  const now = Date.now();
  if (!force && online && now - lastPushAt < PRESENCE_MIN_MS) {
    return { skipped: true, reason: 'throttled' };
  }
  if (inFlight) {
    return { skipped: true, reason: 'in-flight' };
  }
  inFlight = true;
  try {
    const status = typeof getLastStatus === 'function' ? getLastStatus() : {};
    const urls = Array.isArray(status.lanHubUrls) && status.lanHubUrls.length
      ? status.lanHubUrls
      : (status.lanHubUrl ? [status.lanHubUrl] : []);
    await requestJson(`${cloudBase()}/rst/edge/hall-presence`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.token}` },
      body: {
        companyId: session.companyId,
        storeIds: session.storeIds,
        cloudOnline: Boolean(online),
        lanHubUrls: urls,
      },
    });
    lastPushAt = Date.now();
    return { ok: true, cloudOnline: Boolean(online) };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  } finally {
    inFlight = false;
  }
}

module.exports = {
  pushHallPresence,
  PRESENCE_MIN_MS,
};
