/**
 * @aurent/shared-fiscal — pure OFD / fiscal helpers (no cart/store imports).
 * Provider adapters and marked-line expansion stay in apps.
 */
export { toIdentificationMarkingCode, toOfdMarkingLabel } from './ofdMarkingLabel.js';
export {
  toTiyin,
  isFiscalDateTime,
  formatFiscalDateTime,
  toFiscalRefundDateTime,
} from './fiscalMoney.js';
export { resolveLinePackageCode } from './resolveLinePackageCode.js';
export {
  normalizeCardCategory,
  toOfdCardTypeCode,
  normalizeRrn,
  isValidRrn,
  maskSocialCardNumber,
  isValidSocialCardInput,
  extractCardReceiptDetails,
  withCardReceiptDetails,
  buildMultikassaCardFields,
  buildFiscalDriveCardFields,
} from './cardDetails.js';
export {
  PRESCRIPTION_NUMBER_MIN_LENGTH,
  PRESCRIPTION_NUMBER_MAX_LENGTH,
  PRESCRIPTION_NUMBER_REQUIRED_CODE,
  PRESCRIPTION_NUMBER_ISSUE,
  normalizePrescriptionNumber,
  validatePrescriptionNumber,
  prescriptionIssueMessageKey,
  isValidPrescriptionNumber,
  lineRequiresPrescription,
  cartPrescriptionLines,
  cartHasPrescriptionRequiredItems,
  assertCartPrescriptionReady,
  resolveCartPrescriptionNumber,
  isPrescriptionExemptPayment,
  assertSalePrescriptionNumber,
  resolveSalePrescriptionNumber,
  withSalePrescriptionNumber,
} from './prescriptionNumber.js';
export {
  shouldPrintFiscalQr,
  isAdvanceOrCreditReceipt,
  FISCAL_QR_SUPPRESSED_RECEIPT_TYPES,
} from './receiptQr.js';

