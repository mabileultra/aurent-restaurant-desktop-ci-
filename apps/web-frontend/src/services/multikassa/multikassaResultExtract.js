import { isSyntheticFiscalSign, isOfdCheckUrl, buildOfdCheckUrl } from '../../utils/ofdQrUrl';
import { isPlainObject, pick, maybeParseJson, unwrapRoot, deepPick } from './multikassaResultPrimitives';
import { deepPickQr, parseOfdUrlParts, coerceQrUrl } from './multikassaResultQr';
import { SIGN_KEYS, SALE_ID_KEYS, SEQ_KEYS, TERMINAL_KEYS, TIME_KEYS } from './multikassaResultKeys';

export const SUCCESS_CODES = new Set([0, 200, 201, '0', '200', '201', 'OK', 'SUCCESS', 'Success', 'ok']);

export function detectOperationError(root) {
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
  const qr = String(parsed.fiscalQrUrl || '').trim();
  // Только фискальный признак / OFD QR. Один Id чека без sign — ещё не фискализация.
  if (sign && !isSyntheticFiscalSign(sign)) return true;
  if (isOfdCheckUrl(qr) || /ofd\.soliq\.uz/i.test(qr)) return true;
  return false;
}

export function collectNodes(root) {
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

export function pickLatestListItem(raw) {
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

export function extractFields(root) {
  const nodes = collectNodes(root);
  let fiscalSign = null;
  let multikassaSaleId = null;
  let fiscalReceiptSeq = null;
  let terminalId = null;
  let datetime = null;

  for (const node of nodes) {
    fiscalSign = fiscalSign || pick(node, SIGN_KEYS);
    // Не брать голый Id с корня jsonrpc (часто id запроса = 1).
    multikassaSaleId = multikassaSaleId || pick(node, SALE_ID_KEYS.filter((k) => k !== 'Id'));
    fiscalReceiptSeq = fiscalReceiptSeq || pick(node, SEQ_KEYS);
    terminalId = terminalId || pick(node, TERMINAL_KEYS);
    datetime = datetime || pick(node, TIME_KEYS);
  }

  fiscalSign = fiscalSign || deepPick(root, SIGN_KEYS);
  fiscalReceiptSeq = fiscalReceiptSeq || deepPick(root, SEQ_KEYS);
  terminalId = terminalId || deepPick(root, TERMINAL_KEYS);
  datetime = datetime || deepPick(root, TIME_KEYS);

  if (!multikassaSaleId) {
    for (const node of nodes) {
      const id = pick(node, ['Id', 'id']);
      // GUID / длинный id чека, не маленький jsonrpc id
      if (id && (id.length >= 8 || /[a-f]/i.test(id))) {
        multikassaSaleId = id;
        break;
      }
    }
  }
  multikassaSaleId = multikassaSaleId || deepPick(root, SALE_ID_KEYS.filter((k) => k !== 'Id'));

  if (isSyntheticFiscalSign(fiscalSign)) {
    fiscalSign = null;
  }

  let fiscalQrUrl = deepPickQr(root);
  const fromQr = parseOfdUrlParts(fiscalQrUrl);
  if (fromQr) {
    terminalId = terminalId || fromQr.terminalId;
    fiscalReceiptSeq = fiscalReceiptSeq || fromQr.receiptSeq;
    fiscalSign = fiscalSign || fromQr.fiscalSign;
    datetime = datetime || fromQr.datetime;
  }

  fiscalQrUrl =
    coerceQrUrl(fiscalQrUrl) ||
    buildOfdCheckUrl({
      terminalId,
      receiptSeq: fiscalReceiptSeq,
      fiscalSign,
      datetime,
    }) ||
    null;

  return { fiscalSign, multikassaSaleId, fiscalReceiptSeq, terminalId, datetime, fiscalQrUrl };
}
