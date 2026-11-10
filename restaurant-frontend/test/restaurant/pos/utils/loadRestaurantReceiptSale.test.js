import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveReceiptQrValue } from '../../../../src/utils/fiscalReceiptFormat';

const orderApi = vi.hoisted(() => ({ get: vi.fn() }));
const paymentApi = vi.hoisted(() => ({ getPayment: vi.fn(), attachFiscal: vi.fn() }));

vi.mock('../../../../src/restaurant/api/order.api', () => ({ rstOrderApi: orderApi }));
vi.mock('../../../../src/restaurant/api/payment.api', () => ({ rstPaymentApi: paymentApi }));

const { loadRestaurantReceiptSale } = await import(
  '../../../../src/restaurant/pos/utils/loadRestaurantReceiptSale'
);

const order = {
  id: 'o-1',
  channel: 'DINE_IN',
  tableCode: 'A1',
  storeId: 1,
  status: 'CLOSED',
  items: [{
    id: 'i1',
    menuItemId: 'm1',
    name: 'Лагман',
    quantity: 1,
    unitPrice: 35000,
    itemStatus: 'SERVED',
    ikpu: '01709001001000000',
    packageCode: '1501228',
  }],
};

beforeEach(() => {
  orderApi.get.mockReset().mockResolvedValue({ data: order });
  paymentApi.getPayment.mockReset();
});

describe('loadRestaurantReceiptSale — OFD without stored QR', () => {
  it('rebuilds ofd.soliq.uz QR from payment proof columns', async () => {
    paymentApi.getPayment.mockResolvedValue({
      data: {
        method: 'CASH',
        amount: 35000,
        cashAmount: 35000,
        cardAmount: 0,
        amountTendered: 35000,
        changeGiven: 0,
        fiscalStatus: 'FISCALIZED',
        fiscalSign: '848035748636',
        fiscalReceiptSeq: '583',
        multikassaSaleId: 'mk-1',
        fiscalTerminalId: 'UZ190912014310',
        fiscalizedAt: '2023-05-26T20:45:23.55Z',
      },
    });

    const sale = await loadRestaurantReceiptSale({
      orderId: 'o-1',
      storeName: 'Test',
      cashierName: 'Kassir',
      waiterNameById: new Map(),
      t: (k, o) => o?.defaultValue ?? k,
    });

    expect(sale.printFiscalQr).toBe(true);
    expect(sale.fiscalQrUrl).toBeNull();
    const qr = resolveReceiptQrValue(sale);
    expect(qr).toContain('ofd.soliq.uz/check');
    expect(qr).toContain('t=UZ190912014310');
    expect(qr).toContain('s=848035748636');
    expect(qr).toContain('r=583');
  });

  it('tax-off payment → no fiscal QR on reopen', async () => {
    paymentApi.getPayment.mockResolvedValue({
      data: {
        method: 'CASH',
        amount: 35000,
        cashAmount: 35000,
        cardAmount: 0,
        amountTendered: 35000,
        changeGiven: 0,
      },
    });

    const sale = await loadRestaurantReceiptSale({
      orderId: 'o-1',
      storeName: 'Test',
      t: (k) => k,
    });

    expect(sale.printFiscalQr).toBe(false);
    expect(resolveReceiptQrValue(sale)).toBe('');
  });
});
