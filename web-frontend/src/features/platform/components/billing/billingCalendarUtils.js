import {
  RU_MONTHS,
  RU_MONTHS_GENITIVE,
  RU_WEEKDAYS,
  UZ_MONTHS,
  UZ_MONTHS_GENITIVE,
  UZ_WEEKDAYS,
} from './billingCalendarConstants';
import {
  buildMonthGrid,
  formatDayTitle,
  formatMonthTitle,
  monthKey,
  shiftDay,
  shiftMonth,
} from './billingCalendarDateUtils';

export {
  UZ_MONTHS,
  RU_MONTHS,
  UZ_MONTHS_GENITIVE,
  RU_MONTHS_GENITIVE,
  UZ_WEEKDAYS,
  RU_WEEKDAYS,
  monthKey,
  shiftMonth,
  shiftDay,
  formatMonthTitle,
  formatDayTitle,
  buildMonthGrid,
};

/**
 * Standard classification for a billing calendar item.
 * For future dates: items have NOT been charged yet.
 * If balance < amount -> LOW_BALANCE (Balans yetmaydi); otherwise PLANNED (Rejalashtirilgan).
 * Never classifies future dates as SUCCESS (Yechildi).
 */
export function classifyCalendarItem(item, company, isFuture = false) {
  const amt = Number(item?.amount || 0);
  const balance = company ? Number(company.billing?.balance ?? 0) : 0;
  const hasDeferral = Boolean(company?.billing?.deferralUntil);
  const isOverdue = item?.paymentState === 'OVERDUE' || balance < 0;

  if (item?.paymentState === 'SUSPENDED') return 'SUSPENDED';
  if (hasDeferral) return 'DEFERRAL';

  if (isFuture) {
    return balance < amt ? 'LOW_BALANCE' : 'PLANNED';
  }

  if (isOverdue || (balance < amt && item?.paymentState !== 'ACTIVE')) {
    return 'LOW_BALANCE';
  }
  if (item?.paymentState === 'ACTIVE') {
    return 'SUCCESS';
  }
  return 'PLANNED';
}

/**
 * Determines dominant status tone and dot count for a calendar day
 */
export function getDayStatusInfo(items = [], companyMap = {}, dayIso = null, todayIso = null) {
  if (!items || !items.length) return null;

  const effectiveToday = todayIso || new Date().toLocaleDateString('sv-SE');
  const isFuture = Boolean(dayIso && effectiveToday && dayIso > effectiveToday);

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
    const category = classifyCalendarItem(item, company, isFuture);

    if (category === 'SUSPENDED') suspendedCount++;
    else if (category === 'DEFERRAL') deferralCount++;
    else if (category === 'LOW_BALANCE') lowBalanceCount++;
    else if (category === 'SUCCESS') successCount++;
    else plannedCount++;
  }

  // Primary tone hierarchy for visual dot: Red > Orange > Green > Blue > Gray
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
export function computeCalendarKpis(days = [], totalAmount = 0, totalCount = 0, companyMap = {}, todayIso = null) {
  const effectiveToday = todayIso || new Date().toLocaleDateString('sv-SE');

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
    const dayIso = day.date || day.iso;
    const isFuture = Boolean(dayIso && effectiveToday && dayIso > effectiveToday);
    for (const item of (day.items || [])) {
      const amt = Number(item.amount || 0);
      const company = companyMap[item.companyId];
      const category = classifyCalendarItem(item, company, isFuture);

      if (category === 'SUSPENDED') {
        suspendedAmount += amt;
        suspendedCount++;
      } else if (category === 'DEFERRAL') {
        deferralAmount += amt;
        deferralCount++;
      } else if (category === 'LOW_BALANCE') {
        lowBalanceAmount += amt;
        lowBalanceCount++;
      } else if (category === 'SUCCESS') {
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
