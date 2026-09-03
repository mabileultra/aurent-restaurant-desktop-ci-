import { FISCAL_STATUS } from './multikassaConstants';

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function pick(obj, keys) {
  if (!isPlainObject(obj)) return null;
  for (const key of keys) {
    const value = obj[key];
    if (value != null && String(value).trim() !== '') return String(value);
  }
  return null;
}

/** Рекурсивный поиск первого непустого значения по списку ключей. */
function deepPick(node, keys, depth = 0) {
  if (!isPlainObject(node) || depth > 4) return null;
  const direct = pick(node, keys);
  if (direct) return direct;
  for (const value of Object.values(node)) {
    if (isPlainObject(value)) {
      const nested = deepPick(value, keys, depth + 1);
      if (nested) return nested;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = deepPick(item, keys, depth + 1);
        if (nested) return nested;
      }
    }
  }
  return null;
}

function unwrapRoot(raw) {
  if (!isPlainObject(raw)) return raw;
  if (isPlainObject(raw.data)) return raw.data;
  if (isPlainObject(raw.Data)) return raw.Data;
  return raw;
}

const SIGN_KEYS = [
  'receipt_gnk_fiscalsign',
  'FiscalSign',
  'fiscalSign',
  'fiscal_sign',
  'Fiscalsign',
  'FISCAL_SIGN',
  'AppletFiscalSign',
];

const SALE_ID_KEYS = [
  'ReceiptSaleId',
  'receipt_sale_id',
  'receiptSaleId',
  'SaleId',
  'saleId',
  'sale_id',
  'ReceiptId',
  'receiptId',
];

const SEQ_KEYS = [
  'receipt_gnk_receiptseq',
  'ReceiptSeq',
  'receiptSeq',
  'ZReportNumber',
  'ReceiptNumber',
  'receipt_number',
];

const QR_KEYS = [
  'QRCodeURL',
  'QrCodeUrl',
  'qrCodeUrl',
  'qr_url',
  'QR',
  'QrCode',
  'FiscalQR',
  'fiscalQrUrl',
];

/** Нормализация ответа Multikassa operations → payload для нашего /sales. */
export function parseMultikassaOperationResult(raw) {
  const root = unwrapRoot(raw);
  const nestedCandidates = [
    root,
    root?.Result,
    root?.result,
    root?.Info,
    root?.info,
    root?.Receipt,
    root?.receipt,
    root?.Operation,
    root?.operation,
  ].filter(isPlainObject);

  let fiscalSign = null;
  let multikassaSaleId = null;
  let fiscalReceiptSeq = null;
  let fiscalQrUrl = null;

  for (const node of nestedCandidates) {
    fiscalSign = fiscalSign || pick(node, SIGN_KEYS);
    multikassaSaleId = multikassaSaleId || pick(node, SALE_ID_KEYS);
    fiscalReceiptSeq = fiscalReceiptSeq || pick(node, SEQ_KEYS);
    fiscalQrUrl = fiscalQrUrl || pick(node, QR_KEYS);
  }

  fiscalSign = fiscalSign || deepPick(root, SIGN_KEYS);
  multikassaSaleId = multikassaSaleId || deepPick(root, SALE_ID_KEYS);
  fiscalReceiptSeq = fiscalReceiptSeq || deepPick(root, SEQ_KEYS);
  fiscalQrUrl = fiscalQrUrl || deepPick(root, QR_KEYS);

  // Не брать голый `id` из корня — часто это id операции, не ReceiptSaleId.
  if (!multikassaSaleId && isPlainObject(root?.Receipt)) {
    multikassaSaleId = pick(root.Receipt, SALE_ID_KEYS);
  }

  return {
    fiscalStatus: FISCAL_STATUS.FISCALIZED,
    fiscalSign,
    fiscalReceiptSeq,
    multikassaSaleId,
    fiscalQrUrl,
    fiscalError: null,
    raw,
  };
}

export function toSaleFiscalPayload(parsed) {
  return {
    fiscalStatus: parsed.fiscalStatus || FISCAL_STATUS.FISCALIZED,
    fiscalSign: parsed.fiscalSign || null,
    fiscalReceiptSeq: parsed.fiscalReceiptSeq || null,
    multikassaSaleId: parsed.multikassaSaleId || null,
    fiscalQrUrl: parsed.fiscalQrUrl || null,
    fiscalError: parsed.fiscalError || null,
  };
}
