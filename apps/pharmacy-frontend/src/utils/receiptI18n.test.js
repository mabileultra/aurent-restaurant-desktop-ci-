import { describe, expect, it } from 'vitest';
import i18n from '../i18n/config';
import { getReceiptTranslator, RECEIPT_LOCALE } from './receiptI18n';

describe('receiptI18n (pharmacy-frontend)', () => {
  it('has RECEIPT_LOCALE set to uz', () => {
    expect(RECEIPT_LOCALE).toBe('uz');
  });

  it('translates receipt keys strictly in Uzbek even if current i18n language is Russian', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const tReceipt = getReceiptTranslator();
    expect(tReceipt('fiscalReceipt.cash')).toBe('Naqd');
    expect(tReceipt('fiscalReceipt.plastic')).toBe('Plastik');
    expect(tReceipt('fiscalReceipt.grandTotal')).toBe('Jami');
    expect(tReceipt('fiscalReceipt.stir')).toBe('STIR');
  });

  it('translates receipt keys strictly in Uzbek when i18n language is Uzbek', async () => {
    await i18n.changeLanguage('uz');
    const tReceipt = getReceiptTranslator();
    expect(tReceipt('fiscalReceipt.cash')).toBe('Naqd');
    expect(tReceipt('fiscalReceipt.paymentForm')).toBe("To'lov shakli");
  });
});
