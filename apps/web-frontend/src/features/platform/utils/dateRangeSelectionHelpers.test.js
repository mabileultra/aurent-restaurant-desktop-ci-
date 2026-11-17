import { describe, expect, it } from 'vitest';
import {
  calculateEffectiveRange,
  calculateNextRangeStep,
} from './dateRangeSelectionHelpers';

describe('dateRangeSelectionHelpers', () => {
  describe('calculateEffectiveRange', () => {
    it('returns draftFrom and draftTo when not selecting end date', () => {
      const result = calculateEffectiveRange('2026-01-01', '2026-01-10', 'start', '');
      expect(result).toEqual({ effectiveFrom: '2026-01-01', effectiveTo: '2026-01-10' });
    });

    it('expands range to hover date forward', () => {
      const result = calculateEffectiveRange('2026-01-01', '', 'end', '2026-01-15');
      expect(result).toEqual({ effectiveFrom: '2026-01-01', effectiveTo: '2026-01-15' });
    });

    it('inverts range when hover date is before start date', () => {
      const result = calculateEffectiveRange('2026-01-10', '', 'end', '2026-01-02');
      expect(result).toEqual({ effectiveFrom: '2026-01-02', effectiveTo: '2026-01-10' });
    });
  });

  describe('calculateNextRangeStep', () => {
    it('starts new range selection on first click', () => {
      const result = calculateNextRangeStep('2026-01-01', '2026-01-05', 'start', '2026-02-01');
      expect(result).toEqual({
        draftFrom: '2026-02-01',
        draftTo: '',
        selectionStep: 'end',
      });
    });

    it('finishes range selection on second click', () => {
      const result = calculateNextRangeStep('2026-02-01', '', 'end', '2026-02-10');
      expect(result).toEqual({
        draftFrom: '2026-02-01',
        draftTo: '2026-02-10',
        selectionStep: 'start',
      });
    });

    it('swaps dates if second click is earlier than start', () => {
      const result = calculateNextRangeStep('2026-02-10', '', 'end', '2026-02-01');
      expect(result).toEqual({
        draftFrom: '2026-02-01',
        draftTo: '2026-02-10',
        selectionStep: 'start',
      });
    });
  });
});
