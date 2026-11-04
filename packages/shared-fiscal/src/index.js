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
