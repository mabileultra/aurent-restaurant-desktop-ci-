import { FISCAL_STATUS } from './multikassaConstants';
import { isSyntheticFiscalSign } from '../../utils/ofdQrUrl';
import { isPlainObject, maybeParseJson, unwrapRoot } from './multikassaResultPrimitives';
import { coerceQrUrl, ensureFiscalQrUrl, applyQrHints } from './multikassaResultQr';
import { detectOperationError, hasRealFiscalProof, pickLatestListItem, extractFields } from './multikassaResultExtract';
export { isSyntheticFiscalSign };

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
  const withQr = ensureFiscalQrUrl(
    {
      fiscalSign: fields.fiscalSign,
      fiscalReceiptSeq: fields.fiscalReceiptSeq,
      multikassaSaleId: fields.multikassaSaleId,
      terminalId: fields.terminalId,
      datetime: fields.datetime,
      fiscalQrUrl: fields.fiscalQrUrl,
    },
    hints,
  );

  const parsed = {
    fiscalStatus: FISCAL_STATUS.FISCALIZED,
    fiscalSign: withQr.fiscalSign,
    fiscalReceiptSeq: withQr.fiscalReceiptSeq,
    multikassaSaleId: withQr.multikassaSaleId,
    fiscalQrUrl: withQr.fiscalQrUrl,
    terminalId: withQr.terminalId || hints.terminalId || null,
    datetime: withQr.datetime || hints.datetime || null,
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
  if (!extra) return ensureFiscalQrUrl(base, hints);
  const merged = ensureFiscalQrUrl(
    {
      ...base,
      fiscalSign: base?.fiscalSign || extra.fiscalSign || null,
      fiscalReceiptSeq: base?.fiscalReceiptSeq || extra.fiscalReceiptSeq || null,
      multikassaSaleId: base?.multikassaSaleId || extra.multikassaSaleId || null,
      fiscalQrUrl: coerceQrUrl(base?.fiscalQrUrl) || extra.fiscalQrUrl || null,
      terminalId: base?.terminalId || extra.terminalId || hints.terminalId || null,
      datetime: base?.datetime || extra.datetime || hints.datetime || null,
      fiscalError: extra.fiscalStatus === FISCAL_STATUS.FISCALIZED ? null : base?.fiscalError,
      raw: extra.raw ?? base?.raw,
    },
    hints,
  );
  if (hasRealFiscalProof(merged)) {
    merged.fiscalStatus = FISCAL_STATUS.FISCALIZED;
    merged.fiscalError = null;
  }
  return merged;
}

export { toSaleFiscalPayload } from '../fiscal/shared/toSaleFiscalPayload';

export { ensureFiscalQrUrl } from './multikassaResultQr';

export { hasRealFiscalProof } from './multikassaResultExtract';
