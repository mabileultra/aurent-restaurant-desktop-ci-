/** Re-export shared handoff helpers; pharmacy-specific aliases kept for call sites. */
export {
  safeNextPath as safePharmacyNextPath,
  readHandoffCodeFromSearch,
  clearHandoffCodeFromUrl,
} from '@aurent/shared-auth';
