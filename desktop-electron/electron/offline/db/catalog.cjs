const {
  getDb,
  persistDb,
  rowsFromStmt,
  parseJson,
  getMeta,
  ensureDeviceId,
} = require('./connection.cjs');
const { fold, foldSql } = require('./catalogSearchFold.cjs');
const { importBootstrapChunked } = require('./catalogBootstrapImport.cjs');
const { applyCatalogDelta } = require('./catalogDeltaImport.cjs');
const { barcodeScanVariants } = require('./barcodeScanVariants.cjs');

async function importBootstrap(payload) {
  return importBootstrapChunked(payload);
}

async function importCatalogDelta(payload) {
  return applyCatalogDelta(payload);
}

async function getBootstrapStatus() {
  const db = await getDb();
  return {
    deviceId: ensureDeviceId(),
    storeId: getMeta('storeId') ? Number(getMeta('storeId')) : null,
    storeName: getMeta('storeName') || '',
    lastCatalogSyncAt: getMeta('lastCatalogSyncAt'),
    bootstrapReady: getMeta('bootstrapReady') === '1',
    productCount: rowsFromStmt(db.prepare('SELECT COUNT(*) AS c FROM products'))[0]?.c ?? 0,
    pendingSales: rowsFromStmt(
      db.prepare("SELECT COUNT(*) AS c FROM local_sales WHERE sync_status = 'pending'"),
    )[0]?.c ?? 0,
  };
}

async function listCategories() {
  const db = await getDb();
  return rowsFromStmt(db.prepare('SELECT payload_json FROM categories ORDER BY name')).map((r) =>
    parseJson(r.payload_json, {}),
  );
}

async function searchProducts({ search = '', categoryId, limit = 200, offset = 0 } = {}) {
  const db = await getDb();
  const q = String(search || '').trim();
  let sql = 'SELECT payload_json FROM products WHERE active = 1';
  const params = [];
  if (categoryId != null && categoryId !== '' && categoryId !== 'ALL') {
    sql += ' AND category_id = ?';
    params.push(Number(categoryId));
  }
  if (q) {
    const like = `%${fold(q)}%`;
    sql += ` AND (
      ${foldSql("COALESCE(name, '')")} LIKE ?
      OR ${foldSql("COALESCE(sku, '')")} LIKE ?
      OR ${foldSql("COALESCE(barcode, '')")} LIKE ?
      OR ${foldSql("COALESCE(json_extract(payload_json, '$.ikpu'), '')")} LIKE ?
      OR EXISTS (
        SELECT 1 FROM product_barcodes b
        WHERE b.product_id = products.id
          AND ${foldSql("COALESCE(b.barcode, '')")} LIKE ?
      )
    )`;
    params.push(like, like, like, like, like);
  }
  sql += ' ORDER BY name LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const stmt = db.prepare(sql);
  stmt.bind(params);
  return rowsFromStmt(stmt).map((r) => parseJson(r.payload_json, null)).filter(Boolean);
}

async function getProductByBarcode(barcode) {
  const db = await getDb();
  const variants = barcodeScanVariants(barcode);
  if (!variants.length) return null;

  const byBarcode = db.prepare(
    `SELECT p.payload_json FROM product_barcodes b
     JOIN products p ON p.id = b.product_id
     WHERE b.barcode = ? AND p.active = 1 LIMIT 1`,
  );
  for (const code of variants) {
    byBarcode.bind([code]);
    const barcodeRows = rowsFromStmt(byBarcode);
    if (barcodeRows.length) {
      return parseJson(barcodeRows[0].payload_json, null);
    }
  }

  // ИКПУ/МХИК: в barcode не пишем, но на кассе пробивают 14–17 цифр
  const byIkpu = db.prepare(
    `SELECT payload_json FROM products
     WHERE active = 1
       AND trim(COALESCE(json_extract(payload_json, '$.ikpu'), '')) = ?
     LIMIT 1`,
  );
  for (const code of variants) {
    byIkpu.bind([code]);
    const ikpuRows = rowsFromStmt(byIkpu);
    if (ikpuRows.length) {
      return parseJson(ikpuRows[0].payload_json, null);
    }
  }
  return null;
}

async function getProductById(id) {
  const db = await getDb();
  const stmt = db.prepare('SELECT payload_json FROM products WHERE id = ? AND active = 1 LIMIT 1');
  stmt.bind([String(id)]);
  const rows = rowsFromStmt(stmt);
  return rows.length ? parseJson(rows[0].payload_json, null) : null;
}

async function decreaseLocalStock(productId, quantity) {
  await decreaseLocalStockBatch([{ productId, quantity }]);
}

async function decreaseLocalStockBatch(lines = [], { persist = true } = {}) {
  if (!lines.length) return;
  const db = await getDb();
  for (const line of lines) {
    if (!line?.productId) continue;
    db.run(
      'UPDATE products SET stock_quantity = CASE WHEN stock_quantity - ? < 0 THEN 0 ELSE stock_quantity - ? END WHERE id = ?',
      [Number(line.quantity), Number(line.quantity), String(line.productId)],
    );
  }
  if (persist) persistDb();
}

module.exports = {
  importBootstrap,
  importCatalogDelta,
  getBootstrapStatus,
  listCategories,
  searchProducts,
  getProductByBarcode,
  getProductById,
  decreaseLocalStock,
  decreaseLocalStockBatch,
};
