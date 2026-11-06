/**
 * Map shared ProductSnapshotEvent JSON → local offline product card fields.
 * Merges over existing payload so delta fields (tax/saleType/…) survive lean snapshots.
 */
function snapshotToLocalProduct(event, existing) {
  if (!event?.productId && !event?.id) {
    return null;
  }
  const id = String(event.productId || event.id);
  const base = existing && typeof existing === 'object' ? existing : {};
  const active = event.active !== false && event.active !== 0;
  return {
    ...base,
    id,
    companyId: event.companyId ?? base.companyId ?? null,
    sku: event.sku ?? base.sku ?? '',
    name: event.productName ?? event.name ?? base.name ?? '',
    barcode: event.barcode ?? base.barcode ?? null,
    categoryId: event.categoryId ?? base.categoryId ?? null,
    categoryName: event.categoryName ?? base.categoryName ?? null,
    costPrice: event.costPrice ?? base.costPrice ?? 0,
    sellingPrice: event.sellingPrice ?? base.sellingPrice ?? 0,
    lowStockAlert: event.lowStockAlert ?? base.lowStockAlert ?? 10,
    active,
    updatedAt: event.updatedAt ?? base.updatedAt ?? null,
    barcodes: Array.isArray(base.barcodes) ? base.barcodes : [],
  };
}

module.exports = {
  snapshotToLocalProduct,
};
