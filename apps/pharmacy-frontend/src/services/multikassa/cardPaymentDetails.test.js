import { describe, expect, it, vi } from 'vitest';
import { CARD_CATEGORY } from '@aurent/shared-types';

vi.mock('../../store/tenantDisplayStore', () => ({
  useTenantDisplayStore: {
    getState: () => ({
      committed: {
        receiptFields: {
          payment: true,
          items: true,
          fiscalBlock: true,
          qrCode: true,
        },
        receiptCompanyName: 'Apteka #1',
      },
    }),
  },
}));

vi.mock('../../store/printSettingsStore', () => ({
  usePrintSettingsStore: {
    getState: () => ({ paperWidthMm: 80 }),
  },
}));

vi.mock('../../i18n/config', () => ({
  default: { language: 'ru' },
}));

import { buildSaleOperationBody } from './buildMultikassaOperations';
import { buildFiscalDriveReceipt } from '../fiscal/providers/fiscalDrive/buildFiscalDriveReceipt';
import { buildCashierEscposPayload } from '../cashierEscpos/buildCashierEscposPayload';
import { validateAndNormalizeCardDetails } from '../../features/pharmacy-cashier/components/PharmacyCardFields';

const DICT = {
  'fiscalReceipt.paymentForm': 'Форма оплаты',
  'fiscalReceipt.cash': 'Наличные',
  'fiscalReceipt.plastic': 'Пластик',
  'fiscalReceipt.cardType': 'Тип карты',
  'fiscalReceipt.cardRrn': 'RRN',
  'fiscalReceipt.socialCardNumber': 'Социальная карта',
  'pos.cardHumo': 'Humo',
  'pos.cardUzcard': 'Uzcard',
  'pos.cardCorporate': 'Корпоративная',
  'pos.cardPersonal': 'Личная',
  'pos.cardSocial': 'Социальная',
};
const t = (key, opts) => DICT[key] ?? opts?.defaultValue ?? key;

const CART = [
  {
    productId: 101,
    name: 'Парацетамол 500мг',
    quantity: 1,
    unitPrice: 12000,
    taxRate: 12,
    ikpu: '03004001001000000',
    packageCode: '12345',
  },
];

describe('pharmacy card details (type, RRN, masked social card)', () => {
  it('validates and normalizes social card input from slip or full number', () => {
    expect(
      validateAndNormalizeCardDetails(
        {
          cardCategory: CARD_CATEGORY.SOCIAL,
          rrn: '6318 1017 7451',
          socialCardInput: '986003******8031:01',
        },
        t,
      ),
    ).toEqual({
      ok: true,
      data: {
        cardCategory: CARD_CATEGORY.SOCIAL,
        rrn: '631810177451',
        socialCardNumber: '9860********8031',
      },
    });

    const missingSocial = validateAndNormalizeCardDetails(
      { cardCategory: CARD_CATEGORY.SOCIAL, rrn: '631810177451', socialCardInput: '9860' },
      t,
    );
    expect(missingSocial.ok).toBe(false);
    expect(missingSocial.field).toBe('socialCardInput');

    const missingRrn = validateAndNormalizeCardDetails(
      { cardCategory: CARD_CATEGORY.PERSONAL, rrn: '123', socialCardInput: '' },
      t,
    );
    expect(missingRrn.ok).toBe(false);
    expect(missingRrn.field).toBe('rrn');
  });

  it('passes card category, RRN and masked social card to Multikassa and FiscalDrive', () => {
    const payment = {
      paymentMethod: 'CARD',
      cardType: 'HUMO',
      cardCategory: CARD_CATEGORY.SOCIAL,
      rrn: '631810177451',
      socialCardNumber: '986003******8031:01',
    };

    const mkBody = buildSaleOperationBody({
      cartItems: CART,
      payment,
      total: 12000,
      capabilities: { terminalId: 'TERM001' },
      shiftId: 5,
      cashierName: 'Кассир',
    });

    expect(mkBody.card_type).toBe(3);
    expect(mkBody.ppt_id).toBe('631810177451');
    expect(mkBody.card_number).toBe('9860********8031');

    const fdBody = buildFiscalDriveReceipt({
      cartItems: CART,
      payment,
      total: 12000,
      capabilities: {},
    });

    expect(fdBody.CardType).toBe(3);
    expect(fdBody.PPTID).toBe('631810177451');
    expect(fdBody.CardNumber).toBe('9860********8031');

    const cashBody = buildSaleOperationBody({
      cartItems: CART,
      payment: { paymentMethod: 'CASH', amountTendered: 12000 },
      total: 12000,
      capabilities: { terminalId: 'TERM001' },
    });
    expect(cashBody.card_type).toBeUndefined();
    expect(cashBody.ppt_id).toBeUndefined();
    expect(cashBody.card_number).toBeUndefined();
  });

  it('populates separate card category, RRN and social card fields in ESC/POS payload', () => {
    const payload = buildCashierEscposPayload(
      {
        id: 's1',
        receiptNumber: 'PHR-1',
        createdAt: '2026-11-14T10:00:00Z',
        totalAmount: 12000,
        paymentMethod: 'CARD',
        cardType: 'HUMO',
        cardCategory: CARD_CATEGORY.CORPORATE,
        rrn: '631811236997',
        items: [{ productName: 'Item', quantity: 1, lineTotal: 12000 }],
      },
      t,
    );

    expect(payload.labels.plastic).toBe('Пластик · Humo');
    expect(payload.labels.cardType).toBe('Тип карты');
    expect(payload.labels.cardRrn).toBe('RRN');
    expect(payload.labels.socialCardNumber).toBe('Социальная карта');
    expect(payload.sale.cardCategoryDisplay).toBe('Корпоративная');
    expect(payload.sale.rrn).toBe('631811236997');
    expect(payload.sale.socialCardNumber).toBeNull();
  });
});
