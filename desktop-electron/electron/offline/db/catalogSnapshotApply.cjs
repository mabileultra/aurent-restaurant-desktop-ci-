const {
  getDb,
  persistDb,
  rowsFromStmt,
  parseJson,
  setMeta,
} = require('./connection.cjs');
const { upsertProduct, removeProduct } = require('./catalogProductWrite.cjs');
const { snapshotToLocalProduct } = require('./catalogSnapshotMapper.cjs');
const { shouldApplySnapshot } = require('./catalogSnapshotVersion.cjs');

const CHUNK = 80;

function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

function loadExisting(db, productId) {
  const stmt = db.prepare('SELECT payload_json FROM products WHERE id = ? LIMIT 1');
  stmt.bind([String(productId)]);
  const rows = rowsFromStmt(stmt);
  return rows.length ? parseJson(rows[0].payload_json, null) : null;
}

/**
 * Apply ProductSnapshotEvent[] (from Kafka / catalog-service outbox / future WS).
 * Inactive → remove from local cashier index (same as delta removedIds).
 */
async function applyProductSnapshots(payload) {
  const events = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.events)
      ? payload.events
      : payload?.event
        ? [payload.event]
        : [];

  if (!events.length) {
    return { ok: true, upserted: 0, removed: 0 };
  }

  const db = await getDb();
  let upserted = 0;
  let removed = 0;

  db.run('BEGIN');
  try {
    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];
      const id = event?.productId || event?.id;
      if (!id) continue;

      const existing = loadExisting(db, id);
      if (!shouldApplySnapshot(event, existing)) {
        continue;
      }
      const local = snapshotToLocalProduct(event, existing);
      if (!local) continue;

      if (local.active === false) {
        removeProduct(db, id);
        removed += 1;
      } else {
        upsertProduct(db, local);
        upserted += 1;
      }

      if ((i + 1) % CHUNK === 0 && i + 1 < events.length) {
        await yieldEventLoop();
      }
    }

    if (payload?.syncedAt) {
      setMeta('lastCatalogSyncAt', String(payload.syncedAt), { persist: false });
    } else {
      setMeta('lastCatalogSyncAt', new Date().toISOString(), { persist: false });
    }
    setMeta('bootstrapReady', '1', { persist: false });
    db.run('COMMIT');
    persistDb();

    return { ok: true, upserted, removed, syncedAt: getLastSync(db) };
  } catch (err) {
    try {
      db.run('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  }
}

function getLastSync() {
  try {
    const { getMeta } = require('./connection.cjs');
    return getMeta('lastCatalogSyncAt') || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

module.exports = {
  applyProductSnapshots,
  loadExisting,
};
