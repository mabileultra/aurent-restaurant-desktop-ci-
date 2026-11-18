import { describe, expect, it } from 'vitest';
import i18n from '../i18n/config';
import { getReceiptTranslator, RECEIPT_LOCALE } from './receiptI18n';

describe('receiptI18n', () => {
  it('has RECEIPT_LOCALE set to uz', () => {
    expect(RECEIPT_LOCALE).toBe('uz');
  });

  it('translates receipt keys strictly in Uzbek even if current i18n language is Russian', async () => {
    await i18n.changeLanguage('ru');
    expect(i18n.language).toBe('ru');

    const tReceipt = getReceiptTranslator();
    expect(tReceipt('fiscalReceipt.cash')).toBe('Naqd');
    expect(tReceipt('fiscalReceipt.plastic')).toBe('Bank kartasi');
    expect(tReceipt('fiscalReceipt.grandTotal')).toBe('JAMI');
    expect(tReceipt('fiscalReceipt.stir')).toBe('STIR/JSHSHIR');
  });

  it('translates receipt keys strictly in Uzbek when i18n language is Uzbek', async () => {
    await i18n.changeLanguage('uz');
    const tReceipt = getReceiptTranslator();
    expect(tReceipt('fiscalReceipt.cash')).toBe('Naqd');
    expect(tReceipt('fiscalReceipt.paymentForm')).toBe('To‘lov shakli');
  });
});
