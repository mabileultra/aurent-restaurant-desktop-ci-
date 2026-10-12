import {
  fiscalizeRefundBeforeCommit,
  fiscalizeSaleBeforeCommit,
  fiscalizeShiftOperation,
  resolveMultikassaFiscalErrorMessage,
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
  wrapError: (err) => wrapMultikassaFiscalError(err),
  resolveErrorMessage: (err, t) => resolveMultikassaFiscalErrorMessage(err, t),
});
