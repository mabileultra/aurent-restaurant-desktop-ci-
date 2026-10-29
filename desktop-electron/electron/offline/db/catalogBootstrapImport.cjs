const {
  getDb,
  persistDb,
  setMeta,
} = require('./connection.cjs');
const { insertCategory, insertProduct } = require('./catalogProductWrite.cjs');

const PRODUCT_CHUNK_SIZE = 80;

function yieldEventLoop() {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Full catalog replace with chunked inserts so the Electron main process can breathe.
 */
async function importBootstrapChunked(payload) {
  const db = await getDb();
  const products = payload?.products || [];
  const categories = payload?.categories || [];

  db.run('BEGIN');
  try {
    db.run('DELETE FROM product_barcodes');
    db.run('DELETE FROM products');
    db.run('DELETE FROM categories');

    const metaOpts = { persist: false };
    if (payload?.storeId != null) setMeta('storeId', String(payload.storeId), metaOpts);
    if (payload?.storeName) setMeta('storeName', payload.storeName, metaOpts);
    if (payload?.syncedAt) setMeta('lastCatalogSyncAt', payload.syncedAt, metaOpts);

    for (const cat of categories) {
      insertCategory(db, cat);
    }

    for (let i = 0; i < products.length; i += 1) {
      insertProduct(db, products[i]);
      if ((i + 1) % PRODUCT_CHUNK_SIZE === 0 && i + 1 < products.length) {
        await yieldEventLoop();
      }
    }

    setMeta('bootstrapReady', '1', { persist: false });
    db.run('COMMIT');
    persistDb();
    return {
      ok: true,
      productCount: products.length,
      categoryCount: categories.length,
      syncedAt: payload?.syncedAt || new Date().toISOString(),
    };
  } catch (err) {
    try {
      db.run('ROLLBACK');
    } catch {
      /* ignore rollback errors */
    }
    throw err;
  }
}

module.exports = {
  PRODUCT_CHUNK_SIZE,
  importBootstrapChunked,
};
