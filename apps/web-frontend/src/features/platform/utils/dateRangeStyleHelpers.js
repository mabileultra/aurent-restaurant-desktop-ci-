export function getRangeCellClass({
  dayIso,
  effectiveFrom,
  effectiveTo,
  todayIso,
  isCurrentMonth,
  isDayDisabled,
  isBlue,
}) {
  const isStart = dayIso === effectiveFrom;
  const isEnd = dayIso === effectiveTo;
  const isRangeSpan = effectiveFrom && effectiveTo && effectiveFrom !== effectiveTo;
  const isInRange = isRangeSpan && dayIso > effectiveFrom && dayIso < effectiveTo;
  const isSameDay = isStart && isEnd;
  const isSingleSelected = (isStart && !effectiveTo) || isSameDay;
  const isToday = dayIso === todayIso;

  let cellClass = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg';

  if (isSingleSelected) {
    cellClass = isBlue
      ? 'bg-blue-600 text-white font-semibold rounded-lg shadow-sm shadow-blue-700/20'
      : 'bg-emerald-600 text-white font-semibold rounded-lg shadow-sm shadow-emerald-700/20';
  } else if (isStart) {
    cellClass = isBlue
      ? 'bg-blue-600 text-white font-semibold rounded-l-lg rounded-r-none shadow-sm shadow-blue-700/20'
      : 'bg-emerald-600 text-white font-semibold rounded-l-lg rounded-r-none shadow-sm shadow-emerald-700/20';
  } else if (isEnd) {
    cellClass = isBlue
      ? 'bg-blue-600 text-white font-semibold rounded-r-lg rounded-l-none shadow-sm shadow-blue-700/20'
      : 'bg-emerald-600 text-white font-semibold rounded-r-lg rounded-l-none shadow-sm shadow-emerald-700/20';
  } else if (isInRange) {
    cellClass = isBlue
      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 rounded-none font-medium'
      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 rounded-none font-medium';
  } else if (isToday) {
    cellClass = isBlue
      ? 'ring-1 ring-blue-500/80 font-bold text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50/60 dark:hover:bg-blue-950/30'
      : 'ring-1 ring-emerald-500/80 font-bold text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30';
  } else if (!isCurrentMonth) {
    cellClass = 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg';
  }

  if (isDayDisabled) {
    cellClass = 'opacity-25 cursor-not-allowed text-slate-400 dark:text-slate-600';
  }

  return cellClass;
}
