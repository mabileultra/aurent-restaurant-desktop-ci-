import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../../i18n/config';
import FiscalReceiptBody from './FiscalReceiptBody';
import { useTenantDisplayStore } from '../../store/tenantDisplayStore';

const SAMPLE_PHARMACY_SALE_26_FIELDS = {
  id: 'sale-soliq-full-pharmacy',
  receiptNumber: 'CHK-20250913-0012',
  fiscalReceiptSeq: '12',
  fiscalTerminalId: 'N586000000000',
  fiscalVirtualSn: 'VR-12345678',
  fiscalSign: '984572019348',
  fiscalQrUrl: 'https://ofd.soliq.uz/check?t=N586000000000&r=12&c=20250913114420&s=984572019348',
  printFiscalQr: true,
  createdAt: '2025-09-13T11:44:20Z',
  cashierName: 'Aliyev V.V.',
  registerNumber: '4',
  storeName: 'OOO "MAKRO-RETAIL"',
  receiptType: 'SALE',
  paymentMethod: 'MIXED',
  paidCash: 50000,
  paidCard: 60000,
  paidQr: 40000,
  cardAmount: 60000,
  totalAmount: 150000,
  cardType: 'HUMO',
  cardCategory: 'SOCIAL',
  socialCardNumber: '9860********8031',
  rrn: '631810177451',
  items: [
    {
      id: 'item-1',
      productName: 'Pishloq Gollandskiy',
      quantity: 1.5,
      saleType: 'WEIGHT',
      unitOfMeasure: 'kg',
      price: 60000,
      unitPrice: 60000,
      lineTotal: 90000,
      taxRatePercent: 12,
      taxAmount: 9642.86,
      ikpu: '00101001001000000',
      barcode: '4780012345678',
      markingCode: '0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=',
      commissionTin: '200523221',
    },
    {
      id: 'item-2',
      productName: 'Sharbat Olma 1L',
      quantity: 3,
      unitOfMeasure: 'dona',
      price: 20000,
      unitPrice: 20000,
      lineTotal: 60000,
      taxRatePercent: 12,
      taxAmount: 6428.57,
      ikpu: '00202002002000000',
      barcode: '4780098765432',
    },
  ],
};

describe('Tax Authority (Soliq xizmati) Receipt — 26 Fields Validation (pharmacy-frontend)', () => {
  it('renders all 26 fields according to Soliq template with separate asserts', async () => {
    await i18n.changeLanguage('uz');

    useTenantDisplayStore.getState().hydrateFromPayload({
      receiptCompanyName: 'OOO "MAKRO-RETAIL"',
      receiptCompanyAddress: 'Toshkent sh., Chilonzor t., 12-mavze, 4-uy',
      receiptStir: '305123456',
      receiptFields: {
        logo: false,
        companyName: true,
        companyAddress: true,
        companyPhone: false,
        stir: true,
        dateTime: true,
        receiptNo: true,
        employee: true,
        shift: true,
        items: true,
        itemVatLine: true,
        itemIkpu: true,
        grandTotal: true,
        vatTotal: true,
        payment: true,
        fiscalBlock: true,
        qrCode: true,
      },
    });

    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: SAMPLE_PHARMACY_SALE_26_FIELDS })
    );

    // 1: Korxona nomi
    expect(html).toContain('OOO &quot;MAKRO-RETAIL&quot;');
    // 2: Manzil
    expect(html).toContain('Toshkent sh., Chilonzor t., 12-mavze, 4-uy');
    // 3: STIR/JSHSHIR
    expect(html).toContain('STIR/JSHSHIR: 305123456');
    // 4: Sana va Vaqt (soniyalar bilan)
    expect(html).toContain('Sana:');
    expect(html).toContain('13.09.2025');
    expect(html).toContain('Vaqt:');
    expect(html).toContain(':44:20');
    // 5: Chek raqami
    expect(html).toContain('Chek raqami');
    expect(html).toContain('№12');
    // 6: Kassir
    expect(html).toContain('Aliyev V.V.');
    // 7: Smena
    expect(html).toContain('Smena');
    expect(html).toContain('>4<');
    // 8: Tovar nomi
    expect(html).toContain('Pishloq Gollandskiy');
    expect(html).toContain('Sharbat Olma 1L');
    // 9: O'lchov birligi (o'zbekcha) va miqdor
    expect(html).toContain('1.5 kg');
    expect(html).toContain('3 * 20');
    // 10 & 11: sh.j. QQS 12% va qator QQS summasi
    expect(html).toContain('sh.j. QQS 12%');
    expect(html).toContain('9 642,86');
    // 12: MXIK
    expect(html).toContain('MXIK: 00101001001000000');
    // 13: ShT.kod
    expect(html).toContain('ShT.kod: 4780012345678');
    // 14: MK (markirovka kodi - 1:1 fiskal formatda)
    expect(html).toContain('MK: 0108906002059409218MTGE3S706TDT');
    // 15: Komitent (STIR/JShShIR)
    expect(html).toContain('Komitent (STIR): 200523221');
    // 16: JAMI
    expect(html).toContain('JAMI');
    expect(html).toContain('150 000');
    // 17: sh.j. jami QQS 12%
    expect(html).toContain('sh.j. jami QQS 12%');
    // 18: To'lov shakli (faqat >0 bo'lgan usullar, Bank kartasi (Humo))
    expect(html).toContain('To‘lov shakli:');
    expect(html).toContain('Bank kartasi (Humo)');
    // 19: Bank kartasi turi: Ijtimoiy
    expect(html).toContain('Bank kartasi turi');
    expect(html).toContain('Ijtimoiy');
    // 20: Karta raqami (5614 **** **** 8956 formati — faqat ijtimoiy kartada)
    expect(html).toContain('Karta raqami');
    expect(html).toContain('9860 **** **** 8031');
    // 21: RRN kodi
    expect(html).toContain('RRN kodi');
    expect(html).toContain('631810177451');
    // 22: Chek turi: Sotuv cheki
    expect(html).toContain('Chek turi');
    expect(html).toContain('Sotuv cheki');
    // 23: Virtual kassa S/R
    expect(html).toContain('Virtual kassa S/R');
    expect(html).toContain('VR-12345678');
    // 24: FM raqami
    expect(html).toContain('FM raqami');
    expect(html).toContain('N586000000000');
    // 25: Fiskal belgi
    expect(html).toContain('Fiskal belgi');
    expect(html).toContain('984572019348');
    // 26: Soliq QR kodi (svg / qr mavjudligi)
    expect(html).toContain('receipt-qr');
    expect(html).toContain('<svg');
  });

  it('omits card number row (20-band) for non-social cards', () => {
    const regularCardSale = {
      ...SAMPLE_PHARMACY_SALE_26_FIELDS,
      cardCategory: null,
      socialCardNumber: null,
      cardNumber: '8600123456781234',
    };
    const html = renderToStaticMarkup(
      React.createElement(FiscalReceiptBody, { sale: regularCardSale })
    );
    expect(html).toContain('Bank kartasi (Humo)');
    expect(html).not.toContain('Karta raqami');
  });
});
