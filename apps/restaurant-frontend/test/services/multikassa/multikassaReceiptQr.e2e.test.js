import { describe, it, expect } from 'vitest';
import QRCode from 'qrcode';
import {
  ensureFiscalQrUrl,
  hasRealFiscalProof,
  parseMultikassaOperationResult,
  toSaleFiscalPayload,
} from '../../../src/services/multikassa/parseMultikassaResult';
import { FISCAL_STATUS } from '../../../src/services/multikassa/multikassaConstants';
import { buildQrPayload, resolveReceiptQrValue } from '../../../src/utils/fiscalReceiptFormat';
import { isOfdCheckUrl } from '../../../src/utils/ofdQrUrl';

/** Официальный пример ответа REGOS Receipt.Sale (docs.regos.uz). */
const REGOS_RECEIPT_SALE_RESPONSE = {
  id: 1,
  ok: true,
  result: {
    Id: '59683513-a845-5ce3-bf75-4f35f7a7d846',
    Amount: 900000,
    QRCodeURL:
      'https://ofd.soliq.uz/check?t=VG369473163905&r=583&c=20230526142642&s=848035748636',
    TerminalID: 'VG369473163905',
    ReceiptNo: '759',
    DateTime: '2023-05-26T20:45:23.55Z',
    FiscalSign: '848035748636',
  },
  jsonrpc: '2.0',
};

/** Ответ локального агента Multikassa POST /api/v1/operations. */
const MULTIKASSA_AGENT_RESPONSE = {
  Code: 0,
  Message: 'OK',
  Result: {
    Id: 'op-guid-7788',
    receipt_gnk_fiscalsign: '848035748636',
    receipt_gnk_receiptseq: '583',
    receipt_gnk_terminalid: 'VG369473163905',
    receipt_gnk_time: '20230526142642',
    QRCodeURL:
      'https://ofd.soliq.uz/check?t=VG369473163905&r=583&c=20230526142642&s=848035748636',
  },
};

/** Как SaleResponse после POST /sales (то, что уходит в FiscalReceiptBody). */
function saleFromMultikassaRaw(raw, hints = {}) {
  const parsed = ensureFiscalQrUrl(parseMultikassaOperationResult(raw, hints), hints);
  const fiscal = toSaleFiscalPayload(parsed);
  return {
    id: 'sale-uuid',
    receiptNumber: 'RCP-20260907-0099',
    createdAt: '2023-05-26T20:45:23.55Z',
    fiscalStatus: fiscal.fiscalStatus,
    fiscalSign: fiscal.fiscalSign,
    fiscalReceiptSeq: fiscal.fiscalReceiptSeq,
    multikassaSaleId: fiscal.multikassaSaleId,
    fiscalQrUrl: fiscal.fiscalQrUrl,
    fiscalTerminalId: fiscal.fiscalTerminalId,
    fiscalizedAt: '2023-05-26T20:45:23.55Z',
    printFiscalQr: true,
    totalAmount: 9000,
    items: [],
  };
}

function assertQrRenders(qrValue) {
  expect(qrValue).toBeTruthy();
  expect(isOfdCheckUrl(qrValue)).toBe(true);
  const model = QRCode.create(qrValue, { errorCorrectionLevel: 'M' });
  expect(model?.modules?.size).toBeGreaterThan(20);
}

describe('Multikassa raw response → receipt QR (real shapes)', () => {
  it('REGOS jsonrpc Receipt.Sale → ofd QR SVG on receipt', () => {
    const parsed = parseMultikassaOperationResult(REGOS_RECEIPT_SALE_RESPONSE);
    expect(hasRealFiscalProof(parsed)).toBe(true);
    expect(parsed.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(parsed.fiscalSign).toBe('848035748636');
    expect(parsed.terminalId).toBe('VG369473163905');
    // r берём из QR (583), а не ReceiptNo (759) — иначе QR был бы невалидным
    expect(parsed.fiscalReceiptSeq).toBe('583');
    expect(parsed.fiscalQrUrl).toContain('ofd.soliq.uz');

    const sale = saleFromMultikassaRaw(REGOS_RECEIPT_SALE_RESPONSE);
    const qrValue = resolveReceiptQrValue(sale);
    expect(qrValue).toBe(REGOS_RECEIPT_SALE_RESPONSE.result.QRCodeURL);
    assertQrRenders(qrValue);
  });

  it('Multikassa agent Code/Result → same QR on receipt', () => {
    const sale = saleFromMultikassaRaw(MULTIKASSA_AGENT_RESPONSE, {
      terminalId: 'VG369473163905',
    });
    expect(sale.fiscalStatus).toBe(FISCAL_STATUS.FISCALIZED);
    expect(sale.fiscalSign).toBe('848035748636');
    const qrValue = resolveReceiptQrValue(sale);
    assertQrRenders(qrValue);
    expect(qrValue).toContain('t=VG369473163905');
    expect(qrValue).toContain('s=848035748636');
  });

  it('agent without QRCodeURL still builds ofd URL from gnk fields → QR renders', () => {
    const raw = {
      Code: 0,
      Result: {
        receipt_gnk_fiscalsign: '848035748636',
        receipt_gnk_receiptseq: '583',
        receipt_gnk_terminalid: 'VG369473163905',
        receipt_gnk_time: '20230526142642',
      },
    };
    const sale = saleFromMultikassaRaw(raw);
    const qrValue = resolveReceiptQrValue(sale);
    assertQrRenders(qrValue);
    expect(buildQrPayload(sale)).toBe(qrValue);
  });

  it('printFiscalQr=false → no QR even with perfect Multikassa reply', () => {
    const sale = {
      ...saleFromMultikassaRaw(REGOS_RECEIPT_SALE_RESPONSE),
      printFiscalQr: false,
    };
    expect(resolveReceiptQrValue(sale)).toBe('');
  });

  it('pending / offline sale → no QR (honest empty, not fake)', () => {
    const sale = {
      receiptNumber: 'RCP-offline',
      createdAt: new Date().toISOString(),
      fiscalStatus: FISCAL_STATUS.PENDING,
      fiscalSign: null,
      fiscalQrUrl: null,
      printFiscalQr: true,
    };
    expect(resolveReceiptQrValue(sale)).toBe('');
  });
});
