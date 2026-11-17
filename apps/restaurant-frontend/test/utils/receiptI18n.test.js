import { describe, expect, it } from 'vitest';
import i18n from '../../src/i18n/config';
import { getReceiptTranslator, RECEIPT_LOCALE } from '../../src/utils/receiptI18n';

describe('receiptI18n (restaurant-frontend)', () => {
  it('has RECEIPT_LOCALE set to uz', () => {
    expect(RECEIPT_LOCALE).toBe('uz');
  });

  it('translates restaurant bill and fiscal receipt keys strictly in Uzbek even if active language is Russian', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const tReceipt = getReceiptTranslator();
    expect(tReceipt('fiscalReceipt.cash')).toBe('Naqd');
    expect(tReceipt('fiscalReceipt.grandTotal')).toBe('Jami');
    expect(tReceipt('rst.order.requestBill')).toBe('Hisob');
    expect(tReceipt('rst.order.waiter')).toBe('Ofitsiant');
  });

  it('translates keys in Uzbek when language is Uzbek', async () => {
    await i18n.changeLanguage('uz');
    const tReceipt = getReceiptTranslator();
    expect(tReceipt('fiscalReceipt.cash')).toBe('Naqd');
    expect(tReceipt('rst.order.subtotalShort')).toBe('Jami');
  });
});
