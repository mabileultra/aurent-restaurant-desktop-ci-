import {
  calculateDaysInclusive,
  formatDisplayDate,
  getPickerText,
} from './platformDatePickerUtils';

export function formatRangeDisplayText({ from, to, placeholder, lang, t }) {
  if (from && to) return `${formatDisplayDate(from)} — ${formatDisplayDate(to)}`;
  if (from) return `${formatDisplayDate(from)} — …`;
  if (to) return `… — ${formatDisplayDate(to)}`;
  return placeholder || getPickerText('placeholderRange', lang, t);
}

export function formatRangeFooterText({ draftFrom, draftTo, lang, t }) {
  if (draftFrom && draftTo) {
    const daysCount = calculateDaysInclusive(draftFrom, draftTo);
    return `${formatDisplayDate(draftFrom)} — ${formatDisplayDate(draftTo)} (${getPickerText('daysCount', lang, t, { count: daysCount })})`;
  }
  if (draftFrom) {
    return `${formatDisplayDate(draftFrom)} — … (${getPickerText('selectEndDate', lang, t)})`;
  }
  return getPickerText('notSelected', lang, t);
}
