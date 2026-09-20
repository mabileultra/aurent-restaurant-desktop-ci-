import { describe, it, expect } from 'vitest';
import { buildSaleOperationBody } from '../../../src/services/multikassa/buildMultikassaOperations';

function toCartLine(product, quantity = 1) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? null,
    ikpu: product.ikpu ?? null,
    packageCode: product.packageCode ?? null,
    unitMeasureCode: product.unitMeasureCode ?? null,
    unitOfMeasure: product.unitOfMeasure ?? null,
    saleType: product.saleType || 'PIECE',
    unitCode: product.unitCode,
    unitPrice: Number(product.sellingPrice ?? 0),
    quantity,
    taxRate: Number(product.taxRate ?? 12),
  };
}

const KLEY = {
  id: 'prod-kley-1',
  name: 'Клей плиточный',
  sku: '03214001014000010:1546940',
  barcode: null,
  ikpu: '03214001014000010',
  packageCode: '1546940',
  unitMeasureCode: '1',
  unitOfMeasure: 'кг',
  saleType: 'WEIGHT',
  unitCode: 'KG',
  sellingPrice: 15000,
  taxRate: 12,
};

const CAPS = {
  enabled: true,
  terminalId: 'YZ231006044579',
  baseUrl: 'http://localhost:12346',
  moduleNumber: 'YZ231006044579',
};

describe('fiscal packageCode flow: line → Multikassa', () => {
  it('sends Tasnif package 1546940, not unit measure 1', () => {
    const line = toCartLine(KLEY);
    expect(line.packageCode).toBe('1546940');

    const body = buildSaleOperationBody({
      cartItems: [line],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 15000,
      capabilities: CAPS,
      shiftId: 'shift-1',
      cashierName: 'Javlon',
      contractorName: 'Aminjon Samarqand XK',
    });

    expect(body.items).toHaveLength(1);
    expect(body.items[0].ikpu).toBe('03214001014000010');
    expect(body.items[0].product_package).toBe('1546940');
    expect(body.items[0].product_package).not.toBe('1');
  });

  it('still recovers package from sku when packageCode missing', () => {
    const line = toCartLine({ ...KLEY, packageCode: undefined });
    const body = buildSaleOperationBody({
      cartItems: [line],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 15000,
      capabilities: CAPS,
      shiftId: 'shift-1',
      cashierName: 'Javlon',
    });
    expect(body.items[0].product_package).toBe('1546940');
  });

  it('does not send unit code 1 when package code is missing', () => {
    const line = toCartLine({ ...KLEY, sku: 'KLEY-1', packageCode: undefined });
    const body = buildSaleOperationBody({
      cartItems: [line],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 15000,
      capabilities: CAPS,
      shiftId: 'shift-1',
      cashierName: 'Javlon',
    });
    expect(body.items[0].product_package).toBe('');
  });
});
