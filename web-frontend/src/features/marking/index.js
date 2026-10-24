/**
 * Тема маркировки: КМ, sold-gate, GTIN, отправка в ОФД.
 * Не аптека и не фискальный провайдер.
 */
export {
  isMarkingCode,
  isCompleteMarkingScan,
  normalizeMarkingCode,
  extractGtinFromMarkingCode,
  markingBarcodeCandidates,
  markingScanKey,
  barcodeLookupVariants,
} from './markingCode';

export {
  markingIdentityKeys,
  markingIdentityKey,
  markingIdentificationCode,
  extractSerialFromMarkingCode,
  lineMarkIdentityKeys,
  marksShareIdentity,
  cartHasMark,
} from './markingIdentity';

export {
  isMarkSoldLocally,
  rememberSoldMarks,
  forgetSoldMarks,
  collectMarksFromCartItems,
  clearSoldMarks,
} from './soldMarksStore';

export { assessMarkLifecycle } from './markLifecycle';

export { inspectMarkPunched, assertCartMarksNotPunched } from './inspectMarkPunched';
export { inspectMarkCirculation } from './inspectMarkCirculation';
export { lookupProductByMarkingGtin } from './lookupProductByMarkingGtin';
export { planMarkedScan, applyMarkingScan, removeMarking, isMarkCountedLine } from './markedScanCart';
export { preserveMarkingCodeForFiscal } from './preserveMarkingCodeForFiscal';
export { isAslMarkAlreadySold } from './aslMarkAlreadySold';
export { findProductByMarkingCode, markingMatchesProduct } from './markingProductMatch';
export { attachMarkToProduct, lineMarkingCodes } from './attachMarkToProduct';
export { resolveCashierMarking } from './resolveCashierMarking';
