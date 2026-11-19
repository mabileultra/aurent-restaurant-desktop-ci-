/**
 * @aurent/shared-marking — technical KM / DataMatrix helpers.
 * Pharmacy sold-gate, ASL product rules, ONKM policy stay in apps.
 */
export {
  normalizeMarkingCode,
  isMarkingCode,
  isCompleteMarkingScan,
  markingScanKey,
  gtinPackagingIndicator,
  extractGtinFromMarkingCode,
  ean13FromPackGtin14,
  barcodeLookupVariants,
  markingBarcodeCandidates,
} from './markingCode.js';
