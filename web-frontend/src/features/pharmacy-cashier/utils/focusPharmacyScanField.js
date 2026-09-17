/** Куда вернуть фокус после скана на аптечной кассе. */

export function focusPharmacyScanField({ kmInputRef, searchInputRef, preferKm = false } = {}) {
  const active = document.activeElement;
  const km = kmInputRef?.current;
  const search = searchInputRef?.current;

  if (preferKm && km) {
    km.focus();
    return;
  }
  if (km && active === km) {
    km.focus();
    return;
  }
  if (search) {
    search.focus();
  }
}

export function isPharmacyKmFieldFocused(kmInputRef) {
  return Boolean(kmInputRef?.current && document.activeElement === kmInputRef.current);
}
