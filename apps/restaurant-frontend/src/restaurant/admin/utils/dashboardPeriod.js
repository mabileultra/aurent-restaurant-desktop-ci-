export const DASHBOARD_PERIODS = [
  { key: 'TODAY', labelKey: 'rst.dashboard.periodToday' },
  { key: 'YESTERDAY', labelKey: 'rst.dashboard.periodYesterday' },
  { key: 'WEEK', labelKey: 'rst.dashboard.periodWeek' },
  { key: 'MONTH', labelKey: 'rst.dashboard.periodMonth' },
  { key: 'CUSTOM', labelKey: 'rst.dashboard.periodCustom' },
];

/** Build ISO from/to for CUSTOM period (local calendar days, end exclusive). */
export function customRangeIso(fromDate, toDate) {
  if (!fromDate || !toDate) return null;
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function dashboardQueryParams(period, customFrom, customTo) {
  if (period === 'CUSTOM') {
    const range = customRangeIso(customFrom, customTo);
    if (!range) return { period: 'TODAY' };
    return { period: 'CUSTOM', from: range.from, to: range.to };
  }
  return { period };
}
