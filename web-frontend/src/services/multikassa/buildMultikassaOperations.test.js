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
          packageCode: '1',
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
    expect(body.items[0].product_barcodes[0].barcode).toBe('2131415421412');
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
