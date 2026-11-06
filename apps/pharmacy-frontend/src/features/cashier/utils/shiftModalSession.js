/**
 * После свежего fetch смены в модалке: что считать открытой сессией.
 * Stale prop OPEN при закрытой смене не должен показывать «Закрыть».
 */
export function resolveShiftModalSession(freshShift) {
  const openNow = freshShift?.status === 'OPEN';
  return {
    sessionOpen: openNow,
    sessionShift: openNow ? freshShift : null,
  };
}

/** Close / X / Z — только по свежей открытой смене, не по prop из кэша. */
export function resolveActiveShiftForModalAction(sessionShift) {
  if (sessionShift?.status !== 'OPEN' || !sessionShift?.id) return null;
  return sessionShift;
}
