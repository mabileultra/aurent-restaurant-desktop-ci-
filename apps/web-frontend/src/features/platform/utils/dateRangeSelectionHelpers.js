/**
 * Calculates effective range considering hover date during selection
 */
export function calculateEffectiveRange(draftFrom, draftTo, selectionStep, hoverDate) {
  if (selectionStep === 'end' && draftFrom && hoverDate) {
    if (hoverDate < draftFrom) {
      return { effectiveFrom: hoverDate, effectiveTo: draftFrom };
    }
    return { effectiveFrom: draftFrom, effectiveTo: hoverDate };
  }
  return { effectiveFrom: draftFrom, effectiveTo: draftTo };
}

/**
 * Calculates next state when a day is clicked in the range picker
 */
export function calculateNextRangeStep(draftFrom, draftTo, selectionStep, dayIso) {
  if (selectionStep === 'start' || (draftFrom && draftTo)) {
    return {
      draftFrom: dayIso,
      draftTo: '',
      selectionStep: 'end',
    };
  }
  if (dayIso < draftFrom) {
    return {
      draftFrom: dayIso,
      draftTo: draftFrom,
      selectionStep: 'start',
    };
  }
  return {
    draftFrom,
    draftTo: dayIso,
    selectionStep: 'start',
  };
}
