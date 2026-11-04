import { resolvePharmacyScanFocusTarget } from './resolvePharmacyScanFocusTarget';

/** Куда вернуть фокус после скана на аптечной кассе. */

function focusEl(el) {
  if (!el || typeof el.focus !== 'function') return false;
  try {
    el.focus({ preventScroll: true });
  } catch {
    el.focus();
  }
  return document.activeElement === el;
}

/**
 * Стабильный возврат фокуса: после модалок/тостов DOM может ещё не готов.
 * preferKm / уже в КМ → остаёмся в КМ; иначе — поле товара.
 */
export function focusPharmacyScanField({ kmInputRef, searchInputRef, preferKm = false } = {}) {
  const run = () => {
    const km = kmInputRef?.current;
    const search = searchInputRef?.current;
    const target = resolvePharmacyScanFocusTarget({
      preferKm,
      kmFocused: Boolean(km && document.activeElement === km),
      hasKm: Boolean(km),
      hasSearch: Boolean(search),
    });
    if (target === 'km') focusEl(km);
    else if (target === 'search') focusEl(search);
  };

  run();
  requestAnimationFrame(() => {
    run();
    window.setTimeout(run, 40);
  });
}

export function isPharmacyKmFieldFocused(kmInputRef) {
  return Boolean(kmInputRef?.current && document.activeElement === kmInputRef.current);
}
