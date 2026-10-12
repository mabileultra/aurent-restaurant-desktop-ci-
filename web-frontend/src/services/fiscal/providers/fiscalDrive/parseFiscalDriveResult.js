import { buildOfdCheckUrl, isOfdCheckUrl } from '../../../../utils/ofdQrUrl';
import { FISCAL_STATUS } from '../../fiscalStatus';
import { toSaleFiscalPayload } from '../../shared/toSaleFiscalPayload';

function pick(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    if (obj[key] != null && obj[key] !== '') return obj[key];
  }
  return null;
}

/** Ответ RegisterTXID → нейтральный фискальный блок продажи. */
export function parseFiscalDriveRegisterResult(raw) {
  const info = raw && typeof raw === 'object' ? raw : {};
  const fiscalSign = pick(info, 'FiscalSign', 'fiscalSign');
  const receiptSeq = pick(info, 'ReceiptSeq', 'receiptSeq');
  const terminalId = pick(info, 'TerminalID', 'TerminalId', 'terminalId');
  const datetime = pick(info, 'DateTime', 'Time', 'dateTime', 'time');
  let fiscalQrUrl = pick(info, 'QRCodeURL', 'QRCodeUrl', 'qrCodeUrl', 'QrCodeUrl');
  if (!fiscalQrUrl || !isOfdCheckUrl(fiscalQrUrl)) {
    fiscalQrUrl =
      buildOfdCheckUrl({
        terminalId,
        receiptSeq,
        fiscalSign,
        datetime,
      }) || fiscalQrUrl || null;
  }

  const hasProof = Boolean(fiscalSign && receiptSeq != null && String(receiptSeq).trim() !== '');
  return {
    fiscalStatus: hasProof ? FISCAL_STATUS.FISCALIZED : FISCAL_STATUS.PENDING,
    fiscalSign: fiscalSign != null ? String(fiscalSign) : null,
    fiscalReceiptSeq: receiptSeq != null ? String(receiptSeq) : null,
    fiscalQrUrl: fiscalQrUrl || null,
    fiscalTerminalId: terminalId != null ? String(terminalId).trim().toUpperCase() : null,
    fiscalDateTime: datetime != null ? String(datetime) : null,
    fiscalError: hasProof ? null : 'FiscalDrive не вернул фискальный признак',
    raw: info,
  };
}

export function toFiscalDriveSalePayload(parsed, { txid = null, receipt = null } = {}) {
  return {
    ...toSaleFiscalPayload({
      ...parsed,
      terminalId: parsed.fiscalTerminalId,
    }),
    fiscalProvider: 'FISCAL_DRIVE',
    fiscalDriveTxid: txid,
    fiscalDriveRetry: txid
      ? { txid, receipt, dateTime: parsed.fiscalDateTime || receipt?.Time || null }
      : null,
  };
}
