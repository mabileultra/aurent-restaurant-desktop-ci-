import { describe, expect, it } from 'vitest';
import { getRangeCellClass } from './dateRangeStyleHelpers';

describe('dateRangeStyleHelpers', () => {
  it('applies selected background for single selected day', () => {
    const cls = getRangeCellClass({
      dayIso: '2026-05-10',
      effectiveFrom: '2026-05-10',
      effectiveTo: '',
      todayIso: '2026-05-01',
      isCurrentMonth: true,
      isDayDisabled: false,
      isBlue: false,
    });
    expect(cls).toContain('bg-emerald-600');
    expect(cls).toContain('text-white');
  });

  it('applies in-range styling for dates between from and to', () => {
    const cls = getRangeCellClass({
      dayIso: '2026-05-15',
      effectiveFrom: '2026-05-10',
      effectiveTo: '2026-05-20',
      todayIso: '2026-05-01',
      isCurrentMonth: true,
      isDayDisabled: false,
      isBlue: true,
    });
    expect(cls).toContain('bg-blue-50');
    expect(cls).toContain('rounded-none');
  });

  it('marks disabled cell with opacity and cursor-not-allowed', () => {
    const cls = getRangeCellClass({
      dayIso: '2026-05-25',
      effectiveFrom: '',
      effectiveTo: '',
      todayIso: '2026-05-01',
      isCurrentMonth: true,
      isDayDisabled: true,
      isBlue: false,
    });
    expect(cls).toContain('opacity-25');
    expect(cls).toContain('cursor-not-allowed');
  });
});
