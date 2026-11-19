/**
 * @aurent/shared-fiscal — pure OFD / fiscal helpers (no cart/store imports).
 * Provider adapters and marked-line expansion stay in apps.
 */
export {
  toIdentificationMarkingCode,
  toOfdMarkingLabel,
  resolveItemBarcode,
  resolveItemMarkingLabel,
} from './ofdMarkingLabel.js';
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
  formatCardNumberForReceipt,
  isValidSocialCardInput,
  sanitizeCardPaymentFields,
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
export {
  formatVersionWithDate,
  formatVersionWithHash,
  getDesktopVersion,
  getLicenseNumber,
  getUiVersion,
  getUiAboutVersion,
  getReceiptVersionRows,
  getAppVersion,
  getAppVersionInfo,
} from './appVersion.js';
export {
  COMMITTENT_TIN_LENGTH,
  COMMITTENT_PINFL_LENGTH,
  parseCommittentIdentifier,
  resolveItemCommittent,
  resolveMultikassaCommitentTin,
  buildFiscalDriveCommissionInfo,
  formatItemCommittentReceiptLine,
  withSaleCommittentDetails,
} from './committentDetails.js';
export {
  FORBIDDEN_MXIK_REASON_CODE,
  FORBIDDEN_MXIK_CODES,
  normalizeMxik,
  isForbiddenMxik,
} from './forbiddenMxik.js';

