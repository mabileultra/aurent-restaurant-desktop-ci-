const {
  getDb,
  persistDb,
  setMeta,
  rowsFromStmt,
} = require('./connection.cjs');
const {
  upsertProduct,
  removeProduct,
  replaceAllCategories,
} = require('./catalogProductWrite.cjs');

const PRODUCT_CHUNK_SIZE = 80;

function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Apply incremental catalog delta (no full wipe of products).
 * Categories are replaced wholesale when the payload includes a categories array.
 */
async function applyCatalogDelta(payload) {
  if (payload?.fullReset) {
    return { ok: false, error: 'full_reset_required', fullReset: true };
  }

  const db = await getDb();
  const products = payload?.products || [];
  const removedIds = payload?.removedProductIds || [];
  const categories = payload?.categories;

  db.run('BEGIN');
  try {
    const metaOpts = { persist: false };
    if (payload?.storeId != null) setMeta('storeId', String(payload.storeId), metaOpts);
    if (payload?.storeName) setMeta('storeName', payload.storeName, metaOpts);
    if (payload?.syncedAt) setMeta('lastCatalogSyncAt', payload.syncedAt, metaOpts);

    if (Array.isArray(categories)) {
      replaceAllCategories(db, categories);
    }

    for (const id of removedIds) {
      removeProduct(db, id);
    }

    for (let i = 0; i < products.length; i += 1) {
      upsertProduct(db, products[i]);
      if ((i + 1) % PRODUCT_CHUNK_SIZE === 0 && i + 1 < products.length) {
        await yieldEventLoop();
      }
    }

    setMeta('bootstrapReady', '1', { persist: false });
    db.run('COMMIT');
    persistDb();

    const productCount =
      rowsFromStmt(db.prepare('SELECT COUNT(*) AS c FROM products'))[0]?.c ?? 0;

    return {
      ok: true,
      fullReset: false,
      upserted: products.length,
      removed: removedIds.length,
      categoryCount: Array.isArray(categories) ? categories.length : undefined,
      productCount: Number(productCount),
      syncedAt: payload?.syncedAt || new Date().toISOString(),
    };
  } catch (err) {
    try {
      db.run('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw err;
  }
}

module.exports = {
  PRODUCT_CHUNK_SIZE,
  applyCatalogDelta,
};
