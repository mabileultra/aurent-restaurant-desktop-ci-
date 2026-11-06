function insertCategory(db, cat) {
  db.run('INSERT INTO categories(id, name, payload_json) VALUES(?, ?, ?)', [
    cat.id,
    cat.name,
    JSON.stringify(cat),
  ]);
}

function insertProduct(db, product) {
  const barcodes = Array.isArray(product.barcodes) ? product.barcodes : [];
  const primary = product.barcode || barcodes[0] || '';
  db.run(
    `INSERT INTO products(
      id, sku, name, selling_price, tax_rate, barcode, category_id,
      sale_type, unit_code, quantity_scale, allow_fraction, stock_quantity, active, payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.sku || '',
      product.name,
      Number(product.sellingPrice ?? 0),
      Number(product.taxRate ?? 12),
      primary,
      product.categoryId ?? null,
      product.saleType || 'PIECE',
      product.unitCode || 'PCS',
      Number(product.quantityScale ?? 0),
      product.allowFraction ? 1 : 0,
      Number(product.stockQuantity ?? 0),
      product.active === false ? 0 : 1,
      JSON.stringify(product),
    ],
  );
  const codes = new Set([primary, ...barcodes].filter(Boolean));
  for (const code of codes) {
    db.run('INSERT OR REPLACE INTO product_barcodes(barcode, product_id) VALUES(?, ?)', [
      code,
      product.id,
    ]);
  }
}

function upsertProduct(db, product) {
  const id = product?.id;
  if (id == null) return;
  db.run('DELETE FROM product_barcodes WHERE product_id = ?', [String(id)]);
  db.run('DELETE FROM products WHERE id = ?', [String(id)]);
  insertProduct(db, product);
}

function removeProduct(db, productId) {
  if (productId == null) return;
  const id = String(productId);
  db.run('DELETE FROM product_barcodes WHERE product_id = ?', [id]);
  db.run('DELETE FROM products WHERE id = ?', [id]);
}

function replaceAllCategories(db, categories) {
  db.run('DELETE FROM categories');
  for (const cat of categories || []) {
    insertCategory(db, cat);
  }
}

module.exports = {
  insertCategory,
  insertProduct,
  upsertProduct,
  removeProduct,
  replaceAllCategories,
};
