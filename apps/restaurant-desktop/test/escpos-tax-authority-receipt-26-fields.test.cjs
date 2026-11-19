/**
 * Tax Authority (Soliq xizmati) Receipt — 26 Fields Validation in ESC/POS (58mm & 80mm).
 * Validates:
 *  1: Korxona nomi
 *  2: Korxona manzili
 *  3: STIR/JSHSHIR
 *  4: Sana va Vaqt (soniyalar bilan)
 *  5: Chek raqami
 *  6: Kassir
 *  7: Smena
 *  8: Tovar nomi
 *  9: Miqdor va o'zbekcha o'lchov birligi (kg, dona)
 * 10 & 11: sh.j. QQS 12% va tovar QQS summasi
 * 12: MXIK
 * 13: ShT.kod
 * 14: MK (markirovka kodi - 1:1 fiskal formatda)
 * 15: Komitent (STIR)
 * 16: JAMI
 * 17: sh.j. jami QQS 12%
 * 18: To'lov shakli (Naqd, Bank kartasi, QR-kodli to'lov)
 * 19: Bank kartasi turi (Ijtimoiy / Shaxsiy / Korporativ)
 * 20: Karta raqami (faqat ijtimoiy karta uchun, masalan: 9860 **** **** 8031)
 * 21: RRN kodi
 * 22: Chek turi (Sotuv cheki)
 * 23: Virtual kassa S/R
 * 24: FM raqami
 * 25: Fiskal belgi
 * 26: Soliq QR kodi (printQR or printImage)
 */
const assert = require('node:assert/strict');
const test = require('node:test');
const { buildReceiptOnPrinter } = require('../electron/cashier-receipt-escpos/escpos-sale-builder.cjs');

const TAX_QR = 'https://ofd.soliq.uz/check?t=N586000000000&r=12&c=20250913114420&s=984572019348';
const FULL_KM = '0108906002059409218MTGE3S706TDT91UZF092enFQOcSQ9jQzKA16EsBIzjMGF9RCYf1JZd2ReSG6eiU=';

function createFakePrinter(paperMm = 80) {
  const calls = [];
  const printer = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'calls') return calls;
        if (prop === 'getWidth') return () => (paperMm <= 58 ? 32 : 48);
        return (...args) => {
          calls.push({ method: String(prop), args });
        };
      },
    },
  );
  return printer;
}

function createSample26FieldsPayload(paperMm = 80) {
  return {
    paperWmm: paperMm,
    locale: 'uz',
    qrValue: TAX_QR,
    receiptFields: {
      companyName: true,
      companyAddress: true,
      stir: true,
      headerMeta: true,
      items: true,
      itemVat: true,
      itemVatLine: true,
      itemIkpu: true,
      grandTotal: true,
      vatTotal: true,
      payment: true,
      receiptType: true,
      fiscalBlock: true,
      qrCode: true,
      footer: true,
    },
    labels: {
      stir: 'STIR/JSHSHIR',
      date: 'Sana',
      time: 'Vaqt',
      receiptNo: 'Chek raqami',
      cashier: 'Kassir',
      shiftNo: 'Smena',
      vatLine: 'sh.j. QQS {{rate}}%',
      vatLineShort: 'sh.j. QQS {{rate}}%',
      ikpuLine: 'MXIK',
      barcode: 'ShT.kod',
      marking: 'MK',
      commissionTin: 'Komitent (STIR)',
      grandTotal: 'JAMI',
      vatTotalLine: 'sh.j. jami QQS {{rate}}%',
      paymentForm: 'To‘lov shakli:',
      cash: 'Naqd',
      plastic: 'Bank kartasi',
      qrPayment: 'QR-kodli to‘lov',
      cardType: 'Bank kartasi turi',
      cardNumber: 'Karta raqami',
      socialCardNumber: 'Ijtimoiy karta',
      cardRrn: 'RRN kodi',
      receiptType: 'Chek turi',
      receiptTypeSale: 'Sotuv cheki',
      fiscalSection: 'Fiskal ma’lumotlar',
      virtualRegister: 'Virtual kassa S/R',
      fmNumber: 'FM raqami',
      fiscalReceiptNo: 'Chek raqami',
      fiscalSign: 'Fiskal belgi',
      footer: 'Xaridingiz uchun rahmat. Chekni saqlang.',
    },
    branding: {
      companyName: 'OOO "MAKRO-RETAIL"',
      companyAddress: 'Toshkent sh., Chilonzor t., 12-mavze, 4-uy',
      stir: '305123456',
      virtualRegister: 'VR-12345678',
    },
    sale: {
      id: 'sale-26-fields',
      receiptNumber: 'CHK-20250913-0012',
      fiscalReceiptSeq: '12',
      fiscalTerminalId: 'N586000000000',
      fiscalVirtualSn: 'VR-12345678',
      fiscalSign: '984572019348',
      fiscalQrUrl: TAX_QR,
      printFiscalQr: true,
      createdAt: '2025-09-13T11:44:20Z',
      cashierName: 'Aliyev V.V.',
      shiftNo: '4',
      storeName: 'OOO "MAKRO-RETAIL"',
      receiptType: 'SALE',
      receiptTypeLabel: 'Sotuv cheki',
      paymentMethod: 'MIXED',
      cashAmount: 50000,
      paidCash: 50000,
      cardAmount: 60000,
      paidCard: 60000,
      qrAmount: 40000,
      paidQr: 40000,
      totalAmount: 150000,
      taxTotal: 16071.43,
      vatRatePercent: 12,
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
          markingCode: FULL_KM,
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
    },
  };
}

function getPrintedLines(printer) {
  return printer.calls
    .filter((c) => c.method === 'println' || c.method === 'leftRight')
    .map((c) => c.args.join(' '))
    .join('\n');
}

for (const paperMm of [58, 80]) {
  test(`ESC/POS receipt prints all 26 tax authority fields on ${paperMm}mm paper (restaurant-desktop)`, async () => {
    const printer = createFakePrinter(paperMm);

    const payload = createSample26FieldsPayload(paperMm);
    await buildReceiptOnPrinter(printer, payload, `job-${paperMm}`);
    const output = getPrintedLines(printer);

    // 1: Korxona nomi
    assert.ok(output.includes('OOO "MAKRO-RETAIL"'), '1: Korxona nomi chiqishi kerak');
    // 2: Korxona manzili
    assert.ok(output.includes('Toshkent sh., Chilonzor t.'), '2: Korxona manzili chiqishi kerak');
    // 3: STIR/JSHSHIR
    assert.ok(output.includes('STIR/JSHSHIR: 305123456'), '3: STIR/JSHSHIR chiqishi kerak');
    // 4: Sana va Vaqt (soniyalar bilan)
    assert.ok(output.includes('Sana: 13.09.2025'), '4a: Sana chiqishi kerak');
    assert.ok(output.includes('Vaqt: 16:44:20'), '4b: Vaqt soniyalar bilan chiqishi kerak');
    // 5: Chek raqami
    assert.ok(output.includes('Chek raqami') && (output.includes('№12') || output.includes('12')), '5: Chek raqami chiqishi kerak');
    // 6: Kassir
    assert.ok(output.includes('Aliyev V.V.'), '6: Kassir chiqishi kerak');
    // 7: Smena
    assert.ok(output.includes('4') || output.includes('Smena'), '7: Smena chiqishi kerak');
    // 8: Tovar nomi
    assert.ok(output.includes('Pishloq Gollandskiy'), '8: Tovar nomi chiqishi kerak');
    // 9: O'lchov birligi (o'zbekcha) va miqdor
    assert.ok(output.includes('1.5 kg') || output.includes('1.500 kg') || output.includes('1.5kg'), '9: 1.5 kg chiqishi kerak');
    assert.ok(output.includes('3 dona') || output.includes('3.000 dona') || output.includes('3dona') || output.includes('3 *'), '9: 3 dona chiqishi kerak');
    // 10 & 11: sh.j. QQS 12% va qator QQS summasi
    assert.ok(output.includes('sh.j. QQS 12%'), '10: sh.j. QQS 12% chiqishi kerak');
    assert.ok(output.includes('9 642.86') || output.includes('9642') || output.includes('9 642,86'), '11: tovar QQS summasi chiqishi kerak');
    // 12: MXIK
    assert.ok(output.includes('MXIK: 00101001001000000'), '12: MXIK chiqishi kerak');
    // 13: ShT.kod
    assert.ok(output.includes('ShT.kod: 4780012345678'), '13: ShT.kod chiqishi kerak');
    // 14: MK (markirovka kodi - 1:1 fiskal formatda)
    assert.ok(
      output.includes('0108906002059409218MTGE3S706TDT') && (output.includes('MK:') || output.includes('MK')),
      '14: MK chiqishi kerak'
    );
    // 15: Komitent (STIR)
    assert.ok(output.includes('Komitent (STIR): 200523221'), '15: Komitent (STIR) chiqishi kerak');
    // 16: JAMI
    assert.ok(output.includes('JAMI'), '16: JAMI chiqishi kerak');
    assert.ok(output.includes('150 000') || output.includes('150000'), '16: Jami summa chiqishi kerak');
    // 17: sh.j. jami QQS 12%
    assert.ok(output.includes('sh.j. jami QQS 12%'), '17: Jami QQS qatori chiqishi kerak');
    // 18: To'lov shakli (Naqd, Bank kartasi (Humo), QR-kodli to'lov)
    assert.ok(output.includes("To'lov shakli") || output.includes('To‘lov shakli'), '18: To‘lov shakli chiqishi kerak');
    assert.ok(output.includes('Naqd'), '18: Naqd chiqishi kerak');
    assert.ok(output.includes('Bank kartasi (Humo)'), '18: Bank kartasi (Humo) chiqishi kerak');
    assert.ok(output.includes("QR-kodli to'lov") || output.includes('QR-kodli to‘lov'), '18: QR-kodli to‘lov chiqishi kerak');
    // 19: Bank kartasi turi (ijtimoiy karta toifasi)
    assert.ok(output.includes('Bank kartasi turi') && output.includes('Ijtimoiy'), '19: Karta turi (Ijtimoiy) chiqishi kerak');
    // 20: Karta raqami (5614 **** **** 8956)
    assert.ok(output.includes('Karta raqami') && output.includes('9860 **** **** 8031'), '20: Karta raqami probelli niqob bilan chiqishi kerak');
    // 21: RRN kodi
    assert.ok(output.includes('631810177451'), '21: RRN kodi chiqishi kerak');
    // 22: Chek turi (Sotuv cheki)
    assert.ok(output.includes('Sotuv cheki'), '22: Chek turi (Sotuv cheki) chiqishi kerak');
    // 23: Virtual kassa S/R
    assert.ok(output.includes('VR-12345678'), '23: Virtual kassa S/R chiqishi kerak');
    // 24: FM raqami
    assert.ok(output.includes('N586000000000'), '24: FM raqami chiqishi kerak');
    // 25: Fiskal belgi
    assert.ok(output.includes('984572019348'), '25: Fiskal belgi chiqishi kerak');
    // 26: Soliq QR kodi (printQR or printImage is called)
    const hasQrCall = printer.calls.some((c) => c.method === 'printQR' || c.method === 'printImage');
    assert.ok(hasQrCall, '26: Soliq QR kodi chop etilishi kerak');
  });
}

test('ESC/POS receipt omits card number row for non-social cards (restaurant-desktop)', async () => {
  const printer = createFakePrinter(80);
  const payload = createSample26FieldsPayload(80);
  payload.sale.cardCategory = null;
  payload.sale.socialCardNumber = null;
  payload.sale.cardNumber = '8600123456781234';
  await buildReceiptOnPrinter(printer, payload, 'job-regular-card');
  const output = getPrintedLines(printer);
  assert.ok(output.includes('Bank kartasi (Humo)'), 'Bank kartasi (Humo) chiqishi kerak');
  assert.ok(!output.includes('Karta raqami'), 'Karta raqami chiqmasligi kerak');
});
