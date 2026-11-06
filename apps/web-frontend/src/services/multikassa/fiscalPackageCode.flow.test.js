import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from '../../store/cartStore';
import { buildSaleOperationBody } from './buildMultikassaOperations';

/** Как usePosCartHandlers.cartProductPayload после фикса. */
function cashierCartPayload(product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode ?? null,
    ikpu: product.ikpu ?? null,
    packageCode: product.packageCode ?? null,
    unitMeasureCode: product.unitMeasureCode ?? null,
    unitOfMeasure: product.unitOfMeasure ?? null,
    commissionTin: product.commissionTin ?? null,
    saleType: product.saleType || 'PIECE',
    unitCode: product.unitCode,
    costPrice: Number(product.costPrice ?? 0),
    sellingPrice: Number(product.sellingPrice ?? 0),
    defaultDiscountPercent: Number(product.defaultDiscountPercent ?? 0),
    taxRate: Number(product.taxRate ?? 12),
    stockQuantity: Number(product.stockQuantity ?? 0),
  };
}

/** Старый баг: packageCode выкидывался на кассе. */
function brokenCashierCartPayload(product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    ikpu: product.ikpu ?? null,
    saleType: product.saleType || 'PIECE',
    unitCode: product.unitCode,
    sellingPrice: Number(product.sellingPrice ?? 0),
    taxRate: Number(product.taxRate ?? 12),
    stockQuantity: Number(product.stockQuantity ?? 0),
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
  stockQuantity: 100,
};

const CAPS = {
  enabled: true,
  terminalId: 'YZ231006044579',
  baseUrl: 'http://localhost:12346',
  moduleNumber: 'YZ231006044579',
};

describe('fiscal packageCode flow: catalog → POS cart → Multikassa', () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      orderDiscountAmount: 0,
      customerId: null,
      customerName: null,
      checkNo: null,
      parkedCarts: [],
    });
  });

  it('sends Tasnif package 1546940, not unit measure 1', () => {
    const payload = cashierCartPayload(KLEY);
    expect(payload.packageCode).toBe('1546940');
    expect(payload.unitMeasureCode).toBe('1');

    useCartStore.getState().addPieceItem(payload, 1);
    const line = useCartStore.getState().items[0];
    expect(line.packageCode).toBe('1546940');
    expect(line.ikpu).toBe('03214001014000010');
    expect(line.unitMeasureCode).toBe('1');

    const body = buildSaleOperationBody({
      cartItems: useCartStore.getState().items,
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 15000,
      capabilities: CAPS,
      shiftId: 'shift-1',
      cashierName: 'Javlon',
      contractorName: 'Aminjon Samarqand XK',
    });

    expect(body.receipt_gnk_terminalid).toBe('YZ231006044579');
    expect(body.force_to_print).toBe(false);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].ikpu).toBe('03214001014000010');
    expect(body.items[0].product_package).toBe('1546940');
    expect(body.items[0].product_package).not.toBe('1');
    expect(JSON.stringify(body)).not.toContain('"product_package":"1"');
  });

  it('still recovers package from sku when cashier forgot packageCode (legacy)', () => {
    const payload = brokenCashierCartPayload(KLEY);
    expect(payload.packageCode).toBeUndefined();

    useCartStore.getState().addPieceItem(payload, 1);
    const body = buildSaleOperationBody({
      cartItems: useCartStore.getState().items,
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 15000,
      capabilities: CAPS,
      shiftId: 'shift-1',
      cashierName: 'Javlon',
    });

    expect(body.items[0].product_package).toBe('1546940');
  });

  it('does not send unit code 1 when package code is missing', () => {
    const payload = brokenCashierCartPayload({ ...KLEY, sku: 'KLEY-1' });
    useCartStore.getState().addPieceItem(payload, 1);
    const body = buildSaleOperationBody({
      cartItems: useCartStore.getState().items,
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 15000,
      capabilities: CAPS,
      shiftId: 'shift-1',
      cashierName: 'Javlon',
    });
    expect(body.items[0].product_package).toBe('');
  });
});
