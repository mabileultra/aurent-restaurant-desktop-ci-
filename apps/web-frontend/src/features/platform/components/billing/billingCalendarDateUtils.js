import {
  RU_MONTHS,
  RU_MONTHS_GENITIVE,
  UZ_MONTHS,
  UZ_MONTHS_GENITIVE,
} from './billingCalendarConstants';

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
