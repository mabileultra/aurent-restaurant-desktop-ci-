/**
 * Латч статуса смены: пока идёт refetch — не меняем UI (иначе мигает Open/Close).
 * Обновлять только когда запрос завершён и данные уже fetched.
 */
export function resolveStableShiftIsOpen({
  previousIsOpen = false,
  shiftFetching = false,
  shiftFetched = false,
  shiftStatus = null,
} = {}) {
  if (shiftFetching) return Boolean(previousIsOpen);
  if (!shiftFetched) return Boolean(previousIsOpen);
  return shiftStatus === 'OPEN';
}

/** ID смены для «Мои продажи»: только реально открытая смена. */
export function resolveMySalesShiftId({ shiftIsOpen = false, shift = null } = {}) {
  if (!shiftIsOpen) return null;
  return shift?.id ?? null;
}
