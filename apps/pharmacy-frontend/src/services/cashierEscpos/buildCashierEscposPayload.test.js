import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/config';
import { buildCashierEscposPayload } from './buildCashierEscposPayload';
import { buildEscposTestSale } from './mockTestSale';

describe('buildCashierEscposPayload (pharmacy-frontend)', () => {
  it('forces locale to uz and translates labels in Uzbek even if active language is Russian', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const sale = buildEscposTestSale();
    const payload = buildCashierEscposPayload(sale);
    expect(payload.locale).toBe('uz');
    expect(payload.labels.cash).toBe('Naqd');
    expect(payload.labels.grandTotal).toBe('Jami');
    expect(payload.labels.stir).toBe('STIR');
    expect(payload.labels.footer).toBe('Xaridingiz uchun rahmat. Chekni saqlang.');
  });

  it('translates corporate card label into Uzbek and formats category separately', () => {
    const sale = { ...buildEscposTestSale(), paymentMethod: 'CARD', cardType: 'CORPORATE' };
    const payload = buildCashierEscposPayload(sale);
    expect(payload.labels.plastic).toBe('Plastik');
    expect(payload.sale.cardCategoryDisplay).toBe('Korporativ');

    const providerSale = { ...buildEscposTestSale(), paymentMethod: 'CARD', cardType: 'HUMO' };
    const providerPayload = buildCashierEscposPayload(providerSale);
    expect(providerPayload.labels.plastic).toBe('Plastik · Humo');
  });
});
