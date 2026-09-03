import { FISCAL_STATUS } from './multikassaConstants';
import { buildOfdCheckUrl, isOfdCheckUrl, isSyntheticFiscalSign } from '../../utils/ofdQrUrl';

export { isSyntheticFiscalSign };

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function maybeParseJson(value) {
  if (typeof value !== 'string') return value;
  const s = value.trim();
  if (!s) return value;
  const looksJson =
    (s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'));
  if (!looksJson) return value;
  try {
    return JSON.parse(s);
  } catch {
    return value;
  }
}

function unwrapRoot(raw) {
  const parsed = maybeParseJson(raw);
  if (!isPlainObject(parsed)) return parsed;
  const nested =
    parsed.data ?? parsed.Data ?? parsed.result ?? parsed.Result ?? parsed.response ?? parsed.Response;
  const nestedParsed = maybeParseJson(nested);
  if (isPlainObject(nestedParsed) || Array.isArray(nestedParsed)) return nestedParsed;
  return parsed;
}

function pick(obj, keys) {
  if (!isPlainObject(obj)) return null;
  for (const key of keys) {
    const value = obj[key];
    if (value == null) continue;
    if (typeof value === 'string' && value.trim() !== '') return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function deepPick(node, keys, depth = 0) {
  if (!isPlainObject(node) || depth > 6) return null;
  const direct = pick(node, keys);
  if (direct) return direct;
  for (const value of Object.values(node)) {
    const parsed = maybeParseJson(value);
    if (isPlainObject(parsed)) {
      const nested = deepPick(parsed, keys, depth + 1);
      if (nested) return nested;
    }
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const nested = deepPick(maybeParseJson(item), keys, depth + 1);
        if (nested) return nested;
      }
    }
  }
  return null;
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
  'ReceiptNo',
  'receiptNo',
];

const TERMINAL_KEYS = [
  'receipt_gnk_terminalid',
  'module_gnk_terminalid',
  'TerminalID',
  'TerminalId',
  'terminalId',
  'terminal_id',
  'FM_TERMINAL_ID',
];

const TIME_KEYS = [
  'receipt_gnk_time',
  'receipt_gnk_datetime',
  'DateTime',
  'dateTime',
  'date_time',
  'datetime',
];

const QR_KEYS = [
  'QRCodeURL',
  'QrCodeUrl',
  'qrCodeUrl',
  'qr_url',
  'QRCodeUrl',
  'qrCodeURL',
  'qr_code_url',
  'qrcode_url',
  'QRCODEURL',
  'QR',
  'QrCode',
  'QRCode',
  'FiscalQR',
  'fiscalQrUrl',
  'CheckUrl',
  'checkUrl',
  'OfdUrl',
  'ofdUrl',
];

function coerceQrUrl(value) {
  if (value == null) return null;
  if (typeof value === 'number') return null;
  if (typeof value === 'string') {
    const s = value.trim();
    if (!s || s === '[object Object]') return null;
    if (isOfdCheckUrl(s)) return s.startsWith('http') ? s : `https://${s.replace(/^\/+/, '')}`;
    if (/^https?:\/\/ofd\.soliq\.uz/i.test(s)) return s;
    if (/ofd\.soliq\.uz/i.test(s)) return s.startsWith('http') ? s : `https://${s.replace(/^\/+/, '')}`;
    if (/^[?]?t=.+&r=.+&c=.+&s=/.test(s)) {
      return `https://ofd.soliq.uz/check?${s.replace(/^\?/, '')}`;
    }
    return null;
  }
  if (isPlainObject(value)) {
    for (const key of QR_KEYS) {
      const nested = coerceQrUrl(value[key]);
      if (nested) return nested;
    }
    return coerceQrUrl(value.url || value.URL || value.href || value.Href || null);
  }
  return null;
}

function deepPickQr(node, depth = 0) {
  if (!node || depth > 6) return null;
  const parsed = maybeParseJson(node);
  if (typeof parsed === 'string') return coerceQrUrl(parsed);
  if (Array.isArray(parsed)) {
    for (let i = parsed.length - 1; i >= 0; i -= 1) {
      const found = deepPickQr(parsed[i], depth + 1);
      if (found) return found;
    }
    return null;
  }
  if (!isPlainObject(parsed)) return null;
  for (const key of QR_KEYS) {
    const found = coerceQrUrl(parsed[key]);
    if (found) return found;
  }
  for (const value of Object.values(parsed)) {
    const found = deepPickQr(value, depth + 1);
    if (found) return found;
  }
  return null;
}

const SUCCESS_CODES = new Set([0, 200, 201, '0', '200', '201', 'OK', 'SUCCESS', 'Success', 'ok']);

function detectOperationError(root) {
  if (!isPlainObject(root)) return null;
  const code = root.Code ?? root.code ?? root.ErrorCode ?? root.errorCode;
  const message =
    pick(root, ['Message', 'message', 'Error', 'error', 'error_message', 'ErrorMessage']) || null;
  if (code != null && String(code).trim() !== '' && !SUCCESS_CODES.has(code) && !SUCCESS_CODES.has(Number(code))) {
    return message || `Multikassa error code ${code}`;
  }
  if (root.Success === false || root.success === false || root.ok === false) {
    return message || 'Multikassa operation failed';
  }
  return null;
}

export function hasRealFiscalProof(parsed) {
  if (!parsed) return false;
  const sign = String(parsed.fiscalSign || '').trim();
  const saleId = String(parsed.multikassaSaleId || '').trim();
  const qr = String(parsed.fiscalQrUrl || '').trim();
  if (sign && !isSyntheticFiscalSign(sign)) return true;
  if (saleId && !isSyntheticFiscalSign(saleId)) return true;
  if (isOfdCheckUrl(qr) || /ofd\.soliq\.uz|mkfiscal|multikassa/i.test(qr)) return true;
  return false;
}

function collectNodes(root) {
  return [
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
  ]
    .map(maybeParseJson)
    .filter(isPlainObject);
}

function pickLatestListItem(raw) {
  const parsed = maybeParseJson(raw);
  const root = unwrapRoot(parsed);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(root)
      ? root
      : Array.isArray(root?.items)
        ? root.items
        : Array.isArray(root?.operations)
          ? root.operations
          : Array.isArray(root?.Operations)
            ? root.Operations
            : Array.isArray(root?.data)
              ? root.data
              : Array.isArray(root?.Result)
                ? root.Result
                : null;
  if (!list || list.length === 0) return isPlainObject(root) ? root : parsed;
  const withType = (item) => {
    const node = maybeParseJson(item);
    const type = String(
      node?.module_operation_type ?? node?.ModuleOperationType ?? node?.operationType ?? '',
    );
    return { node, type };
  };
  const mapped = list.map(withType);
  const sales = mapped.filter((row) => ['3', '4', '8', '10'].includes(row.type));
  const pool = sales.length ? sales : mapped;
  return pool[pool.length - 1].node;
}

function extractFields(root) {
  const nodes = collectNodes(root);
  let fiscalSign = null;
  let multikassaSaleId = null;
  let fiscalReceiptSeq = null;
  let terminalId = null;
  let datetime = null;

  for (const node of nodes) {
    fiscalSign = fiscalSign || pick(node, SIGN_KEYS);
    multikassaSaleId = multikassaSaleId || pick(node, SALE_ID_KEYS);
    fiscalReceiptSeq = fiscalReceiptSeq || pick(node, SEQ_KEYS);
    terminalId = terminalId || pick(node, TERMINAL_KEYS);
    datetime = datetime || pick(node, TIME_KEYS);
  }

  fiscalSign = fiscalSign || deepPick(root, SIGN_KEYS);
  multikassaSaleId = multikassaSaleId || deepPick(root, SALE_ID_KEYS);
  fiscalReceiptSeq = fiscalReceiptSeq || deepPick(root, SEQ_KEYS);
  terminalId = terminalId || deepPick(root, TERMINAL_KEYS);
  datetime = datetime || deepPick(root, TIME_KEYS);

  if (isSyntheticFiscalSign(fiscalSign)) {
    fiscalSign = null;
  }

  const fiscalQrUrl =
    deepPickQr(root) ||
    buildOfdCheckUrl({
      terminalId,
      receiptSeq: fiscalReceiptSeq,
      fiscalSign,
      datetime,
    }) ||
    null;

  return { fiscalSign, multikassaSaleId, fiscalReceiptSeq, terminalId, datetime, fiscalQrUrl };
}

function applyQrHints(fields, hints = {}) {
  const fiscalQrUrl =
    coerceQrUrl(fields.fiscalQrUrl) ||
    buildOfdCheckUrl({
      terminalId: fields.terminalId || hints.terminalId,
      receiptSeq: fields.fiscalReceiptSeq,
      fiscalSign: fields.fiscalSign,
      datetime: fields.datetime || hints.datetime,
    }) ||
    null;
  return { ...fields, fiscalQrUrl };
}

/** Нормализация ответа Multikassa operations → payload для нашего /sales. */
export function parseMultikassaOperationResult(raw, hints = {}) {
  const parsedRaw = maybeParseJson(raw);
  const root = unwrapRoot(parsedRaw);
  const opError =
    detectOperationError(isPlainObject(parsedRaw) ? parsedRaw : {}) || detectOperationError(root);
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

  const fields = applyQrHints(extractFields(isPlainObject(root) ? root : parsedRaw), hints);

  const parsed = {
    fiscalStatus: FISCAL_STATUS.FISCALIZED,
    fiscalSign: fields.fiscalSign,
    fiscalReceiptSeq: fields.fiscalReceiptSeq,
    multikassaSaleId: fields.multikassaSaleId,
    fiscalQrUrl: fields.fiscalQrUrl,
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

/** Разбор GET /api/v1/operations — берём последнюю операцию, если POST не отдал QR. */
export function parseMultikassaOperationsList(raw, hints = {}) {
  const item = pickLatestListItem(raw);
  return parseMultikassaOperationResult(item, hints);
}

export function mergeFiscalParse(base, extra, hints = {}) {
  if (!extra) return base;
  const merged = {
    ...base,
    fiscalSign: base?.fiscalSign || extra.fiscalSign || null,
    fiscalReceiptSeq: base?.fiscalReceiptSeq || extra.fiscalReceiptSeq || null,
    multikassaSaleId: base?.multikassaSaleId || extra.multikassaSaleId || null,
    fiscalQrUrl: coerceQrUrl(base?.fiscalQrUrl) || extra.fiscalQrUrl || null,
    fiscalError: extra.fiscalStatus === FISCAL_STATUS.FISCALIZED ? null : base?.fiscalError,
    raw: extra.raw ?? base?.raw,
  };
  if (!merged.fiscalQrUrl) {
    merged.fiscalQrUrl =
      buildOfdCheckUrl({
        terminalId: hints.terminalId,
        receiptSeq: merged.fiscalReceiptSeq,
        fiscalSign: merged.fiscalSign,
        datetime: hints.datetime,
      }) || null;
  }
  if (hasRealFiscalProof(merged)) {
    merged.fiscalStatus = FISCAL_STATUS.FISCALIZED;
    merged.fiscalError = null;
  }
  return merged;
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
