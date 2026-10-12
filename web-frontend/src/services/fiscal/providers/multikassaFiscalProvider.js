import {
  fiscalizeRefundBeforeCommit,
  fiscalizeSaleBeforeCommit,
  fiscalizeShiftOperation,
  isFiscalShiftAlreadyOpenError,
  retryPendingFiscalOnPayload,
  wrapMultikassaFiscalError,
} from '../../multikassa';
import { FISCAL_PROVIDER } from '../fiscalProviderIds';

/** Адаптер текущей Multikassa под контракт фискального провайдера. Поведение не меняет. */
export const multikassaFiscalProvider = Object.freeze({
  id: FISCAL_PROVIDER.MULTIKASSA,
  fiscalizeSale: (args) => fiscalizeSaleBeforeCommit(args),
  fiscalizeRefund: (args) => fiscalizeRefundBeforeCommit(args),
  fiscalizeShift: (args) => fiscalizeShiftOperation(args),
  retryPending: (payload, options) => retryPendingFiscalOnPayload(payload, options),
  isShiftAlreadyOpenError: (err) => isFiscalShiftAlreadyOpenError(err),
  wrapError: (err) => wrapMultikassaFiscalError(err),
});
