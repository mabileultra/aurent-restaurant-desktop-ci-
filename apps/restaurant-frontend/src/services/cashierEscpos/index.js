/** Restaurant-frontend slim surface — receipt/fiscal only (no shelf labels). */

export {
  buildCashierEscposPayload,
  buildEscposLabels,
} from './buildCashierEscposPayload';
export {
  isCashierEscposPrintAvailable,
  printSaleReceiptEscpos,
  resolveEscposPrintErrorMessage,
} from './printSaleReceiptEscpos';
export { printFiscalReceipt } from './printFiscalReceipt';
export {
  buildEscposZReportPayload,
  buildEscposZReportLabels,
} from './buildEscposZReportPayload';
export {
  buildEscposShiftReportPayload,
  buildEscposShiftReportLabels,
} from './buildEscposShiftReportPayload';
export {
  isCashierEscposReportPrintAvailable,
  printReportEscpos,
} from './printReportEscpos';
export { printThermalDocument } from './printThermalDocument';
