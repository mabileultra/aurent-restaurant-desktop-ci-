import { describe, expect, it } from 'vitest';
import {
  FD_OPERATION,
  FD_PAYMENT_TYPE,
  FD_RECEIPT_TYPE,
  buildFiscalDriveReceipt,
  validateFiscalDriveReceipt,
} from './index';

const NOW = new Date(2024, 8, 4, 9, 45, 38);
const SHORT_KM = '0108906002059409218MTGE3S706TDT';

const line = (overrides = {}) => ({
  name: 'Товар',
  ikpu: '90363039122553629',
  packageCode: '1580107',
  unitPrice: 1000,
  quantity: 1,
  taxRate: 12,
  ...overrides,
});

describe('buildFiscalDriveReceipt', () => {
  it('reproduces the FiscalDriveService doc example (prices, discount, VAT, amounts)', () => {
    const receipt = buildFiscalDriveReceipt({
      cartItems: [
        line({ name: 'AAAA', unitPrice: 500, quantity: 2, discount: 500, barcode: '1247059838170' }),
        line({ name: 'BBBB', ikpu: '07219001697739637', unitPrice: 125, quantity: 4 }),
      ],
      payment: { paymentMethod: 'MIXED', cashAmount: 500, cardAmount: 500 },
      total: 1000,
      now: NOW,
    });

    expect(receipt).toMatchObject({
      Time: '2024-09-04 09:45:38',
      ReceivedCash: 50000,
      ReceivedCard: 50000,
      PaymentType: FD_PAYMENT_TYPE.MIXED,
      Type: FD_RECEIPT_TYPE.PURCHASE,
      Operation: FD_OPERATION.SALE,
    });
    expect(receipt.Items[0]).toMatchObject({
      Name: 'AAAA',
      Barcode: '1247059838170',
      SPIC: '90363039122553629',
      Price: 100000,
      Discount: 50000,
      Other: 0,
      Amount: 2000,
      VATPercent: 12,
      VAT: 5357,
    });
    expect(receipt.Items[1]).toMatchObject({ Price: 50000, Discount: 0, Amount: 4000, VAT: 5357 });
    expect(receipt.RefundInfo).toBeUndefined();
    expect(validateFiscalDriveReceipt(receipt)).toEqual([]);
  });

  it('spreads an order-level discount across lines so sums match exactly', () => {
    const receipt = buildFiscalDriveReceipt({
      cartItems: [line({ unitPrice: 333.33 }), line({ unitPrice: 333.33 }), line({ unitPrice: 333.34 })],
      payment: { paymentMethod: 'CASH' },
      total: 900,
      now: NOW,
    });

    const net = receipt.Items.reduce((acc, i) => acc + i.Price - i.Discount - i.Other, 0);
    expect(receipt.Items.reduce((acc, i) => acc + i.Discount, 0)).toBe(10000);
    expect(net).toBe(90000);
    expect(receipt.ReceivedCash).toBe(90000);
    expect(receipt.PaymentType).toBe(FD_PAYMENT_TYPE.CASH);
    expect(validateFiscalDriveReceipt(receipt)).toEqual([]);
  });

  it('scales weight quantity by 1000 and keeps Price as the whole line sum', () => {
    const [item] = buildFiscalDriveReceipt({
      cartItems: [line({ unitPrice: 20000, quantity: 0.5 })],
      payment: { paymentMethod: 'CARD' },
      total: 10000,
      now: NOW,
    }).Items;

    expect(item.Amount).toBe(500);
    expect(item.Price).toBe(1000000);
  });

  it('puts short marking codes into Labels, dedupes them and strips the crypto tail', () => {
    const [item] = buildFiscalDriveReceipt({
      cartItems: [
        line({
          quantity: 2,
          productMarks: [`${SHORT_KM}\u001d91EE11\u001d92abcdef`, SHORT_KM],
        }),
      ],
      payment: { paymentMethod: 'CASH' },
      total: 2000,
      now: NOW,
    }).Items;

    expect(item.Labels).toEqual([SHORT_KM]);
  });

  it('maps commission TIN/PINFL and zero VAT for products without VAT', () => {
    const [tin, pinfl] = buildFiscalDriveReceipt({
      cartItems: [
        line({ commissionTin: '346496427', productWithoutVat: true }),
        line({ commitentTin: '12345678901234' }),
      ],
      payment: { paymentMethod: 'CASH' },
      total: 2000,
      now: NOW,
    }).Items;

    expect(tin.CommissionInfo).toEqual({ TIN: '346496427' });
    expect(tin.VATPercent).toBe(0);
    expect(tin.VAT).toBe(0);
    expect(pinfl.CommissionInfo).toEqual({ PINFL: '12345678901234' });
  });

  it('maps advance / credit receipt types and card-only payment', () => {
    const build = (receiptType) =>
      buildFiscalDriveReceipt({
        cartItems: [line()],
        payment: { paymentMethod: 'CARD', receiptType },
        total: 1000,
        now: NOW,
      });

    expect(build('ADVANCE').Type).toBe(FD_RECEIPT_TYPE.ADVANCE);
    expect(build('CREDIT').Type).toBe(FD_RECEIPT_TYPE.CREDIT);
    expect(build('SALE').PaymentType).toBe(FD_PAYMENT_TYPE.CARD);
  });

  it('builds a refund with RefundInfo from the original receipt', () => {
    const receipt = buildFiscalDriveReceipt({
      cartItems: [line()],
      payment: { paymentMethod: 'CASH' },
      total: 1000,
      refundInfo: {
        terminalId: 'ZZ000000000000',
        receiptSeq: '22',
        dateTime: '20211102141307',
        fiscalSign: '445705250315',
      },
      now: NOW,
    });

    expect(receipt.Operation).toBe(FD_OPERATION.REFUND);
    expect(receipt.RefundInfo).toEqual({
      TerminalID: 'ZZ000000000000',
      ReceiptSeq: 22,
      DateTime: '20211102141307',
      FiscalSign: '445705250315',
    });
  });

  it('does not send RefundInfo with an empty DateTime', () => {
    const receipt = buildFiscalDriveReceipt({
      cartItems: [line()],
      payment: { paymentMethod: 'CASH' },
      total: 1000,
      refundInfo: { terminalId: 'ZZ1', receiptSeq: 1, dateTime: '', fiscalSign: '1' },
      now: NOW,
    });
    expect(receipt.Time).toBe('2024-09-04 09:45:38');
    expect(receipt.Operation).toBe(FD_OPERATION.SALE);
    expect(receipt.RefundInfo).toBeUndefined();
  });
});

describe('validateFiscalDriveReceipt', () => {
  const base = () =>
    buildFiscalDriveReceipt({
      cartItems: [line()],
      payment: { paymentMethod: 'CASH' },
      total: 1000,
      now: NOW,
    });

  it('rejects payment that differs from items by more than 100 sum', () => {
    const receipt = { ...base(), ReceivedCash: 100000 + 10001 };
    expect(validateFiscalDriveReceipt(receipt).join(' ')).toMatch(/не совпадает/);
  });

  it('accepts a difference within 100 sum', () => {
    const receipt = { ...base(), ReceivedCash: 100000 + 10000 };
    expect(validateFiscalDriveReceipt(receipt)).toEqual([]);
  });

  it('does not apply the sum equation to advance receipts', () => {
    const receipt = { ...base(), Type: FD_RECEIPT_TYPE.ADVANCE, ReceivedCash: 30000 };
    expect(validateFiscalDriveReceipt(receipt)).toEqual([]);
  });

  it('flags zero price, missing IKPU and empty receipts', () => {
    const receipt = base();
    receipt.Items[0] = { ...receipt.Items[0], Price: 0, SPIC: '' };
    const errors = validateFiscalDriveReceipt(receipt).join(' ');
    expect(errors).toMatch(/цена должна быть больше 0/);
    expect(errors).toMatch(/не указан ИКПУ/);
    expect(validateFiscalDriveReceipt({ ...base(), Items: [] }).join(' ')).toMatch(/нет позиций/);
  });
});
