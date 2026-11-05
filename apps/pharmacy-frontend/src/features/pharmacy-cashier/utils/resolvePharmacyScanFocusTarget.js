/**
 * Куда вернуть фокус после скана (чистая логика без DOM.side-effects).
 * @returns {'km' | 'search' | null}
 */
export function resolvePharmacyScanFocusTarget({
  preferKm = false,
  kmFocused = false,
  hasKm = false,
  hasSearch = false,
} = {}) {
  if (preferKm && hasKm) return 'km';
  if (kmFocused && hasKm) return 'km';
  if (hasSearch) return 'search';
  if (hasKm) return 'km';
  return null;
}
