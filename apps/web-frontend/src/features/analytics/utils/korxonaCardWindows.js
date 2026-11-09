/** days from company detail are newest-first. */

function dayTotal(day) {
  return Number(day?.totalTurnover || 0);
}

function sumDays(days = []) {
  return days.reduce((sum, day) => sum + dayTotal(day), 0);
}

function deltaPct(current, previous) {
  if (previous == null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Rolling 7d + today cards from newest-first day series.
 * Avoids last calendar-week stub (Mon–Mon) and oldest-day mistake for Kunlik.
 */
export function resolveRollingCardWindows(days = []) {
  const list = Array.isArray(days) ? days : [];
  const recent7 = list.slice(0, 7);
  const prev7 = list.slice(7, 14);
  const weekVal = sumDays(recent7);
  const prevWeekVal = sumDays(prev7);
  const newest = list[0] || null;
  const weekOldest = recent7.length > 0 ? recent7[recent7.length - 1] : null;

  return {
    weekVal,
    weekDelta: recent7.length ? deltaPct(weekVal, prevWeekVal) : null,
    weekFrom: weekOldest?.date || null,
    weekTo: newest?.date || null,
    dayVal: newest ? dayTotal(newest) : 0,
    dayDate: newest?.date || null,
  };
}
