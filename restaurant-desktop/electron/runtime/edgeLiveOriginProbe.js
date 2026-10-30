const { requestJson, localBase, bootstrapSecret } = require('./edgeHttp');

/**
 * Cheap local origin read — used to push live immediately when floor changes.
 * @param {{ companyId?: number, storeIds?: number[], bootstrapSecret?: string }|null} session
 * @returns {Promise<Map<number, number>>} storeId → origin
 */
async function probeLocalOrigins(session) {
  if (!session?.companyId || !session.storeIds?.length) {
    return new Map();
  }
  const secret = bootstrapSecret(session.bootstrapSecret);
  const out = new Map();
  for (const storeId of session.storeIds) {
    try {
      const q = new URLSearchParams({
        storeId: String(storeId),
        companyId: String(session.companyId),
        bootstrapSecret: secret,
      });
      const res = await requestJson(`${localBase()}/edge/live-origin?${q}`);
      const origin = Number(res.data?.origin || 0);
      if (Number.isFinite(origin)) out.set(storeId, origin);
    } catch {
      /* next store / next tick */
    }
  }
  return out;
}

/** True when any store origin grew past the last successfully pushed value. */
function originsNeedPush(origins, lastPushedOriginByStore) {
  if (!(origins instanceof Map) || origins.size === 0) return false;
  for (const [storeId, origin] of origins) {
    if (!(origin > 0)) continue;
    const prev = lastPushedOriginByStore.get(storeId);
    if (prev == null || origin > prev) return true;
  }
  return false;
}

module.exports = {
  probeLocalOrigins,
  originsNeedPush,
};
