export const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

export const RU_MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export const UZ_MONTHS_GENITIVE = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
];

export const RU_MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];

export function monthKey(date) {
  if (typeof date === 'string' && /^\d{4}-\d{2}/.test(date)) {
    return date.slice(0, 7);
  }
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const target = new Date(y, m - 1 + delta, 1);
  return monthKey(target);
}

export function shiftDay(iso, delta) {
  const [y, m, d] = iso.split('-').map(Number);
  const next = new Date(y, m - 1, d + delta);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

export function formatMonthTitle(key, lang) {
  const [y, m] = key.split('-').map(Number);
  const monthIdx = m - 1;
  const isUz = !lang || String(lang).startsWith('uz');
  const monthName = isUz ? UZ_MONTHS[monthIdx] : RU_MONTHS[monthIdx];
  return `${monthName} ${y}`;
}

export function formatDayTitle(iso, lang) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const monthIdx = m - 1;
  const isUz = !lang || String(lang).startsWith('uz');
  if (isUz) {
    return `${d}-${UZ_MONTHS_GENITIVE[monthIdx]}, ${y}`;
  }
  return `${d} ${RU_MONTHS_GENITIVE[monthIdx]} ${y}`;
}

/**
 * Builds Monday-aligned grid (7 columns) with full padding of previous and next month days.
 */
export function buildMonthGrid(key) {
  const [y, m] = key.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  // 0 = Monday, 6 = Sunday
  const lead = (first.getDay() + 6) % 7;
  const daysInCurrent = new Date(y, m, 0).getDate();
  const daysInPrev = new Date(y, m - 1, 0).getDate();

  const prevMonthKey = shiftMonth(key, -1);
  const nextMonthKey = shiftMonth(key, 1);

  const cells = [];

  // Previous month trailing days
  for (let i = lead - 1; i >= 0; i--) {
    const dayNum = daysInPrev - i;
    const iso = `${prevMonthKey}-${String(dayNum).padStart(2, '0')}`;
    cells.push({
      iso,
      dayNum,
      isOtherMonth: true,
      isPrevMonth: true,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrent; d++) {
    const iso = `${key}-${String(d).padStart(2, '0')}`;
    cells.push({
      iso,
      dayNum: d,
      isOtherMonth: false,
    });
  }

  // Next month leading days
  let nextDayNum = 1;
  while (cells.length % 7 !== 0 || cells.length < 35) {
    const iso = `${nextMonthKey}-${String(nextDayNum).padStart(2, '0')}`;
    cells.push({
      iso,
      dayNum: nextDayNum,
      isOtherMonth: true,
      isNextMonth: true,
    });
    nextDayNum++;
  }

  return cells;
}

/**
 * Determines dominant status tone and dot count for a calendar day
 */
export function getDayStatusInfo(items = [], companyMap = {}) {
  if (!items || !items.length) return null;

  let successCount = 0;
  let lowBalanceCount = 0;
  let deferralCount = 0;
  let plannedCount = 0;
  let suspendedCount = 0;

  let totalAmount = 0;

  for (const item of items) {
    const amt = Number(item.amount || 0);
    totalAmount += amt;

    const company = companyMap[item.companyId];
    const balance = company ? Number(company.billing?.balance ?? 0) : 0;
    const isOverdue = item.paymentState === 'OVERDUE' || balance < 0;
    const hasDeferral = Boolean(company?.billing?.deferralUntil);

    if (item.paymentState === 'SUSPENDED') {
      suspendedCount++;
    } else if (hasDeferral) {
      deferralCount++;
    } else if (isOverdue || (balance < amt && item.paymentState !== 'ACTIVE')) {
      lowBalanceCount++;
    } else if (item.paymentState === 'ACTIVE') {
      successCount++;
    } else {
      plannedCount++;
    }
  }

  // Primary tone hierarchy for visual dot: Red (alert) > Orange (deferral) > Green (success) > Blue (planned) > Gray
  let tone = 'info';
  if (lowBalanceCount > 0) tone = 'danger';
  else if (deferralCount > 0) tone = 'warning';
  else if (successCount > 0) tone = 'success';
  else if (plannedCount > 0) tone = 'info';
  else if (suspendedCount > 0) tone = 'neutral';

  return {
    count: items.length,
    amount: totalAmount,
    tone,
    successCount,
    lowBalanceCount,
    deferralCount,
    plannedCount,
    suspendedCount,
  };
}

/**
 * Computes 5 executive KPI statistics for the monthly calendar
 */
export function computeCalendarKpis(days = [], totalAmount = 0, totalCount = 0, companyMap = {}) {
  let successAmount = 0;
  let successCount = 0;

  let lowBalanceAmount = 0;
  let lowBalanceCount = 0;

  let deferralAmount = 0;
  let deferralCount = 0;

  let suspendedAmount = 0;
  let suspendedCount = 0;

  let plannedAmount = 0;
  let plannedCount = 0;

  for (const day of days) {
    for (const item of (day.items || [])) {
      const amt = Number(item.amount || 0);
      const company = companyMap[item.companyId];
      const balance = company ? Number(company.billing?.balance ?? 0) : 0;
      const isOverdue = item.paymentState === 'OVERDUE' || balance < 0;
      const hasDeferral = Boolean(company?.billing?.deferralUntil);

      if (item.paymentState === 'SUSPENDED') {
        suspendedAmount += amt;
        suspendedCount++;
      } else if (hasDeferral) {
        deferralAmount += amt;
        deferralCount++;
      } else if (isOverdue || (balance < amt && item.paymentState !== 'ACTIVE')) {
        lowBalanceAmount += amt;
        lowBalanceCount++;
      } else if (item.paymentState === 'ACTIVE') {
        successAmount += amt;
        successCount++;
      } else {
        plannedAmount += amt;
        plannedCount++;
      }
    }
  }

  const computedTotalAmount = successAmount + lowBalanceAmount + deferralAmount + suspendedAmount + plannedAmount;
  const computedTotalCount = successCount + lowBalanceCount + deferralCount + suspendedCount + plannedCount;

  return {
    monthTotal: {
      amount: totalAmount || computedTotalAmount,
      count: totalCount || computedTotalCount,
    },
    successful: {
      amount: successAmount,
      count: successCount,
    },
    lowBalance: {
      amount: lowBalanceAmount,
      count: lowBalanceCount,
    },
    deferral: {
      amount: deferralAmount,
      count: deferralCount,
    },
    suspended: {
      amount: suspendedAmount,
      count: suspendedCount,
    },
    planned: {
      amount: plannedAmount,
      count: plannedCount,
    },
  };
}
