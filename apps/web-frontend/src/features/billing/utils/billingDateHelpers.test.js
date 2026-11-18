import { describe, expect, it } from 'vitest';
import { getTabTone, periodStart } from './billingDateHelpers';

describe('billingDateHelpers', () => {
  it('calculates periodStart exactly 30 days prior', () => {
    expect(periodStart(null)).toBeNull();
    expect(periodStart('')).toBeNull();
    const dateStr = '2026-06-01T00:00:00.000Z';
    const start = periodStart(dateStr);
    expect(start).toBeInstanceOf(Date);
    expect(start.toISOString().startsWith('2026-05-02')).toBe(true);
  });

  it('returns valid tone classes for tabs', () => {
    expect(getTabTone('TOP_UP')).toBe('billing-tab--blue');
    expect(getTabTone('MODULE')).toBe('billing-tab--violet');
    expect(getTabTone('CHARGE')).toBe('billing-tab--amber');
    expect(getTabTone('UNKNOWN')).toBe('');
  });
});
