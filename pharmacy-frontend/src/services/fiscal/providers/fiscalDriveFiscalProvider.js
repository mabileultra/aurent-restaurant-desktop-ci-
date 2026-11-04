import { FISCAL_PROVIDER } from '../fiscalProviderIds';
import { fiscalizeSaleBeforeCommit } from './fiscalDrive/fiscalizeSaleBeforeCommit';
import {
  fiscalizeShiftOperation,
  isFiscalDriveShiftAlreadyOpenError,
} from './fiscalDrive/fiscalizeShiftOperation';
import { mapFiscalDriveError } from './fiscalDrive/mapFiscalDriveError';
import { retryPendingFiscalOnPayload } from './fiscalDrive/retryPendingFiscal';

async function fiscalizeRefundNotReady() {
  const err = new Error('Возврат через FiscalDrive пока не подключён');
  err.code = 'FISCAL_DRIVE_FISCAL_FAILED';
  throw err;
}

export const fiscalDriveFiscalProvider = Object.freeze({
  id: FISCAL_PROVIDER.FISCAL_DRIVE,
  fiscalizeSale: (args) => fiscalizeSaleBeforeCommit(args),
  fiscalizeRefund: () => fiscalizeRefundNotReady(),
  fiscalizeShift: (args) => fiscalizeShiftOperation(args),
  retryPending: (payload, options) => retryPendingFiscalOnPayload(payload, options),
  isShiftAlreadyOpenError: (err) => isFiscalDriveShiftAlreadyOpenError(err),
  wrapError: (err) => {
    if (err?.code?.startsWith('FISCAL_DRIVE')) return err;
    return mapFiscalDriveError(err);
  },
});
