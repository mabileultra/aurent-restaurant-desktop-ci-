const { requestJson, localBase, cloudBase, bootstrapSecret } = require('./edgeHttp');

/** Pull nomenclature + stock quantities from cloud /products into edge_products. */
async function bootstrapStockFromCloud({
  token,
  companyId,
  storeId,
  bootstrapSecret: secret,
} = {}) {
  if (!token || !companyId || !storeId) {
    throw new Error('token, companyId and storeId required for stock bootstrap');
  }
  const products = [];
  let page = 0;
  let totalPages = 1;
  while (page < totalPages && page < 40) {
    const q = new URLSearchParams({
      storeId: String(storeId),
      activeOnly: 'false',
      page: String(page),
      size: '100',
    });
    const { data } = await requestJson(`${cloudBase()}/products?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const content = data?.content || (Array.isArray(data) ? data : []);
    for (const p of content) {
      if (!p?.id || !p?.name) continue;
      products.push({
        id: p.id,
        sku: p.sku,
        name: p.name,
        barcode: p.barcode,
        unitCode: p.unitCode || p.unit_code,
        taxRate: p.taxRate,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        stockQuantity: p.stockQuantity ?? p.stock_qty ?? 0,
        lowStockAlert: p.lowStockAlert ?? 0,
        ikpu: p.ikpu,
        packageCode: p.packageCode,
        unitOfMeasure: p.unitOfMeasure,
        unitMeasureCode: p.unitMeasureCode,
        markedProduct: Boolean(p.markedProduct),
        active: p.active !== false,
      });
    }
    totalPages = Number(data?.totalPages || 1);
    page += 1;
    if (!content.length) break;
  }
  if (!products.length) {
    return { saved: 0, hasStock: false, skipped: true };
  }
  const local = await requestJson(`${localBase()}/edge/bootstrap/stock`, {
    method: 'POST',
    body: {
      bootstrapSecret: bootstrapSecret(secret),
      companyId,
      storeId,
      products,
    },
  });
  return local.data;
}

module.exports = { bootstrapStockFromCloud };
