import { FISCAL_STATUS } from '../fiscalStatus';

/** Фискальный блок продажи для нашего /sales (общий для всех провайдеров). */
export function toSaleFiscalPayload(parsed) {
  return {
    fiscalStatus: parsed.fiscalStatus || FISCAL_STATUS.PENDING,
    fiscalSign: parsed.fiscalSign || null,
    fiscalReceiptSeq: parsed.fiscalReceiptSeq || null,
    multikassaSaleId: parsed.multikassaSaleId || null,
    fiscalQrUrl: parsed.fiscalQrUrl || null,
    fiscalError: parsed.fiscalError || null,
    fiscalTerminalId: parsed.terminalId || parsed.fiscalTerminalId || null,
    ...(parsed.fiscalProvider ? { fiscalProvider: parsed.fiscalProvider } : {}),
    ...(parsed.fiscalDriveTxid != null ? { fiscalDriveTxid: parsed.fiscalDriveTxid } : {}),
    ...(parsed.fiscalDriveRetry ? { fiscalDriveRetry: parsed.fiscalDriveRetry } : {}),
  };
}
