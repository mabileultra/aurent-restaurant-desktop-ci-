const { requestJson, cloudBase } = require('./edgeHttp');

/**
 * Cheap cloud origin read — decide pull-first when server moved (web close/open).
 * @param {{ token?: string, storeIds?: number[] }|null} session
 * @returns {Promise<Map<number, number>>} storeId → origin
 */
async function probeCloudOrigins(session) {
  if (!session?.token || !session.storeIds?.length) {
    return new Map();
  }
  const out = new Map();
  for (const storeId of session.storeIds) {
    try {
      const q = new URLSearchParams({ storeId: String(storeId) });
      const res = await requestJson(`${cloudBase()}/rst/edge/live-origin?${q}`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const origin = Number(res.data?.origin || 0);
      if (Number.isFinite(origin)) out.set(storeId, origin);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) throw err;
      /* next store */
    }
  }
  return out;
}

/** True when any cloud origin is newer than last applied on this PC. */
function cloudOriginsAhead(cloudOrigins, lastSeenCloudOriginByStore) {
  if (!(cloudOrigins instanceof Map) || cloudOrigins.size === 0) return false;
  for (const [storeId, origin] of cloudOrigins) {
    if (!(origin > 0)) continue;
    const seen = lastSeenCloudOriginByStore.get(storeId);
    if (seen == null || origin > seen) return true;
  }
  return false;
}

module.exports = {
  probeCloudOrigins,
  cloudOriginsAhead,
};
