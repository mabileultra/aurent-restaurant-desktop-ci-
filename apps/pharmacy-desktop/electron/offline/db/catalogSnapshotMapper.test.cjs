const { test } = require('node:test');
const assert = require('node:assert/strict');
const { snapshotToLocalProduct } = require('./catalogSnapshotMapper.cjs');

test('snapshot maps ProductSnapshotEvent fields onto local product', () => {
  const local = snapshotToLocalProduct({
    productId: '11111111-1111-1111-1111-111111111111',
    companyId: 7,
    sku: 'SKU-1',
    productName: 'Milk',
    barcode: '460123',
    categoryId: 3,
    categoryName: 'Dairy',
    costPrice: 10,
    sellingPrice: 15,
    lowStockAlert: 5,
    active: true,
    updatedAt: '2026-11-02T10:00:00Z',
  });
  assert.equal(local.id, '11111111-1111-1111-1111-111111111111');
  assert.equal(local.name, 'Milk');
  assert.equal(local.sellingPrice, 15);
  assert.equal(local.categoryId, 3);
  assert.equal(local.active, true);
});

test('snapshot merges over existing payload and respects inactive', () => {
  const local = snapshotToLocalProduct(
    {
      productId: 'p1',
      productName: 'New',
      sellingPrice: 99,
      active: false,
    },
    { id: 'p1', name: 'Old', taxRate: 12, saleType: 'WEIGHT', sellingPrice: 1 },
  );
  assert.equal(local.name, 'New');
  assert.equal(local.taxRate, 12);
  assert.equal(local.saleType, 'WEIGHT');
  assert.equal(local.sellingPrice, 99);
  assert.equal(local.active, false);
});
