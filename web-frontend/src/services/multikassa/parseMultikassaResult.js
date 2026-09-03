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
  if (!isPlainObject(node) || depth > 6) return null;
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
  if (isPlainObject(raw.result)) return raw.result;
  if (isPlainObject(raw.Result)) return raw.Result;
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
  'GNKFiscalSign',
  'gnk_fiscal_sign',
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
  'QRCodeUrl',
  'qrCodeURL',
  'QR',
  'QrCode',
  'FiscalQR',
  'fiscalQrUrl',
  'CheckUrl',
  'checkUrl',
  'OfdUrl',
  'ofdUrl',
];

/** Наш старый fallback — не настоящий признак ГНК. */
export function isSyntheticFiscalSign(sign) {
  const s = String(sign || '').trim();
  if (!s) return true;
  if (/^MK-\d+$/i.test(s)) return true;
  if (/^LOCAL-/i.test(s)) return true;
  return false;
}

export function hasRealFiscalProof(parsed) {
  if (!parsed) return false;
  const sign = String(parsed.fiscalSign || '').trim();
  const saleId = String(parsed.multikassaSaleId || '').trim();
  const qr = String(parsed.fiscalQrUrl || '').trim();
  if (sign && !isSyntheticFiscalSign(sign)) return true;
  if (saleId && !isSyntheticFiscalSign(saleId)) return true;
  if (qr && /ofd\.soliq\.uz|mkfiscal|multikassa/i.test(qr)) return true;
  return false;
}

function detectOperationError(root) {
  if (!isPlainObject(root)) return null;
  const code = root.Code ?? root.code ?? root.ErrorCode ?? root.errorCode;
  const message =
    pick(root, ['Message', 'message', 'Error', 'error', 'error_message', 'ErrorMessage']) || null;
  if (code != null && Number(code) !== 0 && String(code).toUpperCase() !== 'OK') {
    return message || `Multikassa error code ${code}`;
  }
  if (root.Success === false || root.success === false || root.ok === false) {
    return message || 'Multikassa operation failed';
  }
  return null;
}

/** Нормализация ответа Multikassa operations → payload для нашего /sales. */
export function parseMultikassaOperationResult(raw) {
  const root = unwrapRoot(raw);
  const opError = detectOperationError(isPlainObject(raw) ? raw : {}) || detectOperationError(root);
  if (opError) {
    return {
      fiscalStatus: FISCAL_STATUS.FAILED,
      fiscalSign: null,
      fiscalReceiptSeq: null,
      multikassaSaleId: null,
      fiscalQrUrl: null,
      fiscalError: opError,
      raw,
    };
  }

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
    root?.Response,
    root?.response,
    root?.Data,
    root?.data,
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

  if (!multikassaSaleId && isPlainObject(root?.Receipt)) {
    multikassaSaleId = pick(root.Receipt, SALE_ID_KEYS);
  }

  if (isSyntheticFiscalSign(fiscalSign)) {
    fiscalSign = null;
  }

  const parsed = {
    fiscalStatus: FISCAL_STATUS.FISCALIZED,
    fiscalSign,
    fiscalReceiptSeq,
    multikassaSaleId,
    fiscalQrUrl,
    fiscalError: null,
    raw,
  };

  if (!hasRealFiscalProof(parsed)) {
    return {
      ...parsed,
      fiscalStatus: FISCAL_STATUS.FAILED,
      fiscalSign: null,
      fiscalError:
        'Multikassa не вернула фискальный признак / ID чека. Проверьте ФМ, смену и ответ агента.',
    };
  }

  parsed.fiscalStatus = FISCAL_STATUS.FISCALIZED;
  return parsed;
}

export function toSaleFiscalPayload(parsed) {
  return {
    fiscalStatus: parsed.fiscalStatus || FISCAL_STATUS.PENDING,
    fiscalSign: parsed.fiscalSign || null,
    fiscalReceiptSeq: parsed.fiscalReceiptSeq || null,
    multikassaSaleId: parsed.multikassaSaleId || null,
    fiscalQrUrl: parsed.fiscalQrUrl || null,
    fiscalError: parsed.fiscalError || null,
  };
}
