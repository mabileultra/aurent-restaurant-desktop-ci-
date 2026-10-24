import { describe, it, expect } from 'vitest';
import {
  buildSaleOperationBody,
  normalizeGnkTerminalId,
  resolveReceivedCashCard,
} from './buildMultikassaOperations';
import { toTiyin } from './multikassaMoney';

describe('normalizeGnkTerminalId', () => {
  it('unwraps doubled YZ serial', () => {
    expect(normalizeGnkTerminalId('YZ231006044579YZ231006044579')).toBe('YZ231006044579');
  });

  it('keeps normal serial', () => {
    expect(normalizeGnkTerminalId('YZ231006044579')).toBe('YZ231006044579');
  });
});

describe('buildSaleOperationBody (Multikassa Operations API)', () => {
  const capabilities = {
    enabled: true,
    terminalId: 'FM_TERMINAL_ID',
    baseUrl: 'http://localhost:8080',
    moduleNumber: 'FM_MODULE',
  };

  it('puts receipt money in tiyin and item prices in sums', () => {
    const body = buildSaleOperationBody({
      cartItems: [
        {
          productId: 123,
          name: 'Вегас',
          quantity: 1,
          unitPrice: 133100,
          ikpu: '03002005001000000',
          packageCode: '1546940',
          unitMeasureCode: '1',
          barcode: '2131415421412',
          taxRate: 12,
        },
      ],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 133100,
      capabilities,
      shiftId: 'SHIFT_GUID',
      cashierName: 'CASHIER',
      contractorName: 'AURENT',
    });

    expect(body.module_operation_type).toBe('3');
    expect(body.receipt_sum).toBe(toTiyin(133100));
    expect(body.receipt_gnk_receivedcash).toBe(toTiyin(133100));
    expect(body.receipt_gnk_receivedcard).toBe(0);
    expect(body.receipt_gnk_terminalid).toBe('FM_TERMINAL_ID');
    expect(body.module_gnk_terminalid).toBe('FM_TERMINAL_ID');
    expect(body.force_to_print).toBe(false);
    expect(body.receipt_gnk_time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(body.shift_id).toBe('SHIFT_GUID');
    expect(body.contractor_name).toBe('AURENT');
    expect(body.items).toHaveLength(1);
    expect(body.items[0].product_price).toBe(133100);
    expect(body.items[0].total_product_price).toBe(133100);
    expect(body.items[0].ikpu).toBe('03002005001000000');
    expect(body.items[0].classifier_class_code).toBe('03002005001000000');
    expect(body.items[0].product_vat_percent).toBe(12);
    expect(body.items[0].product_package).toBe('1546940');
    expect(body.items[0].product_barcodes[0].barcode).toBe('2131415421412');
  });

  it('prefers packageCode over unitMeasureCode for product_package', () => {
    const body = buildSaleOperationBody({
      cartItems: [
        {
          productId: 1,
          name: 'Клей',
          quantity: 1,
          unitPrice: 1000,
          ikpu: '03214001014000010',
          packageCode: '1546940',
          unitMeasureCode: '1',
          taxRate: 12,
        },
      ],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 1000,
      capabilities,
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(body.items[0].product_package).toBe('1546940');
  });

  it('parses package code from Tasnif external id when packageCode missing', () => {
    const body = buildSaleOperationBody({
      cartItems: [
        {
          productId: 1,
          name: 'Клей',
          quantity: 1,
          unitPrice: 1000,
          ikpu: '03214001014000010',
          sku: '03214001014000010:1546940',
          unitMeasureCode: '1',
          taxRate: 12,
        },
      ],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 1000,
      capabilities,
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(body.items[0].product_package).toBe('1546940');
  });

  it('puts identification KM into product_label for ASL OFD', () => {
    const body = buildSaleOperationBody({
      cartItems: [
        {
          productId: 1,
          name: 'Nimid',
          quantity: 1,
          unitPrice: 10000,
          ikpu: '03002005001000000',
          packageCode: '1546940',
          taxRate: 12,
          productMark:
            '0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=',
        },
      ],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 10000,
      capabilities,
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(body.items[0].product_label).toBe('0108906002059409218MTGE3S706TDT');
    expect(body.items[0].product_mark).toBe('0108906002059409218MTGE3S706TDT');
  });

  it('sends grams as the package name when the product unit is grams', () => {
    const body = buildSaleOperationBody({
      cartItems: [
        {
          productId: 1,
          name: 'Сахар',
          quantity: 200,
          unitPrice: 50,
          ikpu: '03214001014000010',
          packageCode: '1546941',
          packageName: 'килограмм',
          unitCode: 'G',
          unitOfMeasure: 'g',
          taxRate: 12,
        },
      ],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 10000,
      capabilities,
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(body.items[0].count).toBe(200);
    expect(body.items[0].product_package_name).toBe('g');
  });

  it('does not treat unitMeasureCode 1 as package code', () => {
    const body = buildSaleOperationBody({
      cartItems: [
        {
          productId: 1,
          name: 'Клей',
          quantity: 1,
          unitPrice: 1000,
          ikpu: '03214001014000010',
          unitMeasureCode: '1',
          taxRate: 12,
        },
      ],
      payment: { paymentMethod: 'CASH', receiptType: 'SALE' },
      total: 1000,
      capabilities,
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(body.items[0].product_package).toBe('');
  });

  it('splits mixed cash/card into received fields', () => {
    expect(resolveReceivedCashCard({ paymentMethod: 'MIXED', cashAmount: 100000, cardAmount: 0 }, 209457.66))
      .toEqual({ cash: 100000, card: 109457.66 });

    const body = buildSaleOperationBody({
      cartItems: [{ productId: 1, name: 'X', quantity: 1, unitPrice: 209457.66, taxRate: 12 }],
      payment: { paymentMethod: 'MIXED', cashAmount: 100000, cardAmount: 109457.66 },
      total: 209457.66,
      capabilities,
      shiftId: 's1',
      cashierName: 'CASHIER',
    });
    expect(body.receipt_gnk_receivedcash).toBe(toTiyin(100000));
    expect(body.receipt_gnk_receivedcard).toBe(toTiyin(109457.66));
  });
});
